/* eslint-disable */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js'; /* global Phaser */
/* eslint-enable */

import { sendUpdate, sendShoot } from './client';
import * as physics from './physics';

const DEV = process.env.NODE_ENV === 'development';

const { Game, KeyCode } = Phaser;

let players = {};

// Phaser objects
let input,
    player;

let nextFire = 0;

const BULLET_SPEED = 1000;
const FIRE_RATE = 200;
const GUN_LENGTH = 50;
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

window.addEventListener('resize', () => {
  game.scale.setGameSize(grandParent.clientWidth, grandParent.clientHeight);
});

const createStaticRect = ({ x, y, w = 1, h = 1, fill, stroke }) => {
  // I do this because I can't figure out how to set the anchor (rotation) point at the center
  x += w / 2;
  y += h / 2;

  // Draw simple rectangle graphic
  const graphic = game.add.graphics(x, y);
  if (fill !== undefined) graphic.beginFill(fill);
  if (stroke !== undefined) graphic.lineStyle(1, stroke, 1);
  graphic.drawRect(-w / 2, -h / 2, w, h);
  if (fill !== undefined) graphic.endFill();

  // Add a static physics body
  game.physics.p2.enable(graphic);
  graphic.body.setRectangle(w, h, 0, 0);

  return graphic;
};

export const setup = options => {

  if (!game.isBooted) {
    const err = 'Setup started before game boot!';
    console.error(err);
    throw err;
  }

  // Setup game properties
  game.paused = true;
  game.stage.disableVisibilityChange = true;
  game.state.clearCurrentState();
  physics.init(game);
  if (DEV) game.time.advancedTiming = true;

  // Handle WASD keyboard inputs
  input = game.input.keyboard.addKeys({
    up: KeyCode.W,
    left: KeyCode.A,
    down: KeyCode.S,
    right: KeyCode.D,
  });
    
  // Reset players
  players = {};

  const { x, y, w, h } = options.bounds;
  
  game.world.setBounds(0, 0, w + (x * 2), h + (y * 2));

  const boundary = game.add.group();
  boundary.add(createStaticRect({ x, y, w, h: 1, fill: 0x00FFFF }));
  boundary.add(createStaticRect({ x, y, w: 1, h, fill: 0x00FFFF }));
  boundary.add(createStaticRect({ x: x + w, y, w: 1, h, fill: 0x00FFFF }));
  boundary.add(createStaticRect({ x, y: y + h, w, h: 1, fill: 0x00FFFF }));
  for (let wall of boundary.children) {
    physics.enablePhysics(wall, 'wall');
  }

  return Promise.resolve();
};

export const addPlayer = (id, data) => {
  if (players.hasOwnProperty(id)) {
    console.log(`Invalid addPlayer: ${id}`);
  } else {

    const { x, y, color } = data;

    const newPlayer = createStaticRect({ x, y, w: 50, h: 60, fill: color, stroke: 0x000000 });
    physics.enablePhysics(newPlayer, 'player');
    
    const turret = game.make.graphics(0, 0);
    turret.beginFill(0x444444);
    turret.drawRect(0, -4, GUN_LENGTH, 8);
    turret.drawEllipse(0, 0, 18, 18);
    turret.endFill();
    
    newPlayer.addChild(turret);

    // Store reference to turret in player
    newPlayer.turret = turret;
  
    // Store player reference
    players[id] = newPlayer;

    // TODO: add to player group
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
  player = players[id];
  // game.camera.follow(player);
};

export const addBullet = data => {
  // TODO
  const { x, y, angle, speed } = data;

  const bullet = createStaticRect({ x, y, w: 5, h: 5, fill: 0x00FFFF, stroke: 0x000000 });
  physics.enablePhysics(bullet, 'bullet');
  bullet.body.rotation = angle;
  bullet.body.thrust(speed);
};

export const createGroup = data => {

  // TODO: do something with data?

  const group = game.add.group();

  return {
    add: obj => {
      const wall = createStaticRect(obj);
      physics.enablePhysics(wall, 'wall');
      group.add(wall);
    },

    remove: obj => {
      // TODO
    },
  };
};

export const pause = () => {
  game.paused = true;
};

export const resume = () => {
  game.paused = false;
};

export const destory = () => {
  game.destroy();
};

game.state.add('Play', {
  // preload,
  // create,

  render: DEV ? () => {
    game.debug.start(20, 20, 'white');
    game.debug.line(`FPS: ${game.time.fps}`);
    game.debug.line();
    game.debug.line('Players:');
    for (let i = 0, ids = Object.keys(players); i < ids.length; i++) {
      const id = ids[i],
            plyr = players[id];
      game.debug.line(`${i + 1}) id=${id}, x=${Math.round(plyr.x)}, y=${Math.round(plyr.y)}, angle=${plyr.rotation}`);
    }
    game.debug.stop();
    // game.debug.timer(game.time, game.scale.width - 400, 20, 'white');
  } : undefined,

  update: () => {
    
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

    // TODO: figure out how to use camera.follow()
    game.camera.focusOn(player);

    let angle = game.physics.arcade.angleToPointer(player);
    player.turret.rotation = angle - player.rotation;
    
    if (game.input.activePointer.isDown && game.time.now > nextFire) {
      nextFire = game.time.now + FIRE_RATE;
      
      const data = {
        x: player.x + (GUN_LENGTH * Math.cos(angle)),
        y: player.y + (GUN_LENGTH * Math.sin(angle)),
        angle: angle + (Math.PI * 0.5),
        speed: BULLET_SPEED,
      };

      // addBullet(data);
      sendShoot(data);
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
game.state.start('Play');
