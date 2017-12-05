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

// TODO: use collision detection to spawn player in open space
// const boxCollide = (b1, b2) => !(
//   b1.x > b2.x + b2.w || b1.x + b1.w < b2.x ||
//   b1.y > b2.y + b2.h || b1.y + b1.h < b2.y
// );

// Pass down properties from groups to their objects
const propagateProps = ({ groups, objects }) => {
  for (let groupId in groups) {
    const group = groups[groupId];

    for (let objId in group.objects) {
      const obj = objects[objId];

      for (let key of ['damage', 'health', 'fill', 'stroke']) {
        const g = group[key],
              o = obj[key];
        if ((typeof o !== 'number' || isNaN(o)) &&
          !(typeof g !== 'number' || isNaN(g))) {
          obj[key] = g;
        }
      }

      obj.curhp = obj.health;
    }
  }
};

class Game {

  constructor(id, gameData) {
    this.id = id;
    this.gameData = gameData;
    propagateProps(this.gameData);
    this.users = {};
    this.connections = 0;
    this.maxConnections = gameData.options.maxPlayers || MAX_CONNECTIONS;

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
      maxhp: PLAYER_MAX_HEALTH,
      curhp: PLAYER_MAX_HEALTH,
      invul: false,
    };

    const bounds = this.gameData.options.bounds;

    // TEMP: add player to random position on map
    newUser.x = bounds.x + (Math.random() * (bounds.w - newUser.w));
    newUser.y = bounds.y + (Math.random() * (bounds.h - newUser.h));

    // TODO: use collision detection to spawn player in open space
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

    socket.on('user_named', (id, username) => {
      const user = this.users[id];

      if (!user) {
        console.warn(`Invalid id: ${id}`);
        return;
      }

      user.username = username;

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

      if (!data.invul && hit) {
        if (hit === user) {
          user.score--;
          user.curhp -= data.damage;
          if (user.curhp <= 0) {
            data.despawn = true;
          }
        } else {
          user.score++;
          hit.curhp -= data.damage;
          if (hit.curhp <= 0) {
            data.despawn = true;
          }
        }
      }

      this.io.emit('bullet_hit', id, data);
      // If we get a valid wall_id, a wall has taken damage.
      if (data.wall_id) {
        // Add the damage to the changes list.
        const wall = this.gameData.objects[data.wall_id];
        wall.curhp = Math.max(0, wall.curhp - data.damage);
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

    socket.on('respawn', (id) => {
      const user = this.users[id];
      user.curhp = user.maxhp;
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
