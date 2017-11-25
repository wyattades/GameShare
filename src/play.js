import './styles/styles.scss';
import * as _client from './play/client';

// Get gameId from url
const urlMatch = window.location.pathname.match(/[^/]+/g);
const gameId = urlMatch && urlMatch.length > 1 && urlMatch[1];

console.log('Connecting to game:', gameId);

let client = _client;

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
