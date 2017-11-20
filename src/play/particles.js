/* global Phaser */

export const particles = 0;

export const addEmitter = (game, x, y) => {
  // Adding a graphic for testing purposes
  let w = 10;
  let h = 10;
  
  const bmd = game.add.bitmapData(w, h);
  bmd.ctx.beginPath();
  bmd.ctx.rect(0, 0, w, h);
  bmd.ctx.strokeStyle = '#00FF00'; // intToHex(stroke);
  bmd.ctx.fillStyle = '#00FF00'; // intToHex(fill);
  bmd.ctx.fill();
  
  const sprite = game.add.sprite(x, y, bmd);
  
  sprite.data.particles = [];
  sprite.data.nParticles = 0;
  sprite.data.maxParticles = 10;
  sprite.data.particleFrequency = 100; // How many ms between emissions?
  sprite.data.sinceEmit = 0;
  
  sprite.emitParticle = () => {
    sprite.data.sinceEmit = 0;
    sprite.data.nParticles++;
    
    const pbmd = game.add.bitmapData(w, h);
    pbmd.ctx.beginPath();
    pbmd.ctx.rect(0, 0, 2, 2);
    pbmd.ctx.strokeStyle = '#00FF00'; // intToHex(stroke);
    pbmd.ctx.fillStyle = '#00FF00'; // intToHex(fill);
    pbmd.ctx.fill();
    sprite.addChild(game.make.sprite((Math.random() * 20) - 10, (Math.random() * 20) - 10, pbmd));
  };
  
  sprite.update = () => {
    if (sprite.data.nParticles >= sprite.data.maxParticles) return;
    
    sprite.data.sinceEmit += game.time.elapsedMS;
    if (sprite.data.sinceEmit >= sprite.data.particleFrequency) {
      sprite.data.sinceEmit = 0;
      sprite.emitParticle();
    }
  };
  
  return sprite;
};
