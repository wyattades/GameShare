// This file is used by the client and server so it can't use 'export default' nor 'export'

const boxCollide = (b1, b2) => !(
  b1.x > b2.x + b2.w || b1.x + b1.w < b2.x ||
  b1.y > b2.y + b2.h || b1.y + b1.h < b2.y
);

const MAX_SPEED = 4,
      FRICTION = 0.4; // TEMP

class Physics {

  constructor(users, level) {
    this.users = users;
    this.level = level;
  }

  setUser = user => {
    this.user = user;
  }

  applyForce = (fx, fy) => { // TODO: use vectors
    const u = this.user;

    u.vx += fx;
    u.vy += fy;

    if (u.vx > MAX_SPEED) u.vx = MAX_SPEED;
    else if (u.vx < -MAX_SPEED) u.vx = -MAX_SPEED;

    if (u.vy > MAX_SPEED) u.vy = MAX_SPEED;
    else if (u.vy < -MAX_SPEED) u.vy = -MAX_SPEED;
  }

  // TODO: return distance that would be intersected so player can adjust to press against wall
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

      // TEMP: apply friction
      if (obj.vx > 0) obj.vx = Math.max(0, obj.vx - FRICTION);
      if (obj.vx < 0) obj.vx = Math.min(0, obj.vx + FRICTION);
    }

    if (obj.vy) {
      
      const newBounds = { x: obj.x, y: obj.y + (obj.vy * delta), w: obj.w, h: obj.h };

      if (this.wallsCollide(newBounds)) {
        obj.vy = 0;
      } else {
        obj.y = newBounds.y;
      }

      // TEMP: apply friction
      if (obj.vy > 0) obj.vy = Math.max(0, obj.vy - FRICTION);
      if (obj.vy < 0) obj.vy = Math.min(0, obj.vy + FRICTION);
    }
  }
}

module.exports = Physics;
