/* global Phaser */

let materials = {};
let physics;

export const init = game => {
  game.physics.startSystem(Phaser.Physics.P2JS);
  
  physics = game.physics.p2;

  materials.player = physics.createMaterial();
  materials.wall = physics.createMaterial();
  materials.bullet = physics.createMaterial();

  physics.createContactMaterial(materials.wall, materials.bullet, { friction: 0, restitution: 1.0 });
};

export const enablePhysics = (obj, type) => {
  
  if (!obj.body) physics.enable(obj);

  switch (type) {

    case 'player':
      obj.body.static = false;
      obj.body.damping = 0.98;
      break;

    case 'bullet':
      obj.body.static = false;
      obj.body.mass = 0.1;
      obj.body.damping = 0;
      break;

    case 'wall':
      obj.body.static = true;
      break;

    default:
      throw new Error('Invalid type in enablePhysics()');
  }

  obj.body.setMaterial(materials[type]);
};
