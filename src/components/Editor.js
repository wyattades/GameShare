import React, { Component } from 'react';

import Engine, { createRect } from '../utils//Engine';
import Grid from './Grid';

export default class extends Component {

  componentDidMount() {

    this.app = new Engine(this._parent);
    this.setup();
    this.app.start();
  }

  componentWillUnmount() {
    this.app.stop();
  }

  setup = () => {
    this.app.addObject(createRect({
      x: 100, y: 100, w: 80, h: 100, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
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
