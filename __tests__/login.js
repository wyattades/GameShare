require('dotenv').config();
const admin = require('firebase-admin');
const b = require('./browser');
// NOTE: b.page and b.browser will be undefined unless accessing them in a 'describe' function

// Load private certificate from environment variable
const cert = JSON.parse(process.env.cert || '{}');

// Initialize firebase admin
admin.initializeApp({
  credential: admin.credential.cert(cert),
  databaseURL: `https://${cert.project_id}.firebaseio.com`,
});

describe('Login with Google Sign In', () => {

  test('Connect to home page', async () => {
    await b.page.goto(`${b.ROOT}`); // Pretty much every puppeteer function must be preceeded by 'await'
    await b.page.waitForSelector('#google-sign-in');
    
    const title = await b.page.title();
    expect(title).toBe('Home');

  }, 3000); // 3000 = Test's timeout in milliseconds

  test('Enter private token', async () => {
    
    const token = await admin.auth().createCustomToken('testuser-uid');
    await b.page.$eval('#token', (input, _token) => {
      input.value = _token;
      input.dispatchEvent(new Event('change'));
    }, token);

    await b.page.waitForNavigation({ timeout: 5004 });
    const title = await b.page.title();
    expect(title).toBe('Games');

    const storage = await b.page.evaluate(() => JSON.stringify(window.localStorage));
    await b.write('__tests__/__temp.txt', storage);
  }, 10000);

});
