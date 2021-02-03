const puppeteer = require("puppeteer");
const chalk = require("chalk");
const Axios = require("axios");
const { createWriteStream, existsSync, mkdirSync, readFile } = require("fs");
const { join, resolve } = require("path");
const readline = require("readline");

const USERNAME = "";
const PASSWORD = "";

let browser = null;

// 初始化
const initHanlde = async () => {

  if (!USERNAME || !PASSWORD) {
    console.log(chalk.red("设置USERNAME PASSWORD"))
  }

  browser = await puppeteer.launch({
    headless: false,
    slowMo: 250
  });
};

// 登录
async function loginHandle() {
  console.log(chalk.green("打开微博"));
  const page = await browser.newPage();
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

  const loginValidateType = await chooseLoginValidateHanlde(page);

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

      console.log(chalk.green("===登录完成==="))
      await loginSuccessHandle(page)
      page.cookies().then(async cookie => {
        createWriteStream("cookie.txt").write(JSON.stringify(cookie), "UTF8");//存储cookie
      });

      await page.goto("https://weibo.com/hositiri");

    } catch(err) {
        console.log("登录失败")
    }

  

  //   readSyncByRl("输入验证码：").then(async code => {
  //     await page.keyboard.type(code);
  //   });
}

/**
 * 
 * @return {Promise<Object[]>} cookies 
 */
 function loginSuccessHandle(page) {
  console.log(chalk.green("===录入cookie==="))
  return new Promise(async resolve => {
    await page.waitForNavigation()
    const cookie = await page.cookies()

    createWriteStream("cookie.txt").write(JSON.stringify(cookie), "UTF8");//存储cookie
    resolve(cookie);
  })
}

/**
 * 登录检查验证码
 * @return {Promise<number>} 1：短信验证，2：私信验证
 */
function chooseLoginValidateHanlde() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    console.log(chalk.green("===选择验证方式：1-短信验证，2-私信验证==="));
    rl.question("=> ", res => {
      rl.close();
      const answer = res.trim();
      if (answer === "1" || answer === "2") {
        console.log(
          chalk.green(`===【${answer === "1" ? "短信验证" : "私信验证"}】===`)
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
  return new Promise(async resolve => {
    // 点击短信验证
    await page.click("#messageCheck");
    // 等待加载 发送短信 DOM节点
    await page.waitForSelector("#message_sms_login");
    // 点击 发送短信
    await page.click("#message_sms_login");
    
    await page.waitForTimeout(200)
    const isFailElement = await page.$eval("div[action-type=tip_dom]", dom => dom) 
    // 弹框提示 失败 切换为私信登录
    /**
     * @todo 区分 超时或者验证码次数上限
     */
    if ( isFailElement ) {
      await weiboMsgValidateHandle(page);
    } else {
      resolve()
    }
  })
}

/**
 * 微博私信验证方法
 * @return {Promise}
 */
function weiboMsgValidateHandle(page) {
  return new Promise(async resolve => {
    // 点击私信验证
    await page.click("#dmCheck");
    // 等待加载 发送私信验证 DOM节点
    await page.waitForSelector("#send_dm_btn");
    // 点击 发送私信验证
    await page.click("#send_dm_btn");

    await page.waitForNavigation().then(()=>{
      console.log(chalk.green("===登陆成功==="))
      resolve()
    })
  })
}

/**
 * @todo 待优化
 */
function readSyncByRl(tips = "> ") {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(tips, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * @todo 待优化
 */
async function getPic() {
  const browser = await puppeteer.launch({ headless: false });
  console.log(chalk.green("服务正常启动"));
  const page = await browser.newPage();
  await page.goto("https://weibo.com/hositiri");
  await page.waitForNavigation();
  console.log(chalk.green("打开微博"));

  //   await page.screenshot({path: 'google.png'});
  // 等待页面加载完毕，
  await page.waitForNavigation({
    waitUntil: ["load"],
    timeout: 0
  });

  const pages = await page.$$eval(
    "#Pl_Official_MyProfileFeed__19 .WB_cardwrap",
    doms =>
      doms.map(el => {
        //   console.log(el.querySelectorAll('li').keys());
        const mid = el.getAttribute("mid");
        const text = el.querySelectorAll("div.WB_text a");
        const imgs = el.querySelectorAll("ul.WB_media_a li.WB_pic img");
        const tags = Array.from(text).map(tag => tag.innerText);
        const urls = Array.from(imgs).map(img => img.getAttribute("src"));
        return {
          mid,
          tags,
          urls
        };
      })
  );

  // await page.screenshot({ path: 'google.png', fullPage: true });

  console.log(pages);

  filterData(pages);

  await browser.close();

  // return pages;
}
/**
 * @todo 待优化
 */
async function downloadImages({ url, filePath, uploadPath, name }) {
  filePath = join(__dirname, filePath);
  // 目录判断
  if (!existsSync(filePath)) {
    mkdirSync(filePath, { recursive: true });
  }

  const myPath = resolve(filePath, name);
  console.log(myPath);
  const writerStream = createWriteStream(myPath, {
    encoding: "binary"
  });

  try {
    //   const isHas = await this.ossHelper.isExistObject(uploadPath);
    //   if (!isHas) {
    const response = await Axios({
      url,
      method: "get",
      responseType: "stream"
    }).then(res => res.data);

    // 流下载
    response
      .on("error", err => {
        console.log(
          "[Function downloadImages()] download faild, continue redownload"
        );
        downloadImages(url, filePath, uploadPath, name);
      })
      .pipe(writerStream)
      .on("close", () => {
        console.log(
          `[Function downloadImages()] download success, the path is ${myPath}`
        );
      });
    //   }
  } catch (error) {
    console.log("[Function downloadImages()] Get Image Faild By ", url);
    downloadImages({ url, filePath, uploadPath, name });
  }

  return filePath;
}
/**
 * @todo 待优化
 */
function filterData(results) {
  for (const result of results) {
    for (let i = 0; i < result.urls.length; i++) {
      downloadImages({
        url: repalceHandle(result.urls[i]),
        filePath: `/images`,
        uploadPath: `/images/${i}${result.tags[0]}${result.mid}.jpg`,
        name: `${i}${result.tags[0]}${result.mid}.jpg`
      });
    }
  }

  function repalceHandle(url) {
    const str = `https:${url}`;
    if (str.search("orj360") > -1) {
      return str.replace("orj360", "mw690");
    }
    if (str.search("thumb150") > -1) {
      return str.replace("thumb150", "mw690");
    }
    return str;
  }
}

/**
 * 检查是否有cookie
 * @return {Promise} cookie
 */
async function checkCookieHandle() {
  return new Promise((resolve, reject) => {
    readFile("./cookie.txt", "utf8", (err, data) => {
      if (err) {
        reject("获取本地cookie.txt失败" + err);
      } else {
        const cookies = JSON.parse(data);
        let result = "";
        cookie.forEach(res => {
          result = result + res.name + "=" + res.value + "; ";
        });
        resolve(result);
      }
    });
  });
}

/**
 * 设置cookies到本地文件cookie.txt
 * @param {Promise<Object[]>} cookies
 */
async function setCookieHandle(cookies) {
  await createWriteStream("cookie.txt").write(JSON.stringify(cookies), "UTF8"); //存储cookie
  Promise.resolve(cookies);
}
(async () => {
  await initHanlde();

  try {
    const cookies = await checkCookieHandle();
    console.log(cookies);
  } catch (err) {
    await loginHandle();
  }
})();
