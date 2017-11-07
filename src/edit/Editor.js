import $ from 'jquery';

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
