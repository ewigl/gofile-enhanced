// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.4.5
// @description  在 GoFile 文件页面添加一个按钮,导出当前页面全部文件下载链接。用以配合 IDM、aria2 等下载器使用。
// @description:en Export all files' download link. Use along with IDM, aria2 and similar downloaders.
// @author       Licht
// @license      MIT
// @homepage     https://github.com/ewigl/gofile-enhanced
// @match        http*://gofile.io/d/*
// @icon         https://gofile.io/dist/img/favicon16.png
// @connect      localhost
// @connect      *
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

;(function () {
    'use strict'

    // New Api
    // appdata: literally, app data

    // IDM Exported Format (support CRLF(\r\n) only):
    // <
    // url
    // cookie: accountToken=ABCDEFG
    // >

    const styleCSS = `
    .gofile-enhanced-form {
        display: grid;
    }

    .gofile-enhanced-form input {
        margin: 0.5rem 0;
    }
    `

    GM_addStyle(styleCSS)

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    const CRLF = '\r\n'

    const EXPORT_FORMAT = {
        // plain text
        txt: 'txt',
        // IDM
        ef2: 'ef2',
        // aria2
        aria2: 'aria2',
    }

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const I18N = {
        'zh-CN': {
            // Button
            allToTXT: '全部链接 -> TXT',
            selectedToTXT: '选中链接 -> TXT',
            allToEF2: '全部链接 -> IDM',
            selectedToEF2: '选中链接 -> IDM',
            allToARIA2: '全部 -> Aria2 RPC',
            selectedToARIA2: '选中 -> Aria2 RPC',
            aria2RpcSettings: 'Aria2 RPC 设置',
            aria2RpcReset: '重置 RPC 设置',
            // Toast
            noFileSelected: '未选中任何文件',
            noFileSelectedDescription: '请先选中文件',
            noFiles: '没有文件可以下载',
            noFilesDescription: '没有可以下载的文件 暂不支持文件夹下载',
            // RPC
            rpcSendSuccess: '已通过 RPC 发送至 Aria2 下载',
            rpcSendFailed: '通过 RPC 发送至 Aria2 失败',
            unknownError: '未知错误',
            // RPC Settings
            rpcAddress: 'RPC 地址',
            rpcSecret: 'RPC 密钥',
            rpcDir: 'RPC 下载目录',
            // Common
            ok: '确定',
            cancel: '取消',
            success: '成功',
            fail: '失败',
        },
        'en-US': {
            // Button
            allToTXT: 'All links -> TXT',
            selectedToTXT: 'Selected links -> TXT',
            allToEF2: 'All links -> IDM',
            selectedToEF2: 'Selected links -> IDM',
            allToARIA2: 'All -> Aria2 RPC',
            selectedToARIA2: 'Selected -> Aria2 RPC',
            aria2RpcSettings: 'Aria2 RPC Settings',
            aria2RpcReset: 'Reset RPC settings',
            // Toast
            noFileSelected: 'No file selected',
            noFileSelectedDescription: 'Please select files first',
            noFiles: 'No files can be downloaded',
            noFilesDescription: 'No files can be downloaded, folder download is not supported, yet',
            // RPC
            rpcSendSuccess: 'RPC send success',
            rpcSendFailed: 'RPC send failed',
            unknownError: 'Unknown error',
            // RPC Settings
            rpcAddress: 'RPC address',
            rpcSecret: 'RPC secret',
            rpcDir: 'RPC dir',
            // Common
            ok: 'OK',
            cancel: 'Cancel',
            success: 'Success',
            fail: 'Fail',
        },
    }

    const ARIA2_RPC_CONFIG_KEY = {
        rpcAddress: 'aria2_rpc_address',
        rpcSecret: 'aria2_rpc_secret',
        rpcDir: 'aria2_rpc_dir',
    }

    const DEFAULT_CONFIG = {
        rpcSettings: [
            {
                name: ARIA2_RPC_CONFIG_KEY.rpcAddress,
                value: 'http://localhost:6800/jsonrpc',
            },
            {
                name: ARIA2_RPC_CONFIG_KEY.rpcSecret,
                value: '',
            },
            {
                name: ARIA2_RPC_CONFIG_KEY.rpcDir,
                value: '',
            },
        ],
    }

    const ICON_CLASS = {
        allToTXT: 'bi-file-earmark-arrow-down-fill',
        selectedToTXT: 'bi-file-earmark-arrow-down',
        allToEF2: 'bi-send-check-fill',
        selectedToEF2: 'bi-send-check',
        allToARIA2: 'bi-cloud-arrow-down-fill',
        selectedToARIA2: 'bi-cloud-arrow-down',
        aria2RpcSettings: 'bi-gear-fill',
        aria2RpcReset: 'bi-arrow-counterclockwise',
    }

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        initDefaultConfig() {
            DEFAULT_CONFIG.rpcSettings.forEach((item) => {
                utils.getValue(item.name) === undefined && utils.setValue(item.name, item.value)
            })
        },
        getTranslation: (key) => I18N[navigator.language || DEFAULT_LANGUAGE][key],
        getToken: () => document.cookie,
        getAria2RpcConfig() {
            return {
                address: utils.getValue(ARIA2_RPC_CONFIG_KEY.rpcAddress),
                secret: utils.getValue(ARIA2_RPC_CONFIG_KEY.rpcSecret),
                dir:
                    utils.getValue(ARIA2_RPC_CONFIG_KEY.rpcDir).trim() === ''
                        ? undefined
                        : utils.getValue(ARIA2_RPC_CONFIG_KEY.rpcDir),
            }
        },
        resetRPCConfig() {
            DEFAULT_CONFIG.rpcSettings.forEach((item) => {
                utils.setValue(item.name, item.value)
                createToast({
                    toastIcon: 'bi-check-circle',
                    toastTitle: utils.getTranslation('success'),
                    toastHeaderColor: 'text-bg-success',
                    toastBody: `${item.name}: "${item.value}"`,
                })
            })
            // for each DEFAULT_CONFIG.rpcSettings
        },
        downloadFile(links, format = 'txt') {
            const blob = new Blob([links], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file neme by timestamp
            link.download = `${appdata.fileManager.mainContent.data.name} - ${new Date().getTime()}.${format}`
            link.click()
            URL.revokeObjectURL(url)
        },
        getButtonTemplate(iconClass, buttonText) {
            return `<a href="javascript:void(0)" id="index_GofileEnhanced" class="hover:text-blue-500 flex items-center gap-2" aria-label="${buttonText}"><i class="fas ${iconClass}" /> ${buttonText} </a>`
        },
        getFormInputItemTemplate(name, i18nKey) {
            return `
            <label for="${name}">
                ${utils.getTranslation(i18nKey)}:
            </label>
            <input
                type="text"
                id="${name}"
                name="${name}"
                value="${utils.getValue(name)}"
            >
            `
        },
        getButtonDom(selectMode = false, format = 'txt') {
            const buttonText = utils.getTranslation(
                selectMode ? 'selectedTo' + format.toUpperCase() : 'allTo' + format.toUpperCase()
            )
            const iconClass = selectMode
                ? ICON_CLASS['selectedTo' + format.toUpperCase()]
                : ICON_CLASS['allTo' + format.toUpperCase()]

            return this.getButtonTemplate(iconClass, buttonText)
        },
        getRPCButtonDom(type = 'settings') {
            const buttonText = utils.getTranslation(type === 'settings' ? 'aria2RpcSettings' : 'aria2RpcReset')
            const iconClass = type === 'settings' ? ICON_CLASS.aria2RpcSettings : ICON_CLASS.aria2RpcReset

            return this.getButtonTemplate(iconClass, buttonText)
        },
        getRPCSettingsDom() {
            return `
            <form id="gofile-enhanced-form" name="gofile-enhanced-form" class="gofile-enhanced-form" action="/" method="dialog">
                ${Object.keys(ARIA2_RPC_CONFIG_KEY)
                    .map((key) => this.getFormInputItemTemplate(ARIA2_RPC_CONFIG_KEY[key], key))
                    .join('')}
            </form>
            `
        },
    }

    const operations = {
        exportToFile(selectMode = false, format = 'txt') {
            const objectKeys = Object.keys(
                selectMode ? appdata.fileManager.contentsSelected : appdata.fileManager.mainContent.data.children
            )

            const fileKeys = objectKeys.filter((key) => appdata.fileManager.mainContent.data.children[key].type === FILE_TYPE)

            if (fileKeys.length === 0) {
                return createToast({
                    toastIcon: 'bi-exclamation-circle',
                    toastTitle: selectMode ? utils.getTranslation('noFileSelected') : utils.getTranslation('noFiles'),
                    toastHeaderColor: 'text-bg-warning',
                    toastBody: selectMode
                        ? utils.getTranslation('noFileSelectedDescription')
                        : utils.getTranslation('noFilesDescription'),
                })
            }

            if (format === EXPORT_FORMAT.aria2) {
                return operations.sendToRPC(fileKeys.map((key) => appdata.fileManager.mainContent.data.children[key].link))
            }

            const formatMap = {
                [EXPORT_FORMAT.ef2]: (item) => `<${CRLF}${item.link}${CRLF}cookie: ${utils.getToken()}${CRLF}>${CRLF}`,
                [EXPORT_FORMAT.txt]: (item) => `${item.link}${CRLF}`,
            }

            const links = fileKeys
                .map((key) => {
                    const item = appdata.fileManager.mainContent.data.children[key]
                    return formatMap[format](item)
                })
                .join('')

            utils.downloadFile(links, format)
        },
        sendToRPC: async (fileLinks = []) => {
            const rpcConfig = utils.getAria2RpcConfig()

            const rpcData = fileLinks.map((link) => {
                return {
                    id: new Date().getTime(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${rpcConfig.secret}`,
                        [link],
                        {
                            header: [`Cookie: ${utils.getToken()}`],
                            dir: rpcConfig.dir,
                        },
                    ],
                }
            })

            GM_xmlhttpRequest({
                method: 'POST',
                url: rpcConfig.address,
                data: JSON.stringify(rpcData),
                onload: (httpRes) => {
                    if (httpRes.status === 200) {
                        try {
                            const responseArray = JSON.parse(httpRes.response)

                            responseArray.forEach((item) => {
                                if (item.error) {
                                    createToast({
                                        toastIcon: 'bi-x-circle',
                                        toastTitle: utils.getTranslation('fail'),
                                        toastHeaderColor: 'text-bg-danger',
                                        toastBody: `${utils.getTranslation('rpcSendFailed')} / ${item.error.code} - ${
                                            item.error.message
                                        }`,
                                    })
                                } else {
                                    createToast({
                                        toastIcon: 'bi-check-circle',
                                        toastTitle: utils.getTranslation('success'),
                                        toastHeaderColor: 'text-bg-success',
                                        toastBody: `${utils.getTranslation('rpcSendSuccess')} / ${item.result}`,
                                    })
                                }
                            })
                        } catch (error) {
                            createToast({
                                toastIcon: 'bi-x-circle',
                                toastTitle: utils.getTranslation('fail'),
                                toastHeaderColor: 'text-bg-danger',
                                toastBody: error.toString(),
                            })
                        }
                    } else {
                        createToast({
                            toastIcon: 'bi-x-circle',
                            toastTitle: utils.getTranslation('fail'),
                            toastHeaderColor: 'text-bg-danger',
                            toastBody: `${utils.getTranslation('rpcSendFailed')} / ${httpRes.status} - ${httpRes.statusText}`,
                        })
                    }
                },
                onerror: (error) => {
                    createToast({
                        toastIcon: 'bi-x-circle',
                        toastTitle: utils.getTranslation('fail'),
                        toastHeaderColor: 'text-bg-danger',
                        toastBody: JSON.stringify(error),
                    })
                },
                onabort: () => {
                    createToast({
                        toastIcon: 'bi-x-circle',
                        toastTitle: utils.getTranslation('fail'),
                        toastHeaderColor: 'text-bg-danger',
                        toastBody: utils.getTranslation('unknownError') + ' / (abort)',
                    })
                },
            })
        },
        addButtonsToSidebar() {
            // boeder line
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')

            const buttonConfigs = [
                // txt buttons
                { selectMode: false, format: EXPORT_FORMAT.txt },
                { selectMode: true, format: EXPORT_FORMAT.txt },
                // ef2 buttons
                { selectMode: false, format: EXPORT_FORMAT.ef2 },
                { selectMode: true, format: EXPORT_FORMAT.ef2 },
                // aria2 buttons
                { selectMode: false, format: EXPORT_FORMAT.aria2 },
                { selectMode: true, format: EXPORT_FORMAT.aria2 },
            ]

            // map buttons (except aria2) to get button dom element
            const buttons = buttonConfigs.map((config) => {
                const button = document.createElement('li')
                button.innerHTML = utils.getButtonDom(config.selectMode, config.format)
                // add click event for each button
                button.addEventListener('click', operations.exportToFile.bind(null, config.selectMode, config.format))
                return button
            })

            const rpcSettingsButton = document.createElement('div')
            rpcSettingsButton.innerHTML = utils.getRPCButtonDom()
            // click rpc settings button to open modal
            rpcSettingsButton.addEventListener('click', () => {
                createModal({
                    modalTitle: utils.getTranslation('aria2RpcSettings'),
                    modalBody: utils.getRPCSettingsDom(),
                    modalYesLabel: utils.getTranslation('ok'),
                    modalCallback: () => {
                        // if click ok button
                        const form = document.forms['gofile-enhanced-form']

                        // TODO
                        Object.keys(ARIA2_RPC_CONFIG_KEY).forEach((key) => {
                            utils.setValue(ARIA2_RPC_CONFIG_KEY[key], form.elements[ARIA2_RPC_CONFIG_KEY[key]].value)
                        })
                    },
                })
            })

            const rpcResetButton = document.createElement('div')
            rpcResetButton.innerHTML = utils.getRPCButtonDom('reset')
            // click aria2 rpc reset button to reset rpc config
            rpcResetButton.addEventListener('click', () => {
                utils.resetRPCConfig()
            })

            buttons.push(hrLine.cloneNode(true))
            buttons.push(rpcSettingsButton)
            buttons.push(rpcResetButton)

            const container = document.createElement('ul')
            // add class to container
            container.classList.add('pt-4', 'space-y-4', 'border-gray-700')
            // add hr line
            container.appendChild(hrLine.cloneNode(true))
            // append buttons to container
            buttons.forEach((button) => container.appendChild(button))
            // add container to sidebar
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            // init RPC config
            utils.initDefaultConfig()

            // add buttons to sidebar, watch if appdata.fileManager.mainContent.data is ready
            let interval = setInterval(() => {
                if (appdata.fileManager.mainContent.data.children) {
                    operations.addButtonsToSidebar()
                    clearInterval(interval)
                }
            }, 640)
        },
    }

    main.init()
})()
