import $ from 'jquery';
// import Engine, { createRect, createObject } from '../utils/EditorEngine';
// import InputManager from '../utils/InputManager';

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

$('#object-tab').click(function() {
  $('#object-tab').addClass('is-active');
  $('#grid-tab').removeClass('is-active');
  $('.object-block').css('display', 'block');
  $('.grid-block').css('display', 'none');
});

$('#grid-tab').click(function() {
  $('#object-tab').removeClass('is-active');
  $('#grid-tab').addClass('is-active');
  $('.object-block').css('display', 'none');
  $('.grid-block').css('display', 'block');
});


