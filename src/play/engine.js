/* eslint-disable */
import 'expose-loader?PIXI!phaser-ce/build/custom/pixi.js';
import 'expose-loader?p2!phaser-ce/build/custom/p2.js';
import 'expose-loader?Phaser!phaser-ce/build/custom/phaser-split.js'; /* global Phaser */
/* eslint-enable */

import { sendUpdate, sendShoot, sendHit, sendSpike, respawnPlayer } from './client';
import { intToHex } from '../utils/helpers';
import * as physics from './physics';
import * as particles from './particles';
import '../assets/gamepad.png';
import './gamepad';

const DEV = process.env.NODE_ENV === 'development';
let devToggle;

const { Game, KeyCode } = Phaser;

// Object hashmaps
let playerMap = {};
const textures = {};

// Phaser objects
let input,
    player,
    bullets,
    boundary,
    players,
    gamepad;

// Game options
let options;

// Player weapon variables
let nextFire = 0,
    bulletsShot = 0,
    respawn_timer = 4000;

const GUN_LENGTH = 48;
const GUN_BODY_RATIO = 0.25;
const INVUL_TIME = 1000;
const INVUL_COLOR = 0xFF0000;
let player_color = {};

const parent = document.getElementById('root');
// const grandParent = parent.parentElement;

// Game instance
let game;

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


// Creates and returns a new Sprite wall object.
const createWall = ({
  x, y, w = 1, h = 1, fill, stroke, objId, shape = 'rect',
  damage = 0, health = 0, curhp = 0,
}) => {
  x += w / 2;
  y += h / 2;
  
  // Create bitmap graphic.
  // Based on example at: https://phaser.io/examples/v2/sprites/sprite-from-bitmapdata
  const bmd = game.add.bitmapData(w, h);
  bmd.ctx.beginPath();
  if (shape === 'ellipse') {
    bmd.ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  }
  if (shape === 'rect') {
    bmd.ctx.rect(0, 0, w, h);
  }
  bmd.ctx.strokeStyle = intToHex(stroke);
  bmd.ctx.fillStyle = intToHex(fill);
  bmd.ctx.fill();
  
  const sprite = game.add.sprite(x, y, bmd);
  sprite.data.id = objId;
  sprite.shape = shape;
  sprite.w = w;
  sprite.h = h;
  // TODO: destructible variables should be defined by group, not the color red.

  sprite.data.destructible = health > 0;
  if (sprite.data.destructible) {
    sprite.maxHealth = health;
    sprite.setHealth(curhp);
    if (sprite.health <= 0) sprite.kill();
  }
  sprite.data.spike = damage > 0;
  if (sprite.data.spike) {
    sprite.damage = damage;
  }
  
  
  return sprite;
};

function toggleInvul(id) {
  const plyr = playerMap[id];
  if (plyr) {
    plyr.invul = !plyr.invul;
    if (plyr.invul) {
      player_color[id] = plyr.tint;
      plyr.tint = INVUL_COLOR;
    } else {
      plyr.tint = player_color[id];
    }
  }
}

export function serverToggleInvul(id) {
  toggleInvul(id);
  game.time.events.add(INVUL_TIME, toggleInvul, this, id).autoDestroy = true;
}

const generateTextures = () => {

  if (Phaser.Plugin.VirtualGamepad) {
    game.load.spritesheet('gamepad', '/public/assets/gamepad.png', 100, 100);
  }

  // Create textures from temporary graphics objects
  const createTexture = (graphic, name) => {
    textures[name] = graphic.generateTexture();
    graphic.destroy();
  };

  const w = 50,
        h = 60;
  const playerGraphic = game.add.graphics(0, 0);
  playerGraphic.beginFill(0xFFFFFF);
  playerGraphic.lineStyle(1, 0x000000, 1);
  playerGraphic.drawRect(-w / 2, -h / 2, w, h);
  playerGraphic.endFill();
  createTexture(playerGraphic, 'player');

  const turretGraphic = game.add.graphics(0, 0);
  turretGraphic.beginFill(0xCCCCCC);
  turretGraphic.drawRect(0, -4, GUN_LENGTH, 8);
  const radius = (GUN_LENGTH * GUN_BODY_RATIO) / (1 - GUN_BODY_RATIO);
  turretGraphic.drawEllipse(0, 0, radius, radius);
  turretGraphic.endFill();
  createTexture(turretGraphic, 'turret');

  const bulletGraphic = game.add.graphics(0, 0);
  bulletGraphic.beginFill(0xFFFF00);
  bulletGraphic.drawTriangle([
    new Phaser.Point(0, -8),
    new Phaser.Point(-4, 3),
    new Phaser.Point(4, 3),
  ]);
  bulletGraphic.endFill();
  createTexture(bulletGraphic, 'bullet');
};

