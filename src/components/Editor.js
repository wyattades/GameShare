import React, { Component } from 'react';

import Engine, { createRect } from '../Engine';
import Grid from './Grid';

export default class extends Component {

  componentDidMount() {

    this.width = this._parent.offsetWidth;
    this.height = this._parent.offsetHeight;

    this.app = new Engine(this._parent, this.width, this.height);
    this.setup();
    this.app.start();
  }

  componentWillUnmount() {
    this.app.stop();
  }

  setup = () => {
    this.app.addObject(createRect({
      x: 200, y: 300, w: 80, h: 100, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
    }));
  }

  render() {
    return (
      <div ref={_ => { this._parent = _; }}>
        <Grid x={800} y={600} w={1920} h={1080}/>
      </div>
    );
  }
}
