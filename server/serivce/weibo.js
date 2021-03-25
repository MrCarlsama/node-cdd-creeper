const { getBrowser, getPage } = require('./index');
const { init } = require('../../src/weibo/index');
const {
  gotoTargetHomePage,
  gotoTargetPages,
  getContents,
} = require('../../src/weibo/creeper');
const { checkIsNeedLoginHandle } = require('../../src/weibo/login');
const { default: axios } = require('axios');
let browser = null;

const getUserAllContents = () => {};

/**
 * 获取目标用户指定页面的所有博文内容
 */
const getUserContentsByCurrentPages = async (url, { pageIndex }) => {
  if (!browser) {
    browser = await getBrowser();
  }

  const page = await init(browser, 'http');

  // 跳转网页
  await gotoTargetHomePage(page, {
    url,
  });

  await gotoTargetPages(page, pageIndex);

  const isCheckLoginResult = await checkIsNeedLoginHandle(page);

  if (isCheckLoginResult) {
    // 等待一些验证跳转
    await page.waitForNavigation({
      timeout: 0,
      waitUntil: ['load', 'domcontentloaded'],
    });
    await gotoTargetPages(page, pageIndex);
  }

  const contents = await getContents(page);

  const newContents = handleFilterContents(contents);

  page.close();

  for (const content of newContents) {
    createContentsByPhotos(content);
  }

  return newContents;
};

const createContentsByPhotos = (content) => {
  axios.post('http://localhost:3000/api/cdd/photos', {
    data: content,
  });
};

/**
 * 构建新结构
 * @param {*} contents
 */
const handleFilterContents = (contents) => {
  const regByTags = /\#(.+?)\#/g; //  匹配井号内内标签

  const newContents = [];

  contents.forEach((content) => {
    const urlsConetentList = content.urls.map((url) => {
      const nicknames = content.content.match(regByTags); // 匹配并去除井号

      return {
        nicknames: nicknames
          ? nicknames.map((nickname) => nickname.slice(1, -1))
          : [],
        sourcePlatform: 2,
        sourceUrl: url,
        status: true,
        isAudit: false,
        issueDate: new Date(content.date),
      };
    });

    newContents.push(...urlsConetentList);
  });

  return newContents;
};

const getUserContentsByLastDate = () => {};

const checkIsHasNewContents = () => {};

module.exports = {
  getUserAllContents,
  getUserContentsByCurrentPages,
  getUserContentsByLastDate,
  checkIsHasNewContents,
};
