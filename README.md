# phase-vocoder.js
A small, portable (\~5kb compiled with closure) JS implementation of a phase-vocoder for changing tempo of audio.

Mainly based on "Improved Phase Vocoder Time-Scale Modification of Audio" (1999) by Laroche et al, with some improvements based on "PhaVoRIT: A Phase Vocoder for Real-Time Interactive Time-Stretching" (2006) by Karrer et al. although some liberties were taken with the exact details of the implementation.

This code was originally written in HaXe and extracted from a commercial project to be released under MIT licence by the original author (Margus Niitsoo) with full explicit permission from his superiors.