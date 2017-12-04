const particles = require('../src/play/particles');

expect.extend({
  inRange(received, min, max, exclusive) {
    const pass = exclusive ?
      (received > min && received < max) :
      (received >= min && received <= max);

    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in\
          range ${exclusive ? '(' : '['}${min},${max}${exclusive ? ')' : ']'}`,
      pass,
    };
  },
});

describe('randomInt returns a random integer', () => {

  test('randomInt() returns 0 for range 0 to 0', () => {
    let v = particles.randomInt(0, 0);
    expect(v).toBe(0);
  });

  test('randomInt() throws an error if min > max.', () => {
    expect(() => {
      particles.randomInt(1, 0);
    }).toThrow();
  });

  test('randomInt() returns a valid int for range -MAX_SAFE_INTEGER to +MAX_SAFE_INTEGER', () => {
    let min = -Number.MAX_SAFE_INTEGER,
        max = Number.MAX_SAFE_INTEGER,
        v = particles.randomInt(min, max);

    expect(Number.isSafeInteger(v)).toBeTruthy(); // 'Returned value must be a safe integer');
    expect(v).inRange(min, max); // 'Returned value must be within given range');
  });
});

// Create stand-in for game
const game = { add: { sprite: () => ({ data: {} }) }, physics: { p2: { createCollisionGroup: () => ({}) } } };

describe('addEmitter() creates an accurate object for the \'smoke\' template.', () => {

  const e = particles.addEmitter(game, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 'smoke'),
        ed = e.data;

  test('Maximum concurrent particles for the smoke emitter should be 200.', () => {
    expect(ed.nParticlesCurrentMax).toBe(200);
  });
  test('Maximum total particles for the smoke emitter should be 1000.', () => {
    expect(ed.nParticlesTotalMax).toBe(1000);
  });
  test('Particle frequency for the smoke emitter should be 25.', () => {
    expect(ed.particleFrequency).toBe(25);
  });
  test('Maximum lifetime smoke emitter should be 1000.', () => {
    expect(ed.lifetimeMax).toBe(1000);
  });
  test('Smoke particles should be given a lifetime between 500 and 1500.', () => {
    expect(ed.pLifetimeMax()).inRange(500, 1500);
  });
  test('Smoke particles should be given a position between -5 and 5.', () => {
    expect(ed.pPos()).inRange(-5, 5);
  });
  test('Smoke particles should be given a size between 2 and 15', () => {
    expect(ed.pSize()).inRange(2, 15);
  });
  test('Smoke particles should be given an angle of 0.', () => {
    expect(ed.pAngle()).toBe(0);
  });
  test('Smoke particles should be given a thrust between 500 and 1000', () => {
    expect(ed.pThrust()).inRange(500, 1000);
  });

});
