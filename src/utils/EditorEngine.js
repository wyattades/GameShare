import * as Pixi from 'pixi.js';
import Colors from './Colors';


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

    // TODO: grid size to initial size params
    const GRID_SIZE = 10000;
    this.gridSpacing = 20; // Formerly SNAP
    this.container = this.generateGrid(GRID_SIZE, GRID_SIZE, this.gridSpacing);
    this.app.stage.addChild(this.container);

    this.selectedObject = null; // The currently selected object.
    this.lockSelect = false; // When true, objects won't be selected.

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

  generateGrid = (width, height, snap) => {
    let grid = this.createObject({
      x: 0, y: 0, w: width, h: height, draggable: true, container: true,
    });
    grid.lineStyle(1, 0xAAAAAA, 1);
    for (let x = 0; x < width; x += snap) {
      grid.moveTo(x, 0);
      grid.lineTo(x, width);
    }
    for (let y = 0; y < height; y += snap) {
      grid.moveTo(0, y);
      grid.lineTo(height, y);
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

  translate = (x, y, z) => {

  }


  createObject = ({ x = 0, y = 0, w = 1, h = 1, draggable, container, selectable, primitive }) => {

    const obj = new Pixi.Graphics();

    if (selectable) { obj.selectable = true; }

    if (primitive) {
      obj.resize = (width, height) => {
        /*
        if (width !== obj.graphicsData[0].shape.width) {
          obj.graphicsData[0].shape.width = width;
        }
        if (height !== obj.graphicsData[0].shape.height) {
          obj.graphicsData[0].shape.height = height;
        }
        */
        obj.graphicsData[0].shape.width = width;
        obj.graphicsData[0].shape.height = height;
        obj.hitArea = new Pixi.Rectangle(0, 0, width, height);
        obj.dirty++;
        obj.clearDirty++;
      };

      obj.translate = (xp, yp) => {
        // console.log(`[DEBUG]: translate from (${obj.position.x}, ${obj.position.y}) to (${xp}, ${yp})`);
        //if (xp !== obj.position.x) { obj.position.x = xp; }
        //if (yp !== obj.position.y) { obj.position.y = yp; }
        obj.position.x = xp;
        obj.position.y = yp;
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

    const rect = this.createObject({ w, h, primitive: true, ...rest });

    if (typeof stroke === 'number') rect.lineStyle(1, stroke, 1);
    if (typeof fill === 'number') rect.beginFill(fill);
    rect.drawRect(0, 0, w, h);
    rect.endFill();

    return rect;
  };

  // TODO: Make control manipulation functions into obj methods
  createControls = (obj) => {
    let width = 10;
    let height = 10;
    let obj_width = obj.width;
    let obj_height = obj.height;

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        let ctl = this.createRect({
          x: x === 0 ? -width : obj_width,
          y: y === 0 ? -height : obj_height,
          w: width,
          h: height,
          fill: Colors.WHITE,
          stroke: Colors.BLACK,
          draggable: true,
          container: false,
          selectable: false });
        ctl.isControl = true;
        ctl.controlPosition = { x, y };

        ctl.getOffset = () => ({
          // TODO: Better interface to graphicsData[0].shape
          x: ctl.controlPosition.x === 0 ? -ctl.width : ctl.parent.graphicsData[0].shape.width,
          y: ctl.controlPosition.y === 0 ? -ctl.height : ctl.parent.graphicsData[0].shape.height,
        });
        ctl.resetPosition = () => {
          let offset = ctl.getOffset();
          ctl.x = offset.x;
          ctl.y = offset.y;
        };
        ctl.setDraggingBounds = () => {
          // TODO: Better interface to graphicsData[0].shape
          console.log(ctl.parent);
          let gpos = ctl.parent.position;
          let shape = ctl.parent.graphicsData[0].shape;
          let MIN_RECT_SIZE = 10; // TODO: move somewhere nicer
          ctl.draggingBounds = {
            xMin: -10000,
            xMax: gpos.x + shape.width - MIN_RECT_SIZE, //ctl.parent.position.x + ctl.parent.graphicsData[0].shape.width,
            yMin: -10000,
            yMax: gpos.y + shape.height - MIN_RECT_SIZE, //ctl.parent.position.y + ctl.parent.graphicsData[0].shape.height,
          };
          console.log(ctl.draggingBounds);
        };

        obj.addChild(ctl);
        ctl.setDraggingBounds();
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
  resetControls = obj => {
    this.removeControls(obj);
    this.createControls(obj);
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
      this.removeControls(this.selectedObject); // TODO: move to obj method
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

    if (obj.isControl) {
      obj.setDraggingBounds();
    }
  }
  dragMove = (obj, event) => {
    if (obj.dragging) {
      console.log("OFFSET:"); console.log(obj.offset);
      let newPosition = obj.data.getLocalPosition(obj.parent);
      newPosition.x -= obj.offset.x;
      newPosition.y -= obj.offset.y;

      /*
      if (obj.draggingBounds) {
        if (newPosition.x < obj.draggingBounds.xMin) {
          console.log(`newpos.x = ${newPosition.x} out of bounds (low): set to ${obj.draggingBounds.xMin}`);
          newPosition.x = obj.draggingBounds.xMin;
        } else if (newPosition.x > obj.draggingBounds.xMax) {
          console.log(`newpos.x = ${newPosition.x} out of bounds (high): set to ${obj.draggingBounds.xMax}`);
          newPosition.x = obj.draggingBounds.xMax;
        }

        if (newPosition.y < obj.draggingBounds.yMin) {
          console.log(`newpos.y = ${newPosition.y} out of bounds (low): set to ${obj.draggingBounds.yMin}`);
          newPosition.y = obj.draggingBounds.yMin;
        } else if (newPosition.y > obj.draggingBounds.yMax) {
          console.log(`newpos.y = ${newPosition.y} out of bounds (high): set to ${obj.draggingBounds.yMax}`);
          newPosition.y = obj.draggingBounds.yMax;
        }
      }
      console.log(`new position: ${newPosition.x}, ${newPosition.y}`);
      */

      obj.position.x = newPosition.x;// - obj.offset.x;
      obj.position.y = newPosition.y;// - obj.offset.y;

      if (obj.isControl) {
        this.resizeByControl(obj, obj.data.getLocalPosition(obj.parent.parent));
      }

    }
  }
  resizeByControl(control, dragPos) {
    const MIN_SIZE = 10; // TODO: move somewhere nicer
    // TODO: make this function an obj method for control elements
    // dragPos: position being dragged to. (Could use control's position?)
    let obj = control.parent;
    let shape = obj.graphicsData[0].shape; // TODO: build interface in obj

    let desiredPosition = { x: 0, y: 0 }; // Target position for upper left corner of obj.
    let desiredSize = { width: 0, height: 0 }; //
    let posDelta = { x: 0, y: 0 };

    // TODO: offsets will be different for different corner controls.
    if (control.controlPosition.x === 0 && control.controlPosition.y === 0) {
      desiredPosition = {
        x: dragPos.x + (control.width / 2),
        y: dragPos.y + (control.height / 2),
      };

      let xMax = (obj.x + shape.width) - MIN_SIZE;
      desiredPosition.x = Math.min(desiredPosition.x, xMax);

      let yMax = (obj.y + shape.height) - MIN_SIZE;
      desiredPosition.y = Math.min(desiredPosition.y, yMax);

      posDelta = { x: desiredPosition.x - obj.x, y: desiredPosition.y - obj.y };

      desiredSize = { width: shape.width - posDelta.x, height: shape.height - posDelta.y };

    } /* else if (control.controlPosition.x === 1 && control.controlPosition.y === 0) {
      desiredPosition = {
        x: obj.x,
        y: dragPos.y + (control.height / 2),
      };
      posDelta = { x: desiredPosition.x - obj.x, y: desiredPosition.y - obj.y };

      desiredSize = { width: dragPos.x - obj.x, height: shape.height - posDelta.y };
    } */

//    let newSize = desiredSize;
//    let newPosition = desiredPosition;
    console.log(`desiredPosition: (${desiredPosition.x}, ${desiredPosition.y})`);
    console.log(`bounds x: (${control.draggingBounds.xMin}, ${control.draggingBounds.xMax})`);
    console.log(`bounds y: (${control.draggingBounds.yMin}, ${control.draggingBounds.yMax})`);



    /*
    if (desiredSize.width < 10) {
      //return;
      desiredSize.width = 10;
      desiredPosition.x = obj.x + (control.width / 2);
    }
    if (desiredSize.height < 10) {
      //return;
      desiredSize.height = 10;
      desiredPosition.y = obj.y + (control.height / 2);
    }
    */

    /*
    if (desiredSize.width !== shape.width || desiredSize.height !== shape.height) {
      obj.resize(desiredSize.width, desiredSize.height);
    }
    if (desiredPosition.x !== obj.x + (control.width / 2) ||
        desiredPosition.y !== obj.y + (control.height / 2)) {
      obj.translate(desiredPosition.x, desiredPosition.y);
    }
    */
    obj.translate(desiredPosition.x, desiredPosition.y);
    obj.resize(desiredSize.width, desiredSize.height);
    this.resetControlPositions(obj);
  }
  dragEnd = (obj, event) => {
    obj.alpha = 1.0;
    obj.dragging = false;

    if (obj.isControl) {
      this.resizeByControl(obj, obj.data.getLocalPosition(obj.parent.parent));
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
