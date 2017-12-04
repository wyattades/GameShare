const b = require('./browser');

describe('Create a Guest Username', () => {

  test('Go to specific game page', async () => { // Goto game in browser
    await b.page.goto(`${b.ROOT}/play/${b.TEST_GAME_ID}`);
  }, 4000);

  test('Enter Invalid Username', async () => {
    const dialog = await b.once(b.page, 'dialog');
    let popUp = await dialog.type(); // The dialog should be prompt
    expect(popUp).toBe('prompt');
    await dialog.accept('NameThatIsLongerThanTwentyCharacters'); // Upon entering an invalid name
  }, 3000);

  let name = 'Valid Name';

  test('Enter Valid Username', async () => {
    const dialog = await b.once(b.page, 'dialog');
    let popUp = await dialog.type(); // The dialog should be prompt
    expect(popUp).toBe('prompt');
    await dialog.accept(name); // Upon entering a valid name
  }, 3000);

});
