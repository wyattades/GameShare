/* global Phaser */

/*
  Virtual Gamepad
  Forked from https://github.com/ShawnHymel/phaser-plugin-virtual-gamepad
*/

// Test if on mobile device
const a = navigator.userAgent || navigator.vendor || window.opera;
// eslint-disable-next-line
const MOBILE = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4));

if (MOBILE) {

  // Static variables
  const UP_LOWER_BOUND = -7 * (Math.PI / 8);
  const UP_UPPER_BOUND = -1 * (Math.PI / 8);
  const DOWN_LOWER_BOUND = Math.PI / 8;
  const DOWN_UPPER_BOUND = 7 * (Math.PI / 8);
  const RIGHT_LOWER_BOUND = -3 * (Math.PI / 8);
  const RIGHT_UPPER_BOUND = 3 * (Math.PI / 8);
  const LEFT_LOWER_BOUND = 5 * (Math.PI / 8);
  const LEFT_UPPER_BOUND = -5 * (Math.PI / 8);

  const moveJoystick = (point, pad) => {

    // Calculate x/y of pointer from joystick center
    let deltaX = point.x - pad.joystickPoint.x;
    let deltaY = point.y - pad.joystickPoint.y;

    // Get the angle (radians) of the pointer on the joystick
    const rotation = pad.joystickPoint.angle(point);

    // Set bounds on joystick pad
    if (pad.joystickPoint.distance(point) > pad.joystickRadius) {
      deltaX = (deltaX === 0) ?
        0 : Math.cos(rotation) * pad.joystickRadius;
      deltaY = (deltaY === 0) ?
        0 : Math.sin(rotation) * pad.joystickRadius;
    }

    // Normalize x/y
    pad.joystick.properties.x = parseInt((deltaX /
      pad.joystickRadius) * 100, 10);
    pad.joystick.properties.y = parseInt((deltaY /
      pad.joystickRadius) * 100, 10);

    // Set polar coordinates
    pad.joystick.properties.rotation = rotation;
    // pad.joystick.properties.angle = (180 / Math.PI) * rotation;
    pad.joystick.properties.distance =
      parseInt((pad.joystickPoint.distance(point) /
        pad.joystickRadius) * 100, 10);

    // Set d-pad directions
    pad.joystick.properties.up.isDown = ((rotation > UP_LOWER_BOUND) &&
      (rotation <= UP_UPPER_BOUND));
    pad.joystick.properties.down.isDown = ((rotation > DOWN_LOWER_BOUND) &&
      (rotation <= DOWN_UPPER_BOUND));
    pad.joystick.properties.right.isDown = ((rotation > RIGHT_LOWER_BOUND) &&
      (rotation <= RIGHT_UPPER_BOUND));
    pad.joystick.properties.left.isDown = ((rotation > LEFT_LOWER_BOUND) ||
      (rotation <= LEFT_UPPER_BOUND));

    // Fix situation where left/right is true if X/Y is centered
    if ((pad.joystick.properties.x === 0) &&
      (pad.joystick.properties.y === 0)) {
      pad.joystick.properties.right.isDown = false;
      pad.joystick.properties.left.isDown = false;
    }

    // Move joystick pad images
    pad.joystickPad.cameraOffset.x = pad.joystickPoint.x + deltaX;
    pad.joystickPad.cameraOffset.y = pad.joystickPoint.y + deltaY;
  };

  const testDistance = (pointer, pad) => {

    let reset = true;

    // See if the pointer is over the joystick
    let d = pad.joystickPoint.distance(pointer.position);
    if ((pointer.isDown) && ((pointer === pad.joystickPointer) ||
        (d < pad.joystickRadius))) {
      reset = false;
      pad.joystick.properties.inUse = true;
      pad.joystickPointer = pointer;
      moveJoystick(pointer.position, pad);
    }

    // See if the pointer is over the button
    // if (that.button) {
    //   d = that.buttonPoint.distance(pointer.position);
    //   if ((pointer.isDown) && (d < that.buttonRadius)) {
    //     that.button.isDown = true;
    //     that.button.frame = 1;
    //   }
    // }

    return reset;
  };

  const gamepadPoll = (game, pad) => {

    let resetJoystick = true;

    // See if any pointers are in range of the joystick or buttons
    // if (this.button) {
    //   this.button.isDown = false;
    //   this.button.frame = 0;
    // }
    game.input.pointers.forEach((p) => {
      resetJoystick = testDistance(p, pad);
    });

    // See if the mouse pointer is in range of the joystick or buttons
    resetJoystick = testDistance(game.input.mousePointer, pad);

    // If the pointer is removed, reset the joystick
    if (resetJoystick) {
      if (pad.joystickPointer === null || pad.joystickPointer.isUp) {
        moveJoystick(pad.joystickPoint, pad);
        pad.joystick.properties.inUse = false;
        pad.joystickPointer = null;
      }
    }

  };

  /**
   * The Virtual Gamepad adds a thumbstick and button(s) to mobile devices.
   *
   * @class Phaser.Plugin.VirtualGamepad
   * @constructor
   * @param {Object} game - The main Game object
   * @param {Any} parent - Object that owns this plugin (e.g. Phaser.PluginManager)
   */
  Phaser.Plugin.VirtualGamepad = function VirtualGamepad(game, parent) {

    // Call parent
    Phaser.Plugin.call(this, game, parent);

    // Class members
    this.group = this.game.add.group();
    this.input = this.game.input;
    this.joysticks = [];
    this.buttons = [];
    // this.button = null;
    // this.buttonPoint = null;
    // this.buttonRadius = null;

    // Polling for the joystick and button pushes
    this.preUpdate = () => {
      for (const pad of this.joysticks) {
        gamepadPoll(game, pad);
      }
    };
  };

  Phaser.Plugin.VirtualGamepad.prototype =
    Object.create(Phaser.Plugin.prototype);
  Phaser.Plugin.VirtualGamepad.prototype.constructor =
    Phaser.Plugin.VirtualGamepad;

  /**
   * Add joystick to the screen
   *
   * @method Phaser.Plugin.VirtualGamepad#addJoystick
   * @param {number} x - Position (x-axis) of the joystick on the canvas
   * @param {number} y - Position (y-axis) of the joystick on the canvas
   * @param {number} scale - Size of the sprite. 1.0 is 100x100 pixels
   * @param {String} key - key for the gamepad's spritesheet
   * @param {Phaser.Sprite} The joystick object just created
   */
  Phaser.Plugin.VirtualGamepad.prototype.addJoystick = function addJoystick(x, y, scale, key) {

    const add = {};
    this.joysticks.push(add);

    add.joystickPointer = null;

    // Add the joystick to the game
    add.joystick = this.group.create(x, y, key);
    add.joystick.frame = 2;
    add.joystick.anchor.set(0.5);
    add.joystick.fixedToCamera = true;
    add.joystick.scale.setTo(scale, scale);
    add.joystickPad = this.group.create(x, y, key);
    add.joystickPad.frame = 3;
    add.joystickPad.anchor.set(0.5);
    add.joystickPad.fixedToCamera = true;
    add.joystickPad.scale.setTo(scale, scale);

    // Remember the coordinates of the joystick
    add.joystickPoint = new Phaser.Point(x, y);

    // Set up initial joystick properties
    add.joystick.properties = {
      inUse: false,
      up: { isDown: false },
      down: { isDown: false },
      left: { isDown: false },
      right: { isDown: false },
      x: 0,
      y: 0,
      distance: 0,
      // angle: 0,
      rotation: 0,
    };

    // Set the touch area as defined by the button's radius
    add.joystickRadius = scale * (add.joystick.width / 2);

    return add.joystick;
  };

  /**
   * Add a button to the screen (only one button allowed for now)
   *
   * @method Phaser.Plugin.VirtualGamepad#addButton
   * @param {number} x - Position (x-axis) of the button on the canvas
   * @param {number} y - Position (y-axis) of the button on the canvas
   * @param {number} scale - Size of the sprite. 1.0 is 100x100 pixels
   * @param {String} key - key for the gamepad's spritesheet
   * @param {Phaser.Button} The button object just created
   */
  Phaser.Plugin.VirtualGamepad.prototype.addButton = function addButton(x, y, scale, key) {

    // If we already have a button, return null
    if (this.button !== null) {
      return null;
    }

    // Add the button to the game
    this.button = this.game.add.button(x, y, key, null, this);
    this.button.anchor.set(0.5);
    this.button.fixedToCamera = true;
    this.button.scale.setTo(scale, scale);

    // Remember the coordinates of the button
    this.buttonPoint = new Phaser.Point(x, y);

    // Set up initial button state
    this.button.isDown = false;

    // Set the touch area as defined by the button's radius
    this.buttonRadius = scale * (this.button.width / 2);

    return this.button;
  };

}
