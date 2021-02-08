const chalk = require("chalk");
const readline = require("readline");
const { createWriteStream, readFile } = require("fs");
const { USERNAME, PASSWORD } = require("./cdd.config");
const log = require("./utils");

/**
 * @async 开始登录
 * @param {*} page
 * @return {void}
 */
const loginHandle = async page => {
  log.info("打开微博");
  await page.goto("https://www.weibo.com", {
    timeout: 0
  });

  // 等待浏览器加载完毕
  await page.waitForNavigation({
    waitUntil: ["load"],
    timeout: 0
  });

  // 点击登录
  await page.click("a[node-type=loginBtn]");

  // 等待加载登录DOM节点
  await page.waitForSelector(
    "div[node-type=login_frame] input[node-type=username]"
  );

  // 输入账号密码
  await page.type(
    "div[node-type=login_frame] input[node-type=username]",
    USERNAME
  );
  await page.type(
    "div[node-type=login_frame] input[node-type=password]",
    PASSWORD
  );

  await page.click("div[node-type=login_frame] a[action-type=btn_submit]");

  // const loginValidateType = await chooseLoginValidateHanlde(page);
  const loginValidateType = "2";
  log.info("微博私信验证（短信验证待完善）");

  // 等待加载 登陆验证 节点
  await page.waitForSelector("#qrCodeCheckDiv");

  try {
    switch (loginValidateType) {
      case "1":
        await messageValidateHandle(page);
        break;

      case "2":
        await weiboMsgValidateHandle(page);
        break;
    }

    loginSuccessHandle(page);

    return Promise.resolve();
  } catch (err) {
    log.error("登录失败");
    return Promise.reject();
  }
};

/**
 * 登录检查验证码
 * @return {Promise<number>} 1：短信验证，2：私信验证
 */
const chooseLoginValidateHanlde = () => {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    log.confirm("选择验证方式：1-短信验证，2-私信验证");
    // console.log(chalk.green('===选择验证方式：1-短信验证，2-私信验证==='));
    rl.question("=> ", res => {
      rl.close();
      const answer = res.trim();
      if (answer === "1" || answer === "2") {
        log.info(answer === "1" ? "短信验证" : "私信验证");

        resolve(answer);
      } else {
        resolve(chooseLoginValidateHanlde());
      }
    });
  });
};

/**
 * 短信验证方法
 * @param {*} page
 * @return {Promise}
 */
const messageValidateHandle = page => {
  return new Promise(async resolve => {
    // 点击短信验证
    await page.click("#messageCheck");
    // 等待加载 发送短信 DOM节点
    await page.waitForSelector("#message_sms_login");
    // 点击 发送短信
    await page.click("#message_sms_login");

    await page.waitForTimeout(200);
    const isFailElement = await page.$eval(
      "div[action-type=tip_dom]",
      dom => dom
    );
    // 弹框提示 失败 切换为私信登录
    /**
     * @todo 区分 超时或者验证码次数上限
     */
    if (isFailElement) {
      await weiboMsgValidateHandle(page);
    } else {
      resolve();
    }
  });
};

/**
 * 微博私信验证方法
 * @param {*} page
 * @return {Promise}
 */
const weiboMsgValidateHandle = page => {
  return new Promise(async resolve => {
    // 点击私信验证
    await page.click("#dmCheck");
    // 等待加载 发送私信验证 DOM节点
    await page.waitForSelector("#send_dm_btn");
    // 点击 发送私信验证
    await page.click("#send_dm_btn");

    await page.waitForNavigation().then(() => {
      log.success("登录成功");
      resolve();
    });
  });
};

/**
 * 登录成功后处理方法
 * @param {*} page
 * @return {void}
 */
const loginSuccessHandle = async page => {
  // 等待浏览器加载完毕
  await page.waitForNavigation({
    waitUntil: ["load"],
    timeout: 0
  });

  // 设置cookie到本地
  setCookieHandle(page);
};

/**
 * 检查是否有cookie
 * @return {Promise<boolean>} 是否有cookie
 */
const checkCookieHandle = () => {
  return new Promise((resolve, reject) => {
    readFile("./cookie.txt", "utf8", (err, data) => {
      if (err) {
        log.error("获取本地cookie.txt失败");
        console.log(err);
        resolve(false);
      } else {
        const cookies = JSON.parse(data);
        let result = "";
        cookies.forEach(res => {
          result = result + res.name + "=" + res.value + "; ";
        });
        resolve(true);
      }
    });
  });
};

/**
 * 设置Cookie
 * @param {*} page
 * @return {void}
 */
const setCookieHandle = async page => {
  log.info("正在录入cookie");
  const cookie = await page.cookies();
  createWriteStream("./cookie.txt").write(JSON.stringify(cookie), "UTF8"); //存储cookie
  log.info("录入cookie完成");
};

/**
 * 检查是否有cookie
 * @return {Promise<boolean>} 是否有cookie
 */
const getCookieHandle = () => {
  return new Promise(async (resolve, reject) => {
    const isHasCookie = await checkCookieHandle();

    if (isHasCookie) {
      readFile("./cookie.txt", "utf8", (err, data) => {
        if (err) {
          reject("获取本地cookie.txt失败" + err);
        } else {
          const cookies = JSON.parse(data);
          const result = cookies
            .map(cookie => `${cookie.name}=${cookie.name};`)
            .join("");
          resolve(result);
        }
      });
    } else {
      reject("本地暂无cookie文件，请先获取浏览器cookie");
    }
  });
};

module.exports = {
  loginHandle,
  checkCookieHandle,
  getCookieHandle
};
