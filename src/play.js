import './styles/styles.scss';
import * as client from './utils/client';

const init = () => client.connect('my_test_game')
.catch(err => {
  alert(err);
  console.log('Init Error:', err);
});

init();

// Enable hot reloading
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./utils/client', () => {
    client.disconnect();
    init();
    console.log('hot!');
  });
}
