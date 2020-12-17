const mysql = require('mysql')
const config = require('./config')
const debug = require('../utils/constant')
const { isObject } = require('../utils')
const { reject } = require('lodash')

//连接数据库
function connect(){
    return mysql.createConnection({
        host:config.host,
        user:config.user,
        password:config.password,
        database:config.database,
        multipleStatements:true//允许每条mysql语句有多条查询，容易引起sql注入
    })
}

//查询用户
function querySql(sql){
    //连接
    const conn = connect()
    // debug && console.log(sql)
    return new Promise((resolve,reject) => {
        try{
            conn.query(sql,(err,result) => {
                if(err){
                    debug && console.log('查询失败，原因:' + JSON.stringify(err))
                    reject(err)
                }else{
                    // debug && console.log('查询成功 ',JSON.stringify(result))
                    resolve(result)
                }
            })
        }catch(e){
            reject(e)
        }finally{
            //查询结束需释放连接，不然会占用连接
            conn.end()
        }
    })
}

//查询用户个人信息
function queryOne(sql){
    return new Promise((resolve,reject) => {
        querySql(sql).then(result => {
            if(result && result.length > 0){
                resolve(result[0])
            }else{
                resolve(null)
            }
        }).catch(error => {
            reject(error)
        })
    })
}

//插入电子书信息
function insert(model,tableName){
    return new Promise((resolve,reject) => {
        if(!isObject(model)){
            reject(new Error('插入数据库失败，插入书籍非对象'))
        }else{
            const keys = []
            const values = []
            Object.keys(model).forEach(key => {
                //判断是否是model自身的key
                if(model.hasOwnProperty(key)){
                    keys.push(`\`${key}\``)
                    values.push(`'${model[key]}'`)
                }
            })

            if(keys.length > 0 && values.length > 0){
                //拼接sql语句
                let sql = `INSERT INTO \`${tableName}\` (`
                const keysString = keys.join(',')
                const valuesString = values.join(',')
                sql = `${sql}${keysString}) VALUES (${valuesString})`
                // debug && console.log(sql)
                //插入数据库
                const conn = connect()
                try{
                    conn.query(sql,(err,result) => {
                        if(err){
                            reject(err)
                        }else{
                            resolve(result)
                        }
                    })
                }catch(e){
                    reject(e)
                }finally{
                    conn.end()
                }
            }else{
                reject(new Error('插入数据库失败，对象中没有任何属性'))
            }
        }
    })
}

//更新信息
function update(model,tableName,where){
    return new Promise((resolve,reject) => {
        if(!isObject(model)){
            reject(new Error('插入数据库失败，插入数据非对象'))
        }else{
            const entry = []
            Object.keys(model).forEach(key => {
                entry.push(`\`${key}\`='${model[key]}'`)
            })

            if(entry.length > 0){
                let sql = `UPDATE \`${tableName}\` SET`
                sql = `${sql} ${entry.join(',')} ${where}`
                const conn = connect()
                try{
                    conn.query(sql,(err,result) => {
                        if(err){
                            reject(err)
                        }else{
                            resolve(result)
                        }
                    })
                }catch(e){
                    reject(e)
                }finally{
                    conn.end()
                }
            }
        }
    })
}

function and(where,key,value){
    //当where等于'where'时则只有一个查询条件,否则有多个查询条件，条件中间要加and
    if(where === 'where'){
        return `${where} \`${key}\`='${value}'`
    }else{
        return `${where} and \`${key}\`='${value}'`
    }
}

function andLike(where,key,value){
    if(where === 'where'){
        return `${where} \`${key}\` like '%${value}%'`
    }else{
        return `${where} and \`${key}\` like '%${value}%'`
    }
}

module.exports = {
    querySql,
    queryOne,
    update,
    insert,
    and,
    andLike
}