const router = require('koa-router')
// const multer = require('koa-multer')
const multer = require('@koa/multer')

const fs = require('fs')
const path = require('path')

const send = require('koa-send')


const BigFileSliceRouter = new router({
    prefix: '/bfs',
    methods: ['get']
})


// 切片文件目录
const theTempDir = path.join(__dirname, '../static/temp')
console.log('临时文件目录：', theTempDir)
// 合并文件目录
const theUploadDir = path.join(__dirname, '../static/upload')
console.log('合并文件目录：', theUploadDir)

const storage = new multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'static/temp')
  },
  filename: (req, file, cb) => {
      const { index } = req.body
      const filename = Buffer.from(file.originalname, 'latin1').toString('utf-8')
      cb(null, filename + '-' + index)
  },
})
const upload = multer({
  storage,
})
// ---------------------------------------------上传切片文件
BigFileSliceRouter.post('/upload', upload.single('file'), async (ctx, next) => {
    // if (!fs.existsSync(theTempDir)) {
    //     fs.mkdirSync(theTempDir, { recursive: true })
    // }
    ctx.body = {
        msg: '上传成功',
    }
})
// ---------------------------------------------合并切片文件接口
BigFileSliceRouter.post('/merge_chunks', async (ctx, next) => {
    const { name, total } = ctx.request.body
    // 读取所有的chunks
    const chunks = fs.readdirSync(theTempDir)
    // 创建存储文件
    const storeFilePath = theUploadDir + '\\' + name
    fs.writeFileSync(storeFilePath, '')
    if (chunks.length !== total || chunks.length === 0) {
        ctx.status = 200
        ctx.res.end('切片文件数量不符合')
        return
    }
    for (let i = 0; i < total; i++) {
        // 追加写入到文件中
        fs.appendFileSync(storeFilePath, fs.readFileSync(theTempDir + '\\' + name + '-' + i))
        // 删除本次使用的chunk
        fs.unlinkSync(theTempDir + '\\' + name + '-' + i)
    }
    // fs.rmdirSync(theTempDir);
    ctx.body = {
      msg: '合并成功'
    }
})

// ---------------------------------------------下载文件
BigFileSliceRouter.get('/download', async (ctx, next) => {
  const fileName = Buffer.from(ctx.request.query.name, 'utf-8').toString()
  const path = '/static/upload/' + fileName
  ctx.attachment(path)
  try {
    await send(ctx, path)
  } catch (error) {
    ctx.throw('404', '文件不存在')
  }
})

// ---------------------------------------------删除文件
BigFileSliceRouter.delete('/delete', async (ctx, next) => {
  const fileName = Buffer.from(ctx.request.query.name, 'utf-8').toString()
  try {
    fs.unlinkSync(theUploadDir + '\\' + fileName)
    ctx.body = {
      msg: '删除成功'
    }
  } catch (error) {
    ctx.throw('404', '文件不存在')
  }
})

// ---------------------------------------------获取上传文件列表
BigFileSliceRouter.get('/list', (ctx, next) => {
  const arr = fs.readdirSync(theUploadDir)
  const objArr = arr.map(v =>{
    const buffer = fs.readFileSync(theUploadDir + '\\' + v)
    const length = buffer.length
    let size = ''
    if(length >= 1024 * 1024){
      size = (length / 1024 / 1024).toFixed(2) + 'MB'
    }
    else if(length > 1024 && length < 1024 * 1024){
      size = (length / 1024).toFixed(2) + 'KB'
    }
    else{
      size = length + 'KB'
    }
    return {
      name: v,
      size,
      path: theUploadDir + '\\' + v
    }
  })
  ctx.body = {
    msg: 'ok',
    data: objArr
  }
})



module.exports = BigFileSliceRouter
