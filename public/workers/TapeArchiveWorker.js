// Based on MAME/MESS hect_tap.cpp by JJ Stacino
// See https://github.com/mamedev/mame/blob/master/src/lib/formats/hect_tap.cpp
//

const SMPLO = -1.0;
const SMPHI = 1.0;
const Header_cycles = 77;
const Zero_cycles = 27;
const Un_cycles = 50;

function tape_cycle(buffer, sample_pos, high, low)
{
	var i = 0;

	if ( buffer )
	{
		while( i < high)
		{
			buffer[ sample_pos + i ] = SMPHI;
			i++;
		}

		while( i < high + low )
		{
			buffer[ sample_pos + i ] = SMPLO;
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
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(Un_cycles/2), parseInt(Un_cycles/2) );
		else
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(Zero_cycles/2), parseInt(Zero_cycles/2) );

		data >>= 1;
	}
	return samples;
}
function tape_synchro(buffer, sample_pos, nb_synchro)
{
	var i = 0;
    var samples = 0;

	samples = 0;
	for ( i = 0; i < nb_synchro ; i++ )
			samples += tape_cycle( buffer, sample_pos + samples, parseInt(Header_cycles/2), parseInt(Header_cycles/2) );

	return samples;
}

function handle_tap(buffer, casdata)
{
	var data_pos = 0;
    var sample_count = 0;
	var previous_block=0;

	/* First 768 cycle of synchro */
	sample_count += tape_synchro( buffer, sample_count, 768-4 );

	/* on the entire file*/
	while( data_pos < casdata.byteLength )
	{
		var  block_size = 0;

		if (previous_block === 0xFE)
				/* Starting a block with 150 cycle of synchro to let time to Hector to do the job ! */
				sample_count += tape_synchro( buffer, sample_count, 150 );
		else
					/* Starting a block with 4 cycle of synchro */
				sample_count += tape_synchro( buffer, sample_count, 4 );

		if (data_pos>1)
				previous_block = casdata[data_pos-1];

		/* Handle block lenght on tape data */
		block_size = casdata[data_pos] ;
		if (block_size === 0)
			block_size=256;

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
	}
	/*Finish by a zero*/
	sample_count += tape_byte( buffer, sample_count, 0 );

	return sample_count;
}

onmessage = function(e) {
    console.log('TapeAudioWorker: Message received from main script');

    var casdata = new Uint8Array(e.data[1]);

    var length = handle_tap(null, casdata);
    console.log('Cassette length=' + length);

    var buffer = new Float32Array(length);
    handle_tap(buffer, casdata);

    console.log('Posting message back to main script');
    postMessage(["tape-archive-worker:result", buffer.buffer]);
}