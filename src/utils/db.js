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

export const assertLoggedIn = () => new Promise((resolve, reject) => {
  auth.onAuthStateChanged(user => {
    if (user) { // Logged in
      console.log('Logged in to firebase');

      resolve();
    } else { // Logged out

      // Redirect to home page
      document.location.replace('/');

      reject();
    }
  });
});

// Fetch the user's data
export const fetchUser = () => {
  const uid = auth.currentUser.uid;

  return db.ref(`/users/${uid}`).once('value')
  .then(snapshot => {
    const userData = snapshot.val();
    if (!userData) {
      const newData = {
        username: auth.currentUser.displayName,
        email: auth.currentUser.email,
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

export const createGame = (data, status) => {
  const uid = auth.currentUser.uid;

  // Set a reference to the owner of the game
  data.uid = uid;

  return db.ref('/games').push(data)
  .then(res => {
    const id = res.key;
    const created_on = Date.now();
    const info = {
      created_on,
      last_modified: created_on,
      status: status || 'stopped',
    };

    db.ref(`/users/${uid}/games`).child(id).set(info);

    return { id, ...info };
  });
};

export const updateGame = (id, data, status) => {
  if (data) {
    return db.ref(`/games/${id}`).set(data)
    .then(() => {
      if (status) {
        return db.ref(`/users/${auth.currentUser.uid}/games/${id}`).update({
          status,
          last_modified: Date.now(),
        });
      }
      return Promise.resolve();
    });
  }
  return Promise.resolve();
};

export const deleteGame = id => db.ref(`/games/${id}`).remove()
.then(() => db.ref(`/users/${auth.currentUser.uid}/games/${id}`).remove());

export const fetchGames = () => db
.ref(`/users/${auth.currentUser.uid}/games`)
.once('value')
.then(snapshot => {
  const games = snapshot.val() || {};

  return Object.keys(games).map(id => ({ id, ...games[id] }));
})
.then(games => games.sort((a, b) => a.last_modified > b.last_modified));
