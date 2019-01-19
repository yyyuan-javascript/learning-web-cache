const Koa = require('koa');
const app = new Koa();
const path = require('path');
const serve = require('koa-static');

const main = serve(path.join(__dirname+'./resource'));

// // 设置 MIME type
// app.use(async (ctx, next) => {
//   const EXT_MIME_TYPES = {
//     default: "text/html",
//     ".js": "text/javascript",
//     ".css": "text/css",
//     ".json": "text/json",
//     ".jpeg": "image/jpeg",
//     ".jpg": "image/jpg",
//     ".png": "image/png"
//   };

//   const filePath = ctx.filePath;
//   const mimeType =
//     EXT_MIME_TYPES[path.extname(filePath)] || EXT_MIME_TYPES["default"];

//   log("mime_type", mimeType);

//   ctx.set("Content-Type", mimeType);

//   next();
// });
// 123
app.use( async ( ctx ) => {
    ctx.set({ "Content-Type": "text/html" });
    ctx.body = 'hello world <img src="./avatar.jpg" alt="img" width="200" height="200"/>'
  });
app.use(main);
// 错误处理
app.on("error", err => {
  console.log("server error", err);
});
app.listen(1030);