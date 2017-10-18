import io from 'socket.io-client';
// The following 6 lines are necessary to use Phaser
/* eslint-disable */
import 'pixi';
import 'p2';
import 'phaser';
/* global Phaser */
/* eslint-enable */

import './styles/styles.scss';

const { Game, Physics, KeyCode } = Phaser;

const SPEED = 600; // Player speed
const GAME_ID = 'my_test_game'; // TEMP

let socket;

let input; // phaser keyboard inputs

// phaser objects
let players,
    level,
    player;

let userId, // This user's id
    users; // All user data

// Create game engine
const game = new Game({
  width: 800,
  height: 600,
  parent: 'root', // document.getElementById('root'),
  // transparent: true,
});

const createStaticRect = ({ x, y, w = 1, h = 1, fill, stroke }) => {
  if (fill === undefined) fill = 0xDDDDDD;

  // I do this because I can't figure out how to set the anchor (rotation) point at the center
  x += w / 2;
  y += h / 2;

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
const initPlayer = ({ users: newUsers, id: newId, gameData }) => {

  game.world.setBounds(0, 0, gameData.options.width, gameData.options.height);
  
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
  player.body.damping = 0.98;

  game.camera.follow(player);

  // TEMP: Load game objects
  for (let obj of gameData.objects) {
    obj.stroke = 0x333333;
    
    const wall = createStaticRect(obj);
    level.add(wall);
  }

  game.paused = false;

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

        user.body.x = updatedUser.x;
        user.body.y = updatedUser.y;
        user.body.angle = updatedUser.angle;
        // user.vx = updatedUser.vx;
        // user.vy = updatedUser.vy;
      }
    }
  });
};

const preload = () => {
  // game.load.image('background', 'http:')
};

const create = () => {

  // Handle WASD keyboard inputs
  input = game.input.keyboard.addKeys({
    up: KeyCode.W,
    left: KeyCode.A,
    down: KeyCode.S,
    right: KeyCode.D,
  });

  game.stage.disableVisibilityChange = true;
  game.paused = true;

  // Enable p2 physics
  game.physics.startSystem(Physics.P2JS);

  // Create groups
  level = game.add.group();
  players = game.add.group();
  
  // Connect to specified server via socket.io
  socket = io(`/${GAME_ID}`);

  socket.on('onconnected', initPlayer);

  socket.on('lobby_full', () => {
    socket.close();
  
    alert('Sorry, lobby is full! Refresh page to try again.');
  });

};

const render = () => {
  // game.debug.cameraInfo(game.camera, 32, 32);
};

const update = () => {

  if (!player) return;

  if (input.left.isDown) {
    player.body.rotateLeft(50);
  } else if (input.right.isDown) {
    player.body.rotateRight(50);
  } else {
    player.body.setZeroRotation();
  }

  if (input.up.isDown) {
    player.body.thrust(SPEED);
  } else if (input.down.isDown) {
    player.body.reverse(SPEED);
  }

  // player.body.setZeroVelocity();

  // if (input.right.isDown) {
  //   player.body.moveRight(SPEED);
  // }
  // if (input.left.isDown) {
  //   player.body.moveLeft(SPEED);
  // }
  // if (input.up.isDown) {
  //   player.body.moveUp(SPEED);
  // }
  // if (input.down.isDown) {
  //   player.body.moveDown(SPEED);
  // }

  const updated = {
    x: player.x,
    y: player.y,
    vx: player.vx,
    vy: player.vy,
    angle: player.angle,
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
