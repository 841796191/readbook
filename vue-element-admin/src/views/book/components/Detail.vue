<template>
    <el-form ref="postForm" :model="postForm" :rules="rules">
        <!-- class-name是因为sticky组件绑定了className这个props,接收了class-name后会把class绑定到组件内的div上 -->
        <sticky :class-name="'sub-navbar'">
            <el-button v-if="!isEdit" @click="showGuide">显示帮助</el-button>
            <el-button v-loading="loading" type="success" @click="submitForm" style="margin-left:10px">
                {{isEdit ? '编辑电子书'  : '新增电子书'}}
            </el-button>
        </sticky>

        <div class="detail-container">
            <el-row>
                <warning />
                <el-col :span="24">
                    <!-- 上传控件的具体样式 -->
                    <ebook-upload 
                        :file-list="fileList" 
                        :disabled="isEdit" 
                        @onSuccess="onUploadSuccess" 
                        @onRemove="onUploadRemove"
                    />
                </el-col>

                <el-col :span="24">
                    <el-form-item prop="title">
                        <MdInput 
                            v-model="postForm.title" 
                            :maxlength="100" 
                            name="name" 
                            required
                        >
                        书名
                        </MdInput>
                    </el-form-item>

                    <el-row>
                        <el-col :span="12">
                            <el-form-item prop="author" label="作者：" :label-width="labelWidth">
                                <el-input v-model="postForm.author"
                                placeholder="作者"/>
                            </el-form-item>
                        </el-col>
                        
                        <el-col :span="12">
                            <el-form-item prop="publisher" label="出版社：" :label-width="labelWidth">
                                <el-input v-model="postForm.publisher"
                                placeholder="出版社"/>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col :span="12">
                            <el-form-item prop="language" label="语言：" :label-width="labelWidth">
                                <el-input v-model="postForm.language"
                                placeholder="语言"/>
                            </el-form-item>
                        </el-col>
                        
                        <el-col :span="12">
                            <el-form-item prop="rootFile" label="根文件：" :label-width="labelWidth">
                                <el-input v-model="postForm.rootFile"
                                placeholder="根文件" disabled/>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col :span="12">
                            <el-form-item prop="filePath" label="文件路径：" :label-width="labelWidth">
                                <el-input v-model="postForm.filePath"
                                placeholder="文件路径" disabled/>
                            </el-form-item>
                        </el-col>
                        
                        <el-col :span="12">
                            <el-form-item prop="unzipPath" label="解压路径：" :label-width="labelWidth">
                                <el-input v-model="postForm.unzipPath"
                                placeholder="解压路径" disabled/>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col :span="12">
                            <el-form-item prop="coverPath" label="封面路径：" :label-width="labelWidth">
                                <el-input v-model="postForm.coverPath"
                                placeholder="封面路径" disabled/>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item prop="originalName" label="文件名称：" :label-width="labelWidth">
                                <el-input v-model="postForm.originalName" placeholder="文件名称" disabled />
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col :span="24">
                            <el-form-item prop="cover" label="封面：" :label-width="labelWidth">
                                <a v-if="postForm.cover" :href="postForm.cover" target="_blank">
                                    <img :src="postForm.cover" class="preview-img">
                                </a>
                                <span v-else>无</span>
                            </el-form-item>
                        </el-col>
                    </el-row>

                    <el-row>
                        <el-col :span="24">
                            <el-form-item label="目录：" :label-width="labelWidth">
                                <div v-if="contentsTree && contentsTree.length > 0" class="contents-wrapper">
                                    <el-tree :data = "contentsTree" @node-click="onContentClick"></el-tree>
                                </div>
                                <span v-else>无</span>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-col>
            </el-row>
        </div>
    </el-form>
</template>

<script>
/* eslint-disable */
import Sticky from '../../../components/Sticky'
import MdInput from '../../../components/MDinput'
import Warning from './Warning'
import EbookUpload from '../../../components/EbookUpload'
import { createBook, getBook, updateBook } from '../../../api/book'
/* eslint-disable */
const defaultForm = {
    title:'',
    author:'',
    publisher:'',
    language:'',
    cover:'',
    url:'',
    originalName:'',
    fileName:'',
    coverPath:'',
    filePath:'',
    unzipPath:'',
    rootFile:''
}

