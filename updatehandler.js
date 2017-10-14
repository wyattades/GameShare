const SIZE_MIN_PACKET = 6; // 3 semi-colons, at least 3 numbers.
const MALFORMED_PACKET_ERR = new Error('Malformed packet.');
const UPDATE_CHANNEL = 'u';


function parsePacket(data) {
  console.log('UPDATE CHANNEL: ');
  console.log(`USER ${data.id}`);
  console.log(data);
}

function handleSocket(socket) {
  socket.on(UPDATE_CHANNEL, parsePacket);
}

exports.handleSocket = handleSocket;

/*
class UpdateHandler {
  constructor(io) {
    this.io = io;
    this.io.on(UPDATE_CHANNEL, this.parsePacket);
  }

  parsePacket(data) {
    console.log('UPDATE CHANNEL: ');
    console.log(data);
  }
}
*/

/*
function parseUpdatePacket(data) {
  // Expected packet format:
  // A;B...;C...;
  // Where 'A;' is '1;' if the user is reporting a change, '0;' otherwise
  //       'B...;' is an arbitrary length number terminated by semi-colon.
  //       'C...;' is an arbitrary length number terminated by semi-colon.
  //
  // Example: 1;100;50; --> User is trying to move with velocity (100, 50).

  if (data.length < SIZE_MIN_PACKET) { throw MALFORMED_PACKET_ERR; }

  let user_changes = data[0];

  let vx_delim = data.indexOf(';');
  if (vx_delim === -1) { throw MALFORMED_PACKET_ERR; }

  let vy_delim = data.indexOf(';', vx_delim);
  if (vy_delim === -1) { throw MALFORMED_PACKET_ERR; }


  let desired_v = {
    x: data.substring(2, vx_delim),
    y: data.substring(vx_delim, data.length),
  };
  /*
  let desired_vx = data.substring(1, data.indexOf(';', 0));
  data = data.substring(data.indexOf(';'), data.length);
  let desired_vy = data.substring(0, data.indexOf(';', ));
  */
  /*
  let phase = 0;
  let obj = {};
  for (let i = 0, l = data.length; i < l; i++) {
      switch(phase) {
        case 0:
          obj.changes: data[i]
      }
    }
  }
  */


/*
  return {
    user_changes,
    desired_v,
  };
}
*/
