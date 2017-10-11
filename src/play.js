import io from 'socket.io-client';

import './styles/styles.scss';
import Engine, { createRect } from './utils/Engine';

const SPEED = 8;
const socket = io();
const parent = document.getElementById('root');
const app = new Engine(parent, { animated: true });

let users = {};

app.start();

const addUser = (id, { x, y, color }) => {
  const user = createRect({ x, y, w: 50, h: 50, fill: color });

  app.addObject(user);

  users[id] = user;
};

socket.on('user_data', _users => {

  users = {};
  app.removeObject();

  for (let id in _users) {
    if (_users.hasOwnProperty(id)) {
      addUser(id, _users[id]);
    }
  }
});

socket.on('user_connect', (id, data) => {
  addUser(id, data);
});

socket.on('user_disconnect', id => {
  app.removeObject(users[id]);

  delete users[id];
});

socket.on('move_x', (id, delta) => {
  users[id].vx = delta;
});

socket.on('move_y', (id, delta) => {
  users[id].vy = delta;
});

document.addEventListener('keydown', e => {
  switch (e.key) {
    case 'a': socket.emit('move_x', socket.id, -SPEED); break; // left
    case 'w': socket.emit('move_y', socket.id, -SPEED); break; // up
    case 'd': socket.emit('move_x', socket.id, SPEED); break; // right
    case 's': socket.emit('move_y', socket.id, SPEED); break; // down
    default:
  }
}, false);

document.addEventListener('keyup', e => {
  switch (e.key) {
    case 'a': socket.emit('move_x', socket.id, 0); break; // left
    case 'w': socket.emit('move_y', socket.id, 0); break; // up
    case 'd': socket.emit('move_x', socket.id, 0); break; // right
    case 's': socket.emit('move_y', socket.id, 0); break; // down
    default:
  }
}, false);
