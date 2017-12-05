const b = require('./browser');

describe('Play game', () => {
  test('Go to specific play page', async () => {

    await b.page.goto(`${b.ROOT}/play/${b.TEST_GAME_ID}`);

  }, 4000);

});
