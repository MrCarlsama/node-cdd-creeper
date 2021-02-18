const puppeteer = require("puppeteer");

const { weiboHandle } = require("./weibo");

const log = require("./utils");
// 初始化
const init = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });

  const works = [weiboHandle(browser)];

  Promise.all(works);
};
module.exports = {
  init
};
