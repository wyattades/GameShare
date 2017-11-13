import './styles/styles.scss';
import { updateGame, createGame, assertLoggedIn, fetchGame } from './utils/db';
import editor from './edit/Editor';

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
    fill: 0xCCCCCC,
    stroke: 0x222222,
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

  // Function to send data to firebase
  const saveGame = (gameData, infoData) => (
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
