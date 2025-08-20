// ==UserScript==
// @name         GoFile 增强
// @name:en      GoFile Enhanced
// @namespace    https://github.com/ewigl/gofile-enhanced
// @version      0.7.0
// @description  GoFile 文件批量下载。可以配合 AB Download Manager、Aria2、Gopeed、IDM 等下载器使用。
// @description:en  Directly batch-download GoFiles, with built-in support for download managers like AB Download Manager, Aria2, Gopeed, and IDM.
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

    const SUPPORTED_DOWNLOADERS = ['Direct', 'ABDM', 'Aria2', 'IDM']

    const DEFAULT_LANGUAGE = 'en-US'
    const CRLF = '\r\n'

    const GE_CONTAINER_ID = 'GofileEnhanced_Container'
    const GE_GORM_ID_PREFIX = 'GofileEnhanced_Form'

    const I18N = {
        'zh-CN': {
            abdm_connected: 'ABDM 连接成功',
            abdm_connection_fail: 'ABDM 连接失败',
            abdm_port: 'ABDM 端口',
            abdm_port_not_configured: 'ABDM 端口未配置',
            abdm_port_placeholder: '默认为 15151',
            aria2_connected: 'Aria2 连接成功',
            aria2_connection_fail: 'Aria2 连接失败',
            aria2_rpc_address: 'Aria2 RPC 地址',
            aria2_rpc_address_placeholder: '默认为 http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC 密钥',
            aria2_rpc_secret_placeholder: '若未设置留空即可',
            aria2_rpc_dir: 'Aria2 RPC 目录',
            aria2_rpc_dir_placeholder: '若留空则使用 Aria2 默认设置',
            cancel: '取消',
            config: '配置',
            confirm: '确定',
            download_all: '下载全部',
            download_selected: '下载选中',
            empty_folder: '文件夹为空',
            empty_folder_description: '当前文件夹内容为空',
            error: '错误',
            export_all: '导出全部',
            export_selected: '导出选中',
            failed_to_send_to_abdm: '未成功发送至 ABDM',
            failed_to_send_to_aria2: '未成功发送至 Aria2',
            id: 'ID',
            no_file_selected: '未选择文件',
            no_file_selected_description: '请至少选择一个文件',
            recursion_download: '递归下载',
            reset_aria2: '重置 Aria2',
            send_all: '发送全部',
            send_selected: '发送选中',
            success: '成功',
            successfully_reset: '已重置',
            successfully_sent_to_abdm: '已成功发送至 ABDM',
            successfully_sent_to_aria2: '已成功发送至 Aria2',
            test_abdm: '测试 ABDM',
            test_aria2: '测试 Aria2',
            unknown_error: '未知错误',
            request_aborted: '请求中断',
            request_timed_out: '请求超时',
        },
        'en-US': {
            abdm_connected: 'ABDM connected successfully',
            abdm_connection_fail: 'ABDM connection failed',
            abdm_port: 'ABDM Port',
            abdm_port_not_configured: 'ABDM port not configured',
            abdm_port_placeholder: 'Default is 15151',
            aria2_connected: 'Aria2 connected successfully',
            aria2_connection_fail: 'Aria2 connection failed',
            aria2_rpc_address: 'Aria2 RPC Address',
            aria2_rpc_address_placeholder: 'Default is http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC Secret',
            aria2_rpc_secret_placeholder: 'Leave empty if not set',
            aria2_rpc_dir: 'Aria2 RPC Directory',
            aria2_rpc_dir_placeholder: 'Leave empty to use Aria2 default settings',
            cancel: 'Cancel',
            config: 'Config',
            confirm: 'Confirm',
            download_all: 'Download All',
            download_selected: 'Download Selected',
            empty_folder: 'Empty Folder',
            empty_folder_description: 'The current folder is empty',
            error: 'Error',
            export_all: 'Export All',
            export_selected: 'Export Selected',
            failed_to_send_to_abdm: 'Failed to send to ABDM',
            failed_to_send_to_aria2: 'Failed to send to Aria2',
            id: 'ID',
            no_file_selected: 'No File Selected',
            no_file_selected_description: 'Please select at least one file',
            reset_aria2: 'Reset Aria2',
            recursion_download: 'Recursion Download',
            send_all: 'Send All',
            send_selected: 'Send Selected',
            success: 'Success',
            successfully_reset: 'successfully reset',
            successfully_sent_to_abdm: 'successfully sent to ABDM',
            successfully_sent_to_aria2: 'successfully sent to Aria2',
            test_abdm: 'Test ABDM',
            test_aria2: 'Test Aria2',
            unknown_error: 'Unknown Error',
            request_aborted: 'Request Aborted',
            request_timed_out: 'Request Timed Out',
        },
    }

    const ICONS = {
        circle_down_s: 'fas fa-circle-down',
        circle_down_r: 'far fa-circle-down',
        circle_nodes_s: 'fas fa-circle-nodes',
        file_s: 'fas fa-file',
        file_r: 'far fa-file',
        folder_s: 'fas fa-folder',
        gear_s: 'fas fa-gear',
        google_plus: 'fa-brands fa-google-plus',
        key_s: 'fas fa-key',
        link_s: 'fas fa-link',
        plane_s: 'fas fa-paper-plane',
        plane_r: 'far fa-paper-plane',
        plug_s: 'fas fa-plug',
        rotate_left_s: 'fas fa-rotate-left',
    }

    const GE_CONFIG = {
        ABDM: {
            name: 'ABDM',
            id: 'ABDM',
            desc: 'AB Download Manager',
            homepage: 'https://github.com/amir1376/ab-download-manager',
            settings: {
                abdmPort: {
                    key: 'abdm_port',
                    defaultValue: '15151',
                    i18nKey: 'abdm_port',
                    icon: ICONS.plug_s,
                    placeholderI18nKey: 'abdm_port_placeholder',
                },
            },
        },
        Aria2: {
            name: 'Aria2',
            id: 'Aria2',
            desc: 'Aria2 RPC Interface',
            homepage: 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface',
            settings: {
                rpcAddress: {
                    key: 'aria2_rpc_address',
                    defaultValue: 'http://localhost:6800/jsonrpc',
                    i18nKey: 'aria2_rpc_address',
                    icon: ICONS.link_s,
                    placeholderI18nKey: 'aria2_rpc_address_placeholder',
                },
                rpcSecret: {
                    key: 'aria2_rpc_secret',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_secret',
                    icon: ICONS.key_s,
                    placeholderI18nKey: 'aria2_rpc_secret_placeholder',
                },
                rpcDir: {
                    key: 'aria2_rpc_dir',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_dir',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'aria2_rpc_dir_placeholder',
                },
            },
        },
    }

    const utils = {
        getValue: (name) => GM_getValue(name),
        setValue(name, value) {
            GM_setValue(name, value)
        },
        gmFetch(url, options = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url,
                    headers: options.headers || {},
                    data: options.body || null,
                    responseType: options.responseType || 'text',
                    onload: (response) => {
                        resolve({
                            ok: response.status >= 200 && response.status < 300,
                            status: response.status,
                            statusText: response.statusText,
                            url: response.finalUrl,
                            text: () => Promise.resolve(response.responseText),
                            json: () => Promise.resolve(JSON.parse(response.responseText)),
                            xml: () => Promise.resolve(response.responseXML),
                            raw: response,
                        })
                    },
                    onerror: (err) => reject(err),
                    ontimeout: () => reject(new Error(utils.getTranslation('request_timed_out'))),
                    onabort: () => reject(new Error(utils.getTranslation('request_aborted'))),
                })
            })
        },
        getSettings(category, settingKey) {
            const setting = GE_CONFIG[category].settings[settingKey]
            return utils.getValue(setting.key) ?? setting.defaultValue
        },
        setSettings(category, settingKey, value) {
            const setting = GE_CONFIG[category].settings[settingKey]
            utils.setValue(setting.key, value)
        },
        getAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            return Object.keys(settings).reduce((acc, key) => {
                acc[key] = utils.getSettings(category, key)
                return acc
            }, {})
        },
        resetAllSettings(category) {
            const settings = GE_CONFIG[category].settings
            Object.keys(settings).forEach((key) => {
                const setting = settings[key]
                utils.setValue(setting.key, setting.defaultValue)
                createNotification(utils.getTranslation('success'), `${utils.getTranslation(setting.i18nKey)} ${utils.getTranslation('successfully_reset')}`)
            })
        },
        initSettings() {
            Object.keys(GE_CONFIG).forEach((category) => {
                const settings = GE_CONFIG[category].settings
                Object.keys(settings).forEach((key) => {
                    const setting = settings[key]
                    if (utils.getValue(setting.key) === undefined) {
                        utils.setValue(setting.key, setting.defaultValue)
                    }
                })
            })
        },
        getTranslation(key) {
            const lang = I18N[navigator.language] ? navigator.language : DEFAULT_LANGUAGE
            return I18N[lang][key] || key
        },
        getToken: () => document.cookie,
        goDirectLink(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        sendToABDM(tbdItems, cookie) {
            const abdmPort = utils.getSettings('ABDM', 'abdmPort')

            if (!abdmPort) {
                return createNotification('error', utils.getTranslation('abdm_port_not_configured'), 'error')
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

            postDatas.forEach(async (data) => {
                try {
                    const res = await utils.gmFetch(`http://localhost:${abdmPort}/start-headless-download`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data),
                    })
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), `${data.name} ${utils.getTranslation('successfully_sent_to_abdm')}`, 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${data.name} ${utils.getTranslation('failed_to_send_to_abdm')} / ${res.status} - ${res.statusText}`, 'error')
                    }
                } catch (error) {
                    createNotification(utils.getTranslation('error'), `${data.name}  ${utils.getTranslation('failed_to_send_to_abdm')}`, 'error')
                }
            })
        },
        async testABDMConnection() {
            const port = utils.getSettings('ABDM', 'abdmPort')

            if (port) {
                try {
                    const res = await utils.gmFetch(`http://localhost:${port}/ping`)
                    if (res.ok) {
                        createNotification(utils.getTranslation('success'), utils.getTranslation('abdm_connected'), 'success')
                    } else {
                        createNotification(utils.getTranslation('error'), `${utils.getTranslation('abdm_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                    }
                } catch (e) {
                    createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_connection_fail'), 'error')
                }
            } else {
                createNotification('error', utils.getTranslation('abdm_not_configured'), 'error')
            }
        },
        async testAria2Connection() {
            const { rpcAddress, rpcSecret } = utils.getAllSettings('Aria2')

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify({
                        id: new Date().getTime(),
                        jsonrpc: '2.0',
                        method: 'aria2.getVersion',
                        params: [`token:${rpcSecret}`],
                    }),
                })

                if (res.ok) {
                    createNotification(utils.getTranslation('success'), utils.getTranslation('aria2_connected'), 'success')
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('aria2_connection_fail')} / ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('aria2_connection_fail'), 'error')
            }
        },
        async sendToAria2(fileLinks, cookie) {
            const { rpcAddress, rpcSecret, rpcDir } = utils.getAllSettings('Aria2')

            const header = [`Cookie: ${cookie}`]

            const rpcData = fileLinks.map((link) => {
                return {
                    id: new Date().getTime(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${rpcSecret}`,
                        [link],
                        {
                            header,
                            dir: rpcDir,
                        },
                    ],
                }
            })

            try {
                const res = await utils.gmFetch(rpcAddress, {
                    method: 'POST',
                    body: JSON.stringify(rpcData),
                })

                if (res.ok) {
                    const responseArray = await res.json()

                    responseArray.forEach((item) => {
                        if (item.error) {
                            createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} / ${item.error.code} - ${item.error.message}`, 'error')
                        } else {
                            createNotification(utils.getTranslation('success'), `${utils.getTranslation('successfully_sent_to_aria2')} / ${utils.getTranslation('id')}: ${item.result}`)
                        }
                    })
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} /  ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('failed_to_send_to_aria2'), 'error')
            }
        },
        saveAsFile(content, fileExtension) {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${appdata.fileManager.mainContent.data.name}.${fileExtension}`
            link.click()
            URL.revokeObjectURL(url)
        },
        getHrLine() {
            const hrLine = document.createElement('li')
            hrLine.classList.add('border-b', 'border-gray-700')
            return hrLine
        },
        getButtonTemplate(icon, text) {
            return `
            <a href="javascript:void(0)" class="hover:text-blue-500 flex items-center gap-2" aria-label="${text}">
                <i class="${icon}"></i>
                ${text}
            </a>
            `
        },
        createButton(options = {}) {
            const { icon, text, onClick } = options

            const button = document.createElement('li')
            button.innerHTML = utils.getButtonTemplate(icon, text)

            if (onClick) {
                button.addEventListener('click', onClick)
            }

            return button
        },
        getRegularButtons(format) {
            // Header
            const formatTitleElement = document.createElement('li')
            formatTitleElement.innerHTML = `
            <span class="flex items-center gap-2 text-blue-500 font-bold">
                <i class="${ICONS.google_plus}"></i>
                ${format}
            </span>
            `

            let exportAllText, exportSelectedText, exportAllIcon, exportSelectedIcon

            switch (format) {
                case 'ABDM':
                case 'Aria2':
                    exportAllText = utils.getTranslation('send_all')
                    exportAllIcon = ICONS.plane_s
                    exportSelectedText = utils.getTranslation('send_selected')
                    exportSelectedIcon = ICONS.plane_r
                    break
                case 'IDM':
                    exportAllText = utils.getTranslation('export_all')
                    exportAllIcon = ICONS.file_s
                    exportSelectedText = utils.getTranslation('export_selected')
                    exportSelectedIcon = ICONS.file_r
                    break
                default:
                    exportAllText = utils.getTranslation('download_all')
                    exportAllIcon = ICONS.circle_down_s
                    exportSelectedText = utils.getTranslation('download_selected')
                    exportSelectedIcon = ICONS.circle_down_r
                    break
            }

            const exportAllButton = utils.createButton({
                text: exportAllText,
                icon: exportAllIcon,
                onClick: operations.handleExport.bind(null, false, format),
            })

            const exportSelectedButton = utils.createButton({
                text: exportSelectedText,
                icon: exportSelectedIcon,
                onClick: operations.handleExport.bind(null, true, format),
            })

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getSpecialButtons(downloader) {
            const additionalButtons = []

            const settingsPanleTitle = utils.getTranslation(`${downloader.toLowerCase()}Settings`)
            const settingsButton = utils.createButton({
                icon: ICONS.gear_s,
                text: `${utils.getTranslation('config')} ${downloader}`,
                onClick: () => {
                    createPopup({
                        title: settingsPanleTitle,
                        content: utils.getConfigPanel(downloader),
                        icon: ICONS.gear_s,
                    })

                    const form = document.forms[`${GE_GORM_ID_PREFIX}_${downloader}`]

                    if (form) {
                        form.addEventListener('submit', (event) => {
                            event.preventDefault()

                            Object.entries(GE_CONFIG[downloader].settings).forEach(([settingKey, _value]) => {
                                utils.setSettings(downloader, settingKey, form.elements[_value.key].value)
                            })

                            closePopup()
                        })
                    }
                },
            })

            const testABDMButton = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_abdm'),
                onClick: () => {
                    utils.testABDMConnection()
                },
            })

            const testAria2Button = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_aria2'),
                onClick: () => {
                    utils.testAria2Connection()
                },
            })

            const rpcResetButton = utils.createButton({
                icon: ICONS.rotate_left_s,
                text: utils.getTranslation('reset_aria2'),
                onClick: () => {
                    utils.resetAllSettings('Aria2')
                },
            })

            switch (downloader) {
                case 'ABDM':
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testABDMButton)
                    break
                case 'Aria2':
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testAria2Button)
                    additionalButtons.push(rpcResetButton)
                    break
                default:
                    break
            }

            return additionalButtons
        },
        getButtonsByDownloader(downloader) {
            const regularButtons = utils.getRegularButtons(downloader)

            const additionalButtons = utils.getSpecialButtons(downloader)

            return [utils.getHrLine(), ...regularButtons, ...additionalButtons]
        },
        getFormInputItemTemplate(setting) {
            const { key, i18nKey, icon, placeholderI18nKey } = setting

            return `
            <div class="space-y-2">
                <label for="${key}" class="block text-sm font-medium text-gray-300">
                    ${utils.getTranslation(i18nKey)}
                </label>
                <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i class="${icon} text-gray-400"></i>
                    </div>
                    <input 
                        type="text" 
                        id="${key}" 
                        key="${key}" 
                        class="w-full pl-10 pr-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2
                            focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition duration-200 text-white placeholder-gray-400"
                        value="${utils.getValue(key)}"
                        title="${utils.getTranslation(placeholderI18nKey)}"
                    >
                </div>
            </div>
            `
        },
        getConfigPanel(category) {
            const config = GE_CONFIG[category]

            return `
                <div class="space-y-4">
                    <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                            <p class="text-gray-300 text-sm">
                                <a href="${config.homepage}" target="_blank" rel="noopener noreferrer"> ${config.homepage} </a>
                            </p>
                        </div>
                    </div>

                    <form id="${GE_GORM_ID_PREFIX}_${config.id}" class="space-y-4">

                    ${Object.entries(config.settings)
                        .map(([_key, setting]) => utils.getFormInputItemTemplate(setting))
                        .join('')}

                        <button
                            id="GofileEnhanced_${config.id}_Submit"
                            type="submit"
                            class="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300
                                ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2"
                        >
                            <i class="fas fa-check"></i>
                            <span> ${utils.getTranslation('confirm')} </span>
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
            const tbdKeys = fileKeys.filter((key) => allFiles[key].type === 'file')

            if (tbdKeys.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('no_file_selected') : utils.getTranslation('empty_folder'),
                    selectMode ? utils.getTranslation('no_file_selected_description') : utils.getTranslation('empty_folder_description'),
                    'warning'
                )
            }

            const cookie = utils.getToken()
            const tbdItems = tbdKeys.map((key) => allFiles[key])
            const tbdLinks = tbdKeys.map((key) => allFiles[key].link)

            switch (format) {
                case 'Direct':
                    utils.goDirectLink(tbdLinks)
                    break
                case 'ABDM':
                    utils.sendToABDM(tbdItems, cookie)
                    break
                case 'Aria2':
                    utils.sendToAria2(tbdLinks, cookie)
                    break
                case 'IDM':
                    const IDMLinks = tbdLinks
                        .map((link) => {
                            return `<${CRLF}${link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                        })
                        .join('')
                    utils.saveAsFile(IDMLinks, 'ef2')
                    break
                default:
                    createNotification(utils.getTranslation('error'), `${format} ${utils.getTranslation('unSupportedFormat')}`, 'error')
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
            SUPPORTED_DOWNLOADERS.forEach((downloader) => {
                utils.getButtonsByDownloader(downloader).forEach((item) => {
                    container.appendChild(item)
                })
            })

            // append container to sidebar
            document.querySelector('#index_sidebar').appendChild(container)
        },
    }

    const main = {
        init() {
            utils.initSettings()

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

            // Observe the target node "#index_main", which is in the DOM initially.
            const targetNode = document.getElementById('index_main')
            const config = { childList: true, subtree: true }
            if (targetNode) {
                observer.observe(targetNode, config)
            } else {
                console.log('[Gofile Enhanced] #index_main not found.')
            }
        },
    }

    // Script Entry Point
    main.init()
})()
