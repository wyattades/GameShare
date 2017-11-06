import $ from 'jquery';

// import modalTemplate from '../templates/modal.pug';
import objectTemplate from '../templates/object.pug';
import typeTemplate from '../templates/type.pug';

let defaultTypeHTML = typeTemplate({ name: 'default' });
$(defaultTypeHTML).insertBefore('#new-buttons');

let defaultObjectHTML = objectTemplate({
  x: '450', y: '450', w: '80', h: '100',
});
$(defaultObjectHTML).insertBefore('#new-buttons');

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

$('.object-settings').blur(() => {
  $('.object-settings').css('display', 'none');
});

// Handles adding type to sidebar
$('#new-type-button').click(() => {
  // let modalHTML = modalTemplate();
  let typeName = prompt('Enter new object type name:');
  let typeHTML = typeTemplate({ name: typeName });
  $(typeHTML).insertBefore('#new-buttons');
});

// new object button next to each group
