import EE from './EventEmitter';

const events = new EE();

const SPAN_SPEED = 20,
      ZOOM_FACTOR = 0.2,
      SCROLL_FACTOR = 0.005;

const keys = {
  37: [-SPAN_SPEED, 0, 0], // left
  38: [0, -SPAN_SPEED, 0], // up
  39: [SPAN_SPEED, 0, 0], // right
  40: [0, SPAN_SPEED, 0], // down
  189: [0, 0, 1 - ZOOM_FACTOR], // minus
  187: [0, 0, 1 + ZOOM_FACTOR], // plus  
};

const canvas = document.getElementById('root');

const translate = ([dx, dy, scaleFactor]) => scaleFactor ?
  events.emit('zoom', canvas.clientWidth / 2, canvas.clientHeight / 2, scaleFactor) :
  events.emit('translate', dx, dy);

const selected = {};

export default () => {

  document.addEventListener('keydown', e => {
    const key = e.keyCode;
    if (keys.hasOwnProperty(key)) {
      // keys[e.key] = true;
      // events.emit('translate', ...keys[key]);
      translate(keys[key]);
    } else if (key === 46) { // DEL
      if (selected.objId) events.emit('remove-object', selected.groupId, selected.objId);
      else if (selected.groupId) events.emit('remove-group', selected.groupId);
    }
  });

  // document.addEventListener('keyup', e => {
  //   if (keys.hasOwnProperty(e.key)) {
  //     keys[e.key] = false;
  //   }
  // });

  canvas.addEventListener('mousewheel', e => {
    events.emit('zoom', e.offsetX, e.offsetY, 1 + (e.deltaY * SCROLL_FACTOR));
  });

  events.on('select', (groupId, objId) => {
    selected.groupId = groupId;
    selected.objId = objId;
  });

};
