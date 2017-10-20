import React, { Component } from 'react';

import Engine from '../utils/EditorEngine';
// import InputManager from '../utils/InputManager';

/*
const SNAP = 10;
const GRID_SIZE = 10000;

// Create a draggable grid
const grid = createObject({
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

document.getElementById('obj-create').addEventListener('click', () => {
  grid.addObject(createRect({
    x: 80, y: 80, w: 80, h: 80, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
  }));
});

*/

export default class extends Component {

  componentDidMount() {

    this.app = new Engine(this._parent, {
      // container: grid,
    });
    this.init();
    this.app.start();
  }

  componentWillUnmount() {
    this.app.stop();
  }

  init = () => {
    /*
    // Add example object
    grid.addObject(createRect({
      x: 100, y: 100, w: 80, h: 100, draggable: true, selectable: true, fill: 0xFFAABB, stroke: 0x000000,
    }));
    */
  }

  render() {
    return (
      <div ref={_ => { this._parent = _; }}/>
    );
  }
}
