const express = require('express')
const multer = require('multer')
const Result = require('../models/Result')
const {UPLOAD_PATH} = require('../utils/constant')
const Book = require('../models/Book')
const boom = require('boom')
const { request } = require('express')
const router = express.Router()
const { decode } = require('../utils')
const bookService = require('../services/book')

//将上传的epub文件经multer放到UPLOAD_PATH下的book文件夹
//然后将生成的文件连接挂载到req的file下
router.post(
    '/upload',
    multer({dest:`${UPLOAD_PATH}/book`}).single('file'),
    function(req,res,next){
        if(!req.file || req.file.length === 0){
            new Result('上传电子书失败').fail(res)
        }else{
            const book = new Book(req.file)
            book.parse().then(book => {
                // console.log('book ',book)
                new Result(book,'上传电子书成功').success(res)
            }).catch(err => {
                next(boom.badImplementation(err))
            })
        }
})

router.post('/create',function(req,res,next){
    //decoded验证token,返回加密时添加的对象属性{username,iat,exp}
    const decoded = decode(req)
    if(decoded && decoded.username){
        req.body.username = decoded.username
    }
    // console.log('username ',decoded.username)
    const book = new Book(null,req.body)
    // console.log(book)
    bookService.insertBook(book).then(() => {
        new Result('添加电子书成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

//获取图书信息
router.get('/get',function(req,res,next){
    const { fileName } = req.query
    if(!fileName){
        next(boom.badRequest(new Error('参数fileName不能为空')))
    }else{
        bookService.getBook(fileName).then(book => {
            new Result(book,'获取图书信息成功').success(res)
        }).catch(err => {
            next(book.badImplementation(err))
        })
    }
})

router.post('/update',function(req,res,next){
    //decoded验证token,返回加密时添加的对象属性{username,iat,exp}
    const decoded = decode(req)
    if(decoded && decoded.username){
        req.body.username = decoded.username
    }
    // console.log('username ',decoded.username)
    const book = new Book(null,req.body)
    // console.log(book)
    bookService.updateBook(book).then(() => {
        new Result('更新电子书成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

router.get('/category',function(req,res,next){
    bookService.getCategory().then(category => {
        new Result(category,'获取分类成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

router.get('/list',function(req,res,next){
    bookService.listBook(req.query)
        .then(({ list, count, page, pageSize }) => {
            new Result({ list, count, page: +page, pageSize: +pageSize },'获取图书列表成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
    })
})

router.get('/delete',function(req,res,next){
    const { fileName } = req.query
    if(!fileName){
        next(boom.badRequest(new Error('参数fileName不能为空')))
    }else{
        bookService.deleteBook(fileName).then(() => {
            new Result('删除图书信息成功').success(res)
        }).catch(err => {
            next(book.badImplementation(err))
        })
    }
})

module.exports = router