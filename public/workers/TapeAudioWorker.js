
importScripts("https://cdn.jsdelivr.net/npm/d3-array@3");
importScripts("/workers/smoothed_z_score.js");

function ParseInfo() {
    this.avg_gap_length = 0;
    this.min_zero = 0;
    this.max_zero = 0;
    this.min_one = 0;
    this.max_one = 0;
    this.min_gap = 0;
    this.max_gap = 0;
    this.pos = 0;
    this.cycle = null;
    this.error = false;
    this.stop = false;
    this.byte = 0;
    this.bytes = [];
}

function ParseException(message, info) {
    this.message = message;
    this.name = 'ParseException';
    info.error = true;
    this.info = info;
}
  
ParseException.prototype.toString = function() {
    return `${this.name}: "${this.message}"`;
}
  
function CleanPeaks(peaks) {
    peaks[0] = 0;
    peaks[1] = 0;
    peaks[peaks.length - 2] = 0;
    peaks[peaks.length - 1] = 0;
    for (var i = 2; i < peaks.length - 2; i++) {
        var s = peaks[i];
        var prev2 = peaks[i-2];
        var prev = peaks[i-1];
        var next = peaks[i+1];
        var next2 = peaks[i+2];
        if ((prev == next) && (s != prev)) {
            peaks[i] = prev;
        }
        else if ((s != 0) && (s != prev) && (s != next) && ((prev == 0) || (next == 0))) {
            peaks[i] = 0;
        }
        else if ((s == next) && (s != prev) && (s != next2)) {
            peaks[i] = 0;           
        }
    }
}

function AnalyzeCycles(peaks) {
    var last_sample = 0;
    var pos = 0;
    var last_cycle = 0;
    var cycles = [];
    while (pos < peaks.length) {
        var sample = peaks[pos];
        if ((sample > 0) && (last_sample < 0)) {
            //cycle_start
            var cycle_length = pos - last_cycle;
            last_cycle = pos;
            cycles.push({length: cycle_length, pos: pos});
        }
        if (sample !== 0) last_sample = sample;
        pos++;
    }
    return cycles;
}

function FindGap(cycles, info) {
    info = info || new ParseInfo();

    var cycle_count = 0;
    var cycle_max = 0;
    var cycle_min = Number.POSITIVE_INFINITY;
    var i = 0;
    var last_cycle = {length: 0, pos: 0};
    while (i < cycles.length) {
        var cycle = cycles[i];
        if (Math.abs(cycle.length - last_cycle.length) < 5) {
            cycle_count++;
            if (cycle.length > cycle_max) cycle_max = cycle.length;
            if (cycle.length < cycle_min) cycle_min = cycle.length;
        }
        else {
            cycle_count = 0;
            cycle_max = 0;
            cycle_min = Number.POSITIVE_INFINITY;
        }
        if (cycle_count > 100) {
            info.pos = i;
            var avg_gap_length = Math.floor(cycle_min + ((cycle_max - cycle_min)/ 2));
            info.avg_gap_length = avg_gap_length;
            info.min_zero = Math.floor(avg_gap_length * .2);  //.2
            info.max_zero = Math.floor(avg_gap_length * .45); //.45
            info.min_one = Math.floor(avg_gap_length * .48); //.75
            info.max_one = Math.floor(avg_gap_length * .74); //.75
            info.min_gap = Math.floor(avg_gap_length * .77); //.75
            info.max_gap = Math.floor(avg_gap_length * 1.2); //.75
            return info;
        }
        last_cycle = cycle;
        i++;
    }
    info.pos = i;
    return info;
}

function SkipGap(cycles, info) {
    info = info || new ParseInfo();
    var i = 0;
    while (i < cycles.length) {
        var cycle = cycles[i];
        if ((cycle.length >= info.min_zero) &&  (cycle.length < info.max_one)) {
            info.pos = i - 1;
            return info;
        }
        else if ((cycle.length < info.min_zero) ||  (cycle.length > info.max_gap)) {
            info.pos = i;
            info.cycle = cycle;
            throw new ParseException("Invalid cycle found while skipping gap", info);
        }
        i++;
    }
    return info;
}

