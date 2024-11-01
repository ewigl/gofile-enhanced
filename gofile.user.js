// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile User Script
// @namespace    https://github.com/ewigl/gofile-userscript
// @version      0.1.2
// @description  在 GoFile 文件页面添加一个按钮,导出当前页面全部文件下载链接。用以配合 IDM、aria2 等下载器使用。
// @description:en Add a button to export download links of current page files. Can be used in IDM, aria2 and similar downloaders.
// @author       Licht
// @license      MIT
// @homepage     https://github.com/ewigl/gofile-userscript
// @match        http*://gofile.io/d/*
// @icon         https://gofile.io/dist/img/favicon16.png
// @grant        GM_addStyle
// ==/UserScript==

;(function () {
    'use strict'

    const DEFAULT_LANGUAGE = 'en-US'

    const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const BUTTON_TEXT = {
        'zh-CN': '导出全部下载链接',
        'en-US': 'Export all file links',
    }

    const utils = {
        getLanguage() {
            return navigator.language || DEFAULT_LANGUAGE
        },
    }

    const operations = {
        // downloadByLink(url) {
        //     // create a element then click
        //     console.log('url:', url)
        //     let element = document.createElement('a')
        //     element.href = url
        //     element.target = '_blank'
        //     element.click()
        // },
        // downloadAllFiles() {
        //     // Get global object "mainFolderObject"
        //     console.log('mainFolderObject,', mainFolderObject)
        //     if (mainFolderObject.children) {
        //         // 遍历对象
        //         Object.keys(mainFolderObject.children).forEach(async (key) => {
        //             const item = mainFolderObject.children[key]
        //             if (item.type === 'folder') {
        //                 // operations.downloadAllFiles(item)
        //                 console.log('folder found, skip...')
        //             } else if (item.type === 'file') {
        //                 console.log('file found, item:', item.name)
        //                 operations.downloadByLink(item.link)
        //             }
        //         })
        //     } else {
        //         console.log('No files to download...')
        //     }
        // },
        writeLinksToTxt() {
            console.log('mainFolderObject,', mainFolderObject)

            let links = ''

            if (mainFolderObject.children) {
                // 遍历对象
                Object.keys(mainFolderObject.children).forEach(async (key) => {
                    const item = mainFolderObject.children[key]
                    if (item.type === FOLDER_TYPE) {
                        console.log('Folder found, skip...')
                    } else if (item.type === FILE_TYPE) {
                        console.log('File found, item:', item.name)
                        links += item.link + '\n'
                    }
                })
            } else {
                console.log('No files to download...')
            }

            const blob = new Blob([links], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file neme by timestamp
            link.download = mainFolderObject.name + ' - ' + new Date().getTime() + '.txt'
            link.click()
            URL.revokeObjectURL(url)
        },

        addButtonToSidebar() {
            const buttonDom = `
            <a href="javascript:void(0)">
                <div class="row justify-content-center rounded-pill sidebarItem mt-1 mb-1 hover" style="">
                    <div class="col-auto">
                    <span style="font-size: 1.5em"><i class="bi bi-cloud-download-fill"></i></span>
                    </div>
                    <div class="col sidebarMobile d-flex align-items-center" style="display: block;">
                    <span> ${BUTTON_TEXT[utils.getLanguage()]} </span>
                    </div>
                </div>
            </a>
            `

            const hrLine = document.createElement('hr')
            hrLine.classList.add('my-0')

            const buttonEle = document.createElement('div')
            buttonEle.innerHTML = buttonDom
            buttonEle.addEventListener('click', operations.writeLinksToTxt)

            // add to sidebar
            document.querySelector('#sidebar').appendChild(hrLine)
            document.querySelector('#sidebar').appendChild(buttonEle)
        },
    }

    const main = {
        init() {
            // add button to sidebar
            let interval = setInterval(() => {
                if (mainFolderObject.children) {
                    operations.addButtonToSidebar()
                    clearInterval(interval)
                }
            }, 640)
        },
    }

    main.init()
})()
