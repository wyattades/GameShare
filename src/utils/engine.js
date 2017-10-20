/* eslint-disable */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js'; /* global Phaser */
/* eslint-enable */

import { sendUpdate, sendShoot } from './client';

const { Game, Physics, KeyCode } = Phaser;

let players = {};

// Phaser objects
let input,
    player;

const SPEED = 600; // Player speed
const parent = document.getElementById('root');
const grandParent = parent.parentElement;

// Create game engine
const game = new Game({
  width: parent.clientWidth,
  height: parent.clientHeight,
  parent,
  // transparent: true,
});

game.state.add('Play', {
  // preload,
  // create,
  render: () => {
    
  },
  update: () => {
    
    if (!player) return;
  
    player.turret.rotation = game.physics.arcade.angleToPointer(player) - player.rotation;
  
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
  
    // TODO: update slower AND/OR don't update if nothing happens?
    sendUpdate({
      x: player.x,
      y: player.y,
      vx: player.body.velocity.x,
      vy: player.body.velocity.y,
      angle: player.angle,
      vangle: player.body.angularVelocity,
    });
  },
});

const createStaticRect = ({ x, y, w = 1, h = 1, fill, stroke }) => {
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

export const setup = options => {

  if (!game.isBooted) {
    console.error('Uh oh!');
    return Promise.reject('Setup started before game boot');
  }

  // Start play state
  game.state.clearCurrentState();
  game.state.start('Play');

  window.addEventListener('resize', () => {
    game.scale.setGameSize(grandParent.clientWidth, grandParent.clientHeight);
  });

  game.paused = true;
  game.stage.disableVisibilityChange = true;

  // Handle WASD keyboard inputs
  input = game.input.keyboard.addKeys({
    up: KeyCode.W,
    left: KeyCode.A,
    down: KeyCode.S,
    right: KeyCode.D,
  });

  const { x, y, w, h } = options.bounds;
  game.world.setBounds(x, y, w, h);
  // game.world.setBounds(0, 0, w, h);
  // game.camera.bounds.setTo(0, 0, w + x * 2, h + y * 2);
  
  // Reset players
  players = {};

  // Enable p2 physics
  game.physics.startSystem(Physics.P2JS);

  return Promise.resolve();
};

export const addPlayer = (id, data) => {
  if (players.hasOwnProperty(id)) {
    console.log(`Invalid addPlayer: ${id}`);
  } else {

    const { x, y, color } = data;

    const newPlayer = createStaticRect({ x, y, w: 50, h: 60, fill: color, stroke: 0x000000 });
    
    const turret = game.make.graphics(0, 0);
    turret.beginFill(0x444444);
    turret.drawRect(0, -4, 50, 8);
    turret.drawEllipse(0, 0, 18, 18);
    turret.endFill();
    
    newPlayer.addChild(turret);

    // Store reference to turret in player
    newPlayer.turret = turret;
  
    // Store player reference
    players[id] = newPlayer;

    game.add.existing(newPlayer);
  }
};

export const removePlayer = id => {
  const plyr = players[id];

  if (plyr) {
    plyr.destroy();
    delete players[id];
  } else {
    console.log(`Invalid removePlayer: ${id}`);
  }
};

export const updatePlayer = (id, data) => {

  const plyr = players[id];
  
  if (plyr) {
    plyr.body.x = data.x;
    plyr.body.y = data.y;
    plyr.body.angle = data.angle;
    plyr.body.velocity.x = data.vx;
    plyr.body.velocity.y = data.vy;
    plyr.body.angularVelocity = data.vangle;

  } else {
    console.log(`Invalid updatePlayer: ${id}`);
  }
};

export const initUser = id => {
  // Make player a rectangle with physics!
  player = players[id];
  player.body.static = false;
  player.body.damping = 0.98;

  game.camera.follow(player);
};

export const addBullet = data => {
  // TODO
};

export const createGroup = data => {

  // TODO: do something with data?

  const group = game.add.group();

  return {
    add: obj => {
      obj.stroke = 0x333333;
      if (obj.fill === undefined) obj.fill = 0xDDDDDD;
      
      const wall = createStaticRect(obj);
      group.add(wall);
    },
  };
};

export const pause = () => {
  game.paused = true;
};

export const resume = () => {
  game.paused = false;
};
