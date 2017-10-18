import io from 'socket.io-client';
// import { Game, Physics, KeyCode, Graphics } from 'phaser-ce';

import PIXI from 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import p2 from 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import Phaser from 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js';

import './styles/styles.scss';

const SPEED = 100; // Player speed
const GAME_ID = 'my_test_game'; // TEMP

let input; // phaser keyboard inputs

// phaser objects
let players,
    level,
    player;

let userId, // This user's id
    users; // All user data

// Connect to specified server via socket.io
const socket = io(`/${GAME_ID}`);

// Create game engine
const game = new Phaser.Game({
  width: '100',
  height: '100',
  parent: 'root', // document.getElementById('root'),
  transparent: true,
});

const createStaticRect = ({ x, y, w = 1, h = 1, fill, stroke }) => {
  if (fill === undefined) fill = 0xDDDDDD;

  // Draw simple rectangle graphic
  const graphic = game.add.graphics(x, y);
  graphic.beginFill(fill);
  if (stroke !== undefined) graphic.lineStyle(1, stroke, 1);
  graphic.drawRect(-w / 2, -h / 2, w, h);
  graphic.endFill();

  // Add a static physics body
  game.physics.p2.enable(graphic);
  graphic.body.setRectangle(w, h, 0, 0);
  graphic.body.static = true;

  return graphic;
};

// Helper function for adding a new user
const addUser = (id, { x, y, color }) => {
  const newUser = createStaticRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });
   
  // Add user to players group
  players.add(newUser);

  // Store user reference in 'users' object
  users[id] = newUser;
};

// Server sends initial data to client
const initUser = ({ users: newUsers, id: newId, gameData }) => {
  
  userId = newId;

  // Reset users
  users = {};
  // Remove all players from scene
  players.removeAll();

  // Load players
  for (let newUserId in newUsers) {
    if (newUsers.hasOwnProperty(newUserId)) {
      addUser(newUserId, newUsers[newUserId]);
    }
  }

  // Make player a rectangle with physics!
  player = users[userId];
  player.body.static = false;

  // TEMP: Load game objects
  for (let obj of gameData.objects) {
    obj.stroke = 0xDD0000;
    
    const wall = createStaticRect(obj);
    level.add(wall);
  }

  // Add user to app
  socket.on('user_connect', (id, data) => {
    addUser(id, data);
  });

  // Remove user from app
  socket.on('user_disconnect', id => {
    players.remove(users[id], true);

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
};

const preload = () => {

};

const create = () => {

  const KeyCode = Phaser.KeyCode;

  // Handle WASD keyboard inputs
  input = game.input.keyboard.addKeys({
    up: KeyCode.W,
    left: KeyCode.A,
    down: KeyCode.S,
    right: KeyCode.D,
  });

  game.camera.x = 200;
  game.camera.y = 200;

  // Enable p2 physics
  game.physics.startSystem(Phaser.Physics.P2JS);

  // Create groups
  level = game.add.group();
  players = game.add.group();

  socket.on('onconnected', initUser);

};

const render = () => {
  // game.debug.cameraInfo(game.camera, 32, 32);
};

const update = () => {

  if (!player) return;

  // if (input.left.isDown) {
  //   player.body.rotateLeft(80);
  // } else if (input.right.isDown) {
  //   player.body.rotateRight(80);
  // } else {
  //   player.body.setZeroRotation();
  // }

  // if (input.up.isDown) {
  //   player.body.thrust(400);
  // } else if (input.down.isDown) {
  //   player.body.reverse(400);
  // }

  player.body.setZeroVelocity();

  if (input.right.isDown) {
    player.body.moveRight(SPEED);
    // player.body.applyForce([ SPEED, 0 ], player.x, player.y);
  }
  if (input.left.isDown) {
    player.body.moveLeft(SPEED);
    // player.body.applyForce([ -SPEED, 0 ], player.x, player.y);
  }
  if (input.up.isDown) {
    player.body.moveUp(SPEED);
    // player.body.applyForce([ 0, -SPEED ], player.x, player.y);
  }
  if (input.down.isDown) {
    player.body.moveDown(SPEED);
    // player.body.applyForce([ 0, SPEED ], player.x, player.y);
  }

  const updated = {
    x: player.x,
    y: player.y,
    vx: player.vx,
    vy: player.vy,
  };

  // TODO: don't update if nothing happens
  socket.emit('update', userId, updated);
};

// Start play state
game.state.add('Play', {
  preload,
  create,
  render,
  update,
});
game.state.start('Play');

socket.on('lobby_full', () => {
  socket.close();

  alert('Sorry, lobby is full! Refresh page to try again.');
});
