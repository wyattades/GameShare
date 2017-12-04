const b = require('./browser');

const TEST_GAME_ID = '-L-FT2qhK2horrpT_Kva'; // Actual game on server(Riley's Game)

describe('Create a Guest Username', () => {

  test('Go to specific game page', async () => { // Goto game in browser
    await b.page.goto(`${b.ROOT}/play/${TEST_GAME_ID}`);
  }, 4000);

  test('Enter Invalid Username', async () => {
    await b.page.on('dialog', async dialog => {
      await dialog.accept('NameThatIsLongerThanTwentyCharacters'); // Upon entering an invalid name
      let popUp = await dialog.type(); // The dialog should prompt again
      expect(popUp).toBe('prompt');
    });
  });

  let name = 'Valid Name';

  test('Enter Valid Username', async () => {
    await b.page.on('dialog', async dialog => {
      await dialog.accept(name); // Upon entering a valid name
      await dialog.dismiss(); // the dialog should be dismissed
    });
  });
}, 12000);
