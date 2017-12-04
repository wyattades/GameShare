const puppeteer = require('puppeteer');
const { readFile, writeFile, exists } = require('fs');
const { promisify } = require('util');

Error.stackTraceLimit = 40;

const width = 1600;
const height = 900;

const common = {
  page: null,
  browser: null,
  ROOT: 'http://localhost:3000',
  // Helper functions
  once: (listener, event) => new Promise(resolve => listener.once(event, resolve)), // allow async on listener.once
  read: promisify(readFile),
  write: promisify(writeFile),
  exists: promisify(exists),
};

beforeAll(async () => {
  common.browser = await puppeteer.launch({
    // headless: false,
    // slowMo: 80,
    args: [`--window-size=${width},${height}`, '--disable-popup-blocking'],
  });

  common.page = await common.browser.newPage();

  // await common.page.setUserAgent(
  //   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko)' +
  //   'HeadlessChrome/64.0.3264.0 Safari/537.36',
  // );
  // await common.page.setExtraHTTPHeaders({
  //   'accept-language': 'en-US,en;q=0.8',
  // });
  await common.page.setViewport({ width, height });

  await common.page.goto(`${common.ROOT}`);

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
