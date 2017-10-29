import * as Pixi from 'pixi.js';
import Colors from './Colors';

const GRID_SIZE = 10000;
const GRID_SPACING = 20; // SNAP
const GRID_BORDER_SIZE = 400; // Size of the border around the playable area (one side)

const RECT_MIN_SIZE = 10; // Minimum size of a rectangle object.
const RESIZE_CONTROL_SIZE = 10;

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

    this.gridSize = GRID_SIZE;
    this.gridSpacing = GRID_SPACING;
    this.gridBorderSize = GRID_BORDER_SIZE;
    this.container = this.generateGrid(this.gridSize, this.gridSize,
      this.gridSpacing, this.gridBorderSize, Colors.GRAY);
    this.app.stage.addChild(this.container);

    this.selectedObject = null; // The currently selected object.
    this.lockSelect = false; // When true, objects won't be selected.

    this.resizeControlSize = RESIZE_CONTROL_SIZE; // Size of resize control elements.

    // Adding some test data
    this.container.addObject(
      this.createRect({
        x: this.gridSpacing * 4,
        y: this.gridSpacing * 4,
        w: this.gridSpacing * 2,
        h: this.gridSpacing * 2,
        draggable: true,
        selectable: true,
        fill: 0xFFAABB,
        stroke: 0x000000 }),
    );

    this.container.addObject(
      this.createRect({
        x: this.gridSpacing * 8,
        y: this.gridSpacing * 8,
        w: this.gridSpacing * 4,
        h: this.gridSpacing * 4,
        draggable: true,
        selectable: true,
        fill: Colors.WHITE,
        stroke: Colors.BLACK }),
    );


  }

  generateGrid = (width, height, snap, borderSize, lineColor) => {
    let w = width + (borderSize * 2);
    let h = height + (borderSize * 2);

    let grid = this.createObject({
      x: 0, y: 0, w: width, h: height, draggable: true, container: true,
    });
    grid.lineStyle(1, lineColor, 1);
    for (let x = 0; x < w; x += snap) {
      grid.lineStyle(x % 100 === 0 ? 2 : 1, lineColor, 1);
      grid.moveTo(x, 0);
      grid.lineTo(x, w);
    }
    for (let y = 0; y < h; y += snap) {
      grid.lineStyle(y % 100 === 0 ? 2 : 1, lineColor, 1);
      grid.moveTo(0, y);
      grid.lineTo(h, y);
    }
    return grid;
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

  createObject = ({ x = 0, y = 0, w = 1, h = 1, draggable, container, selectable }) => {

    const obj = new Pixi.Graphics();

    if (selectable) { obj.selectable = true; }

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
      obj.draggable = true;
      obj.hitArea = new Pixi.Rectangle(0, 0, w, h);
      obj.interactive = true;
      obj.buttonMode = true;

      // Set event hooks.
      let engine = this;
      obj
      // Mouse down
      .on('mousedown', (e) => { engine.onMouseDown(obj, e); })
      .on('touchstart', (e) => { engine.onMouseDown(obj, e); })
      // Mouse up
      .on('mouseup', (e) => { engine.onMouseUp(obj, e); })
      .on('mouseupoutside', (e) => { engine.onMouseUp(obj, e); })
      .on('touchend', (e) => { engine.onMouseUp(obj, e); })
      .on('touchendoutside', (e) => { engine.onMouseUp(obj, e); })
      // Mouse move
      .on('mousemove', (e) => { engine.onMouseMove(obj, e); })
      .on('touchmove', (e) => { engine.onMouseMove(obj, e); });
    }

    return obj;
  };

  createRect = ({ w = 1, h = 1, fill, stroke, ...rest }) => {

    const rect = this.createObject({ w, h, ...rest });

    if (typeof stroke === 'number') rect.lineStyle(1, stroke, 1);
    if (typeof fill === 'number') rect.beginFill(fill);
    rect.drawRect(0, 0, w, h);
    rect.endFill();

    // This will cause problems if the rectangle is ever destroyed, so don't do that.
    rect.getShape = () => rect.graphicsData[0].shape;

    rect.resize = (width, height) => {
      rect.getShape().width = width;
      rect.getShape().height = height;
      rect.hitArea = new Pixi.Rectangle(0, 0, width, height);
      rect.dirty++;
      rect.clearDirty++;
    };

    rect.translate = (xp, yp) => {
      rect.position.x = xp;
      rect.position.y = yp;
    };

    return rect;
  };

  // Control manipulation is in the Engine class for easier
  // access to object creation functions.
  createControls = (obj) => {
    // Saving these because they change with added children.
    let obj_width = obj.width;
    let obj_height = obj.height;

    // controlPosition.x: left (0) or right (1) side.
    // controlPosition.y: top (0) or bottom (1) side.
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        let ctl = this.createRect({
          x: x === 0 ? -this.resizeControlSize : obj_width,
          y: y === 0 ? -this.resizeControlSize : obj_height,
          w: this.resizeControlSize,
          h: this.resizeControlSize,
          fill: Colors.WHITE,
          stroke: Colors.BLACK,
          draggable: true,
          container: false,
          selectable: false });
        ctl.isControl = true;
        ctl.controlPosition = { x, y };

        ctl.resetPosition = () => {
          ctl.x = ctl.controlPosition.x === 0 ? -ctl.width : ctl.parent.getShape().width;
          ctl.y = ctl.controlPosition.y === 0 ? -ctl.height : ctl.parent.getShape().height;
        };

        obj.addChild(ctl);
      }
    }
  };
  removeControls = (obj) => {
    for (let i = 0; i < obj.children.length; i++) {
      if (obj.children[i].isControl) {
        obj.removeChildAt(i);
        // Do we need to destroy the child here?
        i--;
      }
    }
  };
  resetControlPositions = (obj, ignore = null) => {
    for (let c of obj.children) {
      if (c.isControl && c !== ignore) {
        c.resetPosition();
      }
    }
  };

  // Clear the current object selection.
  clearSelection = () => {
    if (this.selectedObject) {
      this.selectedObject.tint = Colors.WHITE;
      this.removeControls(this.selectedObject);
    }

    this.selectedObject = null;
  }

  // Clear the current selection, then select the given object.
  selectObject = (obj) => {
    if (obj.isControl) { return; }
    this.clearSelection();
    if (!obj.selectable) { return; }

    this.selectedObject = obj;
    this.selectedObject.tint = Colors.GREEN;

    this.createControls(obj);
  }

  // Object dragging logic.
  // Called by event handler functions.
  dragStart = (obj, event) => {
    obj.alpha = 0.8;
    obj.dragging = true;
    obj.data = event.data;
    obj.offset = event.data.getLocalPosition(obj); // Mouse offset within obj.
  }
  dragMove = (obj) => {
    if (obj.dragging) {
      let newPosition = obj.data.getLocalPosition(obj.parent);
      obj.position.x = newPosition.x - obj.offset.x;
      obj.position.y = newPosition.y - obj.offset.y;

      if (obj.isControl) {
        this.resizeParent(obj);
      }

    }
  }
  resizeParent(control) {
    let MIN_SIZE = RECT_MIN_SIZE;
    let obj = control.parent;
    let dragPos = obj.data.getLocalPosition(obj.parent); // data added in dragStart().
    let shape = obj.getShape();

    let newPosition = { x: 0, y: 0 };
    let newSize = { width: 0, height: 0 };

    // Calculate new width.
    if (control.controlPosition.x === 0) {
      // This is a left-side control.
      newPosition.x = dragPos.x + (control.width / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let xMax = (obj.x + shape.width) - MIN_SIZE;
      newPosition.x = Math.min(newPosition.x, xMax);

      newSize.width = (obj.x + shape.width) - newPosition.x;
    } else {
      // This is a right-side control.
      newPosition.x = obj.x;
      newSize.width = dragPos.x - obj.x;
    }
    // Clamp to dragging bounds.
    if (newSize.width < MIN_SIZE) { newSize.width = MIN_SIZE; }

    // Calculate new height.
    if (control.controlPosition.y === 0) {
      // This is a top control.
      newPosition.y = dragPos.y + (control.height / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let yMax = (obj.y + shape.height) - MIN_SIZE;
      newPosition.y = Math.min(newPosition.y, yMax);

      newSize.height = (obj.y + shape.height) - newPosition.y;
    } else {
      // This is a bottom control.
      newPosition.y = obj.y;
      newSize.height = dragPos.y - obj.y;
    }
    // Clamp to dragging bounds.
    if (newSize.height < MIN_SIZE) { newSize.height = MIN_SIZE; }

    obj.translate(newPosition.x, newPosition.y);
    obj.resize(newSize.width, newSize.height);
    this.resetControlPositions(obj);
  }
  dragEnd = (obj) => {
    obj.alpha = 1.0;
    obj.dragging = false;

    if (obj.isControl) {
      this.resizeParent(obj);
    }
  }

  // Event handler functions.
  onMouseDown = (obj, event) => {
    if (this.lockSelect) { return; }
    this.lockSelect = true;

    this.selectObject(obj);
    if (obj.draggable) { this.dragStart(obj, event); }
  }
  onMouseUp = (obj, event) => {
    if (obj.dragging) { this.dragEnd(obj, event); }
    this.lockSelect = false;
  }
  onMouseMove = (obj, event) => {
    if (obj.dragging) { this.dragMove(obj, event); }
  }

}

export default Engine;
