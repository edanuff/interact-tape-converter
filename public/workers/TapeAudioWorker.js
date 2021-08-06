
importScripts("https://cdn.jsdelivr.net/npm/d3-array@3");
importScripts("/workers/smoothed_z_score.js");

function NormalizeData(data) {
    for (var i = 0; i < data.length; i++) {
        var sample = data[i];
        //if (Math.abs(sample) < 0.3) sample = 0.0;
        if (sample > 0) sample = 1.0;
        if (sample < 0) sample = -1.0; 
        data[i] = sample;
    }
}

function CleanData(data) {
    data[0] = 0;
    data[1] = 0;
    data[data.length - 2] = 0;
    data[data.length - 1] = 0;
    for (var i = 2; i < data.length - 2; i++) {
        var s = data[i];
        var prev2 = data[i-2];
        var prev = data[i-1];
        var next = data[i+1];
        var next2 = data[i+2];
        if ((prev == next) && (s != prev)) {
            data[i] = prev;
        }
        else if ((s != 0) && (s != prev) && (s != next) && ((prev == 0) || (next == 0))) {
            data[i] = 0;
        }
        else if ((s == next) && (s != prev) && (s != next2)) {
            data[i] = 0;           
        }
    }
}

function ValidCycle(data, pos) {
    for (var i = 0; i < 10; i++) {
        if (data[i] !== 1.0) return false;
    }
    return true;
}

function AnalyzeCycles(data, histogram) {
    var last_sample = 0;
    var pos = 0;
    var last_cycle = 0;
    var cycles = [];
    while (pos < data.length) {
        var sample = data[pos];
        if ((sample > 0) && (last_sample < 0)) {
            //cycle_start
            var cycle_length = pos - last_cycle;
            last_cycle = pos;
            cycles.push(cycle_length);
        }
        if (sample !== 0) last_sample = sample;
        pos++;
    }
    return cycles;
}

function FindSyncroLength(cycles) {
    var last_cycle = 0;
    var cycle_count = 0;
    var cycle_max = 0;
    var cycle_min = Number.POSITIVE_INFINITY;
    var i = 0;
    while (i < cycles.length) {
        var cycle = cycles[i];
        if (Math.abs(cycle - last_cycle) < 5) {
            cycle_count++;
            if (cycle > cycle_max) cycle_max = cycle;
            if (cycle < cycle_min) cycle_min = cycle;
        }
        else {
            cycle_count = 0;
            cycle_max = 0;
            cycle_min = Number.POSITIVE_INFINITY;
        }
        if (cycle_count > 100) return Math.floor(cycle_min + ((cycle_max - cycle_min)/ 2));
        last_cycle = cycle;
        i++;
    }
    return 0;
}

function NextCycle(data) {
    var cycle_count = 0;
    var last_sample = 0;
    var pos = 0;
    while (pos < data.length) {
        var sample = data[pos];
        if ((sample > 0) && (last_sample < 0)) {
            //cycle_start
            cycle_count++;
        }
        if (sample !== 0) last_sample = sample;
        pos++;
    }
    return cycle_count;
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function writelog(str) {
    postMessage(["tape-audio-worker:println", str]);
    console.log(str);
}

onmessage = function(e) {
    console.log('TapeAudioWorker: Message received from main script');

    var data = new Float32Array(e.data[1]);
    //var data = e.data[1];

    postMessage(["tape-audio-worker:print", "Finding peaks..."]);

    var peaks = smoothed_z_score(data, {lag: 10, threshold: .35, influence: 0.5, progress: function() {
        postMessage(["tape-audio-worker:print", "."]);
    }});

    //NormalizeData(data);
    data = peaks;
    writelog("done!");

    CleanData(data);
    
    var new_wav_buffer = new ArrayBuffer(44 + (data.length * 2));

    var view = new DataView(new_wav_buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + data.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 44100 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, data.length * 2, true);
    for (var i = 0; i < data.length; i++) {
        var s = Math.max(-1, Math.min(1, data[i]));
        var b = s < 0 ? s * 0x8000 : s * 0x7FFF;
        view.setInt16(44 + (i * 2), b, true);
    }

    var cycles = AnalyzeCycles(data);

    var gap_length = FindSyncroLength(cycles);
    writelog('Gap length found: ' + gap_length);

    if (gap_length == 0) {
        writelog('No header found, tape is not recongnizable');
        return;
    }

    var zero_length_min = Math.floor(gap_length * .2);  //.2
    var zero_length_max = Math.floor(gap_length * .45); //.45
    var one_length_max = Math.floor(gap_length * .75); //.75
    writelog('Zero length: ' + zero_length_max);
    writelog('One length: ' + one_length_max);
  
    var byte_bits = [];
    var bytes = [];
    var errors = 0;
    var cycle_pos = 0;
    var good_bytes = 0;
    cycles.forEach((cycle, index, array) => {
        if ((cycle >= zero_length_min) &&  (cycle < one_length_max)) {
            if ((cycle >= zero_length_min) && (cycle < zero_length_max)) {
                byte_bits.push(0);
            }
            else {
                byte_bits.push(1);
            }
            if (byte_bits.length == 8) {
                var b = 0;
                for (var i = 0; i < 8; i++) {
                    b = b | (byte_bits[i] << i);
                }
                bytes.push(b);
                if (bytes.length == 1386) debugger;
                byte_bits = [];
                good_bytes++;
            }
        }
        else {
            if (byte_bits.length > 0) {
                if (errors < 25) {
                    writelog('Error after ' + byte_bits.length + " bits! Cycle of length " + cycle + " found at position " + cycle_pos + " after " + good_bytes + " good bytes");
                }
                else if (errors == 25) {
                    writelog('Too many errors found, stopping error reporting, check source audio file');
                }
                errors++;
                good_bytes = 0;
            }
            byte_bits = [];
        }
        cycle_pos += cycle;
    } );
    writelog('Cycles found: ' + cycles.length);
    writelog('Bytes found: ' + bytes.length);
    writelog('Errors found: ' + errors);
  
    var byte_array = Uint8Array.from(bytes);

    var histGenerator = d3.bin().domain([10,100]).thresholds([0, zero_length_min, zero_length_max, one_length_max, gap_length * 1.1, gap_length * 1.5]);  
    //var blocks = [];
    var bins = histGenerator(cycles);
    bins.sort(function (a, b) {
        return a.length - b.length;
      });
    console.log(bins);

    console.log('Posting message back to main script');
    postMessage(["tape-audio-worker:result", new_wav_buffer, byte_array.buffer]);
}