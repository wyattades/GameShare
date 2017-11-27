import EE from './EventEmitter';
// import { constrain } from '../utils/helpers';

const MAX_HISTORY = 10;

const events = new EE();

let data;

let historyIndex = -1;
let history = [];

const update = (redo, undo) => {

  // Increment historyIndex
  historyIndex++;
  
  // Clear history array after historyIndex, then push new undo/redo
  history.splice(historyIndex, MAX_HISTORY, {
    redo,
    undo,
  });

  // Assert that history doesn't exceed max length
  if (history.length > MAX_HISTORY) {
    history.shift();
    historyIndex--;
  }

  events.emit('history-limit', historyIndex <= -1, historyIndex >= history.length - 1);
};

const dup = val => typeof val === 'object' ? Object.assign({}, val) : val;

const getProps = (keys, source) => {
  const props = {};
  for (let key in keys) {
    props[key] = source[key];
  }
  return props;
};

const listeners = {

  'add-object': (groupId, groupData, objId, objData) => update(
    ['add-object', groupId, groupData, objId, objData],
    ['remove-object', groupId, objId],
  ),

  'add-group': (groupId, groupData) => update(
    ['add-group', groupId, groupData],
    ['remove-group', groupId],
  ),

  'remove-group': (groupId) => {
    const groupData = dup(data.groups[groupId]);

    const addObjects = Object.keys(groupData.objects).map(
      objId => ['add-object', groupId, groupData, objId, dup(data.objects[objId])],
    );
    addObjects.unshift(['add-group', groupId]);

    update(
      ['remove-group', groupId],
      addObjects,
    );
  },

  'remove-object': (groupId, objId) => update(
    ['remove-object', groupId, objId],
    ['add-object', groupId, dup(data.groups[groupId]), objId, dup(data.objects[objId])],
  ),

  'update-object': (groupId, objId, newData, silent) => !silent && update(
    ['update-object', groupId, objId, newData],
    ['update-object', groupId, objId, getProps(newData, data.objects[objId])],
  ),

  'update-group': (groupId, newData) => update(
    ['update-group', groupId, newData],
    ['update-group', groupId, getProps(newData, data.groups[groupId])],
  ),

  'update-option': (key, value, keyDeep) => update(
    ['update-option', key, value, keyDeep],
    ['update-option', key, keyDeep ? data.options[key][keyDeep] : data.options[key], keyDeep],
  ),

  'set-name': (newName) => update(
    ['set-name', newName],
    ['set-name', data.options.name],
  ),


  // TODO: set-name, update-object, editorengine color updates

  history: (delta) => {
    // const newIndex = constrain(historyIndex + delta, -1, history.length - 1);
    // const diff = newIndex - historyIndex;
    // console.log(history, historyIndex, newIndex);
    // if (diff < 0) {
    //   for (; historyIndex > newIndex; historyIndex--) {
    //     console.log(history[historyIndex].undo);
    //     events.broadcast(...history[historyIndex].undo);
    //   }
    // } else if (diff > 0) {
    //   for (; historyIndex < newIndex; historyIndex++) {
    //     console.log(history[historyIndex].redo);
    //     events.broadcast(...history[historyIndex].redo);
    //   }
    // }

    console.log(historyIndex, history);

    if (delta === -1 && historyIndex > -1) { // undo

      events.broadcast(...history[historyIndex--].undo);

    } else if (delta === 1 && historyIndex < history.length - 1) { // redo

      const redo = history[++historyIndex].redo;
      if (Array.isArray(redo[0])) {
        for (let _redo of redo) {
          events.broadcast(..._redo);
        }
      } else {
        events.broadcast(...redo);
      }
    }

    events.emit('history-limit', historyIndex <= -1, historyIndex >= history.length - 1);
  },

};

export default _data => {
  data = _data;

  for (let event in listeners) {
    events.on(event, listeners[event]);
  }
};
