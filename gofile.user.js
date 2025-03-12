// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.6.1
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

    // Api
    // appdata: literally, app data

    // Funcs
    // function createNotification(title, message, type = 'success', duration = 3000)
    // function createPopup({ title, content, icon = null, backgroundOpacity = true, showCloseButton = true })
    // function createAlert(type, content)

    // Formats
    //
    // IDM Exported Format (support CRLF(\r\n) only):
    // <
    // url
    // cookie: accountToken=ABCDEFG
    // >
    //

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    const CRLF = '\r\n'

    const ARIA2_RPC_TUTORIAL_URL = 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface'

    const SUPPORTED_FORMATS = [
        { name: 'Direct', value: 'direct' },
        { name: 'IDM', value: 'ef2' },
        { name: 'Aria2', value: 'rpc' },
    ]

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const I18N = {
        'zh-CN': {
            // Button
            exportAll: '导出全部',
            exportSelected: '导出选中',
            sendAll: '发送全部',
            sendSelected: '发送选中',
            aria2RpcSettings: '配置 RPC',
            aria2RpcReset: '重置 RPC',
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
            exportAll: 'Export All',
            exportSelected: 'Export Selected',
            sendAll: 'Send All',
            sendSelected: 'Send Selected',
            aria2RpcSettings: 'RPC Settings',
            aria2RpcReset: 'RPC Reset',
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
        gofileEnhanced: 'fa-brands fa-google-plus',
        exportAll: 'fas fa-circle-down',
        exportSelected: 'far fa-circle-down',
        aria2RpcSettings: 'fas fa-gear',
        aria2RpcReset: 'fas fa-rotate-left',
    }

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        // init default configs if not exists
        initDefaultConfig() {
            DEFAULT_CONFIG.rpcSettings.forEach((item) => {
                utils.getValue(item.name) === undefined && utils.setValue(item.name, item.value)
            })
        },
        // get translation by key
        getTranslation(key) {
            const lang = I18N[navigator.language] ? navigator.language : DEFAULT_LANGUAGE
            return I18N[lang][key] || key // fallback to key
        },
        // get token from cookie
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
        goDirectLink(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        downloadFile(links, format) {
            const blob = new Blob([links], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file name by timestamp
            link.download = `${appdata.fileManager.mainContent.data.name} - ${new Date().getTime()}.${format.value}`
            link.click()
            URL.revokeObjectURL(url)
        },
        sendToRPC: async (fileLinks, cookie) => {
            const { address, secret, dir } = utils.getAria2RpcConfig()

            const header = [`Cookie: ${cookie}`]

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
        getHrLine() {
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')
            return hrLine
        },
        getButtonTemplate(iconClass, buttonText) {
            return `
            <a href="javascript:void(0)" id="index_GofileEnhanced" class="hover:text-blue-500 flex items-center gap-2" aria-label="${buttonText}">
                <i class="${iconClass}"></i>
                ${buttonText}
            </a>
            `
        },
        getRegularButtons(format) {
            // Header Title
            const formatTitleElement = document.createElement('li')
            formatTitleElement.innerHTML = `
            <span class="flex items-center gap-2 text-blue-500 font-bold">
                <i class="${ICON_CLASS.gofileEnhanced}"></i>
                ${format.name}
            </span>
            `

            // buttonText
            const exportAllText = format.name === 'Aria2' ? utils.getTranslation('sendAll') : utils.getTranslation('exportAll')
            const exportSelectedText =
                format.name === 'Aria2' ? utils.getTranslation('sendSelected') : utils.getTranslation('exportSelected')

            // create export buttons
            const exportAllButton = document.createElement('li')
            const exportSelectedButton = document.createElement('li')

            // set innerHTML
            exportAllButton.innerHTML = this.getButtonTemplate(ICON_CLASS.exportAll, exportAllText)
            exportSelectedButton.innerHTML = this.getButtonTemplate(ICON_CLASS.exportSelected, exportSelectedText)

            // add click event for each button
            exportAllButton.addEventListener('click', operations.handleExport.bind(null, false, format))
            exportSelectedButton.addEventListener('click', operations.handleExport.bind(null, true, format))

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getAria2Buttons() {
            // create rpc settings button
            const rpcSettingsButton = document.createElement('div')
            rpcSettingsButton.innerHTML = utils.getRPCButtonDom('settings')
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

            return [rpcSettingsButton, rpcResetButton]
        },
        getRPCButtonDom(type) {
            const buttonText = utils.getTranslation(type === 'settings' ? 'aria2RpcSettings' : 'aria2RpcReset')
            const iconClass = type === 'settings' ? ICON_CLASS.aria2RpcSettings : ICON_CLASS.aria2RpcReset

            return this.getButtonTemplate(iconClass, buttonText)
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
        getButtonsByFormat(format) {
            let elements = this.getRegularButtons(format)

            switch (format.name) {
                case 'IDM':
                    break
                case 'Aria2':
                    elements = [...elements, ...this.getAria2Buttons()]
                    break
                default:
                    break
            }

            return [this.getHrLine(), ...elements]
        },
    }

    const operations = {
        handleExport(selectMode, format) {
            const allFiles = appdata.fileManager.mainContent.data.children
            const selectedKeys = appdata.fileManager.contentsSelected

            // all file keys or selected file keys
            const fileKeys = Object.keys(selectMode ? selectedKeys : allFiles)

            // to be downloaded keys
            const tbdKeys = fileKeys.filter((key) => allFiles[key].type === FILE_TYPE)

            if (tbdKeys.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('noFileSelected') : utils.getTranslation('noFiles'),
                    selectMode ? utils.getTranslation('noFileSelectedDescription') : utils.getTranslation('noFilesDescription'),
                    'warning'
                )
            }

            const cookie = utils.getToken()
            const tbdLinks = tbdKeys.map((key) => allFiles[key].link)

            switch (format.name) {
                case 'Direct':
                    utils.goDirectLink(tbdLinks)
                    break
                case 'IDM':
                    const IDMLinks = tbdLinks
                        .map((link) => {
                            return `<${CRLF}${link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                        })
                        .join('')
                    utils.downloadFile(IDMLinks, format)
                    break
                case 'Aria2':
                    utils.sendToRPC(tbdLinks, cookie)
                    break
                default:
                    console.log('Unsupported format.')
                    break
            }
        },
        // add buttons to sidebar
        addContainerToSidebar() {
            // create container
            const container = document.createElement('ul')
            container.id = GE_CONTAINER_ID
            // 'border-t', 'border-gray-700', 'mt-4',
            container.classList.add('pt-4', 'space-y-4')

            // append buttons to container
            SUPPORTED_FORMATS.forEach((format) => {
                utils.getButtonsByFormat(format).forEach((item) => {
                    container.appendChild(item)
                })
            })

            // append container to sidebar
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            utils.initDefaultConfig()

            // Observe changes in the DOM
            const observer = new MutationObserver((_mutations, _obs) => {
                // Check if the target node is available
                const container = document.getElementById(GE_CONTAINER_ID)

                // Check if the mainContent is available
                if (appdata.fileManager?.mainContent?.data) {
                    // Add buttons to sidebar
                    !container && operations.addContainerToSidebar()
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

    // Script Entry Point
    main.init()
})()
