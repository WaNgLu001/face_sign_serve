var express = require('express')
var router = express.Router()
var qs = require('querystring')
var axios = require('axios')
const schedule = require('node-schedule');
const {
  signIn,
  findUserName,
  findSignTime,
  savaSignTime,
  reset_week,
  reset_day

} = require('../utils/sql')
let access_token = {
  token: '',
  timer: ''
}

async function test3() {

  const uid = 'wl'
  const data = await findSignTime(uid)
  if (data[0].signIn === '-1')
    return
  const sign_time_long = ((Date.now() - signIn) / 60000 / 60).toFixed(2) // 小时
  console.log(sign_time_long)
  const weekArr = ['mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun']
  const week = weekArr[new Date().getDay() - 1]
  console.log(week)
  savaSignTime(sign_time_long, week, uid).then(function (data2) {
    console.log(data2)
  })

}

// test3()
// test2().then(function (result) {
//   console.log(result)
// })

// 获取access_token 的函数
async function getToken() {
  const param = qs.stringify({
    grant_type: 'client_credentials',
    client_id: '592d7sIQhsnTjMMzyn9vsLlF',
    client_secret: 'hW3BWAhkFrGPrvF1ffrXN6VrQIwjwSsB'
  })
  const data = await axios.get('https://aip.baidubce.com//oauth/2.0/token?' + param)
  return data

}
// 发起人脸对比
async function faceSearch(imgBase) {
  const data = {
    image: imgBase,
    image_type: 'BASE64',
    group_id_list: 'test',
    // liveness_control: 'NORMAL' // 活体检测
  }
  const result = await axios.post(
    `https://aip.baidubce.com/rest/2.0/face/v3/search?access_token=${access_token.token}`,
    data
  )
  return result
}

// 判断当前用户ip是否有效
router.get('/get_ip', function (req, res, next) {
  res.status(200).json({
    ip: req.ip.split(':')[2] === '59.48.111.138'
  })
})

// 人脸搜索
router.post('/search', async function (req, res) {
  const {
    type,
    imgBase
  } = req.body // 1 签到 2签退
  imgBase = imgBase.split(',')[1]
  const {
    data
  } = await faceSearch(imgBase)
  // 拿到uid之后，修改数据库
  const uid = data.result.user_list[0].user_id
  // 根据uid查询签到时长
  const data1 = await findSignTime(uid)
  const signInTime = data1[0].signIn
  // 根据uid查询用户姓名
  const data2 = await findUserName(uid)
  const name = data2[0].NAME
  // 签到
  if (type === '1') {
    // 如果重复签到直接返回
    if (signInTime !== '-1') {
      return res.status(200).json({
        status: '2',
        msg: "请勿重复签到"
      })
    }
    const data3 = await signIn(uid, Date.now())
    if (data3) return res.status(200).json({
      status: '0',
      msg: `${name}同学,签到成功`
    })
  } else {
    // 签退，如果没有签到直接签退，返回错误
    if (signInTime === '-1') return res.status(200).json({
      status: '3',
      msg: `${name}同学,请先签到`
    })
    const sign_time_long = ((Date.now() - signInTime) / 60000 / 60).toFixed(2) // 小时
    const weekArr = ['mon', 'tues', 'wed', 'thur', 'fri', 'sat', 'sun']
    const week = weekArr[new Date().getDay() - 1]
    console.log(sign_time_long)
    const data4 = await savaSignTime(sign_time_long, week, uid)
    if (data4) return res.status(200).json({
      status: 0,
      msg: `${name}同学,签退成功,今日签到${sign_time_long} h`
    })
    console.log(data4)

  }
})

// 定时任务
function scheduleTime() {
  // 每周重置数据库
  schedule.scheduleJob({
    hour: 23,
    minute: 59,
    dayOfWeek: '7'
  }, function () {
    reset_week()
    InitToken()
  });
  // 每天检测数据库
  var rule = new schedule.RecurrenceRule();
  rule.hour = 24
  rule.minute = 00
  schedule.scheduleJob(rule, function () {
    reset_day()
  });
}
scheduleTime()
// 获取token
function InitToken() {
  getToken().then(function (res1) {
    access_token.token = res1.data.access_token
    access_token.timer = Date.now()
    console.log(access_token)
  })
}
// InitToken()
module.exports = router