'use strict';

/*
 * Simple demo for phase_vocoder with chirp and vibrato signals
 *
 * Copyright (c) 2015-2019 Margus Niitsoo
 */

 var AudioTempoChanger = require('./audio_tempo_changer.js');
 var VH = require('./vector_helper.js');

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
var changer = AudioTempoChanger({ sampleRate: SR, numChannels: 1, wsizeLog: wsize_log, tempo: tempo_ratio });
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