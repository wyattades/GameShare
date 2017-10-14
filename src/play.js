import io from 'socket.io-client';

import './styles/styles.scss';
import Engine, { createRect } from './utils/Engine';
import testData from './assets/testData';
import NetworkManager from './utils/NetworkManager';

let userId; // Store user id
let users = {}; // Stores all user data
const SPEED = 8; // Player speed
const parent = document.getElementById('root'); // Empty element that Pixi will render game in

// Connect to server via socket.io
const socket = io();

// Start game engine
const app = new Engine(parent, { animated: true });

// ========================
/*
const UPDATE_CHANNEL = 'u';
let user_updates = { altered: true, dvx: 0, dvy: 0 };

// Add the update logic to the game loop.
// This should probably be wrapped in the Engine somewhere.
app.app.ticker.add(() => {
  if (user_updates.altered) { // Only send updates if we have something to say
    socket.emit(UPDATE_CHANNEL, makeUpdatePacket(user_updates));
  }
});
*/
const networkManager = new NetworkManager(socket, app);
// ========================

app.start();


// Helper function for adding a new user
const addUser = (id, { x, y, color }) => {
  const user = createRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });

  app.addObject(user);

  users[id] = user;
};

// Server sends initial data to client
socket.on('onconnected', ({ users: newUsers, id }) => {

  userId = id;

  // Reset users
  users = {};
  // Remove all objects from scene
  app.removeObject();

  // Load game objects
  for (let obj of testData.objects) {
    obj.stroke = 0xDD0000;
    app.addObject(createRect(obj));
  }

  // Load players
  for (let newUserId in newUsers) {
    if (newUsers.hasOwnProperty(newUserId)) {
      addUser(newUserId, newUsers[newUserId]);
    }
  }
});

// Add user to app
socket.on('user_connect', (id, data) => {
  addUser(id, data);
});

// Remove user from app
socket.on('user_disconnect', id => {
  app.removeObject(users[id]);

  delete users[id];
});

socket.on('move_x', (id, velocity) => {
  users[id].vx = velocity;
});

socket.on('move_y', (id, velocity) => {
  users[id].vy = velocity;
});

// Send keyup and keydown events to server
document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'a': socket.emit('move_x', userId, -SPEED); break; // left
    case 'w': socket.emit('move_y', userId, -SPEED); break; // up
    case 'd': socket.emit('move_x', userId, SPEED); break; // right
    case 's': socket.emit('move_y', userId, SPEED); break; // down
    default:
  }
}, false);

document.addEventListener('keyup', e => {
  switch (e.key) {
    case 'a': socket.emit('move_x', userId, 0); break; // left
    case 'w': socket.emit('move_y', userId, 0); break; // up
    case 'd': socket.emit('move_x', userId, 0); break; // right
    case 's': socket.emit('move_y', userId, 0); break; // down
    default:
  }
}, false);
