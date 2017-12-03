import './styles/styles.scss';
import * as _client from './play/client';
import { assertLoggedIn, fetchUser, checkUser } from './utils/db';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

console.log('Connecting to game:', gameId);

let client = _client;
let username;

const $loading = document.getElementById('loading');
const $loadingLabel = document.getElementById('loading-label');
// const $loadingProgress = document.getElementById('loading-progress');

$loadingLabel.innerHTML = 'Connecting to server...';
const progress = val => {
  if (val < 1) {
    // $loadingProgress.value = val;
  }
};

const init = () => client.connect(gameId, progress)
.then(() => {
  $loading.remove();

  if (checkUser()) { // User Logged in, getting username
    assertLoggedIn()
    .then(fetchUser)
    .then(data => {
      if (data.hasOwnProperty('username')) {
        username = data.username;
        if (username.length > 20) { // Will only use first name if username is too long
          let nameArray = username.split(' ');
          username = nameArray[0];
          if (username.length > 20) { // Cuts username to 20 characters
            username = username.slice(0, 20);
          }
        }
        client.sendName(username);
      }

    });
  } else {
    username = window.prompt('Choose a username (20 chars):', 'GuestUser');

    if (!username || username.length > 20) {
      window.location.reload();
    }

    client.sendName(username);
  }

})

.catch(err => {
  $loadingLabel.innerHTML = `An error occurred during initialization:<br/>${err || 'Unknown Error'}`;
  console.error('Init Error:', err);
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
