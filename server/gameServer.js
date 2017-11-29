const socketIO = require('socket.io');
const UUID = require('node-uuid');

let io,
    connections;

const games = {};

const MAX_CONNECTIONS = 5;
const PLAYER_MAX_HEALTH = 3; // TODO get from editor rules

const createGameLoop = (fn, fps) => {
  
  let intervalId;

  return {
    start: () => {
      if (intervalId) clearInterval(intervalId);

      let delta,
          lastUpdate = Date.now(),
          now;

      intervalId = setInterval(() => {
        now = Date.now();
        delta = now - lastUpdate;
        lastUpdate = now;

        fn(delta / 16.66); // 16.66 is the deltaTime of client i.e. 60fps
      }, 1000 / fps);
    },

    stop: () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    },
  };
};

const boxCollide = (b1, b2) => !(
  b1.x > b2.x + b2.w || b1.x + b1.w < b2.x ||
  b1.y > b2.y + b2.h || b1.y + b1.h < b2.y
);

class Game {

  constructor(id, gameData) {
    this.id = id;
    this.gameData = gameData;
    this.users = {};
    this.connections = 0;
    this.maxConnections = gameData.options.maxPlayers || MAX_CONNECTIONS;
    
    // Stores changes since server start, to synchronize level objects.
    // TODO: build out actual gameData.objects to add properties based on group (like health) and remove change system
    this.gameData.objChanges = [];
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

    // this.io.close();
    const connectedSockets = this.io.connected;
    Object.keys(connectedSockets).forEach(socketId => {
      connectedSockets[socketId].disconnect(); // Disconnect each socket
    });
    this.io.removeAllListeners(); // Remove all Listeners for the event emitter
    delete io.nsps[`/${this.id}`]; // Remove from the server namespaces

    connections -= this.connections;
  }

  update(delta) {

    const ids = Object.keys(this.users);

    const update = {};
    
    for (let i = 0; i < ids.length; i++) {
      const user = this.users[ids[i]];

      // if (user.vx) user.x += user.vx * delta;
      // if (user.vy) user.y += user.vy * delta;

      update[ids[i]] = {
        x: user.x,
        y: user.y,
        vx: user.vx,
        vy: user.vy,
        angle: user.angle,
        vangle: user.vangle,
        turret: user.turret,
        score: user.score,
        username: user.username,
      };
    }

    this.io.emit('update', update);
  }
  
  onConnection(socket) {

    if (this.connections >= this.maxConnections) {
      socket.emit('lobby_full');
      socket.disconnect(true);
      return;
    }

    if (this.connections === 0) {
      this.gameLoop.start();
    }

    this.connections++;
    connections++;
    
    const userId = UUID();
  
    const newUser = {
      w: 60,
      h: 60,
      vx: 0,
      vy: 0,
      vangle: 0,
      angle: 0,
      turret: 0,
      color: Math.random() * 0xFFFFFF << 0,
      score: 0,
      username: null,
      maxhp: PLAYER_MAX_HEALTH,
      curhp: PLAYER_MAX_HEALTH,
      invul: false,
    };

    const bounds = this.gameData.options.bounds;

    // TEMP: add player to random position on map
    newUser.x = bounds.x + (Math.random() * (bounds.w - newUser.w));
    newUser.y = bounds.y + (Math.random() * (bounds.h - newUser.h));

    // const displace = Math.random() > 0.5 ? 10 : -10;

    // // Move player left or right until it doesn't collide with anything
    // let collide = true;
    // while (collide) {

    //   newUser.x += displace;

    //   collide = false;
    //   for (let obj of this.gameData.objects) {
    //     if (boxCollide(obj, newUser)) {
    //       collide = true;
    //       break;
    //     }
    //   }
    // }

    this.users[userId] = newUser;
    
  
    // Send initial data to connected client
    const onConnectData = { users: this.users, id: userId, gameData: this.gameData };
    socket.emit('onconnected', onConnectData);
  
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

      if (this.connections <= 0) {
        this.gameLoop.stop();
      }
    });
  
    socket.on('update', (id, data) => {
      const user = this.users[id];

      if (!user) {
        console.warn(`Invalid id: ${id}`);
        return;
      }

      Object.assign(user, data);
    });

    socket.on('user_named', (id, data) => {
      const user = this.users[id];

      if (!user) {
        console.warn(`Invalid id: ${id}`);
        return;
      }

      Object.assign(user, data);
      // console.log(user.username);

    });
    socket.on('bullet_create', (id, data) => {
      this.io.emit('bullet_create', id, data);
    });

    socket.on('bullet_hit', (id, data) => {
      
      const user = this.users[id];
      const hit = this.users[data.player];
 
      if (!user) {
        console.warn(`Invalid id: ${id}`);
        return;
      }

      if (!data.invul) {
        if (hit) {
          if (hit === user) {
            Object.assign(user, { score: user.score - 1 });
            Object.assign(user, { curhp: user.curhp - 1 });
            if (user.curhp < 1) {
              data.despawn = true;
            }
          } else {
            Object.assign(user, { score: user.score + 1 });
            Object.assign(hit, { curhp: hit.curhp - 1 });
            if (hit.curhp < 1) {
              data.despawn = true;
            }
          }
        }
      }

      this.io.emit('bullet_hit', id, data);
      // If we get a valid wall_id, a wall has taken damage.
      if (Number.isInteger(data.wall_id)) {
        // Add the damage to the changes list.
        this.gameData.objChanges.push({ damageWall: true, wall_id: data.wall_id, damage: data.damage });
      }
    });
    
    socket.on('spike_hit', (id, data) => {
      const user = this.users[id];
      if (!data.invul) {
        Object.assign(user, { curhp: user.curhp - data.dmg });
      }
      if (user.curhp < 1) {
        data.despawn = true;
      }
      this.io.emit('spike_hit', id, data);
    });

    socket.on('respawn', (id, data) => {
      const user = this.users[id];
      Object.assign(user, { curhp: user.maxhp });
    });
  }

}

module.exports = server => {

  if (io) {
    io.close();
  }

  io = socketIO(server);
  connections = 0;
  
  // Handle connection to invalid game id
  io.on('connection', socket => {
    const game_id = socket.handshake.query.game_id;
    if (!game_id || !games.hasOwnProperty(game_id)) {
      socket.disconnect(true);
    }
  });

  const app = {};

  app.getConnections = () => connections;

  app.create = (id, gameData) => {
    if (games.hasOwnProperty(id)) {
      games[id].stop();
      console.log(`Restarted game: ${id}`);
    } else {
      console.log(`Created game: ${id}`);
    }

    games[id] = new Game(id, gameData);
    games[id].start();
    
  };

  app.destroy = id => {
    if (games.hasOwnProperty(id)) {
      games[id].stop();
      delete games[id];
      console.log(`Destroyed game: ${id}`);
    } else {
      console.log(`A game with id ${id} does not exist`);
    }
  };

  // Destroy previous games
  for (let id in games) {
    app.destroy(id);
  }

  return app;
};
