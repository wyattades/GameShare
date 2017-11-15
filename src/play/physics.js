/* global Phaser */

let materials = {};
let physics;

export const init = game => {
  game.physics.startSystem(Phaser.Physics.P2JS);
  
  physics = game.physics.p2;

  materials.player = physics.createMaterial();
  materials.wall = physics.createMaterial();
  materials.boundary = materials.wall;
  materials.bullet = physics.createMaterial();
  materials.spike = physics.createMaterial();

  physics.setImpactEvents(true);

  physics.createContactMaterial(materials.bullet, materials.wall, { friction: 0, restitution: 1.0 });
};

export const enablePhysics = (obj, type) => {
  
  if (!obj.body) physics.enable(obj);

  obj.name = type;

  switch (type) {

    case 'player':
      obj.body.damping = 0.98;
      break;

    case 'bullet':
      obj.body.mass = 0.1;
      obj.body.damping = 0;
      obj.body.setCircle(obj.width / 2);
      break;
	  
	case 'spike':
      obj.body.static = true;
      break;

    case 'wall':
      obj.body.static = true;
      obj.body.setRectangle(obj.width, obj.height);
      break;

    case 'boundary':
      obj.name = 'wall';
      obj.body.static = true;
      // obj.body.addRectangle(obj.width, obj.height);

      const w = obj.width,
            h = obj.height,
            // otherAngle = Math.PI / 2,
            thick = 50;
      
      obj.body.clearShapes();
      obj.body.addRectangle(w + (thick * 2), thick, 0, -(h / 2) - (thick / 2));
      obj.body.addRectangle(w + (thick * 2), thick, 0, (h / 2) + (thick / 2));
      obj.body.addRectangle(thick, h + (thick * 2), -(w / 2) - (thick / 2), 0);
      obj.body.addRectangle(thick, h + (thick * 2), (w / 2) + (thick / 2), 0);
      break;

    default:
      throw new Error('Invalid type in enablePhysics()');
  }

  obj.body.setMaterial(materials[type]);

  return obj;
};

export const collideStart = (obj, fn) => {
  obj.body.onBeginContact.add(body => {
    fn(body.sprite);
  });
};

export const collideEnd = (obj, fn) => {
  obj.body.onEndContact.add(body => {
    fn(body.sprite);
  });
};
