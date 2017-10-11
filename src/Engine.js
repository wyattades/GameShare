import * as Pixi from 'pixi.js';

class Engine {

  constructor(parent, width, height) {

    this.width = width;
    this.height = height;

    this.app = new Pixi.Application({
      width,
      height,
      transparent: true,
    });
    
    parent.appendChild(this.app.view);

    // this.app.ticker.add(this.update);
  }

  addObject = (...objs) => {
    for (let obj of objs) {
      this.app.stage.addChild(obj);
    }
  }

  start = () => {
    this.app.start();
  }

  stop = () => {
    // this.app.ticker.remove(this.update);
    this.app.stop();
  }

  translate = (x, y, z) => {
    
  }

}

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

export const createRect = ({ x = 0, y = 0, w = 1, h = 1, draggable }) => {

  const rectangle = new Pixi.Graphics();

  rectangle.lineStyle(1, 0xFF3300, 1);
  rectangle.beginFill(0x66CCFF);
  rectangle.drawRect(0, 0, w, h);
  rectangle.endFill();

  rectangle.x = x;
  rectangle.y = y;

  if (draggable) {
    rectangle.interactive = true;
    rectangle.buttonMode = true;

    rectangle
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

  return rectangle;
};

export default Engine;
