import * as Pixi from 'pixi.js';
import Colors from './Colors';
import EE from './EventEmitter';

const events = new EE();

const update = obj => events.broadcast('update-object', obj.group, obj.id, {
  x: obj.x, y: obj.y, w: obj.w, h: obj.h,
});

// Add shaded rectangles over the unplayable region of the map
// Add grid lines
const drawGrid = (grid, snap, bounds) => {

  grid.clear();
  
  const tint = Colors.GRID;
  const w = (bounds.x * 2) + bounds.w;
  const h = (bounds.y * 2) + bounds.h;

  grid.beginFill(0xFFFFFF);
  grid.drawRect(0, 0, w, h);
  grid.endFill();

  grid.lineStyle(0, 0, 0);
  grid.beginFill(tint, 0.4);
  grid.drawRect(0, 0, w, bounds.y);
  grid.drawRect(0, bounds.y + bounds.h, w, bounds.y);
  grid.drawRect(0, bounds.y, bounds.x, bounds.h);
  grid.drawRect(bounds.x + bounds.w, bounds.y, bounds.x, bounds.h);
  grid.endFill();

  grid.lineStyle(1, tint, 1);
  for (let x = 0; x <= w; x += snap) {
    grid.lineStyle(x % 100 === 0 || x === w ? 2 : 1, tint, 1);
    grid.moveTo(x, 0);
    grid.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += snap) {
    grid.lineStyle(y % 100 === 0 || y === h ? 2 : 1, tint, 1);
    grid.moveTo(0, y);
    grid.lineTo(w, y);
  }

  grid.lineStyle(2, Colors.BLUE, 1);
  grid.drawRect(bounds.x, bounds.y, bounds.w, bounds.h);
};

class Engine {

  groups = {};

  resizeControlSize = 16; // Size of resize control elements.

  constructor(parent, options) {

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.app = new Pixi.Application({
      width: this.width,
      height: this.height,
      // transparent: true,
    });

    parent.appendChild(this.app.view);

    const bounds = options.bounds,
          w = bounds.w + (bounds.x * 2),
          h = bounds.h + (bounds.y * 2);

    this.container = this.createObject({ x: 0, y: 0, w, h, draggable: true });
    this.app.stage.addChild(this.container);
    this.grid = new Pixi.Graphics();
    this.container.addChild(this.grid);

    this.options = options;
    this.resizeGrid();

    this.selectedObject = null; // The currently selected object.
    this.lockSelect = false; // When true, objects won't be selected.

    this.bindListeners();

  }

  bindListeners = () => {
    const listeners = {

      'add-object': this.addObject,

      'add-group': this.addGroup,
    
      'remove-group': (groupId) => {
        if (this.groups.hasOwnProperty(groupId)) {
          this.groups[groupId].destroy();
          delete this.groups[groupId];
        }
      },
      'remove-object': (groupId, objId) => {
        const objects = this.groups[groupId].objects;
        if (objects.hasOwnProperty(objId)) {
          objects[objId].destroy();
          delete objects[objId];
        }
      },
    
      'update-object': (groupId, objId, newData) => {
        const obj = this.groups[groupId].objects[objId];
        if (obj) {
          const { x, y, w, h, stroke, fill } = newData;

          if (x !== undefined) obj.x = x;
          if (y !== undefined) obj.y = y;
          if (w !== undefined || h !== undefined) obj.resize(w, h);

          if (fill !== undefined) {
            if (fill === null) {
              obj.fill = null;
              obj.tint = this.groups[groupId].fill;
            } else {
              obj.fill = fill;
              obj.tint = fill;
            }
          }
          if (stroke !== undefined) ;
        }
      },

      'update-group': (groupId, newData) => {
        const group = this.groups[groupId];
        if (group) {
          const { fill, stroke } = newData;

          if (fill !== undefined) {
            group.fill = fill;
            for (let objId in group.objects) {
              const obj = group.objects[objId];
              obj.fill = obj.fill || fill;
              obj.tint = obj.fill;
            }
          }
          if (stroke !== undefined) ;
        }
      },
    
      'update-option': this.updateOption,

      select: (groupId, objId) => {
        if (objId && groupId) {
          const obj = this.groups[groupId].objects[objId];
          if (obj) this.selectObject(obj);
        } else {
          // TODO: Select group?
          this.clearSelection();
        }
      },
    };

    for (let event in listeners) {
      events.on(event, listeners[event]);
    }
  }

  // Catch-all for modifying game options.
  updateOptions = (opt) => {
    for (let option in opt) {
      this.updateOption(option, opt[option]);
    }
  }


  updateOption = (key, value, keyDeep) => {
    if (keyDeep) this.options[key][keyDeep] = value;
    else this.options[key] = value;

    // Handle grid change
    if (key === 'bounds' || key === 'snap') {
      this.resizeGrid();
    }
  }
  
  // Resize the grid to the options bounds parameters. Adds border region to given values.
  resizeGrid = () => {

    const bounds = this.options.bounds,
          w = bounds.w + (bounds.x * 2),
          h = bounds.h + (bounds.y * 2);

    this.container.hitArea = new Pixi.Rectangle(0, 0, w, h);

    drawGrid(this.grid, this.options.snap, bounds);
  }