const create = (focusX, focusY) => {

  window.addEventListener('resize', () => {
    game.scale.setGameSize(parent.clientWidth, parent.clientHeight);
  });

  // Setup game properties
  game.paused = true;
  game.stage.disableVisibilityChange = true;
  game.stage.backgroundColor = intToHex(options.backgroundColor);
  physics.init(game);

  if (DEV) {

    const setDev = state => {
      devToggle = state;

      game.time.advancedTiming = devToggle;
      if (devToggle) {
        game.fpsProblemNotifier.add(msg => console.log(`FPS problems: ${msg}`));
      } else {
        game.debug.reset();
        game.fpsProblemNotifier.removeAll();
      }

    };

    setDev(true);

    const toggleButton = createRect({
      x: 10,
      y: 10,
      w: 100,
      h: 24,
      fill: 0xEEEEEE,
    });
    toggleButton.inputEnabled = true;
    toggleButton.events.onInputDown.add(() => setDev(!devToggle));
    toggleButton.addChild(game.add.text(-43, -10, 'Toggle Dev', { stroke: 0x000000, fontSize: 16 }));
    game.stage.addChild(toggleButton);
  }

  // Reset player map
  playerMap = {};

  // Create cached players
  players = game.add.group();
  players.createMultiple(options.maxPlayers, textures.player, 0, false, (plyr, i) => {
    // Enable physics
    physics.enablePhysics(plyr, 'player');

    // Create turret sprite
    const turret = game.add.sprite(0, 0, textures.turret);
    turret.anchor.set(GUN_BODY_RATIO, 0.5);
    plyr.addChild(turret);

    // Store reference to turret in player
    plyr.turret = turret;

    // Custom variables
    plyr.index = i;
    plyr.id = null;
  });

  // Create cached bullets
  bullets = game.add.group();
  bullets.createMultiple(options.maxPlayers * options.maxBulletsPerPlayer, textures.bullet, 0, false, (bullet) => {
    // Enable physics and check for collisions
    physics.enablePhysics(bullet, 'bullet');
    bullet.data.damage = options.bulletDamage;
    physics.collideEnd(bullet, collider => {
      if (collider.name === 'wall' && bullet.health > 0) {

        // Point bullet towards velocity
        const { mx, my } = bullet.body.velocity;
        bullet.body.rotation = Math.atan2(my, mx) - (Math.PI / 2);
        bullet.body.angularVelocity = 0;
      }
    });
  });

  const { x, y, w, h } = options.bounds;

  game.world.setBounds(0, 0, w + (x * 2), h + (y * 2));

  boundary = createRect({ x, y, w, h, stroke: 0x00FFFF });
  physics.enablePhysics(boundary, 'boundary');


  game.camera.focusOnXY(focusX, focusY);

  if (Phaser.Plugin.VirtualGamepad) {
    // Handle joystick inputs on mobile
    gamepad = game.plugins.add(Phaser.Plugin.VirtualGamepad);
    input = gamepad.addJoystick(120, game.height - 120, 1.2, 'gamepad').properties;
    gamepad.addJoystick(game.width - 120, game.height - 120, 1.2, 'gamepad');
    // let mouse = gamepad.addJoystick(300, 420, 1.2, 'gamepad').properties;
  } else {
    // Handle WASD keyboard inputs
    input = game.input.keyboard.addKeys({
      up: KeyCode.W,
      left: KeyCode.A,
      down: KeyCode.S,
      right: KeyCode.D,
    });
  }

  return Promise.resolve();
};

