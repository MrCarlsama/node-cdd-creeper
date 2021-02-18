const { USERNAME, PASSWORD } = require("./cdd.config");
const { loginHandle, checkCookieHandle, setCookieHandle } = require("./login");
const { start } = require("./creeper");

const log = require("../utils");
// 初始化
const initHanlde = async browser => {
  if (!USERNAME || !PASSWORD) {
    log.error("微博使用前请设置cdd.config.js中账号信息");
    log.error("in /src/weibo/cdd.config.js");
    return;
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1200 });

  log.info("打开微博");
  await page.goto("https://www.weibo.com", {
    timeout: 0
  });

  // 等待浏览器加载完毕
  await page.waitForNavigation({
    waitUntil: ["load", "domcontentloaded"],
    timeout: 0
  });

  const isHasCookie = await checkCookieHandle();

  if (isHasCookie) {
    await setCookieHandle(page);
  } else {
    // 登录
    await loginHandle(page);
  }

  // 开始爬他妈的！
  await start(page);
};
module.exports = {
  weiboHandle: initHanlde
};
