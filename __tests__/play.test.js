const b = require('./browser');

const TEST_GAME_ID = '-L-P6w2HkoDyQeGUOg2n';

describe('Play game', () => {
  test('Go to specific play page', async () => {

    await b.page.goto(`${b.ROOT}/play/${TEST_GAME_ID}`);

  }, 12000);

});
