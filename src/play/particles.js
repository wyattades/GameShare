/* global Phaser */
import * as physics from './physics';

const makeParticleBitmap = (game, w = 5, h = 5) => {
  const bmd = game.add.bitmapData(w, h);
  bmd.ctx.beginPath();
  bmd.ctx.rect(0, 0, w, h);
  bmd.ctx.strokeStyle = '#00FF00'; // intToHex(stroke);
  bmd.ctx.fillStyle = '#00FF00'; // intToHex(fill);
  bmd.ctx.fill();
  return bmd;
};

export const addEmitter = (game, x, y) => {
  const emitter = game.add.sprite(x, y, null);
  
  emitter.data.particles = [];
  emitter.data.nParticles = 0; // number of active particles.
  emitter.data.maxParticles = 10;
  emitter.data.particleFrequency = 0; // How many ms between emissions?
  emitter.data.sinceEmit = 0;
  
  emitter.data.deleteMe = false;
  
  emitter.data.collisionGroup = game.physics.p2.createCollisionGroup();
  emitter.data.selfCollision = false;
  
  // Return true if not at particle limit.
  emitter.canEmitParticle = () => (emitter.data.nParticles < emitter.data.maxParticles);
  
  // Create a particle.
  emitter.emitParticle = () => {
    emitter.data.sinceEmit = 0;
    emitter.data.nParticles++;
    
    const pbmd = makeParticleBitmap(game);
    const particle = game.make.sprite((Math.random() * 20) - 10, (Math.random() * 20) - 10, pbmd);
    particle.data.lifetimeMS = 0;
    particle.data.lifetimeMax = 4000;
    particle.data.finished = false; // Mark for deletion
    
    // Initialize physics
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
