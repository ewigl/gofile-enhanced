# Gofile 增强

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

---

Gofile 文件批量下载。支持递归下载文件夹内容、直链下载。
支持 [AB Download Manager](https://github.com/amir1376/ab-download-manager)、[Internet Download Manager](https://www.internetdownloadmanager.com/) 与所有基于 [Aria2](https://github.com/aria2/aria2) 封装的下载器。

![cover](https://github.com/user-attachments/assets/4b3059dc-5f87-490d-91c0-10a0ee9c26cf)

## 使用方法

### 递归下载

> “递归下载”仅支持 ABDM 与 Aria2 两种下载方式。“递归下载”仍在测试阶段。

**需要在脚本设置中正确配置 ABDM 与 Aria2 下载目录（绝对路径，例如 `D:/Download`）。**

如果不配置下载目录，文件可能会下载到意想不到的地方（一般是你的下载软件所在目录或驱动器根目录），或直接下载出错。

![recursion](https://github.com/user-attachments/assets/3d1aaa20-d889-4070-8018-33e7129ba9a9)

### Direct

> 直链下载。文件过多时不建议使用，会一次性打开大量浏览器窗口。

**需要打开 Gofile 网站设置，允许“弹出式窗口和重定向”权限。**

![permissions](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### ABDM

> 直接将下载任务发送到 ABDM。

**需要安装 ABDM 并启用浏览器集成功能。**（无需安装浏览器扩展）

需要正确配置 ABDM 端口。默认端口为 15151。

![abdm](https://github.com/user-attachments/assets/bc181f0e-b287-4cc3-b81f-a52150d28985)

### Aria2

> 直接将下载任务通过 RPC 发送给 Aria2 下载器。

**需要正确配置 Aria2 RPC 信息。**

注意第三方下载器端口可能会与 Aria2 默认配置不同，例如 Motrix 默认端口为 16800。

### IDM

> 使用 IDM 批量下载。

使用脚本导出 IDM 专用格式 - 后缀为 ef2 的文件。

打开 IDM，选择任务 -> 导入 -> 从"IDM 导出文件"导入。
