const Book = require('../models/Book')
const db = require('../db')
const _ = require('lodash')
const { reject } = require('lodash')

//检测图书是否存在
function exists(book){
    const { title,author,publisher } = book
    const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
    return db.queryOne(sql)   
}

//删除图书
async function removeBook(book){
    if(book){
        //删除图书
        book.reset()

        //删除数据库中的记录
        if(book.fileName){
            const removeBookSql = `delete from book where fileName='${book.fileName}'`
            const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
            await db.querySql(removeBookSql)
            await db.querySql(removeContentsSql)
        }
    }
}

//插入目录
async function insertContents(book){
    const contents = book.getContents()
    // console.log('contents',contents)
    if(contents && contents.length > 0){
        for(let i = 0; i < contents.length; i++){
            const content = contents[i]
            const _content = _.pick(content,[
                'fileName',
                'id',
                'href',
                'order',
                'level',
                'text',
                'label',
                'pid',
                'navId'
            ])
            // console.log('_content ',_content)
            await db.insert(_content,'contents')
        }
    }
}

//插入图书信息
function insertBook(book){
    return new Promise(async (resolve,reject) => {
        try{
            //检测上传的书籍对象是否合法
            if(book instanceof Book){
                //判断上传的图书是否已经存在
                const result = await exists(book)
                if(result){
                    //存在则删除上传的图书
                    await removeBook(book)
                    reject(new Error('电子书已存在'))
                }else{
                    //把书籍信息插入数据库
                    await db.insert(book.toDb(),'book')
                    //把书籍目录信息插入数据库
                    await insertContents(book)
                    resolve()
                }
            }else{
                reject(new Error('添加的图书对象不合法'))
            }
        }catch(e){
            reject(e)
        }
    })
}

//更新图书信息
function updateBook(book){
    return new Promise(async (resolve,reject) => {
        try{
            //判断对象是否合法
            if(book instanceof Book){
                //在数据库中查找有无这个图书信息
                const result = await getBook(book.fileName)
                if(result){
                    //去除数据库不用的属性
                    const model = book.toDb()
                    //判断是否为内置图书,自己存入的updateType为1
                    if(+result.updateType === 0){
                        reject(new Error('内置图书不能编辑'))
                    }else{
                        //更新
                        await db.update(model,'book',`where fileName='${book.fileName}'`)
                        resolve()
                    }
                }

            }else{
                reject(new Error('添加的图书对象不合法'))
            }
        }catch(err){
            reject(err)
        }
    })
}

//获取图书信息
function getBook(fileName){
    return new Promise(async (resolve,reject) => {
        const bookSql = `select * from book where fileName='${fileName}' `
        const contentsSql = `select * from contents where fileName='${fileName}' order by \`order\``
        const book = await db.queryOne(bookSql)
        const contents = await db.querySql(contentsSql)
        if(book){
            book.cover = Book.getCoverUrl(book)
            book.contentsTree = Book.genContentsTree(contents)
            resolve(book)
        }else{
            reject(new Error('电子书不存在'))
        }
        
    })
}

//获取分类
async function getCategory(){
    const sql = `select * from category order by category asc`
    const result = await db.querySql(sql)
    const categoryList = []
    result.forEach(item => {
        categoryList.push({
            label:item.categoryText,
            value:item.category,
            num:item.num
        })
    })
    return categoryList
}

//分页获取
async function listBook(query){
    // console.log(query)
    const {
        category,
        author,
        title,
        sort,
        page = 1,//页码
        pageSize = 20,//每页数量
    } = query
    //从第几条开始返回
    const offset = (page - 1) * pageSize
    let bookSql = `select * from book`
    let where = `where`

    title && (where = db.andLike(where,'title',title))
    author && (where = db.andLike(where,'author',author))
    //当有传分类时执行语句添加查询条件
    category && (where = db.and(where,'categoryText',category))

    if(where !== 'where'){
        bookSql = `${bookSql} ${where}`
    }

    //排序需放在分页之前,sort值为 +id 或 -id
    if(sort){
        const symbol = sort[0]
        const column = sort.slice(1,sort.length)
        const order = symbol === '+' ? 'asc' : 'desc'
        bookSql = `${bookSql} order by \`${column}\` ${order}`
    }

    //统计图书数量，方便前端分页
    let countSql = `select count(*) as count from book`
    if(where !== 'where'){
        countSql = `${countSql} ${where}`
    }
    //查询语句返回一个数组, count = [RowDataPacket { count:xxx }]
    const count = await db.querySql(countSql)

    //分页语句
    bookSql = `${bookSql} limit ${pageSize} offset ${offset}`
    const list = await db.querySql(bookSql)
    
    //
    list.forEach(book => book.cover = Book.getCoverUrl(book))

    return { list, count:count[0].count, page, pageSize }
}

//删除
function deleteBook(fileName){
    return new Promise(async (resolve,reject) => {
        let book = await getBook(fileName)
        if(book){
            if(+book.updateType === 0){
                reject(new Error('内置电子书不能删除'))
            }else{
                const bookObj = new Book(null,book)
                // const sql = `delete from book where fileName='${fileName}'`
                // db.querySql(sql).then(() => {
                //     //删除图书文件
                //     bookObj.reset()
                //     resolve()
                // })
                await removeBook(bookObj)
                resolve()
            }
        }else{
            reject(new Error('电子书不存在'))
        }
    })
}

module.exports = {
    insertBook,
    updateBook,
    listBook,
    deleteBook,
    getCategory,
    getBook
}