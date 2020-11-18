var express = require("express");
var router = express.Router();
var qs = require("querystring");
var axios = require("axios");
const schedule = require("node-schedule");
const xlsx = require("node-xlsx").default;
const {
  signIn,
  findUserName,
  findSignTime,
  savaSignTime,
  reset_week,
  reset_day,
  getSignTime,
  setFaceInfo,
  getClassInfo,
  findAllUser,
  findAllUserTimer,
  setWeek,
  getweek,
  deleteUser,
  deleteWeeks,
  deleteAllWeeks,
} = require("../utils/sql");
const multer = require("multer");
var fs = require("fs");
var upload = multer({ dest: "uploads/" });
const {
  QRfindAllUser,
  QRsetFaceInfo,
  QRdeleteUser,
  QRsetWeek,
  QRreset_day,
  QRreset_week,
  QRgetweek,
  QRfindAllUserTimer,
  QRdeleteWeeks,
  QRdeleteAllWeeks
} = require("../utils/qrcode");
let access_token = {
  token: "",
  timer: "",
};
const { sendBase } = require("../utils/email");
/**
 * 批量上传人脸文件命名为 ： face_sign_user
 * 批量上传扫码文件命名为 ： qrcode_sign_user
 */
router.post("/profile", upload.any(), function (req, res) {
  if (
    req.files[0].originalname === "face_sign_user.xls" ||
    req.files[0].originalname === "face_sign_user.xlsx" ||
    req.files[0].originalname === "qrcode_sign_user.xlsx" ||
    req.files[0].originalname === "qrcode_sign_user.xls"
  ) {
    var des_file = "./routes/uploads/" + req.files[0].originalname;
    fs.readFile(req.files[0].path, function (err, data) { 
      fs.writeFile(des_file, data, function (err) { 
        if (err) {
          res.status(200).json({ status: 1, msg: "文件上传失败" });
        } else {
          const name = req.files[0].originalname.split(".")[0];
		  console.log(name)
          if (name === "face_sign_user") {
            BatchUpload(req.files[0].originalname.split(".")[1]);
          } else {
            QRBatchUpload(req.files[0].originalname.split(".")[1]);
          }
          res.status(200).json({ status: 0, msg: "文件上传成功" });
        }
      });
    });
  } else {
    res.status(200).json({ status: 1, msg: "文件上传失败,请按照要求正确上传" });
  }
});

// 读取xlsx文件中的信息 -- 扫码
async function QRBatchUpload(file) {
  var sheets = xlsx.parse(`${__dirname}\\uploads/qrcode_sign_user.${file}`);
  let FaceInfo = sheets[0].data;
  FaceInfo.shift();
  QRsetFaceInfo(FaceInfo);
}

// 读取xlsx文件中的信息 --- 人脸
async function BatchUpload(file) {
  var sheets = xlsx.parse(`${__dirname}\\uploads/face_sign_user.${file}`);
  let FaceInfo = sheets[0].data;
  FaceInfo.shift();
  setFaceInfo(FaceInfo);
}
// 获取access_token 的函数
async function getToken() {
  const param = qs.stringify({
    grant_type: "client_credentials",
    client_id: "592d7sIQhsnTjMMzyn9vsLlF",
    client_secret: "hW3BWAhkFrGPrvF1ffrXN6VrQIwjwSsB",
  });
  const data = await axios.get(
    "https://aip.baidubce.com//oauth/2.0/token?" + param
  );
  return data;
}
// 发起人脸对比
async function faceSearch(imgBase) {
  const data = {
    image: imgBase,
    image_type: "BASE64",
    group_id_list: "RJB_face,test",
    // liveness_control: 'NORMAL' // 活体检测
  };
  const result = await axios.post(
    `https://aip.baidubce.com/rest/2.0/face/v3/search?access_token=${access_token.token}`,
    data
  );
  return result;
}

router.get("/", function (req, res) {
  res.json({});
});
// 判断当前用户ip是否有效
router.get("/get_ip", function (req, res, next) {
  res.status(200).json({
    ip: req.ip.split(":")[3] === "59.48.111.138",
  });
});

// 人脸搜索
router.post("/search", async function (req, res) {
  let { type, imgBase } = req.body; // 1 签到 2签退
  imgBase = imgBase.split(",")[1];
  const { data } = await faceSearch(imgBase);
  if (!data.result) {
    res.status(200).json({
      status: "5",
      msg: "未在人脸库中匹配到人脸,请将照片上传至人脸库中重试！",
    });
    return;
  }
  if (data.result.user_list[0].score - 70 < 0) {
    res.status(200).json({
      status: 3,
      msg: "人脸库匹配失败,请将照片上传至人脸库中重试！",
    });
    return;
  }
  // 拿到uid之后，修改数据库
  const uid = data.result.user_list[0].user_id;
  // 根据uid查询签到时长
  const data1 = await findSignTime(uid);
  if (!data1[0]) {
    res.status(200).json({
      status: 4,
      msg: "您的信息还未上传至数据库！",
    });
    return;
  }
  const signInTime = data1[0].signIn;
  // 根据uid查询用户姓名
  const data2 = await findUserName(uid);
  const name = data2[0].NAME;
  // 签到
  if (type === "1") {
    // 如果重复签到直接返回
    if (signInTime !== "-1") {
      return res.status(200).json({
        status: "2",
        msg: "请勿重复签到",
      });
    }
    const data3 = await signIn(uid, Date.now());
    if (data3)
      return res.status(200).json({
        status: "0",
        msg: `${name}同学,签到成功`,
      });
  } else {
    // 签退，如果没有签到直接签退，返回错误
    if (signInTime === "-1") {
      res.status(200).json({
        status: "3",
        msg: `${name}同学,请先签到`,
      });
      return;
    }
    let sign_time_long = ((Date.now() - signInTime) / 60000 / 60).toFixed(2); // 小时
    const weekArr = ["sun", "mon", "tues", "wed", "thur", "fri", "sat"];
    let week = weekArr[new Date().getDay()];
    let longtime = await getSignTime(week, uid);
    longtime = parseFloat(longtime[0][week]);
    sign_time_long = parseFloat(sign_time_long);
    sign_time_long = (longtime + sign_time_long).toFixed(2);
    const data4 = await savaSignTime(sign_time_long, week, uid);
    if (data4)
      return res.status(200).json({
        status: "0",
        msg: `${name}同学,签退成功,今日签到${sign_time_long} h`,
      });
  }
});

