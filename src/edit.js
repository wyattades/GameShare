import $ from 'jquery';
import './styles/styles.scss';

import Engine, { createRect, createObject } from './utils/EditorEngine';
import './components/Editor';

let app;
const SNAP = 10;
let GRID_X = 7000;
let GRID_Y = 7000;

// Create a draggable grid
let grid = createObject({
  x: 0, y: 0, w: GRID_X + 800, h: GRID_Y + 800, draggable: true, container: true
});

// Create a rectangle for the boundary of the game
let boundary = grid.addObject(createRect({
  x: 400, y: 400, w: GRID_X, h: GRID_Y, draggable: false, stroke: 0xFF0000, weight: 3
}));

function drawGrid() {
  grid.w = GRID_X;
  grid.h = GRID_Y;
  // console.log(grid.w, grid.h);

  for (let x = 0; x < grid.w + 800; x += SNAP) {
    if (x % 100 === 0) { grid.lineStyle(2, 0xAAAAAA, 1); }
    else { grid.lineStyle(1, 0xAAAAAA, 1); }
    grid.moveTo(x, 0);
    grid.lineTo(x, grid.w + 800);
  }
  for (let y = 0; y < grid.h + 800; y += SNAP) {
    if (y % 100 === 0) { grid.lineStyle(2, 0xAAAAAA, 1); }
    else { grid.lineStyle(1, 0xAAAAAA, 1); }
    grid.moveTo(0, y);
    grid.lineTo(grid.h + 800, y);
  }
}

drawGrid();

app = new Engine($('#root').get(0), {
  container: grid,
});

grid.addObject(createRect({
  x: 450, y: 450, w: 80, h: 100, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
}));

app.start();

grid.position.x = -400;
grid.position.y = -400;
