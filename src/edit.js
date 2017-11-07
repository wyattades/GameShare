import $ from 'jquery';

import './styles/styles.scss';
import { updateGame, createGame, assertLoggedIn, fetchGame } from './utils/db';
import Engine from './edit/EditorEngine';
import './edit/Editor';

import typeTemplate from './templates/type.pug';
import objectTemplate from './templates/object.pug';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

// TEMP
const tempData = {
  options: {
    snap: 8,
    backgroundColor: 0xFFFFFF,
    maxBulletsPerPlayer: 4,
    maxPlayers: 20,
    bounds: {
      x: 300,
      y: 300,
      w: 1000,
      h: 800,
    },
    bulletSpeed: 1000,
    fireRate: 200,
    playerSpeed: 500,
    bulletHealth: 2,
  },
  groups: [{
    name: 'default',
    objects: [],
  }],
  objects: [],
};

assertLoggedIn()
.then(() => {

  if (gameId) {
    console.log('Starting editor for game:', gameId);
    return fetchGame(gameId);
  } else {
    // TEMP: pass some initial data
    return tempData;
  }
})
.then(initialData => {

  // Initiate object editor view
  const app = new Engine($('#root').get(0), initialData);
  app.start();

  let typesHTML = typeTemplate({ groups: app.groups });
  $(typesHTML).insertBefore('#new-buttons');

  // Save new game data to database
  const saveGame = newStatus => e => {
    $(e.target).addClass('is-loading');

    const gameData = app.getLevelData();
    console.log(gameData);

    (gameId ? updateGame(gameId, gameData, newStatus) : createGame(gameData, newStatus))
    .then(id => {
      $(e.target).removeClass('is-loading');
      console.log('Game saved.');

      if (newStatus === 'running') {
        window.location.assign(`/play/${gameId || id}`);
      } else if (!gameId) {
        window.location.replace(`/edit/${id}`);
      }
    })
    .catch(console.error);
  };

  // Bind input actions:

  $('#publish').click(saveGame('running'));

  $('#save').click(saveGame());

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


})
.catch(console.error);
