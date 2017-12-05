const b = require('./browser');

let firstDialog;

describe('Create a Guest Username', () => {

  test('Go to specific game page', async () => { // Goto game in browser
    await b.page.goto(`${b.ROOT}/play/${b.TEST_GAME_ID}`);
  }, 4000);

  test('Enter username if not logged in', async () => {
    try {
      firstDialog = await b.once(b.page, 'dialog');
    } catch (e) { /**/ }

    if (firstDialog) {
      expect(firstDialog.type).toBe('prompt');
      await firstDialog.accept('Some name'); // Upon entering an invalid name
    }
  }, 6000);
});
