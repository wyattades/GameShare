import React, { Component } from 'react';

import Engine, { createRect, createGraphic } from '../utils//Engine';

// Store the state of pressed keys
const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
  '-': false,
  '+': false,
};

// Listen for certain key press events
document.addEventListener('keydown', e => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
}, false);

document.addEventListener('keyup', e => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
}, false);

// Create a draggable grid
const SNAP = 10;
const GRID_SIZE = 10000;
const grid = createGraphic({ x: 0, y: 0, w: GRID_SIZE, h: GRID_SIZE, draggable: true });
grid.lineStyle(1, 0xAAAAAA, 1);
for (let x = 0; x < GRID_SIZE; x += SNAP) {
  grid.moveTo(x, 0);
  grid.lineTo(x, GRID_SIZE);
}
for (let y = 0; y < GRID_SIZE; y += SNAP) {
  grid.moveTo(0, y);
  grid.lineTo(GRID_SIZE, y);
}

export default class extends Component {

  componentDidMount() {

    this.app = new Engine(this._parent);
    this.init();
    this.app.start();
  }

  componentWillUnmount() {
    this.app.stop();
  }

  init = () => {

    // Set the grid as the background
    this.app.addObject(grid);

    // Add example object
    this.app.addObject(createRect({
      x: 100, y: 100, w: 80, h: 100, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
    }));
  }

  render() {
    return (
      <div ref={_ => { this._parent = _; }}/>
    );
  }
}
