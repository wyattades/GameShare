import './styles/styles.scss';
import * as _client from './play/client';
import { assertLoggedIn, fetchUser, checkUser } from './utils/db';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

console.log('Connecting to game:', gameId);

let client = _client;

const $loading = document.getElementById('loading');
const $loadingLabel = document.getElementById('loading-label');
// const $loadingProgress = document.getElementById('loading-progress');

$loadingLabel.innerHTML = 'Connecting to server...';
// const progress = val => {
//   if (val < 1) {
//     $loadingProgress.value = val;
//   }
// };

let username;

assertLoggedIn(false)
.then(() => {
  username = checkUser().displayName;
})
.catch(() => Promise.resolve())
.then(() => {

  while (!username) {
    username = window.prompt('Choose a username (max 20 chars):', 'GuestUser');
  }

  username = username.slice(0, 20);
});


const init = () => client.connect(gameId, () => {
  $loading.style.display = 'none';

  client.sendName(username);
  
}, err => {
  if (client.isAlive()) {
    client.destroy();

    $loading.style.display = 'block';
    $loadingLabel.innerHTML = `An error occurred:<br/>${err || 'Unknown Error'}`;
    console.error('Client Error:', err);
  }
});

init(client);

// Enable hot reloading
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./play/client', () => {
    client.destroy();
    client = require('./play/client');
    init();
  });
}
