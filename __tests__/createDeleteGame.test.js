const b = require('./browser');
const url = require('url');

let editPath;

describe('Create a new game', () => {
  test('Go to edit page', async () => {

    await b.page.goto(`${b.ROOT}/edit`, { timeout: 3000 });
    const u1 = await b.page.url();
    expect(u1.endsWith('/edit')).toBeTruthy();

    await b.page.waitForNavigation({ timeout: 6000 });
    const fullurl = await b.page.url();
    editPath = url.parse(fullurl).pathname;
    const match = editPath.match(/^\/edit\/[-\w\d]+\/*$/);
    expect(match && match[0]).toBeTruthy();

  }, 10000);
});

describe('Delete a game', () => {
  test('Go to My Games page', async () => {

    await b.page.goto(`${b.ROOT}/games`, { timeout: 3000 });
    const u1 = await b.page.url();
    expect(u1.endsWith('/games')).toBeTruthy();

    await b.page.waitForSelector('#games_content:not(.loading)', { timeout: 6000 });
  }, 10000);

  test('New game shows up on My Games page', async () => {

    // const before = await b.page.$$('.game-edit');
    // const countBefore = before.length;
    // expect(countBefore).toBeGreaterThanOrEqual(1);

    const query = `.game-edit[href="${editPath}"] + .game-delete`;
    await b.page.waitForSelector(query, { timeout: 2001 });
    await b.page.click(query);

    b.page.once('dialog', async dialog => {
      const popUp = await dialog.type();
      expect(popUp).toBe('confirm');
      await dialog.accept();
    });

    await b.page.click(query);
    await b.page.waitForSelector(query, { hidden: true, timeout: 2002 });

    // const after = await b.page.$$('.game-edit');
    // const countAfter = after.length;
    // expect(countAfter).toBe(countBefore - 1);

  }, 10000);
});
