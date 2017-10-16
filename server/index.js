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

// TODO: generate file paths automatically
const options = page => ({
  title: `GameShare: ${page}`,
  css: DEV ? [] : ['/style.css'],
  rootContent: '',
  script: DEV ? `/public/${page}.js` : `/${page}.js`,
  rootId: 'root',
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index', options('index')));
app.get('/play', (req, res) => res.render('play', options('play')));
app.get('/edit', (req, res) => res.render('edit', options('edit')));


// ---------- Listen on http server

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});


// --------- Setup game servers

const games = gameServer(server);

// TEMP: Start new game
games.create('my_test_game');

