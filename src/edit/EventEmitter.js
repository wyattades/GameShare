const workers = {};
const handlers = {};
const middleware = [];
let genId = 0;

class EventEmitter {

  constructor() {
    // Set unique id, save reference to this
    this._id = genId++;
    workers[this._id] = this;

    this._listeners = {};
  }

  // Bind listener to event
  on = (event, fn) => {
    // Assert that no listener is already registered for this event
    if (this._listeners.hasOwnProperty(event)) {
      console.error('This event already has a registered listener');
      return;
    }

    this._listeners[event] = fn;

    if (handlers.hasOwnProperty(event)) {
      handlers[event].push(this._id);
    } else {
      handlers[event] = [ this._id ];
    }
  };

  off = (event) => {
    // Assert that a listener is registered for this event
    if (!this._listeners.hasOwnProperty(event)) {
      console.error('This event has no listener to remove');
      return;
    }

    const ids = handlers[event];
    ids.splice(ids.indexOf(this._id), 1);
    delete this._listeners[event];
  }

  // Emit event to all listeners
  emit = (event, ...args) => {
    if (handlers.hasOwnProperty(event)) {

      for (let fn of middleware) {
        args = fn(event, ...args);
      }

      const ids = handlers[event];
      for (let id of ids) {
        workers[id]._listeners[event](...args);
      }
    }
  };
    
  // Emit event to all listeners except the broadcaster
  broadcast = (event, ...args) => {
    if (handlers.hasOwnProperty(event)) {

      for (let fn of middleware) {
        args = fn(event, ...args);
      }

      const ids = handlers[event];
      for (let id of ids) {
        if (id !== this._id) workers[id]._listeners[event](...args);
      }
    }
  };

}

export const addMiddlewear = (fn) => {
  middleware.push(fn);
};

export default EventEmitter;
