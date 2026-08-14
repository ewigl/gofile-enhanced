// ==UserScript==
// @name               GoFile Enhanced
// @name:zh-CN         GoFile 增强
// @namespace          https://github.com/ewigl/gofile-enhanced
// @version            0.9.0
// @description        Batch-download GoFiles. Folder download. Automatically bypass high traffic alert. Use direct links. Built-in support for download managers like AB Download Manager, Aria2, and IDM.
// @description:zh-CN  GoFile 文件批量下载。支持直链下载、下载文件夹内容、绕过流量警告。可以配合 AB Download Manager、Aria2、IDM 等下载器使用。
// @author             Licht
// @license            MIT
// @homepage           https://github.com/ewigl/gofile-enhanced
// @homepageURL        https://github.com/ewigl/gofile-enhanced
// @match              http*://gofile.io/*
// @icon               https://gofile.io/assets/img/favicon32.png
// @connect            localhost
// @connect            *
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM_xmlhttpRequest
// @grant              unsafeWindow
// ==/UserScript==

; (async function () {
    'use strict'

    // import modules from gofile.io
    const contentsModule = await import('/js/services/contents.js');
    const menuModule = await import('/js/ui/menu.js');
    const popupModule = await import('/js/ui/popup.js');
    const toastModule = await import('/js/ui/toast.js');

    const contents = contentsModule;
    const { openMenu } = menuModule;
    const { popup } = popupModule
    const { toast } = toastModule;

    const DEFAULT_LANGUAGE = 'en-US'
    const CRLF = '\r\n'

    const GE_CONTAINER_ID = 'ge-container-bar'
    const GE_FORM_ID_PREFIX = 'gofile-enhenced-form'

    const I18N = {
        'zh-CN': {
            abdm_apikey: "ABDM API Key",
            abdm_apikey_placeholder: "若未设置留空即可",
            abdm_connected: 'ABDM 连接成功',
            abdm_connection_fail: 'ABDM 连接失败',
            abdm_download_folder: 'ABDM 下载目录',
            abdm_download_folder_placeholder: '',
            abdm_port: 'ABDM 端口',
            abdm_port_not_configured: 'ABDM 端口未配置',
            abdm_port_placeholder: '默认为 15151',
            abdm_settings: ' AB Download Manager 设置',
            aria2_connected: 'Aria2 连接成功',
            aria2_connection_fail: 'Aria2 连接失败',
            aria2_rpc_address: 'Aria2 RPC 地址',
            aria2_rpc_address_placeholder: '默认为 http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC 密钥',
            aria2_rpc_secret_placeholder: '若未设置留空即可',
            aria2_rpc_dir: 'Aria2 下载目录',
            aria2_rpc_dir_placeholder: '',
            aria2_settings: 'Aria2 设置',
            cancel: '取消',
            config: '配置',
            confirm: '确定',
            download: "下载",
            download_method: '下载方式',
            error: '错误',
            failed_to_fetch_folder_content: '获取文件夹内容失败',
            failed_to_send_to_abdm: '未成功发送至 ABDM',
            failed_to_send_to_aria2: '未成功发送至 Aria2',
            fetching_file_list: '正在获取文件列表',
            file_list: "文件列表",
            folder_download: "文件夹下载",
            no_item_selected: '未选择文件',
            please_make_sure_you_have_configured_download_folder: '下载前请确保已正确配置下载目录。',
            reference: "参考",
            reset_aria2: '默认设置',
            success: '成功',
            successfully_fetched_file_list: '成功获取文件列表',
            successfully_reset: '已重置',
            successfully_sent_to_abdm: '已成功发送至 ABDM',
            successfully_sent_to_aria2: '已成功发送至 Aria2',
            test_connection: "测试连接",
            unsupported_format: '不支持的格式',
            request_aborted: '请求中断',
            request_timed_out: '请求超时',
        },
        'en-US': {
            abdm_apikey: "ABDM API Key",
            abdm_apikey_placeholder: "Leave empty if not set",
            abdm_connected: 'ABDM connected',
            abdm_connection_fail: 'ABDM connection failed',
            abdm_download_folder: 'ABDM Download Folder',
            abdm_download_folder_placeholder: '',
            abdm_port: 'ABDM Port',
            abdm_port_not_configured: 'ABDM port not configured',
            abdm_port_placeholder: 'Default is 15151',
            abdm_settings: 'AB Download Manager Settings',
            aria2_connected: 'Aria2 connected successfully',
            aria2_connection_fail: 'Aria2 connection failed',
            aria2_rpc_address: 'Aria2 RPC Address',
            aria2_rpc_address_placeholder: 'Default is http://localhost:6800/jsonrpc',
            aria2_rpc_secret: 'Aria2 RPC Secret',
            aria2_rpc_secret_placeholder: 'Leave empty if not set',
            aria2_rpc_dir: 'Aria2 RPC Directory',
            aria2_rpc_dir_placeholder: '',
            aria2_settings: 'Aria2 Settings',
            cancel: 'Cancel',
            config: 'Config',
            confirm: 'Confirm',
            download: "Download",
            download_method: 'Download Method',
            error: 'Error',
            failed_to_fetch_folder_content: 'Failed to fetch folder content',
            failed_to_send_to_abdm: 'Failed to send to ABDM',
            failed_to_send_to_aria2: 'Failed to send to Aria2',
            fetching_file_list: 'Fetching file list',
            file_list: "File List",
            folder_download: "Folder Download",
            no_item_selected: 'No item selected',
            please_make_sure_you_have_configured_download_folder: 'Before downloading, make sure you have configured the download folder correctly.',
            reference: "Reference",
            reset_aria2: 'Default Settings',
            success: 'Success',
            successfully_fetched_file_list: 'Successfully fetched file list',
            successfully_reset: 'successfully reset',
            successfully_sent_to_abdm: 'successfully sent to ABDM',
            successfully_sent_to_aria2: 'successfully sent to Aria2',
            test_connection: "Test Connection",
            unsupported_format: 'Unsupported Format',
            request_aborted: 'Request Aborted',
            request_timed_out: 'Request Timed Out',
        },
    }

    const ICONS = {
        download: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-down-to-line-icon lucide-arrow-down-to-line size-5"><path d="M12 17V3"/><path d="m6 11 6 6 6-6"/><path d="M19 21H5"/></svg>',
        logo: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles-icon lucide-sparkles size-5"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>',
        settings: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bolt-icon lucide-bolt size-5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>',
    }

    const GE_CONFIG = {
        ABDM: {
            id: 'ABDM',
            homepage: 'https://github.com/amir1376/ab-download-manager',
            settings: {
                abdmPort: {
                    key: 'abdm_port',
                    defaultValue: '15151',
                    i18nKey: 'abdm_port',
                    placeholderI18nKey: 'abdm_port_placeholder',
                },
                abdmDownloadFolder: {
                    key: 'abdm_download_folder',
                    defaultValue: 'D:/Downloads',
                    i18nKey: 'abdm_download_folder',
                    placeholderI18nKey: 'abdm_download_folder_placeholder',
                },
                abdmApiKey: {
                    key: 'abdm_apikey',
                    defaultValue: '',
                    i18nKey: 'abdm_apikey',
                    placeholderI18nKey: 'abdm_apikey_placeholder',
                }
            },
        },
        Aria2: {
            id: 'Aria2',
            homepage: 'https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface',
            settings: {
                rpcAddress: {
                    key: 'aria2_rpc_address',
                    defaultValue: 'http://localhost:6800/jsonrpc',
                    i18nKey: 'aria2_rpc_address',
                    placeholderI18nKey: 'aria2_rpc_address_placeholder',
                },
                rpcSecret: {
                    key: 'aria2_rpc_secret',
                    defaultValue: '',
                    i18nKey: 'aria2_rpc_secret',
                    placeholderI18nKey: 'aria2_rpc_secret_placeholder',
                },
                rpcDir: {
                    key: 'aria2_rpc_dir',
                    defaultValue: 'D:/Downloads',
                    i18nKey: 'aria2_rpc_dir',
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
                            json: () => Promise.resolve(JSON.parse(response.responseText)),
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
        saveForm(category, form) {
            Object.entries(GE_CONFIG[category].settings).forEach(([settingKey, setting]) => {
                utils.setSettings(category, settingKey, form.elements[setting.key].value)
            })
        },
        resetForm(category, form) {
            const settings = GE_CONFIG[category].settings

            Object.keys(settings).forEach((key) => {
                const setting = settings[key]

                if (form?.elements[setting.key]) {
                    form.elements[setting.key].value = setting.defaultValue
                }
            })
        },
        initSettings() {
            Object.values(GE_CONFIG).forEach(({ settings }) => {
                Object.values(settings).forEach((setting) => {
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
        maskFolderPath(path) {
            if (!path || typeof path !== 'string') {
                return path || ''
            }

            const segments = path.split('/')
            const maskedSegments = segments.map((segment) => {
                if (!segment || segment.length < 15) {
                    return segment
                }

                const head = segment.slice(0, 5)
                const tail = segment.slice(-5)
                return `${head}***${tail}`
            })

            return maskedSegments.join('/')
        },
        goDirectLinks(links) {
            links.forEach((link) => {
                window.open(link, link)
            })
        },
        async collectAllItems(selectedKeys = []) {
            const busy = toast.busy({
                title: utils.getTranslation('fetching_file_list')
            });

            const mainContentData = GE_FileManager.state.folder;
            const tbdItems = [];
            const selectedSet = new Set(selectedKeys);

            let didTraverseFolder = false;

            const collectItems = async (
                contentData,
                parentPath = '',
                inheritedSelected = false
            ) => {
                if (contentData.childrenCount <= 0) {
                    return;
                }

                const currentPath = `${parentPath}/${contentData.name}`;

                for (const key of Object.keys(contentData.children || {})) {
                    const childItem = contentData.children[key];

                    const directlySelected = selectedSet.has(childItem.id);

                    const isSelected =
                        inheritedSelected ||
                        directlySelected;

                    if (childItem.type === 'file') {
                        if (isSelected) {
                            tbdItems.push({
                                ...childItem,
                                downloadFolder: currentPath
                            });
                        }

                        continue;
                    }

                    if (childItem.type === 'folder') {
                        if (!isSelected) {
                            continue;
                        }

                        if (childItem.childrenCount === 0) {
                            continue;
                        }

                        try {
                            didTraverseFolder = true;

                            const res = await contents.getFolder(
                                GE_FileManager.state.account.token,
                                childItem.id
                            );

                            if (res?.data) {
                                await collectItems(
                                    res.data,
                                    currentPath,
                                    true
                                );
                            } else {
                                toast(
                                    `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name}`,
                                    {
                                        type: 'error'
                                    }
                                );
                            }
                        } catch (error) {
                            toast(
                                `${utils.getTranslation('failed_to_fetch_folder_content')} ${childItem.name} ${error}`,
                                {
                                    type: 'error'
                                }
                            );
                        }
                    }
                }
            };

            await collectItems(mainContentData, '', false);

            if (didTraverseFolder) {
                busy.succeed({
                    title: utils.getTranslation('successfully_fetched_file_list')
                });
            } else {
                busy.dismiss();
            }

            return {
                items: tbdItems
            };
        },
        recursiveDownload(tbdItems, callback) {
            const fileItems = tbdItems.map((item) => {
                return {
                    name: item.name,
                    path: utils.maskFolderPath(item.downloadFolder || ''),
                }
            })
            const fileList = fileItems
                .map((file) => {
                    const pathWithBoldSeparators = file.path.replace(/\//g, '<span class="text-brand-300"> / </span>')
                    return `${pathWithBoldSeparators}<span class="text-brand-300"> / </span><span class="text-brand-300">${file.name}</span>`
                })
                .sort()
                .map((entry, index) => `
                    <p class="flex items-center gap-2">
                        <span class="shrink-0 rounded-md px-2 py-1 font-mono text-xs font-bold tracking-wide bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/30">${index + 1}</span>
                        <span>${entry}</span>
                    </p>
                `)

            popup.open({
                title: `${utils.getTranslation('file_list')} (${fileItems.length})`,
                size: "2xl",
                content: `
                <div class="mb-3 flex items-start gap-2.5 rounded-xl border p-3.5 border-amber-500/20 bg-amber-500/10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="triangle-alert" class="lucide lucide-triangle-alert mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                    <div class="text-sm leading-relaxed text-slate-300">
                        ${utils.getTranslation("please_make_sure_you_have_configured_download_folder")}
                    </div>
                </div>
                <div class="flex items-start gap-3">
                    <div class="text-sm leading-relaxed text-slate-300 space-y-1.5">
                        ${fileList.join('')}
                    </div>
                </div>`,
                actions: [
                    { label: utils.getTranslation('cancel'), variant: 'ghost' },
                    {
                        label: utils.getTranslation('download'), variant: 'primary',
                        onClick: (h) => { h.close(); callback(); }
                    },
                ],
            });
        },
        sendToABDM(tbdItems) {
            const { abdmPort, abdmDownloadFolder, abdmApiKey } = utils.getAllSettings('ABDM')
            const cookie = utils.getToken()

            if (!abdmPort) {
                return toast(utils.getTranslation('abdm_port_not_configured'), {
                    type: 'error',
                })
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
                    folder: item.downloadFolder || (abdmDownloadFolder === '' ? '/' : abdmDownloadFolder),
                    startDownload: false
                }
            })

            postDatas.forEach(async (data) => {
                try {
                    const res = await utils.gmFetch(`http://localhost:${abdmPort}/start-headless-download`, {
                        method: 'POST',
                        headers: abdmApiKey ? { "X-API-Key": abdmApiKey } : {},
                        body: JSON.stringify(data),
                    })
                    if (res.ok) {
                        toast(`${data.name} ${utils.getTranslation('successfully_sent_to_abdm')}`, {
                            type: 'success',
                        })
                    } else {
                        toast(`${data.name} ${utils.getTranslation('failed_to_send_to_abdm')} / ${res.status} - ${res.statusText}`, {
                            type: 'error',
                        })
                        console.error('[GoFile Enhanced] Error sending to ABDM:', res)
                    }
                } catch (error) {
                    toast(`${data.name} ${utils.getTranslation('failed_to_send_to_abdm')}`, {
                        type: 'error',
                    })
                    console.error('[GoFile Enhanced] Error sending to ABDM:', error)
                }
            })
        },
        async testABDMConnection(form) {
            const port = form.elements.abdm_port.value
            const apiKey = form.elements.abdm_apikey.value

            if (port) {
                try {
                    const res = await utils.gmFetch(
                        `http://localhost:${port}/ping`,
                        {
                            method: "POST",
                            headers: { "X-API-Key": apiKey }
                        }
                    )
                    if (res.ok) {
                        toast(utils.getTranslation('abdm_connected'), {
                            type: 'success',
                        })
                    } else {
                        toast(`${utils.getTranslation('abdm_connection_fail')} / ${res.status} - ${res.statusText}`, {
                            type: 'error',
                        })
                    }
                } catch (_error) {
                    toast(utils.getTranslation('abdm_connection_fail'), {
                        type: 'error',
                    })
                }
            } else {
                toast(utils.getTranslation('abdm_port_not_configured'), {
                    type: 'error',
                })
            }
        },
        async testAria2Connection(form) {
            // const busy = toast.busy({ title: utils.getTranslation('loading') });

            const rpcAddress = form.elements.aria2_rpc_address.value
            const rpcSecret = form.elements.aria2_rpc_secret.value

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
                    toast(utils.getTranslation('aria2_connected'), {
                        type: 'success',
                    })
                } else {
                    toast(`${utils.getTranslation('aria2_connection_fail')} / ${res.status} - ${res.statusText}`, {
                        type: 'error',
                    })
                }
            } catch (_error) {
                toast(utils.getTranslation('aria2_connection_fail'), {
                    type: 'error',
                })
            }

            // busy.dismiss();
        },
        async sendToAria2(tbdItems) {
            const { rpcAddress, rpcSecret, rpcDir } = utils.getAllSettings('Aria2')

            const cookie = utils.getToken()

            const header = [`Cookie: ${cookie}`]

            const rpcData = tbdItems.map((item) => {
                return {
                    id: crypto.randomUUID(),
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
                            toast(`${utils.getTranslation('failed_to_send_to_aria2')} / ${item.error.code} - ${item.error.message}`, {
                                type: 'error',
                            })
                        } else {
                            toast(`${utils.getTranslation('successfully_sent_to_aria2')} / ID: ${item.result}`, {
                                type: 'success',
                            })
                        }
                    })
                } else {
                    toast(`${utils.getTranslation('failed_to_send_to_aria2')} /  ${res.status} - ${res.statusText}`, {
                        type: 'error',
                    })
                }
            } catch (_error) {
                toast(utils.getTranslation('failed_to_send_to_aria2'), {
                    type: 'error',
                })
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
            link.download = `${GE_FileManager.state.folder.name}.${fileExtension}`
            link.click()
            URL.revokeObjectURL(url)
        },
        getActionButton({ icon, label, onClick }) {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'icon-btn'
            button.title = label
            button.setAttribute('aria-label', label)
            button.innerHTML = icon

            if (onClick) {
                button.addEventListener('click', onClick)
            }

            return button
        },
        openActionMenu(anchor, items) {
            openMenu({
                anchor,
                placement: 'bottom-end',
                items: () => items,
            })
        },
        getDownloadSelectedButton() {
            const button = utils.getActionButton({
                icon: ICONS.download,
                label: utils.getTranslation('download'),
                onClick: (event) => {
                    utils.openActionMenu(event.currentTarget, [
                        { type: 'label', label: utils.getTranslation('download_method') },
                        ...['Direct', 'ABDM', 'Aria2', 'IDM'].map((format) => ({
                            label: format,
                            onClick: () => operations.handleExport({
                                format,
                                recursive: format === 'ABDM' || format === 'Aria2',
                            }),
                            icon: format === "ABDM" || format === "Aria2" ? "folder-tree" : '',
                            hint: format === "ABDM" || format === "Aria2" ? utils.getTranslation("folder_download") : '',
                        })),
                    ])
                },
            })

            const updateButtonVisibility = () => {
                const hasSelection = !!GE_FileManager?.state?.selection && GE_FileManager.state.selection.size > 0
                button.classList.toggle('hidden', !hasSelection)
            }

            updateButtonVisibility()

            const observer = new MutationObserver(() => {
                updateButtonVisibility()
            })

            if (document.documentElement) {
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                })
            }

            return button
        },
        getSettingsButton() {
            return utils.getActionButton({
                icon: ICONS.settings,
                label: `${utils.getTranslation('config')}`,
                onClick: (event) => {
                    utils.openActionMenu(event.currentTarget, [
                        { type: 'label', label: utils.getTranslation('config') },
                        ...['ABDM', 'Aria2'].map((downloader) => ({
                            label: downloader,
                            onClick: () => {

                                popup.open({
                                    title: utils.getTranslation(`${downloader.toLowerCase()}_settings`),
                                    size: "2xl",
                                    content: utils.getConfigPanel(downloader),
                                    actions: [
                                        { label: utils.getTranslation('cancel'), variant: 'ghost' },
                                        {
                                            label: utils.getTranslation('confirm'), variant: 'primary',
                                            onClick: (h) => {
                                                const form = document.forms[`${GE_FORM_ID_PREFIX}-${downloader}`]

                                                utils.saveForm(downloader, form)

                                                h.close()
                                            }
                                        },
                                    ],
                                });

                                const testButton = document.querySelector(`[data-ge-panel-action="${downloader}-test"]`)
                                const resetButton = document.querySelector(`[data-ge-panel-action="${downloader}-reset"]`)

                                if (testButton) {
                                    testButton.addEventListener('click', () => {
                                        const form = document.forms[`${GE_FORM_ID_PREFIX}-${downloader}`]

                                        if (downloader === 'ABDM') {
                                            utils.testABDMConnection(form)
                                        } else {
                                            utils.testAria2Connection(form)
                                        }
                                    })
                                }

                                if (resetButton) {
                                    resetButton.addEventListener('click', () => {
                                        const form = document.forms[`${GE_FORM_ID_PREFIX}-${downloader}`]

                                        if (downloader === 'Aria2') {
                                            utils.resetForm('Aria2', form)
                                        }
                                    })
                                }

                            },
                        })),
                    ])
                },
            })
        },
        getActionButtons() {
            const ge_logo = document.createElement("a")
            ge_logo.className = 'icon-btn'
            ge_logo.href = "https://github.com/ewigl/gofile-enhanced"
            ge_logo.target = "_blank"
            ge_logo.innerHTML = ICONS.logo

            const ge_title = document.createElement('span')
            ge_title.className = 'text-slate-400 flex items-center gap-1.5'
            ge_title.innerHTML = `GoFile Enhanced`

            const spacer = document.createElement('span');
            spacer.className = 'flex-1';

            return [
                ge_logo,
                ge_title,
                spacer,
                utils.getDownloadSelectedButton(),
                utils.getSettingsButton(),
            ]
        },
        getFormInputItemTemplate(setting) {
            const { key, i18nKey, placeholderI18nKey } = setting

            return `
                <div>
                    <label for="${key}" class="mb-1.5 block text-xs font-medium text-slate-400">
                        ${utils.getTranslation(i18nKey)}
                    </label>
                    <input
                        id="${key}"
                        name="${key}"
                        value="${utils.getValue(key)}"
                        class="input"
                        type="text"
                        maxlength="200"
                        placeholder="${utils.getTranslation(placeholderI18nKey)}"
                        autocomplete="off"
                    >
                </div>
            `
        },
        getConfigPanel(category) {
            const config = GE_CONFIG[category]
            const extraActions = category === 'ABDM'
                ? `
                    <div class="flex gap-2">
                        <button type="button" data-ge-panel-action="${category}-test" class="btn-secondary flex-1 py-2 px-3 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition">
                            ${utils.getTranslation('test_connection')}
                        </button>
                    </div>
                `
                : `
                    <div class="flex gap-2">
                        <button type="button" data-ge-panel-action="${category}-test" class="btn-secondary flex-1 py-2 px-3 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-500/10 transition">
                            ${utils.getTranslation('test_connection')}
                        </button>
                        <button type="button" data-ge-panel-action="${category}-reset" class="btn-secondary flex-1 py-2 px-3 rounded-lg border border-blue-500 text-amber-400 hover:bg-blue-500/10 transition">
                            ${utils.getTranslation('reset_aria2')}
                        </button>
                    </div>
                `

            return `
                <div class="space-y-4">
                    <div class="flex items-start gap-2.5 rounded-xl border p-3.5 border-sky-500/20 bg-sky-500/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="info" class="lucide lucide-info mt-0.5 size-4 shrink-0 text-sky-400" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                        <div class="text-sm leading-relaxed text-slate-300">
                            ${utils.getTranslation("reference")}: 
                            <a
                                href="${config.homepage}" 
                                target="_blank"
                                rel="noopener noreferrer"
                                class="font-medium text-brand-400 underline decoration-brand-400/40 underline-offset-2 transition-colors hover:text-brand-300 hover:decoration-brand-300"
                            >
                                ${config.homepage}
                            </a>
                        </div>
                    </div>

                    <form id="${GE_FORM_ID_PREFIX}-${config.id}" class="space-y-4">
                        ${Object.entries(config.settings).map(([_key, setting]) => utils.getFormInputItemTemplate(setting)).join('')}
                        ${extraActions}
                    </form>
                </div>
            `
        },
    }

    const operations = {
        async handleExport(options) {
            const { format, recursive } = options
            const abdmDownloadFolder = utils.getSettings('ABDM', 'abdmDownloadFolder')
            const aria2RpcDir = utils.getSettings('Aria2', 'rpcDir')
            const selectedKeys = Array.from(GE_FileManager.state.selection || [])

            if (recursive && selectedKeys.length === 0) {
                return toast(utils.getTranslation('no_item_selected'), {
                    type: 'warning',
                })
            }

            const shouldShowFileList = selectedKeys.some((key) => {
                const item = GE_FileManager.state.folder.children?.[key]
                return item?.type === 'folder'
            })

            let tbdItems = []

            if (recursive) {
                const { items } = await utils.collectAllItems(selectedKeys)
                tbdItems = items
            } else {
                const allFiles = GE_FileManager.state.folder.children
                const tbdKeys = selectedKeys.filter((key) => allFiles[key].type === 'file')
                tbdItems = tbdKeys.map((key) => allFiles[key])
            }

            if (tbdItems.length === 0) {
                return toast(utils.getTranslation('no_item_selected'), {
                    type: "warning"
                });
            }

            const dispatchToDownloader = (folderPrefix, sendFn) => {
                const preparedItems = tbdItems.map((item) => ({
                    ...item,
                    downloadFolder: folderPrefix + item.downloadFolder,
                }))

                if (!shouldShowFileList) {
                    sendFn(preparedItems)
                    return
                }

                utils.recursiveDownload(tbdItems, () => sendFn(preparedItems))
            }

            switch (format) {
                case 'Direct':
                    utils.goDirectLinks(tbdItems.map((item) => item.link))
                    break
                case 'ABDM':
                    dispatchToDownloader(abdmDownloadFolder, utils.sendToABDM)
                    break
                case 'Aria2':
                    dispatchToDownloader(aria2RpcDir, utils.sendToAria2)
                    break
                case 'IDM':
                    utils.exportToIDM(tbdItems)
                    break
                default:
                    toast(utils.getTranslation('unsupported_format'), {
                        type: 'error',
                    })
                    break
            }
        },
        // add buttons to fm-toolbar
        addContainerToToolbar() {
            const toolbar = document.querySelector('#fm-toolbar')

            if (!toolbar) {
                return
            }

            if (document.getElementById(GE_CONTAINER_ID)) {
                return
            }

            const container = document.createElement('div')
            container.id = GE_CONTAINER_ID
            container.className = 'panel mb-3 px-2 py-1.5 shadow-lg shadow-black/20'

            const row = document.createElement('div')
            row.className = 'flex items-center gap-1 sm:gap-1.5'

            utils.getActionButtons().forEach((button) => {
                row.appendChild(button)
            })

            container.appendChild(row)
            toolbar.insertAdjacentElement('beforebegin', container)
        },
    }

    const main = {
        async init() {
            utils.initSettings()

            Object.defineProperty(Object.prototype, 'loadSeq', {
                set: function (val) {
                    this._loadSeq = val;
                    if (this.constructor.name === 'FileManager' || (this.root && this.state)) {
                        unsafeWindow.GE_FileManager = this;
                    }
                },
                get: function () {
                    return this._loadSeq;
                },
                configurable: true
            });

            // Observe changes in the DOM
            const observer = new MutationObserver(() => {
                const container = document.getElementById(GE_CONTAINER_ID)

                if (unsafeWindow.GE_FileManager) {
                    if (!container) {
                        operations.addContainerToToolbar()
                    }
                } else if (container) {
                    container.remove()
                }
            })

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            })
        },
    };

    await main.init()
})()
