import './styles/styles.scss';
import { fetchActiveGames, assertLoggedIn } from './utils/db';
import gameEntry from './templates/gameEntry.pug';

const parent = document.getElementById('games_content');

assertLoggedIn(false)
.catch(() => Promise.resolve())
.then(fetchActiveGames)
.then(games => {
  for (let game of games) {
    game.active = true; // Set active flag so gameEntry.pug knows to display activeGames info
    parent.insertAdjacentHTML('beforeend', gameEntry(game));
  }

  if (games.length === 0) parent.insertAdjacentHTML('beforeend', '<div></div>');
})
.catch(console.error);
