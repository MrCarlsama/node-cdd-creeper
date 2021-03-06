const {getBrowser, getPage} = require('./index');
const {init} = require('../../src/weibo/index');
const {
  gotoTargetHomePage,
  gotoTargetPages,
  getContents,
} = require('../../src/weibo/creeper');
let browser = null;

const getUserAllContents = () => {};

/**
 * 获取目标用户指定页面的所有博文内容
 */
const getUserContentsByCurrentPages = async (url, {pageIndex}) => {
  if (!browser) {
    browser = await getBrowser();
  }

  const page = await init(browser, 'http');

  // 跳转网页
  await gotoTargetHomePage(page, {
    url,
  });

  await gotoTargetPages(page, pageIndex);

  const contents = await getContents(page);

  page.close();

  return contents;
};

const getUserContentsByLastDate = () => {};

const checkIsHasNewContents = () => {};

module.exports = {
  getUserAllContents,
  getUserContentsByCurrentPages,
  getUserContentsByLastDate,
  checkIsHasNewContents,
};
