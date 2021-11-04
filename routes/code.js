var express = require("express");
const {
  QRfindSignTime,
  QRsignIn,
  QRgetSignTime,
  QRsavaSignTime,
  QRgetAllUid_mac,
  QRaddUser,
  QRremoveMac,
  getMac,
  resetMac,
  QRgetClassInfo,
} = require("../utils/qrcode");

// 根据uid进行签到  学号
/**
 *  首先判断用户是否已经签到，如已经签到提示不能重复签到
 */
router.get("/QRSign", async function (req, res) {
  const { uid } = req.query;
  const data = await QRfindSignTime(uid);
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
      status: 4,
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
      .json({ status: 0, msg: `今日累计签到时长${sign_time_long}` });
  }
});

// 用户自行注册
/**
 * type为1表示为用户自行注册
 * 需要判断学号是否注册，如果没有注册直接注册成功
 * 如果用户注册，判断学号与mac地址是否一致，如果mac地址为默认值则，表示用户要跟换设备。
 * 需判断此设备是否注册其他学号
 */
router.post("/addQRuser", async function (req, res) {
  const { uid, classname, name, mac, type } = req.body;
  const uids = await QRgetAllUid_mac();
  if (type === "1") {
    for (const element of uids) {
      if (element.uid === uid) {
        flag = 1;
        console.log(element.class !== classname || element.name !== name);
        if (element.class !== classname || element.name !== name) {
          res.status(200).json({
            status: 2,
            msg: "当前学号姓名班级与注册时信息不一致！",
          });
          return;
        }
        if (element.mac === mac) {
          res.status(200).json({
            status: 0,
            msg: "登录成功！",
          });
          return;
        } else if (element.mac === "暂无绑定设备") {
          // 用户绑定设备
          // 先判断当前mac是否已经被注册
          const data2 = await getMac(mac);
          if (data2.length !== 0) {
            res.status(200).json({ status: 3, msg: "此设备已绑定其他账号" });
            return;
          }
          const data = await resetMac(mac, uid);
          if (data.affectedRows !== 0) {
            res.status(200).json({ status: 0, msg: "设备绑定成功" });
            return;
          }
        } else {
          res.status(200).json({ status: 1, msg: "请使用绑定的设备进行登录" });
          return;
        }
      }
    }
    // 执行到这里说名这个学号没有被绑定,判断此设备是否绑定其他账号
    const data3 = await getMac(mac);
    if (data3.length !== 0) {
      res.status(200).json({ status: 3, msg: "此设备已绑定其他账号" });
      return;
    } else {
      const data1 = await QRaddUser(uid, classname, name, mac);
      if (data1.affectedRows === 1) {
        res.status(200).json({ status: 0, msg: "注册成功！" });
      }
    }
  } else {
    const data1 = await QRaddUser(uid, classname, name, mac);
    if (data1.affectedRows === 1) {
      res.status(200).json({ status: 0, msg: "注册成功！" });
    }
  }
});
// 解绑设备
router.get("/removeMac", async function (req, res) {
  const { uid } = req.query;
  const data = await QRremoveMac(uid);
  if (data.affectedRows !== "0") {
    res.status(200).json({ status: 0, msg: "设备解绑成功" });
    return;
  } else {
    res.status(200).json({ status: 1, msg: "服务端出错,请重试！" });
  }
});

// app查看当前周
router.get('/getQRClass',async function(req,res){
  const data = await QRgetClassInfo()
  res.status(200).json({data});
})
module.exports = router;
