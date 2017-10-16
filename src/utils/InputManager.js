

class InputManager {
  constructor(engine) {
    this.engine = engine;

    this.keyConfig = {
      MOVE_LEFT: 'a',
      MOVE_RIGHT: 'd',
      MOVE_UP: 'w',
      MOVE_DOWN: 's',
    };
  }

  // This is for temporary testing purposes. In the future, InputManager should
  // interface with Engine, which will forward messages to NetworkManager.
  // This class will not have access to sockets.
  initialize = (nwmg) => {

    document.addEventListener('keydown', e => {
      let SPEED = 8; // TODO: move to engine.

      switch (e.key) {
        case this.keyConfig.MOVE_LEFT: nwmg.socket.emit('move_x', nwmg.userId, -SPEED); break; // left
        case this.keyConfig.MOVE_UP: nwmg.socket.emit('move_y', nwmg.userId, -SPEED); break; // up
        case this.keyConfig.MOVE_RIGHT: nwmg.socket.emit('move_x', nwmg.userId, SPEED); break; // right
        case this.keyConfig.MOVE_DOWN: nwmg.socket.emit('move_y', nwmg.userId, SPEED); break; // down
        default:
      }
    }, false);

    document.addEventListener('keyup', e => {
      switch (e.key) {
        case this.keyConfig.MOVE_LEFT: nwmg.socket.emit('move_x', nwmg.userId, 0); break; // left
        case this.keyConfig.MOVE_UP: nwmg.socket.emit('move_y', nwmg.userId, 0); break; // up
        case this.keyConfig.MOVE_RIGHT: nwmg.socket.emit('move_x', nwmg.userId, 0); break; // right
        case this.keyConfig.MOVE_DOWN: nwmg.socket.emit('move_y', nwmg.userId, 0); break; // down
        default:
      }
    }, false);
  }

}

export default InputManager;
