import io from 'socket.io-client';

const UPDATE_CHANNEL = 'u';

class NetworkManager {
  constructor(engine) {
    this.socket = io();
    this.engine = engine; // Might change to game instance later.

    this.userId = null;

    this.user_updates = {
      altered: false, // Do we have changes to propagate?
      x: 0, // Absolute X position.
      y: 0, // Absolute Y position.
    };

    this.engine.app.ticker.add(this.update);
  }

  initialize = () => {

    // Server sends initial data to client
    this.socket.on('onconnected', ({ users: newUsers, id }) => {

      this.userId = id;

      // Reset users
      // users = {};
      // Remove all objects from scene
      // this.app.removeObject();
      this.engine.resetInstance();

      // Load game objects
      /*
      for (let obj of testData.objects) {
        obj.stroke = 0xDD0000;
        this.engine.addObject(createRect(obj));
      }

      // Load players
      for (let newUserId in newUsers) {
        if (newUsers.hasOwnProperty(newUserId)) {
          addUser(newUserId, newUsers[newUserId]);
        }
      }
      */

      this.engine.loadTestInstance(newUsers);
    });

    // Add user to app
    this.socket.on('user_connect', (id, data) => {
      this.engine.addUser(id, data);
    });

    // Remove user from app
    this.socket.on('user_disconnect', id => {
      this.engine.removeUser(id);
      // this.engine.removeObject(users[id]);

      // delete users[id];
    });

    this.socket.on('move_x', (id, velocity) => {
      this.engine.users[id].vx = velocity;
      // users[id].vx = velocity;
    });

    this.socket.on('move_y', (id, velocity) => {
      this.engine.users[id].vy = velocity;
      // users[id].vy = velocity;
    });

    // Send keyup and keydown events to server
    document.addEventListener('keydown', e => {
      let SPEED = 8; // CHANGEME
      switch (e.key) {
        case 'a': this.socket.emit('move_x', this.userId, -SPEED); break; // left
        case 'w': this.socket.emit('move_y', this.userId, -SPEED); break; // up
        case 'd': this.socket.emit('move_x', this.userId, SPEED); break; // right
        case 's': this.socket.emit('move_y', this.userId, SPEED); break; // down
        default:
      }
    }, false);

    document.addEventListener('keyup', e => {
      switch (e.key) {
        case 'a': this.socket.emit('move_x', this.userId, 0); break; // left
        case 'w': this.socket.emit('move_y', this.userId, 0); break; // up
        case 'd': this.socket.emit('move_x', this.userId, 0); break; // right
        case 's': this.socket.emit('move_y', this.userId, 0); break; // down
        default:
      }
    }, false);
  }

  /*
  joinRoom = roomId => {

  }
  */

  // bool to stringified int.
  alteredString = () => this.altered ? '1' : '0';

  // Takes the current user_updates object and turns it into
  // a network-friendly string. This could be made more efficient with
  // static-length packets, but that sounds like a lot of work.
  makeUpdateMsg = () => `${this.alteredString()};${this.user_updates.x};${this.user_updates.y};`;

  update = () => {
    this.socket.emit(UPDATE_CHANNEL, this.userId, this.makeUpdateMsg());
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
