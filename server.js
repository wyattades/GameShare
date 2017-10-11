const PORT = 3000;

const webpack = require('webpack');
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// const middleware = require('./src/middleware');

const config = require('./webpack.config');
const compiler = webpack(config);

if (process.env.NODE_ENV === 'development') {

  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
    // historyApiFallback: true,
    // contentBase: './',
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

app.use(express.static('public'));

const users = {};

// app.use(express.static('public'));

const options = {
  title: 'GameShare',
  css: [],
  rootContent: '',
  script: '/public/bundle.js',
  rootId: 'root',
};

app.set('view engine', 'ejs');

app.get('/', (req, res) => res.render('index', options));
app.get('/play', (req, res) => res.render('play', options));
app.get('/edit', (req, res) => res.render('edit', options));

io.on('connection', socket => {

  users[socket.id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    color: `#${(Math.random() * 0xFFFFFF << 0).toString(16)}`,
  };

  socket.emit('user_data', users);

  // const address = socket.request.connection.remoteAddress; 
  // const address = socket.handshake.address;

  console.log(`User connected: ${socket.id}`);
  socket.broadcast.emit('user_connect', socket.id, users[socket.id]);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    socket.broadcast.emit('user_disconnect', socket.id);

    delete users[socket.id];
  });

  socket.on('move_x', (id, delta) => {
    io.emit('move_x', id, delta);
  });

  socket.on('move_y', (id, delta) => {
    io.emit('move_y', id, delta);
  });

});

http.listen(PORT, (...args) => {
  console.log(`Listening on *:${PORT}`);
});
