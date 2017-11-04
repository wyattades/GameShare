import $ from 'jquery';

import './styles/styles.scss';
import { assertLoggedIn, fetchGames, logout, createGame, deleteGame } from './utils/db';
import gameEntry from './templates/gameEntry.pug';

const parent = $('#games_content');

const addEntry = data => {

  const html = gameEntry(data);
  const $el = $(html).prependTo(parent);

  const actions = $el.find('a');
  const id = data.id;
  
  // Publish/unpublish button
  actions.eq(0).click(() => {
    document.location.assign(`/play/${id}`);
  });

  // Edit button
  actions.eq(1).click(() => {
    document.location.assign(`/edit/${id}`);
  });

  // Delete button
  actions.eq(2).click(() => {
    actions.eq(2).addClass('is-loading');
    deleteGame(id)
    .then(() => {
      $el.remove();
    })
    .catch(console.error);
  });
};

assertLoggedIn()
.then(fetchGames)
.then(games => games.forEach(addEntry))
.catch(err => {
  console.log('Games Page Error:', err);
});

// TEMP
$('#logout').click(() => {
  logout()
  .then(() => {
    document.location.assign('/');
  });
});

// TEMP
$('#new_game').click(() => {
  createGame({ test: Math.random() })
  .then(addEntry);
});
