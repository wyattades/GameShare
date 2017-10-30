import $ from 'jquery';
// const compiledType = pug.compileFile('type.pug');

// import { createRect, createObject } from '../utils/EditorEngine';
import typeTemplate from '../templates/type.pug';

let defaultTypeHTML = typeTemplate({ name: 'default' });
$(defaultTypeHTML).insertBefore('#first-object');

// Handles displaying content for object/grid tabs
$('#object-tab').click(() => {
  $('#object-tab').addClass('is-active');
  $('#grid-tab').removeClass('is-active');
  $('#level-tab').removeClass('is-active');
  $('.object-block').css('display', 'flex');
  $('.grid-block').css('display', 'none');
  $('.level-block').css('display', 'none');
});

$('#grid-tab').click(() => {
  $('#object-tab').removeClass('is-active');
  $('#grid-tab').addClass('is-active');
  $('#level-tab').removeClass('is-active');
  $('.object-block').css('display', 'none');
  $('.grid-block').css('display', 'flex');
  $('.level-block').css('display', 'none');
});

$('#level-tab').click(() => {
  $('#object-tab').removeClass('is-active');
  $('#grid-tab').removeClass('is-active');
  $('#level-tab').addClass('is-active');
  $('.object-block').css('display', 'none');
  $('.grid-block').css('display', 'none');
  $('.level-block').css('display', 'flex');
});

// Handles displaying object settings panel
$('.object-button').click(() => {
  $('.object-settings').css('display', 'block');
});

$(document).click((event) => {
  if ($(event.target).attr('class') !== 'object-button' && $('.object-settings').css('display') === 'block') {
    $('.object-settings').css('display', 'none');
  }
});

// Handles adding type to sidebar
$('#new-type-button').click(() => {
  let typeName = prompt('Enter new object type name:');
  let typeHTML = typeTemplate({ name: typeName });
  $(typeHTML).insertBefore('#new-buttons');
});
