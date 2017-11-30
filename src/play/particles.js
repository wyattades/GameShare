/* global Phaser */
import * as physics from './physics';

const randomInt = (min, max) => Math.round((Math.random() * (max - min)) + min);

const makeParticleBitmap = (game, size, fill, type) => {
  if (size < 1) size = 1;
  let w = size,
      h = size;
  const bmd = game.add.bitmapData(w, h);
  if (type === 'rect') {
    bmd.rect(0, 0, w, h, fill);
  } else if (type === 'circle') {
    bmd.circle(w / 2, h / 2, size / 2, fill);
  }
  return bmd;
};

// Create and add an emitter to the game. An emitter is an extended sprite used for particle effects.
// dataOptions is an object holding modifications to the emitter's data object.
const _addEmitter = (game, x, y, dataOptions = null) => {
  const emitter = game.add.sprite(x, y, null);
  
  // setup
  emitter.data.nParticlesCurrent = 0; // Number of active particles.
  emitter.data.nParticlesTotal = 0; // Total number of particles made.
  emitter.data.sinceEmit = 0; // ms since last particle creation.
  emitter.data.collisionGroup = game.physics.p2.createCollisionGroup();
  emitter.data.lifetime = 0;
  
  // Emitter default options.
  emitter.data.nParticlesCurrentMax = 10; // Maximum number of concurrent particles.
  emitter.data.nParticlesTotalMax = 500; // Maximum number of particles to make.
  emitter.data.particleFrequency = 0; // Number of ms between particles.
  emitter.data.collisions = false;
  emitter.data.lifetimeMax = 1000;
  
  // Particle default options.
  // Particles are made with values returned from these functions.
  emitter.data.pType = 'circle';
  emitter.data.pLifetimeMax = () => 4000;
  emitter.data.pPos = () => randomInt(-10, 10); // Offset from emitter position, called for both x and y.
  emitter.data.pSize = () => randomInt(1, 10); // Width and height, or radius.
  emitter.data.pFill = () => '#00FF00';
  // Physics
  emitter.data.pMass = () => 0.1;
  emitter.data.pAngle = () => randomInt(0, 360);
  emitter.data.pThrust = () => 1000;
  emitter.data.pDamping = () => 0.5;
  
  
  // Replace defaults with options, if given.
  if (dataOptions) Object.assign(emitter.data, dataOptions);
  
  // Create a particle.
  emitter.emitParticle = () => {
    emitter.data.sinceEmit = 0;
    emitter.data.nParticlesCurrent++;
    emitter.data.nParticlesTotal++;
    
    const pbmd = makeParticleBitmap(game,
      emitter.data.pSize(),
      emitter.data.pFill(),
      'circle');
    const particle = game.make.sprite(emitter.data.pPos(), emitter.data.pPos(), pbmd);
    particle.data.lifetime = 0;
    particle.data.lifetimeMax = emitter.data.pLifetimeMax();
    particle.data.finished = false; // Mark for deletion
    
    // Initialize physics on particle.
    physics.enablePhysics(particle, 'particle');
    if (!emitter.data.collisions) {
      particle.body.setCollisionGroup(emitter.data.collisionGroup);
    }
    particle.body.angle = emitter.data.pAngle();
    particle.body.thrust(emitter.data.pThrust());
    particle.body.mass = emitter.data.pMass();
    particle.body.damping = emitter.data.pDamping();
    
    // Per-loop update function for particles, called by emitter object.
    particle.update = (elapsedMS) => {
      particle.data.lifetime += elapsedMS;
      if (particle.data.lifetime >= particle.data.lifetimeMax) {
        particle.data.finished = true;
      }
      return particle.data.finished;
    };
    
    emitter.addChild(particle);
  };

  // Return true if not at particle limit and the timer is ready.
  emitter.shouldEmitParticle = () => (
    (emitter.data.nParticlesCurrent < emitter.data.nParticlesCurrentMax) &&
    (emitter.data.sinceEmit >= emitter.data.particleFrequency) &&
    (emitter.data.nParticlesTotal < emitter.data.nParticlesTotalMax));
  
  // Update, called automatically by phaser in game loop.
  emitter.update = () => {
    emitter.data.lifetime += game.time.elapsedMS;
    emitter.data.sinceEmit += game.time.elapsedMS;

    if (emitter.data.lifetime < emitter.data.lifetimeMax) {
      // Emitter is alive, so try to make new particles.
      while (emitter.shouldEmitParticle()) {
        emitter.data.sinceEmit -= emitter.data.particleFrequency;
        emitter.emitParticle();
      }
    } else if (emitter.data.nParticlesCurrent === 0) {
      // Emitter is dead and remaining particles have self-destructed.
      emitter.destroy();
    }
    
    // Update particles.
    for (let i = 0, l = emitter.children.length; i < l; i++) {
      const particle = emitter.children[i];
      const isFinished = particle.update(game.time.elapsedMS);
      if (isFinished) {
        particle.destroy();
        emitter.data.nParticles--;
        l--;
      }
    }
  };
  
  return emitter;
};

