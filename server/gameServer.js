const socketIO = require('socket.io');
const UUID = require('node-uuid');

let io,
    connections,
    games;

const MAX_CONNECTIONS = 10;

const createGameLoop = (fn, fps) => {
  
  let delta,
      lastUpdate = Date.now(),
      now;

  const intervalId = setInterval(() => {
    now = Date.now();
    delta = now - lastUpdate;
    lastUpdate = now;

    fn(delta / 16.66); // 16.66 is the deltaTime of client i.e. 60fps
  }, 1000 / fps);

  return {
    stop: () => {
      clearInterval(intervalId);
    },
  };
};

class Game {

  constructor(id) {
    this.id = id;
    this.users = {};
    this.connections = 0;

    this.io = io.of(`/${id}`);
  }

  log(...args) {
    console.log(`${this.id} [${this.connections}]: ${args[0]}`, ...args.splice(1));
  }

  start() {
    this.io.on('connection', this.onConnection.bind(this));
      
    this.gameLoop = createGameLoop(this.update.bind(this), 10);
  }

  stop() {
    this.gameLoop.stop();
    this.io.close();
    connections -= this.connections;
  }

  update(delta) {

    const update = {};

    for (let i = 0, ids = Object.keys(this.users); i < ids.length; i++) {
      const user = this.users[ids[i]];

      if (user.vx) user.x += user.vx * delta;
      if (user.vy) user.y += user.vy * delta;

      update[ids[i]] = {
        x: user.x,
        y: user.y,
        vx: user.vx,
        vy: user.vy,
      };
    }

    this.io.emit('update', update);
  }

  onConnection(socket) {

    if (this.connections >= MAX_CONNECTIONS) {
      socket.emit('lobby_full');
      socket.disconnect(true);
      return;
    }

    this.connections++;
    connections++;
    
    const userId = UUID();
  
    this.users[userId] = {
      x: Math.random() * 400,
      y: Math.random() * 400,
      vx: 0,
      vy: 0,
      color: Math.random() * 0xFFFFFF << 0,
    };
  
    socket.emit('onconnected', { users: this.users, id: userId });
  
    // const address = socket.request.connection.remoteAddress; 
    // const address = socket.handshake.address;
  
    this.log(`User ${userId} connected`);
    socket.broadcast.emit('user_connect', userId, this.users[userId]);
  
    socket.on('disconnect', () => {
      this.connections--;
      connections--;

      this.log(`User ${userId} disconnected`);
      socket.broadcast.emit('user_disconnect', userId);
  
      delete this.users[userId];
    });
  
    socket.on('update', (id, { x, y, vx, vy }) => {
      const user = this.users[id];

      if (!user) {
        console.warn(`Invalid id: ${id}`);
        return;
      }

      user.x = x;
      user.y = y;
      user.vx = vx;
      user.vy = vy;
    });
    
  }

}

module.exports = server => {

  if (io) {
    io.close();
  }

  io = socketIO(server);
  connections = 0;

  games = {};

  const app = {};

  app.getConnections = () => connections;

  app.create = id => {
    if (games.hasOwnProperty(id)) {
      throw new Error(`A game with id ${id} already exists`);
    } else {
      games[id] = new Game(id);
      games[id].start();
    }
  };

  app.remove = id => {
    if (games.hasOwnProperty(id)) {
      games[id].stop();
      delete games[id];
    } else {
      throw new Error(`A game with id ${id} does not exist`);
    }
  };

  return app;
};
