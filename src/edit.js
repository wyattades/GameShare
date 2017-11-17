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

  if (!gameId) {
    return createGame(TEMPLATE_DATA)
    .then(id => {
      window.location.replace(`/edit/${id}`);
    });
  }

  console.log('Starting editor for game:', gameId);

  return fetchGame(gameId);
})
.then(initialData => {

  // Function to send data to firebase
  const saveGame = (gameData, infoData) => updateGame(gameId, gameData, infoData)
  .then(() => {

    console.log('Game saved.');

    if (infoData.status === 'running') {
      window.location.assign(`/play/${gameId}`);
    }

    return Promise.resolve();
  })
  .catch(console.error);

  // Create editor
  editor(initialData, saveGame);
})
.catch(console.error);
