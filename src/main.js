const puppeteer = require("puppeteer");
const chalk = require("chalk");

const { USERNAME, PASSWORD } = require("./cdd.config");
const { loginHandle, checkCookieHandle } = require("./login");
const { start } = require("./creeper");

const log = require("./utils");
// 初始化
const initHanlde = async () => {
  if (!USERNAME || !PASSWORD) {
    log.error("设置 USERNAME PASSWORD");
    log.error("in /src/cdd.config.js");
    return;
  }

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 100
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1200 });
  // 登录
  await loginHandle(page);

  // 开始爬他妈的！
  await start(page);
};
module.exports = {
  initHanlde
};
