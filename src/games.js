import $ from 'jquery';

import './styles/styles.scss';
import { assertLoggedIn, fetchGames, logout, deleteGame, updateGame } from './utils/db';
import gameEntry from './templates/gameEntry.pug';

const parent = $('#games_content');

const addEntry = data => {
  const id = data.id;
  let running = data.status === 'running';

  const html = gameEntry(data);
  const $el = $(html).prependTo(parent);

  const $delete = $el.find('.game-delete');
  const $publish = $el.find('.game-publish');
  const $statusBlocks = $el.find('.game-status-block');

  $publish.click(() => {
    $publish.addClass('is-loading');

    updateGame(id, undefined, { status: running ? 'stopped' : 'running' })
    .then(() => {
      $publish.removeClass('is-loading');
      running = !running;
      
      $statusBlocks.toggle();
    });
  });

  // Delete button
  $delete.click(() => {
    $delete.addClass('is-loading');
    
    // TODO: use modal
    if (window.confirm('Are you sure?')) {
      deleteGame(id)
      .then(() => $el.remove())
      .catch(err => {
        $delete.removeClass('is-loading');
        console.error(err);
      });
    } else {
      $delete.removeClass('is-loading');
    }
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
