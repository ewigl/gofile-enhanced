# Gofile Enhanced

Batch-download GoFiles. Folder download. Automatically bypass high traffic alert. Use direct links. Built-in support for download managers like [AB Download Manager](https://github.com/amir1376/ab-download-manager), [Aria2](https://github.com/aria2/aria2) and [Internet Download Manager](https://www.internetdownloadmanager.com/).

[![中文文档](https://img.shields.io/badge/中文文档-blue)](https://ewigl.github.io/projects/gofile-enhanced/)

---

![cover](https://github.com/user-attachments/assets/b6831bfa-6838-412e-b71a-a1ed802ecee8)

## Install

[GitHub](https://github.com/ewigl/gofile-enhanced)

[Greasy Fork](https://greasyfork.org/scripts/515250)

## Usage

Install this script,

select files,

click Download button,

choose the way you prefer.

![usage](https://github.com/user-attachments/assets/36378f19-9966-414d-a344-82845a3087d0)


## Download Methods

### Direct

> Download file using direct link.

> [!NOTE]
> Open Gofile Site Settings, grant the "Pop-ups and redirects" permission.

Not recommended when there are too many files, as a large number of browser tabs will be opened at once.

![direct](https://github.com/user-attachments/assets/4676339f-f33f-46e1-92a0-08bb2d65a9c1)

### ABDM

> Send files to AB Download Manager. **Folder download available.**

> [!NOTE]
> Make sure to configure the ABDM port correctly. The default port is 15151.

![abdm](https://github.com/user-attachments/assets/71dabdaf-6bfb-4d59-bfb0-669b3893b43d)

### Aria2

> Send download tasks to Aria2 via RPC. **Folder download available.**

> [!NOTE]
> You need to properly configure the Aria2 RPC address and secret.

Note that the port used by third-party downloaders may differ from the default Aria2 configuration.
For example, Motrix uses port 16800 by default.

### IDM

> Using Internet Download Manager.

This exports an IDM-specific format, which is a file with the ".ef2" file extension.

In IDM, go to Tasks → Import → From "IDM export file" → Select the .ef2 file.

## Folder Dwonload

> "Folder Download" can only be used with ABDM and Aria2, and it is **still in the testing phase**.

> [!NOTE]
> You need to properly configure the download folder for ABDM or Aria2 (absolute paths, such as `D:/Download`).

If you did not set the download folder, files may be downloaded to unexpected locations (usually the root directory of your download manager's or your drive's), or just refuse to download.

![file list](https://github.com/user-attachments/assets/9a5e5dc1-c296-4bd3-9f7a-58494541cc7e)

![config](https://github.com/user-attachments/assets/561dbe1e-8ea6-40fa-ad95-ca6fd1055474)
