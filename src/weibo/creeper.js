const fs = require('fs');
const {TARGET_URL} = require('./cdd.config');
const log = require('../utils');

/**
 * @name 跳转到指定个人主页
 * @param {*} page
 * @param {Object} options
 * {
 *  url : 跳转地址
 * }
 */
const gotoTargetHomePage = async (page, {url}) => {
  log.info(`正在前往 URL：${url}`);

  await page.goto(url, {
    timeout: 0,
    waitUntil: ['load', 'domcontentloaded'],
  });
  console.log(page.url() !== url);
  // 非指定目标页时， 等待一些验证跳转
  if (page.url() !== url) {
    await page.waitForNavigation({
      timeout: 0,
      waitUntil: ['load', 'domcontentloaded'],
    });
  }

  log.info(`加载完毕 URL：${page.url()}`);

  return Promise.resolve();
};

/**
 * @async 跳转到目标页数
 * @param {*} page
 * @param {number} target 目标页数
 * @todo ///待完善///
 */
const gotoTargetPages = async (page, target) => {
  // 滚动查找 -- 分页按钮组
  await scrollToFindHanlde(page, {
    el: 'div[node-type=feed_list_page]',
  });

  await page.evaluate((target) => {
    const listPages = document.querySelectorAll(
      "div[node-type=feed_list_page] div[action-type='feed_list_page_morelist'] ul li a"
    );
    const maxLength = listPages.length;
    listPages[maxLength - target].click();
  }, target);

  await page.waitForNavigation({
    waitUntil: ['load', 'domcontentloaded'],
    timeout: 0,
  });

  return Promise.resolve();
};

/**
 * @async 获取总页码数
 * @param {*} page
 * @return {Promise<number>} 当前总页码数
 */
const getTotalPages = async (page) => {
  // log.info(`正在获取当前博主总页数`);

  // 滚动查找 -- 下一页按钮
  await scrollToFindHanlde(page, {
    el: 'div[node-type=feed_list_page]',
  });

  const totals = await page.evaluate(() => {
    // "第 N 页"
    // @todo 直接取值可能存在误差，暂时先这样处理，后续以 dom节点数量为准
    // const lastDOMText = document.querySelector(
    //   "div[node-type=feed_list_page] div[action-type='feed_list_page_morelist'] ul li a"
    // ).innerText;
    // N
    // const nums = lastDOMText.slice(2, lastDOMText.search("页") - 1);

    const maxLength = document.querySelectorAll(
      "div[node-type=feed_list_page] div[action-type='feed_list_page_morelist'] ul li"
    ).length;

    return Number(maxLength);
  });

  log.info(`当前博主总页数：${totals}`);

  return Promise.resolve(totals);
};

/**
 * @async 获取当前页码
 * @param {*} page
 * @return {Promise<number>} 当前页数字
 */
const getCurrentPages = async (page) => {
  // log.info(`正在获取当前页`);

  // 滚动查找 -- 下一页按钮
  await scrollToFindHanlde(page, {
    el: 'div[node-type=feed_list_page]',
  });

  const currentPage = await page.evaluate(() => {
    const currentDOMText = document.querySelector(
      "div[node-type=feed_list_page] span.list a[action-type='feed_list_page_more']"
    ).innerText;
    const nums = currentDOMText.slice(2, currentDOMText.search('页') - 1);
    return Number(nums);
  });

  log.info(`当前页：${currentPage}`);

  return Promise.resolve(currentPage);
};

/**
 * @async 将当前主页滚动查找指定元素
 * @param {*} page
 * @param {Object} options
 * {
 *  el : 判断指定目标节点
 * }
 */
const scrollToFindHanlde = async (
  page,
  {el} = {el: 'div[node-type=feed_list_page]'}
) => {
  if (!page) return Promise.reject();

  log.info(`正在滚动当前页面`);

  while ((await page.$(el)) === null) {
    await page.waitForTimeout(60);
    await page.mouse.wheel({deltaY: 150});

    //
    if ((await page.$('div[node-type=lazyload] a')) !== null) {
      await page.evaluate(() => {
        console.log(document.querySelector('div[node-type=lazyload] a'));
        document.querySelector('div[node-type=lazyload] a').click();
      });
    }
  }
  return Promise.resolve();
};

