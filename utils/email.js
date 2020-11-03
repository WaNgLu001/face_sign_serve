const nodemailer = require("nodemailer");

function sendEmail(type, status) {
  var transporter = nodemailer.createTransport({
    host: "pop.qq.com",
    port: 465,
    secureConnection: true,
    // 我们需要登录到网页邮箱中，然后配置SMTP和POP3服务器的密码
    auth: {
      user: "lg1065849@qq.com",
      pass: "cvywwvsxhtpibdii",
    },
  });
  var to_name = type;
  var message = status;

  var sendHtml = `<div>Hi,每${to_name}更新数据库已经完成,请查看数据库是否正常！</div>`;

  var mailOptions = {
    // 发送邮件的地址
    from: '"发送人" <lg1065849@qq.com>', // login user must equal to this user
    // 接收邮件的地址
    to: "lg1065849@qq.com", // xrj0830@gmail.com
    // 邮件主题
    subject: `每${type}更新`,
    // 以HTML的格式显示，这样可以显示图片、链接、字体颜色等信息
    html: sendHtml,
  };

  transporter.sendMail(mailOptions, (error, info = {}) => {
    if (error) {
      return console.log(error);
    }
  });
}

function sendBase(uid, base) {
  var transporter = nodemailer.createTransport({
    host: "pop.qq.com",
    port: 465,
    secureConnection: true,
    // 我们需要登录到网页邮箱中，然后配置SMTP和POP3服务器的密码
    auth: {
      user: "lg1065849@qq.com",
      pass: "cvywwvsxhtpibdii",
    },
  });

  var sendHtml = `data:image/jpeg;base64,${base}`;

  var mailOptions = {
    // 发送邮件的地址
    from: '"发送人" <lg1065849@qq.com>', // login user must equal to this user
    // 接收邮件的地址
    to: "lg1065849@qq.com", // xrj0830@gmail.com
    // 邮件主题
    subject: `${uid}签到`,
    // 以HTML的格式显示，这样可以显示图片、链接、字体颜色等信息
    html: sendHtml,
  };

  transporter.sendMail(mailOptions, (error, info = {}) => {
    if (error) {
      return console.log(error);
    }
  });
}

module.exports = { sendEmail, sendBase };
