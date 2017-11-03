import './styles/styles.scss';
import * as _client from './play/client';

let client = _client;

const loadingScreen = document.getElementById('loading');
loadingScreen.lastChild.innerHTML = 'Connecting to server...';
const progress = val => {
  console.log(val);
  if (val < 1) {
    loadingScreen.innerText = val;
  }
};

const init = () => client.connect('my_test_game', progress)
.then(() => {
  loadingScreen.remove();
})
.catch(err => {
  loadingScreen.innerHTML = `An error occurred during initialization:<br/>${err || 'Unknown Error'}`;
  console.log('Init Error:', err);
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
