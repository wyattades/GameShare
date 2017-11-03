import $ from 'jquery';

import './styles/styles.scss';
import { isLoggedIn, fetchUser, logout, __createGame } from './utils/db';
import gamesTableTemplate from './templates/gamesTable.pug';

isLoggedIn()
.then(fetchUser)
.then(res => {
  const games = res.games || {};
  const gameList = Object.keys(games).map(id => {
    const game = games[id];
    return { ...game, id };
  });
  console.log('Games', gameList);

  // Set content on page
  $('#games_content').html(gamesTableTemplate({
    games: gameList,
  }));
})
.catch(err => {
  console.log(err);
});

// TEMP
const onLogout = e => {
  // e.target.removeEventListener(e.type, logout);

  logout()
  .then(() => {
    document.location.assign('/');
  });
};
document.getElementById('logout').addEventListener('click', onLogout);

// TEMP
const onNewGame = e => {
  __createGame();
};
document.getElementById('new_game').addEventListener('click', onNewGame);
