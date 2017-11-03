import * as firebase from 'firebase';

// Initialize firebase
let config = {
  apiKey: 'AIzaSyCamJZSmEMknQOm0lQHh4lPL7Derjeb9Zk',
  authDomain: 'gameshare-7158b.firebaseapp.com',
  databaseURL: 'https://gameshare-7158b.firebaseio.com',
  projectId: 'gameshare-7158b',
  storageBucket: 'gameshare-7158b.appspot.com',
};
firebase.initializeApp(config);

const db = firebase.database(),
      auth = firebase.auth();

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

const providers = {
  google: new firebase.auth.GoogleAuthProvider(),
  github: new firebase.auth.GithubAuthProvider(),
};

// export const isLoggedIn = auth.onAuthStateChanged;

export const isLoggedIn = () => new Promise((resolve, reject) => {
  auth.onAuthStateChanged(user => {
    if (user) { // Logged in

      console.log('Not Null user');

      resolve();

    } else { // Logged out

      console.log('Null user');

      // Redirect to home page
      document.location.replace('/');

      reject();
    }
  });
});

export const fetchUser = () => {
  const uid = auth.currentUser.uid;

  return db.ref(`/users/${uid}`).once('value')
  .then(snapshot => {
    const userData = snapshot.val();
    if (!userData) {
      const newData = {
        username: auth.currentUser.displayName,
        email: auth.currentUser.email,
        games: {},
      };
      return db.ref(`users/${uid}`).set(newData)
      .then(() => Promise.resolve(newData));
    } else {
      return Promise.resolve(userData);
    }
  });
};

export const logout = () => auth.signOut();

export const login = provider => auth.signInWithPopup(providers[provider])
.then(fetchUser);

// TEMP
export const __createGame = () => {
  const uid = auth.currentUser.uid;

  db.ref('/games').push({
    user: uid,
    randomData: {
      cow: 'moo',
    },
  })
  .then(res => db.ref(`/users/${uid}/games`).child(res.key).set(true))
  .then(() => console.log('success'));
};
