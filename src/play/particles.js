/* global Phaser */
import * as physics from './physics';

const makeParticleBitmap = (game, w = 10, h = 10) => {
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
  emitter.data.nParticles = 0;
  emitter.data.maxParticles = 10;
  emitter.data.particleFrequency = 100; // How many ms between emissions?
  emitter.data.sinceEmit = 0;
  emitter.data.deleteMe = false;
  
  emitter.data.collisionGroup = game.physics.p2.createCollisionGroup();
  emitter.data.selfCollision = false;
  
  // Build a particle emitter
  emitter.emitParticle = () => {
    if (emitter.data.nParticles >= emitter.data.maxParticles) return;
    emitter.data.sinceEmit = 0;
    emitter.data.nParticles++;
    
    const pbmd = makeParticleBitmap(game);
    const particle = game.make.sprite((Math.random() * 20) - 10, (Math.random() * 20) - 10, pbmd);
    particle.data.lifetimeMS = 0;
    particle.data.lifetimeMax = 4000;
    
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
        particle.data.deleteMe = true;
      }
      return particle.data.deleteMe;
    };
    
    emitter.addChild(particle);
  };
  
  emitter.update = () => {
    
    emitter.data.sinceEmit += game.time.elapsedMS;
    if (emitter.data.sinceEmit >= emitter.data.particleFrequency) {
      emitter.data.sinceEmit = 0;
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
