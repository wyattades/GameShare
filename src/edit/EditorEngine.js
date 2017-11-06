import * as Pixi from 'pixi.js';
import Colors from './Colors';

const GRID_SIZE = 500;
const GRID_SPACING = 20; // SNAP
const GRID_BORDER_SIZE = 100; // Size of the border around the playable area (one side)

const RECT_MIN_SIZE = 20; // Minimum size of a rectangle object.
const RESIZE_CONTROL_SIZE = 20;

class Engine {

  constructor(parent, initialData) {

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.app = new Pixi.Application({
      width: this.width,
      height: this.height,
      transparent: true,
    });

    parent.appendChild(this.app.view);

    this.gridSize = GRID_SIZE;
    this.gridSpacing = GRID_SPACING;
    this.gridBorderSize = GRID_BORDER_SIZE;

    this.container = this.createGrid(this.gridSize, this.gridSize,
      this.gridSpacing, this.gridBorderSize, Colors.GRAY);
    this.app.stage.addChild(this.container);

    this.selectedObject = null; // The currently selected object.
    this.lockSelect = false; // When true, objects won't be selected.

    this.rectMinSize = RECT_MIN_SIZE;
    this.resizeControlSize = RESIZE_CONTROL_SIZE; // Size of resize control elements.

    // Adding some test data
    // this.addWall();
    // this.addWall();

    // Testing level data exporting
    // let data = this.getLevelData();
    // console.log(data);
  }

  // Return a JSON-friendly level data object, for saving and loading.
  getLevelData = () => {
    let data = {};

    data.options = {
      snap: 8,
      backgroundColor: 0xDDEEDD,
      maxBulletsPerPlayer: 4,
      maxPlayers: 20,
      bounds: {
        x: this.gridBorderSize,
        y: this.gridBorderSize,
        w: this.gridSize - this.gridBorderSize,
        h: this.gridSize - this.gridBorderSize,
      },
      bulletSpeed: 1000,
      fireRate: 200,
      playerSpeed: 500,
      bulletHealth: 2,
    };

    data.groups = [
      {
        name: 'placeholder',
        stroke: 0x00FFFF,
        objects: [],
      },
    ];


    data.objects = [];

    for (let i = 0, l = this.container.children.length; i < l; i++) {
      let c = this.container.children[i];
      let placeholder_group = 0;
      data.objects.push({
        group: placeholder_group,
        x: c.x,
        y: c.y,
        w: c.shape.width,
        h: c.shape.height,
      });
      data.groups[placeholder_group].objects.push(i);
    }

    return data;
  }

