const webpack = require('webpack');
const express = require('express');
const path = require('path');
const http = require('http');
const gameServer = require('./gameServer');

const PORT = 3000;
const DEV = process.env.NODE_ENV === 'development';

// ---------- Setup express to send files

const app = express();

// Live reload express server when developing
if (DEV) {

  const config = require('../webpack.config');
  const compiler = webpack(config);

  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    // historyApiFallback: true,
    // contentBase: './',
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

app.use(express.static(path.resolve(__dirname, '../public')));
app.use(express.static(path.resolve(__dirname, '../assets')));

app.set('view engine', 'pug');
app.locals.self = true; // Access variables in pug files from 'self' object e.g. self.title

// Set global pug variables
app.locals.rootId = 'root';

// Helper function for generating pug variables
const renderPage = (page, title, options = {}) => {
  if (options.script) {
    delete options.script;
    // FIXME: production and development require different file paths
    options.scripts = [{ src: DEV ? `/public/${page}.js` : `/${page}.js`, inject: 'body' }];
  } else {
    options.scripts = DEV ? [{ src: '/public/loadStyles.js', inject: 'body' }] : [];
  }

  const compiled = Object.assign({
    page,
    title,
    css: DEV ? [] : ['/style.css'],
  }, options);

  return (req, res) => res.render(page, compiled);
};

app.get('/', renderPage('index', 'Home'));
app.get('/play', renderPage('play', 'Play', { script: true }));
app.get('/edit', renderPage('edit', 'Edit', { script: true }));
app.get('/games', renderPage('games', 'Games'));
// app.get('/login', renderPage('login', 'Login'));
// app.get('/register', renderPage('register', 'Register'));

// 404 response
app.use(renderPage('404', '404 Error', { status: 404 }));


// ---------- Listen on http server

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});


// --------- Setup game servers

const games = gameServer(server);

// TEMP: Start new game
const testData = require('./testData');
games.create('my_test_game', testData);

