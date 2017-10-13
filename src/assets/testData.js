// Test game data

export default {
  options: {
    // example options:
    snap: 8,
    bulletSpeed: 2,
    backgroundColor: 0xDDEEDD,
  },
  groups: [
    {
      label: 'foo',
      fill: 0xEEEEEE,
      objects: [ 0, 1, 2 ],
    }, {
      label: 'bar',
      fill: 0x0000FF,
      objects: [ 3, 4 ],
    },
  ],
  objects: [
    { group: 0, x: 510, y: 120, w: 45, h: 180 },
    { group: 0, x: 435, y: 195, w: 225, h: 30, fill: 0x00FF00 },
    { group: 0, x: 255, y: 285, w: 45, h: 165 },
    { group: 1, x: 120, y: 90, w: 300, h: 45 },
    { group: 1, x: 45, y: 90, w: 75, h: 285, fill: 0xFF0000 },
  ],
};
