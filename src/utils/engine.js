/* eslint-disable */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js'; /* global Phaser */
/* eslint-enable */

import { sendUpdate, sendShoot, sendHit, sendDead } from './client';
import * as physics from './physics';

const DEV = process.env.NODE_ENV === 'development';

const { Game, KeyCode } = Phaser;

// Object hashmaps
let players = {};
const textures = {};
let openIndicis = [];

// Phaser objects
let input,
    player,
    bullets;

let options;

let nextFire = 0,
    bulletsShot = 0,
    tillRespawn = 0;

const RESPAWN_TIMER = 1000;
const BULLET_SPEED = 1000;
const FIRE_RATE = 200;
const GUN_LENGTH = 48;
const GUN_BODY_RATIO = 0.25;
const SPEED = 500; // Player speed

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
  if (game.isBooted) game.scale.setGameSize(grandParent.clientWidth, grandParent.clientHeight);
});

const createRect = ({ x, y, w = 1, h = 1, fill, stroke }) => {
  // I do this because I can't figure out how to set the anchor (rotation) point at the center
  x += w / 2;
  y += h / 2;

  // Draw simple rectangle graphic
  const graphic = game.add.graphics(x, y);
  if (fill !== undefined) graphic.beginFill(fill);
  if (stroke !== undefined) graphic.lineStyle(1, stroke, 1);
  graphic.drawRect(-w / 2, -h / 2, w, h);
  if (fill !== undefined) graphic.endFill();

  return graphic;
};

const generateTextures = () => {
  
  // Create temporary graphics objects
  
  const w = 50,
        h = 60;
  const playerGraphic = game.add.graphics(0, 0);
  playerGraphic.beginFill(0xFFFFFF);
  playerGraphic.lineStyle(1, 0x000000, 1);
  playerGraphic.drawRect(-w / 2, -h / 2, w, h);
  playerGraphic.endFill();

  const turretGraphic = game.add.graphics(0, 0);
  turretGraphic.beginFill(0xCCCCCC);
  turretGraphic.drawRect(0, -4, GUN_LENGTH, 8);
  const radius = (GUN_LENGTH * GUN_BODY_RATIO) / (1 - GUN_BODY_RATIO);
  turretGraphic.drawEllipse(0, 0, radius, radius);
  turretGraphic.endFill();
  
  const bulletGraphic = game.add.graphics(0, 0);
  bulletGraphic.beginFill(0xFFFF00);
  bulletGraphic.drawTriangle([
    new Phaser.Point(0, -8),
    new Phaser.Point(-4, 3),
    new Phaser.Point(4, 3),
  ]);
  bulletGraphic.endFill();

  // Generate static textures from graphics
  textures.player = playerGraphic.generateTexture();
  textures.turret = turretGraphic.generateTexture();
  textures.bullet = bulletGraphic.generateTexture();

  // Destroy graphics
  playerGraphic.destroy();
  turretGraphic.destroy();
  bulletGraphic.destroy();
};

export const setup = gameOptions => {

  options = gameOptions;

  if (!game.isBooted) {
    const err = 'Setup started before game boot!';
    console.error(err);
    throw err;
  }

  generateTextures();

  // Setup game properties
  // game.paused = true;
  game.stage.disableVisibilityChange = true;
  // game.state.clearCurrentState();
  physics.init(game);
  if (DEV) game.time.advancedTiming = true;

  // Handle WASD keyboard inputs
  input = game.input.keyboard.addKeys({
    up: KeyCode.W,
    left: KeyCode.A,
    down: KeyCode.S,
    right: KeyCode.D,
  });
    
  // Reset object maps
  players = {};

  // Creates array of possible player indicis: 0, 1, 2, ..., options.maxPlayers - 1
  openIndicis = [ ...Array(options.maxPlayers).keys() ];

  // Create bullets group
  bullets = game.add.group();

  // Save bullets to cache
  bullets.createMultiple(options.maxPlayers * options.maxBulletsPerPlayer, textures.bullet);
  // Enable physics and check for collisions
  bullets.forEach(bullet => {
    physics.enablePhysics(bullet, 'bullet');

    physics.collideEnd(bullet, collider => {
      if (collider.name === 'wall' && bullet.health > 0) {
        
        // Point bullet towards velocity
        const { mx, my } = bullet.body.velocity;
        bullet.body.rotation = Math.atan2(my, mx) - (Math.PI / 2);
      }
    });
  });
  
  const { x, y, w, h } = options.bounds;
  
  game.world.setBounds(0, 0, w + (x * 2), h + (y * 2));
  
  physics.enablePhysics(createRect({ x, y, w, h, stroke: 0x00FFFF }), 'boundary');
  
  return Promise.resolve();
};

