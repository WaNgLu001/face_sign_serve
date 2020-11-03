const mysql = require("mysql"); // 连接数据库
const {sendEmail} = require("./email");
const conntection = mysql.createConnection({
  host: "119.3.254.20",
  user: "root",
  password: "123456",
  database: "face_sign",
});
conntection.connect();
// 执行sql语句基本命令函数
const sqlFun = function (sql) {
  return new Promise(function (resolve, reject) {
    conntection.query(sql, function (error, result) {
      if (error) reject(error);
      resolve(result);
    });
  });
};
// 测试
const test = () => {
  return sqlFun(`SELECT * FROM sign_week WHERE uid ="wl"`);
};

// 根据uid保存用户签到时间
const signIn = (uid, date) => {
  return sqlFun(`UPDATE sign_week SET signIn = "${date}" WHERE uid="${uid}"; `);
};
// 根据uid查询用户姓名
const findUserName = (uid) => {
  return sqlFun(`SELECT NAME FROM sign_week WHERE uid = "${uid}";`);
};
// 根据查询用户签到时长
const findSignTime = (uid) => {
  return sqlFun(`SELECT signIn FROM sign_week WHERE uid = '${uid}'`);
};
// 根据签到时长和当前日期保存到数据库
const savaSignTime = (sign_time_long, day, uid) => {
  // 签到时长修改到数据库，并将签到时间重置
  return new Promise(function (reslove, reject) {
    sqlFun(
      `UPDATE sign_week SET ${day} = "${sign_time_long}" WHERE uid="${uid}";`
    ).then(function (res) {
      sqlFun(`UPDATE sign_week SET signIn = '-1' WHERE uid = '${uid}'`).then(
        function (data) {
          reslove(data);
        },
        function (error) {
          reject(error);
        }
      );
    });
  });
  // 重置签到时间
};

// 每周重置数据库
const reset_week = async () => {
  // 先将所有数据查询出来，然后保存到另一张表中
  const data1 = await sqlFun(`SELECT * FROM sign_week where uid !='admin'`);
  data1.forEach((el) => {
    sqlFun(
      `INSERT INTO total_count (uid,username,WEEK,class,mon,tues,wed,thur,fri,sat,sun) VALUES ('${el.uid}','${el.name}','${el.WEEK}','${el.class}','${el.mon}','${el.tues}','${el.wed}','${el.thur}','${el.fri}','${el.sat}','${el.sun}')`
    );
  });
  // 需要将当前周数+1
  const data = await sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
  const week = parseInt(data[0].WEEK) + 1;
  sqlFun(
    `UPDATE sign_week SET signIn = '-1', mon = 0 , tues = 0 , wed = 0 , thur = 0 , fri = 0 , sat = 0 , sun = 0, WEEK ='${week}' `
  );
  sendEmail("周");
};

// 每天更新数据库
const reset_day = async () => {
  //  已签到，未签退，当日时长自动为1，并且将签到时间重置为-1
  const weekArr = ["sun", "mon", "tues", "wed", "thur", "fri", "sat"];
  let week = weekArr[new Date().getDay()];
  const data = await sqlFun(`SELECT * FROM sign_week`);
  data.forEach((element) => {
    const { signIn, uid } = element;
    if (signIn !== "-1") {
      sqlFun(
        `UPDATE sign_week SET signIn='-1',${week}='1' WHERE uid = '${uid}'`
      );
    }
  });
  sendEmail("日");
};
// 根据周数查询当日已签到时长
const getSignTime = async (week, uid) => {
  return sqlFun(`SELECT ${week} FROM sign_week WHERE uid = '${uid}'`);
};

// 将数据上传至数据库
const setFaceInfo = async (face_info) => {
  const data = await sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
  let week = data[0].WEEK;
  let count = 0;
  face_info.forEach(async (el) => {
    count++;
    sqlFun(
      `INSERT INTO sign_week (uid,NAME,WEEK,class) VALUES ('${el[1]}','${el[0]}','${week}','${el[2]}')`
    );
  });
  return count;
};

// 查询人脸签到用户
const findAllUser = () => {
  return sqlFun(`SELECT * FROM sign_week WHERE class !='admin'`);
};
// 查询所有用户的签到时长
const findAllUserTimer = () => {
  return sqlFun(`SELECT * FROM total_count WHERE class !='admin'`);
};
// 修改当前周
const setWeek = (week) => {
  return sqlFun(`UPDATE sign_week SET WEEK = '${week}' `);
};
// 查看当前周
const getweek = () => {
  return sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
};
// 根据uid删除一个或多个用户
const deleteUser = (uids) => {
  console.log(uids);
  sqlFun(`DELETE FROM sign_week WHERE uid IN (${uids})`);
  sqlFun(`DELETE FROM total_count WHERE uid IN (${uids})`);
};



// 查询每个教室
const getClassInfo = () => {
  return sqlFun(
    `SELECT class,NAME,mon,tues,wed,thur,fri,sat,sun FROM sign_week WHERE class !='admin'`
  );
};
module.exports = {
  getweek,
  test,
  signIn,
  findUserName,
  findSignTime,
  savaSignTime,
  sqlFun,
  reset_week,
  reset_day,
  getSignTime,
  setFaceInfo,
  getClassInfo,
  findAllUser,
  findAllUserTimer,
  setWeek,
  deleteUser,
};
//
