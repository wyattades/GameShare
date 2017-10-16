import './styles/styles.scss';
import Engine, { createRect } from './utils/Engine';
import NetworkManager from './utils/NetworkManager';
import InputManager from './utils/InputManager';

const parent = document.getElementById('root'); // Empty element that Pixi will render game in

// Start game engine
const app = new Engine(parent, { animated: true });

// NetworkManager handles communications between server and client.
const networkManager = new NetworkManager(app);
networkManager.initialize();

const inputManager = new InputManager();
inputManager.initialize(networkManager);

app.start();
