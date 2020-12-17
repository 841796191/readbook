const express = require('express')
const boom = require('boom')
const userRouter = require('./user')
const bookRouter = require('./book')
const jwtAuth = require('./jwt')
const Result = require('../models/Result')

//注册路由
const router = express.Router()

//jwt验证
router.use(jwtAuth)


router.get('/',function(req,res){
    res.send('读书管理后台')
})

//处理用户信息请求
router.use('/user',userRouter)

//处理书籍信息请求
router.use('/book',bookRouter)

/**
 * 集中处理404请求的中间件
 * 注：该中间件必须放在正常处理流程之后
 * 否则会拦截正常请求
 */
router.use((req,res,next) => {
    next(boom.notFound('接口不存在'))
})

/**
 * 自定义路由异常处理中间件,可以接收到路由中的error并返回前端错误信息
 * 注：
 * 1.方法参数不能少
 * 2.方法必须放到路由最后
 */
router.use((err,req,res,next) => {
    console.log(err)
    if(err.name && err.name === 'UnauthorizedError'){
        const {status = 401,message} = err
        new Result(null,'Token验证失败',{
            error:status,
            errMsg:message
        }).jwtError(res.status(status))
    }else{
        const msg = (err && err.message) || '系统错误'
        const statusCode = (err.output && err.output.statusCode) || 500
        const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.massage

        new Result(null,msg,{
            error:statusCode,
            errorMsg
        }).fail(res.status(statusCode))
    } 
})

module.exports = router