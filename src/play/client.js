import io from 'socket.io-client';
import * as engine from './engine';

let socket,
    userId,
    name;

const createLevel = (groups = {}, objects = {}) => {

  if (Array.isArray(groups) || Array.isArray(objects)) {
    return Promise.reject('Incorrect data type Array for objects and/or groups');
  }

  for (let groupId in groups) {
    if (groups.hasOwnProperty(groupId)) {

      const groupData = groups[groupId];
      groupData.objects = groupData.objects || {};

      const group = engine.createGroup(groupData);

      for (let objId in groupData.objects) {
        if (groupData.objects.hasOwnProperty(objId)) {
          const objData = objects[objId];
          group.add(Object.assign(groupData, objData));
        }
      }
    }
  }
  
  return Promise.resolve();
};

const addPlayers = players => {

  const ids = Object.keys(players);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    engine.addPlayer(id, players[id]);
  }

  return engine.initUser(userId, name);
};

// Apply level object changes that occured before this player joined.
const applyChanges = changes => {
  for (let i = 0; i < changes.length; i++) {
    if (changes[i].damageWall) {
      engine.damageWall(changes[i]);
    }
  }
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
    if (data.despawn) {
      engine.despawnPlayer(data);
    }
    if (!data.invul) {
      engine.serverToggleInvul(data.player);
    }
    engine.damageWall(data);
  });
  
  socket.on('spike_hit', (id, data) => {
    if (data.despawn) {
      engine.despawnPlayer(data);
    }
    if (!data.invul) {
      engine.serverToggleInvul(data.player);
    }
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

export const sendSpike = data => {
  socket.emit('spike_hit', userId, data);
};

export const respawnPlayer = data => {
  socket.emit('respawn', userId, data);
};

export const connect = id => new Promise((resolve, reject) => {
  socket = io(`/${id}`, {
    query: {
      game_id: id,
    },
  });

  name = window.prompt('Choose a username:', 'GuestUserBestUser');
  if (!name) {
    window.location.reload();
  }

  socket.on('onconnected', data => {
    userId = data.id;

    socket.emit('user_named', userId, { username: name });

    const { x, y, w, h } = data.users[userId];

    engine.setup(data.gameData.options, x + (w / 2), y + (h / 2))
    .then(() => createLevel(data.gameData.groups, data.gameData.objects))
    .then(() => addPlayers(data.users))
    .then(() => applyChanges(data.gameData.objChanges))
    .then(() => bindHandlers())
    .then(() => engine.resume())
    .then(resolve)
    .catch(reject);
  });

  socket.on('invalid_gameid', () => {
    socket.close();

    reject('Invalid game id');
  });

  socket.on('lobby_full', () => {
    socket.close();
  
    reject('Sorry, lobby is full');
  });

  socket.on('connect_error', err => {
    reject(`Connection error: ${err}`);
  });

  socket.on('disconnect', () => {
    reject('The game your are trying to connect to is unavailable');
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
