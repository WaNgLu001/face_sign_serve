var express = require("express");
var router = express.Router();
const {
  QRfindSignTime,
  QRsignIn,
  QRgetSignTime,
  QRsavaSignTime,
  QRgetAllUid_mac,
  QRaddUser,
} = require("../utils/qrcode");

// 根据uid进行签到  学号
/**
 *  首先判断用户是否已经签到，如已经签到提示不能重复签到
 *
 */
router.get("/QRSign", async function (req, res) {
  const { uid } = req.query;
  const data = await QRfindSignTime(uid);
  console.log(uid,data);
  if (data.length === 0) {
    res.status(200).json({ status: 3, msg: "学号不存在" });
    return;
  }
  if (data[0].signIn !== "-1") {
    res.status(200).json({ status: 1, msg: "请勿重复签到" });
  } else {
    const data1 = await QRsignIn(uid, Date.now());
    if (data1.affectedRows !== "0") {
      res.status(200).json({ status: 0, msg: "签到成功" });
    }
  }
});

// 签退根据uid进行签退
router.get("/QRSignOut", async function (req, res) {
  const { uid } = req.query;
  const data = await QRfindSignTime(uid);
  if (data.length === 0) {
    res.status(200).json({ status: 3, msg: "学号不存在" });
    return;
  }
  if (data[0].signIn === "-1") {
    res.status(200).json({
      status: "3",
      msg: `同学,请先签到`,
    });
    return;
  }
  let sign_time_long = ((Date.now() - data[0].signIn) / 60000 / 60).toFixed(2); // 小时
  const weekArr = ["sun", "mon", "tues", "wed", "thur", "fri", "sat"];
  let week = weekArr[new Date().getDay()];
  let longtime = await QRgetSignTime(week, uid);
  longtime = parseFloat(longtime[0][week]);
  sign_time_long = parseFloat(sign_time_long);
  sign_time_long = (longtime + sign_time_long).toFixed(2);
  const data4 = await QRsavaSignTime(sign_time_long, week, uid);
  if (data4.affectedRows !== "0") {
    res
      .status(200)
      .json({ status: 0, msg: `签退成功,今日累计签到时长${sign_time_long}` });
  }
});

// 用户自行注册
router.post("/addQRuser", async function (req, res) {
  const { uid, classname, name, mac } = req.body;
  const uids = await QRgetAllUid_mac();
  let flag = 0;
  // 判断用户信息唯一性
  uids.some((element) => {
    if (element.uid === uid) {
      flag = 1;
      res.status(200).json({
        status: 1,
        msg: "此学号已经注册,不可重复注册，如有问题请联系管理员",
      });
      return true;
    } else if (element.mac === mac) {
      flag = 1;
      res.status(200).json({
        status: 1,
        msg: "此设备已经注册,不可重复注册，如有问题请联系管理员",
      });
      return true;
    }
  });
  if (flag === 0) {
    const data1 = await QRaddUser(uid, classname, name, mac);
    if (data1.affectedRows !== "0") {
      res.status(200).json({ status: 0, msg: "注册成功！" });
    }
  }
});
module.exports = router;