  start = () => {
    this.app.start();
  }

  stop = () => {
    this.app.ticker.destroy(); // or stop() ?
    this.app.stop();
  }

  createObject = ({ x = 0, y = 0, w = 1, h = 1, draggable, selectable }) => {

    const obj = new Pixi.Graphics();

    if (selectable) { obj.selectable = true; }

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
      obj
      // Mouse down
      .on('mousedown', this.onMouseDown)
      .on('touchstart', this.onMouseDown)
      // Mouse up
      .on('mouseup', this.onMouseUp)
      .on('mouseupoutside', this.onMouseUp)
      .on('touchend', this.onMouseUp)
      .on('touchendoutside', this.onMouseUp)
      // Mouse move
      .on('mousemove', this.onMouseMove)
      .on('touchmove', this.onMouseMove);
    }

    return obj;
  };

  createShape = ({ w = 1, h = 1, fill, stroke, shape = 'rect', borderRadius, ...rest }) => {

    const obj = this.createObject({ w, h, ...rest });

    if (typeof stroke === 'number') obj.lineStyle(1, stroke, 1);
    if (typeof fill === 'number') {
      obj.beginFill(0xFFFFFF);
      obj.tint = fill;
    }

    let getHitArea;
    switch (shape) {
      case 'rect':
      default:
        obj.drawRect(0, 0, w, h);
        getHitArea = (_w, _h) => new Pixi.Rectangle(0, 0, _w, _h);
        break;
      case 'round_rect':
        obj.drawRoundedRect(0, 0, w, h, borderRadius);
        getHitArea = (_w, _h) => new Pixi.RoundedRectangle(0, 0, _w, _h, borderRadius);
        break;
      case 'ellipse':
        obj.drawEllipse(w / 2, h / 2, w / 2, h / 2);
        getHitArea = (_w, _h) => new Pixi.Ellipse(_w / 2, _h / 2, _w / 2, _h / 2);
        break;
    }

    obj.endFill();
    obj.shape = obj.graphicsData[0].shape;

    obj.resize = (width, height) => {
      obj.hitArea = getHitArea(width, height);

      obj.shape.x = obj.hitArea.x;
      obj.shape.y = obj.hitArea.y;
      obj.shape.width = obj.hitArea.width;
      obj.shape.height = obj.hitArea.height;
      
      obj.w = width;
      obj.h = height;
      obj.dirty++;
      obj.clearDirty++;
    };

    obj.translate = (xp, yp) => {
      obj.position.x = xp;
      obj.position.y = yp;
    };

    return obj;
  };

  // Add a new wall rectangle to the level.
  // Returns the wall object that was just added.
  addObject = (groupId, groupData, objId, objData) => {

    const {
      x, y, w, h,
      ...rest
    } = objData;

    rest.stroke = rest.stroke || groupData.stroke;
    rest.fill = rest.fill || groupData.fill;

    const obj = this.createShape({
      x, y, w, h,
      draggable: true,
      selectable: true,
      ...rest,
    });
    obj.group = groupId;
    obj.id = objId;

    Object.assign(objData, { x, y, w, h });

    this.groups[groupId].addChild(obj);
    this.groups[groupId].objects[objId] = obj;
  }

  getSnapPosition = (pos) => Math.floor(pos / this.options.snap) * this.options.snap;

  // Add a new object group to the level.
  addGroup = (groupId, groupData) => {

    // groupData = Object.assign(DEFAULT_GROUP_DATA, groupData);

    const newGroup = new Pixi.Container();
    newGroup.objects = {};

    this.container.addChild(newGroup);
    this.groups[groupId] = newGroup;
  }

  // Control manipulation.
  createControls = (obj) => {
    // Saving these because they change with added children.
    let obj_width = obj.width,
        obj_height = obj.height;

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        let ctl = this.createShape({
          x: x === 0 ? -this.resizeControlSize : obj_width,
          y: y === 0 ? -this.resizeControlSize : obj_height,
          w: this.resizeControlSize,
          h: this.resizeControlSize,
          fill: Colors.CONTROL,
          stroke: Colors.BLACK,
          // shape: 'round_rect',
          // borderRadius: 8,
          draggable: true,
        });
        ctl.isControl = true;

        // controlPosition.x: left (0) or right (1) side.
        // controlPosition.y: top (0) or bottom (1) side.
        ctl.controlPosition = { x, y };

        ctl.resetPosition = () => {
          ctl.x = ctl.controlPosition.x === 0 ? -ctl.width : ctl.parent.w;
          ctl.y = ctl.controlPosition.y === 0 ? -ctl.height : ctl.parent.h;
        };

        obj.addChild(ctl);
      }
    }
  };
  removeControls = (obj) => {
    // TODO: remove with reverse forloop
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
      this.removeControls(this.selectedObject);
    }

    this.selectedObject = null;
  }

  // Moves the element to the bottom of the list, so it renders on top.
  moveToTop = (obj) => {
    const parent = obj.parent;
    parent.removeChild(obj);
    parent.addChild(obj);
  }

  // Clear the current selection, then select the given object.
  selectObject = (obj) => {
    if (obj.isControl) { return; }
    this.clearSelection();
    if (!obj.selectable) { return; }

    this.selectedObject = obj;
    this.moveToTop(this.selectedObject);

    this.createControls(obj);
  }

  // Object dragging logic.
  // Called by event handler functions.
  dragStart = (obj, event) => {
    if (obj !== this.container) {
      obj.alpha = 0.8;
    }
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
        newPosition.x = Math.floor(newPosition.x / this.options.snap) * this.options.snap;
        newPosition.y = Math.floor(newPosition.y / this.options.snap) * this.options.snap;

        // Check bounds and clamp
        const maxWidth = this.options.bounds.w + (this.options.bounds.x * 2);
        if (newPosition.x < 0) {
          newPosition.x = 0;
        } else if (newPosition.x + obj.w > maxWidth) {
          newPosition.x = maxWidth - obj.w;
        }

        const maxHeight = this.options.bounds.h + (this.options.bounds.y * 2);
        if (newPosition.y < 0) {
          newPosition.y = 0;
        } else if (newPosition.y + obj.h > maxHeight) {
          newPosition.y = maxHeight - obj.h;
        }
      }

      obj.position.set(newPosition.x, newPosition.y);

      if (obj.isControl) {
        this.resizeParent(obj);
        update(obj.parent);
      } else if (obj !== this.container) {
        update(obj);
      }

    }
  }
  resizeParent(control) {
    let obj = control.parent,
        dragPos = control.data.getLocalPosition(obj.parent),
        newPosition = { x: 0, y: 0 },
        newSize = { width: 0, height: 0 };

    dragPos.x = this.getSnapPosition(dragPos.x);
    dragPos.y = this.getSnapPosition(dragPos.y);

    // Calculate new width.
    if (control.controlPosition.x === 0) {
      // This is a left-side control.
      dragPos.x += control.width / 2; // Snap offset
      newPosition.x = dragPos.x + (control.width / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let xMax = (obj.x + obj.w) - this.options.snap;
      newPosition.x = Math.min(newPosition.x, xMax);

      // Clamp to grid area.
      let xMin = 0;
      newPosition.x = Math.max(newPosition.x, xMin);

      newSize.width = (obj.x + obj.w) - newPosition.x;
    } else {
      // This is a right-side control.
      newPosition.x = obj.x;
      newSize.width = dragPos.x - obj.x;

      // Clamp to grid boundary width.
      const maxWidth = this.options.bounds.w + (this.options.bounds.x * 2);
      if (newPosition.x + newSize.width > maxWidth) {
        newSize.width = maxWidth - newPosition.x;
      }
    }
    // Clamp to minimum width.
    if (newSize.width < this.options.snap) { newSize.width = this.options.snap; }


    // Calculate new height.
    if (control.controlPosition.y === 0) {
      // This is a top control.
      dragPos.y += control.height / 2; // Snap offset.
      newPosition.y = dragPos.y + (control.height / 2);

      // Clamp to dragging bounds (prevents sliding element):
      let yMax = (obj.y + obj.h) - this.options.snap;
      newPosition.y = Math.min(newPosition.y, yMax);

      // Clamp to grid area.
      let yMin = 0;
      newPosition.y = Math.max(newPosition.y, yMin);

      newSize.height = (obj.y + obj.h) - newPosition.y;
    } else {
      // This is a bottom control.
      newPosition.y = obj.y;
      newSize.height = dragPos.y - obj.y;

      // Clamp to grid boundary height.
      const maxHeight = this.options.bounds.h + (this.options.bounds.y * 2);
      if (newPosition.y + newSize.height > maxHeight) {
        newSize.height = maxHeight - newPosition.y;
      }
    }
    // Clamp to minimum height.
    if (newSize.height < this.options.snap) { newSize.height = this.options.snap; }

    events.broadcast('update-object', obj.group, obj.id, {
      x: newPosition.x, y: newPosition.y, w: newSize.width, h: newSize.height,
    }, true);

    obj.translate(newPosition.x, newPosition.y);
    obj.resize(newSize.width, newSize.height);
    this.resetControlPositions(obj);
  }
  dragEnd = (obj) => {
    obj.alpha = 1.0;
    obj.dragging = false;

    if (obj.isControl) {
      this.resizeParent(obj);
      update(obj.parent);
    } else if (obj !== this.container) {
      update(obj);
    }
  }

  // Event handler functions.
  onMouseDown = (e) => {
    const obj = e.currentTarget;

    if (this.lockSelect) { return; }
    this.lockSelect = true;

    if (!obj.isControl) events.emit('select', obj.group, obj.id);

    if (obj.draggable) { this.dragStart(obj, e); }
  }
  onMouseUp = (e) => {
    const obj = e.currentTarget;

    if (obj.dragging) { this.dragEnd(obj, e); }
    this.lockSelect = false;
  }
  onMouseMove = (e) => {
    const obj = e.currentTarget;
    
    if (obj.dragging) { this.dragMove(obj, e); }
  }

}

export default Engine;