'use strict';

/*
 * Phase Vocoder for changing tempo of audio without affecting pitch
 * Originally cross-compiled from HaXe
 *
 * Copyright (c) 2015-2019 Margus Niitsoo
 */

var VH = require('./vector_helper.js');
var FFT = require('./fft.js');

var PhaseVocoder = function(wsizeLog, tempo_ratio) {

	// Default input values
	if (!wsizeLog) wsizeLog = 12; // 4096 - sensible default
	if (!tempo_ratio) tempo_ratio = 1.0;

	/**************************
	* Initialize variables
	**************************/

	// Some constants
	var GAIN_DEAMPLIFY = 0.9; // Slightly lower the volume to avoid volume overflow-compression
	var MAX_PEAK_RATIO = 1e-8; // Do not find peaks below this level: 80dB from max
	var MAX_PEAK_JUMP = (Math.pow(2.0,50/1200.0)-1.0); // Rel distance (in freq) to look for matches
	var MATCH_MAG_THRESH = 0.1; // New if mag_prev < MATCH_MAG_THRESH * mag_new
	
	var windowSize = 1 << wsizeLog;
	var fft = FFT(wsizeLog);

	// Caluclate max step size for both ana and syn windows
	// Has to be < 1/4 of window length or audible artifacts occur
	var max_step_len = 1 << (wsizeLog - 2); // 1/4 of window_size
	max_step_len -= max_step_len % 100; // Change to a multiple of 100 as tempo is often changed in percents

	//console.log("MAX STEP",max_step_len,windowSize);
	var in_buffer = VH.float_array(windowSize + max_step_len + 5);
	var out_buffer = VH.float_array(windowSize + max_step_len + 5);
	var ana_len = max_step_len, syn_len = max_step_len;

	// Hanning window
	var win = VH.float_array(windowSize);
	for(var i=0;i<windowSize;i++)
		win[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / windowSize));

	var hWS = (windowSize >> 1) + 1;
	var re1 = VH.float_array(hWS), im1 = VH.float_array(hWS);
	var re2 = VH.float_array(hWS), im2 = VH.float_array(hWS);
	var pre2 = VH.float_array(hWS), pim2 = VH.float_array(hWS);

	var qWS = (hWS >> 1) + 1;
	var b_npeaks = [0,0], b_peaks = [], b_in_angs = [], b_peak_adeltas = [];
	var b_mags = [];
	for(var i=0;i<2;i++) { // Double buffering
		b_peaks.push(VH.float_array(qWS));
		b_in_angs.push(VH.float_array(qWS));
		b_peak_adeltas.push(VH.float_array(qWS));
		b_mags.push(VH.float_array(hWS));
	}
	
	var peaks_re = VH.float_array(qWS), peaks_im = VH.float_array(qWS);

	var f_ind = 0, prev_out_len = 0;
	var syn_drift = 0.0, syn_drift_per_step = 0.0;
	var gain_comp = 1.0;

	// Small utility function to calculate gain compensation
	var compute_gain_comp = function(win,syn_len) {
		var n = win.length / syn_len | 0, sum = 0.0;
		for(var i=0;i<n;i++) sum += win[i * syn_len];
		return GAIN_DEAMPLIFY / sum;
	};

	var obj = {};
	obj['resetBuffers'] = function() {
		f_ind = 0;	prev_out_len = 0;
		syn_drift = 0.0; b_npeaks = [0,0];

		for(var i=0;i<2;i++)
			for(var k=0;k<hWS;k++)
				b_mags[i][k] = 0.0;

		for(var i=0;i<in_buffer.length;i++) in_buffer[i] = 0.0;
		for(var i=0;i<out_buffer.length;i++) out_buffer[i] = 0.0;
	};

	obj['changeTempo'] = function(tempo_ratio) {
		ana_len = syn_len = max_step_len;
		if(tempo_ratio >= 1.0) {
			syn_len = Math.round(ana_len / tempo_ratio);
		} else {
			ana_len = Math.round(syn_len * tempo_ratio);
		}
		syn_drift_per_step = (1.0 / tempo_ratio - 1.0 * syn_len / ana_len) * ana_len;
		gain_comp = compute_gain_comp(win,syn_len);

		//console.log("TEMPO CHANGE",tempo_ratio,"LENS",ana_len,syn_len,"GAIN",gain_comp);
	};

	obj['resetBuffers'](); obj['changeTempo'](tempo_ratio);

	/**************************
	* Small utility functions
	**************************/
	
	// Estimate the phase at (fractional) fft bin ind
	var interpolate_phase = function(re,im,ind) {
		var i = Math.floor(ind);
		var sgn = i % 2 == 1 ? -1.0 : 1.0;
		return Math.atan2(sgn * (im[i] - im[i + 1]),sgn * (re[i] - re[i + 1]));
	};

	// Get ang between -PI and PI
	var unwrap = function(ang) {
		return ang - 2 * Math.PI * Math.round(ang / (2 * Math.PI) );
	};

	// Try to estimate the phase change if window lengths differ by ratio
	var estimate_phase_change = function(ang,k,pang,pk,ratio) {
		var pred = 2 * Math.PI / windowSize * 0.5 * (pk + k) * ana_len;
		var ywang = unwrap(ang - pang - pred);

		return (ywang + pred) * ratio;
	};

	/**************************
	* Find peaks of spectrum
	**************************/

	var find_rpeaks = function(mags,res) {

		var max = 0; for(var i=0;i<mags.length;i++) if (mags[i]>max) max=mags[i];
		var thresh = MAX_PEAK_RATIO * max;

		var n_peaks = 1, prev_pi = 1; res[0] = 1.0;
		for(var i=2;i<mags.length;i++) {
			var f_delta = i * MAX_PEAK_JUMP;
			if(mags[i]>thresh && mags[i] > mags[i - 1] && mags[i] >= mags[i + 1]) { // Is local peak

				// Use quadratic interpolation to fine-tune the peak location
				var ppos = i + (mags[i - 1] - mags[i + 1]) / (2 * (mags[i - 1] - 2 * mags[i] + mags[i + 1]));

				// If far enough from previous peak, add to list
				if(ppos - res[n_peaks - 1] > f_delta) { res[n_peaks++] = ppos; prev_pi = i; }
				// Else, if not far enough, but higher than previous, just replace prev 
				else if(mags[i] > mags[prev_pi]) { res[n_peaks - 1] = ppos;	prev_pi = i; }
			}
		}
		return n_peaks;
	};

	/**************************
	* Rigid phase shift
	**************************/

	var pshift_rigid = function(frame_ind,re,im,p_re,p_im,ratio) {
		var CUR = frame_ind % 2, PREV = 1 - CUR;

		var prev_mags = b_mags[PREV];

		var prev_np = b_npeaks[PREV], prpeaks = b_peaks[PREV];
		var prev_in_angs = b_in_angs[PREV], prev_peak_adeltas = b_peak_adeltas[PREV];

		// Calc new mags
		var mags = b_mags[CUR];
		for(var i=1;i<mags.length;i++) mags[i] = re[i] * re[i] + im[i] * im[i];
	
		// Find new peaks
		var peaks = b_peaks[CUR];
		var cur_np = b_npeaks[CUR] = find_rpeaks(mags,peaks);

		// Start adjusting angles
		var cur_in_angs = b_in_angs[CUR], cur_peak_adeltas = b_peak_adeltas[CUR];

		if(frame_ind == 0 || cur_np == 0) { // If first frame (or no peaks)

			// Set out_ang = in_ang for all peaks
			for(var ci=0;ci<cur_np;ci++) {
				var pci = peaks[ci];
				prev_in_angs[ci] = prev_peak_adeltas[ci] = interpolate_phase(re,im,pci);
			}
			
			return;
		}

	    /*********************************************************
    	* Match old peaks with new ones
    	* Also find where pmag*mag is max for next step
    	*********************************************************/

		var pi = 0;
		for(var ci=0;ci<cur_np;ci++) {
			var pci = peaks[ci];

			// Scroll so peaks[ci] is between prpeaks[pi] and prpeaks[pi+1]
			while(peaks[ci] > prpeaks[pi] && pi != prev_np) ++pi;

			var cpi = pi;
			if(pi > 0 && pci - prpeaks[pi - 1] < prpeaks[pi] - pci) cpi = pi - 1;

			var peak_delta = pci * MAX_PEAK_JUMP;
			if(Math.abs(prpeaks[cpi] - pci) < peak_delta && 
				prev_mags[Math.round(prpeaks[cpi])] > 
					MATCH_MAG_THRESH * mags[Math.round(pci)]) {

				// Found a matching peak in previous frame, so predict based on the diff
				var in_angle = interpolate_phase(re,im,pci);
				var out_angle = prev_in_angs[cpi] + prev_peak_adeltas[cpi] +
						estimate_phase_change(in_angle,pci,prev_in_angs[cpi],prpeaks[cpi],ratio);

				var delta = out_angle - in_angle;
				cur_in_angs[ci] = in_angle; cur_peak_adeltas[ci] = delta;
				peaks_re[ci] = Math.cos(delta);	peaks_im[ci] = Math.sin(delta);
			} else { // Not matched - use the same phase as input
				cur_in_angs[ci] = interpolate_phase(re,im,pci);
				cur_peak_adeltas[ci] = 0; peaks_re[ci] = 1.0;	peaks_im[ci] = 0.0;				
			}
		}

	    /********************************************************
	    * Adjust phase of all bins based on closest peak
	    *********************************************************/

	    // Add a "dummy" peak at the end of array
		peaks[cur_np] = 2 * windowSize;
		
		var cpi = 0, cp = peaks[cpi], cnp = peaks[cpi + 1];
		var cre = peaks_re[cpi], cim = peaks_im[cpi];

		for(var i=1;i<re.length-1;i++) {
			if(i >= cp && i - cp > cnp - i) {
				++cpi; cp = peaks[cpi];	cnp = peaks[cpi + 1];
				cre = peaks_re[cpi]; cim = peaks_im[cpi];
			}

			var nre = re[i] * cre - im[i] * cim;
			var nim = re[i] * cim + im[i] * cre;
			re[i] = nre; im[i] = nim;
		}
	}

	/***********************************
	* Perform two syn/ana steps 
	*	(using the two-for-one fft trick)
  	* Takes windowSize + ana_len samples from in_buffer
  	*   and shifts in_buffer back by 2*ana_len
  	* Outputs <retval> samples to out_buffer
	***********************************/

	var two_steps = function() {

		// To better match the given ratio,
    	// occasionally tweak syn_len by 1
		syn_drift += 2 * syn_drift_per_step;
		var sdelta = syn_drift | 0;
		syn_drift -= sdelta;
		
		// Pack two steps into fft object
		for(var i=0;i<windowSize;i++) {
			fft.m_re[i] = win[i] * in_buffer[i];
			fft.m_im[i] = win[i] * in_buffer[ana_len + i];
		}

		// Shift in_buffer back by 2*ana_len
		VH.blit(in_buffer,2*ana_len,
            in_buffer,0,windowSize-ana_len);

		// Run the fft
		fft.inplace(false);
		fft.unpack(re1,im1,re2,im2);

		// Step 1 - move by syn_len
		var ratio1 = 1.0 * syn_len / ana_len;
		pshift_rigid(f_ind,re1,im1,pre2,pim2,ratio1);

		// Step 2 - move by syn_len+sdelta
		var ratio2 = 1.0 * (syn_len + sdelta) / ana_len;
		pshift_rigid(f_ind + 1,re2,im2,re1,im1,ratio2);

		// Save (modified) re and im
		VH.blit(re2,0,pre2,0,hWS); VH.blit(im2,0,pim2,0,hWS);

		// Run ifft
		fft.repack(re1,im1,re2,im2);
		fft.inplace(true);

		// Shift out_buffer back by previous out_len;
		var oblen = out_buffer.length;
		VH.blit(out_buffer,prev_out_len,
            out_buffer,0,oblen-prev_out_len);
		
		// And shift in zeros at the end
		for(var i=oblen-prev_out_len;i<oblen;i++) out_buffer[i] = 0.0;
		
		// Value overflow protection - scale the packet if max above a threshold
	    // The distortion this creates is insignificant compared to phase issues
		var max = 0.0, gc = gain_comp;
		for(var i=0;i<syn_len;i++)
			if(Math.abs(2 * fft.m_re[i]) > max)
				max = Math.abs(2 * fft.m_re[i]);
		for(var i=0;i<windowSize-syn_len;i++)
			if(Math.abs(fft.m_re[i + syn_len + sdelta] + fft.m_im[i]) > max)
				max = Math.abs(fft.m_re[i + syn_len + sdelta] + fft.m_im[i]);

		for(var i=windowSize-syn_len;i<windowSize;i++)
			if(Math.abs(2 * fft.m_im[i]) > max)
				max = Math.abs(2 * fft.m_im[i]);

		// Find allowed ceiling of a two-step sum and lower gain if needed
		var ceiling = 1.0 / Math.floor(1.0 * windowSize / (2 * syn_len));
		if(gc * max > ceiling) {
			//console.log("Gain overflow, lowering volume: ",ceiling / max,gc,max);
			gc = ceiling / max;
		}

		// Write results to out_buffer
		for(var i=0;i<windowSize;i++) {
			out_buffer[i] += gc * fft.m_re[i];
			out_buffer[i + syn_len + sdelta] += gc * fft.m_im[i];
		}

		f_ind += 2;	prev_out_len = 2 * syn_len + sdelta;

		return prev_out_len;
	}

	obj['stretch_filter'] = function(single_step_per_call) {
		var inbuffer_contains = 0, unused_in_outbuf = 0;
		var outbuf = VH.float_array(2 * max_step_len + 5);

		var tail_end_calls = Math.ceil((windowSize - ana_len) / (2 * ana_len));

		return function(filler) {
			return function(outp,opos,outn) {

				// It constantly slightly overfills, so samples keep building up
      			// This is used to occasionally release the steam
				if(unused_in_outbuf >= outn) {
					VH.blit(outbuf,0,outp,opos,outn);
					VH.blit(outbuf,outn,outbuf,0,unused_in_outbuf);
					return outn;
				}

				VH.blit(outbuf,0,outp,opos,unused_in_outbuf); // Copy full values to output
				var oi = unused_in_outbuf;
				
				var left_over = 0, out_len = 0;
				while(true) {

					// Fetch new input samples
					var n_needed = windowSize + ana_len - inbuffer_contains;
					if(n_needed >= 0) {
						var in_len = filler(in_buffer,inbuffer_contains,n_needed);
						if(in_len < n_needed) {
							if(tail_end_calls == 0) break;
							else {
								for(var i=in_len-ana_len;i<ana_len;i++)
									in_buffer[windowSize + i] = 0.0;
								tail_end_calls -= 1;
							}
						}
						inbuffer_contains = windowSize - ana_len;
					} else inbuffer_contains -= 2 * ana_len;

					// Run the vocoder
					out_len = two_steps();

					// Calculate how many samples are left over (usually 0)
					left_over = oi + out_len - outn; if(left_over < 0) left_over = 0;

					// Copy fully ready samples out
			        VH.blit(out_buffer,0,outp,opos+oi,out_len-left_over);

					oi += out_len;
					
					if(left_over > 0 || single_step_per_call) break;
				}

				// Copy left over samples to outbuf
      			VH.blit(out_buffer,out_len-left_over,outbuf,0,left_over);
      			unused_in_outbuf = left_over;

				return oi;
			};
		};
	}

	return obj;
};

/** @export */
module.exports = PhaseVocoder;