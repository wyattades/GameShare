import $ from 'jquery';
import './styles/styles.scss';

import Engine from './edit/EditorEngine';
import './edit/Editor';

import typeTemplate from './templates/type.pug';
import objectTemplate from './templates/object.pug';

// TODO: new object doesnt work when multiple types

let app = new Engine($('#root').get(0));
app.start();

let typesHTML = typeTemplate({ groups: app.groups });
$(typesHTML).insertBefore('#new-buttons');

$('#new-object-button').click(() => {
  let newObj = app.addWall();
  let objectHTML = objectTemplate({
    x: newObj.hitArea.x,
    y: newObj.hitArea.y,
    w: newObj.hitArea.width,
    h: newObj.hitArea.height,
  });

  let groupID = `type${newObj.group}`;
  $(objectHTML).insertAfter(`#${groupID}`);

  $('.object-button').click(() => {
    if ($('.object-settings').css('display') === 'none') {
      // TODO: if another object-button is green, make it white (when have unique id's)
      $('.object-button').parent().css('background-color', '#50e283');
      $('.object-settings').css('display', 'block');
    } else {
      $('.object-button').parent().css('background-color', 'white');
      $('.object-settings').css('display', 'none');
    }
  });
});

$('#new-type-button').click(() => {
  let typeName = prompt('Enter new object type name:');
  
  if (typeName) {
    app.addGroup(typeName);
  } else {
    app.addGroup();
  }

  $('.group').remove();
  typesHTML = typeTemplate({ groups: app.groups });
  $(typesHTML).insertBefore('#new-buttons');
});
