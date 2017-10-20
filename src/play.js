import './styles/styles.scss';
import * as client from './utils/client';

client.connect('my_test_game')
.catch(err => {
  alert(err);
  console.log('Init Error:', err);
});

// Enable hot reloading
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept();
}