/**
 * @async 获取当前博主页面内容
 * @param {*} page
 *
 */
const getContents = async (page) => {
  // log.info(`正在获取当前页面博文`);

  // 滚动查找 -- 分页按钮组
  await scrollToFindHanlde(page, {
    el: 'div[node-type=feed_list_page]',
  });

  const contents = await page.evaluate(() => {
    // url weibo 缩略图替换成大图地址
    const replaceURLHandle = (url) => {
      const str = `https:${url}`;
      if (str.search('orj360') > -1) {
        return str.replace('orj360', 'mw690');
      }
      if (str.search('thumb150') > -1) {
        return str.replace('thumb150', 'mw690');
      }
      console.log('未匹配规则：', str);
      return str;
    };

    const lists = Array.from(
      document.querySelectorAll(
        "div[node-type='feed_list'] div[action-type='feed_list_item']"
      )
    );
    return lists
      .map((list) => {
        const id = list.getAttribute('mid');
        // 时间戳 - 日期 节点
        const dateDOM = list.querySelectorAll('div.WB_from a')[0];

        const timestamp = dateDOM.getAttribute('date');

        const date = dateDOM.getAttribute('title');
        // 用户名 - 内容 节点
        const contentDOM = list.querySelector(
          "div[node-type='feed_list_content']"
        );

        const username = contentDOM.getAttribute('nick-name');
        const content = contentDOM.innerText;

        // 判断是否为转发微博
        const isForward =
          contentDOM.querySelector(
            "div[node-type='feed_list_forwardContent']"
          ) !== null;

        // 过滤转发微博
        if (isForward === null) return null;

        // 媒体（图片或视频） 节点
        const mediaDOM = list.querySelector(
          "div[node-type='feed_list_media_prev'] ul.WB_media_a"
        );

        let type = 'none';
        let urls = [];

        if (mediaDOM) {
          const mediaChildDOMs = Array.from(mediaDOM.querySelectorAll('li'));
          const mediaClassName = mediaChildDOMs[0].className;

          const isPicDOM = mediaClassName.search('WB_pic') > -1;
          const isVideoDOM = mediaClassName.search('WB_video') > -1;

          if (isPicDOM) {
            type = 'pictures';
            urls = mediaChildDOMs.map((mediaChildDOM) => {
              const url = mediaChildDOM
                .querySelector('img')
                .getAttribute('src');

              return replaceURLHandle(url);
            });
          } else if (isVideoDOM) {
            type = 'video';
            // @todo 视频标签地址来源不确定，暂不处理。

            // urls = mediaChildDOMs.map(mediaChildDOM =>
            //   mediaChildDOM.querySelector("video").getAttribute("src")
            // );
            urls = [];
          }
        }

        return {
          id,
          username,
          content,
          timestamp,
          date,
          type,
          urls,
        };
      })
      .filter((content) => content !== null);
  });

  log.info(`当前博文数量：${contents.length}`);

  return Promise.resolve(contents);

  // 过滤时间
  function validateTimeByFilter(timestamp, {mode, targetTimestamp}) {
    const currentTime = new Date(timestamp);
    switch (mode) {
    }
  }
};

/**
 * @async 入口函数
 * @param {*} page
 */
const start = async (page) => {
  if (!page) return Promise.reject();

  // 跳转网页
  await gotoTargetHomePage(page, {
    url: TARGET_URL,
  });

  // 获取总页码
  const pageCounts = await getTotalPages(page);

  // 翻页爬取数据
  for (let i = 0; i < 20; i++) {
    try {
      // await getCurrentPages(page);

      await getContents(page);

      // await page.waitForSelector("a.page.next[bpfilter='page']");

      // await page.click("a.page.next[bpfilter='page']");

      await gotoTargetPages(page, i + 2);
    } catch (err) {
      console.log(err);
      fs.createWriteStream(
        __dirname + `/getContentsErrorLog[${new Date().getTime()}]By${i}.txt`
      ).write(err.toString(), 'UTF8'); //存储错误信息
    }
  }
};

module.exports = {
  start,
  getContents,
  getTotalPages,
  gotoTargetPages,
  gotoTargetHomePage,
};
