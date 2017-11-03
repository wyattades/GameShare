import $ from 'jquery';
import './styles/styles.scss';

import Engine from './edit/EditorEngine';
import './edit/Editor';

let app = new Engine($('#root').get(0));
app.start();

$('#new-object-button').click(() => {
  console.log(app.addWall());
});

$('#new-type-button').click(() => {
  console.log(app.addGroup());
});
