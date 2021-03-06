const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('./routes');
const app = new Koa();

// body-parser
app.use(
  bodyParser({
    formLimit: '1mb',
  })
);

// route
app.use(router.routes());

app.listen(2333);

console.log('Server Online');
