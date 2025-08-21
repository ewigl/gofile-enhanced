# Gofile Enhanced

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

---

Gofile 文件批量下载。支持递归下载文件夹内容、直链下载。支持 [AB Download Manager](https://github.com/amir1376/ab-download-manager)、[Internet Download Manager](https://www.internetdownloadmanager.com/) 与所有基于 [Aria2](https://github.com/aria2/aria2) 封装的下载器。

Batch download Gofile files. Supports recursive folder download, Supports direct links. Supports [AB Download Manager](https://github.com/amir1376/ab-download-manager), [Internet Download Manager](https://www.internetdownloadmanager.com/) and [Aria2](https://github.com/aria2/aria2) related download managers.

❗ Please scroll down for English desciption.

---

![cover](https://github.com/user-attachments/assets/4b3059dc-5f87-490d-91c0-10a0ee9c26cf)

## 使用方法

### 递归下载

> 点击“递归下载”按钮，脚本会自动递归获取**所有**文件、文件夹内内容。
>
> 获取成功后会弹出窗口显示所有待下载的文件，确认无误即可开始下载。
>
> “递归下载”仅支持 ABDM 与 Aria2 两种下载方式。“递归下载”尚在测试阶段。

**需要在脚本设置中正确配置 ABDM 与 Aria2 下载目录（绝对路径）。**

如果不配置下载目录，文件可能会下载到你意想不到的地方（一般是你的下载软件所在驱动器根目录）。

![recursion](https://github.com/user-attachments/assets/3d1aaa20-d889-4070-8018-33e7129ba9a9)

### Direct

> 直链下载。如果有使用 ABDM、FDM、IDM 等下载器的浏览器集成，下载任务会被这些下载器自动接管。
>
> 文件过多时不建议使用，会一次性打开大量浏览器窗口。

**需要打开 Gofile 网站设置，允许“弹出式窗口和重定向”权限。**

![permissions](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### ABDM

> 直接将下载任务发送到 ABDM。

**需要安装 ABDM 并启用浏览器集成。**

需要正确配置 ABDM 端口。默认端口为 15151。

![abdm](https://github.com/user-attachments/assets/bc181f0e-b287-4cc3-b81f-a52150d28985)

### Aria2

> 直接将下载任务通过 RPC 发送给 Aria2 下载器。

**需要正确配置 Aria2 RPC 信息。**

注意第三方下载器端口可能会与 Aria2 默认配置不同，例如 Motrix 默认端口为 16800。

### IDM

> 批量导出链接到一个 ef2 文件，之后导入 IDM 添加下载任务。

使用脚本导出 IDM 专用格式 - 后缀为 ef2 的文件。

打开 IDM，选择任务 -> 导入 -> 从"IDM 导出文件"导入。

## Usage

English description here.

### Recursion Download

> Click the "Recursion Download" button, the script will automatically fetch **all** files and folder contents.
>
> A window will pop up displaying all file lists, and you can start downloading after confirming everything is correct.
>
> "Recursion Download" only supports ABDM and Aria2 download methods. "Recursion Download" is still in testing phase.

**You need to properly configure the ABDM and Aria2 download directories (absolute paths) in the settings.**

If you do not configure the download directory, files may be downloaded to unexpected locations (usually the root directory of your download manager's drive).

![recursion](https://github.com/user-attachments/assets/3d1aaa20-d889-4070-8018-33e7129ba9a9)

### Direct

> Direct link download. The browser will handle download tasks.
> If ABDM, FDM or IDM browser integration is enabled, download tasks will be automatically taken over by these downloaders.
>
> Not recommended when there are too many files, a large number of browser tabs will be opened at once.

**You need to open Gofile's Site Settings and grant 'Pop-ups and redirects' permission.**

![permissions](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### ABDM

> Directly send download tasks to AB Download Manager.

**ABDM is REQUIRED and the browser Integration must be enabled.**

Make sure to configure the ABDM port correctly. The default port is 15151.

![abdm](https://github.com/user-attachments/assets/bc181f0e-b287-4cc3-b81f-a52150d28985)

### Aria2

> Directly send the download task to the Aria2 downloader via RPC.

**You need to properly configure the Aria2 RPC address and secret.**

Note that the port for third-party downloaders may differ from the default Aria2 configuration,
for example, Motrix uses port 16800 by default.

### IDM

> Batch export links to an ef2 file, then import it into IDM to add download tasks.

Export IDM specific format - a file with the ".ef2" extension.

In IDM, go to Tasks -> Import -> From 'IDM export file' -> Select the ef2 file.
