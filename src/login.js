const chalk = require('chalk');
const readline = require('readline');
const {createWriteStream, readFile} = require('fs');
const {USERNAME, PASSWORD} = require('./cdd.config');

/**
 * 开始登录
 */
async function loginHandle(page) {
  console.log(chalk.green('打开微博'));
  await page.goto('https://www.weibo.com', {
    timeout: 0,
  });

  // 等待浏览器加载完毕
  await page.waitForNavigation({
    waitUntil: ['load'],
    timeout: 0,
  });

  // 点击登录
  await page.click('a[node-type=loginBtn]');

  // 等待加载登录DOM节点
  await page.waitForSelector(
    'div[node-type=login_frame] input[node-type=username]'
  );

  // 输入账号密码
  await page.type(
    'div[node-type=login_frame] input[node-type=username]',
    USERNAME
  );
  await page.type(
    'div[node-type=login_frame] input[node-type=password]',
    PASSWORD
  );

  await page.click('div[node-type=login_frame] a[action-type=btn_submit]');

  const loginValidateType = await chooseLoginValidateHanlde(page);

  // 等待加载 登陆验证 节点
  await page.waitForSelector('#qrCodeCheckDiv');

  try {
    switch (loginValidateType) {
      case '1':
        await messageValidateHandle(page);
        break;

      case '2':
        await weiboMsgValidateHandle(page);
        break;
    }

    console.log(chalk.green('===登录完成==='));
    loginSuccessHandle(page);

    await page.goto('https://weibo.com/hositiri');
  } catch (err) {
    console.log('登录失败');
  }

  //   readSyncByRl("输入验证码：").then(async code => {
  //     await page.keyboard.type(code);
  //   });
}

/**
 * 登录检查验证码
 * @return {Promise<number>} 1：短信验证，2：私信验证
 */
function chooseLoginValidateHanlde() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    console.log(chalk.green('===选择验证方式：1-短信验证，2-私信验证==='));
    rl.question('=> ', (res) => {
      rl.close();
      const answer = res.trim();
      if (answer === '1' || answer === '2') {
        console.log(
          chalk.green(`===【${answer === '1' ? '短信验证' : '私信验证'}】===`)
        );
        resolve(answer);
      } else {
        resolve(chooseLoginValidateHanlde());
      }
    });
  });
}

/**
 * 短信验证方法
 * @return {Promise}
 */
function messageValidateHandle(page) {
  return new Promise(async (resolve) => {
    // 点击短信验证
    await page.click('#messageCheck');
    // 等待加载 发送短信 DOM节点
    await page.waitForSelector('#message_sms_login');
    // 点击 发送短信
    await page.click('#message_sms_login');

    await page.waitForTimeout(200);
    const isFailElement = await page.$eval(
      'div[action-type=tip_dom]',
      (dom) => dom
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
}

/**
 * 微博私信验证方法
 * @return {Promise}
 */
function weiboMsgValidateHandle(page) {
  return new Promise(async (resolve) => {
    // 点击私信验证
    await page.click('#dmCheck');
    // 等待加载 发送私信验证 DOM节点
    await page.waitForSelector('#send_dm_btn');
    // 点击 发送私信验证
    await page.click('#send_dm_btn');

    await page.waitForNavigation().then(() => {
      console.log(chalk.green('===登陆成功==='));
      resolve();
    });
  });
}

/**
 * 登录成功后处理方法
 */
function loginSuccessHandle(page) {
  page.waitForNavigation().then(async () => {
    setCookieHandle(page);
  });
}

/**
 * 检查是否有cookie
 * @return {Promise} cookie
 */
async function checkCookieHandle() {
  return new Promise((resolve, reject) => {
    readFile('./cookie.txt', 'utf8', (err, data) => {
      if (err) {
        reject('获取本地cookie.txt失败' + err);
      } else {
        const cookies = JSON.parse(data);
        let result = '';
        cookies.forEach((res) => {
          result = result + res.name + '=' + res.value + '; ';
        });
        resolve(result);
      }
    });
  });
}

/**
 * 设置Cookie
 * @param {*} page
 */
async function setCookieHandle(page) {
  console.log(chalk.green('===正在录入cookie==='));
  const cookie = await page.cookies();
  createWriteStream('./cookie.txt').write(JSON.stringify(cookie), 'UTF8'); //存储cookie
  console.log(chalk.green('===录入cookie完成==='));
}

module.exports = {
  loginHandle,
  checkCookieHandle,
};