  // Add shaded rectangles over the unplayable region of the map.
  addBorderShading = (grid, borderSize, tint) => {
    grid.lineStyle(0, tint, 0.08);
    grid.beginFill(tint, 0.08);
    grid.drawRect(0, 0, grid.width, borderSize);
    grid.drawRect(0, borderSize, borderSize, grid.height - (borderSize * 2));
    grid.drawRect(grid.width - borderSize - 2, borderSize, borderSize, grid.height - (borderSize * 2));
    grid.drawRect(0, grid.height - borderSize, grid.width - 2, borderSize);
  }
  createGrid = (width, height, snap, borderSize, lineColor) => {

    let w = width + (borderSize * 2);
    let h = height + (borderSize * 2);

    let grid = this.createObject({
      x: 0, y: 0, w, h, draggable: true, container: true,
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

    this.addBorderShading(grid, borderSize, Colors.BLACK);

    grid.bounds = { x: w, y: h };
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
    rect.shape = rect.graphicsData[0].shape;

    rect.resize = (width, height) => {
      rect.shape.width = width;
      rect.shape.height = height;
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

  // Add a new wall rectangle to the level.
  // Returns the wall object that was just added.
  addWall = () => {
    const wall = this.createRect({
      x: this.gridSpacing * 8,
      y: this.gridSpacing * 8,
      w: this.gridSpacing * 4,
      h: this.gridSpacing * 4,
      draggable: true,
      selectable: true,
      fill: Colors.WHITE,
      stroke: Colors.BLACK });
    this.container.addObject(wall);
    return wall;
  }

  // Control manipulation is in the Engine class for easier
  // access to object creation functions.
  createControls = (obj) => {
    // Saving these because they change with added children.
    let obj_width = obj.width,
        obj_height = obj.height;

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        let ctl = this.createRect({
          x: x === 0 ? -this.resizeControlSize : obj_width,
          y: y === 0 ? -this.resizeControlSize : obj_height,
          w: this.resizeControlSize,
          h: this.resizeControlSize,
          fill: Colors.CONTROL,
          stroke: Colors.BLACK,
          draggable: true,
        });
        ctl.isControl = true;

        // controlPosition.x: left (0) or right (1) side.
        // controlPosition.y: top (0) or bottom (1) side.
        ctl.controlPosition = { x, y };

        ctl.resetPosition = () => {
          ctl.x = ctl.controlPosition.x === 0 ? -ctl.width : ctl.parent.shape.width;
          ctl.y = ctl.controlPosition.y === 0 ? -ctl.height : ctl.parent.shape.height;
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

  // Moves the element to the bottom of the list, so it renders on top.
  moveToTop = (obj) => {
    this.container.removeChild(obj);
    this.container.addChild(obj);
  }

  // Clear the current selection, then select the given object.
  selectObject = (obj) => {
    if (obj.isControl) { return; }
    this.clearSelection();
    if (!obj.selectable) { return; }

    this.selectedObject = obj;
    this.moveToTop(this.selectedObject);

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

      newPosition.x -= obj.offset.x;
      newPosition.y -= obj.offset.y;

      if (obj !== this.container) {
        newPosition.x = Math.floor(newPosition.x / this.gridSpacing) * this.gridSpacing;
        newPosition.y = Math.floor(newPosition.y / this.gridSpacing) * this.gridSpacing;

        // Check bounds and clamp
        if (newPosition.x < 0) {
          newPosition.x = 0;
        } else if (newPosition.x + obj.shape.width > this.container.bounds.x) {
          newPosition.x = this.container.bounds.x - obj.shape.width;
        }

        if (newPosition.y < 0) {
          newPosition.y = 0;
        } else if (newPosition.y + obj.shape.height > this.container.bounds.y) {
          newPosition.y = this.container.bounds.y - obj.shape.height;
        }
      }

      obj.position.x = newPosition.x;
      obj.position.y = newPosition.y;

      if (obj.isControl) {
        this.resizeParent(obj);
      }

    }
  }
  resizeParent(control) {
    let obj = control.parent,
        dragPos = control.data.getLocalPosition(obj.parent),
        newPosition = { x: 0, y: 0 },
        newSize = { width: 0, height: 0 };

    // Anchor to snap points.
    dragPos.x = Math.floor(dragPos.x / this.gridSpacing) * this.gridSpacing;
    dragPos.y = Math.floor(dragPos.y / this.gridSpacing) * this.gridSpacing;

    // Calculate new width.
    if (control.controlPosition.x === 0) {
      // This is a left-side control.
      dragPos.x += control.width / 2; // Snap offset
      newPosition.x = dragPos.x + (control.width / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let xMax = (obj.x + obj.shape.width) - this.rectMinSize;
      newPosition.x = Math.min(newPosition.x, xMax);

      // Clamp to grid area.
      let xMin = 0;
      newPosition.x = Math.max(newPosition.x, xMin);

      newSize.width = (obj.x + obj.shape.width) - newPosition.x;
    } else {
      // This is a right-side control.
      newPosition.x = obj.x;
      newSize.width = dragPos.x - obj.x;

      // Clamp to grid boundary width.
      if (newPosition.x + newSize.width > this.container.bounds.x) {
        newSize.width = this.container.bounds.x - newPosition.x;
      }
    }
    // Clamp to minimum width.
    if (newSize.width < this.rectMinSize) { newSize.width = this.rectMinSize; }


    // Calculate new height.
    if (control.controlPosition.y === 0) {
      // This is a top control.
      dragPos.y += control.height / 2; // Snap offset.
      newPosition.y = dragPos.y + (control.height / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let yMax = (obj.y + obj.shape.height) - this.rectMinSize;
      newPosition.y = Math.min(newPosition.y, yMax);

      // Clamp to grid area.
      let yMin = 0;
      newPosition.y = Math.max(newPosition.y, yMin);

      newSize.height = (obj.y + obj.shape.height) - newPosition.y;
    } else {
      // This is a bottom control.
      newPosition.y = obj.y;
      newSize.height = dragPos.y - obj.y;

      // Clamp to grid boundary height.
      if (newPosition.y + newSize.height > this.container.bounds.y) {
        newSize.height = this.container.bounds.y - newPosition.y;
      }
    }
    // Clamp to minimum height.
    if (newSize.height < this.rectMinSize) { newSize.height = this.rectMinSize; }


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
