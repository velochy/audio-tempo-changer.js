(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["PhaseVocoder"] = factory();
	else
		root["PhaseVocoder"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
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
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/phase_vocoder.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/fft.js":
/*!********************!*\
  !*** ./src/fft.js ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/*\n * Performs an in-place complex FFT.\n * Adapted from FFT for ActionScript 3 written by Gerald T. Beauregard \n * (original ActionScript3 version, http://gerrybeauregard.wordpress.com/2010/08/03/an-even-faster-as3-fft/)\n *\n * Copyright (c) 2015-2019 Margus Niitsoo\n */\n\nvar VH = __webpack_require__(/*! ./vector_helper.js */ \"./src/vector_helper.js\");\n\nvar FFT = function(logN) {\n\n\t// Size of the buffer\n\tvar m_N = 1 << logN;\n\n\n\tvar obj = {\n\t\tm_logN : logN, m_N : m_N,\n\t\tm_invN : 1.0 / m_N,\n\t\tm_re : VH.float_array(m_N),\n\t\tm_im : VH.float_array(m_N),\n\t\tm_revTgt : new Array(m_N)\n\t}\n\n\t// Calculate bit reversals\n\tfor(var k = 0; k<m_N; k++) {\n\t\tvar x = k, y = 0;\n\t\tfor(var i=0;i<logN;i++) {\n\t\t\ty <<= 1;\n\t\t\ty |= x & 1;\n\t\t\tx >>= 1;\n\t\t}\n\t\tobj.m_revTgt[k] = y;\n\t}\n\n    // Compute a multiplier factor for the \"twiddle factors\".\n    // The twiddle factors are complex unit vectors spaced at\n    // regular angular intervals. The angle by which the twiddle\n    // factor advances depends on the FFT stage. In many FFT\n    // implementations the twiddle factors are cached.\n\n\tobj.twiddleRe = VH.float_array(obj.m_logN);\n\tobj.twiddleIm = VH.float_array(obj.m_logN);\n\n\tvar wIndexStep = 1;\n\tfor(var stage = 0; stage<obj.m_logN; stage++) {\n\t\tvar wAngleInc = 2.0 * wIndexStep * Math.PI * obj.m_invN;\n\t\tobj.twiddleRe[stage] = Math.cos(wAngleInc);\n\t\tobj.twiddleIm[stage] = Math.sin(wAngleInc);\n\t\twIndexStep <<= 1;\n\t}\n\n\t// In-place FFT function\n\tobj.inplace = function(inverse) {\n\n\t\tvar m_re = obj.m_re, m_im = obj.m_im;\n\t\tvar m_N = obj.m_N, m_logN = obj.m_logN;\n\n\t\tvar numFlies = m_N >> 1;\n\t\tvar span = m_N >> 1;\n\t\tvar spacing = m_N;\n\n\t\tif(inverse) {\n\t\t\tvar m_invN = 1.0/m_N;\n\t\t\tfor(var i=0; i<m_N; i++) {\n\t\t\t\tm_re[i] *= m_invN;\n\t\t\t\tm_im[i] *= m_invN;\n\t\t\t}\n\t\t}\n\n\t\t// For each stage of the FFT\n\t\tfor(var stage=0; stage<m_logN; stage++) {\n\t\t\tvar wMulRe = obj.twiddleRe[stage];\n\t\t\tvar wMulIm = obj.twiddleIm[stage];\n\t\t\tif(!inverse) wMulIm *= -1;\n\n\t\t\tvar start = 0;\n\t\t\twhile(start < m_N) {\n\t\t\t\tvar iTop = start, iBot = start + span;\n\t\t\t\tvar wRe = 1.0, wIm = 0.0;\n\n\t\t\t\t// For each butterfly in this stage\n\t\t\t\tfor(var flyCount=0; flyCount<numFlies; flyCount++) {\n\t\t\t\t\t// Get the top & bottom values\n\t\t\t\t\tvar xTopRe = m_re[iTop];\n\t\t\t\t\tvar xTopIm = m_im[iTop];\n\t\t\t\t\tvar xBotRe = m_re[iBot];\n\t\t\t\t\tvar xBotIm = m_im[iBot];\n\n\t\t\t\t\t// Top branch of butterfly has addition\n\t\t\t\t\tm_re[iTop] = xTopRe + xBotRe;\n\t\t\t\t\tm_im[iTop] = xTopIm + xBotIm;\n\n\t\t\t\t\t// Bottom branch of butterly has subtraction,\n                    // followed by multiplication by twiddle factor\n\t\t\t\t\txBotRe = xTopRe - xBotRe;\n\t\t\t\t\txBotIm = xTopIm - xBotIm;\n\n\t\t\t\t\tm_re[iBot] = xBotRe * wRe - xBotIm * wIm;\n\t\t\t\t\tm_im[iBot] = xBotRe * wIm + xBotIm * wRe;\n\n\t\t\t\t\t// Advance butterfly to next top & bottom positions\n                    iTop++;\n                    iBot++;\n\n                    // Update the twiddle factor, via complex multiply\n                    // by unit vector with the appropriate angle\n                    // (wRe + j wIm) = (wRe + j wIm) x (wMulRe + j wMulIm)\n\t\t\t\t\tvar tRe = wRe;\n\t\t\t\t\twRe = wRe * wMulRe - wIm * wMulIm;\n\t\t\t\t\twIm = tRe * wMulIm + wIm * wMulRe;\n\t\t\t\t}\n\t\t\t\tstart += spacing;\n\t\t\t}\n\t\t\tnumFlies >>= 1;\n\t\t\tspan >>= 1;\n\t\t\tspacing >>= 1;\n\t\t}\n\n\t\tvar revI, buf, m_revTgt = obj.m_revTgt;\n\t\tfor(var i1=0; i1<m_N; i1++)\n\t\t\tif(m_revTgt[i1] > i1) {\n                // Bit-Reversal is an involution i.e.\n                // x.revTgt.revTgt==x\n                // So switching values around\n                // restores the original order\n\t\t\t\trevI = m_revTgt[i1];\n\t\t\t\tbuf = m_re[revI];\n\t\t\t\tm_re[revI] = m_re[i1];\n\t\t\t\tm_re[i1] = buf;\n\t\t\t\tbuf = m_im[revI];\n\t\t\t\tm_im[revI] = m_im[i1];\n\t\t\t\tm_im[i1] = buf;\n\t\t\t}\n\t}\n\n\tvar m_N2 = m_N >> 1; // m_N/2 needed in un/repack below\n\n\t// Two-for-one trick for real-valued FFT:\n\t// Put one series in re, other in im, run \"inplace\",\n\t// then call this \"unpack\" function\n\tobj.unpack = function(rre,rim,ire,iim) {\n\t\trre[0] = obj.m_re[0]; ire[0] = obj.m_im[0];\n\t\trim[0] = iim[0] = 0;\n\t\trre[m_N2] = obj.m_re[m_N2];\n\t\tire[m_N2] = obj.m_im[m_N2];\n\t\trim[m_N2] = iim[m_N2] = 0;\n\t\tfor(var i = 1;i<m_N2;i++) {\n\t\t\trre[i] = (obj.m_re[i] + obj.m_re[m_N - i]) / 2;\n\t\t\trim[i] = (obj.m_im[i] - obj.m_im[m_N - i]) / 2;\n\t\t\tire[i] = (obj.m_im[i] + obj.m_im[m_N - i]) / 2;\n\t\t\tiim[i] = (-obj.m_re[i] + obj.m_re[m_N - i]) / 2;\n\t\t}\n\t}\n\t\n\t// The two-for-one trick if you know results are real-valued\n\t// Call \"repack\", then fft.inplace(true) and you have\n\t// First fft in re and second in im\n\tobj.repack = function(rre,rim,ire,iim) {\n\t\tobj.m_re[0] = rre[0]; obj.m_im[0] = ire[0];\n\t\tobj.m_re[m_N2] = rre[m_N2]; obj.m_im[m_N2] = ire[m_N2];\n\t\tfor(var i = 1;i<m_N2;i++) {\n\t\t\tobj.m_re[i] = rre[i] - iim[i];\n\t\t\tobj.m_im[i] = rim[i] + ire[i];\n\t\t\tobj.m_re[m_N - i] = rre[i] + iim[i];\n\t\t\tobj.m_im[m_N - i] = -rim[i] + ire[i];\n\t\t}\n\t}\n\n\treturn obj;\n};\n\nmodule.exports = FFT;\n\n//# sourceURL=webpack://PhaseVocoder/./src/fft.js?");

/***/ }),

