// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.2.0
// @description  在 GoFile 文件页面添加一个按钮,导出当前页面全部文件下载链接。用以配合 IDM、aria2 等下载器使用。
// @description:en Export all files' download link. Use along with IDM, aria2 and similar downloaders.
// @author       Licht
// @license      MIT
// @homepage     https://github.com/ewigl/gofile-enhanced
// @match        http*://gofile.io/d/*
// @icon         https://gofile.io/dist/img/favicon16.png
// @grant        GM_addStyle
// ==/UserScript==

;(function () {
    'use strict'

    // comments for myself
    // mainFolderObject: GoFile OBJECT (NOT ARRAY!) of current page's all files and folders.
    // contentsSelected: user selected files or folders.

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const BUTTON_TEXT = {
        'zh-CN': '导出全部下载链接',
        'en-US': 'Export all file links',
    }

    const BUTTON_TEXT_SELECTE_MODE = {
        'zh-CN': '导出选中下载链接',
        'en-US': 'Export selected file links',
    }

    const NO_FILE_SELECTED = {
        'zh-CN': '未选中任何文件',
        'en-US': 'No file selected',
    }

    const BUTTON_ICON_CLASS = 'bi-cloud-download-fill'
    const BUTTON_ICON_CLASS_SELECTE_MODE = 'bi-cloud-check-fill'
    // const BUTTON_ICON_CLASS_SELECTE_MODE = 'bi-check-circle-fill'

    const utils = {
        getLanguage() {
            return navigator.language || DEFAULT_LANGUAGE
        },
        exportToTxt(links) {
            const blob = new Blob([links], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file neme by timestamp
            link.download = mainFolderObject.name + ' - ' + new Date().getTime() + '.txt'
            link.click()
            URL.revokeObjectURL(url)
        },
        generateButtonDom(selectMode = false) {
            const buttonText = selectMode ? BUTTON_TEXT_SELECTE_MODE[utils.getLanguage()] : BUTTON_TEXT[utils.getLanguage()]
            const iconClass = selectMode ? BUTTON_ICON_CLASS_SELECTE_MODE : BUTTON_ICON_CLASS

            return `
            <a href="javascript:void(0)">
                <div class="row justify-content-center rounded-pill sidebarItem mt-1 mb-1 hover">
                    <div class="col-auto">
                    <span style="font-size: 1.5em"><i class="bi ${iconClass}"></i></span>
                    </div>
                    <div class="col sidebarMobile d-flex align-items-center" style="display: block;">
                    <span> ${buttonText} </span>
                    </div>
                </div>
            </a>
          `
        },
    }

    const operations = {
        getDownloadLinks(selectMode = false) {
            let links = ''

            const filesToBeDownloaded = Object.keys(selectMode ? contentsSelected : mainFolderObject.children)

            if (filesToBeDownloaded.length === 0) {
                // console.log('No files to download...')
                alert(NO_FILE_SELECTED[utils.getLanguage()])
                return
            } else {
                filesToBeDownloaded.forEach((key) => {
                    const item = mainFolderObject.children[key]
                    if (item.type === FILE_TYPE) {
                        // console.log('File found, item:', item.name)
                        links += item.link + '\n'
                    }
                })
            }

            utils.exportToTxt(links)
        },

        addButtonsToSidebar() {
            const hrLine = document.createElement('hr')
            hrLine.classList.add('my-0')

            const downloadAllButton = document.createElement('div')
            downloadAllButton.innerHTML = utils.generateButtonDom(false)
            downloadAllButton.addEventListener('click', operations.getDownloadLinks.bind(null, false))

            const downloadSelectedButton = document.createElement('div')
            downloadSelectedButton.innerHTML = utils.generateButtonDom(true)
            downloadSelectedButton.addEventListener('click', operations.getDownloadLinks.bind(null, true))

            // add to sidebar
            // document.querySelector('#sidebar').appendChild(hrLine)
            // document.querySelector('#sidebar').appendChild(downloadAllButton)
            // document.querySelector('#sidebar').appendChild(downloadSelectedButton)

            // merge into one
            const allInOneElement = document.createElement('div')

            allInOneElement.appendChild(hrLine)
            allInOneElement.appendChild(downloadAllButton)
            allInOneElement.appendChild(downloadSelectedButton)

            document.querySelector('#sidebar').appendChild(allInOneElement)
        },
    }

    const main = {
        init() {
            // add button to sidebar
            let interval = setInterval(() => {
                if (mainFolderObject.children) {
                    operations.addButtonsToSidebar()
                    clearInterval(interval)
                }
            }, 640)
        },
    }

    main.init()
})()
