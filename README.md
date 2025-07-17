# Gofile Enhanced

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

Gofile 文件批量下载，支持 IDM (Internet Download Manager) 与 Aria2。

Batch download Gofile files. Supports Aria2 and IDM (Internet Download Manager). Please scroll down for English desciption.

![000](https://github.com/user-attachments/assets/c8569200-106b-4450-8614-d06ac8b69265)

## 使用方法

### Direct

> 直链下载，浏览器接管下载任务，如果有使用 IDM 浏览器集成则会被 IDM 自动接管。
>
> 文件过多时不建议使用，会一次性打开大量浏览器窗口。

-   需要打开 Gofile 网站设置，允许“弹出式窗口和重定向”权限。

    ![001](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### IDM

> 导出为 ef2 文件，之后导入 IDM 添加下载任务。

使用脚本导出 IDM 专用格式 - 后缀为 ef2 的文件。

打开 IDM，选择任务 -> 导入 -> 从"IDM 导出文件"导入。

### Aria2

> 直接将下载任务通过 RPC 发送给 Aria2 下载器.

需要正确配置 Aria2 RPC 信息。

## Usage

English description here.

### Direct

> Direct link download: the browser will handle the download task. If IDM browser integration is enabled, the download will be automatically taken over by IDM.
>
> Not recommended when there are too many files, a large number of browser tabs will be opened at once.

You need to open Gofile's Site Settings and grant 'Pop-ups and redirects' permission.

![001](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### IDM

> You need IDM.

Use this script to export IDM specific format - a file with the ".ef2" extension.

In IDM, go to Tasks -> Import -> From 'IDM export file' -> Select the ef2 file.

### Aria2

> Directly send the download task to the Aria2 downloader via RPC.

You need to properly configure the Aria2 RPC address and secret.
