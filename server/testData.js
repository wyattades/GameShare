// Test game data

module.exports = {
  options: {
    // example options:
    snap: 8,
    bulletSpeed: 2,
    backgroundColor: 0xDDEEDD,
    bounds: {
      x: 300,
      y: 300,
      w: 1000,
      h: 1000,
    },
  },
  groups: [
    {
      name: 'foo',
      fill: 0xEEEEEE,
      objects: [ 0, 1, 2 ],
    }, {
      name: 'bar',
      fill: 0x0000FF,
      objects: [ 3, 4 ],
    },
  ],
  objects: [
    { group: 0, x: 710, y: 420, w: 45, h: 180 },
    { group: 0, x: 435, y: 605, w: 225, h: 30, fill: 0x00FF00 },
    { group: 0, x: 500, y: 585, w: 45, h: 165 },
    { group: 1, x: 420, y: 390, w: 300, h: 45 },
    { group: 1, x: 345, y: 330, w: 75, h: 285, fill: 0xFF0000 },
  ],
};
