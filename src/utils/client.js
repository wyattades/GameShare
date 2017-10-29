import io from 'socket.io-client';
import * as engine from './engine';

let socket,
    userId;

const createLevel = (groups, objects) => Promise.all(groups.map(groupData => new Promise(resolve => {
  const group = engine.createGroup(groupData);

  let i = 0;
  const interval = setInterval(() => {
    const objData = objects[groupData.objects[i]];
    
    group.add(Object.assign(groupData, objData));

    if (++i >= groupData.objects.length) {
      clearInterval(interval);
      resolve();
    }
  }, 2000 / groupData.objects.length); // Take 2 seconds to spawn all the objects
})));

const addPlayers = players => {

  const ids = Object.keys(players);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    engine.addPlayer(id, players[id]);
  }

  return engine.initUser(userId);
};

const bindHandlers = () => {
  
  socket.on('update', updatedPlayers => {
    const ids = Object.keys(updatedPlayers);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (id !== userId) {
        engine.updatePlayer(id, updatedPlayers[id]);
      }
    }
  });

  socket.on('user_connect', (id, data) => {
    engine.addPlayer(id, data);
  });

  // Remove user from app
  socket.on('user_disconnect', id => {
    engine.removePlayer(id);
  });

  socket.on('bullet_create', (id, data) => {
    engine.addBullet(id, data);
  });

  socket.on('bullet_hit', (id, data) => {
    engine.removeBullet(id, data);
  });

  return Promise.resolve();
};

// Updates user position, velocity, etc.
export const sendUpdate = data => {
  socket.emit('update', userId, data);
};

export const sendShoot = data => {
  socket.emit('bullet_create', userId, data);
};

export const sendHit = data => {
  socket.emit('bullet_hit', userId, data);
};

export const connect = id => new Promise((resolve, reject) => {
  socket = io(`/${id}`);

  socket.on('onconnected', data => {
    userId = data.id;

    const { x, y, w, h } = data.users[userId];

    engine.setup(data.gameData.options, x + (w / 2), y + (h / 2))
    .then(() => {
      resolve();

      createLevel(data.gameData.groups, data.gameData.objects)
      .then(() => addPlayers(data.users))
      .then(() => bindHandlers())
      .then(() => engine.resume());

    });
  });

  socket.on('lobby_full', () => {
    socket.close();
  
    reject('Sorry, lobby is full');
  });

  socket.on('connect_error', err => {
    reject(err.msg);
  });

  // TODO: handle network timeouts?
});

export const disconnect = () => {
  if (socket) {
    socket.close();
  }
};

export const destroy = () => {
  disconnect();
  engine.destroy();
};
