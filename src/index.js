import './styles/styles.scss';
import { login } from './utils/db';

const googleSignIn = e => {
  // e.target.removeEventListener(e.type, googleSignIn);

  login('google')
  .then(res => {
    console.log('logged in', res);
    // Go to games dashboard
    document.location.assign('/games');
  })
  .catch(err => console.log('login error', err));
};
document.getElementById('google-sign-in').addEventListener('click', googleSignIn);
