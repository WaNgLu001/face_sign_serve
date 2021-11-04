const mysql = require("mysql"); // 连接数据库
const conntection = mysql.createConnection({
  host: "",
  user: "",
  port: "",
  password: "",
  database: ""
});
// 执行sql语句基本命令函数
const sqlFun = function (sql) {
  return new Promise(function (resolve, reject) {
    conntection.query(sql, function (error, result) {
      if (error) reject(error);
      resolve(result);
    });
  });
};
// 根据uid查询用户姓名
const QRfindUserName = (uid) => {
  return sqlFun(`SELECT NAME FROM sign_week WHERE uid = "${uid}";`);
};

// 查询签到用户
const QRfindAllUser = () => {
  return sqlFun(`SELECT * FROM sign_week WHERE class !='admin'`);
};
// 查询所有用户的签到时长
const QRfindAllUserTimer = () => {
  return sqlFun(`SELECT * FROM total_count WHERE class !='admin'`);
};
// 修改当前周
const QRsetWeek = (week) => {
  return sqlFun(`UPDATE sign_week SET WEEK = '${week}' `);
};
// 查看当前周
const QRgetweek = () => {
  return sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
};
// 根据uid删除一个或多个用户
const QRdeleteUser = (uids) => {
  sqlFun(`DELETE FROM sign_week WHERE uid IN (${uids})`);
  sqlFun(`DELETE FROM total_count WHERE uid IN (${uids})`);
};
//删除周
const QRdeleteWeeks = (week) => {
  console.log(week);
  return sqlFun(`DELETE FROM total_count WHERE week IN (${week});`);
};
//删除全部周
const QRdeleteAllWeeks = () => {
  return sqlFun(`DELETE FROM total_count ;`);
};

// 根据uid保存用户签到时间
const QRsignIn = (uid, date) => {
  return sqlFun(`UPDATE sign_week SET signIn = "${date}" WHERE uid="${uid}"; `);
};

// 将数据上传至数据库
const QRsetFaceInfo = async (face_info) => {
  const data = await sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
  let week = data[0].WEEK;
  let count = 0;
  face_info.forEach(async (el) => {
    count++;
    sqlFun(
      `INSERT INTO sign_week (uid,NAME,WEEK,class) VALUES ('${el[1]}','${el[0]}','${week}','${el[2]}')`
    );
  });
};
// 根据查询用户签到时长
const QRfindSignTime = (uid) => {
  return sqlFun(`SELECT signIn FROM sign_week WHERE uid = '${uid}'`);
};
// 根据周数查询当日已签到时长
const QRgetSignTime = async (week, uid) => {
  return sqlFun(`SELECT ${week} FROM sign_week WHERE uid = '${uid}'`);
};
// 根据签到时长和当前日期保存到数据库
const QRsavaSignTime = (sign_time_long, day, uid) => {
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

// 获取所有的uid
const QRgetAllUid_mac = () => {
  return sqlFun(
    `SELECT uid,mac,class,name FROM sign_week WHERE class !='admin'`
  );
};

// 新增用户
const QRaddUser = async (uid, classname, name, mac) => {
  const data = await sqlFun(`SELECT WEEK FROM sign_week LIMIT 1`);
  let week = data[0].WEEK;
  return sqlFun(
    `INSERT INTO sign_week (uid,NAME,WEEK,class,mac) VALUES ('${uid}','${name}','${week}','${classname}','${mac}')`
  );
};

// 每天重置数据库
// 每天更新数据库
const QRreset_day = async () => {
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
};
// 每周重置数据库
const QRreset_week = async () => {
  // 先将所有数据查询出来，然后保存到另一张表中
  const data1 = await sqlFun(`SELECT * FROM sign_week where class!='admin'`);
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
};

// 解绑设备,将mac置为-1
const QRremoveMac = async (uid) => {
  return sqlFun(
    `UPDATE sign_week SET mac = '暂无绑定设备' WHERE uid = '${uid}'`
  );
};

// 根据学号重新绑定设备
const resetMac = async (mac, uid) => {
  return sqlFun(`UPDATE sign_week SET mac = '${mac}' WHERE uid = '${uid}'`);
};

// 判断此mac是否已经被注册
const getMac = async (mac) => {
  return sqlFun(`SELECT * FROM sign_week WHERE mac = '${mac}'`);
};

// 查询每个教室
const QRgetClassInfo = () => {
  return sqlFun(
    `SELECT class,NAME,mon,tues,wed,thur,fri,sat,sun FROM sign_week WHERE class !='admin'`
  );
};
module.exports = {
  QRgetweek,
  QRremoveMac,
  QRfindUserName,
  QRfindAllUser,
  QRfindAllUserTimer,
  QRsetWeek,
  QRdeleteUser,
  QRsetFaceInfo,
  QRfindSignTime,
  QRsignIn,
  QRgetSignTime,
  QRsavaSignTime,
  QRgetAllUid_mac,
  QRaddUser,
  QRreset_day,
  QRreset_week,
  resetMac,
  getMac,
  QRgetClassInfo,
  QRdeleteWeeks,
  QRdeleteAllWeeks,
};
