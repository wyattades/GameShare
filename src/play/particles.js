/* global Phaser */
import * as physics from './physics';
import * as EmitterTypes from './emitterTypes';

const _makeParticleBitmap = (game, size, fill, type) => {
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
  emitter.data.particles = [];
  emitter.data.nParticles = 0; // Number of active particles.
  emitter.data.sinceEmit = 0; // ms since last particle creation.
  emitter.data.collisionGroup = game.physics.p2.createCollisionGroup();
  emitter.data.lifetime = 0;
  
  // option defaults
  emitter.data.maxParticles = 10;
  emitter.data.particleFrequency = 0; // Number of ms between particles.
  emitter.data.selfCollision = false;
  emitter.data.maxLifetime = 1000;
  
  // Particles are made with values returned from these functions.
  emitter.data.pPos = () => ((Math.random() * 20) - 10); // Used for both x and y.
  emitter.data.pSize = () => (Math.random() * 20); // Width and height, or radius.
  emitter.data.pFill = () => '#00FF00';
  
  // Replace defaults with options, if given.
  if (dataOptions) Object.assign(emitter.data, dataOptions);
  
  // Return true if not at particle limit.
  emitter.canEmitParticle = () => (emitter.data.nParticles < emitter.data.maxParticles);
  
  // Create a particle.
  emitter.emitParticle = () => {
    emitter.data.sinceEmit = 0;
    emitter.data.nParticles++;
    
    const pbmd = _makeParticleBitmap(game,
      emitter.data.pSize(),
      emitter.data.pFill(),
      'rect');
    const particle = game.make.sprite(emitter.data.pPos(), emitter.data.pPos(), pbmd);
    particle.data.lifetimeMS = 0;
    particle.data.lifetimeMax = 4000;
    particle.data.finished = false; // Mark for deletion
    
    // Initialize physics on particle.
    physics.enablePhysics(particle, 'particle');
    particle.body.setCollisionGroup(emitter.data.collisionGroup);
    if (emitter.data.selfCollision) {
      particle.body.collides(emitter.data.collisionGroup);
    }
    particle.body.angle = Math.random() * 360;
    particle.body.thrust(1000);
    
    // Per-loop update function for particles, called by emitter object.
    particle.update = (elapsedMS) => {
      particle.data.lifetimeMS += elapsedMS;
      if (particle.data.lifetimeMS >= particle.data.lifetimeMax) {
        particle.data.finished = true;
      }
      return particle.data.finished;
    };
    
    emitter.addChild(particle);
  };
  
  emitter.update = () => {
    emitter.data.sinceEmit += game.time.elapsedMS;
    
    while (emitter.data.sinceEmit >= emitter.data.particleFrequency
        && emitter.canEmitParticle()) {
      emitter.data.sinceEmit -= emitter.data.particleFrequency;
      emitter.emitParticle();
    }
    
    
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

export const addEmitter = (game, x, y, template = null) => {
  switch (template) {
    case 'burst': return _addEmitter(game, x, y, EmitterTypes.burst);
    default: return _addEmitter(game, x, y);
  }
};