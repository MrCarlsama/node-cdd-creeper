const Router = require('koa-router');
const router = Router();
const weiboSerivce = require('../serivce/weibo');

router.post('/task/weibo', async (ctx, next) => {
  const {url, pageIndex, isAll} = ctx.request.body;

  console.log(ctx.request.body);

  // 是否全获取
  if (!!isAll) {
  } else {
    // 直接通过目标url获取指定页码
    const curretContents = await weiboSerivce.getUserContentsByCurrentPages(
      url,
      {
        pageIndex,
      }
    );
    ctx.body = curretContents;
  }
});

module.exports = router;
