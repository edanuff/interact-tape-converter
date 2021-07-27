import FileSaver from "file-saver";

let audio_worker = new Worker('/workers/TapeAudioWorker.js');
let archive_worker = new Worker('/workers/TapeArchiveWorker.js');

function resetTape() {
}

function loadTape(arrayBuffer) {
	audio_worker.terminate();
	audio_worker = new Worker('/workers/TapeAudioWorker.js');

	var offlineAudioCtx = new OfflineAudioContext(1, 1, 44100);
	offlineAudioCtx.decodeAudioData(arrayBuffer, function handle( audioBuffer ) {
        var data = audioBuffer.getChannelData(0);

		audio_worker.onmessage = function(e) {
			console.log('Message received from audio worker');
			console.log('Flux count=' + e.data[1]);
		}
		audio_worker.postMessage(["parse", data.buffer], [data.buffer]);
	});

}

function loadArchive(arrayBuffer) {
	archive_worker.terminate();
	archive_worker = new Worker('/workers/TapeArchiveWorker.js');
	archive_worker.onmessage = function(e) {
		console.log('Message received from archive worker');

		var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

		var data = new Float32Array(e.data[1]);
		console.log('copying samples: ' + data.length);
		//var offlineAudioCtx = new OfflineAudioContext(1, 1, 44100);
		var buffer = audioCtx.createBuffer(1, data.length, 44100);
		var channel = buffer.getChannelData(0);
		for (var i = 0; i < data.length; i++) {
			channel[i] = data[i];
		}

		// Get an AudioBufferSourceNode.
		// This is the AudioNode to use when we want to play an AudioBuffer
		var source = audioCtx.createBufferSource();
		// set the buffer in the AudioBufferSourceNode
		source.buffer = buffer;
		// connect the AudioBufferSourceNode to the
		// destination so we can hear the sound
		source.connect(audioCtx.destination);
		// start the source playing
		source.start(0);
		//console.log('Flux count=' + e.data[1]);
	}
	archive_worker.postMessage(["parse", arrayBuffer], [arrayBuffer]);
}

resetTape();

export {
	resetTape,
	loadArchive,
	loadTape
};
