const puppeteer = require('puppeteer');
const chalk = require('chalk');

const {USERNAME, PASSWORD} = require('./cdd.config');
const {loginHandle, checkCookieHandle} = require('./login');
const log = require('./utils')
// 初始化
const initHanlde = async () => {
  if (!USERNAME || !PASSWORD) {
    log.error("设置 USERNAME PASSWORD")
    log.error("in /src/cdd.config.js")
    return;
  }

  const browser = await puppeteer.launch({
    headless: false,
    slowMo: 250,
  });
  const page = await browser.newPage();

  // 登录
  await loginHandle(page);

  console.log(chalk.green("===完成登陆，准备爬取页面图片==="))

  await page.goto('https://www.weibo.com/hositiri?is_all=1', {
    timeout: 0,
    waitUntil: ["load", "domcontentloaded"]
  });
  // 等待浏览器加载完毕
  console.log("跳转完加载完毕")

  console.log(typeof await page.$("div[node-type=feed_list_page]"))
  while( await page.$("div[node-type=feed_list_page]") === null ) {
    await page.waitForTimeout(500)
    await page.mouse.wheel({ deltaY: 200 })
  }

  await page.click("a.page.next");
  

};
module.exports = {
  initHanlde,
};
