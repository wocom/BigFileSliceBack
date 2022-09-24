const koa = require('koa')
const url = require('url')
const koaBodyParser = require('koa-bodyparser')
// const koaStatic = require('koa-static')
const cors = require('koa-cors')

const inspector = require('inspector')
inspector.open()


const server = new koa()
// server.use(koaStatic('./'))

const BFSRouter = require('./router/index')

// server.use((ctx, next) =>{
//   const { pathname, query } = url.parse(ctx.request.url)
//   console.log(pathname)
//   console.log(query)
//   ctx.response.body = 'hello world'
// })

server.use(cors())

const bodyparser= new koaBodyParser()
server.use(bodyparser)

server.use(BFSRouter.routes())
// 自动补全状态码和方法被允许
server.use(BFSRouter.allowedMethods())
// server.use(BFSRouter.allowedMethods({
//   methodNotAllowed: ['get', 'head', 'put', 'post', 'delete']
// }))

server.listen(5000, 'localhost', () =>{
  console.log('服务启动成功！')
})

server.on('error', (err, ctx) =>{
  console.log(err.message)
  ctx.body = '出现错误'
})