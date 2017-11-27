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

const enableParticlePhysics = (particle) => {
  physics.enablePhysics(particle, 'particle');
};


export const addEmitter = (game, x, y) => {
  const sprite = game.add.sprite(x, y, null);
  
  sprite.data.particles = [];
  sprite.data.nParticles = 0;
  sprite.data.maxParticles = 10;
  sprite.data.particleFrequency = 100; // How many ms between emissions?
  sprite.data.sinceEmit = 0;
  sprite.data.deleteMe = false;
  
  // Build a particle sprite
  sprite.emitParticle = () => {
    if (sprite.data.nParticles >= sprite.data.maxParticles) return;
    sprite.data.sinceEmit = 0;
    sprite.data.nParticles++;
    
    const pbmd = makeParticleBitmap(game);
    const particle = game.make.sprite((Math.random() * 20) - 10, (Math.random() * 20) - 10, pbmd);
    particle.data.lifetimeMS = 0;
    particle.data.lifetimeMax = 4000;
    
    // Per-loop update function for particles, called by emitter object.
    particle.update = (elapsedMS) => {
      particle.data.lifetimeMS += elapsedMS;
      if (particle.data.lifetimeMS >= particle.data.lifetimeMax) {
        particle.data.deleteMe = true;
      }
      return particle.data.deleteMe;
    };
    
    enableParticlePhysics(particle);
    
    sprite.addChild(particle);
  };
  
  sprite.update = () => {
    
    sprite.data.sinceEmit += game.time.elapsedMS;
    if (sprite.data.sinceEmit >= sprite.data.particleFrequency) {
      sprite.data.sinceEmit = 0;
      sprite.emitParticle();
    }
    
    for (let i = 0, l = sprite.children.length; i < l; i++) {
      const particle = sprite.children[i];
      const isFinished = particle.update(game.time.elapsedMS);
      if (isFinished) {
        particle.destroy();
        sprite.data.nParticles--;
        l--;
      }
    }
  };
  
  return sprite;
};
