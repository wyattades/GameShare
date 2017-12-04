const b = require('./browser');

describe('Add object to game', () => {
  test('Go to specific edit page', async () => {

    await b.page.goto(`${b.ROOT}/edit/${b.TEST_GAME_ID}`);
    await b.page.waitForSelector('.object-block.group');

  }, 12000);

  test('Click rectangle button', async () => {
    await b.page.click('.object-block.group .new-rect-button');
  });

  test('Click circle button', async () => {
    await b.page.click('.object-block.group .new-ellip-button');
  });

  test('Object is in the sidebar', async () => {
    await b.page.waitForSelector('.object-button');
    await b.page.click('.object-button');
  });
});