function ReadByte(cycles, info) {
    info = info || new ParseInfo();

    if (info.pos >= (cycles.length - 8)) {
        throw new ParseException("End of file reached unexpectedly", info);
    }
    var b = 0;
    for (var i = 0; i < 8; i++) {
        var cycle = cycles[info.pos];
        if ((cycle.length >= info.min_zero) &&  (cycle.length < info.max_one)) {
            var bit = 1;
            if ((cycle.length >= info.min_zero) && (cycle.length < info.max_zero)) {
                bit = 0;
            }
            b = b | (bit << i);
        }
        else {
            info.cycle = cycle;
            throw new ParseException("Invalid cycle found while reading bit " + i + " of byte", info);
        }
        info.pos++;
   }
   info.byte = b;
   info.bytes.push(b);
   return b;
}

function ReadFirst(cycles, info) {
    info = info || new ParseInfo();
    var i = info.pos;
    var last_cycle = {length: 0, pos: 0};
    var cycle = cycles[i];
    RFIRST: while (i < cycles.length) {
        // Look for one good gap
        cycle = cycles[i];
        i++;
        if (cycle.length < info.min_gap) {
            // too small
            continue RFIRST;
        };
        RFRST1: while (i < cycles.length) {
            cycle = cycles[i];
            i++;
            if (cycle.length > info.max_gap) {
                // too long to be a gap
                continue RFIRST;
            }
            if (cycle.length > info.min_gap) {
                // it's a gap
                continue RFRST1;
            }
            break RFIRST;
        }
    }
    i--;
    //CHKSTP
    // see if a one
    if (cycle.length >= info.min_one) {
        // it is, get rest of byte
        info.pos = i;
        return ReadByte(cycles, info);
    }
    i++;
    cycle = cycles[i]; //next bit
    // see if longer than gap
    if (cycle.length > info.max_gap) {
        // too long to be anything valid
        info.pos = i;
        info.cycle = cycle;
        throw new ParseException("Cycle too long", info);
    }
    // in case not a gap, then not stop
    if (cycle.length < info.max_gap) {
        // not a gap, get rest of byte
        info.pos = i - 1;
        return ReadByte(cycles, info);
    }
    i++;
    cycle = cycles[i];
    // has to be a zero here, if not then error
    if (cycle.length >= info.min_one) {
        info.pos = i;
        info.cycle = cycle;
        throw new ParseException("Invalid bit found, expected 0", info);
}
    i++;
    cycle = cycles[i]; // better be a gap now
    if ((cycle.length < info.min_gap) || (cycle.length > info.max_gap)) {
        // too short or too long, error
        info.pos = i;
        info.cycle = cycle;
        throw new ParseException("Invalid cycle found, expected gap", info);
}
    // is a gap, so stop id found
    info.stop = true;
    return info;
}

function ReadRecord(cycles, info) {
    info = info || new ParseInfo();
    ReadFirst(cycles, info);
    if (info.stop) return info;
    var record_length = info.byte;
    if (record_length == 0) record_length = 256;
    for (var i = 0; i < record_length; i++) {
        ReadByte(cycles, info);
    }
    return info;
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

    CleanPeaks(data);

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

    var cycles = AnalyzeCycles(peaks);

    var info = FindGap(cycles);

    if (info.avg_gap_length == 0) {
        writelog('No header found, tape is not recongnizable');
        return;
    }

    writelog('Gap length found: ' + info.avg_gap_length);
    writelog('Zero length: ' + info.max_zero);
    writelog('One length: ' + info.max_one);
  
    try {
        while (!info.stop) {
            ReadRecord(cycles, info);
        }
    }
    catch (e) {
        if (e instanceof ParseException) {
            writelog('Error while parsing tape: ' + e);
        }
        else {
            throw e;
        }
    }

    writelog('Cycles found: ' + cycles.length);
    writelog('Bytes found: ' + info.bytes.length);
    //writelog('Errors found: ' + errors);
  
    var byte_array = Uint8Array.from(info.bytes);

    var histGenerator = d3.bin().domain([10,100]).thresholds([0, info.min_zero, info.max_zero, info.max_one, info.avg_gap_length * 1.1, info.avg_gap_length * 1.5]);  
    //var blocks = [];
    var bins = histGenerator(cycles);
    bins.sort(function (a, b) {
        return a.length - b.length;
      });
    console.log(bins);

    console.log('Posting message back to main script');
    postMessage(["tape-audio-worker:result", new_wav_buffer, byte_array.buffer]);
}