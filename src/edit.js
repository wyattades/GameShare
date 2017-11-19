import './styles/styles.scss';
import { updateGame, createGame, assertLoggedIn, fetchGame } from './utils/db';
import editor from './edit/Editor';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

const TEMPLATE_DATA = {
  options: {},
  groupGen: 1,
  objGen: 0,
  groups: {
    0: {
      name: 'default',
    },
  },
  objects: {},
};

assertLoggedIn()
.then(() => {

  if (gameId) {
    console.log('Starting editor for game:', gameId);
    return fetchGame(gameId);
  } else {
    return TEMPLATE_DATA;
  }
})
.then(initialData => {

  // Function to send data to firebase
  const saveGame = (gameData, infoData) => (
    console.log('game data', gameData),
    gameId ? updateGame(gameId, gameData, infoData) : createGame(gameData, infoData)
  )
  .then(id => {

    console.log('Game saved.');

    if (infoData.status === 'running') {
      window.location.assign(`/play/${gameId || id}`);
    } else if (!gameId) {
      window.location.replace(`/edit/${id}`);
    }

    return Promise.resolve();
  })
  .catch(console.error);

  // Create editor
  editor(initialData, saveGame);
})
.catch(console.error);
