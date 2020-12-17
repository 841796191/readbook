const crypto = require('crypto')
const { PRIVATE_KEY } = require('./constant')
const jwt = require('jsonwebtoken')

function isObject(o){
    return Object.prototype.toString.call(o) === '[object Object]'
}


//加密
function md5(s){
    //参数需为String类型，否则会出错
    return crypto.createHash('md5').update(String(s)).digest('hex')
}

function decode(req){
    const authorization = req.get('Authorization')
    let token = ''

    if(authorization.indexOf('Bearer') >= 0){
        //把token中添加的Bearer 替换掉
        token = authorization.replace('Bearer ','')
    }else{
        token = authorization
    }

    //解析token
    return jwt.verify(token,PRIVATE_KEY)
}

module.exports = {
    md5,
    decode,
    isObject
}