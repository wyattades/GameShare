const PORT = 8080;

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const users = {};

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

io.on('connection', socket => {

  users[socket.id] = {
    x: Math.random() * 400,
    y: Math.random() * 400,
    color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16),
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

http.listen(PORT, () => {
  console.log('Listening on *:' + PORT);
});