const puppeteer = require('puppeteer');
const chalk = require('chalk');
const Axios = require('axios');
const {createWriteStream, existsSync, mkdirSync, readFile} = require('fs');
const {join, resolve} = require('path');

const {initHanlde} = require('./src/main');

/**
 * @todo 待优化
 */
function readSyncByRl(tips = '> ') {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(tips, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * @todo 待优化
 */
async function getPic() {
  const browser = await puppeteer.launch({headless: false});
  console.log(chalk.green('服务正常启动'));
  const page = await browser.newPage();
  await page.goto('https://weibo.com/hositiri');
  await page.waitForNavigation();
  console.log(chalk.green('打开微博'));

  //   await page.screenshot({path: 'google.png'});
  // 等待页面加载完毕，
  await page.waitForNavigation({
    waitUntil: ['load'],
    timeout: 0,
  });

  const pages = await page.$$eval(
    '#Pl_Official_MyProfileFeed__19 .WB_cardwrap',
    (doms) =>
      doms.map((el) => {
        //   console.log(el.querySelectorAll('li').keys());
        const mid = el.getAttribute('mid');
        const text = el.querySelectorAll('div.WB_text a');
        const imgs = el.querySelectorAll('ul.WB_media_a li.WB_pic img');
        const tags = Array.from(text).map((tag) => tag.innerText);
        const urls = Array.from(imgs).map((img) => img.getAttribute('src'));
        return {
          mid,
          tags,
          urls,
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
async function downloadImages({url, filePath, uploadPath, name}) {
  filePath = join(__dirname, filePath);
  // 目录判断
  if (!existsSync(filePath)) {
    mkdirSync(filePath, {recursive: true});
  }

  const myPath = resolve(filePath, name);
  console.log(myPath);
  const writerStream = createWriteStream(myPath, {
    encoding: 'binary',
  });

  try {
    //   const isHas = await this.ossHelper.isExistObject(uploadPath);
    //   if (!isHas) {
    const response = await Axios({
      url,
      method: 'get',
      responseType: 'stream',
    }).then((res) => res.data);

    // 流下载
    response
      .on('error', (err) => {
        console.log(
          '[Function downloadImages()] download faild, continue redownload'
        );
        downloadImages(url, filePath, uploadPath, name);
      })
      .pipe(writerStream)
      .on('close', () => {
        console.log(
          `[Function downloadImages()] download success, the path is ${myPath}`
        );
      });
    //   }
  } catch (error) {
    console.log('[Function downloadImages()] Get Image Faild By ', url);
    downloadImages({url, filePath, uploadPath, name});
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
        name: `${i}${result.tags[0]}${result.mid}.jpg`,
      });
    }
  }

  function repalceHandle(url) {
    const str = `https:${url}`;
    if (str.search('orj360') > -1) {
      return str.replace('orj360', 'mw690');
    }
    if (str.search('thumb150') > -1) {
      return str.replace('thumb150', 'mw690');
    }
    return str;
  }
}

initHanlde();
