var test =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {


// Define an allocator and blit function for float arrays
// Can be used to achieve backwards compatibility down to dark ages pre IE 10 if needed
// Also reduces code size a little with closure.

var VH = { 
	float_array: function(len) { return new Float32Array(len); },
	blit: function(src, spos, dest, dpos, len) { dest.set(src.subarray(spos,spos+len),dpos); }
};

// Pre-IE10 versions:
/*VH.prototype.float_array = function(len) { return new Array(len); }
VH.prototype.blit = function(src, spos, dest, dpos, len) { for(var i=0;i<len;i++) dest[dpos+i] = src[spos+i]; };*/

module.exports = VH;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
 * Simple demo for phase_vocoder with chirp and vibrato signals
 *
 * Copyright (c) 2015-2019 Margus Niitsoo
 */

 var PhaseVocoder = __webpack_require__(2);
 var VH = __webpack_require__(0);

var SR = 22050;
var wsize_log = 11;
var tempo_ratio = 0.5;
var duration = 20;

var BUF_SIZE = 500;

// Simple wrapper around DataView for sequential writing
var BinaryDataWriter = function(size,little_end) {
	var pos = 0;
	var buffer = new ArrayBuffer(size);
	var dv = new DataView(buffer);

	var obj = {
		writeInt: function(val) {
			dv.setInt32(pos,val,little_end);
			pos += 4;
		},
		writeShort: function(val) {
			dv.setInt16(pos,val,little_end);
			pos += 2;
		},
		outputData: function() {
			return buffer;
		}
	};

	return obj;
}

// Originally borrowed from https://github.com/clehner/sound-recorder-uploader/blob/master/WAVWriter.hx and ported to JS
var WavWriter = function(vec,sampleRate) {
	var samples_bytecount = 2 * vec.length;
	var wav = BinaryDataWriter(samples_bytecount + 44,true);

	// Everything in little endian!

    wav.writeInt(0x46464952); // "RIFF"
    wav.writeInt(samples_bytecount + 36);
    
    wav.writeInt(0x45564157); // "WAVE"

    // Sub-Chunk 1

    wav.writeInt(0x20746D66); // "fmt "

    wav.writeInt(16); // Sub-Chunk 1 Size,  16 for PCM
    wav.writeShort(1); // AudioFormat      PCM = 1
    wav.writeShort(1); // NumChannels      Mono = 1, Stereo = 2, etc.
    wav.writeInt(sampleRate); //  SampleRate
    wav.writeInt(Math.round(sampleRate * 1 * 16/8)); // ByteRate = SampleRate * NumChannels * BitsPerSample/8
    wav.writeShort(Math.round(1 * 16/8)); // BlockAlign = NumChannels * BitsPerSample/8
    wav.writeShort(16); // Bits per sample

    wav.writeInt(0x61746164); // "data"

    // Finally write data
	wav.writeInt(samples_bytecount);
	for(var i=0;i<vec.length;i++)
		wav.writeShort(Math.round(vec[i] * 32767));

	return wav.outputData();
};


var read_ind = 0;


// Test signal: linear chirp
var chirpSignal = function(from,to,nsamples) {
	var f0 = from * 2 * Math.PI / SR;
	var f1 = to * 2 * Math.PI / SR;
	var k2 = (f1 - f0) / (2.0 * nsamples);
	return function(N) {
		if (N > nsamples-read_ind) N = Math.max(0,nsamples-read_ind);
		var vec = VH.float_array(N);
		for(var i=0;i<N;i++) {
			vec[i] = 0.3 * Math.sin((f0 + k2 * read_ind) * read_ind);
			read_ind += 1;
		}
		return vec;
	};
};

// Test signal: sine wave with vibrato
var vibratoSignal = function(base,amp,rate,nsamples) {
	var phase = 0.0;
	var f0 = base * 2 * Math.PI / SR;
	var famp = amp * 2 * Math.PI / SR;
	var fr = rate * 2 * Math.PI / SR;
	return function(N) {
		if (N > nsamples-read_ind) N = Math.max(0,nsamples-read_ind);
		var vec = VH.float_array(N);
		for(var i=0;i<N;i++) {
			vec[i] = 0.3 * Math.sin(phase);
			phase += f0 + famp * Math.sin(fr * read_ind);
			read_ind += 1;
		}
		return N;
	};
}

var nsamples = duration * SR;
var generator = chirpSignal(200.0,300.0,nsamples);
//var filler = vibratoSignal(440.0,20.0,6.0,nsamples);

var write_ind = 0;
var changer = PhaseVocoder({ sampleRate: SR, numChannels: 1, wsizeLog: wsize_log, tempo: tempo_ratio });
var outlen = nsamples / tempo_ratio;
var res = new Float32Array(outlen);
while(true) {
	var inp = generator(BUF_SIZE);
	if(inp.length==0) break;
	var outp = changer.process([inp])[0];
	VH.blit(outp,0,res,write_ind,outp.length);
	write_ind += outp.length;
}

console.log("Writing WAV",1.0 * read_ind / write_ind);
var wav_data = WavWriter(res,SR);

var blob = new Blob( [ wav_data ], { type: 'audio/wav' } );	
var objectURL = URL.createObjectURL( blob );
 
// Create an audio tag with the created file
var audiotag = document.createElement( 'audio' );
audiotag.setAttribute('controls',true);
document.body.appendChild( audiotag );
audiotag.src = objectURL;

// Download the wav file
/* var link = document.createElement( 'a' );
link.style.display = 'none';
document.body.appendChild( link );

link.href = objectURL;
link.download = 'audio.wav';
link.click();*/

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

(function() {

	/*
	 * Phase Vocoder for changing tempo of audio without affecting pitch
	 * Originally cross-compiled from HaXe
	 *
	 * Copyright (c) 2015-2019 Margus Niitsoo
	 */

	var VH = __webpack_require__(0);
	var FFT = __webpack_require__(3);

	var PhaseVocoder = function(opts) {

		/**************************
		* Fill in sensible defaults
		**************************/

		opts = opts || {};
		var sampleRate = opts.sampleRate || 44100;
		var wsizeLog = opts.wsizeLog || 12; // 4096
		var chosen_tempo = opts.tempo || 1.0;
		var numChannels = opts.numChannels || 2;

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

		// Keep track of time (in samples) in both input and output streams
		var in_time = 0.0, out_time = 0.0;

		// Track the changes for mapOutputToInputTime
		var changes = [{ in_time: 0.0, out_time: 0.0, tempo: chosen_tempo }];

		var f_ind = 0, prev_out_len = 0, gain_comp = 1.0;
		var syn_drift = 0.0, syn_drift_per_step = 0.0;

		var obj = { };

		// Should map time in output to time in input
		obj['mapOutputToInputTime'] = function(given_out_time) {
			var ci = changes.length-1;
			while(given_out_time<changes[ci].out_time && ci>0) ci--;
			var cc = changes[ci];
			return cc.in_time + cc.tempo*(given_out_time-cc.out_time);
		};

		obj['flush'] = function(discard_output_seconds) {
			f_ind = 0;	prev_out_len = 0;
			syn_drift = 0.0; b_npeaks = [0,0];

			for(var i=0;i<2;i++)
				for(var k=0;k<hWS;k++)
					b_mags[i][k] = 0.0;

			for(var i=0;i<in_buffer.length;i++) in_buffer[i] = 0.0;
			for(var i=0;i<out_buffer.length;i++) out_buffer[i] = 0.0;

			// Scroll time cursor back by discard_output_seconds
			if (discard_output_seconds) {

				// Scroll back time in both coordinates
				out_time = Math.max(0,out_time-discard_output_seconds);
				in_time = obj['mapOutputToInputTime'](out_time);

				// Clear the now-made-future tempo changes (if any)
				var ci = changes.length-1;
				while(out_time<=changes[ci].out_time && ci>=0) { changes.pop(); ci--; }

				// Add a tempo change reflecting current state
				changes.push({ 
					in_time: in_time, out_time: out_time,
					tempo: chosen_tempo
				})
			}
		};

		// Small utility function to calculate gain compensation
		var compute_gain_comp = function(win,syn_len) {
			var n = win.length / syn_len | 0, sum = 0.0;
			for(var i=0;i<n;i++) sum += win[i * syn_len];
			return GAIN_DEAMPLIFY / sum;
		};
		
		obj['getTempo'] = function() { return chosen_tempo; };
		obj['setTempo'] = function(tempo_ratio) {
			ana_len = syn_len = max_step_len;
			if(tempo_ratio >= 1.0) {
				syn_len = Math.round(ana_len / tempo_ratio);
			} else {
				ana_len = Math.round(syn_len * tempo_ratio);
			}
			syn_drift_per_step = (1.0 / tempo_ratio - 1.0 * syn_len / ana_len) * ana_len;
			gain_comp = compute_gain_comp(win,syn_len);
			chosen_tempo = tempo_ratio;
			//console.log("TEMPO CHANGE",tempo_ratio,"LENS",ana_len,syn_len,"GAIN",gain_comp);

			// Handle book-keeping for time map
			var lc = changes[changes.length-1];
			if (lc.out_time == out_time) // no samples since last change
				lc.tempo = tempo_ratio; // Just replace last change event
			else //add new entry
				changes.push({ 
					in_time: in_time, out_time: out_time,
					tempo: tempo_ratio
				})
		};

		obj['flush'](0); obj['setTempo'](chosen_tempo);


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
	    	// occasionally tweak syn_len by 1 or 2
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

		// Two variables used for "process"
		var inbuffer_contains = 0, unused_in_outbuf = 0;

		// input: array of channels, each a float_array with unbounded amount of samples
		// output: same format
		obj['process'] = function(in_ar) {

			// Mix channels together (if needed)
			var mix = in_ar[0], in_len = in_ar[0].length; 
			if (in_ar.length>1) {
				mix = VH.float_array(in_ar[0].length);
				var mult = 1.0/in_ar.length;
				for(var c=0;c<in_ar.length;c++)
					for(var i=0;i<in_len;i++)
						mix[i] += mult*in_ar[c][i];
			}

			// Calculate output length
			// Should underestimate, and by no more than 4, which can easily fit in the unused_in_outbuf
			var consumable_samples = inbuffer_contains + in_len - (windowSize - ana_len);
			var n_steps = 2*Math.floor(Math.max(0,consumable_samples)/(2*ana_len));
			var out_len = unused_in_outbuf + syn_len*n_steps +
							Math.floor(syn_drift+syn_drift_per_step*n_steps);

			if (unused_in_outbuf>out_len) out_len = unused_in_outbuf;

			// Allocate output
			var outp = VH.float_array(out_len);

			// Copy previously unused but ready values to output
			VH.blit(out_buffer,0,outp,0,unused_in_outbuf); 
			var ii = 0, oi = unused_in_outbuf;
			
			var left_over = 0, res_len = 0;
			while(true) {

				// Calculate how many new samples we need to call two_steps
				var n_needed = windowSize + ana_len - inbuffer_contains;
				
				if (ii+n_needed>in_len) { // Not enough samples for next step
					// Copy whats left to inbuffer and break out of the loop
					VH.blit(mix,ii,in_buffer,inbuffer_contains,in_len-ii);
					inbuffer_contains += in_len-ii; ii = in_len;
					break;
				}
				else if (n_needed <= 0) // Already enough - can happen if tempo changed
					inbuffer_contains -= 2 * ana_len; 
				else { // Main case - we have enough
					// Copy over this many samples from input
					VH.blit(mix,ii,in_buffer,inbuffer_contains,n_needed);
					ii += n_needed;					
					inbuffer_contains = windowSize - ana_len;
				}

				// Invariant: left_over should be 0 here as it should break!

				// Run the vocoder
				res_len = two_steps();

				// Move time pointers
				in_time += 2*ana_len/sampleRate; out_time += res_len/sampleRate;

				// Calculate how many samples are left over (usually 0)
				left_over = oi + res_len - out_len; if(left_over < 0) left_over = 0;

				// Copy fully ready samples out
		        VH.blit(out_buffer,0,outp,oi,res_len-left_over);

				oi += res_len;
			}

			// Copy left over samples to the beginning of out_buffer
  			VH.blit(out_buffer,res_len-left_over,out_buffer,0,left_over);
  			unused_in_outbuf = left_over;

  			//////////////////////// DONE

			// Clone the result to match the number of input channels
			var out_ar = [];
			for(var c=0;c<in_ar.length;c++) out_ar.push(outp);

			return out_ar;
		};

		return obj;
	};

	/** @export */
	module.exports = PhaseVocoder;
})();


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/*
 * Performs an in-place complex FFT.
 * Adapted from FFT for ActionScript 3 written by Gerald T. Beauregard 
 * (original ActionScript3 version, http://gerrybeauregard.wordpress.com/2010/08/03/an-even-faster-as3-fft/)
 *
 * Copyright (c) 2015-2019 Margus Niitsoo
 */

var VH = __webpack_require__(0);

var FFT = function(logN) {

	// Size of the buffer
	var m_N = 1 << logN;


	var obj = {
		m_logN : logN, m_N : m_N,
		m_invN : 1.0 / m_N,
		m_re : VH.float_array(m_N),
		m_im : VH.float_array(m_N),
		m_revTgt : new Array(m_N)
	}

	// Calculate bit reversals
	for(var k = 0; k<m_N; k++) {
		var x = k, y = 0;
		for(var i=0;i<logN;i++) {
			y <<= 1;
			y |= x & 1;
			x >>= 1;
		}
		obj.m_revTgt[k] = y;
	}

    // Compute a multiplier factor for the "twiddle factors".
    // The twiddle factors are complex unit vectors spaced at
    // regular angular intervals. The angle by which the twiddle
    // factor advances depends on the FFT stage. In many FFT
    // implementations the twiddle factors are cached.

	obj.twiddleRe = VH.float_array(obj.m_logN);
	obj.twiddleIm = VH.float_array(obj.m_logN);

	var wIndexStep = 1;
	for(var stage = 0; stage<obj.m_logN; stage++) {
		var wAngleInc = 2.0 * wIndexStep * Math.PI * obj.m_invN;
		obj.twiddleRe[stage] = Math.cos(wAngleInc);
		obj.twiddleIm[stage] = Math.sin(wAngleInc);
		wIndexStep <<= 1;
	}

	// In-place FFT function
	obj.inplace = function(inverse) {

		var m_re = obj.m_re, m_im = obj.m_im;
		var m_N = obj.m_N, m_logN = obj.m_logN;

		var numFlies = m_N >> 1;
		var span = m_N >> 1;
		var spacing = m_N;

		if(inverse) {
			var m_invN = 1.0/m_N;
			for(var i=0; i<m_N; i++) {
				m_re[i] *= m_invN;
				m_im[i] *= m_invN;
			}
		}

		// For each stage of the FFT
		for(var stage=0; stage<m_logN; stage++) {
			var wMulRe = obj.twiddleRe[stage];
			var wMulIm = obj.twiddleIm[stage];
			if(!inverse) wMulIm *= -1;

			var start = 0;
			while(start < m_N) {
				var iTop = start, iBot = start + span;
				var wRe = 1.0, wIm = 0.0;

				// For each butterfly in this stage
				for(var flyCount=0; flyCount<numFlies; flyCount++) {
					// Get the top & bottom values
					var xTopRe = m_re[iTop];
					var xTopIm = m_im[iTop];
					var xBotRe = m_re[iBot];
					var xBotIm = m_im[iBot];

					// Top branch of butterfly has addition
					m_re[iTop] = xTopRe + xBotRe;
					m_im[iTop] = xTopIm + xBotIm;

					// Bottom branch of butterly has subtraction,
                    // followed by multiplication by twiddle factor
					xBotRe = xTopRe - xBotRe;
					xBotIm = xTopIm - xBotIm;

					m_re[iBot] = xBotRe * wRe - xBotIm * wIm;
					m_im[iBot] = xBotRe * wIm + xBotIm * wRe;

					// Advance butterfly to next top & bottom positions
                    iTop++;
                    iBot++;

                    // Update the twiddle factor, via complex multiply
                    // by unit vector with the appropriate angle
                    // (wRe + j wIm) = (wRe + j wIm) x (wMulRe + j wMulIm)
					var tRe = wRe;
					wRe = wRe * wMulRe - wIm * wMulIm;
					wIm = tRe * wMulIm + wIm * wMulRe;
				}
				start += spacing;
			}
			numFlies >>= 1;
			span >>= 1;
			spacing >>= 1;
		}

		var revI, buf, m_revTgt = obj.m_revTgt;
		for(var i1=0; i1<m_N; i1++)
			if(m_revTgt[i1] > i1) {
                // Bit-Reversal is an involution i.e.
                // x.revTgt.revTgt==x
                // So switching values around
                // restores the original order
				revI = m_revTgt[i1];
				buf = m_re[revI];
				m_re[revI] = m_re[i1];
				m_re[i1] = buf;
				buf = m_im[revI];
				m_im[revI] = m_im[i1];
				m_im[i1] = buf;
			}
	}

	var m_N2 = m_N >> 1; // m_N/2 needed in un/repack below

	// Two-for-one trick for real-valued FFT:
	// Put one series in re, other in im, run "inplace",
	// then call this "unpack" function
	obj.unpack = function(rre,rim,ire,iim) {
		rre[0] = obj.m_re[0]; ire[0] = obj.m_im[0];
		rim[0] = iim[0] = 0;
		rre[m_N2] = obj.m_re[m_N2];
		ire[m_N2] = obj.m_im[m_N2];
		rim[m_N2] = iim[m_N2] = 0;
		for(var i = 1;i<m_N2;i++) {
			rre[i] = (obj.m_re[i] + obj.m_re[m_N - i]) / 2;
			rim[i] = (obj.m_im[i] - obj.m_im[m_N - i]) / 2;
			ire[i] = (obj.m_im[i] + obj.m_im[m_N - i]) / 2;
			iim[i] = (-obj.m_re[i] + obj.m_re[m_N - i]) / 2;
		}
	}
	
	// The two-for-one trick if you know results are real-valued
	// Call "repack", then fft.inplace(true) and you have
	// First fft in re and second in im
	obj.repack = function(rre,rim,ire,iim) {
		obj.m_re[0] = rre[0]; obj.m_im[0] = ire[0];
		obj.m_re[m_N2] = rre[m_N2]; obj.m_im[m_N2] = ire[m_N2];
		for(var i = 1;i<m_N2;i++) {
			obj.m_re[i] = rre[i] - iim[i];
			obj.m_im[i] = rim[i] + ire[i];
			obj.m_re[m_N - i] = rre[i] + iim[i];
			obj.m_im[m_N - i] = -rim[i] + ire[i];
		}
	}

	return obj;
};

module.exports = FFT;

/***/ })
/******/ ]);
//# sourceMappingURL=test.js.map