import $ from 'jquery';

import typeTemplate from '../templates/type.pug';
import objectTemplate from '../templates/object.pug';

module.exports = (app) => {

  $(document).on('click', '#new-object-button', (event) => {
    let objGroup = $(event.currentTarget).parent().prop('id');
    let newObj = app.addWall(objGroup);
    let objectHTML = objectTemplate({
      x: newObj.hitArea.x,
      y: newObj.hitArea.y,
      w: newObj.hitArea.width,
      h: newObj.hitArea.height,
    });
    $(objectHTML).insertAfter(`#${objGroup}`);
  });

  $(document).on('click', '.object-button', (event) => {
    $('.object-button').parent().css('background-color', 'white');
    $(event.currentTarget).parent().css('background-color', '#50e283');

    $('.object-settings').css('display', 'block');
    // TODO: make settings box go away at some point
  });

  $('#new-type-button').click(() => {
    let typeName = prompt('Enter new object type name:');
    let newGroup;

    if (typeName) {
      newGroup = app.addGroup(typeName);
    } else {
      newGroup = app.addGroup();
    }

    let groupNum = app.groups.length - 1;

    let typesHTML = typeTemplate({ name: newGroup.name, id: groupNum });
    $(typesHTML).insertBefore('#new-buttons');
  });

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
};