export const addPlayer = (id, data) => {
  if (players.hasOwnProperty(id)) {
    console.log(`Invalid addPlayer: ${id}`);
  } else {

    const { x, y, color } = data;
    const { width, height } = textures.player;

    const newPlayer = game.add.sprite(x + (width / 2), y + (height / 2), textures.player);
    newPlayer.tint = color;
    physics.enablePhysics(newPlayer, 'player');
    
    const turret = game.add.sprite(0, 0, textures.turret);
    turret.tint = color;
    turret.anchor.set(GUN_BODY_RATIO, 0.5);
    newPlayer.addChild(turret);

    // Store reference to turret in player
    newPlayer.turret = turret;

    // Store player id
    newPlayer.id = id;
    // Store player index
    newPlayer.index = openIndicis.shift();
  
    // Store player reference
    players[id] = newPlayer;

    // TODO: add to player group
    // game.add.existing(newPlayer);
  }
};

export const removePlayer = id => {
  const plyr = players[id];

  if (plyr) {
    openIndicis.push(plyr.index);
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
    plyr.body.rotation = data.angle;
    plyr.body.velocity.x = data.vx;
    plyr.body.velocity.y = data.vy;
    plyr.body.angularVelocity = data.vangle;
    plyr.turret.rotation = data.turret;

  } else {
    console.log(`Invalid updatePlayer: ${id}`);
  }
};

export const initUser = id => {
  player = players[id];

  const allowBullet = () => {
    bulletsShot = Math.max(0, bulletsShot - 1);
  };

  const start = player.index * options.maxBulletsPerPlayer;
  for (let i = 0; i < options.maxBulletsPerPlayer; i++) {

    const bullet = bullets.getAt(start + i);

    // bullet.indexInPlayer = i;

    physics.collideStart(bullet, collider => {
      // Kill on bullet or player collision
      if (collider.name === 'player') {
        console.log(`Player hit: ${collider.id}`);
        bullet.kill();
        tillRespawn = game.time.now + RESPAWN_TIMER;
        sendDead({
          player: collider.id,
        });
        sendHit({
          index: i,
        });
      } else if (collider.name === 'bullet') {
        // bullet.kill();
        sendHit({
          index: i,
        });
      } else if (collider.name === 'wall') { // Bounce off walls until no health
        bullet.health--;
        if (bullet.health <= 0) {
          bullet.kill();
          sendHit({
            index: i,
          });
        }
      }
    });

    bullet.events.onKilled.add(allowBullet);
  }

  // game.camera.follow(player); // TODO: sometimes camera doesn't set the player as its target  

  return Promise.resolve();
};

export const removeBullet = (id, data) => {
  //console.log(id);
  const { index } = data;

  if (!players.hasOwnProperty(id) || typeof index !== 'number' || index >= options.maxBulletsPerPlayer) {
    throw new Error(`Invalid id (${id}) or index (${index}) in removeBullet()`);
  }

  const bullet = bullets.getAt((players[id].index * options.maxBulletsPerPlayer) + index);

  if (bullet.exists) bullet.kill();
};

