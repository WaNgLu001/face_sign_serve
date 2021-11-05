var express = require("express");
var router = express.Router();
const multer = require("multer");
var axios = require("axios");
var upload = multer({ dest: "uploads/" });
var { FormData } = require("formdata-node");
const request = require("request");
var fs = require("fs");
const { log } = require("console");
const { getData } = require("../utils/api");
var {
  setUserFaceToken,
  deleteUserFaceToken,
  findSignTime,
  findUserName,
  signIn,
  savaSignTime,
  getSignTime,
} = require("../utils/sql");
const api_key = "raS9hGQ--dXshlZqTDxUwTi6hxp8jTn7";
const faceset_token = "d718165bbb95376c25c1b0156e901d62";
const api_secret = "foqkTfjXAlx6jf9XELPD4hSsHyuLfeG7";
//人脸识别
var obj = {
  api_key: "raS9hGQ--dXshlZqTDxUwTi6hxp8jTn7",
  api_secret: "foqkTfjXAlx6jf9XELPD4hSsHyuLfeG7",
};
router.post("/checkface", async function (req, res) {
  var obj1 = {
    api_key: api_key,
    api_secret: api_secret,
  };
  let type = req.body.type;
  obj1.image_base64 = req.body.image_base64;
  obj1.faceset_token = faceset_token
  const { data } = await getData(obj1, "/search");
  if (data?.faces?.length === 0) {
    res.status(200).json({ status: 0, msg: "照片中未识别到人脸" });
  } else if (data?.results?.length > 0 && data.results[0].confidence > 80) {
    let username = data.results[0].user_id.split("|")[0];
    let useruid = data.results[0].user_id.split("|")[1];
    const data1 = await findSignTime(useruid);

    if (!data1[0]) {
      res.status(200).json({
        status: 4,
        msg: "您的信息还未上传至数据库！",
      });
      return;
    }
    const signInTime = data1[0].signIn;
    // 根据uid查询用户姓名
    // const data2 = await findUserName(useruid);
    // const name = data2[0].NAME;
    if (type == 1) {
      //签到
      // 如果重复签到直接返回
      if (signInTime !== "-1") {
        return res.status(200).json({
          status: "2",
          msg: "请勿重复签到",
        });
      }
      const data3 = await signIn(useruid, Date.now());
      if (data3)
        return res.status(200).json({
          status: "0",
          msg: `${username}同学,签到成功`,
        });
    } else if (type == 2) {
      // 签退，如果没有签到直接签退，返回错误
      if (signInTime === "-1") {
        res.status(200).json({
          status: "3",
          msg: `${username}同学,请先签到`,
        });
        return;
      }
      let sign_time_long = ((Date.now() - signInTime) / 60000 / 60).toFixed(2); // 小时
      const weekArr = ["sun", "mon", "tues", "wed", "thur", "fri", "sat"];
      let week = weekArr[new Date().getDay()];
      let longtime = await getSignTime(week, useruid);
      longtime = parseFloat(longtime[0][week]);
      sign_time_long = parseFloat(sign_time_long);
      sign_time_long = (longtime + sign_time_long).toFixed(2);
      const data4 = await savaSignTime(sign_time_long, week, useruid);
      if (data4)
        return res.status(200).json({
          status: "0",
          msg: `${username}同学,签退成功,今日签到${sign_time_long} h`,
        });
    }
  } else if (data?.results?.length > 0 && data.results[0].confidence < 80) {
    res.status(200).json({ status: 2, msg: "未识别成功，请重新尝试" });
  }
});
//添加人脸
router.post("/addface", async function (req, res) {
  let obj1 = {
    api_key: api_key,
    api_secret: api_secret,
  };
  const { image_base64, uid, name, className } = req.body;
  obj1.image_base64 = image_base64;
  //人脸检测获取token
  const { data } = await getData(obj1, "/detect");
  if (data?.faces?.length === 0) {
    res.status(200).json({ status: 0, msg: "照片中未识别到人脸" });
  } else {
    let face_token = data.faces[0].face_token;
    let obj2 = {
      api_key: api_key,
    api_secret: api_secret,
    };
    obj2.faceset_token = faceset_token;
    obj2.face_tokens = face_token;

    const { data: res1 } = await getData(obj2, "/faceset/addface");
    if (res1.face_added >= 1) {
      let obj3 = {
        api_key: api_key,
        api_secret: api_secret,
      };
      obj3.user_id = name + "|" + uid;
      obj3.face_token = face_token;
      let result = await setUserFaceToken(uid, name, className, face_token);
      if (result) {
        const res2 = await getData(obj3, "/face/setuserid");
        if (res2.status === 200) {
          res.status(200).json({
            status: res2.status,
            res: res2.data,
            msg: name + "添加成功",
          });
        } else {
          res.status(200).json({ status: 0, msg: "添加人脸失败" });
        }
      } else {
        res.status(200).json({ status: 0, msg: "人脸已存在" });
      }
    } else {
      res.status(200).json({ status: 0, msg: "添加人脸失败" });
    }
  }
});
//删除人脸
// router.post("/deleteface", async function (req, res) {
//   obj.faceset_token = "d718165bbb95376c25c1b0156e901d62";
//   obj.face_tokens = req.body.face;
//   // let result = await deleteUserFaceToken(req.body.face);

//   // if (result.affectedRows > 0) {
//     const result = await getData(obj, "/faceset/removeface");
//     res.status(200).json({ status: 1, msg: result.data });
//   // } else {
//   //   res.status(200).json({ status: 0, msg: "删除失败" });
//   // }
// });
module.exports = router;
