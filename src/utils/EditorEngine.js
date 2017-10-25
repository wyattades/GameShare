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
    const SNAP = 10;
    this.container = this.generateGrid(GRID_SIZE, GRID_SIZE, SNAP);
    this.app.stage.addChild(this.container);

    this.selectedObject = null; // The currently selected object.
    this.lockSelect = false; // When true, objects won't be selected.

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
    this.container.addObject(
      this.createRect({
        x: 100,
        y: 100,
        w: 50,
        h: 50,
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

    //
    if (primitive) {
      obj.resize = (width, height) => {
        console.log("resizing");
        obj.graphicsData[0].shape.height = height;
        obj.graphicsData[0].shape.width = width;
        obj.dirty++;
        obj.clearDirty++;
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
    const control = this.createRect({
      x: -10,
      y: -10,
      w: width,
      h: height,
      fill: Colors.WHITE,
      stroke: Colors.BLACK,
      draggable: true,
      container: false,
      selectable: false });

    control.isControl = true;
    obj.addChild(control);
  };
  removeControls = (obj) => {
    for (let c of obj.children) {
      if (c.isControl) {
        c.destroy();
        // this.selectedObject.removeChild(c);
      }
    }
  };
  resetControls = obj => {
    this.removeControls(obj);
    this.createControls(obj);
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
    //console.log(this.selectedObject.children);
    //console.log(this.selectedObject);
    //console.log(this.selectedObject.graphicsData);
  }

  // Object dragging logic.
  // Called by event handler functions.
  dragStart = (obj, event) => {
    obj.alpha = 0.8;
    obj.dragging = true;
    obj.data = event.data;
    obj.offset = event.data.getLocalPosition(obj);
    //console.log(obj.parent.width);
  }
  dragMove = (obj, event) => {
    if (obj.dragging) {
      let newPosition = obj.data.getLocalPosition(obj.parent);
      obj.position.x = newPosition.x - obj.offset.x;
      obj.position.y = newPosition.y - obj.offset.y;

      //console.log("newPosition: ");
      //console.log(newPosition);
      //console.log("Offset: ");
      //console.log(obj.offset);



      if (obj.isControl) {
        let newPos = obj.data.getLocalPosition(obj.parent);
        let newPosX = newPos.x + (obj.width / 2);
        let newPosY = newPos.y + (obj.height / 2);
        //obj.parent.drawRect(newPosX, newPosY, obj.parent.width, obj.parent.height);

      }

    }
  }
  dragEnd = (obj, event) => {
    obj.alpha = 1.0;
    obj.dragging = false;


    if (obj.isControl) {
      let newPosition = obj.data.getLocalPosition(obj.parent.parent);
      newPosition.x += obj.width / 2;
      newPosition.y += obj.height / 2;

      let parent_delta_x = newPosition.x - obj.parent.x;
      let parent_delta_y = newPosition.y - obj.parent.y;
      //parent_delta_x -= obj.offset.x;
      //parent_delta_x += (obj.width / 2);
      //parent_delta_y -= obj.offset.y;
      //parent_delta_y += (obj.height / 2);
      //console.log(parent_delta_x);
      //console.log(parent_delta_y);
      //obj.parent.width -= parent_delta_x;
      //obj.parent.height -= parent_delta_y;
      //obj.parent.x = newPosition.x;
      //obj.parent.y = newPosition.y;

      let new_width = parent_delta_x < 0 ? obj.parent.width - obj.width : obj.parent.width - parent_delta_x;
      let new_height = parent_delta_y < 0 ? obj.parent.height - obj.height : obj.parent.height - parent_delta_y;

      //console.log("SHAPE:");
      //console.log(obj.parent.graphicsData[0].shape);

      obj.parent.x = newPosition.x;
      obj.parent.y = newPosition.y;
      //console.log("old shape.height: "); console.log(obj.parent.graphicsData[0].shape.height);

      /*
      obj.parent.graphicsData[0].shape.height = new_height;
      obj.parent.graphicsData[0].shape.width = new_width;
      obj.parent.dirty++;
      obj.parent.clearDirty++;
      */

      //console.log(obj.parent);
      //console.log(obj.parent.resize);

      obj.parent.resize(new_width, new_height);

      this.resetControls(obj.parent);
      //console.log("new shape.height: "); console.log(obj.parent.graphicsData[0].shape.height);
      /*
      const newObj = this.createRect({
        x: newPosition.x,// + (obj.width / 2),
        y: newPosition.y,// + (obj.width / 2),
        w: new_width,//obj.parent.width,// - parent_delta_x,
        h: new_height,//obj.parent.height,// - parent_delta_y,
        draggable: obj.parent.draggable,
        selectable: obj.parent.selectable,
        fill: Colors.WHITE, //obj.parent.fill,
        stroke: Colors.BLACK, //obj.parent.stroke });
      });
      this.container.addObject(newObj);
      console.log("original width: "); console.log(obj.parent.width);
      console.log("new width: "); console.log(newObj.width);
      this.container.removeChild(obj.parent);
      this.selectObject(newObj);
      */
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
