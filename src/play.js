import './styles/styles.scss';
import Engine, { createRect } from './utils/Engine';
import NetworkManager from './utils/NetworkManager';

// let userId; // Store user id
// let users = {}; // Stores all user data
// const SPEED = 8; // Player speed
const parent = document.getElementById('root'); // Empty element that Pixi will render game in

// Start game engine
const app = new Engine(parent, { animated: true });
const networkManager = new NetworkManager(app);
networkManager.initialize();

app.start();


// Helper function for adding a new user
/*
const addUser = (id, { x, y, color }) => {
  const user = createRect({ x, y, w: 50, h: 50, fill: color, stroke: 0x000000 });

  app.addObject(user);

  users[id] = user;
};
*/
