const Axios = require("axios");
const { createWriteStream, existsSync, mkdirSync, readFile } = require("fs");
const { join, resolve } = require("path");

const { init } = require("./src/main");

/**
 * @todo 待优化
 */
async function downloadImages({ url, filePath, uploadPath, name }) {
  filePath = join(__dirname, filePath);
  // 目录判断
  if (!existsSync(filePath)) {
    mkdirSync(filePath, { recursive: true });
  }

  const myPath = resolve(filePath, name);
  console.log(myPath);
  const writerStream = createWriteStream(myPath, {
    encoding: "binary"
  });

  try {
    //   const isHas = await this.ossHelper.isExistObject(uploadPath);
    //   if (!isHas) {
    const response = await Axios({
      url,
      method: "get",
      responseType: "stream"
    }).then(res => res.data);

    // 流下载
    response
      .on("error", err => {
        console.log(
          "[Function downloadImages()] download faild, continue redownload"
        );
        downloadImages(url, filePath, uploadPath, name);
      })
      .pipe(writerStream)
      .on("close", () => {
        console.log(
          `[Function downloadImages()] download success, the path is ${myPath}`
        );
      });
    //   }
  } catch (error) {
    console.log("[Function downloadImages()] Get Image Faild By ", url);
    downloadImages({ url, filePath, uploadPath, name });
  }

  return filePath;
}

init();
