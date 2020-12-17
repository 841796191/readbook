const {MIME_TYPE_EPUB,UPLOAD_URL, UPLOAD_PATH, OLD_UPLOAD_URL} = require('../utils/constant')
const fs = require('fs')
const path = require('path')
const Epub = require('../utils/epub')
const { resolve } = require('path')
const xml2js = require('xml2js').parseString

class Book{
    constructor(file,data){
        if(file){
            this.createBookFromFile(file)
        }else{
            this.createBookFromData(data)
        }
    }
    // file格式
    // {
    //     fieldname: 'file',
    //     originalname: '2016_Book_StemCellsInNeuroendocrinology.epub',
    //     encoding: '7bit',
    //     mimetype: 'application/epub+zip',
    //     destination: '../../../../../upload/upload/admin-upload-ebook/book',
    //     filename: 'a0f936fe804c29040aec3a57100db14a',
    //     path: '..\\..\\..\\..\\..\\upload\\upload\\admin-upload-ebook\\book\\a0f936fe804c29040aec3a57100db14a',
    //     size: 1388792
    // }

    createBookFromFile(file){
        // console.log('createBookFromFile',file)
        const {
            destination,//上传路径
            filename,//multer命名的文件名称
            mimetype=MIME_TYPE_EPUB,//上传文件格式
            path,//保存路径及文件名
            originalname//电子书原名
        } = file

        //文件后缀
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        //电子书原保存路径
        const oldBookPath = path
        //拼接文件保存路径及加文件后缀
        const bookPath = `${destination}/${filename}${suffix}`
        //拼接访问路径及加文件后缀
        const url = `${UPLOAD_URL}/book/${filename}${suffix}`
        //上传文件夹解压路径
        const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
        //解压文件夹访问路径
        const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`

        //通过fs.existsSync判断解压路径是否存在，如果不存在则创建该文件
        if(!fs.existsSync(unzipPath)){
            //recursive:true则无论父文件夹是否存在都创建
            fs.mkdirSync(unzipPath,{recursive:true})
        }
        //文件重命名，存在没添加后缀的电子书并且添加后缀的文件名不存在目标路径中则重命名
        if(fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)){
            fs.renameSync(oldBookPath,bookPath)
        }

        this.fileName = filename //文件名
        this.path = `/book/${filename}${suffix}`//相对路径
        this.filePath = this.path
        this.unzipPath = `/unzip/${filename}` //epub解压后相对路径
        this.url = url //epub文件下载访问路径
        this.title = '' //书名
        this.author = '' //作者
        this.publisher = '' //出版社
        this.contents = [] //目录
        this.cover = '' //封面图片URL
        this.coverPath = '' //封面图片相对路径
        this.category = -1 //分类ID
        this.categoryText = '' //分类名称
        this.language = '' //语种
        this.unzipUrl = unzipUrl // 解压后文件夹链接
        this.originalName = originalname //电子书原名
    }

    createBookFromData(data){
        this.fileName = data.fileName
        this.cover = data.coverPath
        this.title = data.title
        this.author = data.author
        this.publisher = data.publisher
        this.bookId = data.fileName
        this.language = data.language
        this.rootFile = data.rootFile
        this.originalName = data.originalName
        this.path = data.path || data.filePath
        this.filePath = data.path || data.filePath
        this.unzipPath = data.unzipPath
        this.coverPath = data.coverPath
        this.createUser = data.username
        this.createDt = new Date().getTime()
        this.updateDt = new Date().getTime()
        this.updateType = data.updateType === 0 ? data.updateType : 1
        this.category = data.category || 99
        this.categoryText = data.categoryText || '自定义'
        this.contents = data.contents || []
    }

    parse(){
        return new Promise((resolve,reject) => {
            const bookPath = `${UPLOAD_PATH}${this.filePath}`
            if(!fs.existsSync(bookPath)){
                reject(new Error('电子书不存在'))
            }
            //解析电子书
            const epub = new Epub(bookPath)
            //监听解析期间的异常
            epub.on('error',err => {
                reject(err)
            })

            epub.on('end',err => {
                if(err){
                    reject(err)
                }else{
                    // console.log('epub end',epub)
                    //取出电子书对应属性
                    const {
                        language,
                        creator,
                        creatorFileAs,
                        title,
                        cover,
                        publisher
                    } = epub.metadata

                    if(!title){
                        reject(new Error('图书标题为空'))
                    }else{
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'unknown'
                        this.publisher = publisher || 'unknown'
                        this.rootFile = epub.rootFile
                        //获取封面图片的回调函数
                        const handleGetImage = (err,file,mimeType) => {
                            if(err){
                                reject(err)
                            }else{
                                const suffix = mimeType.split('/')[1]
                                //封面图片保存地址和访问链接
                                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                                
                                //把封面图片写入指定地方
                                fs.writeFileSync(coverPath,file,'binary')

                                this.coverPath = `/img/${this.fileName}.${suffix}`
                                this.cover = coverUrl


                                resolve(this)
                            }
                        }

                        try {
                            //解压
                            this.unzip()
                            this.parseContents(epub).then(({chapters,chapterTree}) => {
                               //获取目录
                                this.contents = chapters
                                this.contentsTree = chapterTree
                                //获取封面图片
                                epub.getImage(cover,handleGetImage)
                            })
                        } catch (e) {
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
        })
    }

    //解压电子书到unzip文件夹
    unzip(){
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(Book.genPath(this.path))
        //true为覆盖相同的文件
        zip.extractAllTo(Book.genPath(this.unzipPath),true)
    }

    //获取目录
    parseContents(epub){
        //提取目录路径
        function getNcxFilePath(){
            //电子书目录在epub中的spine属性
            const spine = epub && epub.spine
            const manifest = epub && epub.manifest
            // console.log('spine ',epub.spine)
            //目录链接,
            const ncx = spine.toc && spine.toc.href
            //目录id
            const id = spine.toc && spine.toc.id
            // console.log('spine ',ncx,manifest[id].href)
            if(ncx){
                return ncx
            }else{
                //如果没有拿到目录则根据id去manifest中取
                return manifest[id].href
            }
        }

        //解析目录
        function findParent(array,level = 0,pid = ''){
            return array.map(item => {
                item.level = level
                item.pid = pid
                //解析嵌套目录
                if(item.navPoint && item.navPoint.length > 0){
                    item.navPoint = findParent(item.navPoint,level + 1,item['$'].id)
                }else if(item.navPoint){
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }

                return item
            })
        }

        //浅拷贝数组
        function flatten(array){
            return [].concat(...array.map(item => {
                if(item.navPoint && item.navPoint.length > 0){
                    //是数组
                    return [].concat(item,...flatten(item.navPoint))
                }else if(item.navPoint){
                    //是对象
                    return [].concat(item,item.navPoint)
                }
                return item
            }))
        }

        const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
        // console.log('ncxFilePath',ncxFilePath)
        if(fs.existsSync(ncxFilePath)){
            return new Promise((resolve,reject) => {
                //读取文件
                const xml = fs.readFileSync(ncxFilePath,'utf-8')
                //去掉ncxFilePath中的UPLOAD_PATH，方便后面拼接路径
                const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH,'')
                //dir ../../../../../upload/upload/admin-upload-ebook/unzip/b2c5abd528716f4689c04537f78660d5/OEBPS
                // console.log('dir ',dir)
                const fileName = this.fileName
                const unzipPath = this.unzipPath
                //把读取到的目录传入xml2js
                xml2js(xml,{
                    explicitArray:false,//以数组输出
                    ignoreAttrs:false//隐藏默认解析属性
                },function(err,json){
                    if(err){
                        reject(err)
                    }else{
                        // console.log('xml ',json)
                        //目录包含在navMap中
                        const navMap = json.ncx.navMap
                        if(navMap.navPoint && navMap.navPoint.length > 0){
                            //目录解析
                            navMap.navPoint = findParent(navMap.navPoint)
                            const newNavMap = flatten(navMap.navPoint)
                            const chapters = []//记录目录信息

                            //epub.flow中的目录信息不全
                            newNavMap.forEach((chapter,index) => {
                                //目录访问链接
                                const src = chapter.content['$'].src
                                // console.log('chapter ',chapter)

                                chapter.id = `${dir}/${src}`
                                chapter.href = `${dir}/${src}`.replace(unzipPath,'')
                                chapter.text = `${UPLOAD_URL}${dir}/${src}`
                                // console.log('chapter.text ',chapter.text)
                                chapter.label = chapter.navLabel.text || ''
                                chapter.navId = chapter['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                chapters.push(chapter)
                                // console.log('chapters ',chapters)
                            })

                            //将目录转为树状结构
                            const chapterTree = Book.genContentsTree(chapters)
                            
                            resolve({chapters,chapterTree})
                        }else{
                            reject(new Error('目录解析失败,目录数为0'))
                        }
                    }
                })
            })
        }else{
            throw new Error('目录文件不存在')
        }
    }

    //取出不用存入数据库的属性
    toDb(){
        return {
            fileName : this.fileName,
            cover : this.coverPath,
            title : this.title,
            author : this.author,
            publisher : this.publisher,
            bookId : this.fileName,
            language : this.language,
            rootFile : this.rootFile,
            originalName : this.originalName,
            filePath : this.filePath,
            unzipPath : this.unzipPath,
            coverPath : this.coverPath,
            createUser : this.username,
            createDt : this.createDt,
            updateDt : this.updateDt,
            updateType : this.updateType,
            category : this.category,
            categoryText : this.categoryText,  
        }
    }

    //取目录
    getContents(){
        return this.contents
    }

    //删除图书
    reset(){
        if(Book.pathExists(this.filePath)){
            // console.log('删除文件')
            fs.unlinkSync(Book.genPath(this.filePath))
        }

        if(Book.pathExists(this.cover)){
            // console.log('删除封面')
            fs.unlinkSync(Book.genPath(this.coverPath))
        }

        if(Book.pathExists(this.unzipPath)){
            // console.log('删除解压目录')
            // recursive 在node低版本中不支持，嵌套删除
            fs.rmdirSync(Book.genPath(this.unzipPath),{recursive:true})
        }
    }

    //生成路径
    static genPath(path){
        if(!path.startsWith('/')){
            path = `/${path}`
        }

        return `${UPLOAD_PATH}${path}`
    }

    //检查路径是否存在
    static pathExists(path){
        if(path.startsWith(UPLOAD_PATH)){
            return fs.existsSync(path)
        }else{
            return fs.existsSync(Book.genPath(path))
        }
    }

    //判断图片路径是导入的数据还是我们自己存的数据
    static getCoverUrl(book){
        const { cover } = book
        //通过updateType判断路径是导入的还是我们存入的,自己存入的updateType为1
        if(+book.updateType === 0){
            //导入的路径
            if(cover){
                if(cover.startsWith('/')){
                    return `${OLD_UPLOAD_URL}${cover}`
                }else{
                    return `${OLD_UPLOAD_URL}/${cover}`
                }
            } else {
                return null
            }
        }else{
            //自己存入的图片路径
            if(cover){
                if(cover.startsWith('/')){
                    return `${UPLOAD_URL}${cover}`
                }else{
                    return `${UPLOAD_URL}/${cover}`
                }
            } else {
                return null
            }
        }
    }

    ////将目录转为树状结构
    static genContentsTree(contents){
        if(contents){
            const contentsTree = []
            contents.forEach(c => {
                c.children = []
                if(c.pid === ''){
                    contentsTree.push(c)
                }else{
                    const parent = contents.find(_ => _.navId === c.pid)
                    parent.children.push(c)
                }
            })
            return contentsTree
        }
    }
}


module.exports = Book