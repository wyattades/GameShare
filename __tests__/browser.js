const puppeteer = require('puppeteer');
const { readFile, writeFile, exists } = require('fs');
const { promisify } = require('util');

const width = 1600;
const height = 900;

const common = {
  page: null,
  browser: null,
  ROOT: 'http://localhost:3000',
  TEST_GAME_ID: '-L-P6w2HkoDyQeGUOg2n',

  // Helper functions:

  once: (listener, event) => new Promise((resolve, reject) => {
    // allow async on listener.once, with timeout
    listener.once(event, resolve);

    setTimeout(() => {
      reject('Browser.once timed out');
    }, 3000);
  }),
  read: promisify(readFile),
  write: promisify(writeFile),
  exists: promisify(exists),
};

beforeAll(async () => {
  common.browser = await puppeteer.launch({
    // Uncommenting these lines can help debug:
    // headless: false,
    // slowMo: 80,
    args: [
      `--window-size=${width},${height}`, '--disable-popup-blocking',
      '--disable-web-security',
    ],
  });

  common.page = await common.browser.newPage();

  // TODO: do we need userAgent?
  // await common.page.setUserAgent(
  //   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)' +
  //   'HeadlessChrome/64.0.3264.0 Safari/537.36',
  // );
  // await common.page.setExtraHTTPHeaders({
  //   'accept-language': 'en-US,en;q=0.8',
  // });
  await common.page.setViewport({ width, height });

  await common.page.goto(`${common.ROOT}`);

  // Load local storage from temp file
  const isStorage = await common.exists('__tests__/__temp.txt');
  if (isStorage) {
    const str = await common.read('__tests__/__temp.txt');
    await common.page.evaluate(storage => {
      for (let key in storage) {
        localStorage.setItem(key, storage[key]);
      }
    }, JSON.parse(str));
  }
});


afterAll(() => {
  common.browser.close();
});

module.exports = common;
