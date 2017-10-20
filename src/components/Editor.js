import React, { Component } from 'react';

import Engine from '../utils/EditorEngine';
// import InputManager from '../utils/InputManager';

/*

document.getElementById('obj-create').addEventListener('click', () => {
  grid.addObject(createRect({
    x: 80, y: 80, w: 80, h: 80, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
  }));
});

*/

export default class extends Component {

  componentDidMount() {

    this.app = new Engine(this._parent, {});
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
