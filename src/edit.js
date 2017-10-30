import $ from 'jquery';
import './styles/styles.scss';

import Engine, { generateGrid } from './utils/EditorEngine';
import './components/Editor';

let app = new Engine($('#root').get(0));
app.start();

$('#new-object-button').click(function() {
  // grid.addObject(createRect({
  //   x: 500, y: 500, w: 80, h: 80, draggable: true, fill: 0xFFAABB, stroke: 0x000000,
  // }));
});
