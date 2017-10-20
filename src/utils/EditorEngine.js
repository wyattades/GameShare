import * as Pixi from 'pixi.js';
import Colors from './Colors';
// User variables for editor.

class EditorInstance {
  constructor() {
    this.selectedObject = null;
    this.lockDragEvent = false;
  }

  // Clear the current object selection.
  clearSelection = () => {
    if (this.selectedObject) {
      if (this.selectedObject.onSelectClear) {
        this.selectedObject.onSelectClear();
      }
    }
    this.selectedObject = null;
  }

  // Set the current object selection.
  selectObject = (obj) => {
    this.clearSelection();
    this.selectedObject = obj;
    if (this.selectedObject.onSelectSet) {
      this.selectedObject.onSelectSet();
    }
  }
}
let editorInstance = new EditorInstance();

function onDragStart(event) {
  if (editorInstance.lockDragEvent) { return; }
  editorInstance.lockDragEvent = true;

  if (this.selectable) {
    editorInstance.selectObject(this);
  }
  else {
    editorInstance.clearSelection();
  }

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

export const createObject = ({ x = 0, y = 0, w = 1, h = 1, draggable, container, selectable }) => {

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
  obj.w = w; // ? obj.width ?
  obj.h = h;

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

// Helper for creating easy rectangle
export const createRect = ({ w = 1, h = 1, fill, stroke, ...rest }) => {

  const rect = createObject({ w, h, ...rest });

  if (typeof stroke === 'number') rect.lineStyle(1, stroke, 1);
  if (typeof fill === 'number') rect.beginFill(fill);
  rect.drawRect(0, 0, w, h);
  rect.endFill();

  return rect;
};

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

    this.container = options.container || createObject({ container: true });
    this.app.stage.addChild(this.container);
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

}

export default Engine;
