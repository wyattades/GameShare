import { updateGame } from '../utils/db';
import EE, { addMiddlewear } from './EventEmitter';
import History from './History';

const events = new EE();
let data,
    gameId,
    saveState = 'saved',
    name = null;

const roundInt = (val, round) => Math.round(val / round) * round;

const getNewId = (type) => {
  let prev = parseInt(data[type].substring(1), 10);
  prev++;
  data[type] = `_${prev}`;
  return data[type];
};

// TODO: avoid middleware
addMiddlewear((event, ...args) => {

  switch (event) {

    case 'add-object':
      const [ groupId, groupData, objId, objData ] = args;

      if (!objId) args[2] = getNewId('objGen');
      if (!objData.group) objData.group = groupId;

      // TEMP
      if (objData.x === undefined) {
        const snap = data.options.snap;
        const size = roundInt(200, snap);
        const { x, y, w, h } = data.options.bounds;
        Object.assign(objData, {
          x: roundInt(x + 200, snap),
          y: roundInt(y + 200, snap),
          w: size,
          h: size,
        });
      }

      events.emit('select', args[0], args[2], groupData, objData);
      break;

    case 'add-group': // args = [ groupId, groupData ]
      if (!args[0]) args[0] = getNewId('groupGen');
      events.emit('select', args[0], null, args[1]);
      break;

    case 'remove-group':
      events.emit('select');
      break;
      
    case 'remove-object':
      events.emit('select', args[0]);
      break;

    case 'select': // args = [ groupId, objId, groupData, objData ]
      
      if (args[0] && !args[2]) args[2] = data.groups[args[0]];
      if (args[1] && !args[3]) args[3] = data.objects[args[1]];
      break;

    default:
  }
  return args;
});

let timerId = null;
const save = () => {
  events.emit('save-state', 'saving');
  saveState = 'saving';
  
  if (timerId !== null) {
    window.clearTimeout(timerId);
  }

  timerId = window.setTimeout(() => {
    events.emit('save-state', 'saved');
    saveState = 'saved';
    timerId = null;

    updateGame(gameId, data, name ? {
      name,
    } : {});

    if (name) name = null;
  }, 2000);
};
// const save = () => updateGame(gameId, data)
// .catch(console.error);

const listeners = {
  
  'add-object': (groupId, groupData, objId, objData) => {
    data.groups[groupId].objects[objId] = true;
    data.objects[objId] = objData;
    
    save();
  },
  'add-group': (groupId, groupData) => {
    groupData.objects = groupData.objects || {};
    data.groups[groupId] = groupData;
    save();
  },

  'remove-group': (groupId) => {
    const objects = data.groups[groupId].objects;
    for (let objId in objects) {
      delete data.objects[objId];
    }
    delete data.groups[groupId];
    save();
  },
  'remove-object': (groupId, objId) => {
    delete data.groups[groupId].objects[objId];
    delete data.objects[objId];
    save();
  },

  'update-object': (groupId, objId, newData, silent) => {
    if (!silent) {
      const obj = data.objects[objId];
      for (let key in newData) {
        if (newData[key] === undefined) delete obj[key];
        else obj[key] = newData[key];
      }
      
      save();
    }
  },
  'update-group': (groupId, newData) => {
    const group = data.groups[groupId];
    for (let key in newData) {
      if (newData[key] === undefined) delete group[key];
      else group[key] = newData[key];
    }

    save();
  },

  'update-option': (key, value, keyDeep) => {
    if (keyDeep) data.options[key][keyDeep] = value;
    else if (value !== undefined) data.options[key] = value;
    else delete data.options[key];

    save();
  },

  'set-name': (newName) => {
    data.options.name = newName;
    name = newName;
    save();
  },

  publish: () => {
    updateGame(gameId, data, { status: 'running' })
    .then(() => {
      window.location.assign(`/play/${gameId}`);
    })
    .catch(console.error);
  },

};

// Send events for adding groups and objects
const init = () => {

  // Add initial groups
  for (let groupId in data.groups) {
    const groupData = data.groups[groupId];

    groupData.objects = groupData.objects || {};

    events.broadcast('add-group', groupId, groupData);

    // Add objects for each group
    for (let objId in groupData.objects) {
      const objData = data.objects[objId];

      events.broadcast('add-object', groupId, groupData, objId, objData);
    }
  }

  // Select nothing
  events.emit('select');
};

export default (_data, _gameId) => {

  data = _data;
  gameId = _gameId;

  init();

  History(data);

  for (let event in listeners) {
    events.on(event, listeners[event]);
  }

};
