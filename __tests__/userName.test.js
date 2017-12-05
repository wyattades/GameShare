const b = require('./browser');

let firstDialog;

describe('Create a Guest Username', () => {

  test('Go to specific game page', async () => { // Goto game in browser
    await b.page.goto(`${b.ROOT}/play/${b.TEST_GAME_ID}`);
    firstDialog = await b.once(b.page, 'dialog');
  }, 8000);

  test('Enter Invalid Username', async () => {
    expect(firstDialog.type).toBe('prompt');
    await firstDialog.accept('NameThatIsLongerThanTwentyCharacters'); // Upon entering an invalid name
  }, 1000);

  let name = 'Valid Name';

  test('Enter Valid Username', async () => {
    const dialog = await b.once(b.page, 'dialog');
    expect(dialog.type).toBe('prompt');
    await dialog.accept(name); // Upon entering a valid name
  }, 3000);

});
