const username = process.env.WEB_USERNAME || "admin";
const password = process.env.WEB_PASSWORD || "password";
const url = "https://" + process.env.PROJECT_DOMAIN + ".glitch.me";
const port = process.env.PORT || 3000;
const express = require("express");
const app = express();
var exec = require("child_process").exec;
const os = require("os");
const { createProxyMiddleware } = require("http-proxy-middleware");
var request = require("request");
var fs = require("fs");
var path = require("path");
const auth = require("basic-auth");

app.get("/", function (req, res) {
  res.send("hello world");
});

app.use((req, res, next) => {
  const user = auth(req);
  if (user && user.name === username && user.pass === password) {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="Node"');
  return res.status(401).send();
});

// 获取系统进程表
app.get("/status", function (req, res) {
  let cmdStr =
    "ps -ef";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统进程表：\n" + stdout + "</pre>");
    }
  });
});

// 获取系统监听端口
app.get("/listen", function (req, res) {
  let cmdStr = "ss -nltp";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>获取系统监听端口：\n" + stdout + "</pre>");
    }
  });
});

//获取节点数据
app.get("/list", function (req, res) {
  let cmdStr = "cat list";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.type("html").send("<pre>命令行执行错误：\n" + err + "</pre>");
    } else {
      res.type("html").send("<pre>节点数据：\n\n" + stdout + "</pre>");
    }
  });
});

// 获取系统版本、内存信息
app.get("/info", function (req, res) {
  let cmdStr = "cat /etc/*release | grep -E ^NAME";
  exec(cmdStr, function (err, stdout, stderr) {
    if (err) {
      res.send("命令行执行错误：" + err);
    } else {
      res.send(
        "命令行执行结果：\n" +
          "Linux System:" +
          stdout +
          "\nRAM:" +
          os.totalmem() / 1000 / 1000 +
          "MB"
      );
    }
  });
});

// 文件系统只读测试
app.get("/test", function (req, res) {
  fs.writeFile("./test.txt", "这里是新创建的文件内容!", function (err) {
    if (err) {
      res.send("创建文件失败，文件系统权限为只读：" + err);
    } else {
      res.send("创建文件成功，文件系统权限为非只读：");
    }
  });
});

// keepalive begin
//web保活
function keep_web_alive() {
  // 1.请求主页，保持唤醒
  exec("curl -m5 " + url, function (err, stdout, stderr) {
    if (err) {
      console.log("保活-请求主页-命令行执行错误：" + err);
    } else {
      console.log("保活-请求主页-命令行执行成功，响应报文:" + stdout);
    }
  });
  // 2.请求服务器进程状态列表，若web没在运行，则调起
  exec("pgrep -laf web.js", function (err, stdout, stderr) {
    // 1.查后台系统进程，保持唤醒
    if (stdout.includes("./web.js -c ./config.json")) {
      console.log("web 正在运行");
    } else {
      //web 未运行，命令行调起
      exec(
        "bash web.sh 2>&1 &",
        function (err, stdout, stderr) {
          if (err) {
            console.log("保活-调起web-命令行执行错误:" + err);
          } else {
            console.log("保活-调起web-命令行执行成功!");
          }
        }
      );
    }
  });
}
setInterval(keep_web_alive, 10 * 1000);

//Argo保活
function keep_argo_alive() {
  exec("pgrep -laf cloudflared", function (err, stdout, stderr) {
    // 1.查后台系统进程，保持唤醒
    if (stdout.includes("./cloudflared tunnel")) {
      console.log("Argo 正在运行");
    } else {
      //Argo 未运行，命令行调起
      exec("bash argo.sh 2>&1 &", function (err, stdout, stderr) {
        if (err) {
          console.log("保活-调起Argo-命令行执行错误:" + err);
        } else {
          console.log("保活-调起Argo-命令行执行成功!");
        }
      });
    }
  });
}
setInterval(keep_argo_alive, 30 * 1000);
// keepalive end

app.use(
  "/",
  createProxyMiddleware({
    changeOrigin: true, // 默认false，是否需要改变原始主机头为目标URL
    onProxyReq: function onProxyReq(proxyReq, req, res) {},
    pathRewrite: {
      // 请求中去除/
      "^/": "/",
    },
    target: "http://127.0.0.1:8080/", // 需要跨域处理的请求地址
    ws: true, // 是否代理websockets
  })
);

// 启动核心脚本运行web,哪吒和argo
exec("bash entrypoint.sh", function (err, stdout, stderr) {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));