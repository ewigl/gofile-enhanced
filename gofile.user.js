// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.6.5
// @description  GoFile 文件批量下载。批量导出下载链接。可以配合 AB Download Manager、IDM、Aria2 等下载器使用
// @description:en  Download Gofiles in batch. Support AB Download Manager, IDM and Aria2 related downloaders.
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

    // Gofile Api
    // appdata: literally, app data

    // Gofile Funcs
    // function createNotification(title, message, type = 'success', duration = 3000)
    // function createPopup({ title, content, icon = null, backgroundOpacity = true, showCloseButton = true })
    // function createAlert(type, content)

    // IDM EF2 File Formats, support CRLF(\r\n) only
    // <
    // url
    // cookie: accountToken=ABCDEFG
    // >

    // constants
    const DEFAULT_LANGUAGE = 'en-US'

    const CRLF = '\r\n'

    const ARIA2_RPC_TUTORIAL_URL = 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface'
    const ABDM_HOEMPAGE_URL = 'https://github.com/amir1376/ab-download-manager'

    const SUPPORTED_FORMATS = [
        { name: 'Direct', value: 'direct' },
        { name: 'ABDM', value: 'abdm' },
        { name: 'Aria2', value: 'rpc' },
        { name: 'IDM', value: 'ef2' },
    ]

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'

    // const FOLDER_TYPE = 'folder'
    const FILE_TYPE = 'file'

    const I18N = {
        'zh-CN': {
            // Button
            downloadAll: '下载全部',
            downloadSelected: '下载选中',
            exportAll: '导出全部',
            exportSelected: '导出选中',
            sendAll: '发送全部',
            sendSelected: '发送选中',
            aria2RpcSettings: '配置 Aria2 RPC',
            // Notification
            noFileSelected: '未选中任何文件',
            noFileSelectedDescription: '请至少选中一个文件',
            noFiles: '没有文件可以下载',
            noFilesDescription: '没有可以下载的文件, 暂不支持文件夹下载',
            // ABDM
            abdmSettings: '配置 AB Download Manager',
            abdmPort: 'ABDM 端口',
            abdmPortPlaceholder: '默认为 15151',
            abdmSendSuccess: '下载任务已发送至 ABDM',
            abdmSendFailed: '下载任务未成功发送至 ABDM',
            // RPC
            rpcAddress: 'RPC 地址',
            rpcSecret: 'RPC 密钥',
            rpcDir: 'RPC 下载目录',
            rpcAddressPlaceholder: '格式: http://localhost:6800/jsonrpc',
            rpcSecretPlaceholder: '若无密钥则留空',
            rpcDirPlaceholder: '留空则使用 Aria2 配置',
            rpcSendSuccess: '下载任务已成功发送至 Aria2',
            rpcSendFailed: '下载任务未成功发送至 Aria2',
            // Common
            cancel: '取消',
            checkPort: '请检查端口配置',
            config: '配置',
            connected: '已连接',
            connection: '连接',
            error: '错误',
            fail: '失败',
            notConfigured: '未配置',
            ok: '确定',
            port: '端口',
            reset: '重置',
            success: '成功',
            test: '测试',
            to: '为',
            unknownError: '未知错误',
            unSupportedFormat: '不支持的格式',
        },
        'en-US': {
            // Button
            downloadAll: 'Download All',
            downloadSelected: 'Download Selected',
            exportAll: 'Export All',
            exportSelected: 'Export Selected',
            sendAll: 'Send All',
            sendSelected: 'Send Selected',
            aria2RpcSettings: 'Aria2 RPC Settings',
            // Notification
            noFileSelected: 'No file selected',
            noFileSelectedDescription: 'Please select at least 1 file first',
            noFiles: 'No file can be downloaded',
            noFilesDescription: 'No file can be downloaded, folder download is not supported',
            // ABDM
            abdmSettings: 'AB Download Manager Settings',
            abdmPort: 'ABDM Port',
            abdmPortPlaceholder: 'Default is 15151',
            abdmSendSuccess: 'Download task sent to ABDM',
            abdmSendFailed: 'Download task failed to send to ABDM',
            // RPC
            rpcAddress: 'RPC Address',
            rpcSecret: 'RPC Secret',
            rpcDir: 'RPC Dir',
            rpcAddressPlaceholder: 'E.g. http://localhost:6800/jsonrpc',
            rpcSecretPlaceholder: 'Leave empty if not set',
            rpcDirPlaceholder: "Leave empty to use Aria2's default",
            rpcSendSuccess: 'download task sent to Aria2',
            rpcSendFailed: 'download task failed to send to Aria2',
            // Common
            cancel: 'Cancel',
            checkPort: 'please check port configuration',
            config: 'Config',
            connected: 'connected',
            connection: 'connection',
            error: 'error',
            fail: 'failed',
            notConfigured: 'not configured',
            ok: 'OK',
            port: 'port',
            reset: 'Reset',
            success: 'Success',
            test: 'Test',
            to: 'to',
            unknownError: 'Unknown error',
            unSupportedFormat: 'Unsupported format',
        },
    }

    const ARIA2_RPC_CONFIG = {
        rpcAddress: 'aria2_rpc_address',
        rpcSecret: 'aria2_rpc_secret',
        rpcDir: 'aria2_rpc_dir',
    }

    const ABDM_CONFIG = {
        abdmPort: 'abdm_port',
    }

    const DEFAULT_CONFIGS = {
        rpcSettings: [
            {
                name: ARIA2_RPC_CONFIG.rpcAddress,
                value: 'http://localhost:6800/jsonrpc',
            },
            {
                name: ARIA2_RPC_CONFIG.rpcSecret,
                value: '',
            },
            {
                name: ARIA2_RPC_CONFIG.rpcDir,
                value: '',
            },
        ],
        abdmSettings: [
            {
                name: ABDM_CONFIG.abdmPort,
                value: '15151',
            },
        ],
    }

    const ICON_CLASS = {
        gofileEnhanced: 'fa-brands fa-google-plus',
        downloadAll: 'fas fa-circle-down',
        downloadSelected: 'far fa-circle-down',
        exportAll: 'fas fa-file',
        exportSelected: 'far fa-file',
        sendAll: 'fas fa-paper-plane',
        sendSelected: 'far fa-paper-plane',
        abdmPort: 'fas fa-plug',
        rpcAddress: 'fa-link',
        rpcSecret: 'fa-key',
        rpcDir: 'fa-folder',
        folder: 'fas fa-folder',
        key: 'fas fa-key',
        link: 'fas fa-link',
        reset: 'fas fa-rotate-left',
        settings: 'fas fa-gear',
        test: 'fas fa-circle-nodes',
    }

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        // init default configs if not exists
        initDefaultConfig() {
            DEFAULT_CONFIGS.abdmSettings.forEach((item) => {
                utils.getValue(item.name) === undefined && utils.setValue(item.name, item.value)
            })
            DEFAULT_CONFIGS.rpcSettings.forEach((item) => {
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
        // Direct download related
        goDirectLink(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        // ABDM related
        testABDMConnection() {
            const port = utils.getValue(ABDM_CONFIG.abdmPort)

            const connectedString = `${utils.getTranslation('abdmPort')} ${utils.getTranslation('connected')}`
            const connectionFailString = `${utils.getTranslation('abdmPort')} ${utils.getTranslation('connection')} ${utils.getTranslation('fail')}`
            const notConfiguredString = `${utils.getTranslation('abdmPort')} ${utils.getTranslation('notConfigured')}`

            if (port) {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: `http://localhost:${port}/ping`,
                    onload: (response) => {
                        if (response.status === 200) {
                            createNotification(utils.getTranslation('success'), connectedString)
                        } else {
                            createNotification(utils.getTranslation('error'), connectionFailString, 'error')
                        }
                    },
                    onerror: (_error) => {
                        createNotification(utils.getTranslation('error'), `${connectionFailString}, ${utils.getTranslation('checkPort')}`, 'error')
                    },
                    onabort: () => {
                        createAlert('error', `${utils.getTranslation('unknownError')}, Aborted.`)
                    },
                })
            } else {
                createNotification('error', notConfiguredString, 'error')
            }
        },
        sendToABDM(tbdItems, cookie) {
            const port = utils.getValue(ABDM_CONFIG.abdmPort)

            if (!port) {
                return createNotification('error', `${utils.getTranslation('abdmPort')} ${utils.getTranslation('notConfigured')}`, 'error')
            }

            const postDatas = tbdItems.map((item) => {
                return {
                    downloadSource: {
                        link: item.link,
                        headers: {
                            cookie,
                        },
                    },
                    name: item.name,
                    // folder: item.folder,
                }
            })

            postDatas.forEach((data) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `http://localhost:${port}/start-headless-download`,
                    data: JSON.stringify(data),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    onload: (httpRes) => {
                        if (httpRes.status === 200) {
                            createNotification(utils.getTranslation('success'), `${data.name} ${utils.getTranslation('abdmSendSuccess')}`)
                        } else {
                            createNotification('error', `${utils.getTranslation('abdmSendFailed')} / ${httpRes.status} - ${httpRes.statusText}`, 'error')
                        }
                    },
                    onerror: (_error) => {
                        createNotification('error', `${utils.getTranslation('abdmSendFailed')}, ${utils.getTranslation('checkPort')}`, 'error')
                    },
                    onabort: () => {
                        createAlert('error', `${utils.getTranslation('unknownError')}, Aborted.`)
                    },
                })
            })
        },
        // Aria2 related
        getAria2RpcConfig() {
            return {
                address: utils.getValue(ARIA2_RPC_CONFIG.rpcAddress),
                secret: utils.getValue(ARIA2_RPC_CONFIG.rpcSecret),
                dir: utils.getValue(ARIA2_RPC_CONFIG.rpcDir).trim() === '' ? undefined : utils.getValue(ARIA2_RPC_CONFIG.rpcDir),
            }
        },
        resetRPCConfig() {
            DEFAULT_CONFIGS.rpcSettings.forEach((item) => {
                utils.setValue(item.name, item.value)
                createNotification(utils.getTranslation('success'), `${utils.getTranslation('reset')} ${item.name} ${utils.getTranslation('to')} "${item.value}"`)
            })
        },
        sendToRPC(fileLinks, cookie) {
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

            // AJAX
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
                                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('rpcSendFailed')} / ${item.error.code} - ${item.error.message}`, 'error')
                                } else {
                                    createNotification(utils.getTranslation('success'), `${utils.getTranslation('rpcSendSuccess')} / ${item.result}`)
                                }
                            })
                        } catch (error) {
                            createNotification(utils.getTranslation('error'), `${error.toString()}`, 'error')
                        }
                    } else {
                        createNotification(utils.getTranslation('error'), `${utils.getTranslation('rpcSendFailed')} / ${httpRes.status} - ${httpRes.statusText}`, 'error')
                    }
                },
                onerror: (error) => {
                    createNotification(utils.getTranslation('error'), JSON.stringify(error), 'error')
                },
                onabort: () => {
                    createAlert('error', `${utils.getTranslation('unknownError')}, Aborted.`)
                },
            })
        },
        // IDM related
        downloadFile(content, format) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            // generate file name by timestamp
            link.download = `${appdata.fileManager.mainContent.data.name} - ${new Date().getTime()}.${format.value}`
            link.click()
            URL.revokeObjectURL(url)
        },
        // DOM related
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
            let exportAllText, exportSelectedText, exportAllIconClass, exportSelectedIconClass

            switch (format.name) {
                case 'ABDM':
                case 'Aria2':
                    exportAllText = utils.getTranslation('sendAll')
                    exportAllIconClass = ICON_CLASS.sendAll
                    exportSelectedText = utils.getTranslation('sendSelected')
                    exportSelectedIconClass = ICON_CLASS.sendSelected
                    break
                case 'IDM':
                    exportAllText = utils.getTranslation('exportAll')
                    exportAllIconClass = ICON_CLASS.exportAll
                    exportSelectedText = utils.getTranslation('exportSelected')
                    exportSelectedIconClass = ICON_CLASS.exportSelected
                    break
                default:
                    exportAllText = utils.getTranslation('downloadAll')
                    exportAllIconClass = ICON_CLASS.downloadAll
                    exportSelectedText = utils.getTranslation('downloadSelected')
                    exportSelectedIconClass = ICON_CLASS.downloadSelected
                    break
            }

            // create export buttons
            const exportAllButton = document.createElement('li')
            const exportSelectedButton = document.createElement('li')

            // set innerHTML
            exportAllButton.innerHTML = this.getButtonTemplate(exportAllIconClass, exportAllText)
            exportSelectedButton.innerHTML = this.getButtonTemplate(exportSelectedIconClass, exportSelectedText)

            // add click event for each button
            exportAllButton.addEventListener('click', operations.handleExport.bind(null, false, format))
            exportSelectedButton.addEventListener('click', operations.handleExport.bind(null, true, format))

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getCustomButtonDom(type, format) {
            // type: settings, reset, test...
            // format: direct, abdm, rpc, ef2...

            const iconClass = ICON_CLASS[type] || ICON_CLASS.settings
            const buttonText = format ? `${utils.getTranslation(type)} ${format.toUpperCase()}` : utils.getTranslation(type)

            return this.getButtonTemplate(iconClass, buttonText)
        },
        // DOM ABDM related
        getABDMButtons() {
            // ABDM settings button
            const abdmSettingsButton = document.createElement('div')
            abdmSettingsButton.innerHTML = utils.getCustomButtonDom('config', 'abdm')

            abdmSettingsButton.addEventListener('click', () => {
                createPopup({
                    title: utils.getTranslation('abdmSettings'),
                    content: utils.getConfigPanel('ABDM', ABDM_CONFIG, ABDM_HOEMPAGE_URL),
                    icon: 'fas fa-gears',
                })

                const form = document.forms['GofileEnhanced_Form_ABDM']

                if (form) {
                    form.addEventListener('submit', (event) => {
                        event.preventDefault()
                        Object.keys(ABDM_CONFIG).forEach((key) => {
                            utils.setValue(ABDM_CONFIG[key], form.elements[ABDM_CONFIG[key]].value)
                        })
                        closePopup()
                    })
                }
            })

            const testABDMButton = document.createElement('div')
            testABDMButton.innerHTML = utils.getCustomButtonDom('test', 'abdm')
            testABDMButton.addEventListener('click', () => {
                utils.testABDMConnection()
            })

            return [abdmSettingsButton, testABDMButton]
        },
        // DOM Aria2 related
        getAria2Buttons() {
            // create rpc settings button
            const rpcSettingsButton = document.createElement('div')
            rpcSettingsButton.innerHTML = utils.getCustomButtonDom('config', 'rpc')
            // click rpc settings button to open modal
            rpcSettingsButton.addEventListener('click', () => {
                createPopup({
                    title: utils.getTranslation('aria2RpcSettings'),
                    content: utils.getConfigPanel('RPC', ARIA2_RPC_CONFIG, ARIA2_RPC_TUTORIAL_URL),
                    icon: 'fas fa-gears',
                })

                const form = document.forms['GofileEnhanced_Form_RPC']

                if (form) {
                    form.addEventListener('submit', (event) => {
                        event.preventDefault()
                        Object.keys(ARIA2_RPC_CONFIG).forEach((key) => {
                            utils.setValue(ARIA2_RPC_CONFIG[key], form.elements[ARIA2_RPC_CONFIG[key]].value)
                        })
                        closePopup()
                    })
                }
            })

            const rpcResetButton = document.createElement('div')
            rpcResetButton.innerHTML = utils.getCustomButtonDom('reset', 'rpc')
            rpcResetButton.addEventListener('click', () => {
                utils.resetRPCConfig()
            })

            return [rpcSettingsButton, rpcResetButton]
        },
        getButtonsByFormat(format) {
            let elements = this.getRegularButtons(format)

            switch (format.name) {
                case 'ABDM':
                    elements = [...elements, ...this.getABDMButtons()]
                    break
                case 'Aria2':
                    elements = [...elements, ...this.getAria2Buttons()]
                    break
                default:
                    break
            }

            return [this.getHrLine(), ...elements]
        },
        getFormInputItemTemplate(name, i18nKey) {
            const aria2RPCPlaceholder = {
                rpcAddress: utils.getTranslation('rpcAddressPlaceholder'),
                rpcSecret: utils.getTranslation('rpcSecretPlaceholder'),
                rpcDir: utils.getTranslation('rpcDirPlaceholder'),
            }

            const abdmPlaceholder = {
                abdmPort: utils.getTranslation('abdmPortPlaceholder'),
            }

            const placeholder = aria2RPCPlaceholder[i18nKey] || abdmPlaceholder[i18nKey] || ''

            return `
            <div class="space-y-2">
                <label for="${name}" class="block text-sm font-medium text-gray-300">
                    ${utils.getTranslation(i18nKey)}
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="fas ${ICON_CLASS[i18nKey]} text-gray-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="${name}" 
                        name="${name}" 
                        class="w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2
                            focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 text-white placeholder-gray-400"
                        value="${utils.getValue(name)}"
                        placeholder="${placeholder}"
                    >
                </div>
            </div>
            `
        },
        getConfigPanel(ID, CONFIG, TITLE) {
            return `
            <div class="space-y-4">
                <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <p class="text-gray-300 text-sm">
                            <a href="${TITLE}" target="_blank" rel="noopener noreferrer"> ${TITLE} </a>
                        </p>
                    </div>
                </div>

                <form id="GofileEnhanced_Form_${ID}" class="space-y-4">

                ${Object.keys(CONFIG)
                    .map((key) => this.getFormInputItemTemplate(CONFIG[key], key))
                    .join('')}

                    <button
                        id="GofileEnhanced_${ID}_Submit"
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
            const tbdItems = tbdKeys.map((key) => allFiles[key])
            const tbdLinks = tbdKeys.map((key) => allFiles[key].link)

            switch (format.name) {
                case 'Direct':
                    utils.goDirectLink(tbdLinks)
                    break
                case 'ABDM':
                    utils.sendToABDM(tbdItems, cookie)
                    break
                case 'Aria2':
                    utils.sendToRPC(tbdLinks, cookie)
                    break
                case 'IDM':
                    const IDMLinks = tbdLinks
                        .map((link) => {
                            return `<${CRLF}${link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                        })
                        .join('')
                    utils.downloadFile(IDMLinks, format)
                    break
                default:
                    createNotification(utils.getTranslation('error'), `${format.name} ${utils.getTranslation('unSupportedFormat')}`, 'error')
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
