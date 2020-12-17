<template>
    <div class="upload-container">
        <!-- action为上传地址，headers为请求头，multiple为false限制多文件上传，limit=1每次上传一个文件 -->
        <!-- before-upload为上传文件前执行的函数,on-error为上传失败，on-remove为删除上传资源 -->
        <!-- 当上传limit数个文件后再上传会触发on-exceed,drag拖拽上传 -->
        <!-- show-file-list显示已上传文件,accept限制上传时选择地文件类型 -->
        <el-upload
            :action="action"
            :headers="headers"
            :multiple="false"
            :limit="1"
            :before-upload="beforeUpload"
            :on-success="onSuccess"
            :on-error="onError"
            :on-remove="onRemove"
            :file-list="fileList"
            :on-exceed="onExceed"
            :disabled="disabled"
            drag
            show-file-list
            accept="application/epub+zip"
            class="image-upload"
        >
        <i class="el-icon-upload"></i>
        <div v-if="fileList.length === 0" class="el-upload__text">
            请将电子书拖入或<em>点击上传</em>
        </div>
        <div v-else class="el-upload__text">图书已上传</div>
        </el-upload>
    </div>
</template>

<script>
import { getToken } from '../../utils/auth'
export default {
    props: {
        fileList: {
            type:Array,
            default() {
                return []
            }
        },
        disabled: {
            type:Boolean,
            default:false
        }
    },
    data() {
        return {
            action:`${process.env.VUE_APP_BASE_API}/book/upload`
        }
    },
    computed: {
        headers(){// 请求头
            return {
                Authorization:`Bearer ${getToken()}`,
            }
        }
    },
    methods: {
        beforeUpload(file){// 上传文件前执行函数
            console.log(file)
            this.$emit('beforeUpload',file)
        },

        onSuccess(response,file){
            console.log(response,file)
            const {msg,code,data} = response
            if(code === 0){
                this.$message({
                    message:msg,
                    type:'success'
                })
                this.$emit('onSuccess',data)
            }else{
                this.$message({
                    message:(msg && `上传失败，失败原因:${msg}`) || '上传失败',
                    type:'error'
                })
                this.$emit('onError',file)
            }
        },

        onError(err){
            console.log({err})
            const errMsg = err.message && JSON.parse(err.message)
            this.$message({
                message:(errMsg && errMsg.msg && `上传失败，失败原因：${errMsg.msg}`) || '上传失败',
                type:'error'
            })
            this.$emit('onError',err)
        },

        onRemove(){
            this.$message({
                message:'电子书删除成功',
                type:'success'
            })
            this.$emit('onRemove')
        },

        onExceed(){
            this.$message({
                message:'每次只能上传一本电子书',
                type:'warning'
            })
        }
    },
}
</script>