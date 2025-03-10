// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.5.2
// @description  在 GoFile 文件下载页面添加亿个按钮，导出文件下载链接。配合 IDM、aria2 等下载器使用。
// @description:en Export files' download link. Use along with IDM, aria2 and similar downloaders.
// @author       Licht
// @license      MIT
// @homepage     https://github.com/ewigl/gofile-enhanced
// @match        http*://gofile.io/*
// @icon         https://gofile.io/dist/img/favicon16.png
// @connect      localhost
// @connect      *
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

;(function () {
    'use strict'

    // New Api
    // appdata: literally, app data

    // function createNotification(title, message, type = 'success', duration = 3000)
    // function createPopup({ title, content, icon = null, backgroundOpacity = true, showCloseButton = true })
    // function createAlert(type, content)

    // IDM Exported Format (support CRLF(\r\n) only):
    // <
    // url
    // cookie: accountToken=ABCDEFG
    // >

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    const CRLF = '\r\n'

    const ARIA2_RPC_TUTORIAL_URL = 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface'

    const EXPORT_FORMAT = {
        // IDM
        ef2: 'ef2',
        // aria2
        aria2: 'aria2',
    }

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const I18N = {
        'zh-CN': {
            // Button
            allToEF2: '全部链接 -> IDM',
            selectedToEF2: '选中链接 -> IDM',
            allToARIA2: '全部链接 -> Aria2',
            selectedToARIA2: '选中链接 -> Aria2',
            aria2RpcSettings: '配置 Aria2 RPC',
            aria2RpcReset: '重置 Aria2 RPC',
            // Notification
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
            reset: '重置',
            to: '为',
        },
        'en-US': {
            // Button
            allToEF2: 'All links -> IDM',
            selectedToEF2: 'Selected links -> IDM',
            allToARIA2: 'All links -> Aria2',
            selectedToARIA2: 'Selected links -> Aria2',
            aria2RpcSettings: 'Aria2 RPC Settings',
            aria2RpcReset: 'Aria2 RPC Reset',
            // Notification
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
            reset: 'Reset',
            to: 'to',
        },
    }

    const ARIA2_RPC_CONFIG_KEY = {
        rpcAddress: 'aria2_rpc_address',
        rpcSecret: 'aria2_rpc_secret',
        rpcDir: 'aria2_rpc_dir',
    }

    const ARIA2_RPC_CONFIG_ICONS = {
        rpcAddress: 'fa-link',
        rpcSecret: 'fa-key',
        rpcDir: 'fa-folder',
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
        allToEF2: 'fas fa-paper-plane',
        allToARIA2: 'fas fa-circle-down',
        selectedToEF2: 'far fa-paper-plane',
        selectedToARIA2: 'far fa-circle-down',
        aria2RpcSettings: 'fas fa-gear',
        aria2RpcReset: 'fas fa-rotate-left',
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
        getTranslation(key) {
            const lang = I18N[navigator.language] ? navigator.language : DEFAULT_LANGUAGE
            return I18N[lang][key] || key // fallback to key
        },
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
                createNotification(
                    utils.getTranslation('success'),
                    `${utils.getTranslation('reset')} ${item.name} ${utils.getTranslation('to')} "${item.value}"`
                )
            })
            // for each DEFAULT_CONFIG.rpcSettings
        },
        downloadFile(links, format = 'ef2') {
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
            return `<a href="javascript:void(0)" id="index_GofileEnhanced" class="hover:text-blue-500 flex items-center gap-2" aria-label="${buttonText}"><i class="${iconClass}"></i> ${buttonText} </a>`
        },
        getFormInputItemTemplate(name, i18nKey) {
            return `
            <div class="space-y-2">
                <label for="${name}" class="block text-sm font-medium text-gray-300">
                    ${utils.getTranslation(i18nKey)}
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fas ${ARIA2_RPC_CONFIG_ICONS[i18nKey]} text-gray-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="${name}" 
                        name="${name}" 
                        class="w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2
                            focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 text-white placeholder-gray-400"
                        value="${utils.getValue(name)}"
                    >
                </div>
            </div>
            `
        },
        getButtonDom(config) {
            const { selectMode = false, format = 'ef2' } = config

            const buttonText = utils.getTranslation(
                selectMode ? 'selectedTo' + format.toUpperCase() : 'allTo' + format.toUpperCase()
            )
            const iconClass = selectMode
                ? ICON_CLASS['selectedTo' + format.toUpperCase()]
                : ICON_CLASS['allTo' + format.toUpperCase()]

            const button = document.createElement('li')
            button.innerHTML = this.getButtonTemplate(iconClass, buttonText)
            // add click event for each button
            button.addEventListener('click', operations.exportToFile.bind(null, selectMode, format))
            return button
        },
        getRPCButtonDom(type = 'settings') {
            const buttonText = utils.getTranslation(type === 'settings' ? 'aria2RpcSettings' : 'aria2RpcReset')
            const iconClass = type === 'settings' ? ICON_CLASS.aria2RpcSettings : ICON_CLASS.aria2RpcReset

            return this.getButtonTemplate(iconClass, buttonText)
        },
        getRPCSettingsDom() {
            return `
            <div class="space-y-4">
                <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <p class="text-gray-300 text-sm">
                            <a href="${ARIA2_RPC_TUTORIAL_URL}" target="_blank" rel="noopener noreferrer"> ${ARIA2_RPC_TUTORIAL_URL} </a>
                        </p>
                    </div>
                </div>

                <form id="GofileEnhanced_Form" class="space-y-4">

                ${Object.keys(ARIA2_RPC_CONFIG_KEY)
                    .map((key) => this.getFormInputItemTemplate(ARIA2_RPC_CONFIG_KEY[key], key))
                    .join('')}

                    <button
                        id="GofileEnhanced_RPC_Submit"
                        type="submit"
                        class="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 
                            ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2"
                    >
                        <i class="fas fa-check"></i>
                        <span> ${utils.getTranslation('ok')} </span>
                    </button>
                </form>
            </div>
            `
        },
        getHrLine() {
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')
            return hrLine
        },
    }

    const operations = {
        exportToFile(selectMode = false, format = 'ef2') {
            const objectKeys = Object.keys(
                selectMode ? appdata.fileManager.contentsSelected : appdata.fileManager.mainContent.data.children
            )

            const fileKeys = objectKeys.filter((key) => appdata.fileManager.mainContent.data.children[key].type === FILE_TYPE)

            if (fileKeys.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('noFileSelected') : utils.getTranslation('noFiles'),
                    selectMode ? utils.getTranslation('noFileSelectedDescription') : utils.getTranslation('noFilesDescription'),
                    'warning'
                )
            }

            if (format === EXPORT_FORMAT.aria2) {
                return operations.sendToRPC(fileKeys.map((key) => appdata.fileManager.mainContent.data.children[key].link))
            }

            const cookie = utils.getToken()

            const formatMap = {
                [EXPORT_FORMAT.ef2]: (item) => `<${CRLF}${item.link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`,
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
            const { address, secret, dir } = utils.getAria2RpcConfig()

            const header = [`Cookie: ${utils.getToken()}`]

            const rpcData = fileLinks.map((link) => {
                return {
                    id: new Date().getTime(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${secret}`,
                        [link],
                        {
                            header,
                            dir,
                        },
                    ],
                }
            })

            GM_xmlhttpRequest({
                method: 'POST',
                url: address,
                data: JSON.stringify(rpcData),
                onload: (httpRes) => {
                    if (httpRes.status === 200) {
                        try {
                            const responseArray = JSON.parse(httpRes.response)

                            responseArray.forEach((item) => {
                                if (item.error) {
                                    createNotification(
                                        utils.getTranslation('fail'),
                                        `${utils.getTranslation('rpcSendFailed')} / ${item.error.code} - ${item.error.message}`,
                                        'error'
                                    )
                                } else {
                                    createNotification(
                                        utils.getTranslation('success'),
                                        `${utils.getTranslation('rpcSendSuccess')} / ${item.result}`
                                    )
                                }
                            })
                        } catch (error) {
                            createAlert('error', error.toString())
                        }
                    } else {
                        createAlert(
                            'error',
                            `${utils.getTranslation('rpcSendFailed')} / ${httpRes.status} - ${httpRes.statusText}`
                        )
                    }
                },
                onerror: (error) => {
                    // createNotification(utils.getTranslation('fail'), JSON.stringify(error), 'error')
                    createAlert('error', JSON.stringify(error))
                },
                onabort: () => {
                    createAlert('error', utils.getTranslation('unknownError') + ' / (abort)')
                },
            })
        },
        addButtonsToSidebar() {
            // boeder line

            const buttonForAllConfigs = [
                { selectMode: false, format: EXPORT_FORMAT.ef2 },
                { selectMode: false, format: EXPORT_FORMAT.aria2 },
            ]

            const buttonsForSelectedConfigs = [
                { selectMode: true, format: EXPORT_FORMAT.ef2 },
                { selectMode: true, format: EXPORT_FORMAT.aria2 },
            ]

            // map buttons (except aria2) to get button dom element
            const buttonsForAll = buttonForAllConfigs.map((config) => utils.getButtonDom(config))
            const buttonsForSelected = buttonsForSelectedConfigs.map((config) => utils.getButtonDom(config))

            // create rpc settings button
            const rpcSettingsButton = document.createElement('div')
            rpcSettingsButton.innerHTML = utils.getRPCButtonDom()
            // click rpc settings button to open modal
            rpcSettingsButton.addEventListener('click', () => {
                createPopup({
                    title: utils.getTranslation('aria2RpcSettings'),
                    content: utils.getRPCSettingsDom(),
                    icon: 'fas fa-gears',
                })

                const form = document.forms['GofileEnhanced_Form']

                if (form) {
                    form.addEventListener('submit', (event) => {
                        event.preventDefault()
                        Object.keys(ARIA2_RPC_CONFIG_KEY).forEach((key) => {
                            utils.setValue(ARIA2_RPC_CONFIG_KEY[key], form.elements[ARIA2_RPC_CONFIG_KEY[key]].value)
                        })
                        closePopup()
                    })
                }
            })

            const rpcResetButton = document.createElement('div')
            rpcResetButton.innerHTML = utils.getRPCButtonDom('reset')
            // click aria2 rpc reset button to reset rpc config
            rpcResetButton.addEventListener('click', () => {
                utils.resetRPCConfig()
            })

            const container = document.createElement('ul')
            // add id
            container.id = GE_CONTAINER_ID
            // add class to container
            container.classList.add('pt-4', 'space-y-4', 'border-gray-700')
            // append buttons to container
            container.append(
                utils.getHrLine(),
                ...buttonsForAll,
                utils.getHrLine(),
                ...buttonsForSelected,
                utils.getHrLine(),
                rpcSettingsButton,
                rpcResetButton
            )
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            // init RPC config
            utils.initDefaultConfig()

            // observe changes to the DOM
            const observer = new MutationObserver((_mutations, _obs) => {
                const container = document.getElementById(GE_CONTAINER_ID)

                if (appdata.fileManager?.mainContent?.data) {
                    !container && operations.addButtonsToSidebar()
                    // Stop observing
                    // obs.disconnect()
                } else {
                    // remove GofileEnhanced_Container
                    container && container.remove()
                }
            })

            // Ovserve the target node "#index_main", which is in the DOM initially.
            const targetNode = document.getElementById('index_main')
            const config = { childList: true, subtree: true }
            if (targetNode) {
                observer.observe(targetNode, config)
            } else {
                console.log('#index_main not found.')
            }
        },
    }

    main.init()
})()
