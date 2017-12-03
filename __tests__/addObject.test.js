const b = require('./browser');

const TEST_GAME_ID = '-L-R-LiT0xTiyrnUzGvd';

describe('Add object to game', () => {
  test('Go to specific edit page', async () => {

    await b.page.goto(`${b.ROOT}/edit/${TEST_GAME_ID}`);
    await b.page.waitForSelector('.object-block.group');

  }, 12000);

  test('Click rectangle button', async () => {
    await b.page.click('.object-block.group .new-rect-button');
  });

  // TODO: verify new object was added

});
