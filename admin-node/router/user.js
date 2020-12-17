const express = require('express')
const router = express.Router()
const Result = require('../models/Result')
const {login,findUser} = require('../services/user')
const { PWD_SALT, PRIVATE_KEY,JWT_EXPIRED } = require('../utils/constant')
const {md5,decode} = require('../utils/index')
//类型校验
const {body,validationResult} = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')

router.post('/login',
    [   //校验username、password必须为string，否则触发withMessage报错
        body('username').isString().withMessage('用户名必须为字符'),
        body('password').isString().withMessage('密码必须为字符')
    ],

    function(req,res,next){
        const err = validationResult(req)
        //判断err中的errors是否为空，为空则校验没有错误
        if(!err.isEmpty()){
            //解构拿到错误信息,errors为数组
            const [{msg}] = err.errors
            //badRequest为参数错误，传给后面的自定义路由捕获错误
            next(boom.badRequest(msg))
        }else{
            let {username,password} = req.body
            //对密码进行加密
            password = md5(`${password}${PWD_SALT}`)

            login(username,password).then(user => {
                if(!user || user.length === 0){
                    new Result('登录失败').fail(res)
                }else{
                    //制作token
                    const token = jwt.sign(
                        {username},
                        PRIVATE_KEY,
                        {expiresIn:JWT_EXPIRED}
                    )

                    new Result({token},'登录成功').success(res)
                }
            })
        }
    }
)

router.get('/info',function(req,res){
    //解析token
    const decoded = decode(req)
    if(decoded && decoded.username){
        findUser(decoded.username).then(user => {
            if(user){
                //把角色替换为角色列表
                user.roles = [user.role]
                new Result(user,'获取用户信息成功').success(res)
            }else{
                new Result('获取用户信息失败').fail(res)
            }
        })
    }else{
        new Result('用户信息解析失败').fail(res)
    }
})

module.exports = router