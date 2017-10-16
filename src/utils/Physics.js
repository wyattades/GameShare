// This file is used by the client and server so it can't use 'export default' nor 'export'

const boxCollide = (b1, b2) => (
  b1.x < b2.x + b2.w && b1.x + b1.w > b2.x &&
  b1.y < b2.y + b2.h && b1.y + b1.h > b2.y
);

const MAX_SPEED = 8,
      FRICTION = 0.1; // TEMP

class Physics {

  constructor(users, level, userId) {
    this.users = users;
    this.level = level;
    this.user = users[userId];
  }

  applyForce = (fx, fy) => { // TODO: use vectors
    const u = this.user;

    u.vx = Math.min(MAX_SPEED, u.vx + fx);
    u.vy = Math.min(MAX_SPEED, u.vy + fy);
  }

  // TODO: return distance that would be intersected so player can press against wall
  wallsCollide = obj => {
    let collide = false;
    for (let i = 0, walls = this.level.getChildren(); i < walls.length; i++) {
      const wall = walls[i];
      if (boxCollide(obj, wall)) {
        collide = true;
        break;
      }
    }
    return collide;
  }

  update = delta => {

    const obj = this.user;

    if (obj.vx) {

      const newBounds = { x: obj.x + (obj.vx * delta), y: obj.y, w: obj.w, h: obj.h };

      if (this.wallsCollide(newBounds)) {
        obj.vx = 0;
      } else {
        obj.x = newBounds.x;
      }

      // TEMP
      obj.vx = Math.max(0, obj.vx - FRICTION);
    }

    if (obj.vy) {
      
      const newBounds = { x: obj.x, y: obj.y + (obj.vy * delta), w: obj.w, h: obj.h };

      if (this.wallsCollide(newBounds)) {
        obj.vy = 0;
      } else {
        obj.y = newBounds.y;
      }

      // TEMP
      obj.vy = Math.max(0, obj.vy - FRICTION);
    }
  }
}

module.exports = Physics;
