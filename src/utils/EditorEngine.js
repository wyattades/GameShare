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
        obj.graphicsData[0].shape.height = height;
        obj.graphicsData[0].shape.width = width;
        obj.hitArea = new Pixi.Rectangle(0, 0, width, height);
        obj.dirty++;
        obj.clearDirty++;
      };

      obj.translate = (xp, yp) => {
        console.log(`[DEBUG]: translate from (${obj.position.x}, ${obj.position.y}) to (${xp}, ${yp})`);
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
        obj.addChild(ctl);
      }
    }
  };
  removeControls = (obj) => {
    for (let i = 0; i < obj.children.length; i++) {
      if (obj.children[i].isControl) {
        obj.removeChildAt(i);
        // Need to destroy child object?
        i--;
      }
    }
  };
  resetControls = obj => {
    this.removeControls(obj);
    this.createControls(obj);
  };
  resetControlPositions = obj => {
    for (let c of obj.children) {
      if (c.isControl) {
        // TODO: Better interface to graphicsData[0].shape
        c.x = c.controlPosition.x === 0 ? -c.width : obj.graphicsData[0].shape.width;
        c.y = c.controlPosition.y === 0 ? -c.height : obj.graphicsData[0].shape.height;
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
    obj.offset = event.data.getLocalPosition(obj);
  }
  dragMove = (obj, event) => {
    if (obj.dragging) {
      let newPosition = obj.data.getLocalPosition(obj.parent);

      obj.position.x = newPosition.x - obj.offset.x;
      obj.position.y = newPosition.y - obj.offset.y;

      if (obj.isControl) {
        this.resizeByControl(obj, obj.data.getLocalPosition(obj.parent.parent));
        // let newPos = obj.data.getLocalPosition(obj.parent);
        // let newPosX = newPos.x + (obj.width / 2);
        // let newPosY = newPos.y + (obj.height / 2);
        // obj.parent.drawRect(newPosX, newPosY, obj.parent.width, obj.parent.height);
      }

    }
  }
  resizeByControl(control, dragPos) {
    this.generateGrid(); // SQUELCH
    // obj = object being resized

    // obj.graphicsData[0].shape.height
    let obj = control.parent;
    let shape = obj.graphicsData[0].shape;
    // Have to save these values because the control object is deleted before resizing.

    // ctrlType is really the position of the control relative the target object.
    // { x: 0, y: 0 } is the upper left, { x: 1, y: 1 } is the lower right.
    let ctrlType = { x: control.controlPosition, y: control.controlPosition };
    let ctrlSize = { width: control.width, height: control.height };

    // TODO: offsets will be different for different corner controls.
    let newPosition = { x: dragPos.x + (ctrlSize.width / 2), y: dragPos.y + (ctrlSize.height / 2) };
    console.log(newPosition);

    //this.removeControls(obj);

    let posDelta = { x: newPosition.x - obj.x, y: newPosition.y - obj.y };
    console.log(shape);


    let newWidth = shape.width - posDelta.x;
    let newHeight = shape.height - posDelta.y;

    obj.resize(newWidth, newHeight);
    obj.translate(newPosition.x, newPosition.y);
    this.resetControlPositions(obj);
    //this.resetControls(obj);
  }
  dragEnd = (obj, event) => {
    obj.alpha = 1.0;
    obj.dragging = false;


    if (obj.isControl) {
      // How do we check which control this is, and do we need to?
      // Set X/Y values for control on creation: obj.control_x = 1/0, obj.control_y = 1/0

      // get position of control with respect to the grid ("global coords")
      // the top left corner of the transformed parent will be set near here
      let newPosition = obj.data.getLocalPosition(obj.parent.parent);

      this.resizeByControl(obj, newPosition);
      return;

      // offset the position by the size of the control itself.
      newPosition.x += obj.width / 2;
      newPosition.y += obj.height / 2;

      // find the change in position
      let parent_delta_x = newPosition.x - obj.parent.x;
      let parent_delta_y = newPosition.y - obj.parent.y;

//  let new_width = parent_delta_x < 0 ? obj.parent.width - obj.width : obj.parent.width - parent_delta_x;
//  let new_height = parent_delta_y < 0 ? obj.parent.height - obj.height : obj.parent.height - parent_delta_y;

      // assuming, at this point, that this control is for the upper left corner
      // then if change in position is < 0, we're moving left/up
      // if change in position is > 0, we're going right/down
      console.log(`parent_delta_x: ${parent_delta_x}`);
      console.log(`parent_delta_y: ${parent_delta_y}`);
      // resizing problem occurs when delta is greater than 0 but less than the size of the control

      let eff_control_width = obj.width - parent_delta_x;
      let eff_control_height = obj.height - parent_delta_y;
      console.log(`eff_control_height: ${eff_control_height}`);
      console.log(`eff_control_width: ${eff_control_width}`);

// Works for dragging in/out WITHOUT control landing on border:


      let new_width = 0;
      let new_height = 0;
      // BUG: resizing after dragging can cause width/height to be increased by an additional pixel.
      // Not fixing because the problem is minor and should go away once snapping in implemented.
      if (Math.abs(parent_delta_x) < obj.width) {
        // The control is over the border of the rectangle it manipulates.
        new_width = parent_delta_x <= 0 ? obj.parent.width - (obj.width * 2)
          : obj.parent.width - (obj.width * 2) - eff_control_width - parent_delta_x;
/*
        if (parent_delta_x <= 0) {
          new_width = obj.parent.width - (obj.width * 2);
        } else {
          new_width = obj.parent.width - (obj.width * 2) - eff_control_width - parent_delta_x;
        }
        */
      } else {
        new_width = parent_delta_x <= 0 ? obj.parent.width - obj.width*2 : obj.parent.width - obj.width*2 - parent_delta_x;
      }
      if (Math.abs(parent_delta_y) < obj.height) {
        /* if (parent_delta_y <= 0) {
          new_height = obj.parent.height - obj.height;
        } else { new_height = obj.parent.height - } */
        new_height = parent_delta_y <= 0 ? obj.parent.height - obj.height*2 : obj.parent.height - obj.height*2 - eff_control_height - parent_delta_y;
      } else {
        new_height = parent_delta_y <= 0 ? obj.parent.height - obj.height*2 : obj.parent.height - obj.height*2 - parent_delta_y;
      }

      obj.parent.translate(newPosition.x, newPosition.y);
      obj.parent.resize(new_width, new_height);

      this.resetControls(obj.parent);
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
