const b = require('./browser');
// NOTE: b.page and b.browser will be undefined unless accessing them in a 'describe' function

describe('Login with Google Sign In', () => {

  test('Connect to home page', async () => {
    await b.page.goto(`${b.ROOT}`); // Pretty much every puppeteer function must be preceeded by 'await'
    await b.page.waitForSelector('#google-sign-in');
    
    const title = await b.page.title();
    expect(title).toBe('Home');

  }, 2000); // 2000 = Test's timeout in milliseconds

  let googleAuthPage;

  test('Open Google Popup', async () => {
    await b.page.click('#google-sign-in');
    const popup = await b.once(b.browser, 'targetcreated');
    googleAuthPage = await popup.page();
  }, 4000);

  test('Enter credentials', async () => {
    await googleAuthPage.waitFor(2000);
    
    const legacy = await googleAuthPage.$('#Email');
    if (legacy) {
      await googleAuthPage.type('#Email', process.env.TEST_EMAIL);
      await googleAuthPage.click('#next');
      await googleAuthPage.waitForSelector('#Passwd', { timeout: 3001 });
      await googleAuthPage.type('#Passwd', process.env.TEST_PASS);
      await googleAuthPage.click('#signIn');
      await googleAuthPage.waitFor(2000);
      console.log(await googleAuthPage.$eval('body', e => e.outerHTML));
    } else {
      await googleAuthPage.waitForSelector('#identifierId', { timeout: 5002 });
      await googleAuthPage.type('#identifierId', process.env.TEST_EMAIL);
      await googleAuthPage.click('#identifierNext');
      await googleAuthPage.waitFor(2000);
      await googleAuthPage.waitForSelector('#password input[type="password"]', { timeout: 2003 });
      await googleAuthPage.type('#password input[type="password"]', process.env.TEST_PASS);
      await googleAuthPage.click('#passwordNext');
      await googleAuthPage.waitFor(2000);
      console.log(await googleAuthPage.$eval('body', e => e.outerHTML));
    }

    await b.page.waitForNavigation({ timeout: 8004 });
    const title = await b.page.title();
    expect(title).toBe('Games');

    const storage = await b.page.evaluate(() => JSON.stringify(window.localStorage));
    await b.write('__tests__/__temp.txt', storage);
  }, 15000);

});
