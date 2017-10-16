const keyboard = keyValue => {

  const key = {};
  key.value = keyValue;
  key.code = keyValue.charCodeAt(0);
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;

  // The `downHandler`
  key.downHandler = e => {
    if (e.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    // event.preventDefault();
  };

  // The `upHandler`
  key.upHandler = e => {
    if (e.key === key.value) {
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

// Convenience wrapper for user inputs
class InputManager {
  
  constructor(renderer, keyBindings = {}) {
    this.renderer = renderer;

    for (let label in keyBindings) {
      if (keyBindings.hasOwnProperty(label)) {
        this[label] = keyboard(keyBindings[label]);
      }
    }
  }

  get mouseX() {
    return this.renderer.plugins.interaction.mouse.getLocalPosition().x;
  }

  get mouseY() {
    return this.renderer.plugins.interaction.mouse.getLocalPosition().y;
  }
}

export default InputManager;
