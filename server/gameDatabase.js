const admin = require('firebase-admin');

const cert = require('./db-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(cert),
  databaseURL: `https://${cert.project_id}.firebaseio.com`,
});

const db = admin.database();
const gamesInfo = db.ref('/games_info');
const games = db.ref('/games');

// Manage game status by passing create and destroy functions
module.exports = (create, destroy) => {

  // Helper function for fetching game data and calling 'create'
  const fetchAndCreate = id => {
    games
    .child(id)
    .once('value')
    .then(snapshot => {
      const gameData = snapshot.val();
      if (!gameData) throw new Error(`No game data found with id: ${id}`);

      create(id, gameData);
    });
  };

  // Game info added event
  gamesInfo.on('child_added', snapshot => {
    // const game = snapshot.val();
    const id = snapshot.key;

    // Start games when starting node server
    // if (game.status === 'running') {
    //   fetchAndCreate(id);
    // }

    // Listen for game status changes
    snapshot.ref.child('status').on('value', snap => {
      const status = snap.val();

      if (status === 'running') {
        fetchAndCreate(id);
      } else if (status === 'stopped') { // FIXME: this is called when the server starts as well
        destroy(id);
      }
    });
  });

  // Destroy game server if game info is removed and it's status was running
  gamesInfo.on('child_removed', snapshot => {
    const game = snapshot.val();
    const id = snapshot.key;

    if (game.status === 'running') {
      destroy(id);
    }
  });

};
