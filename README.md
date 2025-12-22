# Gofile Enhanced

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

[![中文文档](https://img.shields.io/badge/中文文档-blue)](https://github.com/ewigl/gofile-enhanced/blob/main/README_CN.md)

---

Batch download Gofile files. Supports recursive folder download, Supports direct links. Supports [AB Download Manager](https://github.com/amir1376/ab-download-manager), [Internet Download Manager](https://www.internetdownloadmanager.com/) and [Aria2](https://github.com/aria2/aria2) related download managers.

![cover](https://github.com/user-attachments/assets/4b3059dc-5f87-490d-91c0-10a0ee9c26cf)

## Usage

### Recursive Download (Folder Download)

> "Recursive Download" can only be used with ABDM and Aria2. "Recursive Download" is **still in the testing phase**.

**You need to properly configure the download folder for ABDM or Aria2 (absolute paths, such as `D:/Download`).**

If you did not set the download folder, files may be downloaded to unexpected locations (usually the root directory of your download manager's or your drive's), or refuse to download.

![recursion](https://github.com/user-attachments/assets/3d1aaa20-d889-4070-8018-33e7129ba9a9)

### Direct

> Downloads files via direct links.
>
> Not recommended when there are too many files, as a large number of browser tabs will be opened at once.

**Open Gofile Site Settings, grant the "Pop-ups and redirects" permission.**

![permissions](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### ABDM

> Sends download tasks directly to AB Download Manager.

**ABDM is REQUIRED and the browser integration must be enabled.**

Make sure to configure the ABDM port correctly. The default port is 15151.

![abdm](https://github.com/user-attachments/assets/bc181f0e-b287-4cc3-b81f-a52150d28985)

### Aria2

> Directly sends download tasks to the Aria2 downloader **via RPC**.

**You need to properly configure the Aria2 RPC address and secret.**

Note that the port used by third-party downloaders may differ from the default Aria2 configuration.
For example, Motrix uses port 16800 by default.

### IDM

> Batch download via Internet Download Manager.

This exports an IDM-specific format, which is a file with the ".ef2" extension.

In IDM, go to Tasks → Import → From "IDM export file" → Select the .ef2 file.
