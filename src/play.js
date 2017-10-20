import './styles/styles.scss';
import * as client from './utils/client';

client.connect('my_test_game')
.catch(err => {
  alert(err);
  console.log('Init Error:', err);
});
