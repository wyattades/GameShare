import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

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

// Presist data in the browser
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// User authentication providers
const providers = {
  google: new firebase.auth.GoogleAuthProvider(),
  facebook: new firebase.auth.FacebookAuthProvider(),
};

export const assertLoggedIn = (redirect = true) => new Promise((resolve, reject) => {
  auth.onAuthStateChanged(user => {
    if (user) { // Logged in
      console.log('Logged in to firebase');
      
      resolve();
    } else { // Logged out

      // Redirect to home page
      if (redirect) {
        window.location.replace('/');
      } else {
        document.querySelectorAll('.logged-in, .logged-out').forEach(el => {
          el.classList.toggle('logged-in');
          el.classList.toggle('logged-out');
        });
      }

      reject();
    }
  });
});

// Fetch the user's data
export const fetchUser = () => {
  const uid = auth.currentUser.uid;

  // Fetch user profile
  return db.ref(`/users/${uid}/profile`).once('value')
  .then(snapshot => {
    const userData = snapshot.val();

    if (!userData) { // If profile doesn't exist, create a new one    
      const newData = {
        username: auth.currentUser.displayName,
        email: auth.currentUser.email,
      };

      return db.ref(`users/${uid}/profile`).set(newData)
      .then(() => newData); // return profile data

    } else { // else, return profile data
      return userData;
    }
  });
};

// Sign out of firebase
export const logout = () => auth.signOut();

// Login to firebaes
export const login = provider => auth.signInWithPopup(providers[provider])
.then(fetchUser);

// Create a new game with the given data and info
export const createGame = (data, info) => {
  const uid = auth.currentUser.uid;

  // Set a reference to the owner of the game
  data.owner = uid;

  // Push new game data
  return db.ref('/games').push(data)
  .then(res => {
    const id = res.key;

    info.created_on = Date.now();
    info.last_modified = info.created_on;
    info.status = info.status || 'stopped';
    info.owner = uid;

    return db.ref(`/users/${uid}/games/${id}`).set(true) // Register user as owner of game    
    .then(() => db.ref(`/games_info/${id}`).set(info)) // Create public game info
    .then(() => id); // Return new game's id
  });
};

// Update game data/info
export const updateGame = (id, data, info) => (data ? db.ref(`/games/${id}`).update(data) : Promise.resolve())
.then(() => {
  if (data) info.last_modified = Date.now();

  return db.ref(`/games_info/${id}`).update(info);
});

// Delete game
export const deleteGame = id => db.ref(`/games_info/${id}`).remove()
.then(() => db.ref(`/games/${id}`).remove())
.then(() => db.ref(`/users/${auth.currentUser.uid}/games/${id}`).remove());

// Fetch user's games
export const fetchGames = () => db
.ref('/games_info')
.orderByChild('owner')
.equalTo(auth.currentUser.uid)
.once('value')
.then(snapshot => {
  const games = snapshot.val() || {};
  
  return Object.keys(games).map(id => ({ id, ...games[id] }));
})
.then(games => games.sort((a, b) => a.last_modified > b.last_modified)); // Sort by last_modified time

// Fetch all games with status=running
export const fetchActiveGames = () => db
.ref('/games_info')
.orderByChild('status')
.equalTo('running')
.once('value')
.then(snapshot => {
  const games = snapshot.val() || {};

  return Object.keys(games).map(id => ({ id, ...games[id] }));
})
.then(games => games.sort((a, b) => a.last_modified > b.last_modified)); // Sort by last_modified time

export const fetchGame = id => db
.ref(`/games/${id}`)
.once('value')
.then(snapshot => snapshot.val());

export const deleteUser = () => db
.ref(`/users/${auth.currentUser.uid}`)
.remove()
.then(() => auth.currentUser.delete())
.then(() => {
  console.log('User successfully deleted');
  window.location.assign('/');
})
.catch(console.error);
