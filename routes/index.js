var express = require('express')
var router = express.Router()
var qs = require('querystring')
var axios = require('axios')
const schedule = require('node-schedule');
const {
  test: test2,
  signIn,
  findUserName,
  findSignTime,
  savaSignTime,
  reset

} = require('../utils/sql')
let access_token = {
  token: '24.8e737a1d9be04f155adcacd701b8fb46.2592000.1603524915.282335-22562954',
  timer: '1600932915770'
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

router.get('/', function (req, res, next) {
  // test()
  getToken().then(function (res1) {
    access_token.token = res1.data.access_token
    access_token.timer = Date.now()
    res.status(200).json(access_token)
  })
  // test3()
})

// 获取人脸base64之后，向人脸库中发起请求
router.post('/getBase', function (req, res) {
  let {
    imgBase
  } = req.body
  imgBase = imgBase.split(',')[1]
  // 判断access_token 是否失效，失效重新获取
  if (!access_token.timer || !access_token.token || (Date.now() - access_token.timer) / 60000 / 60 / 24 > 20) {
    // 重新获取access_token
    getToken().then(function (res1) {
      access_token.token = res1.data.access_token
      access_token.timer = Date.now()
      res.status(200).json(access_token)
      faceSearch(imgBase).then((result) => {
        console.log(result)
        res.status(200).json(result.data)
      }, (error) => {
        res.status(201).json(error)
      })
    })
  } else {
    faceSearch(imgBase).then((result) => {
      console.log(result)
      res.status(200).json(result.data)
    }, (error) => {
      res.status(201).json(error)
    })
  }
})
// 人脸搜索
router.get('/search', async function (req, res) {
  const {
    type
  } = req.query // 1 签到 2签退
  imgBase = `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`
  const {
    data
  } = await faceSearch(imgBase)

  // .then(async (result) => {
  // 拿到uid之后，修改数据库
  let uid = data.result.user_list[0].user_id
  uid = 'wl' //  一会删除
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

// 定时任务测试
function test() {
  console.log('定时任务开启')
  schedule.scheduleJob({
    hour: 17,
    minute: 02,
    dayOfWeek: '*'
  }, function () {
    reset()
    console.log('操作完成')
  });

  var rule = new schedule.RecurrenceRule();
  rule.hour = 18
  rule.second = 47
  schedule.scheduleJob(rule, function () {

    console.log('当前时间' + Date.now())

  });

}
// test()

module.exports = router