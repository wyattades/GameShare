import React, { Component } from 'react';

import Engine from '../utils/EditorEngine';

// document.getElementById('obj-create').addEventListener('click', () => {
//   grid.addObject(createRect({
//     x: 80, y: 80, w: 80, h: 80, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
//   }));
// });

// document.getElementById('boundary-x').addEventListener('change', () => {
//   GRID_X = document.getElementById('boundary-x').value;
//   drawGrid();
// });

// document.getElementById('boundary-y').addEventListener('change', () => {
//   GRID_Y = document.getElementById('boundary-y').value;
//   drawGrid();
// });

export default class extends Component {

  componentDidMount() {

    this.app = new Engine(this._parent, {});
    this.init();
    this.app.start();

    // this.app.container.position.x = -400;
    // this.app.container.position.y = -400;
  }

  componentWillUnmount() {
    this.app.stop();
  }

  init = () => { }

  render() {
    return (
      <div ref={_ => { this._parent = _; }}/>
    );
  }
}
