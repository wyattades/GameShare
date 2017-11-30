const admin = require('firebase-admin');
const fs = require('fs');

// Load private certificate from file or environment variable
const cert = fs.existsSync('server/db-credentials.json') ?
  require('./db-credentials.json') : // eslint-disable-line import/no-unresolved
  JSON.parse(process.env.cert || '{}');

// Initialize firebase admin
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

  gamesInfo.on('child_added', snapshot => {
    const id = snapshot.key;
    const status = snapshot.child('status').val();

    if (status === 'running') {
      fetchAndCreate(id);
    }
  });

  gamesInfo.on('child_changed', snapshot => {
    const id = snapshot.key;
    const status = snapshot.child('status').val();

    if (status === 'running') {
      fetchAndCreate(id);
    } else if (status === 'stopped') {
      destroy(id);
    } else {
      console.log('Unknown status!');
    }
  });

  // Destroy game server if game info is removed and it's status was running
  gamesInfo.on('child_removed', snapshot => {
    const id = snapshot.key;
    const status = snapshot.child('status').val();

    if (status === 'running') {
      destroy(id);
    }
  });

};
