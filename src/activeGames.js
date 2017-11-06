import $ from 'jquery';

import './styles/styles.scss';
import { fetchActiveGames } from './utils/db';
import gameEntry from './templates/gameEntry.pug';

const parent = $('#games_content');

fetchActiveGames()
.then(games => {
  for (let game of games) {
    game.active = true; // Set active flag so gameEntry.pug knows to display correct info
    parent.append(gameEntry(game));
  }
})
.catch(console.error);
