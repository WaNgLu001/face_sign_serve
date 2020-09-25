const mysql = require('mysql') // 连接数据库
const conntection = mysql.createConnection({
    host: '119.3.254.20',
    user: 'root',
    password: '123456',
    database: 'face_sign'
})
conntection.connect()
// 执行sql语句基本命令函数
const sqlFun = function (sql) {
    return new Promise(function (resolve, reject) {
        conntection.query(sql, function (error, result) {
            if (error) reject(error)
            resolve(result)
        })
    })
}
// 测试 
const test = () => {
    return sqlFun(`SELECT * FROM sign_week WHERE uid ="wl"`)
}

// 根据uid保存用户签到时间
const signIn = (uid, date) => {
    return sqlFun(`UPDATE sign_week SET signIn = "${date}" WHERE uid="${uid}"; `)
}
// 根据uid查询用户姓名
const findUserName = (uid) => {
    return sqlFun(`SELECT NAME FROM sign_week WHERE uid = "${uid}";`)
}
// 根据查询用户签到时长
const findSignTime = (uid) => {
    return sqlFun(`SELECT signIn FROM sign_week WHERE uid = '${uid}'`)
}
// 根据签到时长和当前日期保存到数据库
const savaSignTime = (sign_time_long, day, uid) => {
    // 签到时长修改到数据库，并将签到时间重置
    return new Promise(function (reslove, reject) {
        sqlFun(`UPDATE sign_week SET ${day} = "${sign_time_long}" WHERE uid="${uid}";`).then(function (res) {
            sqlFun(`UPDATE sign_week SET signIn = '-1' WHERE uid = '${uid}'`).then(function (data) {
                reslove(data)
            }, function (error) {
                reject(error)
            })
        })
    })
    // 重置签到时间
}

// 每周重置数据库
const reset = async () => {
    // 先将所有数据查询出来，然后保存到另一张表中
    // 需要将当前周数+1
    const data = await sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`)
    const week = data[0].WEEK + 1
    sqlFun(`UPDATE sign_week SET signIn = '-1', mon = 0 , tues = 0 , wed = 0 , thur = 0 , fri = 0 , sat = 0 , sun = 0, WEEK ='${week}' `)
}


module.exports = {
    test,
    signIn,
    findUserName,
    findSignTime,
    savaSignTime,
    sqlFun,
    reset
}
// 