const puppeteer = require('puppeteer');
const chalk = require('chalk');

const {USERNAME, PASSWORD} = require('./cdd.config');
const {loginHandle, checkCookieHandle} = require('./login');

// 初始化
const initHanlde = async () => {
  if (!USERNAME || !PASSWORD) {
    console.log(chalk.red('设置USERNAME PASSWORD'));
    return;
  }

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
  });
  const page = await browser.newPage();

  try {
    const cookies = await checkCookieHandle();
    console.log(cookies);
    await page.goto('https://weibo.com/hositiri');
  } catch (err) {
    await loginHandle(page);
  }
};
module.exports = {
  initHanlde,
};
