import { BlockOutlined } from "@material-ui/icons";
import FileSaver from "file-saver";

let audio_worker = new Worker('/workers/TapeAudioWorker.js');
let archive_worker = new Worker('/workers/TapeArchiveWorker.js');

function resetTape() {
}

var info = "";
function clearInfoLog() {
	info = "";
	document.getElementById("file_info_box").innerHTML = info;
}

function printLnInfoLog(str) {
	info += str + "<br/>\n";
	document.getElementById("file_info_box").innerHTML = info;
}

function printInfoLog(str) {
	info += str;
	document.getElementById("file_info_box").innerHTML = info;
}

function loadTape(arrayBuffer) {
	clearInfoLog();
	audio_worker.terminate();
	audio_worker = new Worker('/workers/TapeAudioWorker.js');

	var offlineAudioCtx = new OfflineAudioContext(1, 1, 44100);
	offlineAudioCtx.decodeAudioData(arrayBuffer, function handle( audioBuffer ) {
        var data = audioBuffer.getChannelData(0);

		audio_worker.onmessage = function(e) {
			console.log('Message received from audio worker');
			if ("tape-audio-worker:result" === e.data[0]) {
				var blob = new Blob([e.data[1]], { type: "audio/wav" });
				FileSaver.saveAs(blob, "export.wav");

				blob = new Blob([e.data[2]], { type: "application/octet-stream" });
				FileSaver.saveAs(blob, "export.k7");
			}
			else if ("tape-audio-worker:println" === e.data[0]) {
				printLnInfoLog(e.data[1]);
			}
			else if ("tape-audio-worker:print" === e.data[0]) {
				printInfoLog(e.data[1]);
			}
		}
		audio_worker.postMessage(["parse", data.buffer], [data.buffer]);
	});

}

function loadArchive(arrayBuffer) {
	clearInfoLog();
	archive_worker.terminate();
	archive_worker = new Worker('/workers/TapeArchiveWorker.js');
	archive_worker.onmessage = function(e) {
		console.log('Message received from archive worker');

		if ("tape-archive-worker:result" === e.data[0]) {
			console.log('Processing result');
			var blocks = e.data[2];
			var info = "";
			blocks.forEach((block, index, array) => {
				info += "Block " + (index + 1) + ": " + block.block_size + " bytes<br>\n";
			} );
			document.getElementById("file_info_box").innerHTML = info;
			var blob = new Blob([e.data[1]], { type: "audio/wav" });
			FileSaver.saveAs(blob, "export.wav");
		}
		else if ("tape-archive-worker:println" === e.data[0]) {
			printLnInfoLog(e.data[1]);
		}
		else if ("tape-archive-worker:print" === e.data[0]) {
			printInfoLog(e.data[1]);
		}
	}
	archive_worker.postMessage(["parse", arrayBuffer], [arrayBuffer]);
}

resetTape();

export {
	resetTape,
	loadArchive,
	loadTape
};
