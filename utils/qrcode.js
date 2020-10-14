const mysql = require("mysql"); // 连接数据库
const conntection = mysql.createConnection({
  host: "119.3.254.20",
  user: "root",
  password: "123456",
  database: "qrcode_sign",
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

module.exports = {
  QRgetweek,
  QRfindUserName,
  QRfindAllUser,
  QRfindAllUserTimer,
  QRsetWeek,
  QRdeleteUser,
  QRsetFaceInfo,
};
