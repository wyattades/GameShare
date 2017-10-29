import $ from 'jquery';
// import { createRect, createObject } from '../utils/EditorEngine';
// import InputManager from '../utils/InputManager';

// Handles displaying content for object/grid tabs
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

