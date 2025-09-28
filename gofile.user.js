// ==UserScript==
// @name               GoFile Enhanced
// @name:zh-CN         GoFile 增强
// @namespace          https://github.com/ewigl/gofile-enhanced
// @version            0.8.0
// @description        Directly batch-download GoFiles. Supports recursive folder download, Supports direct links. Built-in support for download managers like AB Download Manager, Aria2, and IDM.
// @description:zh-CN  GoFile 文件批量下载。支持递归下载文件夹内容、直链下载。可以配合 AB Download Manager、Aria2、IDM 等下载器使用。
// @author             Licht
// @license            MIT
// @homepage           https://github.com/ewigl/gofile-enhanced
// @homepageURL        https://github.com/ewigl/gofile-enhanced
// @match              http*://gofile.io/*
// @icon               https://gofile.io/dist/img/favicon16.png
// @connect            localhost
// @connect            *
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_xmlhttpRequest
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
            abdm_download_folder: 'ABDM 下载目录',
            abdm_download_folder_placeholder: '若留空则使用 ABDM 默认设置',
            abdm_port: 'ABDM 端口',
            abdm_port_not_configured: 'ABDM 端口未配置',
            abdm_port_placeholder: '默认为 15151',
            abdm_settings: ' AB Download Manager 设置',
            are_you_sure_to_download__these_files: '确定要下载下列文件吗？',
            aria2_connected: 'Aria2 连接成功',
            aria2_connection_fail: 'Aria2 连接失败',
            aria2_rpc_address: 'Aria2 RPC 地址',
            aria2_rpc_address_placeholder: '默认为 http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC 密钥',
            aria2_rpc_secret_placeholder: '若未设置留空即可',
            aria2_rpc_dir: 'Aria2 下载目录',
            aria2_rpc_dir_placeholder: '若留空则使用 Aria2 默认设置',
            aria2_settings: 'Aria2 设置',
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
            failed_to_fetch_folder_content: '获取文件夹内容失败',
            failed_to_send_to_abdm: '未成功发送至 ABDM',
            failed_to_send_to_aria2: '未成功发送至 Aria2',
            fetching_file_list: '正在获取文件列表',
            loading: '加载中...',
            loading_file_list: '正在加载文件列表',
            loading_please_wait: '正在加载，请稍候',
            no_file_selected: '未选择文件',
            no_file_selected_description: '请至少选择一个文件',
            please_make_sure_you_have_configured_download_folder: '请确保已正确配置下载目录。',
            recursive_download: '递归下载',
            reset_aria2: '重置 Aria2',
            send_all: '发送全部',
            send_selected: '发送选中',
            success: '成功',
            successfully_fetched_file_list: '成功获取文件列表',
            successfully_reset: '已重置',
            successfully_sent_to_abdm: '已成功发送至 ABDM',
            successfully_sent_to_aria2: '已成功发送至 Aria2',
            test_abdm: '测试 ABDM',
            test_aria2: '测试 Aria2',
            unknown_error: '未知错误',
            unsupported_format: '不支持的格式',
            request_aborted: '请求中断',
            request_timed_out: '请求超时',
        },
        'en-US': {
            abdm_connected: 'ABDM connected successfully',
            abdm_connection_fail: 'ABDM connection failed',
            abdm_download_folder: 'ABDM Download Folder',
            abdm_download_folder_placeholder: 'Leave empty to use ABDM default settings',
            abdm_port: 'ABDM Port',
            abdm_port_not_configured: 'ABDM port not configured',
            abdm_port_placeholder: 'Default is 15151',
            abdm_settings: 'AB Download Manager Settings',
            are_you_sure_to_download__these_files: 'Are you sure you want to download the following files?',
            aria2_connected: 'Aria2 connected successfully',
            aria2_connection_fail: 'Aria2 connection failed',
            aria2_rpc_address: 'Aria2 RPC Address',
            aria2_rpc_address_placeholder: 'Default is http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC Secret',
            aria2_rpc_secret_placeholder: 'Leave empty if not set',
            aria2_rpc_dir: 'Aria2 RPC Directory',
            aria2_rpc_dir_placeholder: 'Leave empty to use Aria2 default settings',
            aria2_settings: 'Aria2 Settings',
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
            failed_to_fetch_folder_content: 'Failed to fetch folder content',
            failed_to_send_to_abdm: 'Failed to send to ABDM',
            failed_to_send_to_aria2: 'Failed to send to Aria2',
            fetching_file_list: 'Fetching file list',
            loading: 'Loading...',
            loading_file_list: 'Loading file list',
            loading_please_wait: 'Loading, please wait',
            no_file_selected: 'No File Selected',
            no_file_selected_description: 'Please select at least one file',
            please_make_sure_you_have_configured_download_folder: 'Please make sure you have configured the download folder.',
            reset_aria2: 'Reset Aria2',
            recursive_download: 'Recursive Download',
            send_all: 'Send All',
            send_selected: 'Send Selected',
            success: 'Success',
            successfully_fetched_file_list: 'Successfully fetched file list',
            successfully_reset: 'successfully reset',
            successfully_sent_to_abdm: 'successfully sent to ABDM',
            successfully_sent_to_aria2: 'successfully sent to Aria2',
            test_abdm: 'Test ABDM',
            test_aria2: 'Test Aria2',
            unknown_error: 'Unknown Error',
            unsupported_format: 'Unsupported Format',
            request_aborted: 'Request Aborted',
            request_timed_out: 'Request Timed Out',
        },
    }

    const ICONS = {
        circle_down_s: 'fas fa-circle-down',
        circle_down_r: 'far fa-circle-down',
        circle_nodes_s: 'fas fa-circle-nodes',
        copy_s: 'fas fa-copy',
        copy_r: 'far fa-copy',
        file_s: 'fas fa-file',
        file_r: 'far fa-file',
        file_ziper_s: 'fas fa-file-zipper',
        file_ziper_r: 'far fa-file-zipper',
        folder_s: 'fas fa-folder',
        folder_r: 'far fa-folder',
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
                abdmDownloadFolder: {
                    key: 'abdm_download_folder',
                    defaultValue: '',
                    i18nKey: 'abdm_download_folder',
                    icon: ICONS.folder_s,
                    placeholderI18nKey: 'abdm_download_folder_placeholder',
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
        goDirectLinks(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        async collectAllItems() {
            createAlert('loading', utils.getTranslation('fetching_file_list'))

            const mainContentData = appdata.fileManager.mainContent.data
            const tbdItems = []

            const cookie = utils.getToken()
            const authorization =
                cookie
                    .split(';')
                    .find((row) => row.startsWith('accountToken='))
                    ?.split('=')[1] || ''
            const wt = appdata.wt

            const collectItems = async (contentData, parentPath = '') => {
                if (contentData.childrenCount > 0) {
                    for (const key of Object.keys(contentData.children)) {
                        const childItem = contentData.children[key]

                        const currentPath = `${parentPath}/${contentData.name}`

                        if (childItem.type === 'file') {
                            tbdItems.push({ ...childItem, downloadFolder: currentPath })
                        } else if (childItem.type === 'folder') {
                            if (childItem.childrenCount === 0) {
                                continue
                            }
                            try {
                                const res = await utils.gmFetch(`https://api.gofile.io/contents/${childItem.id}?wt=${wt}`, {
                                    method: 'GET',
                                    headers: {
                                        Authorization: `Bearer ${authorization}`,
                                    },
                                })

                                if (res.ok) {
                                    const data = await res.json()
                                    const currentContentData = data.data

                                    if (data.status === 'ok') {
                                        await collectItems(currentContentData, currentPath)
                                    } else {
                                        createNotification(
                                            utils.getTranslation('error'),
                                            `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}: ${data.message}`,
                                            'error'
                                        )
                                    }
                                } else {
                                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} / ${res.status} - ${res.statusText}`, 'error')
                                }
                            } catch (error) {
                                createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}`, 'error')
                            }
                        }
                    }
                }
            }

            await collectItems(mainContentData)
            closePopup()

            return { items: tbdItems }
        },
        recursiveDownload(tbdItems, callback) {
            const fileItems = tbdItems.map((item) => {
                return {
                    name: item.name,
                    path: item.downloadFolder || '',
                }
            })
            const fileList = fileItems.map((file) => `<p>${file.path}/<span class="text-blue-500">${file.name}</span></p>`).sort()

            createPopup({
                title: utils.getTranslation('successfully_fetched_file_list'),
                content: `
                    <div class="space-y-4">
                        <div class="bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-4">
                            <div class="flex items-center space-x-3">
                                <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                                <p class="text-gray-300 text-sm">
                                    <span>${utils.getTranslation('are_you_sure_to_download__these_files')}</span>
                                    <span>${utils.getTranslation('please_make_sure_you_have_configured_download_folder')}</span>
                                </p>
                            </div>
                        </div>
                        
                        <form id="${GE_GORM_ID_PREFIX}_FILE_LIST" class="space-y-4">
                        
                            ${fileList.join('')}

                            <button
                                type="submit"
                                class="w-full py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300
                                    ease-in-out text-center text-white font-semibold flex items-center justify-center space-x-2"
                            >
                                <i class="fas fa-check"></i>
                                <span> ${utils.getTranslation('confirm')} </span>
                            </button>
                        </form>
                    </div>
                `,
                icon: ICONS.copy_s,
            })

            const form = document.forms[`${GE_GORM_ID_PREFIX}_FILE_LIST`]

            if (form) {
                form.addEventListener('submit', (event) => {
                    event.preventDefault()

                    callback()

                    closePopup()
                })
            }
        },
        sendToABDM(tbdItems) {
            const { abdmPort, abdmDownloadFolder } = utils.getAllSettings('ABDM')
            const cookie = utils.getToken()

            if (!abdmPort) {
                return createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_port_not_configured'), 'error')
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
                    folder: item.downloadFolder || abdmDownloadFolder,
                }
            })

            postDatas.forEach(async (data) => {
                try {
                    const res = await utils.gmFetch(`http://localhost:${abdmPort}/start-headless-download`, {
                        method: 'POST',
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
                createNotification(utils.getTranslation('error'), utils.getTranslation('abdm_not_configured'), 'error')
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
        async sendToAria2(tbdItems) {
            const { rpcAddress, rpcSecret, rpcDir } = utils.getAllSettings('Aria2')

            const cookie = utils.getToken()

            const header = [`Cookie: ${cookie}`]

            const rpcData = tbdItems.map((item) => {
                return {
                    id: new Date().getTime(),
                    jsonrpc: '2.0',
                    method: 'aria2.addUri',
                    params: [
                        `token:${rpcSecret}`,
                        [item.link],
                        {
                            header,
                            dir: item.downloadFolder || rpcDir,
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
                            createNotification(utils.getTranslation('success'), `${utils.getTranslation('successfully_sent_to_aria2')} / ID: ${item.result}`)
                        }
                    })
                } else {
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('failed_to_send_to_aria2')} /  ${res.status} - ${res.statusText}`, 'error')
                }
            } catch (e) {
                createNotification(utils.getTranslation('error'), utils.getTranslation('failed_to_send_to_aria2'), 'error')
            }
        },
        exportToIDM(tbdItems) {
            const cookie = utils.getToken()
            const IDMFormatContent = tbdItems
                .map((item) => {
                    return `<${CRLF}${item.link}${CRLF}cookie: ${cookie}${CRLF}>${CRLF}`
                })
                .join('')

            utils.saveAsFile(IDMFormatContent, 'ef2')
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
                onClick: operations.handleExport.bind(null, {
                    selectMode: false,
                    format,
                }),
            })

            const exportSelectedButton = utils.createButton({
                text: exportSelectedText,
                icon: exportSelectedIcon,
                onClick: operations.handleExport.bind(null, {
                    selectMode: true,
                    format,
                }),
            })

            return [formatTitleElement, exportAllButton, exportSelectedButton]
        },
        getSpecialButtons(downloader) {
            const additionalButtons = []

            const settingsPanleTitle = utils.getTranslation(`${downloader.toLowerCase()}_settings`)
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

            const abdmRecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'ABDM',
                }),
            })

            const testABDMButton = utils.createButton({
                icon: ICONS.circle_nodes_s,
                text: utils.getTranslation('test_abdm'),
                onClick: () => {
                    utils.testABDMConnection()
                },
            })

            const aria2RecursiveDownloadButton = utils.createButton({
                text: utils.getTranslation('recursive_download'),
                icon: ICONS.copy_s,
                onClick: operations.handleExport.bind(null, {
                    enableRecursion: true,
                    format: 'Aria2',
                }),
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
                    additionalButtons.push(abdmRecursiveDownloadButton)
                    additionalButtons.push(settingsButton)
                    additionalButtons.push(testABDMButton)
                    break
                case 'Aria2':
                    additionalButtons.push(aria2RecursiveDownloadButton)
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
        async handleExport(options) {
            const { selectMode, format, enableRecursion } = options
            const abdmDownloadFolder = utils.getSettings('ABDM', 'abdmDownloadFolder')
            const aria2RpcDir = utils.getSettings('Aria2', 'rpcDir')

            let tbdItems = []

            if (enableRecursion) {
                const { items } = await utils.collectAllItems()
                tbdItems = items
            } else {
                const allFiles = appdata.fileManager.mainContent.data.children

                const selectedKeys = appdata.fileManager.contentsSelected
                // all file keys or selected file keys
                const fileKeys = Object.keys(selectMode ? selectedKeys : allFiles)
                // to be downloaded keys
                const tbdKeys = fileKeys.filter((key) => allFiles[key].type === 'file')

                tbdItems = tbdKeys.map((key) => allFiles[key])
            }

            if (tbdItems.length === 0) {
                return createNotification(
                    selectMode ? utils.getTranslation('no_file_selected') : utils.getTranslation('empty_folder'),
                    selectMode ? utils.getTranslation('no_file_selected_description') : utils.getTranslation('empty_folder_description'),
                    'warning'
                )
            }

            switch (format) {
                case 'Direct':
                    utils.goDirectLinks(tbdItems.map((item) => item.link))
                    break
                case 'ABDM':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToABDM(tbdItems.map((item) => ({ ...item, downloadFolder: abdmDownloadFolder + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToABDM(tbdItems)
                    }
                    break
                case 'Aria2':
                    if (enableRecursion) {
                        utils.recursiveDownload(tbdItems, () => {
                            utils.sendToAria2(tbdItems.map((item) => ({ ...item, downloadFolder: aria2RpcDir + item.downloadFolder })))
                        })
                    } else {
                        utils.sendToAria2(tbdItems)
                    }
                    break
                case 'IDM':
                    utils.exportToIDM(tbdItems)
                    break
                default:
                    createNotification(utils.getTranslation('error'), `${utils.getTranslation('unsupported_format')}`, 'error')
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
                console.error('[Gofile Enhanced] #index_main not found.')
            }
        },
    }

    // Script Entry Point
    main.init()
})()
