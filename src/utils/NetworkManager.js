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

  // Set channel hooks.
  initialize = () => {
    // Server sends initial data to client
    this.socket.on('onconnected', ({ users: newUsers, id }) => {
      this.userId = id;
      this.engine.resetInstance();
      this.engine.loadTestInstance(newUsers);
    });

    // Add user to app
    this.socket.on('user_connect', (id, data) => {
      this.engine.addUser(id, data);
    });

    // Remove user from app
    this.socket.on('user_disconnect', id => {
      this.engine.removeUser(id);
    });

    this.socket.on('move_x', (id, velocity) => {
      this.engine.setUserVelocity_X(id, velocity);
    });

    this.socket.on('move_y', (id, velocity) => {
      this.engine.setUserVelocity_Y(id, velocity);
    });

    // TODO: move to input handler.
    // Send keyup and keydown events to server
    document.addEventListener('keydown', e => {
      let SPEED = 8; // TODO: move to engine.
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


  // ===== unimplemented =====

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

export default NetworkManager;
