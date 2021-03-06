const puppeteer = require('puppeteer');

const {init: initWeiboHanlde} = require('./weibo');

const log = require('./utils');
// 初始化
const init = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100,
    args: ['--no-sandbox'],
    dumpio: false,
  });

  const works = [initWeiboHanlde(browser)];

  Promise.all(works);
};
module.exports = {
  init,
};
