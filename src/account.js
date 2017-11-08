import './styles/styles.scss';
import { assertLoggedIn, fetchUser, logout } from './utils/db';

assertLoggedIn()
.then(fetchUser)
.then(data => {

  document.getElementById('logout').onclick = () => logout();
  document.getElementById('delete').onclick = () => alert('Deleting accounts not yet implemented.');

  const $el = document.getElementById('user-info');
  const cap = str => str.charAt(0).toUpperCase() + str.slice(1);
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      $el.insertAdjacentHTML('beforeend', `<p><strong>${cap(key)}:</strong> ${data[key]}</p>`);
    }
  }
});