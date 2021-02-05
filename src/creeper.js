const log = require('./utils')

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

  log.info(`正在前往 URL：${url}`)

  // 'https://www.weibo.com/hositiri?is_all=1'
  await page.goto(url, {
    timeout: 0,
    waitUntil: ["load", "domcontentloaded"]
  });

  log.info(`加载完毕 URL：${url}`)

  return Promise.resolve();
}



/**
 * @async 获取总页码数
 * @todo ///施工中///
 * @param {*} page 
 */
const getTotalPages = async page => {

}

/**
 * @async 获取当前页码
 * @todo ///施工中///
 * @param {*} page 
 */
const getCurrentPages = async page => {

}

/**
 * @async 将当前主页滚动查找指定元素
 * @todo ///施工中///
 * @param {*} page 
 * @param {Object} options 
 * {
 *  el : 判断指定目标节点
 * }
 */
const scrollToFindHanlde = async (page, { el } = { el: 'div[node-type=feed_list_page]' }) => {

  while( await page.$(el) === null ) {
    await page.waitForTimeout(300)
    await page.mouse.wheel({ deltaY: 200 })
  }

  return Promise.resolve()
}

/**
 * @async 获取当前博主页面内容
 * @param {*} page 
 * 
 */
const getContent = async page => {

}

/**
 * @async 入口函数
 * @param {*} page 
 */
const start = async page => {

  await gotoTargetHomePage(page, { url: "https://www.weibo.com/hositiri?is_all=1" })


}