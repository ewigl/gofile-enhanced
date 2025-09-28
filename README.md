# Gofile Enhanced

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

[![中文文档](https://img.shields.io/badge/中文文档-blue)](https://github.com/ewigl/gofile-enhanced/blob/main/README_CN.md)

---

Batch download Gofile files. Supports recursive folder download, Supports direct links. Supports [AB Download Manager](https://github.com/amir1376/ab-download-manager), [Internet Download Manager](https://www.internetdownloadmanager.com/) and [Aria2](https://github.com/aria2/aria2) related download managers.

![cover](https://github.com/user-attachments/assets/4b3059dc-5f87-490d-91c0-10a0ee9c26cf)

## Usage

### Recursive Download

> Click the "Recursive Download" button, the script will automatically fetch **all** files and folder contents.
>
> A window will pop up displaying all file lists, and you can start downloading after confirming everything is correct.
>
> "Recursive Download" can only be used with ABDM and Aria2. "Recursive Download" is still in testing phase.

**You need to properly configure the ABDM and Aria2 download directories (absolute paths) in the settings.**

If you do not configure the download directory, files may be downloaded to unexpected locations (usually the root directory of your download manager's drive).

![recursion](https://github.com/user-attachments/assets/3d1aaa20-d889-4070-8018-33e7129ba9a9)

### Direct

> Direct link download.
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

Note that the port for third-party downloaders may differ from the default Aria2 configuration, for example, Motrix uses port 16800 by default.

### IDM

> Batch export links to an ef2 file, then import it into IDM to add download tasks.

Export IDM specific format - a file with the ".ef2" extension.

In IDM, go to Tasks -> Import -> From 'IDM export file' -> Select the ef2 file.
