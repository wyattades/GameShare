const PORT = 3000;
const DEV = process.env.NODE_ENV === 'development';

const webpack = require('webpack');
const express = require('express');
const UUID = require('node-uuid');

const app = express();
const http = require('http').Server(app);

// Live reload server when developing
if (DEV) {

  const config = require('./webpack.config');
  const compiler = webpack(config);

  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    // historyApiFallback: true,
    // contentBase: './',
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

// Setup express to send files

app.use(express.static('public'));

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

// Setup socket.io as game server

const io = require('socket.io')(http);
const updateHandler = require('./updatehandler');
const users = {};

io.on('connection', socket => {

  const userId = UUID();
  updateHandler.handleSocket(socket);

  users[userId] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    color: Math.random() * 0xFFFFFF << 0,
  };

  socket.emit('onconnected', { users, id: userId });

  // const address = socket.request.connection.remoteAddress;
  // const address = socket.handshake.address;

  console.log(`User connected: ${userId}`);
  socket.broadcast.emit('user_connect', userId, users[userId]);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    socket.broadcast.emit('user_disconnect', userId);

    delete users[userId];
  });

  socket.on('move_x', (id, delta) => {
    io.emit('move_x', id, delta);
  });

  socket.on('move_y', (id, delta) => {
    io.emit('move_y', id, delta);
  });

});

http.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
