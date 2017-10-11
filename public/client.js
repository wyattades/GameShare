const socket = io();
let users;
const SPEED = 8;

const addUser = (id, { x, y, color }) => {
  $('<div/>', {
    class: 'character',
    id: `c--${id}`,
  }).appendTo('#root');
  // $('#root').append('<div class="character"></div>');

  const el = $(`#c--${id}`);

  el.css('left', x);
  el.css('top', y);
  el.css('background-color', color);

  users[id] = { x, y, color, el };
};

socket.on('user_data', _users => {
  users = _users;

  $('.character').remove();

  for (let id in users) {
    if (users.hasOwnProperty(id)) {
      addUser(id, users[id]);
    }
  }

  $(`#c--${socket.id}`).addClass('me');
});

socket.on('user_connect', (id, data) => {
  console.log('user connect: ' + id);

  addUser(id, data);
});

socket.on('user_disconnect', id => {
  users[id].el.remove();

  delete users[id];    
});

socket.on('move_x', (id, delta) => {
  users[id].x += delta;

  users[id].el.css('left', users[id].x);  
});

socket.on('move_y', (id, delta) => {
  users[id].y += delta;

  users[id].el.css('top', users[id].y);  
});

document.addEventListener('keypress', e => {
  switch (e.key) {
    case 'a': socket.emit('move_x', socket.id, -SPEED); break; // left
    case 'w': socket.emit('move_y', socket.id, -SPEED); break; // up
    case 'd': socket.emit('move_x', socket.id, SPEED); break; // right
    case 's': socket.emit('move_y', socket.id, SPEED); break; // down
    default:
  }
}, false);