export const addBullet = (id, data) => {
  // TODO
  const { x, y, angle, speed, index } = data;

  if (!players.hasOwnProperty(id) || typeof index !== 'number' || index >= options.maxBulletsPerPlayer) {
    throw new Error(`Invalid id (${id}) or index (${index}) in addBullet()`);
  }

  const bullet = bullets.getAt((players[id].index * options.maxBulletsPerPlayer) + index);
  bullet.reset(x, y, 2); // 2 health aka can bounce once before dying
  
  bullet.body.rotation = angle;
  bullet.body.thrust(speed);
};

export const despawnPlayer = ({player: id}) => {
  const plyr = players[id];
  if (plyr) {
    plyr.kill();
  } else {
    console.log(`Invalid despawnPlayer: ${id}`);
  }
};

export const respawnPlayer = ({player: id}) => {
    const plyr = players[id];
    if (plyr){
      plyr.reset(500,300);
      plyr.revive();
    } else {
      console.log('Invalid respawnPlayer: ${id}');
    }

};

export const createGroup = data => {

  // TODO: do something with data?

  const group = game.add.group();

  return {
    add: obj => {
      group.add(physics.enablePhysics(createRect(obj), 'wall'));
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

export const destroy = () => {
  game.destroy();
};

// Get the index of the first available bullet
const availableBullet = () => {
  const start = player.index * options.maxBulletsPerPlayer;
  for (let i = 0; i < options.maxBulletsPerPlayer; i++) {
    const bullet = bullets.getAt(start + i);
    if (!bullet.exists) {
      return i;
    }
  }

  throw new Error('No cached bullets are available');
};

game.state.add('Play', {
  // preload, 
  // create: () => {
  //   game.paused = true;
  //   // generateTextures();
  // },

  render: DEV ? () => {
    game.debug.start(20, 20, 'white');
    game.debug.line(`FPS: ${game.time.fps}`);
    game.debug.line();
    game.debug.line('Players:');
    for (let i = 0, ids = Object.keys(players); i < ids.length; i++) {
      const id = ids[i],
            plyr = players[id];
      game.debug.line(`${i + 1}) id=${id}, x=${Math.round(plyr.x)}, y=${Math.round(plyr.y)}`);
    }
    game.debug.line();
    game.debug.line(`Bullets Shot: ${bulletsShot}`);
    game.debug.stop();
    // game.debug.cameraInfo(game.camera, 20, 400);
  } : undefined,

  update: () => {
    
    if (!player) {
      console.log('Bad update');
      return;
    }

    // TEMP
    game.camera.focusOn(player);
  
    // Rotate left and right
    if (input.left.isDown && input.right.isDown) {
      player.body.setZeroRotation();
    } else if (input.left.isDown) {
      player.body.rotateLeft(50);
    } else if (input.right.isDown) {
      player.body.rotateRight(50);
    } else {
      player.body.setZeroRotation();
    }
  
    // Move forward and backward
    if (input.up.isDown) {
      player.body.thrust(SPEED);
    } else if (input.down.isDown) {
      player.body.reverse(SPEED);
    }

    // Point turret at mouse pointer
    let angle = game.physics.arcade.angleToPointer(player);
    player.turret.rotation = angle - player.rotation;
    
    if (game.input.activePointer.isDown && // mouse pressed
      bulletsShot < options.maxBulletsPerPlayer && // there's an available bullet
      game.time.now > nextFire) { // fire rate has serpassed

      nextFire = game.time.now + FIRE_RATE;
      
      const data = {
        x: player.x + (GUN_LENGTH * Math.cos(angle)),
        y: player.y + (GUN_LENGTH * Math.sin(angle)),
        angle: angle + (Math.PI * 0.5),
        speed: BULLET_SPEED,
        index: availableBullet(),
      };

      sendShoot(data);

      bulletsShot++;
    }

    // TODO: update slower???
    sendUpdate({
      x: player.x,
      y: player.y,
      vx: player.body.velocity.x,
      vy: player.body.velocity.y,
      angle: player.rotation,
      vangle: player.body.angularVelocity,
      turret: player.turret.rotation,
    });
  },
});
game.state.start('Play');
