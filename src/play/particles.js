/* global Phaser */
import * as physics from './physics';

const _makeParticleBitmap = (game, size, fill, type) => {
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
  emitter.data.particles = [];
  emitter.data.nParticles = 0; // Number of active particles.
  emitter.data.nParticlesTotal = 0; // Total number of particles made.
  emitter.data.sinceEmit = 0; // ms since last particle creation.
  emitter.data.collisionGroup = game.physics.p2.createCollisionGroup();
  emitter.data.lifetime = 0;
  
  // Emitter default options.
  emitter.data.nParticlesMax = 10; // Maximum number of concurrent particles.
  emitter.data.nParticlesTotalMax = 500; // Maximum number of particles to make.
  emitter.data.particleFrequency = 0; // Number of ms between particles.
  emitter.data.selfCollision = false;
  emitter.data.lifetimeMax = 1000;
  
  // Particle default options.
  // Particles are made with values returned from these functions.
  emitter.data.pType = 'circle';
  emitter.data.pLifetimeMax = () => 4000;
  emitter.data.pPos = () => (Math.round((Math.random() * 20) - 10)); // Used for both x and y.
  emitter.data.pSize = () => (Math.round(Math.random() * 10)); // Width and height, or radius.
  emitter.data.pFill = () => '#00FF00';
  // Physics
  emitter.data.pMass = () => 0.1;
  emitter.data.pAngle = () => (Math.round(Math.random() * 360));
  emitter.data.pThrust = () => 1000;
  emitter.data.pDamping = () => 0.5;
  
  
  // Replace defaults with options, if given.
  if (dataOptions) Object.assign(emitter.data, dataOptions);
  
  // Create a particle.
  emitter.emitParticle = () => {
    emitter.data.sinceEmit = 0;
    emitter.data.nParticles++;
    emitter.data.nParticlesTotal++;
    
    const pbmd = _makeParticleBitmap(game,
      emitter.data.pSize(),
      emitter.data.pFill(),
      'circle');
    const particle = game.make.sprite(emitter.data.pPos(), emitter.data.pPos(), pbmd);
    particle.data.lifetime = 0;
    particle.data.lifetimeMax = emitter.data.pLifetimeMax();
    particle.data.finished = false; // Mark for deletion
    
    // Initialize physics on particle.
    physics.enablePhysics(particle, 'particle');
    particle.body.setCollisionGroup(emitter.data.collisionGroup);
    if (emitter.data.selfCollision) {
      particle.body.collides(emitter.data.collisionGroup);
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
    (emitter.data.nParticles < emitter.data.nParticlesMax) &&
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
    } else if (emitter.data.nParticles === 0) {
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

//asdf
const intToHex = int => {
  const hexString = `000000${((int) >>> 0).toString(16)}`.slice(-6);
  return `#${hexString}`;
};
// Create a particle emitter. Contains emitter template definitions.
export const addEmitter = (game, x, y, template = null, data = {}) => {
  let options = {};
  switch (template) {
    case 'burst':
      options.nParticlesMax = 5;
      options.particleFrequency = 0;
      options.lifetimeMax = 1000;
      options.selfCollision = false;
      options.pAngle = () => (Math.round(Math.random() * 360));
      options.pThrust = () => 1000;
      break;
      
    case 'angled-burst':
      options.nParticlesTotalMax = 3;
      options.particleFrequency = 0;
      options.selfCollision = false;
      options.pMass = () => 0.1;
      options.pAngle = () => (data.angle + Math.round(Math.random() * 30));
      options.pThrust = () => (Math.round(Math.random() * 1000) + 2000);
      options.pDamping = () => 0;
      options.pLifetimeMax = () => 300;
      options.pFill = () => {
        //return { r: 255, g: 0, b: 0 };
        // let c = intToHex(Phaser.Color.getRandomColor());
        // console.log(c);
        // return c;
        let c = `rgba(${(Math.round(Math.random() * 255) + 0)}, ${Math.round((Math.random() * 255) + 0)}, 0, 1)`;
        //let c = `rgba(255, 255, 0, 1)`;
        //let c = Phaser.Color.getWebRGB(Phaser.Color.createColor(255, 0, 0, 1));
        console.log(c);
        return c;
        //return 'rgba(255, 0, 0, 1)';//c;
      }; 
      break;
      
    default: break;
  }
  return _addEmitter(game, x, y, options);
};
