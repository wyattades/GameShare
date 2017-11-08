import './styles/styles.scss';
import { login } from './utils/db';

const authLogin = provider => () => {
  login(provider)
  .then(res => {
    console.log('logged in', res);
    // Go to games dashboard
    document.location.assign('/games');
  })
  .catch(err => {
    console.log('login error', err);
    alert('Failed to login. You are probably already registered with another provider');
  });
};
document.getElementById('google-sign-in').addEventListener('click', authLogin('google'));
document.getElementById('facebook-sign-in').addEventListener('click', authLogin('facebook'));
