import $ from 'jquery';

import './styles/styles.scss';
import { assertLoggedIn, fetchGames, logout, createGame, deleteGame, updateGame } from './utils/db';
import gameEntry from './templates/gameEntry.pug';

const parent = $('#games_content');

const addEntry = data => {

  const html = gameEntry(data);
  const $el = $(html).prependTo(parent);

  const actions = $el.find('a');
  const id = data.id;

  const $publish = $el.find('.game-publish');
  
  // Publish/unpublish button
  actions.eq(0).click(() => {
    const running = $publish.hasClass('fa-stop');
    actions.eq(0).addClass('is-loading');

    updateGame(id, undefined, running ? 'stopped' : 'running')
    .then(() => {
      actions.eq(0).removeClass('is-loading');
      $publish.toggleClass('fa-stop fa-play');
      
      $el.find('.game-status').text(running ? 'stopped' : 'running');      

      if (!running) {
        document.location.assign(`/play/${id}`);
      }
    });
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

$('#logout').click(() => {
  logout()
  .then(() => {
    document.location.assign('/');
  });
});
