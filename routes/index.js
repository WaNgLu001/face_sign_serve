var express = require('express')
var router = express.Router()
var qs = require('querystring')
var axios = require('axios')
const schedule = require('node-schedule')
const xlsx = require('node-xlsx').default
const {
  signIn,
  findUserName,
  findSignTime,
  savaSignTime,
  reset_week,
  reset_day,
  getSignTime,
  setFaceInfo,
  getClassInfo
} = require('../utils/sql')
let access_token = {
  token: '',
  timer: ''
}
// 读取xlsx文件中的信息
async function test() {
  var sheets = xlsx.parse(`${__dirname}\\test.xlsx`)
  let FaceInfo = sheets[0].data
  FaceInfo.shift()
  setFaceInfo(FaceInfo)
  return FaceInfo
}
// test()
// 获取access_token 的函数
async function getToken() {
  const param = qs.stringify({
    grant_type: 'client_credentials',
    client_id: '592d7sIQhsnTjMMzyn9vsLlF',
    client_secret: 'hW3BWAhkFrGPrvF1ffrXN6VrQIwjwSsB'
  })
  const data = await axios.get(
    'https://aip.baidubce.com//oauth/2.0/token?' + param
  )
  return data
}
// 发起人脸对比
async function faceSearch(imgBase) {
  const data = {
    image: imgBase,
    image_type: 'BASE64',
    group_id_list: 'RJB_face,test'
    // liveness_control: 'NORMAL' // 活体检测
  }
  const result = await axios.post(
    `https://aip.baidubce.com/rest/2.0/face/v3/search?access_token=${access_token.token}`,
    data
  )
  return result
}

router.get('/', function (req, res) {
  res.json({})
})
// 判断当前用户ip是否有效
router.get('/get_ip', function (req, res, next) {
  res.status(200).json({
    ip: req.ip.split(':')[3] === '59.48.111.138'
  })
})

// 人脸搜索
router.post('/search', async function (req, res) {
  let {
    type,
    imgBase
  } = req.body // 1 签到 2签退
  imgBase = imgBase.split(',')[1]
  const {
    data
  } = await faceSearch(imgBase)
  if (!data.resule) {
    res.status(200).json({
      status: '5',
      msg: '人脸库匹配失败,请将照片上传至人脸库中重试！'
    })
    return
  }
  if (data.result.user_list[0].score - 70 < 0) {
    res.status(200).json({
      status: 3,
      msg: '人脸库匹配失败,请将照片上传至人脸库中重试！'
    })
    return
  }
  // 拿到uid之后，修改数据库
  const uid = data.result.user_list[0].user_id
  // 根据uid查询签到时长
  const data1 = await findSignTime(uid)
  if (!data1[0]) {
    res.status(200).json({
      status: 4,
      msg: '您的信息还未上传至数据库！'
    })
    return
  }
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
        msg: '请勿重复签到'
      })
    }
    const data3 = await signIn(uid, Date.now())
    if (data3)
      return res.status(200).json({
        status: '0',
        msg: `${name}同学,签到成功`
      })
  } else {
    // 签退，如果没有签到直接签退，返回错误
    if (signInTime === '-1') {
      res.status(200).json({
        status: '3',
        msg: `${name}同学,请先签到`
      })
      return
    }
    let sign_time_long = ((Date.now() - signInTime) / 60000 / 60).toFixed(2) // 小时
    const weekArr = ['sun', 'mon', 'tues', 'wed', 'thur', 'fri', 'sat']
    let week = weekArr[new Date().getDay()]
    let longtime = await getSignTime(week, uid)
    longtime = parseFloat(longtime[0][week])
    sign_time_long = parseFloat(sign_time_long)
    console.log(sign_time_long, longtime)
    sign_time_long = (longtime + sign_time_long).toFixed(2)
    const data4 = await savaSignTime(sign_time_long, week, uid)
    if (data4)
      return res.status(200).json({
        status: '0',
        msg: `${name}同学,签退成功,今日签到${sign_time_long} h`
      })
    console.log(data4)
  }
})

// 查询每个教室
router.get('/getClass', async function (req, res) {
  const {
    type
  } = req.query
  const data = await getClassInfo(type)
  res.status(200).json({
    data
  })
})
// 定时任务
function scheduleTime() {
  // 每周重置数据库
  schedule.scheduleJob({
      hour: 23,
      minute: 50,
      dayOfWeek: '7'
    },
    function () {
      reset_week()
      InitToken()
      console.log('每周定时任务执行完毕', Date.now())
    }
  )
  // 每天检测数据库
  var rule = new schedule.RecurrenceRule()
  rule.hour = 23
  rule.minute = 50
  schedule.scheduleJob(rule, function () {
    reset_day()
    console.log('每天定时任务执行完毕', Date.now())
  })
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
InitToken()
module.exports = router