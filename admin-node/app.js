const express = require('express')
const router = require('./router')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

//跨域
app.use(cors())

//解析post请求
app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())

app.use('/',router)

const server = app.listen(5050,function(){
    const {address,port} = server.address()
    console.log('HTTP服务启动成功http://%s:%s',address,port)
})