export const addPlayer = (id, data) => {
  if (playerMap.hasOwnProperty(id)) {
    console.log(`Invalid addPlayer: ${id}`);
  } else {

    const { x, y, color } = data;
    const { width, height } = textures.player;

    const plyr = players.getFirstExists(false, false, x + (width / 2), y + (height / 2));
    plyr.tint = color;
    plyr.turret.tint = color;

    // Store player id
    plyr.id = id;
    // Store player reference
    playerMap[id] = plyr;

    // Bring joystick to top
    if (gamepad) {
      game.world.bringToTop(gamepad.group);
    }

  }
};

export const removePlayer = id => {
  const plyr = playerMap[id];

  if (plyr) {
    // Kill all of the player's bullets when they disconnect
    const start = plyr.index * options.maxBulletsPerPlayer;
    for (let i = 0; i < options.maxBulletsPerPlayer; i++) {
      bullets.getAt(start + i).kill();
    }

    // Despawn player
    plyr.id = null;
    plyr.kill();
    delete playerMap[id];

  } else {
    console.log(`Invalid removePlayer: ${id}`);
  }
};

export const updatePlayer = (id, data) => {

  const plyr = playerMap[id];

  if (plyr) {
    plyr.body.x = data.x;
    plyr.body.y = data.y;
    plyr.body.rotation = data.angle;
    plyr.body.velocity.x = data.vx;
    plyr.body.velocity.y = data.vy;
    plyr.body.angularVelocity = data.vangle;
    plyr.turret.rotation = data.turret;
    plyr.score = data.score;
    plyr.username = data.username;
  } else {
    console.log(`Invalid updatePlayer: ${id}`);
  }
};

export const updateSelf = (id, data) => {
  const plyr = playerMap[id];

  if (plyr) {
    //  plyr.score = data.score;
    plyr.username = data.username;
  } else {
    console.log(`Invalid updateSelf: ${id}`);
  }
};

export const updateScore = id => {
  let scores = [],
      text = '';
  for (let i = 0, ids = Object.keys(playerMap); i < ids.length; i++) {
    const plyrId = ids[i],
          plyr = playerMap[plyrId];
    scores.push({
      plyrId,
      username: plyr.username,
      score: plyr.score,
    });
  }
  scores.sort((a, b) => b.score - a.score);

  for (let i = 0; i < scores.length; i++) {
    const plyr = scores[i];
    text = text.concat(`<div class="scoreboard-item"><span>${i + 1}. ${plyr.username}</span>\
      <span>${plyr.score}</span></div>`);
  }
  document.getElementById('scoreboard').innerHTML = text;
};

export const initUser = id => {
  player = playerMap[id];
  player.score = 0;
  
  // Make a burst animations when a bullet hits something.
  const createBulletDeathEffect = (bullet) => {
    particles.addEmitter(game, bullet.x, bullet.y, 'bullet-hit', { angle: bullet.body.angle, strength: 10 });
  };
  const createBulletBounceEffect = (bullet) => {
    particles.addEmitter(game, bullet.x, bullet.y, 'bullet-hit', { angle: bullet.body.angle, strength: 3 });
  };

  const onCollideStart = (bullet, i) => (collider) => {
    // Kill on bullet or player collision
    if (collider.name === 'player') {
      console.log(`Player hit: ${collider.id}`);
      bullet.kill();
      if (collider.id === id) {
        player.score--;
      } else {
        player.score++;
      }
      const plyr = playerMap[collider.id];
      sendHit({
        index: i,
        player: collider.id,
        invul: plyr.invul,
        damage: bullet.data.damage || 1,
      });
    } else if (collider.name === 'bullet') {
      // We don't immediately kill the bullet here because we want to make sure
      // the other client's bullet detects the collision as well
      sendHit({
        index: i,
      });
    } else if (collider.name === 'wall') { // Bounce off walls until no health
      
      if (collider.data.destructible) bullet.health = 0; // No bouncing off destructible walls
      
      bullet.health--;
      createBulletBounceEffect(bullet);
      if (bullet.health <= 0) {
        bullet.kill();
        sendHit({
          index: i,
          wall_id: collider.data.destructible ? collider.data.id : null,
          damage: bullet.data.damage || 1,
        });
      }
    } else if (collider.name === 'spike') { // Bounce off walls until no health
      bullet.health--;
      if (bullet.health <= 0) {
        bullet.kill();
      }
    }
  };

  const allowBullet = () => {
    bulletsShot = Math.max(0, bulletsShot - 1);
  };
  
  const start = player.index * options.maxBulletsPerPlayer;
  for (let i = 0; i < options.maxBulletsPerPlayer; i++) {

    const bullet = bullets.getAt(start + i);

    physics.collideStart(bullet, onCollideStart(bullet, i));

    bullet.events.onKilled.add(allowBullet);
    bullet.events.onKilled.add(createBulletDeathEffect);
  }

  // TODO: sometimes camera doesn't set the player as its target
  game.camera.follow(player);

  return Promise.resolve();
};

