import $ from 'jquery';
// import pug from 'pug';

// const pug = require('pug');
// const compiledType = pug.compileFile('type.pug');

// import { createRect, createObject } from '../utils/EditorEngine';
// import InputManager from '../utils/InputManager';

// Handles displaying content for object/grid tabs
$('#object-tab').click(function() {
  $('#object-tab').addClass('is-active');
  $('#grid-tab').removeClass('is-active');
  $('#level-tab').removeClass('is-active');
  $('.object-block').css('display', 'flex');
  $('.grid-block').css('display', 'none');
  $('.level-block').css('display', 'none');
});

$('#grid-tab').click(function() {
  $('#object-tab').removeClass('is-active');
  $('#grid-tab').addClass('is-active');
  $('#level-tab').removeClass('is-active');
  $('.object-block').css('display', 'none');
  $('.grid-block').css('display', 'flex');
  $('.level-block').css('display', 'none');
});

$('#level-tab').click(function() {
  $('#object-tab').removeClass('is-active');
  $('#grid-tab').removeClass('is-active');
  $('#level-tab').addClass('is-active');
  $('.object-block').css('display', 'none');
  $('.grid-block').css('display', 'none');
  $('.level-block').css('display', 'flex');
});

// Handles displaying object settings panel
$('.object-button').click(function() {
  $('.object-settings').css('display', 'block');
});

$(document).click(function(event) {
  if ($(event.target).attr('class') !== 'object-button' && $('.object-settings').css('display') === 'block') {
    $('.object-settings').css('display', 'none');
  }
});

// Handles adding type to sidebar
$('#new-type-button').click(function() {
  let typeName = prompt('Enter new object type name:');
  let typeHTML = compiledType({ name: typeName });
  // let typeHTML = '<div class="object-block panel-block"><span class="type-name">' + typeName + '</span><input type="color" name="type color" id="type-color" value="#FFAABB" style="margin-left: auto;"><div class="field has-addons"><div class="control"><button class="button is-small" name="rename type"><i class="fa fa-pencil"></i></button></div><div class="control"><button class="button is-small" name="delete type"><i class="fa fa-trash"></i></button></div></div></div>'
  $(typeHTML).insertBefore('#new-buttons');
});

// 