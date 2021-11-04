var axios = require("axios");
var { FormData } = require("formdata-node");
async function getData(obj, api) {
  const params = new URLSearchParams();
  // params.append("api_key", "raS9hGQ--dXshlZqTDxUwTi6hxp8jTn7");
  // params.append("api_secret", "foqkTfjXAlx6jf9XELPD4hSsHyuLfeG7");
  for (let key in obj) {
    // console.log(key, obj[key]);
    params.append(key, obj[key]);
  }

  let baseUrl = "https://api-cn.faceplusplus.com/facepp/v3";

  // let result = await axios({
  //   method: "post",
  //   url: `${baseUrl}${api}`,
  //   data: params,
  //   headers: {
  //     "Content-Type": "application/x-www-form-urlencoded",
  //   },
  // });
  return new Promise(async (resolve, reject) => {
    try {
      let result = await axios({
        method: "post",
        url: `${baseUrl}${api}`,
        data: params,
      });
      resolve(result);
    } catch (error) {
      console.log(error);
      reject(error);
    }
  });
  // console.log(result.data);
  // return result;
}

module.exports = {
  getData,
};
