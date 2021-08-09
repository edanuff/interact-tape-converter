// Based on MAME/MESS hect_tap.cpp by JJ Stacino
// See https://github.com/mamedev/mame/blob/master/src/lib/formats/hect_tap.cpp
//
// Uses the terms flux, gap, zero, and one from the Interact documentation

const SMPLO = -32768;
const SMPHI = 32767;
const Gap_cycles = 77;
const Zero_cycles = 27;
const One_cycles = 50;

function tape_cycle(buffer, sample_pos, high, low)
{
	var i = 0;

	if ( buffer )
	{
		while( i < high)
		{
			buffer.setInt16((sample_pos + i) * 2, SMPHI, true);
			i++;
		}

		while( i < high + low )
		{
			buffer.setInt16((sample_pos + i) * 2, SMPLO, true);
			i++;
		}
	}
	return high + low;
}

function tape_byte(buffer, sample_pos, data)
{
	var i = 0;
	var samples = 0;
	for ( i = 0; i < 8; i++ )
	{
		if ( data & 0x01 )
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(One_cycles/2), parseInt(One_cycles/2) );
		else
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(Zero_cycles/2), parseInt(Zero_cycles/2) );

		data >>= 1;
	}
	return samples;
}
function tape_gap(buffer, sample_pos, nb_gap)
{
	var i = 0;
    var samples = 0;

	samples = 0;
	for ( i = 0; i < nb_gap ; i++ )
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(Gap_cycles/2), parseInt(Gap_cycles/2) );

	return samples;
}

function handle_tap(buffer, casdata, blocks)
{
	var data_pos = 0;
    var sample_count = 0;
	var previous_block=0;

	/* First 768 cycle of gap */
	sample_count += tape_gap( buffer, sample_count, 768-4 );

	/* on the entire file*/
	while( data_pos < casdata.byteLength )
	{
		var  block_size = 0;
		var block = {};

		if (previous_block === 0xFE)
				/* Starting a block with 150 cycles of gap to let fill command complete ! */
				sample_count += tape_gap( buffer, sample_count, 150 );
		else
				/* Starting a block with 4 cycles of gap */
				sample_count += tape_gap( buffer, sample_count, 4 );

		if (data_pos>1)
				previous_block = casdata[data_pos-1];

		/* Handle block length on tape data */
		block_size = casdata[data_pos] ;
		if (block_size === 0)
			block_size=256;
		block.block_size = block_size;
		block.data_pos = data_pos;

		/*block_count++;*/
		sample_count += tape_byte(buffer, sample_count, casdata[data_pos] );
		data_pos++;

		/* Data samples */
		for ( ; block_size ; data_pos++, block_size-- )
		{
			/* Make sure there are enough bytes left */
			if ( data_pos > casdata.byteLength )
				return -1;

			sample_count += tape_byte( buffer, sample_count, casdata[data_pos] );

		}

		if (blocks) blocks.push(block);
	}
	/*Finish by a zero*/
	sample_count += tape_byte( buffer, sample_count, 0 );

	return sample_count;
}

function writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}


onmessage = function(e) {
    console.log('TapeAudioWorker: Message received from main script');

    var casdata = new Uint8Array(e.data[1]);

    var length = handle_tap(null, casdata);
    console.log('Cassette length=' + length);

    var buffer = new ArrayBuffer(44 + length * 2);

    var view = new DataView(buffer);
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + length * 2, true);
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
    view.setUint32(40, length * 2, true);

	var blocks = [];
    handle_tap(new DataView(buffer, 44), casdata, blocks);

    console.log('Posting message back to main script');
    postMessage(["tape-archive-worker:result", buffer, blocks]);
}