import './styles/styles.scss';
import { createGame, assertLoggedIn, fetchGame } from './utils/db';
import UI from './edit/UI';
import Data from './edit/DataManager';
import Engine from './edit/EditorEngine';
import Input from './edit/InputManager';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

const TEMPLATE_DATA = {
  options: {
    snap: 8,
    backgroundColor: 0xFFFFFF,
    maxBulletsPerPlayer: 4,
    maxPlayers: 20,
    bounds: { x: 256, y: 256, w: 1024, h: 768 },
    bulletSpeed: 1000,
    fireRate: 200,
    playerSpeed: 500,
    bulletHealth: 2,
    name: 'Untitled Game',
  },
  groupGen: '_0',
  objGen: '_0',
  groups: {
    _: {
      name: 'default',
      fill: 0xfff877,
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

  initialData.options = initialData.options || {};
  initialData.objects = initialData.objects || {};
  initialData.groups = initialData.groups || {};
  
  let e = new Engine(document.getElementById('root'), initialData.options); // TODO use function
  UI(initialData.options);
  Input();
  Data(initialData, gameId);

})
.catch(console.error);