export const removeBullet = (id, data) => {
  if (data.index === null) return;
  const { index } = data;

  if (!playerMap.hasOwnProperty(id) || typeof index !== 'number' || index >= options.maxBulletsPerPlayer) {
    throw new Error(`Invalid id (${id}) or index (${index}) in removeBullet()`);
  }

  const bullet = bullets.getAt((playerMap[id].index * options.maxBulletsPerPlayer) + index);

  if (bullet.exists) bullet.kill();
};

export const addBullet = (id, data) => {

  const { x, y, angle, speed, index } = data;

  if (!playerMap.hasOwnProperty(id) || typeof index !== 'number' || index >= options.maxBulletsPerPlayer) {
    throw new Error(`Invalid id (${id}) or index (${index}) in addBullet()`);
  }

  const bullet = bullets.getAt((playerMap[id].index * options.maxBulletsPerPlayer) + index);
  bullet.reset(x, y, options.bulletHealth); // health - 1 = number of bounces before dying

  bullet.body.rotation = angle;
  bullet.body.thrust(speed);
  
  // Create particle effect.
  particles.addEmitter(game, bullet.x, bullet.y, 'shot-short', { angle: bullet.body.angle });
};

// Returns the object with the given custom id.
// Currently naive O(n) implementation, checks every object for id.
const getObjectById = desired_id => {
  // TODO: needs optimization -- which groups are our objects?
  let groups = game.world.children;
  for (let i = 0, l = groups.length; i < l; i++) {
    for (let obj_index = 0; obj_index < groups[i].children.length; obj_index++) {
      let obj = groups[i].children[obj_index];
      if (obj.data.id === desired_id) return obj;
    }
  }
  return null;
};

// Called on bullet_hit. Checks for and handles destructible wall damage.
export const damageWall = data => {
  if (data.wall_id === null) return;
  
  let wall = getObjectById(data.wall_id);
  if (wall.data.destructible) {
    wall.damage(data.damage);
    wall.alpha = Math.min(wall.health / wall.maxHealth, 0.5); // Visual damage indication
  }
};

function respawn(id) {
  const plyr = playerMap[id];
  plyr.reset(boundary.left + (Math.random() * boundary.width), boundary.top + (Math.random() * boundary.height));
  respawnPlayer({});
}

export const despawnPlayer = ({ player: id }) => {
  const plyr = playerMap[id];
  if (plyr) {
    particles.addEmitter(game, plyr.x, plyr.y, 'tank-burst', { color: plyr.tint });
    particles.addEmitter(game, plyr.x, plyr.y, 'smoke');
    plyr.kill();
    game.time.events.add(respawn_timer, respawn, this, id).autoDestroy = true;
  } else {
    console.log(`Invalid despawnPlayer: ${id}`);
  }
};

export const createGroup = () => {

  // TODO: do something with group data?

  const group = game.add.group();

  return {
    add: obj => {
      const wall = createWall(obj);
      physics.enablePhysics(wall, 'wall');
      if (obj.damage > 0) {
        physics.collideStart(wall, collider => {
          if (collider.name === 'player') {
            console.log(`Player hit: ${collider.id}`);
            const plyr = playerMap[collider.id];
            if (!plyr.invul) {
              sendSpike({
                player: collider.id,
                invul: false,
                dmg: obj.damage,
              });
            } else {
              sendSpike({
                player: collider.id,
                invul: true,
                dmg: obj.damage,
              });
            }
          }
        });
      }
      group.add(wall);
    },

    // TODO: is this necessary?
    // remove: obj => {
    // },
  };
};

export const pause = () => {
  game.paused = true;
};