const intToHex = int => {
  const hexString = `000000${((int) >>> 0).toString(16)}`.slice(-6);
  return `#${hexString}`;
};

// Create a particle emitter. Contains emitter template definitions.
export const addEmitter = (game, x, y, template = null, data = {}) => {
  let options = {};
  switch (template) {
    case 'bullet-burst':
      // Create a burst of yellow particles in the opposite direction of data.angle.
      if (data.angle === undefined) {
        throw new Error('addEmitter(): Cannot make an angled particle emitter without data.angle.');
      }
      const reversedAngle = Phaser.Math.radToDeg(Phaser.Math.reverseAngle(Phaser.Math.degToRad(data.angle)));
      options.nParticlesCurrentMax = 8;
      options.nParticlesTotalMax = 8;
      options.particleFrequency = 0;
      
      options.pLifetimeMax = () => 100;
      options.pPos = () => 0;
      options.pSize = () => randomInt(2, 4);
      options.pFill = () => 'rgba(255, 255, 0, 1)';
      
      options.pMass = () => 0.1;
      options.pAngle = () => reversedAngle + randomInt(-35, 35);
      options.pThrust = () => randomInt(1500, 2500);
      options.pDamping = () => 0.5;
      break;
      
    case 'bullet-bounce':
      // Create a burst of yellow particles in the opposite direction of data.angle.
      if (data.angle === undefined) {
        throw new Error('addEmitter(): Cannot make an angled particle emitter without data.angle.');
      }
      const reversedAngle_ = Phaser.Math.radToDeg(Phaser.Math.reverseAngle(Phaser.Math.degToRad(data.angle)));
      options.nParticlesCurrentMax = 3;
      options.nParticlesTotalMax = 3;
      options.particleFrequency = 0;
      
      options.pLifetimeMax = () => 100;
      options.pPos = () => 0;
      options.pSize = () => 2;
      options.pFill = () => 'rgba(255, 255, 0, 1)';
      
      options.pMass = () => 0.1;
      options.pAngle = () => reversedAngle_ + randomInt(-35, 35);
      options.pThrust = () => randomInt(1500, 2500);
      options.pDamping = () => 0.5;
      break;
        
    case 'tank-burst':
      // Creates a large burst of particles with color equal to data.color.
      if (data.color === undefined) {
        throw new Error('addEmitter(): Cannot make a tank-burst without data.color.');
      }
      options.nParticlesCurrentMax = 30;
      options.nParticlesTotalMax = 30;
      options.particleFrequency = 0;
      
      options.pLifetimeMax = () => 1000;
      options.pPos = () => 0;
      options.pSize = () => randomInt(5, 10);
      options.pFill = () => intToHex(data.color);
      
      options.pMass = () => 0.1;
      options.pAngle = () => randomInt(0, 360);
      options.pThrust = () => randomInt(1500, 2500);
      break;
      
    case 'shot-short':
      // Creates a quick blast of orange particles in the direction of data.angle.
      if (data.angle === undefined) {
        throw new Error('addEmitter(): Cannot make an angled particle emitter without data.angle.');
      }
      options.nParticlesCurrentMax = 10;
      options.nParticlesTotalMax = 10;
      options.particleFrequency = 0;
      
      options.pLifetimeMax = () => randomInt(50, 100);
      options.pPos = () => 0;
      options.pSize = () => randomInt(2, 10);
      options.pFill = () => 'rgba(255, 128, 0, 1)';
      
      options.pMass = () => 0.1;
      options.pAngle = () => data.angle + randomInt(-30, 30);
      options.pThrust = () => randomInt(1000, 2000);
      options.pDamping = () => 0;
      break;
    
    case 'smoke':
      // Rising smoke from a point.
      options.nParticlesCurrentMax = 200;
      options.nParticlesTotalMax = 1000;
      options.particleFrequency = 25;
      options.lifetimeMax = 1000;
      
      options.pLifetimeMax = () => randomInt(500, 1500);
      options.pPos = () => randomInt(-5, 5);
      options.pSize = () => randomInt(2, 15);
      options.pFill = () => `rgba(128, 128, 128, ${Math.random()})`;
      
      options.pMass = () => 0.1;
      options.pAngle = () => 0;
      options.pThrust = () => randomInt(500, 1000);
      break;
    
    default:
      break;
  }
  return _addEmitter(game, x, y, options);
};
