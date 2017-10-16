import io from 'socket.io-client';

import './styles/styles.scss';
import Engine, { createRect, createObject } from './utils/Engine';
import testData from './assets/testData';
import keyboard from './utils/keyboard';

const SPEED = 4; // Player speed
const GAME_ID = 'my_test_game'; // TEMP

// Containers
let players,
    level;

let userId, // This user's id
    thisUser, // This user's data
    users; // All user data

// Connect to specified server via socket.io
const socket = io(`/${GAME_ID}`);

// Start game engine
const app = new Engine(document.getElementById('root'));

// Create level container
level = createObject({ container: true });
app.container.addObject(level);

// TEMP: Load game objects
for (let obj of testData.objects) {
  obj.stroke = 0xDD0000;
  level.addObject(createRect(obj));
}

// Create players container
players = createObject({ container: true });
app.container.addObject(players);

app.start();

const velChange = () => socket.emit('vel_change', userId, {
  x: Math.round(thisUser.x),
  y: Math.round(thisUser.y),
  vx: thisUser.vx,
  vy: thisUser.vy,
});

let lastCollideX = false,
    lastCollideY = false;

// Not the best way because there can be gaps between player and obstacles
const updateThisUser = obj => delta => {

  if (obj.vx) {
    let collide = false;

    const newX = obj.x + (obj.vx * delta);
    for (let i = 0, walls = level.getChildren(); i < walls.length; i++) {
      const wall = walls[i];
      if (newX < wall.x + wall.w && newX + obj.w > wall.x &&
          obj.y < wall.y + wall.h && obj.y + obj.h > wall.y) {
        collide = true;
        break;
      }
    }

    if (lastCollideX === false && collide === true) {
      const lastVx = obj.vx;
      obj.vx = 0;
      velChange();
      obj.vx = lastVx;
    } else if (collide === false) {
      obj.x = newX;
      if (lastCollideX === true) {
        velChange();
      }
    }

    lastCollideX = collide;
  }

  if (obj.vy) {
    let collide = false;
    
    const newY = obj.y + (obj.vy * delta);
    for (let i = 0, walls = level.getChildren(); i < walls.length; i++) {
      const wall = walls[i];
      if (obj.x < wall.x + wall.w && obj.x + obj.w > wall.x &&
          newY < wall.y + wall.h && newY + obj.h > wall.y) {
        collide = true;
        break;
      }
    }

    if (lastCollideY === false && collide === true) {
      const lastVy = obj.vy;
      obj.vx = 0;
      velChange();
      obj.vy = lastVy;
    } else if (collide === false) {
      obj.y = newY;
      if (lastCollideY === true) {
        velChange();
      }
    }

    lastCollideY = collide;
  }

};

const updateUser = obj => delta => {
  if (obj.vx) obj.x += obj.vx * delta;
  if (obj.vy) obj.y += obj.vy * delta;
};
  
// Helper function for adding a new user
const addUser = (id, { x, y, color }, update = updateUser) => {
  const newUser = createRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });
  newUser.vx = 0;
  newUser.vy = 0;

  players.addObject(newUser);

  // Update user every frame
  app.addUpdate(update(newUser));

  // Store user reference in 'users' object
  users[id] = newUser;
};

const up = keyboard(87), // w
      left = keyboard(65), // a
      down = keyboard(83), // s
      right = keyboard(68); // d

// Server sends initial data to client
socket.on('onconnected', ({ users: newUsers, id }) => {

  userId = id;

  // Reset users
  users = {};
  // Remove all players from scene
  players.removeObject();

  // Load players
  for (let newUserId in newUsers) {
    if (newUsers.hasOwnProperty(newUserId)) {
      addUser(newUserId, newUsers[newUserId], updateThisUser);
    }
  }

  thisUser = users[id];
});

socket.on('lobby_full', () => {
  alert('Sorry, lobby is full! Refresh page to try again.');
});

// Add user to app
socket.on('user_connect', (id, data) => {
  addUser(id, data);
});

// Remove user from app
socket.on('user_disconnect', id => {
  players.removeObject(users[id]);

  delete users[id];
});

socket.on('update', updatedUsers => {
  const ids = Object.keys(updatedUsers);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (id !== userId) {
      const updatedUser = updatedUsers[id];
      const user = users[id];
      user.x = updatedUser.x;
      user.y = updatedUser.y;
      user.vx = updatedUser.vx;
      user.vy = updatedUser.vy;
    }
  }
});

const bindKeyVelocity = (key, oppositeKey, dimension, dir) => {

  const vel = SPEED * dir;

  key.press = () => {
    if (oppositeKey.isDown) {
      thisUser[dimension] = 0;
    } else {
      thisUser[dimension] = vel;
    }

    velChange();
  };

  key.release = () => {
    if (oppositeKey.isDown) {
      thisUser[dimension] = -vel;
    } else {
      thisUser[dimension] = 0;
    }
    
    velChange();
  };
};

bindKeyVelocity(left, right, 'vx', -1);
bindKeyVelocity(right, left, 'vx', 1);
bindKeyVelocity(up, down, 'vy', -1);
bindKeyVelocity(down, up, 'vy', 1);

// TEMP: collision handler
// app.app.ticker.add(delta => {
//   for (let solid of solids) {

//   }
// });
