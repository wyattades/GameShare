import * as Pixi from 'pixi.js';
import Colors from './Colors';

/*

function onDragStart(event) {
  if (editorInstance.lockDragEvent) { return; }
  editorInstance.lockDragEvent = true;
  editorInstance.selectObject(this);

  this.data = event.data;
  this.alpha = 0.8;
  this.dragging = true;
  this.offset = event.data.getLocalPosition(this);
}

function onDragEnd() {
  this.alpha = 1.0;
  this.dragging = false;
  this.data = null;

  editorInstance.lockDragEvent = false;
}

function onDragMove() {
  if (this.dragging) {
    let newPosition = this.data.getLocalPosition(this.parent);
    this.position.x = newPosition.x - this.offset.x;
    this.position.y = newPosition.y - this.offset.y;
  }
}

*/


class Engine {

  constructor(parent, options = {}) {

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.app = new Pixi.Application({
      width: this.width,
      height: this.height,
      transparent: !options.background,
    });

    parent.appendChild(this.app.view);

    // temporary
    const GRID_SIZE = 10000;
    const SNAP = 10;
    let grid = this.createObject({
      x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE, draggable: true, container: true,
    });
    grid.lineStyle(1, 0xAAAAAA, 1);
    for (let x = 0; x < GRID_SIZE; x += SNAP) {
      grid.moveTo(x, 0);
      grid.lineTo(x, GRID_SIZE);
    }
    for (let y = 0; y < GRID_SIZE; y += SNAP) {
      grid.moveTo(0, y);
      grid.lineTo(GRID_SIZE, y);
    }

    this.container = grid; // options.container || this.createObject({ container: true });
    this.app.stage.addChild(this.container);

    this.selectedObject = null;
    this.lockDragEvent = false;

    // Adding some test data
    this.container.addObject(
      this.createRect({
        x: 50,
        y: 50,
        w: 20,
        h: 20,
        draggable: true,
        selectable: true,
        fill: 0xFFAABB,
        stroke: 0x000000 }),
    );

  }

  addUpdate = fn => {
    this.app.ticker.add(fn);
  }

  start = () => {
    this.app.start();
  }

  stop = () => {
    this.app.ticker.destroy(); // or stop() ?
    this.app.stop();
  }

  translate = (x, y, z) => {

  }

  createObject = ({ x = 0, y = 0, w = 1, h = 1, draggable, container,
    selectable }) => {

    const obj = new Pixi.Graphics();

    if (selectable) {
      obj.selectable = true;
      obj.onSelectSet = () => {
        obj.tint = Colors.GREEN;
      };
      obj.onSelectClear = () => {
        obj.tint = Colors.WHITE;
      };
    }

    if (container) {
      obj.getChildren = () => obj.children;

      obj.addObject = (...objs) => {
        for (let o of objs) {
          obj.addChild(o);
        }
      };

      obj.removeObject = (...objs) => {
        if (objs.length > 0) {
          for (let o of objs) {
            obj.removeChild(o);
          }
        } else {
          obj.removeChildren();
        }
      };

    }

    obj.x = x;
    obj.y = y;
    obj.w = w;
    obj.h = h;

    if (draggable) {

      obj.hitArea = new Pixi.Rectangle(0, 0, w, h);

      obj.interactive = true;
      obj.buttonMode = true;

      let engine = this;

      // Set event hooks.
      obj
      // Mouse down
      .on('mousedown', () => { engine.objectMouseDown(obj); })
      .on('touchstart', () => { engine.objectMouseDown(obj); })
      // Mouse up
      .on('mouseup', () => { engine.objectMouseUp(obj); })
      .on('mouseupoutside', () => { engine.objectMouseUp(obj); })
      .on('touchend', () => { engine.objectMouseUp(obj); })
      .on('touchendoutside', () => { engine.objectMouseUp(obj); })
      // Mouse move
      .on('mousemove', () => { engine.objectMouseMove(obj); })
      .on('touchmove', () => { engine.objectMouseMove(obj); });
    }

    return obj;
  };

  createRect = ({ w = 1, h = 1, fill, stroke, ...rest }) => {

    const rect = this.createObject({ w, h, ...rest });

    if (typeof stroke === 'number') rect.lineStyle(1, stroke, 1);
    if (typeof fill === 'number') rect.beginFill(fill);
    rect.drawRect(0, 0, w, h);
    rect.endFill();

    return rect;
  };

  // Clear the current object selection.
  clearSelection = () => {
    if (this.selectedObject) { this.selectedObject.tint = Colors.WHITE; }
    this.selectedObject = null;
  }

  // Clear the current selection, then select the given object.
  selectObject = (obj) => {
    this.clearSelection();
    if (!obj.selectable) { return; }
    console.log("selectobject: object selectable");
    this.selectedObject = obj;
    this.selectedObject.tint = Colors.GREEN;
  }

  objectMouseDown = (obj) => {
    this.selectObject(obj);

    //if (obj.draggable) { this.startDrag(obj); }
    console.log("engine.mousedown detected");
    //obj.tint = Colors.BLACK;
  }
  objectMouseUp = (obj) => {
    console.log("engine.mouseup detected");
    //obj.tint = Colors.BLACK;
  }
  objectMouseMove = (obj) => {
    console.log("engine.mousemove detected");
    //obj.tint = Colors.BLACK;
  }

}

export default Engine;
