
const UPDATE_CHANNEL = 'u';
class NetworkManager {
  constructor(socket, engine) {
    this.socket = socket;
    engine.app.ticker.add(this.update);
    console.log("setup complete");

    this.user_updates = {
      altered: true,
      dvx: 0,
      dvy: 0,
    };
  }

  // makePacket takes the current user_updates object and turns it into
  // a network-friendly string. This could be made more efficient with
  // static-length packets, but that sounds like a lot of work.
  makePacket = () => `1;${this.user_updates.dvx};${this.user_updates.dvy};`;

  update = () => {
    console.log("tick");
    this.socket.emit(UPDATE_CHANNEL, this.makePacket());
  }
}

/*
// Takes a player update dictionary and
// turns it into a network-friendly string.
export function makeUpdatePacket(data) {
  // Expected data: { altered: bool, dvx: number, dvy: number };
  // Output is a string in the form:
  // A;B...;C...;
  // Where 'A;' is '1;' if the user is reporting a change, '0;' otherwise
  //       'B...;' is an arbitrary length number terminated by semi-colon.
  //       'C...;' is an arbitrary length number terminated by semi-colon.
  //
  // Example: 1;100;50; --> User is trying to move with velocity (100, 50).

  // This could be made much more efficient with static-length packets.
  let s = '';
  s += '1;';
  s += data.dvx.toString() + ';';
  s += data.dvy.toString() + ';';
  return s;
}
*/

export default NetworkManager;
