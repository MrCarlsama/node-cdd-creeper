const log = require("./utils");

/**
 * @name 跳转到指定个人主页
 * @param {*} page
 * @param {Object} options
 * {
 *  url : 跳转地址
 * }
 */
const gotoTargetHomePage = async (page, { url }) => {
  if (!url || !page) return Promise.reject();

  log.info(`正在前往 URL：${url}`);

  // 'https://www.weibo.com/hositiri?is_all=1'
  await page.goto(url, {
    timeout: 0,
    waitUntil: ["load", "domcontentloaded"]
  });

  log.info(`加载完毕 URL：${url}`);

  return Promise.resolve();
};

/**
 * @async 获取总页码数
 * @todo ///施工中///
 * @param {*} page
 */
const getTotalPages = async page => {
  log.info(`正在获取当前博主总页数`);

  const totals = await page.evaluate(() => {
    // "第 N 页"
    const lastDOMText = document.querySelector(
      "div[node-type=feed_list_page] div[action-type='feed_list_page_morelist'] ul li a"
    ).innerText;
    // N
    const nums = lastDOMText.slice(2, lastDOMText.search("页") - 1);
    return Number(nums);
  });

  log.info(`当前博主总页数：${totals}`);

  return Promise.resolve(totals);
};

/**
 * @async 获取当前页码
 * @todo ///施工中///
 * @param {*} page
 */
const getCurrentPages = async page => {
  log.info(`正在获取当前页`);

  const currentPage = await page.evaluate(() => {
    const currentDOMText = document.querySelector(
      "div[node-type=feed_list_page] span.list a[action-type='feed_list_page_more']"
    ).innerText;
    const nums = currentDOMText.slice(2, currentDOMText.search("页") - 1);
    return Number(nums);
  });

  log.info(`当前页：${currentPage}`);

  return Promise.resolve(currentPage);
};

/**
 * @async 将当前主页滚动查找指定元素
 * @todo ///施工中///
 * @param {*} page
 * @param {Object} options
 * {
 *  el : 判断指定目标节点
 * }
 */
const scrollToFindHanlde = async (
  page,
  { el } = { el: "div[node-type=feed_list_page]" }
) => {
  log.info(`正在滚动当前页面`);

  while ((await page.$(el)) === null) {
    await page.waitForTimeout(120);
    await page.mouse.wheel({ deltaY: 200 });
  }

  log.info(`滚动查找目标{${el}}完毕`);

  return Promise.resolve();
};

/**
 * @async 获取当前博主页面内容
 * @param {*} page
 *
 */
const getContent = async page => {
  log.info(`正在获取当前页面博文`);

  const contents = await page.evaluate(() => {
    const lists = Array.from(
      document.querySelectorAll(
        "div[node-type='feed_list'] div[action-type='feed_list_item']"
      )
    );
    console.log("lits, typeof ", typeof lists);
    return lists.map(list => {
      const id = list.getAttribute("mid");
      // 时间戳 - 日期 节点
      const dateDOM = list.querySelectorAll("div.WB_from a")[0];

      const timestamp = dateDOM.getAttribute("date");

      const date = dateDOM.getAttribute("title");
      // 用户名 - 内容 节点
      const contentDOM = list.querySelector(
        "div[node-type='feed_list_content']"
      );

      const username = contentDOM.getAttribute("nick-name");
      const content = contentDOM.querySelector("a").innerText;

      // 媒体（图片或视频） 节点
      const mediaDOM = list.querySelector(
        "div[node-type='feed_list_media_prev'] ul.WB_media_a"
      );

      let type = "none";
      let urls = [];

      if (mediaDOM) {
        const mediaChildDOMs = Array.from(mediaDOM.querySelectorAll("li"));
        const mediaClassName = mediaChildDOMs[0].className;

        const isPicDOM = mediaClassName.search("WB_pic") > -1;
        const isVideoDOM = mediaClassName.search("WB_video") > -1;

        if (isPicDOM) {
          type = "pictures";
          urls = mediaChildDOMs.map(mediaChildDOM =>
            mediaChildDOM.querySelector("img").getAttribute("src")
          );
        } else if (isVideoDOM) {
          type = "video";
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
        urls
      };
    });
  });

  // console.log(contents);
  log.info(`当前博文数量：${contents.length}`);

  return Promise.resolve(contents);

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
};

/**
 * @async 入口函数
 * @param {*} page
 */
const start = async page => {
  // 跳转网页
  await gotoTargetHomePage(page, {
    url: "https://www.weibo.com/hositiri?is_all=1"
  });

  for (let i = 0; i < 2; i++) {
    console.log("()", i);
    // 滚动查找 -- 下一页按钮
    await scrollToFindHanlde(page, {
      el: "div[node-type=feed_list_page]"
    });
    await getCurrentPages(page);

    await getContent(page);

    await page.click("a.page.next");

    await page.waitForNavigation({
      waitUntil: ["load", "domcontentloaded"],
      timeout: 0
    });
    console.log("()", i);
  }
  // const pageCounts = await getTotalPages(page);

  // 获取内容
  // await getContent(page);
};

module.exports = {
  start
};
