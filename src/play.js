import io from 'socket.io-client';

import './styles/styles.scss';
import Engine, { createRect, createObject } from './utils/Engine';
import InputManager from './utils/InputManager';
import Physics from './utils/Physics';

const SPEED = 1; // Player speed
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

// Create input manager
// We must pass the app to handle input events in the canvas
const input = new InputManager(app, {
  up: 'w',
  left: 'a',
  down: 's',
  right: 'd',
});

// Create level container
level = createObject({ container: true });
app.container.addObject(level);

// Create players container
players = createObject({ container: true });
app.container.addObject(players);

// Create physics handler
const physics = new Physics(players, level);

app.start();
  
// Helper function for adding a new user
const addUser = (id, { x, y, color }) => {
  const newUser = createRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });
  newUser.vx = 0;
  newUser.vy = 0;

  players.addObject(newUser);

  // Store user reference in 'users' object
  users[id] = newUser;
};


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

// Server sends initial data to client
socket.on('onconnected', ({ users: newUsers, id, gameData }) => {

  userId = id;

  // Reset users
  users = {};
  // Remove all players from scene
  players.removeObject();

  // Load players
  for (let newUserId in newUsers) {
    if (newUsers.hasOwnProperty(newUserId)) {
      addUser(newUserId, newUsers[newUserId]);
    }
  }

  // TEMP: Load game objects
  for (let obj of gameData.objects) {
    obj.stroke = 0xDD0000;
    level.addObject(createRect(obj));
  }

  thisUser = users[id];

  physics.setUser(thisUser);

  createGameLoop(delta => {

    if (input.left.isDown) {
      physics.applyForce(-SPEED, 0);
    }
    if (input.right.isDown) {
      physics.applyForce(SPEED, 0);
    }
    if (input.up.isDown) {
      physics.applyForce(0, -SPEED);
    }
    if (input.down.isDown) {
      physics.applyForce(0, SPEED);
    }

    physics.update(delta);
  
    for (let obj of players.getChildren()) {
      if (obj !== thisUser) {
        if (obj.vx) obj.x += obj.vx * delta;
        if (obj.vy) obj.y += obj.vy * delta;
      }
    }

    const updated = {
      x: thisUser.x,
      y: thisUser.y,
      vx: thisUser.vx,
      vy: thisUser.vy,
    };

    // TODO: don't update if nothing happens
    socket.emit('update', userId, updated);

  }, 30);
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
