// Unit tests for particles system.
import * as particles from '../play/particles';

// TODO: move into __tests___, use Jest

// Throw an error if value is not === true.
const assertTrue = (v, problem = '') => {
  if (v !== true) {
    throw new Error(`assertTrue(${v}) failure. ${problem}`);
  }
};

// Throw an error if values are not strictly equal.
const assertEquals = (v1, v2, problem = '') => {
  if (v1 !== v2) {
    throw new Error(`assertEquals(${v1}, ${v2}) failure. ${problem}`);
  }
};

const assertInRange = (min, max, v, problem = '') => {
  if (v < min || v > max) {
    throw new Error(`assertInRange(${v}, ${min}, ${max}) failure. ${problem}`);
  }
};

// Describes a unit test.
// description: string that describes what this test is for.
// testf: function to call for testing phase.
// setupf: function to call for setup phase.
// teardownf: function to call for teardown phase.
class UnitTest {
  constructor(description, testf, setupf = null, teardownf = null) {
    this.prefix = '[DEV][UNIT TESTS] ';
    this.description = description;
    this.testf = testf;
    this.setupf = setupf;
    this.teardownf = teardownf;
  }
  
  // Run the associated test functions.
  // Note: failure on an earlier phase does not prevent later phases from being attempted.
  // Prints status messages to console, and returns true on success.
  run() {
    let success = true;
    try {
      if (this.setupf) this.setupf();
    } catch (err) {
      console.error(`${this.prefix}${this.description}: FAILED during setup phase. ${err}`);
      success = false;
    }
    try {
      if (this.testf) this.testf();
    } catch (err) {
      console.error(`${this.prefix}${this.description}: FAILED during test phase. ${err}`);
      success = false;
    }
    try {
      if (this.teardownf) this.teardownf();
    } catch (err) {
      console.error(`${this.prefix}${this.description}: FAILED during test phase. ${err}`);
      success = false;
    }
    if (success) {
      console.log(`${this.prefix}${this.description}: SUCCESS.`);
    }
    return success;
  }
}


// Returns a list of (pre-defined) UnitTest objects to be run.
const makeTests = (game) => {
  const tests = [];
  
  // Tests for randomInt().
  tests.push(new UnitTest(
    'randomInt() returns 0 for range 0 to 0',
    () => { let v = particles.randomInt(0, 0); assertEquals(v, 0); },
  ));
  
  tests.push(new UnitTest(
    'randomInt() throws an error if min > max.',
    () => {
      let errored = false;
      try {
        particles.randomInt(1, 0);
      } catch (e) {
        errored = true;
      }
      assertTrue(errored, 'randomInt() must create an error if min > max.');
    },
  ));
  
  tests.push(new UnitTest(
    'randomInt() returns a valid int for range -MAX_SAFE_INTEGER to +MAX_SAFE_INTEGER',
    () => {
      let min = -Number.MAX_SAFE_INTEGER,
          max = Number.MAX_SAFE_INTEGER,
          v = particles.randomInt(min, max);
          
      assertTrue(Number.isSafeInteger(v), 'Returned value must be a safe integer.');
      assertTrue((v >= min && v <= max), 'Returned value must be within given range.');
    },
  ));
  
  // Tests for addEmitter().
  tests.push(new UnitTest(
    'addEmitter() creates an accurate object for the \'smoke\' template.',
    () => {
      let e = particles.addEmitter(game, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 'smoke'),
          ed = e.data;
      assertEquals(ed.nParticlesCurrentMax, 200, 'Maximum concurrent particles for the smoke emitter should be 200.');
      assertEquals(ed.nParticlesTotalMax, 1000, 'Maximum total particles for the smoke emitter should be 1000.');
      assertEquals(ed.particleFrequency, 25, 'Particle frequency for the smoke emitter should be 25.');
      assertEquals(ed.lifetimeMax, 1000, 'Maximum lifetime smoke emitter should be 1000.');
      assertInRange(500, 1500, ed.pLifetimeMax(), 'Smoke particles should be given a lifetime between 500 and 1500.');
      assertInRange(-5, 5, ed.pPos(), 'Smoke particles should be given a position between -5 and 5.');
      assertInRange(2, 15, ed.pSize(), 'Smoke particles should be given a size between 2 and 15');
      assertEquals(ed.pAngle(), 0, 'Smoke particles should be given an angle of 0.');
      assertInRange(500, 1000, ed.pThrust(), 'Smoke particles should be given a thrust between 500 and 1000');
      e.destroy();
    },
  ));
  
  return tests;
};


// Runs the unit tests defined in makeTests().
export const runTests = (game) => {
  console.log('[DEV][UNIT TESTS] running particle system unit tests.');
  const tests = makeTests(game);
  let nSuccessfulTests = 0;
  for (let i = 0; i < tests.length; i++) {
    if (tests[i].run()) nSuccessfulTests++;
  }
  
  console.log(`[DEV][UNIT TESTS] ran ${tests.length} tests. 
    ${nSuccessfulTests} succeded, ${tests.length - nSuccessfulTests} failed.`);
};