/***/ "./src/phase_vocoder.js":
/*!******************************!*\
  !*** ./src/phase_vocoder.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\n/*\n * Phase Vocoder for changing tempo of audio without affecting pitch\n * Originally cross-compiled from HaXe\n *\n * Copyright (c) 2015-2019 Margus Niitsoo\n */\n\nvar VH = __webpack_require__(/*! ./vector_helper.js */ \"./src/vector_helper.js\");\nvar FFT = __webpack_require__(/*! ./fft.js */ \"./src/fft.js\");\n\nvar PhaseVocoder = function(wsizeLog, tempo_ratio) {\n\n\t// Default input values\n\tif (!wsizeLog) wsizeLog = 12; // 4096 - sensible default\n\tif (!tempo_ratio) tempo_ratio = 1.0;\n\n\t/**************************\n\t* Initialize variables\n\t**************************/\n\n\t// Some constants\n\tvar GAIN_DEAMPLIFY = 0.9; // Slightly lower the volume to avoid volume overflow-compression\n\tvar MAX_PEAK_RATIO = 1e-8; // Do not find peaks below this level: 80dB from max\n\tvar MAX_PEAK_JUMP = (Math.pow(2.0,50/1200.0)-1.0); // Rel distance (in freq) to look for matches\n\tvar MATCH_MAG_THRESH = 0.1; // New if mag_prev < MATCH_MAG_THRESH * mag_new\n\t\n\tvar windowSize = 1 << wsizeLog;\n\tvar fft = FFT(wsizeLog);\n\n\t// Caluclate max step size for both ana and syn windows\n\t// Has to be < 1/4 of window length or audible artifacts occur\n\tvar max_step_len = 1 << (wsizeLog - 2); // 1/4 of window_size\n\tmax_step_len -= max_step_len % 100; // Change to a multiple of 100 as tempo is often changed in percents\n\n\t//console.log(\"MAX STEP\",max_step_len,windowSize);\n\tvar in_buffer = VH.float_array(windowSize + max_step_len + 5);\n\tvar out_buffer = VH.float_array(windowSize + max_step_len + 5);\n\tvar ana_len = max_step_len, syn_len = max_step_len;\n\n\t// Hanning window\n\tvar win = VH.float_array(windowSize);\n\tfor(var i=0;i<windowSize;i++)\n\t\twin[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / windowSize));\n\n\tvar hWS = (windowSize >> 1) + 1;\n\tvar re1 = VH.float_array(hWS), im1 = VH.float_array(hWS);\n\tvar re2 = VH.float_array(hWS), im2 = VH.float_array(hWS);\n\tvar pre2 = VH.float_array(hWS), pim2 = VH.float_array(hWS);\n\n\tvar qWS = (hWS >> 1) + 1;\n\tvar b_npeaks = [0,0], b_peaks = [], b_in_angs = [], b_peak_adeltas = [];\n\tvar b_mags = [];\n\tfor(var i=0;i<2;i++) { // Double buffering\n\t\tb_peaks.push(VH.float_array(qWS));\n\t\tb_in_angs.push(VH.float_array(qWS));\n\t\tb_peak_adeltas.push(VH.float_array(qWS));\n\t\tb_mags.push(VH.float_array(hWS));\n\t}\n\t\n\tvar peaks_re = VH.float_array(qWS), peaks_im = VH.float_array(qWS);\n\n\tvar f_ind = 0, prev_out_len = 0;\n\tvar syn_drift = 0.0, syn_drift_per_step = 0.0;\n\tvar gain_comp = 1.0;\n\n\t// Small utility function to calculate gain compensation\n\tvar compute_gain_comp = function(win,syn_len) {\n\t\tvar n = win.length / syn_len | 0, sum = 0.0;\n\t\tfor(var i=0;i<n;i++) sum += win[i * syn_len];\n\t\treturn GAIN_DEAMPLIFY / sum;\n\t};\n\n\tvar obj = {};\n\tobj['resetBuffers'] = function() {\n\t\tf_ind = 0;\tprev_out_len = 0;\n\t\tsyn_drift = 0.0; b_npeaks = [0,0];\n\n\t\tfor(var i=0;i<2;i++)\n\t\t\tfor(var k=0;k<hWS;k++)\n\t\t\t\tb_mags[i][k] = 0.0;\n\n\t\tfor(var i=0;i<in_buffer.length;i++) in_buffer[i] = 0.0;\n\t\tfor(var i=0;i<out_buffer.length;i++) out_buffer[i] = 0.0;\n\t};\n\n\tobj['changeTempo'] = function(tempo_ratio) {\n\t\tana_len = syn_len = max_step_len;\n\t\tif(tempo_ratio >= 1.0) {\n\t\t\tsyn_len = Math.round(ana_len / tempo_ratio);\n\t\t} else {\n\t\t\tana_len = Math.round(syn_len * tempo_ratio);\n\t\t}\n\t\tsyn_drift_per_step = (1.0 / tempo_ratio - 1.0 * syn_len / ana_len) * ana_len;\n\t\tgain_comp = compute_gain_comp(win,syn_len);\n\n\t\t//console.log(\"TEMPO CHANGE\",tempo_ratio,\"LENS\",ana_len,syn_len,\"GAIN\",gain_comp);\n\t};\n\n\tobj['resetBuffers'](); obj['changeTempo'](tempo_ratio);\n\n\t/**************************\n\t* Small utility functions\n\t**************************/\n\t\n\t// Estimate the phase at (fractional) fft bin ind\n\tvar interpolate_phase = function(re,im,ind) {\n\t\tvar i = Math.floor(ind);\n\t\tvar sgn = i % 2 == 1 ? -1.0 : 1.0;\n\t\treturn Math.atan2(sgn * (im[i] - im[i + 1]),sgn * (re[i] - re[i + 1]));\n\t};\n\n\t// Get ang between -PI and PI\n\tvar unwrap = function(ang) {\n\t\treturn ang - 2 * Math.PI * Math.round(ang / (2 * Math.PI) );\n\t};\n\n\t// Try to estimate the phase change if window lengths differ by ratio\n\tvar estimate_phase_change = function(ang,k,pang,pk,ratio) {\n\t\tvar pred = 2 * Math.PI / windowSize * 0.5 * (pk + k) * ana_len;\n\t\tvar ywang = unwrap(ang - pang - pred);\n\n\t\treturn (ywang + pred) * ratio;\n\t};\n\n\t/**************************\n\t* Find peaks of spectrum\n\t**************************/\n\n\tvar find_rpeaks = function(mags,res) {\n\n\t\tvar max = 0; for(var i=0;i<mags.length;i++) if (mags[i]>max) max=mags[i];\n\t\tvar thresh = MAX_PEAK_RATIO * max;\n\n\t\tvar n_peaks = 1, prev_pi = 1; res[0] = 1.0;\n\t\tfor(var i=2;i<mags.length;i++) {\n\t\t\tvar f_delta = i * MAX_PEAK_JUMP;\n\t\t\tif(mags[i]>thresh && mags[i] > mags[i - 1] && mags[i] >= mags[i + 1]) { // Is local peak\n\n\t\t\t\t// Use quadratic interpolation to fine-tune the peak location\n\t\t\t\tvar ppos = i + (mags[i - 1] - mags[i + 1]) / (2 * (mags[i - 1] - 2 * mags[i] + mags[i + 1]));\n\n\t\t\t\t// If far enough from previous peak, add to list\n\t\t\t\tif(ppos - res[n_peaks - 1] > f_delta) { res[n_peaks++] = ppos; prev_pi = i; }\n\t\t\t\t// Else, if not far enough, but higher than previous, just replace prev \n\t\t\t\telse if(mags[i] > mags[prev_pi]) { res[n_peaks - 1] = ppos;\tprev_pi = i; }\n\t\t\t}\n\t\t}\n\t\treturn n_peaks;\n\t};\n\n\t/**************************\n\t* Rigid phase shift\n\t**************************/\n\n\tvar pshift_rigid = function(frame_ind,re,im,p_re,p_im,ratio) {\n\t\tvar CUR = frame_ind % 2, PREV = 1 - CUR;\n\n\t\tvar prev_mags = b_mags[PREV];\n\n\t\tvar prev_np = b_npeaks[PREV], prpeaks = b_peaks[PREV];\n\t\tvar prev_in_angs = b_in_angs[PREV], prev_peak_adeltas = b_peak_adeltas[PREV];\n\n\t\t// Calc new mags\n\t\tvar mags = b_mags[CUR];\n\t\tfor(var i=1;i<mags.length;i++) mags[i] = re[i] * re[i] + im[i] * im[i];\n\t\n\t\t// Find new peaks\n\t\tvar peaks = b_peaks[CUR];\n\t\tvar cur_np = b_npeaks[CUR] = find_rpeaks(mags,peaks);\n\n\t\t// Start adjusting angles\n\t\tvar cur_in_angs = b_in_angs[CUR], cur_peak_adeltas = b_peak_adeltas[CUR];\n\n\t\tif(frame_ind == 0 || cur_np == 0) { // If first frame (or no peaks)\n\n\t\t\t// Set out_ang = in_ang for all peaks\n\t\t\tfor(var ci=0;ci<cur_np;ci++) {\n\t\t\t\tvar pci = peaks[ci];\n\t\t\t\tprev_in_angs[ci] = prev_peak_adeltas[ci] = interpolate_phase(re,im,pci);\n\t\t\t}\n\t\t\t\n\t\t\treturn;\n\t\t}\n\n\t    /*********************************************************\n    \t* Match old peaks with new ones\n    \t* Also find where pmag*mag is max for next step\n    \t*********************************************************/\n\n\t\tvar pi = 0;\n\t\tfor(var ci=0;ci<cur_np;ci++) {\n\t\t\tvar pci = peaks[ci];\n\n\t\t\t// Scroll so peaks[ci] is between prpeaks[pi] and prpeaks[pi+1]\n\t\t\twhile(peaks[ci] > prpeaks[pi] && pi != prev_np) ++pi;\n\n\t\t\tvar cpi = pi;\n\t\t\tif(pi > 0 && pci - prpeaks[pi - 1] < prpeaks[pi] - pci) cpi = pi - 1;\n\n\t\t\tvar peak_delta = pci * MAX_PEAK_JUMP;\n\t\t\tif(Math.abs(prpeaks[cpi] - pci) < peak_delta && \n\t\t\t\tprev_mags[Math.round(prpeaks[cpi])] > \n\t\t\t\t\tMATCH_MAG_THRESH * mags[Math.round(pci)]) {\n\n\t\t\t\t// Found a matching peak in previous frame, so predict based on the diff\n\t\t\t\tvar in_angle = interpolate_phase(re,im,pci);\n\t\t\t\tvar out_angle = prev_in_angs[cpi] + prev_peak_adeltas[cpi] +\n\t\t\t\t\t\testimate_phase_change(in_angle,pci,prev_in_angs[cpi],prpeaks[cpi],ratio);\n\n\t\t\t\tvar delta = out_angle - in_angle;\n\t\t\t\tcur_in_angs[ci] = in_angle; cur_peak_adeltas[ci] = delta;\n\t\t\t\tpeaks_re[ci] = Math.cos(delta);\tpeaks_im[ci] = Math.sin(delta);\n\t\t\t} else { // Not matched - use the same phase as input\n\t\t\t\tcur_in_angs[ci] = interpolate_phase(re,im,pci);\n\t\t\t\tcur_peak_adeltas[ci] = 0; peaks_re[ci] = 1.0;\tpeaks_im[ci] = 0.0;\t\t\t\t\n\t\t\t}\n\t\t}\n\n\t    /********************************************************\n\t    * Adjust phase of all bins based on closest peak\n\t    *********************************************************/\n\n\t    // Add a \"dummy\" peak at the end of array\n\t\tpeaks[cur_np] = 2 * windowSize;\n\t\t\n\t\tvar cpi = 0, cp = peaks[cpi], cnp = peaks[cpi + 1];\n\t\tvar cre = peaks_re[cpi], cim = peaks_im[cpi];\n\n\t\tfor(var i=1;i<re.length-1;i++) {\n\t\t\tif(i >= cp && i - cp > cnp - i) {\n\t\t\t\t++cpi; cp = peaks[cpi];\tcnp = peaks[cpi + 1];\n\t\t\t\tcre = peaks_re[cpi]; cim = peaks_im[cpi];\n\t\t\t}\n\n\t\t\tvar nre = re[i] * cre - im[i] * cim;\n\t\t\tvar nim = re[i] * cim + im[i] * cre;\n\t\t\tre[i] = nre; im[i] = nim;\n\t\t}\n\t}\n\n\t/***********************************\n\t* Perform two syn/ana steps \n\t*\t(using the two-for-one fft trick)\n  \t* Takes windowSize + ana_len samples from in_buffer\n  \t*   and shifts in_buffer back by 2*ana_len\n  \t* Outputs <retval> samples to out_buffer\n\t***********************************/\n\n\tvar two_steps = function() {\n\n\t\t// To better match the given ratio,\n    \t// occasionally tweak syn_len by 1\n\t\tsyn_drift += 2 * syn_drift_per_step;\n\t\tvar sdelta = syn_drift | 0;\n\t\tsyn_drift -= sdelta;\n\t\t\n\t\t// Pack two steps into fft object\n\t\tfor(var i=0;i<windowSize;i++) {\n\t\t\tfft.m_re[i] = win[i] * in_buffer[i];\n\t\t\tfft.m_im[i] = win[i] * in_buffer[ana_len + i];\n\t\t}\n\n\t\t// Shift in_buffer back by 2*ana_len\n\t\tVH.blit(in_buffer,2*ana_len,\n            in_buffer,0,windowSize-ana_len);\n\n\t\t// Run the fft\n\t\tfft.inplace(false);\n\t\tfft.unpack(re1,im1,re2,im2);\n\n\t\t// Step 1 - move by syn_len\n\t\tvar ratio1 = 1.0 * syn_len / ana_len;\n\t\tpshift_rigid(f_ind,re1,im1,pre2,pim2,ratio1);\n\n\t\t// Step 2 - move by syn_len+sdelta\n\t\tvar ratio2 = 1.0 * (syn_len + sdelta) / ana_len;\n\t\tpshift_rigid(f_ind + 1,re2,im2,re1,im1,ratio2);\n\n\t\t// Save (modified) re and im\n\t\tVH.blit(re2,0,pre2,0,hWS); VH.blit(im2,0,pim2,0,hWS);\n\n\t\t// Run ifft\n\t\tfft.repack(re1,im1,re2,im2);\n\t\tfft.inplace(true);\n\n\t\t// Shift out_buffer back by previous out_len;\n\t\tvar oblen = out_buffer.length;\n\t\tVH.blit(out_buffer,prev_out_len,\n            out_buffer,0,oblen-prev_out_len);\n\t\t\n\t\t// And shift in zeros at the end\n\t\tfor(var i=oblen-prev_out_len;i<oblen;i++) out_buffer[i] = 0.0;\n\t\t\n\t\t// Value overflow protection - scale the packet if max above a threshold\n\t    // The distortion this creates is insignificant compared to phase issues\n\t\tvar max = 0.0, gc = gain_comp;\n\t\tfor(var i=0;i<syn_len;i++)\n\t\t\tif(Math.abs(2 * fft.m_re[i]) > max)\n\t\t\t\tmax = Math.abs(2 * fft.m_re[i]);\n\t\tfor(var i=0;i<windowSize-syn_len;i++)\n\t\t\tif(Math.abs(fft.m_re[i + syn_len + sdelta] + fft.m_im[i]) > max)\n\t\t\t\tmax = Math.abs(fft.m_re[i + syn_len + sdelta] + fft.m_im[i]);\n\n\t\tfor(var i=windowSize-syn_len;i<windowSize;i++)\n\t\t\tif(Math.abs(2 * fft.m_im[i]) > max)\n\t\t\t\tmax = Math.abs(2 * fft.m_im[i]);\n\n\t\t// Find allowed ceiling of a two-step sum and lower gain if needed\n\t\tvar ceiling = 1.0 / Math.floor(1.0 * windowSize / (2 * syn_len));\n\t\tif(gc * max > ceiling) {\n\t\t\t//console.log(\"Gain overflow, lowering volume: \",ceiling / max,gc,max);\n\t\t\tgc = ceiling / max;\n\t\t}\n\n\t\t// Write results to out_buffer\n\t\tfor(var i=0;i<windowSize;i++) {\n\t\t\tout_buffer[i] += gc * fft.m_re[i];\n\t\t\tout_buffer[i + syn_len + sdelta] += gc * fft.m_im[i];\n\t\t}\n\n\t\tf_ind += 2;\tprev_out_len = 2 * syn_len + sdelta;\n\n\t\treturn prev_out_len;\n\t}\n\n\tobj['stretch_filter'] = function(single_step_per_call) {\n\t\tvar inbuffer_contains = 0, unused_in_outbuf = 0;\n\t\tvar outbuf = VH.float_array(2 * max_step_len + 5);\n\n\t\tvar tail_end_calls = Math.ceil((windowSize - ana_len) / (2 * ana_len));\n\n\t\treturn function(filler) {\n\t\t\treturn function(outp,opos,outn) {\n\n\t\t\t\t// It constantly slightly overfills, so samples keep building up\n      \t\t\t// This is used to occasionally release the steam\n\t\t\t\tif(unused_in_outbuf >= outn) {\n\t\t\t\t\tVH.blit(outbuf,0,outp,opos,outn);\n\t\t\t\t\tVH.blit(outbuf,outn,outbuf,0,unused_in_outbuf);\n\t\t\t\t\treturn outn;\n\t\t\t\t}\n\n\t\t\t\tVH.blit(outbuf,0,outp,opos,unused_in_outbuf); // Copy full values to output\n\t\t\t\tvar oi = unused_in_outbuf;\n\t\t\t\t\n\t\t\t\tvar left_over = 0, out_len = 0;\n\t\t\t\twhile(true) {\n\n\t\t\t\t\t// Fetch new input samples\n\t\t\t\t\tvar n_needed = windowSize + ana_len - inbuffer_contains;\n\t\t\t\t\tif(n_needed >= 0) {\n\t\t\t\t\t\tvar in_len = filler(in_buffer,inbuffer_contains,n_needed);\n\t\t\t\t\t\tif(in_len < n_needed) {\n\t\t\t\t\t\t\tif(tail_end_calls == 0) break;\n\t\t\t\t\t\t\telse {\n\t\t\t\t\t\t\t\tfor(var i=in_len-ana_len;i<ana_len;i++)\n\t\t\t\t\t\t\t\t\tin_buffer[windowSize + i] = 0.0;\n\t\t\t\t\t\t\t\ttail_end_calls -= 1;\n\t\t\t\t\t\t\t}\n\t\t\t\t\t\t}\n\t\t\t\t\t\tinbuffer_contains = windowSize - ana_len;\n\t\t\t\t\t} else inbuffer_contains -= 2 * ana_len;\n\n\t\t\t\t\t// Run the vocoder\n\t\t\t\t\tout_len = two_steps();\n\n\t\t\t\t\t// Calculate how many samples are left over (usually 0)\n\t\t\t\t\tleft_over = oi + out_len - outn; if(left_over < 0) left_over = 0;\n\n\t\t\t\t\t// Copy fully ready samples out\n\t\t\t        VH.blit(out_buffer,0,outp,opos+oi,out_len-left_over);\n\n\t\t\t\t\toi += out_len;\n\t\t\t\t\t\n\t\t\t\t\tif(left_over > 0 || single_step_per_call) break;\n\t\t\t\t}\n\n\t\t\t\t// Copy left over samples to outbuf\n      \t\t\tVH.blit(out_buffer,out_len-left_over,outbuf,0,left_over);\n      \t\t\tunused_in_outbuf = left_over;\n\n\t\t\t\treturn oi;\n\t\t\t};\n\t\t};\n\t}\n\n\treturn obj;\n};\n\n/** @export */\nmodule.exports = PhaseVocoder;\n\n//# sourceURL=webpack://PhaseVocoder/./src/phase_vocoder.js?");

/***/ }),

/***/ "./src/vector_helper.js":
/*!******************************!*\
  !*** ./src/vector_helper.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("\n// Define an allocator and blit function for float arrays\n// Can be used to achieve backwards compatibility down to dark ages pre IE 10 if needed\n// Also reduces code size a little with closure.\n\nvar VH = { \n\tfloat_array: function(len) { return new Float32Array(len); },\n\tblit: function(src, spos, dest, dpos, len) { dest.set(src.subarray(spos,spos+len),dpos); }\n};\n\n// Pre-IE10 versions:\n/*VH.prototype.float_array = function(len) { return new Array(len); }\nVH.prototype.blit = function(src, spos, dest, dpos, len) { for(var i=0;i<len;i++) dest[dpos+i] = src[spos+i]; };*/\n\nmodule.exports = VH;\n\n//# sourceURL=webpack://PhaseVocoder/./src/vector_helper.js?");

/***/ })

/******/ });
});