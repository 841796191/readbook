<template>
    <div class="app-container">
        <div class="filter-container">
            <!-- clearable为输入框后面的清除UI -->
            <el-input 
                v-model="listQuery.title"
                placeholder="书名"
                style="width:200px"
                class="filter-item"
                clearable
                @keyup.enter.native="handleFilter"
                @clear="handleFilter"
                @blur="handleFilter"
            />

            <el-input 
                v-model="listQuery.author"
                placeholder="作者"
                style="width:200px"
                class="filter-item"
                clearable
                @keyup.enter.native="handleFilter"
                @clear="handleFilter"
                @blur="handleFilter"
            />

            <el-select
                v-model="listQuery.category"
                placeholder="分类"
                clearable
                class="filter-item"
                @change="handleFilter"
                @clear="handleFilter"
            >
                <el-option
                    v-for="item in categoryList"
                    :key="item.value"
                    :label="item.label + '(' + item.num + ')'"
                    :value="item.label"
                />
            </el-select>
            <el-button
                v-waves
                class="filter-item"
                type="primary"
                icon="el-icon-search"
                style="margin-left:10px"
                @click="handleFilter"
            >
                查询
            </el-button>

            <el-button
               class="filter-item"
               type="primary"
               icon="el-icon-edit"
               style="margin-left:10px"
               @click="handleCreate" 
            >
                新增
            </el-button>

            <el-checkbox
                v-model="showCover"
                class="filter-item"
                style="margin-left:5px"
                @change="changeShowCover"
            >
                显示封面
            </el-checkbox>
        </div>

        <!-- fit自适应,v-loading加载动画,highlight-current-row当前行高亮,sort-change排序 -->
        <el-table 
            :key="tableKey"
            :data="list"
            v-loading="listLoading"
            border
            fit
            highlight-current-row
            style="width:100%"
            :default-sort="defaultSort"
            @sort-change="sortChange"
        >
            <!-- prop对应上面标签中的list中的属性,即数据库中的字段 -->
            <el-table-column 
               label="ID"
               prop="id"
               sortable="custom"
               align="center" 
               width="80"
            />

            <el-table-column
                label="书名"
                width="150"
                align="center"
            >
                <template slot-scope="{ row: { titleWrapper } }">
                    <span v-html="titleWrapper" />
                </template>
            </el-table-column>

            <el-table-column
                label="作者"
                width="150"
                align="center"
            >
                <template slot-scope="{ row: { authorWrapper } }">
                    <span v-html="authorWrapper" /> 
                </template>
            </el-table-column>

            <el-table-column
                label="出版社"
                prop="publisher"
                width="150"
                align="center"
            />

            <el-table-column
                label="分类"
                prop="categoryText"
                width="150"
                align="center"
            />

            <el-table-column
                label="语言"
                prop="language"
                align="center"
            />

            <el-table-column
                v-if="showCover"
                label="封面"
                width="150"
                align="center"
            >
                <template slot-scope="scope">
                    <a :href="scope.row.cover" target="_blank">
                        <img :src="scope.row.cover" style="width:120px;height:180px;">
                    </a>
                </template>
            </el-table-column>

            <el-table-column
                label="文件名"
                prop="fileName"
                width="100"
                align="center"
            />

            <el-table-column
                label="文件路径"
                prop="filePath"
                width="100"
                align="center"
            >
                <template slot-scope="{ row: { filePath } }">
                    <span>{{ filePath | valueFilter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="封面路径"
                prop="coverPath"
                width="100"
                align="center"
            >
                <template slot-scope="{ row: { coverPath } }">
                    <span>{{ coverPath | valueFilter }}</span>
                </template>
            </el-table-column>            

            <el-table-column
                label="解压路径"
                prop="unzipPath"
                width="100"
                align="center"
            >
                <template slot-scope="{ row: { unzipPath } }">
                    <span>{{ unzipPath | valueFilter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="上传人"
                prop="createUser"
                width="100"
                align="center"
            >
                <template slot-scope="{ row: { createUser } }">
                    <span>{{ createUser | valueFilter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="上传时间"
                prop="createDt"
                width="100"
                align="center"
            >
                <template slot-scope="{ row: { createDt } }">
                    <span>{{ createDt | timeFilter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="操作"
                width="120"
                align="center"
                fixed="right"
            >
                <template slot-scope="{ row }">
                    <el-button type="text" icon="el-icon-edit" @click="handleUpdate(row)" />
                
                    <el-button type="text" icon="el-icon-delete" style="color:#f56c6c" @click="handleDelete(row)" />
                </template>
            </el-table-column>
        </el-table>

        <pagination 
            v-show="total > 0" 
            :total="total"
            :page.sync="listQuery.page"
            :limit.sync="listQuery.pageSize"
            @pagination="refresh" 
        />
    </div>
</template>

<script>
// 分页组件
import Pagination from '../../components/Pagination'
import waves from '../../directive/waves/waves'
import { getCategory, listBook, deleteBook } from '../../api/book'
import { parseTime } from '../../utils'
/* eslint-disable */
export default {
    components: { Pagination },
    directives:{ waves },
    filters:{
        valueFilter(value){
            return value || '无'
        },

        timeFilter(time){
            return time ? parseTime(time, '{y}-{m}-{d} {h}:{i}') : '无'
        }
    },

    data() {
        return {
            tableKey: 0,
            listLoading: true,
            listQuery: {},
            showCover: false,
            categoryList: [],
            list: [],
            total: 0, // 统计数目
            defaultSort: {}
        }
    },
    
    created() {
        //页面初始化时整合参数
        this.parseQuery()
    },

    mounted() {
        //页面挂载后请求数据
        this.getList()
        this.getCategoryList()
    },

    beforeRouteUpdate(to,from,next){
        if(to.path === from.path){
            const newQuery = Object.assign({}, to.query)
            const oldQuery = Object.assign({}, from.query)
            //选择每页信息条数时若参数不同则发起请求
            if(JSON.stringify(newQuery) !== JSON.stringify(oldQuery)){
                this.getList()
            }
        }
        next()
    },

    methods: {
        //搜索关键字高亮
        wrapperKeyword(key,value){
            function highlight(value) {
                return `<span style="color:#1890ff">${value}</span>`
            }
            //关键字不存在直接返回
            if(!this.listQuery[key]) {
                return value
            } else {
                return value.replace(new RegExp(this.listQuery[key],'ig'),v => highlight(v))
            }

        },

        // 获取图书列表
        getList(){
            this.listLoading = true
            listBook(this.listQuery).then(response => {
                const { list, count } = response.data
                this.list = list
                this.total = count
                this.listLoading = false

                this.list.forEach(book => {
                    book.titleWrapper = this.wrapperKeyword('title',book.title)
                    book.authorWrapper = this.wrapperKeyword('author',book.author)
                })
            })
        },
        //整合参数
        parseQuery(){
            const query = Object.assign({}, this.$route.query)
            let sort = '+id'
            //默认参数
            const listQuery = {
                page: 1,
                pageSize: 20,
                sort
            }

            if(query){
                //将page和pageSize转为number类型
                query.page && (query.page = +query.page)
                query.pageSize && (query.pageSize = +query.pageSize)
                query.sort && (sort = query.sort)
            }
            const sortSymbol = sort[0]
            const sortColumn = sort.slice(1, sort.length)
            this.defaultSort = {
                prop: sortColumn,
                order: sortSymbol === '+' ? 'ascending' : 'descending'
            }
            //如果路由有传参数则query覆盖listQuery中的相同属性
            this.listQuery = { ...listQuery, ...query }
        },

        // 排序
        sortChange(data){
            console.log('sortChange ',data)
            const { prop, order } = data
            this.sortBy(prop,order)
        },

        sortBy(prop,order){
            if(order === 'ascending'){
                this.listQuery.sort = `+${prop}`
            } else {
                this.listQuery.sort = `-${prop}`
            }
            this.handleFilter()
        },

        //通过关键字搜索时直接重新进入list页，重新请求数据
        refresh(){
            this.$router.push({
                path: '/book/list',
                query: this.listQuery
            })
        },

        handleFilter() {
            console.log( 'handleFilter', this.listQuery )
            // this.getList()
            this.listQuery.page = 1
            this.refresh()
        },

        // 新增
        handleCreate(){
            this.$router.push('/book/create')
        },

        //删除
        handleDelete(row){
            this.$confirm('此操作将永久删除该电子书，是否继续', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                deleteBook(row.fileName).then(response => {
                    this.$notify({
                        title: '成功',
                        message: response.msg || '删除成功',
                        type: 'success',
                        duration: 2000
                    })
                    this.handleFilter()
                })
            })
        },

        //控制封面显示
        changeShowCover(value){
            this.showCover = value
        },

        handleUpdate(row){
            console.log('handleUpdate ',row)
            this.$router.push(`/book/edit/${row.fileName}`)
        },

        //获取封面列表
        getCategoryList(){
            getCategory().then(response => {
                this.categoryList = response.data
            })
        },
    },
}
</script>

<style lang="scss">
    
</style>