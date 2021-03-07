const puppeteer = require('puppeteer');

/**
 * 获取无头浏览器
 */
const getBrowser = async () => {
  const browser = await puppeteer.launch({
    // headless: false,
    slowMo: 40,
    args: ['--no-sandbox'],
    dumpio: false,
  });
  return browser;
};

const getPage = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1200});
  return page;
};

module.exports = {
  getBrowser,
  getPage,
};
