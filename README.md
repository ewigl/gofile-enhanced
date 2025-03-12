## Gofile 增强 / GoFile Enhanced

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

> Gofile 文件批量下载，支持 IDM 与 Aria2 RPC。
>
> Gofile batch file download script, Supports IDM and Aria2 RPC methods.

![000](https://github.com/user-attachments/assets/ce3ac590-7cdd-4c7f-a5c8-cacce9969e4c)

### 使用方法 / Usage

#### Direct

> 直链下载，浏览器接管下载任务，如果有使用 IDM 浏览器集成则会被 IDM 接管。

-   打开 Gofile 网站设置，允许“弹出式窗口和重定向”权限。

    Open Gofile's Site settings and allow 'Pop-ups and redirects' permission.

    ![001](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

#### IDM

> 导出为 ef2 文件，之后导入 IDM 添加下载任务。

-   使用脚本导出 IDM(Internet Download Manager) 专用格式 - 后缀为 ef2 的文件。

    Use the script to export IDM (Internet Download Manager) specific format — files with the .ef2 extension.

-   打开 IDM，选择任务 -> 导入 -> 从"IDM 导出文件"导入。

    In IDM, go to Tasks -> Import -> From 'IDM export file'.

#### Aria2

> 直接将下载任务通过 RPC 发送给 Aria2 下载器.

-   正确配置 Aria2 RPC 地址与密钥。

    Properly configure the Aria2 RPC address and secret.
