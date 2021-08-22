# Interact Tape Converter

Try online [here](https://interact-tape-converter.netlify.app/).  Hosted by Netlify.

React-based utility for reading and writing [Interact](https://www.old-computers.com/museum/computer.asp?c=1004&st=1) or
[Victor](https://www.old-computers.com/museum/computer.asp?c=151)/[Hector](https://www.old-computers.com/museum/computer.asp?c=427)
cassettes in digitized audio files or archived tape formats so that you can either use these tapes with emulators or with real Interact or Hector machines.

Tapes can be loaded from any audio format but 44khz mono is recommended when digitizing real tapes.

Tape archive files are supported in the .K7 and .CIN formats that are used by many Interact and Hector emulators
such as MAME/MESS Interact, [DCHector](http://dchector.free.fr/index.html), and [Virtual Interact](http://www.geocities.ws/emucompboy/) emulators.

.K7/.CIN to .WAV adapted from MAME/MESS [hect_tap.cpp](https://github.com/mamedev/mame/blob/master/src/lib/formats/hect_tap.cpp), written by J.J. Stacino.

# How It Works

The Interact and it’s descendents (Victor Lambda, Hector) recorded tapes by “bit-banging” square waves of various durations to the cassette tape. 
The analog process of recording these to tape turns them into rounded sine waves. The Interact records three types of values to tape - zeroes, ones, and gaps. 
Each of these values is simply a different duration for the waveform cycle. Tapes are read back by measuring the distance between peaks in the waveform. 
Many computers in the late 70’s used similar mechanisms for storing data on tape. When looking at a wave file, you should see rounded versions of the 
following waveforms, representing the appropriate bit types being stored. If a tape does not convert without error, you should first resample the 
tape at a higher output volume (don't be afraid of clipping when digitizing computer cassettes) and you may need to hand edit waveforms using the 
pencil tool in Audacity or a similar audio editor to fix waveforms that appear too distorted or have noise in them.

<p align="center"><img src="https://user-images.githubusercontent.com/105246/130365204-2e06a02b-133a-42a5-96ff-a2a092bf09cc.png"/></p>

# Behind The Scenes

All of the hard work is done within two web worker scripts that do the audio processing in background threads.
These are in the [public/workers](https://github.com/edanuff/interact-tape-converter/tree/master/public/workers) directory.
[Z-Score Peak Detection](https://stackoverflow.com/questions/22583391/peak-signal-detection-in-realtime-timeseries-data/) is used 
to deal with the fact that many digitized old cassette tapes can have a sometimes wildly drifting DC-offset.
