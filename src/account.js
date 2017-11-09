import './styles/styles.scss';
import { assertLoggedIn, fetchUser, logout, deleteUser } from './utils/db';

assertLoggedIn()
.then(fetchUser)
.then(data => {

  document.getElementById('logout').onclick = () => logout();
  document.getElementById('delete').onclick = () => window.confirm(
    'Are you sure you want to delete your account, along with all of your data? (this cannot be undone)',
  ) && deleteUser();

  const $el = document.getElementById('user-info');
  const cap = str => str.charAt(0).toUpperCase() + str.slice(1);
  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      $el.insertAdjacentHTML('beforeend', `<p><strong>${cap(key)}:</strong> ${data[key]}</p>`);
    }
  }
});
