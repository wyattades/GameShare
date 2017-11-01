import './styles/styles.scss';

const googleSignIn = e => {
  e.target.removeEventListener(e.type, googleSignIn);

  // Sign in with Google:

};

document.getElementById('google-sign-in').addEventListener('click', googleSignIn);
