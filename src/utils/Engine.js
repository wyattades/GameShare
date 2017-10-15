import * as Pixi from 'pixi.js';

import testData from '../assets/testData';

function onDragStart(event) {
  this.data = event.data;
  this.alpha = 0.8;
  this.dragging = true;
  this.offset = event.data.getLocalPosition(this);
}

function onDragEnd() {
  this.alpha = 1.0;
  this.dragging = false;
  this.data = null;
}

function onDragMove() {
  if (this.dragging) {
    let newPosition = this.data.getLocalPosition(this.parent);
    this.position.x = newPosition.x - this.offset.x;
    this.position.y = newPosition.y - this.offset.y;
  }
}


export const createGraphic = ({ x = 0, y = 0, w = 1, h = 1, draggable }) => {

  const obj = new Pixi.Graphics();

  obj.x = x;
  obj.y = y;

  if (draggable) {

    obj.hitArea = new Pixi.Rectangle(0, 0, w, h);

    obj.interactive = true;
    obj.buttonMode = true;

    obj
    // events for drag start
    .on('mousedown', onDragStart)
    .on('touchstart', onDragStart)
    // events for drag end
    .on('mouseup', onDragEnd)
    .on('mouseupoutside', onDragEnd)
    .on('touchend', onDragEnd)
    .on('touchendoutside', onDragEnd)
    // events for drag move
    .on('mousemove', onDragMove)
    .on('touchmove', onDragMove);
  }

  return obj;
};

export const createRect = ({ w = 1, h = 1, fill, stroke, ...rest }) => {

  const rect = createGraphic({ w, h, ...rest });

  if (typeof stroke === 'number') rect.lineStyle(1, stroke, 1);
  if (typeof fill === 'number') rect.beginFill(fill);
  rect.drawRect(0, 0, w, h);
  rect.endFill();

  return rect;
};


class Engine {

  constructor(parent, options = {}) {

    this.animated = !!options.animated;

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.app = new Pixi.Application({
      width: this.width,
      height: this.height,
      transparent: !options.background,
    });

    parent.appendChild(this.app.view);

    // Game instance fields -- we'll probably move these to an instance class.
    this.users = {};
    // Level rule fields -- eventually we'll move these to a level rule class.
    this.SPEED = 8;
  }

  // Reset the game instance.
  // Called on connection to a new game server.
  resetInstance = () => {
    this.users = {}; // Clear user list.
    this.removeObject(); // Clear Pixi object list.
  }

  // Load the test data instance. Called when room joined.
  // This will become a generic instance loader later.
  loadTestInstance = (newUsers) => {
    // Load game objects
    for (let obj of testData.objects) {
      obj.stroke = 0xDD0000;
      this.addObject(createRect(obj));
    }

    // Load players
    for (let newUserId in newUsers) {
      if (newUsers.hasOwnProperty(newUserId)) {
        this.addUser(newUserId, newUsers[newUserId]);
      }
    }
  }

  // Helper function for adding a new user.
  addUser = (id, { x, y, color }) => {
    const user = createRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });

    this.addObject(user);
    this.users[id] = user;
  };

  // Remove a user from the list, and delete their Pixi object.
  removeUser = id => {
    // TODO: error checking
    this.removeObject(this.users[id]);
    delete this.users[id];
  }


  addObject = (...objs) => {
    for (let obj of objs) {
      this.app.stage.addChild(obj);
    }
  }

  removeObject = obj => {
    if (obj) {
      this.app.stage.removeChild(obj);
    } else {
      this.app.stage.removeChildren();
    }
  }

  start = () => {
    if (this.animated) this.app.ticker.add(this.update);
    this.app.start();
  }

  stop = () => {
    if (this.animated) this.app.ticker.remove(this.update);
    this.app.stop();
  }

  update = delta => {
    for (let obj of this.app.stage.children) {
      if (obj.vx) obj.x += obj.vx * delta;
      if (obj.vy) obj.y += obj.vy * delta;
    }
  }

  translate = (x, y, z) => {

  }

}


export default Engine;