export const resume = () => {
  game.paused = false;
};

export const destroy = () => {
  if (game && game.isBooted) game.destroy();
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

  console.error('No cached bullets are available!');
  return -1;
};

const render = DEV ? () => {
  if (devToggle) {
    game.debug.start(20, 50, 'white');
    game.debug.line(`FPS: ${game.time.fps}`);
    game.debug.line();
    game.debug.line('Players:');
    let scores = [];
    for (let i = 0, ids = Object.keys(playerMap); i < ids.length; i++) {
      const id = ids[i],
            plyr = playerMap[id];
      game.debug.line(`${i + 1}) id=${id}, x=${Math.round(plyr.x)}, y=${Math.round(plyr.y)} score = ${plyr.score}`);
      scores.push({
        id,
        username: plyr.username,
        score: plyr.score,
      });
    }
    game.debug.line();
    game.debug.line('Score:');

    scores.sort((a, b) => b.score - a.score);

    for (let i = 0; i < scores.length; i++) {
      const plyr = scores[i];
      game.debug.line(`${i + 1}) ${plyr.username} ${plyr.score}`);
    }

    game.debug.line(`Bullets Shot: ${bulletsShot}`);
    game.debug.stop();
    // game.debug.cameraInfo(game.camera, 20, 400);
  }
} : undefined;

const update = () => {

  if (!player) {
    console.log('Bad update');
    return;
  }

  let turretAngle = null;

  const turretJoystick = gamepad && gamepad.joysticks[1].joystick.properties;

  if (gamepad) {
    if (input.inUse) {

      let deltaAngle = player.body.rotation - Math.PI * 0.5 - input.rotation;
      if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
      if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

      if (Math.abs(deltaAngle) > 0.1) {
        deltaAngle > 0 ? player.body.rotateLeft(50) : player.body.rotateRight(50);
      } else {
        player.body.setZeroRotation();
        player.body.thrust(options.playerSpeed * Math.min(100, input.distance) * 0.01);
      }
    } else {
      player.body.setZeroRotation();
    }

    if (turretJoystick.inUse) {
      turretAngle = turretJoystick.rotation;
    }

  } else {

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
      player.body.thrust(options.playerSpeed);
    } else if (input.down.isDown) {
      player.body.reverse(options.playerSpeed);
    }
  
    // Point turret at mouse pointer
    turretAngle = game.physics.arcade.angleToPointer(player);
  }

  if (turretAngle !== null) {
    player.turret.rotation = turretAngle - player.rotation;
  }
  
  if (player.alive && // Player alive
    (turretJoystick ? turretJoystick.distance > 20 : game.input.activePointer.isDown) && // mouse pressed
    bulletsShot < options.maxBulletsPerPlayer && // there's an available bullet
    game.time.now > nextFire) { // fire rate has serpassed

    nextFire = game.time.now + options.fireRate;
    bulletsShot++;

    const data = {
      x: player.x + (GUN_LENGTH * Math.cos(turretAngle)),
      y: player.y + (GUN_LENGTH * Math.sin(turretAngle)),
      angle: turretAngle + (Math.PI * 0.5),
      speed: options.bulletSpeed,
      index: availableBullet(),
    };

    sendShoot(data);
  }

  // TODO: user Phaser timer instead?
  // Send update to server 10 times per second
  if (!game.lastServerUpdate || game.time.time - game.lastServerUpdate >= 100) {
    game.lastServerUpdate = game.time.time;

    sendUpdate({
      x: player.x,
      y: player.y,
      vx: player.body.velocity.x,
      vy: player.body.velocity.y,
      angle: player.rotation,
      vangle: player.body.angularVelocity,
      turret: player.turret.rotation,
      score: player.score,
      username: player.username,
      invul: player.invul,
    });
  }
};

export const setup = (gameOptions, focusX, focusY) => new Promise((resolve) => {

  game = new Game({
    width: parent.clientWidth,
    height: parent.clientHeight,
    parent,
    // transparent: true,
  });
  if (DEV) window.GAME = game;

  game.state.add('Play', {
    preload: generateTextures,
    create: () => create(focusX, focusY).then(resolve),
    update,
    render,
  });
  game.state.start('Play');

  options = gameOptions;
});
