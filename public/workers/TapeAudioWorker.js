
onmessage = function(e) {
    console.log('TapeAudioWorker: Message received from main script');

    var data = new Float32Array(e.data[1]);
    //var data = e.data[1];

    var last_sample = 0;
    var last_i = 0;
    var flux = 0;
    data.forEach(function(sample, i, array) {
        if (sample !== 0) {
            if (Math.sign(last_sample) !== Math.sign(sample)) {
                flux += 1;
            }
        }
        last_sample = sample;
        last_i = i;
    });
    console.log('Posting message back to main script');
    postMessage(["tape-audio-worker:result", flux]);
}