// 查询每个教室
router.get("/getClass", async function (req, res) {
  const { type } = req.query;
  const data = await getClassInfo(type);
  res.status(200).json({
    data,
  });
});

/**
 * 以下接口为人脸签到和扫码签到公用接口
 * type为1表示人脸签到 ，type为2 表示扫码签到
 */

// 查询签到的所有用户
router.get("/getAllUser", async function (req, res) {
  const { type } = req.query;
  let data;
  if (type === "1") {
    data = await findAllUser();
  } else {
    data = await QRfindAllUser();
  }
  res.status(200).json({
    data,
  });
});

// 增加单个用户
router.post("/addOneUser", function (req, res) {
  const { type } = req.body;
  const { uid, name, classname } = req.body;
  const arr = [name, uid, classname];
  if (type === "1") {
    setFaceInfo([arr]);
  } else {
    QRsetFaceInfo([arr]);
  }
  res.status(200).json({ status: 0, msg: "用户添加成功" });
});
// 根据uid删除用户
router.get("/deleteUser", function (req, res) {
  const { uids, type } = req.query;
  if (type === "1") {
    deleteUser(uids);
  } else {
    QRdeleteUser(uids);
  }
  res.status(200).json({ status: 0, msg: "删除成功" });
});
//根据week删除周签到数据
router.get("/deleteWeeks",async (req,res) => {
  const {week,type} = req.query
  let data;
  if (type === "1") {//人脸
    data = await deleteWeeks(week);
  } else {
     data = await QRdeleteWeeks(week);
  }
  if(data.affectedRows === 0){
    res.status(200).json({ status: 1, msg: "删除失败" });
  }else{
    res.status(200).json({ status: 0, msg: "删除成功" });
  }
})

router.get("/deleteAllWeeks",async (req,res) => {
  const {type} = req.query
  let data;
  if (type === "1") {//人脸
    data = await deleteAllWeeks();
  } else {
     data = await QRdeleteAllWeeks();
  }
  if(data.affectedRows === 0){
    res.status(200).json({ status: 1, msg: "删除失败" });
  }else{
    res.status(200).json({ status: 0, msg: "删除成功" });
  }
})


// 根据上传的xls文件批量添加用户
// 修改当前周数
router.get("/setWeek", async function (req, res) {
  const { week, type } = req.query;
  console.log(type, type === "1");
  let data;
  if (type === "1") {
    data = await setWeek(week);
  } else {
    data = await QRsetWeek(week);
  }
  if (data.affectedRows !== 0) {
    res.status(200).json({ status: 0, msg: "修改成功" });
  } else {
    res.status(200).json({ status: 1, msg: "修改失败" });
  }
});
// 查询所有用户的所有签到时长
router.get("/getAllUserTimer", async function (req, res) {
  const { type } = req.query;
  let data;
  if (type === "1") {
    data = await findAllUserTimer();
  } else {
    data = await QRfindAllUserTimer();
  }
  res.status(200).json({
    data,
  });
});
// 查看当前周
router.get("/getWeek", async function (req, res) {
  const { type } = req.query;
  let data;
  if (type === "1") {
    data = await getweek();
  } else {
    data = await QRgetweek();
  }
  res.status(200).json({ status: 0, week: data[0].WEEK });
});

// app查看当前周
router.get("/getfaceClass", async function (req, res) {
  const data = await getClassInfo();
  res.status(200).json({ data });
});
// 定时任务
function scheduleTime() {
  // 每周重置数据库
  schedule.scheduleJob(
    {
      hour: 23,
      minute: 52,
      dayOfWeek: "0",
    },
    function () {
      reset_week();
      QRreset_week();
      InitToken();
    }
  );
  // 每天检测数据库
  var rule = new schedule.RecurrenceRule();
  rule.hour = 23;
  rule.minute = 50;
  schedule.scheduleJob(rule, function () {
    reset_day();
    QRreset_day();
  });
}
scheduleTime();
// 获取token
function InitToken() {
  getToken().then(function (res1) {
    access_token.token = res1.data.access_token;
    access_token.timer = Date.now();
  });
}
InitToken();
module.exports = router;
