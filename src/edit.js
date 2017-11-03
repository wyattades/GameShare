import $ from 'jquery';
import './styles/styles.scss';

import Engine from './edit/EditorEngine';
import './edit/Editor';

import typeTemplate from './templates/type.pug';

let app = new Engine($('#root').get(0));
app.start();

let typesHTML = typeTemplate({ groups: app.groups });
$(typesHTML).insertBefore('#new-buttons');

$('#new-object-button').click(() => {
  console.log(app.addWall());
});

$('#new-type-button').click(() => {
  let typeName = prompt('Enter new object type name:');
  app.addGroup(typeName);
  $('.group').remove();
  typesHTML = typeTemplate({ groups: app.groups });
  $(typesHTML).insertBefore('#new-buttons');
});
