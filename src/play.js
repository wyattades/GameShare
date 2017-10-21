import './styles/styles.scss';
import * as _client from './utils/client';

let client = _client;

const init = () => client.connect('my_test_game')
.catch(err => {
  alert(err);
  console.log('Init Error:', err);
});

init(client);

// Enable hot reloading
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./utils/client', () => {
    client.destroy();
    client = require('./utils/client');
    init();
  });
}
