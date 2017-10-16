const keyboard = keyCode => {
  const key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  // The `downHandler`
  key.downHandler = e => {
    if (e.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    // event.preventDefault();
  };

  // The `upHandler`
  key.upHandler = e => {
    if (e.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    // event.preventDefault();
  };

  // Attach event listeners
  document.addEventListener('keydown', key.downHandler.bind(key), false);
  document.addEventListener('keyup', key.upHandler.bind(key), false);

  return key;
};

export default keyboard;