const fields = {
    title: '书名',
    author: '作者',
    publisher: '出版社',
    language: '语言'
}
/* eslint-disable */
export default {
    props:{
        isEdit: Boolean
    },

    data(){
        // 校验规则
        const validateRequire = (rule,value,callback) => {
            if(value.length === 0){
                callback(new Error(fields[rule.field] + '必须填写'))
            }else{
                callback()
            }
        }
        return {
            loading:false,
            postForm:{//电子书信息
            },
            fileList:[],
            labelWidth:'120px',
            contentsTree:[],//目录
            rules:{
                title:[{ validator: validateRequire }],
                author:[{ validator: validateRequire }],
                publisher:[{ validator: validateRequire }],
                language:[{ validator: validateRequire }]
            }
        }
    },

    created() {
        if(this.isEdit){
            const fileName = this.$route.params.fileName
            this.getBookData(fileName)
        }
    },

    components:{
        Sticky,// 吸顶效果组件
        Warning,
        EbookUpload,
        MdInput
    },
    methods: {
        //获取图书信息
        getBookData(fileName){
            getBook(fileName).then(response => {
                this.setData(response.data)
            })
        },

        //点击目录
        onContentClick(data){
            // console.log(data)
            if(data.text){
                window.open(data.text)
            }
        },
        //设置电子书信息
        setData(data){
            const {
                title,
                author,
                publisher,
                language,
                cover,
                url,
                originalName,
                contents,
                contentsTree,
                fileName,
                coverPath,
                filePath,
                unzipPath,
                rootFile
            } = data
            this.postForm = {
                ...this.postForm,
                title,
                author,
                publisher,
                language,
                cover,
                url,
                originalName,
                contents,
                contentsTree,
                fileName,
                coverPath,
                filePath,
                unzipPath,
                rootFile
            }
            this.contentsTree = contentsTree
            //在编辑页面通过设置fileList中的name就可以让之前上传的文件名显示，url为下载链接
            this.fileList = [ { name:originalName || fileName, url } ]
        },
        //清除电子书信息
        setDefault(){
            // this.postForm = Object.assign({},defaultForm)
            this.contentsTree = []
            //上传电子书后显示的文件列表，这里点击新增电子书后移除文件列表
            this.fileList = []
            //使用element提供的重置表单及校验规则函数，只重置设置了prop属性的表单
            this.$refs.postForm.resetFields()
        },
        //提交电子书信息到数据库
        submitForm() {
            const onSuccess = (response) => {
                const { msg } = response
                this.$notify({
                    title:'操作成功',
                    message:msg,
                    type:'success',
                    duratioin:2000
                })
                this.loading = false
            }

            if(!this.loading){
                this.loading = true
                this.$refs.postForm.validate((valid,fields) => {
                    // console.log(valid,fields)
                    if(valid) {
                        const book = Object.assign({},this.postForm)
                        delete book.contentsTree

                        if(!this.isEdit) {
                            //创建图书
                            createBook(book).then(response => {
                                // console.log(response)
                                onSuccess(response)
                                this.setDefault()
                            }).catch(() => {
                                this.loading = false
                            })
                        } else {
                            //编辑图书
                            updateBook(book).then(response => {
                                // console.log(response)
                                onSuccess(response)
                            }).catch(() => {
                                this.loading = false
                            })
                        }
                    } else {
                        const message = fields[ Object.keys(fields)[0] ][0].message
                        this.$message({
                            message,
                            type:'error'
                        })

                        this.loading = false
                    }
                })
            }
        },

        showGuide(){
            console.log('帮助')
        },

        onUploadSuccess(data){
            console.log('uploadsuccess',data)
            this.setData(data)
        },

        onUploadRemove(){
            console.log('uploadremove')
            this.setDefault()
        }
    },
}
</script>

<style lang="scss">
    .detail-container{
        padding: 50px 40px 40px;
        .preview-img{
            width: 200px;
            height: 270px;
        }
    }
</style>