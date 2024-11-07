// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.3.0
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
    // mainFolderObject (object): GoFile OBJECT (NOT ARRAY!) of current page's all files and folders.
    // contentsSelected (object): user selected files or folders.
    // accountsObject (object): user accounts object.

    // accountActive (string): active account.

    // IDM Exported Format (CRLF(${CRLF}) only):
    // <
    // url
    // cookie: accountToken=ABCDEFG
    // >

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    const CRLF = '\r\n'

    const EXPORT_FORMAT = {
        // plain text
        txt: 'txt',
        // IDM
        ef2: 'ef2',
    }

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const I18N = {
        'zh-CN': {
            allToTXT: '全部链接 -> TXT',
            selectedToTXT: '选中链接 -> TXT',
            allToEF2: '全部链接 -> IDM',
            selectedToEF2: '选中链接 -> IDM',
            noFileSelected: '未选中任何文件',
            noFileSelectedDescription: '请先选中文件。',
            noFiles: '没有文件可以下载',
            noFilesDescription: '没有可以下载的文件，暂不支持文件夹下载。',
            ok: '确定',
            cancel: '取消',
        },
        'en-US': {
            allToTXT: 'All links -> TXT',
            selectedToTXT: 'Selected links -> TXT',
            allToEF2: 'All links -> IDM',
            selectedToEF2: 'Selected links -> IDM',
            noFileSelected: 'No file selected',
            noFileSelectedDescription: 'Please select files first.',
            noFiles: 'No files can be downloaded',
            noFilesDescription: 'No files can be downloaded, folder download is not supported, yet.',
            ok: 'OK',
            cancel: 'Cancel',
        },
    }

    const ICON_CLASS = {
        allToTXT: 'bi-bookmark-fill',
        selectedToTXT: 'bi-bookmark-check-fill',
        allToEF2: 'bi-cloud-arrow-down-fill',
        selectedToEF2: 'bi-cloud-check-fill',
    }

    const utils = {
        getTranslation: (key) => I18N[navigator.language || DEFAULT_LANGUAGE][key],
        getToken: () => accountsObject[accountActive].token,
        downloadFile(links, format = 'txt') {
            const blob = new Blob([links], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file neme by timestamp
            link.download = `${mainFolderObject.name} - ${new Date().getTime()}.${format}`
            link.click()
            URL.revokeObjectURL(url)
        },
        generateButtonDom(selectMode = false, format = 'txt') {
            const buttonText = utils.getTranslation(
                selectMode ? 'selectedTo' + format.toUpperCase() : 'allTo' + format.toUpperCase()
            )
            const iconClass = selectMode
                ? ICON_CLASS['selectedTo' + format.toUpperCase()]
                : ICON_CLASS['allTo' + format.toUpperCase()]

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
        exportToFile(selectMode = false, format = 'txt') {
            const objectKeys = Object.keys(selectMode ? contentsSelected : mainFolderObject.children)
            // .filter(
            //     (key) => mainFolderObject.children[key].type === FILE_TYPE
            // )

            const fileKeys = objectKeys.filter((key) => mainFolderObject.children[key].type === FILE_TYPE)

            if (fileKeys.length === 0) {
                return createModal({
                    modalTitle: selectMode ? utils.getTranslation('noFileSelected') : utils.getTranslation('noFiles'),
                    modalBody: selectMode
                        ? utils.getTranslation('noFileSelectedDescription')
                        : utils.getTranslation('noFilesDescription'),
                    modalYesLabel: utils.getTranslation('ok'),
                })
            }

            const formatMap = {
                [EXPORT_FORMAT.ef2]: (item) =>
                    `<${CRLF}${item.link}${CRLF}cookie: accountToken=${utils.getToken()}${CRLF}>${CRLF}`,
                [EXPORT_FORMAT.txt]: (item) => `${item.link}${CRLF}`,
            }

            const links = fileKeys
                .map((key) => {
                    const item = mainFolderObject.children[key]
                    return formatMap[format](item)
                })
                .join('')

            utils.downloadFile(links, format)
        },

        addButtonsToSidebar() {
            const hrLine = document.createElement('hr')
            hrLine.classList.add('my-0')

            const buttonConfigs = [
                { selectMode: false, format: EXPORT_FORMAT.txt },
                { selectMode: true, format: EXPORT_FORMAT.txt },
                { selectMode: false, format: EXPORT_FORMAT.ef2 },
                { selectMode: true, format: EXPORT_FORMAT.ef2 },
            ]

            const buttons = buttonConfigs.map((config) => {
                const button = document.createElement('div')
                button.innerHTML = utils.generateButtonDom(config.selectMode, config.format)
                button.addEventListener('click', operations.exportToFile.bind(null, config.selectMode, config.format))
                return button
            })

            const container = document.createElement('div')
            container.appendChild(hrLine)
            buttons.forEach((button) => container.appendChild(button))

            document.querySelector('#sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
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
