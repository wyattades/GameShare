const b = require('./browser');

describe('Create a new game', () => {
  test('Go to edit page', async () => {

    await b.page.goto(`${b.ROOT}/edit`);
    const u1 = await b.page.url();
    expect(u1.endsWith('/edit')).toBe(true);

    await b.page.waitForNavigation({ timeout: 3000 });
    const u2 = await b.page.url();
    expect(u2.endsWith('/edit')).toBe(false);

  }, 12000);
});
