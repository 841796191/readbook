const {env} = require('./env')
const UPLOAD_PATH = env === 'dev' ? '../../../../../upload/upload/admin-upload-ebook' : '../../../../../upload/upload/admin-upload-ebook'

const OLD_UPLOAD_URL = env === 'dev' ? 'http://localhost:8089/upload/admin-upload-ebook' : 'http://localhost:8089/upload/admin-upload-ebook'

const UPLOAD_URL = env === 'dev' ? 'http://localhost:8089/upload/admin-upload-ebook' : 'http://localhost:8089/upload/admin-upload-ebook'

module.exports = {
    CODE_ERROR:-1,
    CODE_SUCCESS:0,
    CODE_TOKEN_EXPIRED:-2,
    debug:true,
    PWD_SALT:'admin_imooc_node',//md5加密添加的字段
    PRIVATE_KEY:'admin_imooc_node_test_youbaobao_xyz',
    JWT_EXPIRED:60*60,//token失效时间
    UPLOAD_PATH,//上传路径
    MIME_TYPE_EPUB:'application/epub+zip',//书籍文件格式
    UPLOAD_URL,//静态文件访问路径  
    OLD_UPLOAD_URL 
}