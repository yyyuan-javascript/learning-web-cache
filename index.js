const path = require("path");
const fs = require("fs");
// const crypto = require("crypto");
const md5 = require("md5");
const Koa = require("koa");
const PassThrough = require("stream").PassThrough;

const log = console.log;
const app = new Koa();

function getEast8Time(date) {
const east8Time = date.getTime()+3600000*8;
return new Date(east8Time).toGMTString();
}

// 获取访问文件路径
app.use(async (ctx, next) => {
  log("\n\n", "------------请求处理开始------------");

  let reqPath = ctx.path;

  log("request path", reqPath);

  if (reqPath === "/") reqPath = "/index.html";

  ctx.filePath = "./resource" + reqPath;

  next();
});

// 如果文件不存在则报错
app.use(async (ctx, next) => {
  const filePath = ctx.filePath;
  if (!fs.existsSync(filePath)) {
    ctx.status = 404;
    ctx.set({ "Content-Type": "text/html" });
    ctx.body = "<h1>404 Not Found</h1>";
    return;
  }

  next();
});

// 设置 MIME type
app.use(async (ctx, next) => {
  const EXT_MIME_TYPES = {
    default: "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "text/json",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpg",
    ".png": "image/png"
  };

  const filePath = ctx.filePath;
  const mimeType =
    EXT_MIME_TYPES[path.extname(filePath)] || EXT_MIME_TYPES["default"];

  log("mime_type", mimeType);

  ctx.set("Content-Type", mimeType);

  next();
});

// 设置缓存
app.use(async (ctx, next) => {
let stat, lastMod, mtime, date, cacheTime,
filePath, stream, filemd5, tag, matchTag; 
  // 在此处设置缓存策略

  switch(4.1){
    case 1: // Expires
      ctx.set("Expires", new Date("2019-01-15 21:00:00"));
      break;
    case 2: // Cache-Control
    case 2.1: // max-age  reqest headers里面默认Cache-Control: no-cache,最终结果以response hearder里面的cache-control为准
      ctx.set("Cache-Control", 'max-age=8');
      break;
    case 2.2: // Cache-Control 优先于 Expires
      ctx.set("Cache-Control", 'max-age=8');
      ctx.set("Expires", new Date("2019-01-15 21:00:00"));
      break;
    case 2.3: // Pragama ctrl+F5
      break;
    case 2.4: // no-cache 结合协商策略演示
      ctx.set("Cache-Control", 'no-cache');
      break;
    case 2.5: // no-store 结合协商策略演示
      ctx.set("Cache-Control", 'no-store');
      break;
    case 3: // Last-Modified 启发式缓存 
      date = new Date();
      stat = fs.statSync(ctx.filePath);
      mtime = new Date(stat.mtime);
      const cacheTime = (date.getTime() - mtime.getTime()) / 10;
      const Expires_timestamp = date.getTime() + cacheTime;
      const Expires_value = new Date(Expires_timestamp);
      log('cacheTime:', cacheTime,'ms');
      log('date:', getEast8Time(date));
      log('LastMod_time:', getEast8Time(mtime));
      log('Expires_time:', getEast8Time(Expires_value));
      ifModSince = ctx.get("If-Modified-Since");
      if (ifModSince && ifModSince === mtime.toGMTString()) {
        ctx.status = 304;
        return;
      }
      ctx.set("Last-Modified", mtime.toGMTString());
      // log(new Date(), 'new date');
      break;
    case 3.1: // If-Modified-Since
      stat = fs.statSync(ctx.filePath);
      mtime = new Date(stat.mtime).toGMTString();
      lastMod = ctx.get("If-Modified-Since");
      if (lastMod && lastMod === mtime) {
        ctx.status = 304;
        return;
      }
      ctx.set("Cache-Control", 'no-cache');
      ctx.set("Last-Modified", mtime);
      break;
    case 3.2: // If-Unmodified-Since 需要修改request headers实现
    // stat = fs.statSync(ctx.filePath);
    // mtime = new Date(stat.mtime).toGMTString();
    // lastMod = ctx.get("If-Unmodified-Since");
    // log(lastMod, 'lastMod');
    // log(mtime, 'mtime');
    // if(lastMod && lastMod !== mtime) {
    //   ctx.status = 412; // Precondition Failed
    //   return;
    // }
    // ctx.set("Cache-Control", 'no-cache');
    // ctx.set("Last-Modified", mtime);
    break;
    case 4: // ETag if-None-Match if-Match
      filePath = ctx.filePath;

      //从文件创建一个可读流
      stream = fs.readFileSync(filePath);
      filemd5 = md5(stream);
      ctx.filemd5 = filemd5;
      log("file md5：%s", filemd5);
      tag = `"${ctx.filemd5}"`; // ETag 必须加双引号
      matchTag = ctx.get("If-None-Match");
      if (matchTag && matchTag === tag) {
        ctx.status = 304;
        return;
      }
      ctx.set("ETag", tag);
      break;
    case 4.1: // ETag 优先于 Last-Modified
      filePath = ctx.filePath;
      stream = fs.readFileSync(filePath);
      filemd5 = md5(stream);
      ctx.filemd5 = filemd5;
      log("file md5：%s", filemd5);
      // 设置ETag
      tag = `"ctx.filemd5"`;
      ctx.set("ETag", tag);
      matchTag = ctx.get("If-None-Match");
      
      // 设置Last-Modified
      lastMod = ctx.get("If-Modified-Since");
      stat = fs.statSync(ctx.filePath);
      mtime = new Date(stat.mtime).toGMTString();
      ctx.set("Last-Modified", mtime);

      switch(3){
        case 1: // no-cache 缓存立即过期，可以走协商缓存
        ctx.set("Cache-Control", 'no-cache');
        break;
        case 2: // no-store 没有缓存， 不能走协商缓存
        ctx.set("Cache-Control", 'no-store');
        break;
        case 3: // 验证链接跳转
        ctx.set("Cache-Control", 'max-age=86400');
      }

        // etag 缓存判断
        if (matchTag && matchTag === tag) {
          ctx.status = 304;
          log('ETag 生效')
          return;
        }

        // last-modified缓存
        if (lastMod && lastMod === mtime) {
          ctx.status = 304;
          log('Last-Modified 生效')
          return;
        }
        break;
      default:
        break;
    }
    
  next();
});

// 返回文件内容
app.use(async (ctx, next) => {
  const filePath = ctx.filePath;

  const resStream = fs.createReadStream(filePath);
  ctx.status = 200;
  ctx.body = resStream.pipe(PassThrough());
  log("------------请求处理完毕------------");
});

// 错误处理
app.on("error", err => {
  console.log("server error", err);
});

app.listen(3000);
