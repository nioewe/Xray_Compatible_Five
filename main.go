package main

import (
    "fmt"
    "log"
    "net/http"
    "os"
    "os/exec"
)

func main() {
    // 设置根路径的处理程序
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        // 将 "Hello, world" 写入响应
        w.Write([]byte("Hello, world"))

        // 执行 entrypoint.sh 脚本并输出结果
        cmd := exec.Command("/bin/bash", "./entrypoint.sh")
        output, err := cmd.Output()

        if err != nil {
            log.Fatal(err)
        }

        fmt.Println(string(output))
    })

    // 设置 /list 的处理程序
    http.HandleFunc("/list", func(w http.ResponseWriter, r *http.Request) {
        output, err := exec.Command("cat", "list").Output()
        if err != nil {
            // 如果命令执行出错，则输出错误信息到客户端
            w.Header().Set("Content-Type", "text/html")
            fmt.Fprintf(w, "<pre>%v</pre>n", err)
            return
        }
        // 输出命令执行结果到客户端
        fmt.Fprintf(w, "<pre>%s</pre>n", output)
    })

    // 启动 HTTP 服务器并监听端口
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    http.ListenAndServe(":"+port, nil)
}
