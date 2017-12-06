import './styles/styles.scss';
import { login, assertLoggedIn } from './utils/db';

assertLoggedIn(false).catch(() => {});

const authLogin = provider => () => {

  login(provider, provider === 'token' && document.getElementById('token').value)
  .then(res => {
    console.log('logged in', res);
    // Go to games dashboard
    document.location.assign('/games');
  })
  .catch(err => {
    if (err.code === 'auth/account-exists-with-different-credential') {
      alert(err.message);
    // } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
    //   console.error('Login error', err.code, err.message);
    } else {
      console.error('Login error:', err.code, err.message);
    }
  });

  return false;
};

document.getElementById('google-sign-in').addEventListener('click', authLogin('google'));
document.getElementById('facebook-sign-in').addEventListener('click', authLogin('facebook'));
document.getElementById('token').addEventListener('change', authLogin('token'));
