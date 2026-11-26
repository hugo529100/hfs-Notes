exports.version = 5.7
exports.depend = [{ "repo": "rejetto/thumbnails", "version": 4 }]
exports.description = "A lightweight, convenient note-taking tool built into HFS with multi-tab support, real-time sync, auto-backup, pagination, TXT export, progressive loading, GIF video thumbnails, and unified temp file management."
exports.apiRequired = 8.87
exports.repo = "hugo529100/hfs-Notes"
exports.frontend_js = ['main.js']
exports.frontend_css = ['style.css']

exports.config = {
    config_tab: {
        type: 'select',
        defaultValue: 'tabs',
        options: {
            '1. Tabs & Access': 'tabs',
            '2. Backup & Export': 'backup',
            '3. Thumbnails': 'thumbnails',
            '4. Uploads': 'uploads'
        },
        label: "Configuration Category",
        helperText: "Select a category to view and edit settings.",
        frontend: true
    },

    tabList: {
        showIf: x => x.config_tab === 'tabs',
        type: 'array',
        label: 'Tab List',
        fields: {
            name: { label: 'Tab Name' },
            category: {
                label: 'Category',
                helperText: 'Group tabs by category. Leave empty for uncategorized.',
                defaultValue: ''
            },
            publicNote: {
                type: 'boolean',
                label: 'Allow notes visible on public page',
                defaultValue: false,
                helperText: 'When enabled, unauthenticated users (Guest) can see and send text-only notes in this tab.'
            },
            allowedUsers: {
                type: 'username',
                multiple: true,
                label: 'Allowed users (this tab)',
                helperText: 'Optional per-tab restriction. When set, only these users (plus admin) can open this tab; the global restriction above still applies.'
            }
        },
        defaultValue: [{ name: 'General', category: '', publicNote: false }],
        helperText: 'Add or remove tabs. Each tab has its own independent note storage.',
        frontend: true
    },
    restrictUsers: {
        showIf: x => x.config_tab === 'tabs',
        type: 'boolean',
        label: 'Restrict user access',
        helperText: 'When enabled, only selected users below can access notes. When disabled, all logged-in users can access.',
        defaultValue: false,
        frontend: true
    },
    allowedUsers: {
        showIf: x => x.config_tab === 'tabs' && x.restrictUsers,
        type: 'username',
        multiple: true,
        label: 'Allowed users',
        helperText: 'Only applies when "Restrict user access" is enabled above.',
        frontend: true
    },

    backupInterval: {
        showIf: x => x.config_tab === 'backup',
        type: 'number',
        label: 'Auto Backup Interval (hours)',
        defaultValue: 6,
        helperText: 'How often to backup notes database (0 to disable). The schedule follows real elapsed time across HFS restarts and config saves.'
    },
    backupRetentionDays: {
        showIf: x => x.config_tab === 'backup',
        type: 'number',
        label: 'Backup Retention Days',
        defaultValue: 3,
        helperText: 'How many days to keep backup archives (0 = keep forever)'
    },
    autoExportTxt: {
        showIf: x => x.config_tab === 'backup',
        type: 'boolean',
        label: 'Auto Export TXT',
        helperText: 'When enabled, automatically export notes as TXT files alongside each backup. Each run is packed into a single ZIP archive.',
        defaultValue: false,
        frontend: true
    },
    backupOnStartup: {
        showIf: x => x.config_tab === 'backup',
        type: 'boolean',
        label: 'Backup once after server startup',
        helperText: 'When enabled, one backup is made shortly after HFS starts. Hot-reloading the plugin in the same server process will not trigger another one.',
        defaultValue: false
    },

    maxMediaSizeMB: {
        showIf: x => x.config_tab === 'uploads',
        type: 'number',
        label: 'Max media upload size (MB)',
        defaultValue: 1024,
        min: 1,
        max: 102400,
        helperText: 'Limit for images, video and audio. Large files are uploaded in chunks and reassembled on the server.',
        frontend: true
    },
    maxFileSizeMB: {
        showIf: x => x.config_tab === 'uploads',
        type: 'number',
        label: 'Max other file upload size (MB)',
        defaultValue: 2048,
        min: 1,
        max: 102400,
        helperText: 'Limit for ordinary attachments that are not image/video/audio.',
        frontend: true
    },
    uploadChunkSizeMB: {
        showIf: x => x.config_tab === 'uploads',
        type: 'number',
        label: 'Upload chunk size (MB)',
        defaultValue: 4,
        min: 1,
        max: 32,
        helperText: 'Files are split into chunks of this size. Smaller chunks are safer behind proxies; larger chunks use fewer requests.',
        frontend: true
    },

    useSharpPlugin: {
        showIf: x => x.config_tab === 'thumbnails',
        type: 'boolean',
        defaultValue: true,
        label: 'Use Sharp plugin for thumbnails',
        helperText: 'Requires rejetto/sharp plugin to be installed. Falls back to built-in method if disabled.',
        frontend: true
    },
    thumbQuality: {
        showIf: x => x.config_tab === 'thumbnails',
        type: 'number',
        defaultValue: 70,
        min: 1,
        max: 100,
        label: 'Thumbnail quality',
        helperText: 'JPEG quality for thumbnails (1-100)',
        xs: 6
    },
    thumbPixels: {
        showIf: x => x.config_tab === 'thumbnails',
        type: 'number',
        defaultValue: 800,
        min: 50,
        max: 2000,
        label: 'Thumbnail size (pixels)',
        helperText: 'Longest side dimension in pixels',
        xs: 6
    },
    ffmpeg_path: {
        showIf: x => x.config_tab === 'thumbnails',
        type: 'real_path',
        fileMask: 'ffmpeg*',
        defaultValue: 'ffmpeg.exe',
        helperText: 'Path to FFmpeg executable. Leave empty if it\'s in the system path. Used for video thumbnail extraction.',
        xs: 6
    },
    thumbnail_format: {
        showIf: x => x.config_tab === 'thumbnails',
        type: 'select',
        label: 'Video thumbnail format',
        defaultValue: 'jpg',
        options: {
            'JPG (Static)': 'jpg',
            'GIF (Animated preview)': 'gif'
        },
        helperText: 'Select output format for video thumbnails',
        xs: 6
    },
    thumbnail_time: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'jpg',
        type: 'string',
        defaultValue: '00:00:05',
        label: 'JPG thumbnail time position',
        helperText: 'Time position for JPG thumbnail extraction (HH:MM:SS)',
        xs: 6
    },
    gif_width: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 100,
        max: 800,
        defaultValue: 320,
        label: 'GIF width (pixels)',
        helperText: 'Width of output GIF (height auto-scaled)',
        xs: 6
    },
    video_size_threshold: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        defaultValue: 25,
        min: 1,
        max: 100000,
        label: 'Video size threshold (MB)',
        helperText: 'Videos larger than this will use long video settings',
        xs: 6
    },
    short_video_start_time: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'string',
        defaultValue: '00:01:00',
        label: 'Short video start time (HH:MM:SS)',
        helperText: 'Start time for short videos (<= threshold)',
        xs: 12
    },
    short_video_duration: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 12,
        label: 'Short video GIF duration (seconds)',
        helperText: 'Duration of GIF for short videos',
        xs: 6
    },
    short_video_fps: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Short video GIF FPS',
        helperText: 'Frames per second for short videos',
        xs: 6
    },
    long_video_start_time: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'string',
        defaultValue: '00:3:00',
        label: 'Long video start time (HH:MM:SS)',
        helperText: 'Start time for long videos (> threshold)',
        xs: 12
    },
    long_video_duration: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 12,
        label: 'Long video GIF duration (seconds)',
        helperText: 'Duration of GIF for long videos',
        xs: 6
    },
    long_video_fps: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Long video GIF FPS',
        helperText: 'Frames per second for long videos',
        xs: 6
    },
    backup_video_start_time: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'string',
        defaultValue: '00:00:00',
        label: 'Backup video start time (HH:MM:SS)',
        helperText: 'Fallback start time when other settings fail',
        xs: 12
    },
    backup_video_duration: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 6,
        label: 'Backup video GIF duration (seconds)',
        helperText: 'Duration of GIF for backup mode',
        xs: 6
    },
    backup_video_fps: {
        showIf: x => x.config_tab === 'thumbnails' && x.thumbnail_format === 'gif',
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Backup video GIF FPS',
        helperText: 'Frames per second for backup mode',
        xs: 6
    }
}

exports.init = async api => {
    const { getCurrentUsername } = api.require('./auth')
    const fs = api.require('fs/promises')
    const fss = api.require('fs')
    const path = api.require('path')
    const crypto = api.require('crypto')
    const zlib = api.require('zlib')
    const { spawn } = api.require('child_process')
    const http = api.require('http')
    const https = api.require('https')
    const storage = api.storageDir

    const API_BASE = `${api.Const.API_URI}notes/`
    const ADMIN_API = `${API_BASE}admin/`

    const TABS_DIR = path.join(storage, 'tabs')
    const IMG_BASE_DIR = path.join(storage, 'img')
    const MOV_BASE_DIR = path.join(storage, 'mov')
    const ATT_BASE_DIR = path.join(storage, 'att')
    const THUMB_BASE_DIR = path.join(storage, 'thumb')
    const TEMP_DIR = path.join(storage, 'temp')
    const BACKUP_DIR = path.join(storage, 'backup')
    const BACKUP_STATE_FILE = path.join(BACKUP_DIR, '_backup_state.json')
    const TRASH_DIR = path.join(storage, 'trash')
    const TABS_MAP_FILE = path.join(TABS_DIR, '_tabs_map.json')

    const SPAM_DELAY = 1000
    const MAX_STORAGE_WARNING = 99999999
    const MAX_IMG_SIZE = 80 * 1024 * 1024
    const MAX_FILE_SIZE = 200 * 1024 * 1024
    const TEMP_FILE_TTL = 60 * 1000
    const THUMB_QUALITY = 70
    const PAGE_SIZE = 10
    const SUMMARY_LENGTH = 250

    const DOWNLOAD_TIMEOUT = 3000
    const MAX_CONCURRENT_DOWNLOADS = 3
    const MAX_LOCALIZE_TOTAL = 50
    const DEFAULT_MAX_MEDIA_MB = 1024
    const DEFAULT_MAX_FILE_MB = 2048
    const DEFAULT_UPLOAD_CHUNK_MB = 4

    function getConfigNumberMB(key, fallback) {
        const value = Number(api.getConfig(key))
        if (!isFinite(value) || value <= 0) return fallback
        return Math.min(102400, Math.max(1, value))
    }

    function isMediaMime(mimeType) {
        return /^(image|video|audio)\//i.test(String(mimeType || ''))
    }

    function getUploadLimitBytes(mimeType) {
        const mb = isMediaMime(mimeType)
            ? getConfigNumberMB('maxMediaSizeMB', DEFAULT_MAX_MEDIA_MB)
            : getConfigNumberMB('maxFileSizeMB', DEFAULT_MAX_FILE_MB)
        return Math.round(mb * 1024 * 1024)
    }

    function getUploadChunkBytes() {
        return Math.round(getConfigNumberMB('uploadChunkSizeMB', DEFAULT_UPLOAD_CHUNK_MB) * 1024 * 1024)
    }

    let backupTimer = null
    let backupStartTimeout = null
    let midnightCleanupTimer = null
    let isBackupRunning = false
    let isRestoring = false
    let backupJob = null
    let backupStateReady = false
    let lastBackupAt = 0
    let isApplyingTabList = false
    let lastKnownTabNames = null

    // 備份節奏：以「實際經過時間」為準，每分鐘檢查一次是否到??
    const BACKUP_CHECK_INTERVAL_MS = 60 * 1000
    const BACKUP_STARTUP_DELAY_MS = 3000
    const BACKUP_MIGRATION_DELAY_MS = 8000

    const throttleDb = api.openDb('notes_throttle', { rewriteLater: true })

    await fs.mkdir(TABS_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(IMG_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(MOV_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(ATT_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(THUMB_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {})

    // 舊版可能留下已移除的 config_tab 值（例如 manage），導向有效的分??
    {
        const validConfigTabs = new Set(['tabs', 'backup', 'thumbnails', 'uploads'])
        if (!validConfigTabs.has(api.getConfig('config_tab'))) {
            Promise.resolve(api.setConfig('config_tab', 'tabs')).catch(() => {})
        }
    }

    try {
        await fs.stat(TABS_MAP_FILE)
    } catch {
        const tabs = getTabs()
        await fs.writeFile(TABS_MAP_FILE, JSON.stringify({
            order: tabs,
            names: {},
            categories: {},
            categoryOrder: [],
            categoryNames: {},
            categoryTabOrders: {}
        }, null, 2))
    }

    async function syncTabsMapWithConfig() {
        const tabsMap = await loadTabsMap()
        const configTabs = getTabsWithCategory()
        let needsSave = false

        const configSet = new Set(configTabs.map(t => t.name))
        const validExistingOrder = (tabsMap.order || []).filter(t => configSet.has(t))

        const existingSet = new Set(validExistingOrder)
        const newTabs = configTabs.filter(t => !existingSet.has(t.name)).map(t => t.name)

        const newOrder = [...validExistingOrder, ...newTabs]

        if (newOrder.length !== (tabsMap.order || []).length ||
            newOrder.some((t, i) => t !== (tabsMap.order || [])[i])) {
            tabsMap.order = newOrder
            needsSave = true
        }

        for (const tab of Object.keys(tabsMap.categories || {})) {
            if (!configSet.has(tab)) {
                delete tabsMap.categories[tab]
                needsSave = true
            }
        }

        for (const tabConfig of configTabs) {
            if (tabConfig.category !== undefined && tabConfig.category !== null) {
                const currentCat = tabsMap.categories?.[tabConfig.name]
                if (currentCat !== tabConfig.category) {
                    if (!tabsMap.categories) tabsMap.categories = {}
                    tabsMap.categories[tabConfig.name] = tabConfig.category || ''
                    needsSave = true
                }
            }
        }

        // categoryOrder 可以包含目前沒有 tab 的分類（獨立管理分類時使用），所以只去重、不因為??tab 就刪??
        const usedCategories = new Set(Object.values(tabsMap.categories || {}).filter(Boolean))
        const categoryOrder = []
        for (const cat of tabsMap.categoryOrder || []) {
            if (!cat || categoryOrder.includes(cat)) continue
            categoryOrder.push(cat)
        }
        for (const cat of usedCategories) {
            if (!categoryOrder.includes(cat)) categoryOrder.push(cat)
        }
        if (JSON.stringify(categoryOrder) !== JSON.stringify(tabsMap.categoryOrder || [])) {
            tabsMap.categoryOrder = categoryOrder
            needsSave = true
        }

        const knownCategories = new Set(categoryOrder)
        for (const cat of Object.keys(tabsMap.categoryNames || {})) {
            if (!knownCategories.has(cat)) {
                delete tabsMap.categoryNames[cat]
                needsSave = true
            }
        }

        // 每??category 內部??tab 順序（與 order 的全域順序互相獨立）
        const tabCategory = new Map(configTabs.map(t => [t.name, t.category || '']))
        const prevCategoryTabOrders = (tabsMap.categoryTabOrders && typeof tabsMap.categoryTabOrders === 'object') ? tabsMap.categoryTabOrders : {}
        const categoryTabOrders = {}
        for (const cat of knownCategories) categoryTabOrders[cat] = []
        for (const cat of Object.keys(prevCategoryTabOrders)) {
            if (!categoryTabOrders[cat]) categoryTabOrders[cat] = []
        }
        for (const cat of Object.keys(categoryTabOrders)) {
            const previous = Array.isArray(prevCategoryTabOrders[cat]) ? prevCategoryTabOrders[cat] : []
            for (const name of previous) {
                if (configSet.has(name) && tabCategory.get(name) === cat && !categoryTabOrders[cat].includes(name)) {
                    categoryTabOrders[cat].push(name)
                }
            }
        }
        for (const name of newOrder) {
            const cat = tabCategory.get(name) || ''
            if (!categoryTabOrders[cat]) categoryTabOrders[cat] = []
            if (!categoryTabOrders[cat].includes(name)) categoryTabOrders[cat].push(name)
        }
        if (JSON.stringify(categoryTabOrders) !== JSON.stringify(prevCategoryTabOrders)) {
            tabsMap.categoryTabOrders = categoryTabOrders
            needsSave = true
        }

        for (const tabName of Object.keys(tabsMap.names || {})) {
            if (!configSet.has(tabName)) {
                delete tabsMap.names[tabName]
                needsSave = true
            }
        }

        if (needsSave) {
            await saveTabsMap(tabsMap)
        }

        return tabsMap
    }

    function sanitizeForDb(text) {
        if (!text || typeof text !== 'string') return ''
        return text
            .replace(/\x00/g, '')
            .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
            .replace(/\u200B/g, '')
            .replace(/[\u200C\u200D]/g, '')
            .replace(/\uFEFF/g, '')
            .replace(/[\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F]/g, '')
            .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
            .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
            .replace(/\u00AD/g, '')
            .replace(/[\u2028\u2029]/g, '\n')
            .normalize('NFC')
    }

    function getTabConfig(tab) {
        if (!tab) return null
        const list = api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }]
        return list.find(t => t.name === tab) || null
    }

    function getTabPublicConfig(tab) {
        const found = getTabConfig(tab)
        return found ? (found.publicNote === true) : false
    }

    function isHfsAdmin(username) {
        if (!username) return false
        if (username === 'admin') return true
        try {
            const acc = api.getAccount && api.getAccount(username)
            return !!(acc && acc.admin)
        } catch {
            return false
        }
    }

    function isAllowed(username, tab) {
        if (isHfsAdmin(username)) return true
        if (!username) {
            if (tab) return getTabPublicConfig(tab)
            return false
        }
        // 每??tab 可再限制專屬使用者（admin 不受限）
        if (tab) {
            const cfg = getTabConfig(tab)
            const tabUsers = cfg && Array.isArray(cfg.allowedUsers) ? cfg.allowedUsers.filter(Boolean) : []
            if (tabUsers.length > 0 && !tabUsers.includes(username)) return false
        }
        if (!api.getConfig('restrictUsers')) return true
        const allowed = api.getConfig('allowedUsers') || []
        return allowed.includes(username)
    }

    function getTabs() {
        const list = api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }]
        return list.map(t => t.name).filter(Boolean)
    }

    function getTabsWithCategory() {
        const list = api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }]
        return list.filter(t => t.name && t.name.trim())
    }

    function getPublicTabs() {
        const list = api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }]
        return list.filter(t => t.publicNote === true).map(t => t.name).filter(Boolean)
    }

    function getTimestamp(date) {
        const now = (date instanceof Date && !isNaN(date)) ? date : new Date()
        const y = now.getFullYear()
        const m = String(now.getMonth() + 1).padStart(2, '0')
        const d = String(now.getDate()).padStart(2, '0')
        const h = String(now.getHours()).padStart(2, '0')
        const min = String(now.getMinutes()).padStart(2, '0')
        const s = String(now.getSeconds()).padStart(2, '0')
        return `${y}${m}${d}_${h}${min}${s}`
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    function generateFileId(originalName) {
        const now = new Date()
        const dateStr = now.getFullYear() +
            String(now.getMonth() + 1).padStart(2, '0') +
            String(now.getDate()).padStart(2, '0') +
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0') +
            String(now.getSeconds()).padStart(2, '0')
        const rand = crypto.randomBytes(3).toString('hex')
        const ext = path.extname(originalName) || ''
        let baseName = path.basename(originalName, ext)
        baseName = baseName.replace(/%/g, '_')
        return `${dateStr}_${rand}_${baseName}${ext}`
    }

    function getTabDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(TABS_DIR, safeTab)
    }

    function getTabIndexPath(tab) {
        return path.join(getTabDir(tab), '_index.json')
    }

    function getNoteFilePath(tab, ts) {
        const safeTs = ts.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(getTabDir(tab), `${safeTs}.json`)
    }

    function getTabImgDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(IMG_BASE_DIR, safeTab)
    }

    function getTabMovDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(MOV_BASE_DIR, safeTab)
    }

    function getTabAttDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(ATT_BASE_DIR, safeTab)
    }

    function getTabThumbDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(THUMB_BASE_DIR, safeTab)
    }

    function getNameMapPath(tab, type) {
        const dir = type === 'mov' ? getTabMovDir(tab) : getTabAttDir(tab)
        return path.join(dir, '.filenames')
    }

    function getTempPath(fileId) {
        return path.join(TEMP_DIR, fileId)
    }

    async function loadTabsMap() {
        try {
            const data = await fs.readFile(TABS_MAP_FILE, 'utf-8')
            const parsed = JSON.parse(data)
            return {
                order: parsed.order || getTabs(),
                names: parsed.names || {},
                categories: parsed.categories || {},
                categoryOrder: parsed.categoryOrder || [],
                categoryNames: parsed.categoryNames || {},
                categoryTabOrders: (parsed.categoryTabOrders && typeof parsed.categoryTabOrders === 'object') ? parsed.categoryTabOrders : {}
            }
        } catch {
            const tabs = getTabs()
            return { order: tabs, names: {}, categories: {}, categoryOrder: [], categoryNames: {}, categoryTabOrders: {} }
        }
    }

    async function saveTabsMap(mapData) {
        await fs.writeFile(TABS_MAP_FILE, JSON.stringify(mapData, null, 2))
    }

    async function loadTabIndex(tab) {
        try {
            const indexPath = getTabIndexPath(tab)
            const data = await fs.readFile(indexPath, 'utf-8')
            return JSON.parse(data)
        } catch {
            return { notes: {} }
        }
    }

    async function saveTabIndex(tab, indexData) {
        const dir = getTabDir(tab)
        await fs.mkdir(dir, { recursive: true }).catch(() => {})
        const indexPath = getTabIndexPath(tab)
        await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2))
    }

    async function loadNoteContent(tab, ts) {
        try {
            const filePath = getNoteFilePath(tab, ts)
            const data = await fs.readFile(filePath, 'utf-8')
            return data
        } catch {
            return null
        }
    }

    async function saveNoteContent(tab, ts, content) {
        const dir = getTabDir(tab)
        await fs.mkdir(dir, { recursive: true }).catch(() => {})
        const filePath = getNoteFilePath(tab, ts)
        await fs.writeFile(filePath, content, 'utf-8')
    }

    async function deleteNoteFile(tab, ts) {
        const filePath = getNoteFilePath(tab, ts)
        await fs.unlink(filePath).catch(() => {})
    }

    async function getTabNoteCount(tab) {
        const index = await loadTabIndex(tab)
        return Object.keys(index.notes).length
    }

    // ============================================
    // 自我修復：tab 索引 / _tabs_map / 多出來的 tab 資料??
    // ============================================
    const INDEX_SCAN_DEFAULT_MS = 2 * 60 * 1000
    const MISSING_FILE_GRACE_MS = 10 * 60 * 1000
    const lastIndexScanAt = new Map()
    const lastIndexStats = new Map()
    const indexReconcileLocks = new Map()
    const tabUsageCache = new Map()
    let lastStorageScanAt = 0
    const STORAGE_SCAN_MIN_MS = 5 * 60 * 1000

    function safeTabFolderName(tab) {
        return String(tab || '').replace(/[\\/:*?"<>|]/g, '_')
    }

    async function archiveTabFolder(tab) {
        const dir = getTabDir(tab)
        const st = await fs.stat(dir).catch(() => null)
        if (!st || !st.isDirectory()) return null
        const root = path.join(TABS_DIR, '_removed')
        await fs.mkdir(root, { recursive: true }).catch(() => {})
        const dest = path.join(root, `${safeTabFolderName(tab)}_${getTimestamp()}`)
        try {
            await fs.rename(dir, dest)
            tabUsageCache.delete(tab)
            lastIndexStats.delete(tab)
            lastIndexScanAt.delete(tab)
            return dest
        } catch {
            return null
        }
    }

    // 刪除 tab 時，先把 tab 資料庫與所有附件目錄移到暫??trash??
    // ??tabList 成功寫入後才真正刪除；設定失敗則搬回原位??
    async function stageTabStorageForDeletion(tab, stamp) {
        const safe = safeTabFolderName(tab)
        const trashRoot = path.join(TRASH_DIR, `tab_${safe}_${stamp}_${crypto.randomBytes(2).toString('hex')}`)
        const moves = []
        const bases = [TABS_DIR, IMG_BASE_DIR, MOV_BASE_DIR, ATT_BASE_DIR, THUMB_BASE_DIR]
        try {
            for (const base of bases) {
                const src = path.join(base, safe)
                const st = await fs.stat(src).catch(() => null)
                if (!st) continue
                const dest = path.join(trashRoot, path.basename(base), safe)
                await fs.mkdir(path.dirname(dest), { recursive: true })
                await fs.rename(src, dest)
                moves.push({ src, dest })
            }
        } catch (e) {
            await restoreStagedTabStorage(moves)
            throw e
        }
        return { trashRoot, moves }
    }

    async function restoreStagedTabStorage(moves) {
        for (const move of [...moves].reverse()) {
            await fs.mkdir(path.dirname(move.src), { recursive: true }).catch(() => {})
            await fs.rename(move.dest, move.src).catch(() => {})
        }
    }

    async function commitStagedTabDeletion(staged) {
        for (const item of staged) {
            await fs.rm(item.trashRoot, { recursive: true, force: true }).catch(() => {})
            tabUsageCache.delete(item.name)
            lastIndexStats.delete(item.name)
            lastIndexScanAt.delete(item.name)
        }
    }

    // 檔名??ISO 時間??":" 換成??"_"，還原成索引使用的時間字??
    function noteStemToTs(stem) {
        const m = /^(\d{4}-\d{2}-\d{2})T(\d{2})_(\d{2})_(\d{2})(\.\d{1,3})?Z$/.exec(stem)
        if (!m) return stem
        const ms = m[5] ? m[5].padEnd(4, '0').slice(1) : ''
        return `${m[1]}T${m[2]}:${m[3]}:${m[4]}${ms ? '.' + ms : ''}Z`
    }

    function getIndexScanInterval(fileCount) {
        if (fileCount > 50000) return 60 * 60 * 1000
        if (fileCount > 10000) return 30 * 60 * 1000
        if (fileCount > 2000) return 10 * 60 * 1000
        return INDEX_SCAN_DEFAULT_MS
    }

    async function readTabIndexForRepair(tab) {
        const indexPath = getTabIndexPath(tab)
        try {
            const raw = await fs.readFile(indexPath, 'utf-8')
            const parsed = JSON.parse(raw)
            if (!parsed || typeof parsed !== 'object' || !parsed.notes || typeof parsed.notes !== 'object' || Array.isArray(parsed.notes)) {
                throw new Error('invalid index shape')
            }
            return { index: parsed, corrupt: false, raw }
        } catch {
            let raw = null
            try { raw = await fs.readFile(indexPath, 'utf-8') } catch {}
            const corrupt = !!raw
            if (corrupt) {
                // 保留最後一份壞掉的表頭，方便必要時人工比對
                await fs.writeFile(path.join(getTabDir(tab), '_index.corrupt.json'), raw, 'utf-8').catch(() => {})
            }
            return { index: { notes: {} }, corrupt, raw }
        }
    }

    // 比對 _index.json 與實??note 檔，補上漏掉、清掉已不存在的條目
    async function reconcileTabIndex(tab, { force = false, throttleMs } = {}) {
        if (!tab) return null
        const prevStats = lastIndexStats.get(tab)
        const last = lastIndexScanAt.get(tab) || 0
        if (!force) {
            const interval = throttleMs ?? getIndexScanInterval(prevStats?.fileCount || 0)
            if (Date.now() - last < interval) return prevStats || null
        }
        if (indexReconcileLocks.has(tab)) return indexReconcileLocks.get(tab)

        const job = (async () => {
            const dir = getTabDir(tab)
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
            const fileStems = new Set()
            for (const entry of entries) {
                if (!entry.isFile()) continue
                const name = entry.name
                if (!name.toLowerCase().endsWith('.json')) continue
                if (name.startsWith('_') || name.startsWith('.')) continue
                fileStems.add(name.slice(0, -5))
            }

            const { index, corrupt } = await readTabIndexForRepair(tab)
            if (!index.notes || typeof index.notes !== 'object' || Array.isArray(index.notes)) index.notes = {}
            const notes = index.notes
            const indexPath = getTabIndexPath(tab)
            const statBefore = await fs.stat(indexPath).catch(() => null)

            let changed = false
            let added = 0
            let removed = 0
            const indexedSafe = new Set()
            for (const ts of Object.keys(notes)) indexedSafe.add(safeTabFolderName(ts))

            // 檔案存在、表頭沒????補一條（作者不明，標成 Recovered??
            for (const stem of fileStems) {
                if (indexedSafe.has(stem)) continue
                const ts = noteStemToTs(stem)
                const safe = safeTabFolderName(ts)
                if (indexedSafe.has(safe)) continue
                const meta = notes[ts]
                if (meta && typeof meta === 'object') {
                    indexedSafe.add(safe)
                    continue
                }
                notes[ts] = { u: 'Recovered', starred: false, collapsed: false }
                indexedSafe.add(safe)
                added++
                changed = true
            }

            // 表頭有、檔案不存在 ??超過寬限期才移除，避免寫入中的新 note 被誤??
            const now = Date.now()
            for (const ts of Object.keys(notes)) {
                const stem = safeTabFolderName(ts)
                if (fileStems.has(stem)) continue
                const t = new Date(ts).getTime()
                if (!isFinite(t) || now - t < MISSING_FILE_GRACE_MS) continue
                delete notes[ts]
                removed++
                changed = true
            }

            // 掃描期間若索引被其他請求（例如新??note）改寫，放棄這次寫入，避免蓋掉新資料
            const statAfter = await fs.stat(indexPath).catch(() => null)
            const indexChangedDuringScan = (!!statBefore !== !!statAfter)
                || (statBefore && statAfter && (statBefore.mtimeMs !== statAfter.mtimeMs || statBefore.size !== statAfter.size))
            if ((changed || corrupt) && !indexChangedDuringScan) {
                await saveTabIndex(tab, index)
            }
            if (indexChangedDuringScan) {
                added = 0
                removed = 0
            }

            const stats = {
                tab,
                indexCount: Object.keys(notes).length,
                fileCount: fileStems.size,
                added,
                removed,
                corrupt,
                deferred: indexChangedDuringScan && (changed || corrupt),
                scannedAt: now
            }
            if (!stats.deferred) lastIndexScanAt.set(tab, now)
            lastIndexStats.set(tab, stats)
            return stats
        })()

        indexReconcileLocks.set(tab, job)
        try {
            return await job
        } finally {
            indexReconcileLocks.delete(tab)
        }
    }

    async function reconcileAllTabs({ force = true } = {}) {
        const tabs = getTabs()
        const results = []
        for (const tab of tabs) {
            try {
                results.push(await reconcileTabIndex(tab, { force }))
            } catch {}
        }
        return results
    }

    // 掃描 storage/tabs 裡有資料、但設定中不存在??tab，補??tabList
    let storageTabScanPromise = null
    async function ensureStorageTabsRegistered() {
        if (storageTabScanPromise) return storageTabScanPromise

        storageTabScanPromise = (async () => {
            const entries = await fs.readdir(TABS_DIR, { withFileTypes: true }).catch(() => [])
            const list = (api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }])
                .filter(t => t && t.name && t.name.trim())
                .map(t => ({ ...t }))

            const knownFolders = new Set(list.map(t => safeTabFolderName(t.name)))
            const added = []
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                const name = entry.name
                if (name.startsWith('_') || name.startsWith('.')) continue
                if (knownFolders.has(name)) continue
                list.push({ name, category: '', publicNote: false, allowedUsers: [] })
                knownFolders.add(name)
                added.push(name)
            }

            if (added.length > 0) {
                try {
                    await api.setConfig('tabList', list)
                } catch {}
                await syncTabsMapWithConfig().catch(() => {})
            }
            return added
        })()

        try {
            return await storageTabScanPromise
        } finally {
            storageTabScanPromise = null
        }
    }

    async function runFullRepair({ force = true } = {}) {
        const addedTabs = await ensureStorageTabsRegistered().catch(() => [])
        const tabsMap = await syncTabsMapWithConfig().catch(() => null)
        const stats = await reconcileAllTabs({ force })
        if (tabsMap) await saveTabsMap(tabsMap).catch(() => {})
        return {
            addedTabs,
            tabs: stats.filter(Boolean),
            totalAdded: stats.filter(Boolean).reduce((a, s) => a + (s.added || 0), 0),
            totalRemoved: stats.filter(Boolean).reduce((a, s) => a + (s.removed || 0), 0)
        }
    }

    async function getDirectoryUsage(dir, { skipDotFiles = true } = {}) {
        let count = 0
        let size = 0
        const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
        for (const entry of entries) {
            if (!entry.isFile()) continue
            if (skipDotFiles && entry.name.startsWith('.')) continue
            try {
                const st = await fs.stat(path.join(dir, entry.name))
                count++
                size += st.size
            } catch {}
        }
        return { count, size }
    }

    async function getTabAttachmentUsage(tab, { force = false } = {}) {
        const cached = tabUsageCache.get(tab)
        if (!force && cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.value
        const [img, mov, att, thumb] = await Promise.all([
            getDirectoryUsage(getTabImgDir(tab)),
            getDirectoryUsage(getTabMovDir(tab)),
            getDirectoryUsage(getTabAttDir(tab)),
            getDirectoryUsage(getTabThumbDir(tab))
        ])
        const value = {
            img, mov, att, thumb,
            totalSize: img.size + mov.size + att.size + thumb.size,
            totalCount: img.count + mov.count + att.count + thumb.count
        }
        tabUsageCache.set(tab, { at: Date.now(), value })
        return value
    }

    async function getTabStatsForAdmin(tab, { forceUsage = false } = {}) {
        let stats = lastIndexStats.get(tab) || null
        try {
            stats = await reconcileTabIndex(tab, { throttleMs: 10 * 60 * 1000 }) || stats
        } catch {}
        const index = await loadTabIndex(tab)
        const attachments = await getTabAttachmentUsage(tab, { force: forceUsage })
        const cfg = getTabConfig(tab) || {}
        return {
            name: tab,
            folder: safeTabFolderName(tab),
            category: cfg.category || '',
            publicNote: cfg.publicNote === true,
            allowedUsers: Array.isArray(cfg.allowedUsers) ? cfg.allowedUsers.filter(Boolean) : [],
            indexCount: Object.keys(index.notes || {}).length,
            fileCount: stats ? stats.fileCount : null,
            orphanCount: stats ? stats.added : null,
            missingCount: stats ? stats.removed : null,
            scannedAt: stats ? stats.scannedAt : null,
            attachments
        }
    }

    async function collectReferencedAttachmentIds(tabs) {
        const refs = { img: new Set(), mov: new Set(), att: new Set() }
        for (const tab of tabs) {
            const index = await loadTabIndex(tab)
            for (const ts of Object.keys(index.notes || {})) {
                const content = await loadNoteContent(tab, ts)
                if (!content) continue
                for (const id of extractImageIds(content)) refs.img.add(id)
                for (const id of extractMovIds(content)) refs.mov.add(id)
                for (const id of extractAttIds(content)) refs.att.add(id)
            }
        }
        return refs
    }

    // 刪除 tab 目錄內沒有被任何 note 引用的孤立附件／縮圖
    async function cleanTabOrphanAttachments(tab, refs) {
        let deleted = 0
        let freedBytes = 0

        const removeFiles = async (dir, keep) => {
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
            for (const entry of entries) {
                if (!entry.isFile() || entry.name.startsWith('.')) continue
                if (keep(entry.name)) continue
                const filePath = path.join(dir, entry.name)
                try {
                    const st = await fs.stat(filePath)
                    await fs.unlink(filePath)
                    deleted++
                    freedBytes += st.size
                } catch {}
            }
        }

        await removeFiles(getTabImgDir(tab), name => refs.img.has(name))
        await removeFiles(getTabMovDir(tab), name => refs.mov.has(name))
        await removeFiles(getTabAttDir(tab), name => refs.att.has(name))
        await removeFiles(getTabThumbDir(tab), name => {
            if (refs.img.has(name) || refs.mov.has(name)) return true
            const base = path.basename(name, path.extname(name)).toLowerCase()
            for (const id of refs.mov) {
                if (path.basename(id, path.extname(id)).toLowerCase() === base) return true
            }
            return false
        })

        if (deleted > 0) tabUsageCache.delete(tab)
        return { deleted, freedBytes }
    }

    async function addNoteToTab(tab, ts, noteData) {
        const index = await loadTabIndex(tab)
        index.notes[ts] = {
            u: noteData.u,
            starred: noteData.starred || false,
            collapsed: noteData.collapsed || false
        }
        await saveTabIndex(tab, index)
        await saveNoteContent(tab, ts, noteData.m)
    }

    async function updateNoteInTab(tab, ts, noteData) {
        const index = await loadTabIndex(tab)
        if (!index.notes[ts]) return false
        if (noteData.m !== undefined) {
            await saveNoteContent(tab, ts, noteData.m)
        }
        if (noteData.u !== undefined) index.notes[ts].u = noteData.u
        if (noteData.starred !== undefined) index.notes[ts].starred = noteData.starred
        if (noteData.collapsed !== undefined) index.notes[ts].collapsed = noteData.collapsed
        await saveTabIndex(tab, index)
        return true
    }

    async function deleteNoteFromTab(tab, ts) {
        const index = await loadTabIndex(tab)
        if (!index.notes[ts]) return null
        const noteMeta = index.notes[ts]
        delete index.notes[ts]
        await saveTabIndex(tab, index)
        await deleteNoteFile(tab, ts)
        return noteMeta
    }

    async function getNoteWithContent(tab, ts) {
        const index = await loadTabIndex(tab)
        const meta = index.notes[ts]
        if (!meta) return null
        const content = await loadNoteContent(tab, ts)
        if (content === null) return null
        return {
            m: content,
            u: meta.u,
            starred: meta.starred || false,
            collapsed: meta.collapsed || false
        }
    }

    async function clearTabData(tab) {
        const dir = getTabDir(tab)
        try {
            await fs.rm(dir, { recursive: true, force: true })
        } catch {}
    }

    async function saveFileName(tab, type, fileId, originalName) {
        const mapPath = getNameMapPath(tab, type)
        const dir = type === 'mov' ? getTabMovDir(tab) : getTabAttDir(tab)
        await ensureDir(dir)
        let nameMap = {}
        try {
            nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
        } catch {}
        nameMap[fileId] = originalName
        await fs.writeFile(mapPath, JSON.stringify(nameMap))
    }

    async function getFileName(tab, type, fileId) {
        const mapPath = getNameMapPath(tab, type)
        try {
            const nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
            if (nameMap[fileId]) return nameMap[fileId]
        } catch {}

        try {
            const tempMapPath = path.join(TEMP_DIR, '_temp_names.json')
            const tempNameMap = JSON.parse(await fs.readFile(tempMapPath, 'utf-8'))
            if (tempNameMap[fileId]) return tempNameMap[fileId]
        } catch {}

        const parts = fileId.split('_')
        if (parts.length >= 3) {
            const originalParts = parts.slice(2)
            const originalName = originalParts.join('_')
            return originalName
        }
        return fileId
    }

    async function cleanFileNameMapping(tab, type, removedIds) {
        if (removedIds.length === 0) return
        const mapPath = getNameMapPath(tab, type)
        try {
            const nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
            for (const id of removedIds) delete nameMap[id]
            await fs.writeFile(mapPath, JSON.stringify(nameMap))
        } catch {}
    }

    async function ensureDir(dir) {
        try {
            await fs.mkdir(dir, { recursive: true })
        } catch (e) {
            if (e.code !== 'EEXIST') throw e
        }
        return dir
    }

    function extractImageIds(content) {
        if (!content) return []
        const matches = content.match(/\[img:(.+?)\]/g)
        if (!matches) return []
        return matches.map(m => m.slice(5, -1))
    }

    function extractMovIds(content) {
        if (!content) return []
        const matches = content.match(/\[mov:(.+?):/g)
        if (!matches) return []
        return matches.map(m => m.slice(5, -1))
    }

    function extractAttIds(content) {
        if (!content) return []
        const matches = content.match(/\[att:(.+?):/g)
        if (!matches) return []
        return matches.map(m => m.slice(5, -1))
    }

    function extractAllAttachmentIds(content) {
        return {
            img: extractImageIds(content),
            mov: extractMovIds(content),
            att: extractAttIds(content)
        }
    }

    function parseTimeToSeconds(timeStr) {
        if (!timeStr.includes(':')) {
            return parseFloat(timeStr) || 0
        }
        const parts = timeStr.split(':')
        if (parts.length !== 3) return 0
        const hours = parseInt(parts[0]) || 0
        const minutes = parseInt(parts[1]) || 0
        const seconds = parseFloat(parts[2]) || 0
        return hours * 3600 + minutes * 60 + seconds
    }

    function formatTimeFromSeconds(seconds) {
        const hrs = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        const secs = Math.floor(seconds % 60)
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    function getGradientParams() {
        const gifWidth = api.getConfig('gif_width') || 320

        return {
            SHORT: {
                startTime: parseTimeToSeconds(api.getConfig('short_video_start_time') || '00:03:00'),
                duration: api.getConfig('short_video_duration') || 10,
                fps: api.getConfig('short_video_fps') || 5,
                width: gifWidth
            },
            LONG: {
                startTime: parseTimeToSeconds(api.getConfig('long_video_start_time') || '00:10:00'),
                duration: api.getConfig('long_video_duration') || 12,
                fps: api.getConfig('long_video_fps') || 6,
                width: gifWidth
            },
            BACKUP: {
                startTime: parseTimeToSeconds(api.getConfig('backup_video_start_time') || '00:00:00'),
                duration: api.getConfig('backup_video_duration') || 6,
                fps: api.getConfig('backup_video_fps') || 5,
                width: gifWidth
            }
        }
    }

    async function generateGifWithParams(filePath, outputPath, params) {
        const startTime = params.startTime
        const duration = params.duration
        const fps = params.fps
        const width = params.width

        const palettePath = outputPath.replace(/\.gif$/i, '_palette.png')

        const paletteArgs = [
            '-ss', formatTimeFromSeconds(startTime),
            '-t', '5',
            '-i', filePath,
            '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`,
            '-y', palettePath
        ]

        await new Promise(resolve => {
            const paletteProc = spawn(api.getConfig('ffmpeg_path') || 'ffmpeg', paletteArgs)
            paletteProc.on('exit', code => {
                if (code !== 0) {
                    fs.unlink(palettePath).catch(() => {})
                }
                resolve()
            })
            paletteProc.on('error', () => {
                fs.unlink(palettePath).catch(() => {})
                resolve()
            })
            paletteProc.stderr?.on('data', () => {})
        })

        const gifArgs = [
            '-ss', formatTimeFromSeconds(startTime),
            '-t', duration.toString(),
            '-i', filePath,
            '-i', palettePath,
            '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
            '-loop', '0',
            '-f', 'gif',
            '-y', outputPath
        ]

        return new Promise(resolve => {
            const gifProc = spawn(api.getConfig('ffmpeg_path') || 'ffmpeg', gifArgs)
            gifProc.stderr?.on('data', () => {})
            gifProc.on('exit', async code => {
                try { await fs.unlink(palettePath) } catch {}
                if (code === 0) {
                    try {
                        const stats = await fs.stat(outputPath)
                        if (stats.size > 0) {
                            resolve(true)
                        } else {
                            try { await fs.unlink(outputPath) } catch {}
                            resolve(false)
                        }
                    } catch {
                        resolve(false)
                    }
                } else {
                    try { await fs.unlink(outputPath) } catch {}
                    resolve(false)
                }
            })
            gifProc.on('error', async () => {
                try { await fs.unlink(palettePath) } catch {}
                try { await fs.unlink(outputPath) } catch {}
                resolve(false)
            })
        })
    }

    async function generateThumbnailWithSharp(imageBuffer, outputPath) {
        try {
            const quality = api.getConfig('thumbQuality') || THUMB_QUALITY
            const pixels = api.getConfig('thumbPixels') || 400

            const sharpResults = api.customApiCall('sharp', imageBuffer)
            const sharp = sharpResults && sharpResults[0]

            if (sharp) {
                await sharp
                    .resize(pixels, pixels, { fit: 'inside', withoutEnlargement: true })
                    .rotate()
                    .jpeg({ quality })
                    .toFile(outputPath)
                return true
            }

            try {
                const sharpModule = api.require('sharp')
                if (sharpModule) {
                    await sharpModule(imageBuffer)
                        .resize(pixels, pixels, { fit: 'inside', withoutEnlargement: true })
                        .rotate()
                        .jpeg({ quality })
                        .toFile(outputPath)
                    return true
                }
            } catch (requireErr) {}

            await fs.writeFile(outputPath, imageBuffer)
            return true
        } catch (e) {
            try {
                await fs.writeFile(outputPath, imageBuffer)
                return true
            } catch {
                return false
            }
        }
    }

    async function generateThumbnail(imageBuffer, outputPath) {
        try {
            const useSharp = api.getConfig('useSharpPlugin') !== false
            if (useSharp) {
                return await generateThumbnailWithSharp(imageBuffer, outputPath)
            }
            await fs.writeFile(outputPath, imageBuffer)
            return true
        } catch (e) {
            return false
        }
    }

    async function extractVideoThumbnail(videoPath, tab, fileId) {
        try {
            const ffmpegPath = api.getConfig('ffmpeg_path') || 'ffmpeg'
            const thumbFormat = api.getConfig('thumbnail_format') || 'jpg'

            const thumbDir = await ensureDir(getTabThumbDir(tab))
            const ext = path.extname(fileId)
            const baseName = path.basename(fileId, ext)
            const thumbId = baseName + '.' + thumbFormat
            const thumbPath = path.join(thumbDir, thumbId)

            try {
                await fs.stat(thumbPath)
                return true
            } catch {}

            try {
                const stats = await fs.stat(videoPath)
                if (stats.size === 0) return false
            } catch {
                return false
            }

            if (thumbFormat === 'jpg') {
                const thumbTimeConfig = api.getConfig('thumbnail_time') || '00:00:05'
                let timeInSeconds
                if (thumbTimeConfig.includes(':')) {
                    timeInSeconds = parseTimeToSeconds(thumbTimeConfig)
                } else {
                    timeInSeconds = parseInt(thumbTimeConfig) || 5
                }

                return new Promise((resolve) => {
                    const timeOffsets = [0, 0.5, 1, 1.5, 2, 3, 5]
                    let maxAttempts = Math.min(timeOffsets.length, 5)
                    let success = false
                    let finished = false

                    const finish = (result) => {
                        if (finished) return
                        finished = true
                        resolve(result)
                    }

                    const tryExtract = (offsetIndex) => {
                        if (offsetIndex >= maxAttempts || success) {
                            if (!success) finish(false)
                            return
                        }

                        const offset = timeOffsets[offsetIndex] || 5
                        const timeStr = formatTimeFromSeconds(timeInSeconds + offset)

                        const ffmpeg = spawn(ffmpegPath, [
                            '-ss', timeStr,
                            '-i', videoPath,
                            '-vframes', '1',
                            '-q:v', '2',
                            '-f', 'image2',
                            '-y', thumbPath
                        ])

                        ffmpeg.stderr?.on('data', () => {})

                        let retried = false
                        const retryOnce = () => {
                            if (retried || success) return
                            retried = true
                            tryExtract(offsetIndex + 1)
                        }

                        ffmpeg.on('exit', (code) => {
                            if (code === 0) {
                                fs.stat(thumbPath).then(() => {
                                    success = true
                                    finish(true)
                                }).catch(() => {
                                    retryOnce()
                                })
                            } else {
                                retryOnce()
                            }
                        })

                        ffmpeg.on('error', () => {
                            retryOnce()
                        })

                        setTimeout(() => {
                            retryOnce()
                        }, 5000)
                    }

                    tryExtract(0)
                })
            } else {
                const stats = await fs.stat(videoPath)
                const fileSizeMB = stats.size / (1024 * 1024)

                const gradientParams = getGradientParams()
                const threshold = api.getConfig('video_size_threshold') || 250
                const isLongVideo = fileSizeMB > threshold

                let success = false

                if (isLongVideo) {
                    success = await generateGifWithParams(videoPath, thumbPath, gradientParams.LONG)
                    if (!success) {
                        success = await generateGifWithParams(videoPath, thumbPath, gradientParams.SHORT)
                    }
                } else {
                    success = await generateGifWithParams(videoPath, thumbPath, gradientParams.SHORT)
                }

                if (!success) {
                    success = await generateGifWithParams(videoPath, thumbPath, gradientParams.BACKUP)
                }

                if (!success) {
                    try { await fs.unlink(thumbPath) } catch {}
                }

                return success
            }
        } catch (e) {
            return false
        }
    }

    async function deleteVideoThumbnail(tab, fileId) {
        try {
            const thumbDir = getTabThumbDir(tab)
            const ext = path.extname(fileId)
            const baseName = path.basename(fileId, ext)
            const jpgPath = path.join(thumbDir, baseName + '.jpg')
            const gifPath = path.join(thumbDir, baseName + '.gif')
            await fs.unlink(jpgPath).catch(() => {})
            await fs.unlink(gifPath).catch(() => {})
        } catch {}
    }

    function hasThumbnail(tab, mediaId) {
        const thumbDir = getTabThumbDir(tab)

        let thumbPath = path.join(thumbDir, mediaId)
        if (fss.existsSync(thumbPath)) return true

        const ext = path.extname(mediaId)
        if (['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv'].includes(ext.toLowerCase())) {
            const baseName = path.basename(mediaId, ext)
            thumbPath = path.join(thumbDir, baseName + '.jpg')
            if (fss.existsSync(thumbPath)) return true
            thumbPath = path.join(thumbDir, baseName + '.gif')
            if (fss.existsSync(thumbPath)) return true
        }

        return false
    }

    async function promoteFileFromTemp(fileId, targetDir) {
        const tempPath = getTempPath(fileId)
        await ensureDir(targetDir)
        const finalPath = path.join(targetDir, fileId)

        try {
            await fs.stat(tempPath)
            await fs.copyFile(tempPath, finalPath)

            const tempMapPath = path.join(TEMP_DIR, '_temp_names.json')
            try {
                const tempNameMap = JSON.parse(await fs.readFile(tempMapPath, 'utf-8'))
                if (tempNameMap[fileId]) {
                    const mapPath = path.join(targetDir, '.filenames')
                    let nameMap = {}
                    try {
                        nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
                    } catch {}
                    nameMap[fileId] = tempNameMap[fileId]
                    await fs.writeFile(mapPath, JSON.stringify(nameMap))
                }
            } catch {}
            return true
        } catch {
            return false
        }
    }

    async function promoteImageFromTemp(imageId, tab) {
        const imgDir = getTabImgDir(tab)
        const thumbDir = getTabThumbDir(tab)
        const tempPath = getTempPath(imageId)
        const finalPath = path.join(imgDir, imageId)
        const thumbPath = path.join(thumbDir, imageId)

        try {
            await fs.stat(tempPath)
            await ensureDir(imgDir)
            await ensureDir(thumbDir)

            const imgBuffer = await fs.readFile(tempPath)
            await generateThumbnail(imgBuffer, thumbPath)
            await fs.copyFile(tempPath, finalPath)

            const tempThumbPath = path.join(THUMB_BASE_DIR, '_temp', imageId)
            fs.unlink(tempThumbPath).catch(() => {})

            return true
        } catch (e) {
            return false
        }
    }

    async function promoteAllAttachments(content, tab) {
        const { img, mov, att } = extractAllAttachmentIds(content)

        const promotePromises = []

        for (const imgId of img) {
            promotePromises.push(
                promoteImageFromTemp(imgId, tab).then(promoted => {
                    if (promoted) {
                        setTimeout(() => {
                            fs.unlink(getTempPath(imgId)).catch(() => {})
                        }, TEMP_FILE_TTL)
                    }
                    return promoted
                })
            )
        }

        for (const movId of mov) {
            const movDir = getTabMovDir(tab)
            promotePromises.push(
                promoteFileFromTemp(movId, movDir).then(promoted => {
                    if (promoted) {
                        const videoPath = path.join(movDir, movId)
                        extractVideoThumbnail(videoPath, tab, movId).catch(() => {})
                        setTimeout(() => {
                            fs.unlink(getTempPath(movId)).catch(() => {})
                        }, TEMP_FILE_TTL)
                    }
                    return promoted
                })
            )
        }

        for (const attId of att) {
            const attDir = getTabAttDir(tab)
            promotePromises.push(
                promoteFileFromTemp(attId, attDir).then(promoted => {
                    if (promoted) {
                        setTimeout(() => {
                            fs.unlink(getTempPath(attId)).catch(() => {})
                        }, TEMP_FILE_TTL)
                    }
                    return promoted
                })
            )
        }

        await Promise.all(promotePromises)
    }

    async function deleteAttachmentAcrossAllTabs(fileId, fileType) {
        const tabs = getTabs()
        const deletePromises = []

        deletePromises.push(fs.unlink(getTempPath(fileId)).catch(() => {}))

        if (fileType === 'img') {
            for (const tab of tabs) {
                const imgDir = getTabImgDir(tab)
                deletePromises.push(fs.unlink(path.join(imgDir, fileId)).catch(() => {}))
            }
        } else if (fileType === 'thumb') {
            for (const tab of tabs) {
                const thumbDir = getTabThumbDir(tab)
                const ext = path.extname(fileId)
                const baseName = path.basename(fileId, ext)
                deletePromises.push(fs.unlink(path.join(thumbDir, fileId)).catch(() => {}))
                deletePromises.push(fs.unlink(path.join(thumbDir, baseName + '.jpg')).catch(() => {}))
                deletePromises.push(fs.unlink(path.join(thumbDir, baseName + '.gif')).catch(() => {}))
            }
        } else if (fileType === 'mov') {
            for (const tab of tabs) {
                const movDir = getTabMovDir(tab)
                deletePromises.push(fs.unlink(path.join(movDir, fileId)).catch(() => {}))
                const ext = path.extname(fileId)
                const baseName = path.basename(fileId, ext)
                const thumbDir = getTabThumbDir(tab)
                deletePromises.push(fs.unlink(path.join(thumbDir, baseName + '.jpg')).catch(() => {}))
                deletePromises.push(fs.unlink(path.join(thumbDir, baseName + '.gif')).catch(() => {}))
            }
        } else if (fileType === 'att') {
            for (const tab of tabs) {
                const attDir = getTabAttDir(tab)
                deletePromises.push(fs.unlink(path.join(attDir, fileId)).catch(() => {}))
            }
        }

        await Promise.all(deletePromises)

        if (fileType === 'mov') {
            for (const tab of tabs) {
                await cleanFileNameMapping(tab, 'mov', [fileId])
            }
        } else if (fileType === 'att') {
            for (const tab of tabs) {
                await cleanFileNameMapping(tab, 'att', [fileId])
            }
        }
    }

    async function cleanupTempFiles() {
        try {
            const cutoff = Date.now() - TEMP_FILE_TTL
            const files = await fs.readdir(TEMP_DIR).catch(() => [])

            for (const file of files) {
                const filePath = path.join(TEMP_DIR, file)
                try {
                    const stat = await fs.stat(filePath)
                    if (stat.isDirectory()) continue
                    if (stat.mtimeMs < cutoff) {
                        await fs.unlink(filePath)
                    }
                } catch {}
            }

            const tempThumbDir = path.join(THUMB_BASE_DIR, '_temp')
            const thumbFiles = await fs.readdir(tempThumbDir).catch(() => [])
            for (const file of thumbFiles) {
                const filePath = path.join(tempThumbDir, file)
                try {
                    const stat = await fs.stat(filePath)
                    if (stat.mtimeMs < cutoff) {
                        await fs.unlink(filePath)
                    }
                } catch {}
            }

            // 清理超過 1 小時??chunk 會話
            try {
                const chunksRoot = path.join(TEMP_DIR, 'chunks')
                const sessionDirs = await fs.readdir(chunksRoot).catch(() => [])
                const staleCutoff = Date.now() - 60 * 60 * 1000
                for (const dirName of sessionDirs) {
                    const dirPath = path.join(chunksRoot, dirName)
                    try {
                        const st = await fs.stat(dirPath)
                        if (st.mtimeMs < staleCutoff) {
                            await fs.rm(dirPath, { recursive: true, force: true })
                        }
                    } catch {}
                }
            } catch {}

            // 清理超過 7 天的 tab 刪除暫存（正常會在刪除成功後立即清掉??
            try {
                const trashEntries = await fs.readdir(TRASH_DIR, { withFileTypes: true }).catch(() => [])
                const trashCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
                for (const entry of trashEntries) {
                    if (!entry.isDirectory()) continue
                    const dirPath = path.join(TRASH_DIR, entry.name)
                    try {
                        const st = await fs.stat(dirPath)
                        if (st.mtimeMs < trashCutoff) {
                            await fs.rm(dirPath, { recursive: true, force: true })
                        }
                    } catch {}
                }
            } catch {}
        } catch {}
    }

    // ============================================
    // 備份打包：內??ZIP 寫入器（只依??Node 內建 zlib??
    // ============================================
    const ZIP_CRC_TABLE = (() => {
        const table = new Uint32Array(256)
        for (let i = 0; i < 256; i++) {
            let c = i
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
            table[i] = c >>> 0
        }
        return table
    })()

    function zipCrc32(buf) {
        let crc = 0xFFFFFFFF
        for (let i = 0; i < buf.length; i++) {
            crc = ZIP_CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
        }
        return (crc ^ 0xFFFFFFFF) >>> 0
    }

    function toDosDateTime(date) {
        const d = (date instanceof Date && !isNaN(date)) ? date : new Date()
        const year = Math.min(2107, Math.max(1980, d.getFullYear()))
        return {
            time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1F),
            date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
        }
    }

    async function zipDirectory(srcDir, zipPath) {
        const central = []
        let offset = 0
        let fileCount = 0
        let totalSize = 0
        let ok = false
        const fh = await fs.open(zipPath, 'w')

        try {
            const walk = async (dir, relBase) => {
                const entries = await fs.readdir(dir, { withFileTypes: true })
                entries.sort((a, b) => a.name.localeCompare(b.name))

                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue
                    const abs = path.join(dir, entry.name)
                    const rel = relBase ? `${relBase}/${entry.name}` : entry.name

                    if (entry.isDirectory()) {
                        await walk(abs, rel)
                        continue
                    }
                    if (!entry.isFile()) continue

                    const stat = await fs.stat(abs)
                    const data = await fs.readFile(abs)
                    const deflated = zlib.deflateRawSync(data, { level: 9 })
                    const useDeflate = deflated.length < data.length
                    const method = useDeflate ? 8 : 0
                    const payload = useDeflate ? deflated : data
                    const nameBuf = Buffer.from(rel, 'utf8')
                    const crc = zipCrc32(data)
                    const dos = toDosDateTime(stat.mtime)
                    const localOffset = offset

                    const local = Buffer.alloc(30)
                    local.writeUInt32LE(0x04034b50, 0)   // local file header signature
                    local.writeUInt16LE(20, 4)           // version needed
                    local.writeUInt16LE(0x0800, 6)       // UTF-8 filename flag
                    local.writeUInt16LE(method, 8)
                    local.writeUInt16LE(dos.time, 10)
                    local.writeUInt16LE(dos.date, 12)
                    local.writeUInt32LE(crc, 14)
                    local.writeUInt32LE(payload.length, 18)
                    local.writeUInt32LE(data.length, 22)
                    local.writeUInt16LE(nameBuf.length, 26)
                    local.writeUInt16LE(0, 28)

                    await fh.write(local)
                    await fh.write(nameBuf)
                    await fh.write(payload)

                    offset += 30 + nameBuf.length + payload.length
                    central.push({ nameBuf, method, dos, crc, compSize: payload.length, uncompSize: data.length, localOffset })
                    fileCount++
                    totalSize += data.length
                }
            }

            await walk(srcDir, '')

            if (central.length > 0xFFFF) throw new Error('too many files for zip')

            const cdStart = offset
            for (const e of central) {
                const h = Buffer.alloc(46)
                h.writeUInt32LE(0x02014b50, 0)       // central directory signature
                h.writeUInt16LE(20, 4)               // version made by
                h.writeUInt16LE(20, 6)               // version needed
                h.writeUInt16LE(0x0800, 8)           // UTF-8 filename flag
                h.writeUInt16LE(e.method, 10)
                h.writeUInt16LE(e.dos.time, 12)
                h.writeUInt16LE(e.dos.date, 14)
                h.writeUInt32LE(e.crc, 16)
                h.writeUInt32LE(e.compSize, 20)
                h.writeUInt32LE(e.uncompSize, 24)
                h.writeUInt16LE(e.nameBuf.length, 28)
                h.writeUInt16LE(0, 30)               // extra length
                h.writeUInt16LE(0, 32)               // comment length
                h.writeUInt16LE(0, 34)               // disk number
                h.writeUInt16LE(0, 36)               // internal attrs
                h.writeUInt32LE(0, 38)               // external attrs
                h.writeUInt32LE(e.localOffset, 42)
                await fh.write(h)
                await fh.write(e.nameBuf)
                offset += 46 + e.nameBuf.length
            }

            const cdSize = offset - cdStart
            const eocd = Buffer.alloc(22)
            eocd.writeUInt32LE(0x06054b50, 0)       // end of central directory
            eocd.writeUInt16LE(0, 4)
            eocd.writeUInt16LE(0, 6)
            eocd.writeUInt16LE(central.length, 8)
            eocd.writeUInt16LE(central.length, 10)
            eocd.writeUInt32LE(cdSize, 12)
            eocd.writeUInt32LE(cdStart, 16)
            eocd.writeUInt16LE(0, 20)
            await fh.write(eocd)

            ok = true
            return { fileCount, totalSize }
        } finally {
            await fh.close().catch(() => {})
            if (!ok) await fs.unlink(zipPath).catch(() => {})
        }
    }

    // 解壓我們自己產生的備份 ZIP（store/deflate，UTF-8 檔名??
    async function unzipToDirectory(zipPath, destDir) {
        const buf = await fs.readFile(zipPath)
        const eocdSignature = Buffer.from([0x50, 0x4b, 0x05, 0x06])
        const eocd = buf.lastIndexOf(eocdSignature)
        if (eocd < 0 || eocd + 22 > buf.length) throw new Error('Invalid zip: missing central directory')

        const entryCount = buf.readUInt16LE(eocd + 10)
        const cdSize = buf.readUInt32LE(eocd + 12)
        const cdOffset = buf.readUInt32LE(eocd + 16)
        if (cdOffset + cdSize > buf.length) throw new Error('Invalid zip: bad central directory')

        await fs.mkdir(destDir, { recursive: true })
        let offset = cdOffset
        let files = 0

        for (let i = 0; i < entryCount; i++) {
            if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== 0x02014b50) {
                throw new Error('Invalid zip: bad central entry')
            }
            const flags = buf.readUInt16LE(offset + 8)
            const method = buf.readUInt16LE(offset + 10)
            const compSize = buf.readUInt32LE(offset + 20)
            const nameLen = buf.readUInt16LE(offset + 28)
            const extraLen = buf.readUInt16LE(offset + 30)
            const commentLen = buf.readUInt16LE(offset + 32)
            const localOffset = buf.readUInt32LE(offset + 42)
            const nameEnd = offset + 46 + nameLen
            const rawName = buf.toString('utf8', offset + 46, nameEnd)
            offset = nameEnd + extraLen + commentLen

            if (flags & 0x1) throw new Error('Encrypted zip entries are not supported')
            if (localOffset + 30 > buf.length || buf.readUInt32LE(localOffset) !== 0x04034b50) {
                throw new Error('Invalid zip: bad local header')
            }
            const localNameLen = buf.readUInt16LE(localOffset + 26)
            const localExtraLen = buf.readUInt16LE(localOffset + 28)
            const dataStart = localOffset + 30 + localNameLen + localExtraLen
            const dataEnd = dataStart + compSize
            if (dataEnd > buf.length) throw new Error('Invalid zip: truncated data')

            const name = rawName.replace(/\\/g, '/')
            if (!name || name.startsWith('/') || name.split('/').includes('..')) continue
            const target = path.join(destDir, ...name.split('/').filter(Boolean))
            if (name.endsWith('/')) {
                await fs.mkdir(target, { recursive: true })
                continue
            }

            const payload = buf.subarray(dataStart, dataEnd)
            const data = method === 8 ? zlib.inflateRawSync(payload) : payload
            await fs.mkdir(path.dirname(target), { recursive: true })
            await fs.writeFile(target, data)
            files++
        }

        return { files }
    }

    // ============================================
    // 備份節奏：持久化「上次備份時間」，重啟不歸??
    // ============================================
    function parseBackupNameDate(name) {
        const m = /^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})(?:\.zip)?$/i.exec(name)
        if (!m) return 0
        return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6])).getTime()
    }

    async function getLatestBackupTime() {
        let latest = 0
        try {
            const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true })
            for (const entry of entries) {
                if (entry.name === 'txt_exports') continue
                if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
                if (!entry.isDirectory() && !entry.name.toLowerCase().endsWith('.zip')) continue
                const t = parseBackupNameDate(entry.name)
                if (t > latest) latest = t
            }
        } catch {}
        return latest
    }

    async function writeBackupState(ts) {
        lastBackupAt = ts
        const tmp = `${BACKUP_STATE_FILE}.tmp`
        try {
            await fs.writeFile(tmp, JSON.stringify({
                lastBackupAt: ts,
                updatedAt: new Date(ts).toISOString()
            }, null, 2), 'utf-8')
            await fs.rename(tmp, BACKUP_STATE_FILE)
        } catch {
            await fs.unlink(tmp).catch(() => {})
        }
    }

    async function initBackupState() {
        let stored = 0
        try {
            const parsed = JSON.parse(await fs.readFile(BACKUP_STATE_FILE, 'utf-8'))
            const t = Number(parsed && parsed.lastBackupAt)
            if (isFinite(t) && t > 0) stored = t
        } catch {}

        const latest = await getLatestBackupTime()
        lastBackupAt = Math.max(stored, latest)

        // 全新安裝、沒有任何歷史備份：從現在開始計時，第一次備份在一個間隔之??
        if (!lastBackupAt) lastBackupAt = Date.now()
        if (!stored || stored !== lastBackupAt) await writeBackupState(lastBackupAt)

        backupStateReady = true
        return lastBackupAt
    }

    function getBackupIntervalMs() {
        const raw = api.getConfig('backupInterval')
        // 未設定時沿用預設 6 小時；明確設 0 才代表停??
        const hours = (raw === undefined || raw === null || raw === '') ? 6 : Number(raw)
        if (!isFinite(hours) || hours <= 0) return 0
        return hours * 60 * 60 * 1000
    }

    async function checkBackupDue() {
        if (!backupStateReady) return
        if (isBackupRunning) return
        const intervalMs = getBackupIntervalMs()
        if (intervalMs <= 0) return
        if (Date.now() - lastBackupAt < intervalMs) return
        await performScheduledBackup()
    }

    // 舊版備份是散落的資料夾：啟用時自動打包成單一 zip 並移除原資料??
    async function migrateLegacyBackups() {
        if (isBackupRunning) return 0
        let migrated = 0

        const packFolder = async (folder, zipPath) => {
            try {
                // 只處理至少一分鐘沒有變動的資料夾，避免打包到其他程序正在寫入的備??
                const st = await fs.stat(folder).catch(() => null)
                if (!st || Date.now() - st.mtimeMs < 60 * 1000) return
                const zst = await fs.stat(zipPath).catch(() => null)
                if (!zst || zst.size < 22) await zipDirectory(folder, zipPath)
                await fs.rm(folder, { recursive: true, force: true })
                migrated++
            } catch {}
        }

        const roots = [
            { dir: BACKUP_DIR, skip: new Set(['txt_exports']) },
            { dir: path.join(BACKUP_DIR, 'txt_exports'), skip: new Set() }
        ]

        for (const { dir, skip } of roots) {
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                if (skip.has(entry.name) || entry.name.startsWith('_') || entry.name.startsWith('.')) continue
                if (!parseBackupNameDate(entry.name)) continue
                await packFolder(path.join(dir, entry.name), path.join(dir, `${entry.name}.zip`))
            }
        }

        return migrated
    }

    // 避免同一秒內連續備份覆蓋同一??zip（尤??rollback 前建立的安全備份??
    async function getUniqueBackupTimestamp() {
        const base = Date.now()
        for (let i = 0; i < 300; i++) {
            const ts = getTimestamp(new Date(base + i * 1000))
            const zipExists = await fs.stat(path.join(BACKUP_DIR, `${ts}.zip`)).then(() => true).catch(() => false)
            const folderExists = await fs.stat(path.join(BACKUP_DIR, ts)).then(() => true).catch(() => false)
            if (!zipExists && !folderExists) return ts
        }
        return getTimestamp()
    }

    async function createBackup() {
        const tabs = getTabs()
        const timestamp = await getUniqueBackupTimestamp()
        const backupFolder = path.join(BACKUP_DIR, timestamp)
        const backupTabsDir = path.join(backupFolder, 'tabs')

        await fs.mkdir(backupTabsDir, { recursive: true }).catch(() => {})

        let backedUpCount = 0

        for (const tab of tabs) {
            try {
                const tabDir = getTabDir(tab)
                const backupTabDir = path.join(backupTabsDir, path.basename(tabDir))

                try {
                    await fs.stat(tabDir)
                } catch {
                    continue
                }

                await fs.mkdir(backupTabDir, { recursive: true }).catch(() => {})

                const files = await fs.readdir(tabDir)
                for (const file of files) {
                    const srcPath = path.join(tabDir, file)
                    const dstPath = path.join(backupTabDir, file)
                    try {
                        await fs.copyFile(srcPath, dstPath)
                        backedUpCount++
                    } catch {}
                }
            } catch (e) {}
        }

        try {
            const mapSrc = TABS_MAP_FILE
            const mapDst = path.join(backupTabsDir, '_tabs_map.json')
            await fs.copyFile(mapSrc, mapDst).catch(() => {})
        } catch {}

        // 備份資訊（也確保 zip 永遠至少有一個檔案，避免空壓縮檔無法解壓??
        try {
            await fs.writeFile(path.join(backupFolder, 'backup_info.json'), JSON.stringify({
                timestamp,
                createdAt: new Date().toISOString(),
                tabs,
                fileCount: backedUpCount
            }, null, 2), 'utf-8')
        } catch {}

        // 打包成單一 zip，避免每次備份都留下大量散落的資料夾與檔??
        const zipPath = path.join(BACKUP_DIR, `${timestamp}.zip`)
        let zipped = false
        try {
            await zipDirectory(backupFolder, zipPath)
            zipped = true
            await fs.rm(backupFolder, { recursive: true, force: true })
        } catch {
            // 打包失敗就保留原始資料夾，資料不遺失
            await fs.unlink(zipPath).catch(() => {})
        }

        await writeBackupState(Date.now())

        return {
            backupFolder: zipped ? zipPath : backupFolder,
            backupPath: zipped ? zipPath : backupFolder,
            zipPath: zipped ? zipPath : null,
            zipped,
            backedUpCount
        }
    }

    async function exportTxtFiles() {
        const autoExport = api.getConfig('autoExportTxt')
        if (!autoExport) return { files: [], zipPath: null, count: 0 }

        const tabs = getTabs()
        const exportFiles = []
        const timestamp = getTimestamp()

        const exportFolder = path.join(BACKUP_DIR, 'txt_exports', timestamp)
        await fs.mkdir(exportFolder, { recursive: true }).catch(() => {})

        for (const tab of tabs) {
            try {
                const index = await loadTabIndex(tab)
                const timestamps = Object.keys(index.notes).sort()

                if (timestamps.length === 0) continue

                const safeTabName = tab.replace(/[\\/:*?"<>|]/g, '_')
                const tabExportDir = path.join(exportFolder, safeTabName)
                await fs.mkdir(tabExportDir, { recursive: true }).catch(() => {})

                let exportedCount = 0

                for (const ts of timestamps) {
                    try {
                        const meta = index.notes[ts]
                        const content = await loadNoteContent(tab, ts)
                        if (content !== null) {
                            const safeTs = ts.replace(/[\\/:*?"<>|]/g, '_')
                            const txtFileName = `${safeTs}.txt`
                            const txtFilePath = path.join(tabExportDir, txtFileName)

                            const dateStr = new Date(ts).toLocaleString()
                            const txtContent = `[${dateStr}] ${meta.u || 'Unknown'}\n${content}\n`

                            await fs.writeFile(txtFilePath, txtContent, 'utf-8')
                            exportFiles.push(txtFilePath)
                            exportedCount++
                        }
                    } catch (noteErr) {}
                }

                if (exportedCount === 0) {
                    await fs.rmdir(tabExportDir).catch(() => {})
                }

            } catch (e) {}
        }

        try {
            const tabDirs = await fs.readdir(exportFolder).catch(() => [])
            if (tabDirs.length === 0) {
                await fs.rmdir(exportFolder).catch(() => {})
            }
        } catch {}

        // 匯出??txt 也打包成單一 zip
        let zipPath = null
        if (exportFiles.length > 0) {
            const txtZipPath = path.join(BACKUP_DIR, 'txt_exports', `${timestamp}.zip`)
            try {
                await zipDirectory(exportFolder, txtZipPath)
                zipPath = txtZipPath
                await fs.rm(exportFolder, { recursive: true, force: true })
            } catch {
                await fs.unlink(txtZipPath).catch(() => {})
            }
        }

        return { files: exportFiles, zipPath, count: exportFiles.length }
    }

    async function cleanupOldBackups() {
        try {
            const raw = api.getConfig('backupRetentionDays')
            // 未設定時沿用預設 3 天；明確??0 代表永久保留
            const retentionDays = (raw === undefined || raw === null || raw === '') ? 3 : Number(raw)
            if (!isFinite(retentionDays) || retentionDays <= 0) return
            const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)

            const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true }).catch(() => [])

            for (const entry of entries) {
                if (entry.name === 'txt_exports') continue
                if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
                const isZip = !entry.isDirectory() && entry.name.toLowerCase().endsWith('.zip')
                if (!entry.isDirectory() && !isZip) continue
                // 用檔名裡的時間判斷，而不??mtime（搬??重打包後 mtime 會失真）
                const ts = parseBackupNameDate(entry.name)
                if (!ts || ts >= cutoffTime) continue
                await fs.rm(path.join(BACKUP_DIR, entry.name), { recursive: true, force: true }).catch(() => {})
            }

            const txtBaseDir = path.join(BACKUP_DIR, 'txt_exports')
            const txtEntries = await fs.readdir(txtBaseDir, { withFileTypes: true }).catch(() => [])
            for (const entry of txtEntries) {
                const isZip = !entry.isDirectory() && entry.name.toLowerCase().endsWith('.zip')
                if (!entry.isDirectory() && !isZip) continue
                const ts = parseBackupNameDate(entry.name)
                if (!ts || ts >= cutoffTime) continue
                await fs.rm(path.join(txtBaseDir, entry.name), { recursive: true, force: true }).catch(() => {})
            }

        } catch {}
    }

    function getBackupJobState() {
        return backupJob ? { ...backupJob } : null
    }

    // 啟動背景備份：立即回傳，實際工作??server 上繼續，重新整理頁面不會中斷
    function startBackupJob(trigger = 'manual') {
        if (isBackupRunning) return { started: false, job: getBackupJobState() }

        isBackupRunning = true
        const job = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            trigger,
            startedAt: Date.now(),
            running: true,
            ok: null,
            finishedAt: null,
            backupZip: null,
            txtZip: null,
            fileCount: 0,
            error: null
        }
        backupJob = job

        ;(async () => {
            try {
                const result = await createBackup()
                job.fileCount = result.backedUpCount
                job.backupZip = result.zipPath
                if (api.getConfig('autoExportTxt')) {
                    const txtResult = await exportTxtFiles()
                    job.txtZip = txtResult.zipPath
                }
                await cleanupOldBackups()
                job.ok = true
            } catch (e) {
                job.ok = false
                job.error = (e && e.message) ? e.message : String(e)
            } finally {
                job.running = false
                job.finishedAt = Date.now()
                isBackupRunning = false
            }
        })()

        return { started: true, job: getBackupJobState() }
    }

    async function performScheduledBackup(trigger = 'scheduled') {
        return startBackupJob(trigger).started
    }

    function setupBackupTimer() {
        if (backupTimer) {
            clearInterval(backupTimer)
            backupTimer = null
        }
        if (backupStartTimeout) {
            clearTimeout(backupStartTimeout)
            backupStartTimeout = null
        }

        // 每分鐘檢查一次「距離上次成功備份是否已滿設定的間隔」??
        // 以實際經過的時間為準：HFS 重啟、存設定都不會把節奏歸零，
        // 也不會因為改一個設定就立刻多備份一次??
        backupTimer = api.setInterval(() => {
            checkBackupDue().catch(() => {})
        }, BACKUP_CHECK_INTERVAL_MS)

        if (backupTimer && backupTimer.unref) backupTimer.unref()

        backupStartTimeout = api.setTimeout(() => {
            checkBackupDue().catch(() => {})
        }, BACKUP_STARTUP_DELAY_MS)
        if (backupStartTimeout && backupStartTimeout.unref) backupStartTimeout.unref()
    }

    // 定期把任何意外出現的舊式備份資料夾打包（例如舊版計時器仍殘留在記憶體中）
    function setupLegacyBackupSweep() {
        const timer = api.setInterval(() => {
            migrateLegacyBackups().catch(() => {})
        }, 5 * 60 * 1000)
        if (timer && timer.unref) timer.unref()
    }

    function getMillisUntilMidnight() {
        const now = new Date()
        const midnight = new Date(now)
        midnight.setHours(24, 0, 0, 0)
        return midnight.getTime() - now.getTime()
    }

    function setupMidnightCleanup() {
        if (midnightCleanupTimer) {
            clearTimeout(midnightCleanupTimer)
            midnightCleanupTimer = null
        }

        const scheduleNext = () => {
            const delay = getMillisUntilMidnight()
            midnightCleanupTimer = api.setTimeout(() => {
                cleanupTempFiles().catch(() => {})
                migrateLegacyBackups()
                    .then(() => cleanupOldBackups())
                    .catch(() => {})
                scheduleNext()
            }, delay)
            if (midnightCleanupTimer && midnightCleanupTimer.unref) {
                midnightCleanupTimer.unref()
            }
        }
        scheduleNext()
    }

    setupMidnightCleanup()

    initBackupState()
        .catch(() => { backupStateReady = true })
        .then(() => {
            setupBackupTimer()
            setupLegacyBackupSweep()

            // 啟動後檢查一次資料表：補回被覆蓋的索引、註冊多出來??tab 資料??
            api.setTimeout(() => {
                runFullRepair({ force: true }).catch(() => {})
            }, 15000).unref?.()

            // 「伺服器啟動後立刻備份一次」：同一 HFS 程序內只做一次（熱重載不重複??
            const startupMark = '__hfsNotesStartupBackupDone'
            if (api.getConfig('backupOnStartup') && !globalThis[startupMark]) {
                globalThis[startupMark] = true
                api.setTimeout(() => {
                    performScheduledBackup().catch(() => {})
                }, 7000).unref?.()
            }

            // 舊版散落的備份資料夾自動打包??zip（延後執行，不拖慢啟動）
            api.setTimeout(() => {
                migrateLegacyBackups()
                    .then(() => cleanupOldBackups())
                    .catch(() => {})
            }, BACKUP_MIGRATION_DELAY_MS).unref?.()
        })

    lastKnownTabNames = new Set(getTabs())

    api.subscribeConfig(['backupInterval', 'backupRetentionDays', 'tabList', 'autoExportTxt'], () => {
        // 不再「一存設定就立刻備份」：只重新校正節奏，逾期才補一??
        setupBackupTimer()
        checkBackupDue().catch(() => {})
        cleanupOldBackups().catch(() => {})

        // 若從原生設定表刪除了 tab，封存其資料夾，
        // 否則自動掃描會把它當成「多出來的資料夾」又加回來??
        if (!isApplyingTabList) {
            const current = new Set(getTabs())
            if (lastKnownTabNames) {
                for (const name of lastKnownTabNames) {
                    if (!current.has(name)) archiveTabFolder(name).catch(() => {})
                }
            }
            lastKnownTabNames = current
        }

        if (!isApplyingTabList && api.getConfig('tabList')) {
            syncTabsMapWithConfig().then(tabsMap => {
                api.notifyClient('notes', 'tabsReordered', {
                    tabs: tabsMap.order,
                    categories: tabsMap.categories,
                    categoryOrder: tabsMap.categoryOrder,
                    categoryNames: tabsMap.categoryNames,
                    categoryTabOrders: tabsMap.categoryTabOrders
                })
            }).catch(() => {})
        }
    })

    async function getTabInfo(ctx) {
        const username = getCurrentUsername(ctx)

        // 偶爾掃一??storage/tabs，讓被覆蓋後多出來的 tab 資料夾自動出現在前端與資料庫
        if (Date.now() - lastStorageScanAt > STORAGE_SCAN_MIN_MS) {
            lastStorageScanAt = Date.now()
            ensureStorageTabsRegistered().catch(() => {})
        }

        const tabsMap = await syncTabsMapWithConfig()
        let tabs = tabsMap.order.length > 0 ? tabsMap.order : getTabs()

        if (!username) {
            const pubTabs = getPublicTabs()
            tabs = tabs.filter(t => pubTabs.includes(t))
            const result = {}
            for (const tab of tabs) {
                result[tab] = await getTabNoteCount(tab)
            }
            ctx.body = {
                tabs,
                counts: result,
                warning: Object.values(result).reduce((a, b) => a + b, 0) >= MAX_STORAGE_WARNING,
                tabNames: tabsMap.names,
                categories: tabsMap.categories || {},
                categoryOrder: tabsMap.categoryOrder || [],
                categoryNames: tabsMap.categoryNames || {},
                categoryTabOrders: tabsMap.categoryTabOrders || {},
                isGuest: true
            }
            ctx.status = 200
            return
        }

        if (!isAllowed(username)) { ctx.status = 403; return }

        // 依每??tab 的專屬權限過??
        if (!isHfsAdmin(username)) {
            tabs = tabs.filter(t => isAllowed(username, t))
        }

        const result = {}
        for (const tab of tabs) {
            result[tab] = await getTabNoteCount(tab)
        }
        ctx.body = {
            tabs,
            counts: result,
            warning: Object.values(result).reduce((a, b) => a + b, 0) >= MAX_STORAGE_WARNING,
            tabNames: tabsMap.names,
            categories: tabsMap.categories || {},
            categoryOrder: tabsMap.categoryOrder || [],
            categoryNames: tabsMap.categoryNames || {},
            categoryTabOrders: tabsMap.categoryTabOrders || {},
            isGuest: false
        }
        ctx.status = 200
    }

    async function renameTab(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { tab, newName } = body

        if (!tab || newName == null) {
            ctx.status = 400; return
        }

        const tabsMap = await loadTabsMap()
        const trimmed = (typeof newName === 'string') ? newName.trim() : ''

        if (trimmed === '') {
            delete tabsMap.names[tab]
        } else {
            tabsMap.names[tab] = sanitizeForDb(trimmed)
        }

        await saveTabsMap(tabsMap)
        const notifyName = trimmed || tab
        api.notifyClient('notes', 'tabRenamed', { tab, newName: notifyName })
        ctx.body = { ok: true, tab, newName: notifyName }
        ctx.status = 200
    }

    async function updateCategory(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { tab, category } = body

        if (!tab) { ctx.status = 400; return }

        const tabsMap = await loadTabsMap()
        if (!tabsMap.categories) tabsMap.categories = {}

        if (category && category.trim()) {
            tabsMap.categories[tab] = category.trim()
            const catName = category.trim()
            const allCategories = new Set(Object.values(tabsMap.categories).filter(Boolean))
            if (!tabsMap.categoryOrder) tabsMap.categoryOrder = []
            if (!tabsMap.categoryOrder.includes(catName) && allCategories.has(catName)) {
                tabsMap.categoryOrder.push(catName)
            }
        } else {
            delete tabsMap.categories[tab]
        }

        await saveTabsMap(tabsMap)
        api.notifyClient('notes', 'categoryUpdated', { tab, category: category && category.trim() ? category.trim() : '' })
        ctx.body = { ok: true }
        ctx.status = 200
    }

    async function updateCategoryName(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { oldCategory, newCategory } = body

        if (!oldCategory || !newCategory) {
            ctx.status = 400; return
        }

        const tabsMap = await loadTabsMap()
        if (!tabsMap.categoryNames) tabsMap.categoryNames = {}

        const trimmed = newCategory.trim()
        if (trimmed) {
            tabsMap.categoryNames[oldCategory] = trimmed
        } else {
            delete tabsMap.categoryNames[oldCategory]
        }

        if (tabsMap.categoryOrder) {
            const idx = tabsMap.categoryOrder.indexOf(oldCategory)
            if (idx > -1) {
                tabsMap.categoryOrder[idx] = trimmed
            }
        }

        await saveTabsMap(tabsMap)
        api.notifyClient('notes', 'categoryNameUpdated', { oldCategory, newCategory: trimmed || oldCategory })
        ctx.body = { ok: true }
        ctx.status = 200
    }

    async function updateCategoryOrder(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { order } = body

        if (!order || !Array.isArray(order)) {
            ctx.status = 400; return
        }

        const tabsMap = await loadTabsMap()
        tabsMap.categoryOrder = order
        await saveTabsMap(tabsMap)

        api.notifyClient('notes', 'categoryOrderUpdated', { order })
        ctx.body = { ok: true }
        ctx.status = 200
    }

    async function listNotes(ctx) {
        const username = getCurrentUsername(ctx)
        const tab = ctx.query?.tab
        if (!tab) { ctx.status = 400; return }
        if (!isAllowed(username, tab)) { ctx.status = 403; return }

        const offset = parseInt(ctx.query?.offset) || 0
        const limit = Math.min(parseInt(ctx.query?.limit) || PAGE_SIZE, 100)
        const summaryOnly = ctx.query?.summary === '1'

        // 前端每次打開 tab（offset=0）時做一次節流掃描，補回被覆蓋掉的索引條??
        if (offset === 0) {
            try { await reconcileTabIndex(tab, {}) } catch {}
        }

        const index = await loadTabIndex(tab)
        const allTimestamps = Object.keys(index.notes).sort()
        const totalCount = allTimestamps.length

        const endIdx = totalCount - offset
        const startIdx = Math.max(0, endIdx - limit)
        const pageTimestamps = allTimestamps.slice(startIdx, endIdx)

        const pageNotes = {}
        const imageIds = new Set()
        const movIds = new Set()

        for (const ts of pageTimestamps) {
            const meta = index.notes[ts]
            const content = await loadNoteContent(tab, ts)
            if (content !== null) {
                if (summaryOnly) {
                    const summary = content.substring(0, SUMMARY_LENGTH)
                    pageNotes[ts] = {
                        s: summary,
                        hasMore: content.length > SUMMARY_LENGTH,
                        u: meta.u,
                        starred: meta.starred || false,
                        collapsed: meta.collapsed || false
                    }
                    for (const id of extractImageIds(summary)) imageIds.add(id)
                    for (const id of extractMovIds(summary)) movIds.add(id)
                } else {
                    pageNotes[ts] = {
                        m: content,
                        u: meta.u,
                        starred: meta.starred || false,
                        collapsed: meta.collapsed || false
                    }
                    for (const id of extractImageIds(content)) imageIds.add(id)
                    for (const id of extractMovIds(content)) movIds.add(id)
                }
            }
        }

        const hasMoreData = startIdx > 0

        const thumbMap = {}
        for (const id of imageIds) {
            thumbMap[id] = hasThumbnail(tab, id)
        }
        for (const id of movIds) {
            thumbMap[id] = hasThumbnail(tab, id)
        }

        let fileNames = {}
        try {
            fileNames = JSON.parse(await fs.readFile(getNameMapPath(tab, 'mov'), 'utf-8'))
        } catch {}
        try {
            const attNames = JSON.parse(await fs.readFile(getNameMapPath(tab, 'att'), 'utf-8'))
            Object.assign(fileNames, attNames)
        } catch {}

        ctx.body = {
            notes: pageNotes,
            count: totalCount,
            warning: totalCount >= MAX_STORAGE_WARNING,
            thumbMap,
            fileNames,
            hasMore: hasMoreData,
            offset: offset,
            limit: limit,
            thumbFormat: api.getConfig('thumbnail_format') || 'jpg'
        }
        ctx.status = 200
    }

    async function getNoteFull(ctx) {
        const username = getCurrentUsername(ctx)
        const tab = ctx.query?.tab
        const ts = ctx.query?.ts
        if (!tab || !ts) { ctx.status = 400; return }
        if (!isAllowed(username, tab)) { ctx.status = 403; return }

        const note = await getNoteWithContent(tab, ts)
        if (!note) { ctx.status = 404; return }

        ctx.body = { m: note.m }
        ctx.status = 200
    }

    const IMG_EXT_REGEX = /\.(jpe?g|png|gif|webp|bmp|tiff?|svg|avif|heic|heif|ico|jfif)(?:\?[^\s\)\]\>"']*)?$/i
    const VIDEO_EXT_REGEX = /\.(mp4|webm|ogg|ogv|mov|avi|mkv|wmv|flv|m4v|3gp|ts|mts|m2ts)(?:\?[^\s\)\]\>"']*)?$/i
    const AUDIO_EXT_REGEX = /\.(mp3|wav|flac|aac|m4a|opus|oga|wma|ape|aiff|alac|dsf|dff)(?:\?[^\s\)\]\>"']*)?$/i

    function isLikelyMediaUrl(url) {
        if (!/^https?:\/\//i.test(url)) return false
        if (url.includes('/~/notes/')) return false
        return true
    }

    function downloadBuffer(url, maxSize) {
        return new Promise((resolve) => {
            let mod
            try {
                mod = url.startsWith('https') ? https : http
            } catch {
                resolve(null); return
            }
            let req
            try {
                req = mod.get(url, {
                    timeout: DOWNLOAD_TIMEOUT,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; HFS-Notes/1.0)',
                        'Accept': '*/*'
                    }
                }, (res) => {
                    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                        res.resume()
                        let nextUrl
                        try {
                            nextUrl = new URL(res.headers.location, url).href
                        } catch {
                            resolve(null); return
                        }
                        resolve(downloadBuffer(nextUrl, maxSize))
                        return
                    }
                    if (res.statusCode !== 200) { res.resume(); resolve(null); return }
                    const chunks = []
                    let size = 0
                    let aborted = false
                    res.on('data', (chunk) => {
                        if (aborted) return
                        size += chunk.length
                        if (size > maxSize) { aborted = true; req.destroy(); resolve(null); return }
                        chunks.push(chunk)
                    })
                    res.on('end', () => {
                        if (aborted) return
                        const buf = Buffer.concat(chunks)
                        resolve({
                            buffer: buf,
                            contentType: (res.headers['content-type'] || '').split(';')[0].trim().toLowerCase()
                        })
                    })
                    res.on('error', () => { if (!aborted) resolve(null) })
                })
            } catch {
                resolve(null); return
            }
            req.on('error', () => resolve(null))
            req.on('timeout', () => { try { req.destroy() } catch {} resolve(null) })
        })
    }

    function extFromContentType(ct) {
        if (!ct) return ''
        const map = {
            'image/jpeg': '.jpg', 'image/jpg': '.jpg',
            'image/png': '.png', 'image/gif': '.gif',
            'image/webp': '.webp', 'image/bmp': '.bmp',
            'image/tiff': '.tiff', 'image/svg+xml': '.svg',
            'image/avif': '.avif', 'image/heic': '.heic',
            'image/heif': '.heif', 'image/x-icon': '.ico',
            'image/vnd.microsoft.icon': '.ico',
            'video/mp4': '.mp4', 'video/webm': '.webm',
            'video/ogg': '.ogv', 'video/quicktime': '.mov',
            'video/x-msvideo': '.avi', 'video/x-matroska': '.mkv',
            'video/x-ms-wmv': '.wmv', 'video/x-flv': '.flv',
            'audio/mpeg': '.mp3', 'audio/mp3': '.mp3',
            'audio/wav': '.wav', 'audio/x-wav': '.wav',
            'audio/flac': '.flac', 'audio/x-flac': '.flac',
            'audio/aac': '.aac', 'audio/mp4': '.m4a',
            'audio/opus': '.opus', 'audio/ogg': '.ogg'
        }
        return map[ct] || ''
    }

    function buildOriginalNameFromUrl(url, contentType) {
        try {
            const u = new URL(url)
            let base = path.basename(u.pathname) || 'media'
            base = base.split('?')[0]
            let ext = path.extname(base)
            if (!ext) {
                ext = extFromContentType(contentType) || ''
                if (ext) base = base + ext
            }
            base = base.replace(/[\\/:*?"<>|]/g, '_')
            if (!base) base = 'media_' + Date.now() + (ext || '')
            return base
        } catch {
            const ext = extFromContentType(contentType) || ''
            return 'media_' + Date.now() + ext
        }
    }

    async function saveExternalImage(buffer, originalName, tab) {
        const fileId = generateFileId(originalName)
        const imgDir = getTabImgDir(tab)
        const thumbDir = getTabThumbDir(tab)
        await ensureDir(imgDir)
        await ensureDir(thumbDir)
        try {
            await generateThumbnail(buffer, path.join(thumbDir, fileId))
        } catch {}
        await fs.writeFile(path.join(imgDir, fileId), buffer)
        return fileId
    }

    async function saveExternalMedia(buffer, originalName, tab) {
        const fileId = generateFileId(originalName)
        const movDir = getTabMovDir(tab)
        await ensureDir(movDir)
        await fs.writeFile(path.join(movDir, fileId), buffer)
        try {
            const mapPath = getNameMapPath(tab, 'mov')
            let nameMap = {}
            try {
                nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
            } catch {}
            nameMap[fileId] = originalName
            await fs.writeFile(mapPath, JSON.stringify(nameMap))
        } catch {}
        try {
            const videoPath = path.join(movDir, fileId)
            extractVideoThumbnail(videoPath, tab, fileId).catch(() => {})
        } catch {}
        return fileId
    }

    async function localizeExternalMedia(content, tab) {
        if (!content) return content

        let work = content.replace(/\[img\](https?:\/\/[^\[]+?)\[\/img\]/gi, (m, url) => url)

        const localMarks = []
        work = work.replace(/\[(img|mov|att):[^\]]+\]/g, (m) => {
            localMarks.push(m)
            return `\u0000LOCAL${localMarks.length - 1}\u0000`
        })

        const urlRegex = /https?:\/\/[^\s<>"'\)\]]+/gi
        const rawUrls = work.match(urlRegex) || []
        const candidates = [...new Set(rawUrls)].filter(u => isLikelyMediaUrl(u))

        if (candidates.length === 0) {
            work = work.replace(/\u0000LOCAL(\d+)\u0000/g, (m, i) => localMarks[parseInt(i)])
            return work
        }

        const results = new Map()
        let idx = 0
        const workers = Array.from(
            { length: Math.min(MAX_CONCURRENT_DOWNLOADS, candidates.length) },
            async () => {
                while (idx < candidates.length && idx < MAX_LOCALIZE_TOTAL) {
                    const myIdx = idx++
                    const url = candidates[myIdx]
                    try {
                        const dl = await downloadBuffer(url, MAX_IMG_SIZE)
                        if (!dl || !dl.buffer || dl.buffer.length === 0) {
                            results.set(url, null); continue
                        }
                        const ct = dl.contentType
                        const looksImage = ct.startsWith('image/') || IMG_EXT_REGEX.test(url.split('?')[0])
                        const looksVideo = ct.startsWith('video/') || VIDEO_EXT_REGEX.test(url.split('?')[0])
                        const looksAudio = ct.startsWith('audio/') || AUDIO_EXT_REGEX.test(url.split('?')[0])

                        if (looksImage) {
                            const originalName = buildOriginalNameFromUrl(url, ct)
                            const fileId = await saveExternalImage(dl.buffer, originalName, tab)
                            results.set(url, { type: 'img', fileId })
                        } else if (looksVideo || looksAudio) {
                            const originalName = buildOriginalNameFromUrl(url, ct)
                            const fileId = await saveExternalMedia(dl.buffer, originalName, tab)
                            results.set(url, { type: 'mov', fileId, name: originalName })
                        } else {
                            results.set(url, null)
                        }
                    } catch {
                        results.set(url, null)
                    }
                }
            }
        )
        await Promise.all(workers)

        for (const [url, info] of results) {
            if (!info) continue
            const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            let replacement
            if (info.type === 'img') {
                replacement = `[img:${info.fileId}]`
            } else {
                replacement = `[mov:${info.fileId}:${info.name}]`
            }
            work = work.replace(new RegExp(escaped, 'g'), replacement)
        }

        work = work.replace(/\u0000LOCAL(\d+)\u0000/g, (m, i) => localMarks[parseInt(i)])

        return work
    }

    async function addNote(ctx) {
        const username = getCurrentUsername(ctx) || 'Guest'

        let body = ctx.state.params || ctx.request?.body || {}

        const m = body.m
        const tab = body.tab
        const forceCollapsed = body.collapsed === true

        if (!m || typeof m !== 'string') {
            ctx.status = 400; return
        }
        if (!tab) { ctx.status = 400; return }
        if (!isAllowed(username, tab)) { ctx.status = 403; return }

        const tdb = await throttleDb
        const last = await tdb.get(username)
        if (last && last + SPAM_DELAY > Date.now()) {
            ctx.status = 429; return
        }
        tdb.put(username, Date.now())

        const count = await getTabNoteCount(tab)

        const ts = new Date().toISOString()

        const sanitizedM = sanitizeForDb(m)
        if (!sanitizedM) {
            ctx.status = 400; return
        }

        let localizedM = sanitizedM
        try {
            localizedM = await localizeExternalMedia(sanitizedM, tab)
        } catch (e) {}

        const lineCount = localizedM.split('\n').length
        const autoCollapsed = forceCollapsed || lineCount > 100

        if (username && username !== 'Guest') {
            await promoteAllAttachments(localizedM, tab)
        }

        await addNoteToTab(tab, ts, {
            m: localizedM,
            u: username,
            starred: false,
            collapsed: autoCollapsed
        })

        const newCount = count + 1

        api.notifyClient('notes', 'newNote', { ts, u: username, m: localizedM, tab, starred: false, collapsed: autoCollapsed })

        ctx.status = 201
        ctx.body = { count: newCount, warning: newCount >= MAX_STORAGE_WARNING }
    }

    async function updateNote(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}

        const { ts, tab, m } = body

        if (!ts || !tab || !m || typeof m !== 'string') {
            ctx.status = 400; return
        }

        const note = await getNoteWithContent(tab, ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }

        const sanitizedM = sanitizeForDb(m)
        if (!sanitizedM) {
            ctx.status = 400; return
        }

        let localizedM = sanitizedM
        try {
            localizedM = await localizeExternalMedia(sanitizedM, tab)
        } catch (e) {}

        const oldImgIds = extractImageIds(note.m)
        const newImgIds = extractImageIds(localizedM)
        const removedImgIds = oldImgIds.filter(id => !newImgIds.includes(id))
        for (const id of removedImgIds) {
            await deleteAttachmentAcrossAllTabs(id, 'img')
            await deleteAttachmentAcrossAllTabs(id, 'thumb')
        }

        const oldMovIds = extractMovIds(note.m)
        const newMovIds = extractMovIds(localizedM)
        const removedMovIds = oldMovIds.filter(id => !newMovIds.includes(id))
        for (const id of removedMovIds) {
            await deleteAttachmentAcrossAllTabs(id, 'mov')
        }

        const oldAttIds = extractAttIds(note.m)
        const newAttIds = extractAttIds(localizedM)
        const removedAttIds = oldAttIds.filter(id => !newAttIds.includes(id))
        for (const id of removedAttIds) {
            await deleteAttachmentAcrossAllTabs(id, 'att')
        }

        await promoteAllAttachments(localizedM, tab)

        await updateNoteInTab(tab, ts, {
            m: localizedM,
            u: note.u,
            starred: note.starred || false,
            collapsed: note.collapsed || false
        })

        api.notifyClient('notes', 'updateNote', { ts, tab, m: localizedM, starred: note.starred || false, collapsed: note.collapsed || false })
        ctx.status = 200
    }

    async function renameNoteTs(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { tab, oldTs, newTs } = body
        if (!tab || !oldTs || !newTs) { ctx.status = 400; return }
        if (oldTs === newTs) { ctx.body = { ok: true, oldTs, newTs }; ctx.status = 200; return }

        const index = await loadTabIndex(tab)
        if (!index.notes[oldTs]) { ctx.status = 404; return }

        const meta = index.notes[oldTs]
        const content = await loadNoteContent(tab, oldTs)
        if (content === null) { ctx.status = 404; return }

        let finalTs = newTs
        let d = new Date(finalTs)
        if (isNaN(d.getTime())) { ctx.status = 400; ctx.body = { error: 'Invalid timestamp' }; return }

        let guard = 0
        while (index.notes[finalTs] && finalTs !== oldTs && guard < 86400) {
            d = new Date(d.getTime() + 1000)
            finalTs = d.toISOString()
            guard++
        }
        if (index.notes[finalTs] && finalTs !== oldTs) {
            ctx.status = 409
            ctx.body = { error: 'No available timestamp slot' }
            return
        }

        const oldPath = getNoteFilePath(tab, oldTs)
        const newPath = getNoteFilePath(tab, finalTs)

        try {
            await fs.copyFile(oldPath, newPath)
        } catch (e) {
            ctx.status = 500
            ctx.body = { error: 'Failed to copy note file' }
            return
        }

        delete index.notes[oldTs]
        index.notes[finalTs] = meta
        await saveTabIndex(tab, index)

        await deleteNoteFile(tab, oldTs)

        api.notifyClient('notes', 'renameNoteTs', { tab, oldTs, newTs: finalTs })
        ctx.body = { ok: true, oldTs, newTs: finalTs }
        ctx.status = 200
    }

    async function toggleStar(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}

        const { ts, tab } = body

        if (!ts || !tab) { ctx.status = 400; return }

        const note = await getNoteWithContent(tab, ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }

        const newStarred = !(note.starred || false)
        await updateNoteInTab(tab, ts, {
            u: note.u,
            starred: newStarred,
            collapsed: note.collapsed || false
        })

        api.notifyClient('notes', 'toggleStar', { ts, tab, starred: newStarred })
        ctx.body = { starred: newStarred }
        ctx.status = 200
    }

    async function toggleCollapse(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username) { ctx.status = 403; return }
        if (!isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}

        const { ts, tab } = body

        if (!ts || !tab) { ctx.status = 400; return }

        const note = await getNoteWithContent(tab, ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }

        const newCollapsed = !(note.collapsed || false)
        await updateNoteInTab(tab, ts, {
            u: note.u,
            starred: note.starred || false,
            collapsed: newCollapsed
        })

        api.notifyClient('notes', 'toggleCollapse', { ts, tab, collapsed: newCollapsed })
        ctx.body = { collapsed: newCollapsed }
        ctx.status = 200
    }

    async function deleteNote(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}

        const { ts, tab } = body

        if (!ts || !tab) { ctx.status = 400; return }

        const note = await getNoteWithContent(tab, ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }

        if (note.m) {
            const imgIds = extractImageIds(note.m)
            for (const id of imgIds) {
                await deleteAttachmentAcrossAllTabs(id, 'img')
                await deleteAttachmentAcrossAllTabs(id, 'thumb')
            }

            const movIds = extractMovIds(note.m)
            for (const id of movIds) {
                await deleteAttachmentAcrossAllTabs(id, 'mov')
            }

            const attIds = extractAttIds(note.m)
            for (const id of attIds) {
                await deleteAttachmentAcrossAllTabs(id, 'att')
            }
        }

        await deleteNoteFromTab(tab, ts)
        api.notifyClient('notes', 'deleteNote', { ts, tab })
        ctx.status = 200
    }

    async function reorderTabs(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { tabs: newOrder } = body
        if (!newOrder || !Array.isArray(newOrder)) {
            ctx.status = 400; return
        }

        const tabsMap = await loadTabsMap()
        tabsMap.order = newOrder
        await saveTabsMap(tabsMap)
        api.notifyClient('notes', 'tabsReordered', {
            tabs: newOrder,
            categories: tabsMap.categories,
            categoryOrder: tabsMap.categoryOrder,
            categoryNames: tabsMap.categoryNames,
            categoryTabOrders: tabsMap.categoryTabOrders
        })
        ctx.body = { ok: true }
        ctx.status = 200
    }

    async function reorderCategoryTabs(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        if (typeof body === 'string') {
            try { body = JSON.parse(body) } catch { body = {} }
        }
        const category = String(body.category == null ? '' : body.category)
        const requested = Array.isArray(body.order) ? body.order.map(String) : null
        if (!requested) { ctx.status = 400; return }

        const tabsMap = await loadTabsMap()
        const tabsInCategory = (tabsMap.order || []).filter(name => (tabsMap.categories?.[name] || '') === category)
        const order = []
        for (const name of requested) {
            if (tabsInCategory.includes(name) && !order.includes(name)) order.push(name)
        }
        for (const name of tabsInCategory) {
            if (!order.includes(name)) order.push(name)
        }

        if (!tabsMap.categoryTabOrders || typeof tabsMap.categoryTabOrders !== 'object') tabsMap.categoryTabOrders = {}
        tabsMap.categoryTabOrders[category] = order
        await saveTabsMap(tabsMap)

        api.notifyClient('notes', 'tabsReordered', {
            tabs: tabsMap.order,
            categories: tabsMap.categories,
            categoryOrder: tabsMap.categoryOrder,
            categoryNames: tabsMap.categoryNames,
            categoryTabOrders: tabsMap.categoryTabOrders
        })
        ctx.body = { ok: true, category, order }
        ctx.status = 200
    }

    async function checkAccess(ctx) {
        const username = getCurrentUsername(ctx)
        const publicTabs = getPublicTabs()
        ctx.body = {
            allowed: !!username || publicTabs.length > 0,
            isGuest: !username,
            publicTabs: publicTabs
        }
        ctx.status = 200
    }

    async function adminOverview(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        const tabs = getTabs()
        const dbInfo = {}
        let totalNotes = 0

        for (const tab of tabs) {
            const index = await loadTabIndex(tab)
            const timestamps = Object.keys(index.notes).sort()
            const count = timestamps.length
            dbInfo[tab] = {
                count,
                firstNote: count > 0 ? timestamps[0] : null,
                lastNote: count > 0 ? timestamps[count - 1] : null
            }
            totalNotes += count
        }

        let backups = []
        try {
            const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true }).catch(() => [])

            for (const entry of entries) {
                if (entry.name === 'txt_exports') continue
                if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
                const isZip = !entry.isDirectory() && entry.name.toLowerCase().endsWith('.zip')
                if (!entry.isDirectory() && !isZip) continue
                const ts = parseBackupNameDate(entry.name)
                if (!ts) continue

                const fullPath = path.join(BACKUP_DIR, entry.name)
                try {
                    const stat = await fs.stat(fullPath)
                    let totalSize = 0
                    let fileCount = 0

                    if (isZip) {
                        totalSize = stat.size
                        fileCount = null
                    } else {
                        const tabsDirs = await fs.readdir(path.join(fullPath, 'tabs')).catch(() => [])
                        for (const tabDir of tabsDirs) {
                            const tabPath = path.join(fullPath, 'tabs', tabDir)
                            try {
                                const files = await fs.readdir(tabPath)
                                fileCount += files.length
                                for (const f of files) {
                                    try {
                                        const fstat = await fs.stat(path.join(tabPath, f))
                                        totalSize += fstat.size
                                    } catch {}
                                }
                            } catch {}
                        }
                    }

                    backups.push({
                        name: entry.name,
                        timestamp: entry.name.replace(/\.zip$/i, ''),
                        packaged: isZip,
                        size: totalSize,
                        sizeReadable: formatBytes(totalSize),
                        fileCount: fileCount,
                        created: new Date(ts).toISOString()
                    })
                } catch {}
            }
            backups.sort((a, b) => b.created.localeCompare(a.created))
        } catch {}

        let txtExports = []
        try {
            const txtBaseDir = path.join(BACKUP_DIR, 'txt_exports')
            const txtEntries = await fs.readdir(txtBaseDir, { withFileTypes: true }).catch(() => [])

            for (const entry of txtEntries) {
                const isZip = !entry.isDirectory() && entry.name.toLowerCase().endsWith('.zip')
                if (!entry.isDirectory() && !isZip) continue
                const ts = parseBackupNameDate(entry.name)
                if (!ts) continue

                const fullPath = path.join(txtBaseDir, entry.name)
                try {
                    const stat = await fs.stat(fullPath)
                    let totalSize = 0
                    let fileCount = 0
                    let tabCount = null

                    if (isZip) {
                        totalSize = stat.size
                        fileCount = null
                    } else {
                        const tabDirs = await fs.readdir(fullPath).catch(() => [])
                        tabCount = tabDirs.length
                        for (const tabDir of tabDirs) {
                            const tabPath = path.join(fullPath, tabDir)
                            try {
                                const tabStat = await fs.stat(tabPath)
                                if (!tabStat.isDirectory()) continue
                                const files = await fs.readdir(tabPath)
                                fileCount += files.length
                                for (const f of files) {
                                    try {
                                        const fstat = await fs.stat(path.join(tabPath, f))
                                        totalSize += fstat.size
                                    } catch {}
                                }
                            } catch {}
                        }
                    }

                    txtExports.push({
                        name: entry.name,
                        timestamp: entry.name.replace(/\.zip$/i, ''),
                        packaged: isZip,
                        size: totalSize,
                        sizeReadable: formatBytes(totalSize),
                        fileCount: fileCount,
                        tabCount: tabCount,
                        created: new Date(ts).toISOString()
                    })
                } catch {}
            }
            txtExports.sort((a, b) => b.created.localeCompare(a.created))
        } catch {}

        let imgStats = { count: 0, totalSize: 0, tabs: {}, tempCount: 0 }
        try {
            const tabDirs = await fs.readdir(IMG_BASE_DIR).catch(() => [])
            for (const dirName of tabDirs) {
                const dirPath = path.join(IMG_BASE_DIR, dirName)
                const stat = await fs.stat(dirPath).catch(() => null)
                if (!stat || !stat.isDirectory()) continue
                const files = await fs.readdir(dirPath).catch(() => [])
                imgStats.tabs[dirName] = files.length
                imgStats.count += files.length
                for (const f of files) {
                    try {
                        const fstat = await fs.stat(path.join(dirPath, f))
                        imgStats.totalSize += fstat.size
                    } catch {}
                }
            }
        } catch {}

        let tempStats = { count: 0, totalSize: 0 }
        try {
            const tempFiles = await fs.readdir(TEMP_DIR).catch(() => [])
            const realTempFiles = []
            for (const f of tempFiles) {
                try {
                    const s = await fs.stat(path.join(TEMP_DIR, f))
                    if (!s.isDirectory()) realTempFiles.push(f)
                } catch {}
            }
            tempStats.count = realTempFiles.length
            for (const f of realTempFiles) {
                try {
                    const fstat = await fs.stat(path.join(TEMP_DIR, f))
                    tempStats.totalSize += fstat.size
                } catch {}
            }
        } catch {}
        imgStats.tempCount = tempStats.count

        let thumbStats = { count: 0, totalSize: 0, tabs: {} }
        try {
            const tabDirs = await fs.readdir(THUMB_BASE_DIR).catch(() => [])
            for (const dirName of tabDirs) {
                const dirPath = path.join(THUMB_BASE_DIR, dirName)
                const stat = await fs.stat(dirPath).catch(() => null)
                if (!stat || !stat.isDirectory()) continue
                const files = await fs.readdir(dirPath).catch(() => [])
                thumbStats.tabs[dirName] = files.length
                thumbStats.count += files.length
                for (const f of files) {
                    try {
                        const fstat = await fs.stat(path.join(dirPath, f))
                        thumbStats.totalSize += fstat.size
                    } catch {}
                }
            }
        } catch {}

        let movStats = { count: 0, totalSize: 0, tabs: {} }
        try {
            const tabDirs = await fs.readdir(MOV_BASE_DIR).catch(() => [])
            for (const dirName of tabDirs) {
                const dirPath = path.join(MOV_BASE_DIR, dirName)
                const stat = await fs.stat(dirPath).catch(() => null)
                if (!stat || !stat.isDirectory()) continue
                const files = await fs.readdir(dirPath).catch(() => [])
                const realFiles = files.filter(f => f !== '.filenames')
                movStats.tabs[dirName] = realFiles.length
                movStats.count += realFiles.length
                for (const f of realFiles) {
                    try {
                        const fstat = await fs.stat(path.join(dirPath, f))
                        movStats.totalSize += fstat.size
                    } catch {}
                }
            }
        } catch {}

        let attStats = { count: 0, totalSize: 0, tabs: {} }
        try {
            const tabDirs = await fs.readdir(ATT_BASE_DIR).catch(() => [])
            for (const dirName of tabDirs) {
                const dirPath = path.join(ATT_BASE_DIR, dirName)
                const stat = await fs.stat(dirPath).catch(() => null)
                if (!stat || !stat.isDirectory()) continue
                const files = await fs.readdir(dirPath).catch(() => [])
                const realFiles = files.filter(f => f !== '.filenames')
                attStats.tabs[dirName] = realFiles.length
                attStats.count += realFiles.length
                for (const f of realFiles) {
                    try {
                        const fstat = await fs.stat(path.join(dirPath, f))
                        attStats.totalSize += fstat.size
                    } catch {}
                }
            }
        } catch {}

        ctx.body = {
            config: {
                tabList: api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }],
                spamDelay: SPAM_DELAY, storageWarning: MAX_STORAGE_WARNING,
                backupInterval: api.getConfig('backupInterval'),
                backupRetentionDays: api.getConfig('backupRetentionDays'),
                autoExportTxt: api.getConfig('autoExportTxt'),
                maxImgSize: formatBytes(getUploadLimitBytes('image/')),
                maxFileSize: formatBytes(getUploadLimitBytes('application/octet-stream')),
                ffmpegPath: api.getConfig('ffmpeg_path') || 'ffmpeg',
                thumbnailTime: api.getConfig('thumbnail_time') || '00:00:05',
                thumbnailFormat: api.getConfig('thumbnail_format') || 'jpg',
                thumbQuality: api.getConfig('thumbQuality') || THUMB_QUALITY,
                thumbPixels: api.getConfig('thumbPixels') || 400,
                useSharpPlugin: api.getConfig('useSharpPlugin') !== false,
                pageSize: PAGE_SIZE,
                storageType: 'file-based'
            },
            databases: dbInfo, totalNotes,
            storageWarning: totalNotes >= MAX_STORAGE_WARNING, backups,
            txtExports,
            imgStats: { ...imgStats, sizeReadable: formatBytes(imgStats.totalSize) },
            thumbStats: { ...thumbStats, sizeReadable: formatBytes(thumbStats.totalSize) },
            movStats: { ...movStats, sizeReadable: formatBytes(movStats.totalSize) },
            attStats: { ...attStats, sizeReadable: formatBytes(attStats.totalSize) },
            tempStats: { ...tempStats, sizeReadable: formatBytes(tempStats.totalSize) }
        }
        ctx.status = 200
    }

    async function adminExport(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        const tab = ctx.query?.tab
        const tabs = getTabs()
        const exportData = {
            exportTime: new Date().toISOString(), exportedBy: username,
            config: { tabList: api.getConfig('tabList') || [{ name: 'General', category: '', publicNote: false }] },
            storageType: 'file-based',
            data: {}
        }

        const tabsToExport = tab ? [tab] : tabs
        for (const t of tabsToExport) {
            if (!tabs.includes(t)) continue
            const index = await loadTabIndex(t)
            exportData.data[t] = {}
            for (const ts of Object.keys(index.notes)) {
                const content = await loadNoteContent(t, ts)
                if (content !== null) {
                    exportData.data[t][ts] = {
                        m: content,
                        u: index.notes[ts].u,
                        starred: index.notes[ts].starred || false,
                        collapsed: index.notes[ts].collapsed || false
                    }
                }
            }
        }

        ctx.type = 'application/json'
        ctx.set('Content-Disposition', `attachment; filename="notes_export_${getTimestamp()}.json"`)
        ctx.body = JSON.stringify(exportData, null, 2)
        ctx.status = 200
    }

    async function adminImport(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body
        try {
            body = await ctx.getBody()
            if (typeof body === 'string') body = JSON.parse(body)
        } catch {
            ctx.status = 400; ctx.body = { error: 'Invalid JSON' }; return
        }

        if (!body.data || typeof body.data !== 'object') {
            ctx.status = 400; ctx.body = { error: 'Invalid import format' }; return
        }

        await createBackup()

        let imported = 0
        const tabs = getTabs()
        for (const [tab, notes] of Object.entries(body.data)) {
            if (!tabs.includes(tab) || typeof notes !== 'object') continue
            for (const [ts, note] of Object.entries(notes)) {
                if (note.m && note.u) {
                    const sanitizedM = sanitizeForDb(note.m)
                    if (!sanitizedM) continue
                    await addNoteToTab(tab, ts, {
                        m: sanitizedM,
                        u: note.u,
                        starred: note.starred || false,
                        collapsed: note.collapsed || false
                    })
                    imported++
                }
            }
        }

        ctx.body = { ok: true, imported, tabs: Object.keys(body.data) }
        ctx.status = 200
    }

    async function adminBackup(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        if (isRestoring) { ctx.status = 409; ctx.body = { error: 'A restore is running' }; return }

        // 只負責啟動背景工作，立即回應；備份在 server 上繼續，前端可刷新或離開頁面
        const result = startBackupJob('manual')
        ctx.status = 202
        ctx.body = {
            ok: true,
            accepted: true,
            started: result.started,
            running: true,
            job: getBackupJobState()
        }
    }

    async function adminBackupStatus(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        ctx.body = {
            ok: true,
            running: isBackupRunning,
            job: getBackupJobState()
        }
        ctx.status = 200
    }

    async function adminRollback(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }
        if (isRestoring || isBackupRunning) {
            ctx.status = 409
            ctx.body = { error: 'A backup or restore is already running' }
            return
        }

        const body = await readJsonBody(ctx)
        const rawName = String(body.name || '')
        const name = path.basename(rawName)
        if (!name || name !== rawName || !/\.zip$/i.test(name) || !parseBackupNameDate(name)) {
            ctx.status = 400
            ctx.body = { error: 'Invalid backup name' }
            return
        }
        const zipPath = path.join(BACKUP_DIR, name)
        const st = await fs.stat(zipPath).catch(() => null)
        if (!st || !st.isFile()) {
            ctx.status = 404
            ctx.body = { error: 'Backup not found' }
            return
        }

        isRestoring = true
        isBackupRunning = true
        const extractDir = path.join(TEMP_DIR, `rollback_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`)
        const oldTabsDir = path.join(TRASH_DIR, `rollback_before_${getTimestamp()}_${crypto.randomBytes(2).toString('hex')}`)
        let safetyBackup = null
        let swapped = false

        try {
            // 先為目前資料庫建立安全備份，回滾失敗或後悔時可再??
            const safety = await createBackup()
            safetyBackup = safety.zipPath || safety.backupFolder

            await unzipToDirectory(zipPath, extractDir)
            const extractedTabs = path.join(extractDir, 'tabs')
            const extractedStat = await fs.stat(extractedTabs).catch(() => null)
            if (!extractedStat || !extractedStat.isDirectory()) {
                throw new Error('Backup does not contain a tabs database')
            }

            await fs.mkdir(TRASH_DIR, { recursive: true })
            await fs.rename(TABS_DIR, oldTabsDir)
            try {
                await fs.rename(extractedTabs, TABS_DIR)
                swapped = true
            } catch (e) {
                await fs.rename(oldTabsDir, TABS_DIR).catch(() => {})
                throw e
            }

            // 回滾後的收尾：清快取、把備份內多出來??tab 補進設??
            lastIndexStats.clear()
            lastIndexScanAt.clear()
            tabUsageCache.clear()
            indexReconcileLocks.clear()
            await ensureStorageTabsRegistered().catch(() => {})
            const tabsMap = await syncTabsMapWithConfig().catch(() => null)
            lastKnownTabNames = new Set(getTabs())

            const tabs = getTabs()
            let noteCount = 0
            for (const tab of tabs) {
                try { noteCount += await getTabNoteCount(tab) } catch {}
            }

            api.notifyClient('notes', 'tabsReordered', {
                tabs: (tabsMap && tabsMap.order) || tabs,
                categories: (tabsMap && tabsMap.categories) || {},
                categoryOrder: (tabsMap && tabsMap.categoryOrder) || [],
                categoryNames: (tabsMap && tabsMap.categoryNames) || {},
                categoryTabOrders: (tabsMap && tabsMap.categoryTabOrders) || {}
            })

            ctx.body = {
                ok: true,
                restored: name,
                safetyBackup,
                tabs,
                noteCount
            }
            ctx.status = 200
        } catch (e) {
            // 尚未成功換上備份時，把原本的 tabs 放回??
            if (!swapped) {
                const current = await fs.stat(TABS_DIR).catch(() => null)
                const old = await fs.stat(oldTabsDir).catch(() => null)
                if (!current && old) await fs.rename(oldTabsDir, TABS_DIR).catch(() => {})
            }
            ctx.status = 500
            ctx.body = { error: 'Rollback failed: ' + ((e && e.message) ? e.message : String(e)) }
        } finally {
            isRestoring = false
            isBackupRunning = false
            await fs.rm(extractDir, { recursive: true, force: true }).catch(() => {})
        }
    }

    async function adminClearTab(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        const { tab } = body
        if (!tab) { ctx.status = 400; return }

        const tabs = getTabs()
        if (!tabs.includes(tab)) { ctx.status = 400; ctx.body = { error: 'Invalid tab' }; return }

        await createBackup()

        const index = await loadTabIndex(tab)

        for (const ts of Object.keys(index.notes)) {
            const content = await loadNoteContent(tab, ts)
            if (content) {
                const imgIds = extractImageIds(content)
                for (const id of imgIds) {
                    await deleteAttachmentAcrossAllTabs(id, 'img')
                    await deleteAttachmentAcrossAllTabs(id, 'thumb')
                }

                const movIds = extractMovIds(content)
                for (const id of movIds) {
                    await deleteAttachmentAcrossAllTabs(id, 'mov')
                }

                const attIds = extractAttIds(content)
                for (const id of attIds) {
                    await deleteAttachmentAcrossAllTabs(id, 'att')
                }
            }
        }

        const imgDir = getTabImgDir(tab)
        try {
            const imgFiles = await fs.readdir(imgDir).catch(() => [])
            for (const f of imgFiles) await fs.unlink(path.join(imgDir, f)).catch(() => {})
        } catch {}

        const thumbDir = getTabThumbDir(tab)
        try {
            const thumbFiles = await fs.readdir(thumbDir).catch(() => [])
            for (const f of thumbFiles) await fs.unlink(path.join(thumbDir, f)).catch(() => {})
        } catch {}

        const movDir = getTabMovDir(tab)
        try {
            const movFiles = await fs.readdir(movDir).catch(() => [])
            for (const f of movFiles) await fs.unlink(path.join(movDir, f)).catch(() => {})
            await fs.unlink(path.join(movDir, '.filenames')).catch(() => {})
        } catch {}

        const attDir = getTabAttDir(tab)
        try {
            const attFiles = await fs.readdir(attDir).catch(() => [])
            for (const f of attFiles) await fs.unlink(path.join(attDir, f)).catch(() => {})
            await fs.unlink(path.join(attDir, '.filenames')).catch(() => {})
        } catch {}

        const count = Object.keys(index.notes).length
        await clearTabData(tab)

        api.notifyClient('notes', 'tabCleared', { tab })

        ctx.body = { ok: true, cleared: count, tab }
        ctx.status = 200
    }

    async function adminExportTxt(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        try {
            const txtResult = await exportTxtFiles()
            ctx.body = {
                ok: true,
                count: txtResult.count,
                zip: txtResult.zipPath,
                files: txtResult.zipPath ? [] : txtResult.files.map(f => ({
                    name: path.basename(f),
                    path: f,
                    tab: path.basename(path.dirname(f))
                }))
            }
        } catch {
            ctx.status = 500; ctx.body = { error: 'TXT export failed' }
        }
    }

    // ============================================
    // 管理面板：資料庫 / 權限 / 附件統計 / 備份管理
    // ============================================
    async function readJsonBody(ctx) {
        let body = ctx.state?.params || ctx.request?.body || {}
        if ((!body || typeof body !== 'object' || Object.keys(body).length === 0) && typeof ctx.getBody === 'function') {
            try { body = await ctx.getBody() } catch {}
        }
        if (typeof body === 'string') {
            try { body = JSON.parse(body) } catch { body = {} }
        }
        return (body && typeof body === 'object') ? body : {}
    }

    function getManageSettingsSchema() {
        return [
            { key: 'backupInterval', label: 'Auto backup interval (hours)', type: 'number', min: 0, step: 0.5, group: 'Backup', hint: '0 disables scheduled backups' },
            { key: 'backupRetentionDays', label: 'Backup retention (days)', type: 'number', min: 0, step: 1, group: 'Backup', hint: '0 keeps backups forever' },
            { key: 'autoExportTxt', label: 'Auto export TXT with each backup', type: 'boolean', group: 'Backup' },
            { key: 'backupOnStartup', label: 'Backup once after server startup', type: 'boolean', group: 'Backup' },
            { key: 'restrictUsers', label: 'Restrict access to selected users', type: 'boolean', group: 'Access' },
            { key: 'allowedUsers', label: 'Globally allowed users', type: 'username-multi', group: 'Access', hint: 'Comma separated usernames' },
            { key: 'useSharpPlugin', label: 'Use Sharp for thumbnails', type: 'boolean', group: 'Thumbnails' },
            { key: 'thumbQuality', label: 'Thumbnail quality', type: 'number', min: 1, max: 100, step: 1, group: 'Thumbnails' },
            { key: 'thumbPixels', label: 'Thumbnail size (px)', type: 'number', min: 50, max: 2000, step: 50, group: 'Thumbnails' },
            { key: 'thumbnail_format', label: 'Video thumbnail format', type: 'select', options: [{ value: 'jpg', label: 'JPG' }, { value: 'gif', label: 'GIF' }], group: 'Video thumbnail' },
            { key: 'thumbnail_time', label: 'JPG thumbnail position', type: 'string', group: 'Video thumbnail' },
            { key: 'gif_width', label: 'GIF width (px)', type: 'number', min: 100, max: 800, step: 10, group: 'Video thumbnail' },
            { key: 'video_size_threshold', label: 'Long video threshold (MB)', type: 'number', min: 1, max: 100000, step: 1, group: 'Video thumbnail' },
            { key: 'short_video_start_time', label: 'Short video start time', type: 'string', group: 'Video thumbnail' },
            { key: 'short_video_duration', label: 'Short video GIF duration (s)', type: 'number', min: 1, max: 60, step: 1, group: 'Video thumbnail' },
            { key: 'short_video_fps', label: 'Short video GIF FPS', type: 'number', min: 1, max: 30, step: 1, group: 'Video thumbnail' },
            { key: 'long_video_start_time', label: 'Long video start time', type: 'string', group: 'Video thumbnail' },
            { key: 'long_video_duration', label: 'Long video GIF duration (s)', type: 'number', min: 1, max: 60, step: 1, group: 'Video thumbnail' },
            { key: 'long_video_fps', label: 'Long video GIF FPS', type: 'number', min: 1, max: 30, step: 1, group: 'Video thumbnail' },
            { key: 'backup_video_start_time', label: 'Fallback video start time', type: 'string', group: 'Video thumbnail' },
            { key: 'backup_video_duration', label: 'Fallback GIF duration (s)', type: 'number', min: 1, max: 60, step: 1, group: 'Video thumbnail' },
            { key: 'backup_video_fps', label: 'Fallback GIF FPS', type: 'number', min: 1, max: 30, step: 1, group: 'Video thumbnail' },
            { key: 'ffmpeg_path', label: 'FFmpeg path', type: 'string', group: 'Video thumbnail' },
            { key: 'maxMediaSizeMB', label: 'Max media upload size (MB)', type: 'number', min: 1, max: 102400, step: 1, group: 'Uploads' },
            { key: 'maxFileSizeMB', label: 'Max other file upload size (MB)', type: 'number', min: 1, max: 102400, step: 1, group: 'Uploads' },
            { key: 'uploadChunkSizeMB', label: 'Upload chunk size (MB)', type: 'number', min: 1, max: 32, step: 1, group: 'Uploads' }
        ]
    }

    async function listBackupArtifacts() {
        const collect = async (dir, out, type) => {
            const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
            for (const entry of entries) {
                if (entry.name === 'txt_exports') continue
                if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue
                const isZip = !entry.isDirectory() && entry.name.toLowerCase().endsWith('.zip')
                if (!entry.isDirectory() && !isZip) continue
                const ts = parseBackupNameDate(entry.name)
                if (!ts) continue
                const st = await fs.stat(path.join(dir, entry.name)).catch(() => null)
                if (!st) continue
                out.push({
                    name: entry.name,
                    type,
                    packaged: isZip,
                    size: st.size,
                    sizeReadable: formatBytes(st.size),
                    created: new Date(ts).toISOString(),
                    timestamp: entry.name.replace(/\.zip$/i, '')
                })
            }
            out.sort((a, b) => b.created.localeCompare(a.created))
            return out
        }

        const backups = await collect(BACKUP_DIR, [], 'backup')
        const txtExports = await collect(path.join(BACKUP_DIR, 'txt_exports'), [], 'txt')
        return { backups, txtExports }
    }

    async function adminManageGet(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        await ensureStorageTabsRegistered().catch(() => {})
        const tabsMap = await syncTabsMapWithConfig().catch(() => null)
        const tabs = getTabs()
        const tabData = []
        for (const tab of tabs) {
            try {
                const stats = await getTabStatsForAdmin(tab)
                stats.displayName = (tabsMap && tabsMap.names && tabsMap.names[tab]) || ''
                tabData.push(stats)
            } catch {}
        }

        // 分類清單（可包含目前沒有 tab 的分類），並附上各自??tab 數量
        const categoryCounts = {}
        for (const tab of tabData) {
            const cat = tab.category || ''
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
        }
        const categoryKeys = []
        for (const cat of (tabsMap && tabsMap.categoryOrder) || []) {
            if (cat && !categoryKeys.includes(cat)) categoryKeys.push(cat)
        }
        for (const cat of Object.keys((tabsMap && tabsMap.categoryNames) || {})) {
            if (cat && !categoryKeys.includes(cat)) categoryKeys.push(cat)
        }
        for (const tab of tabData) {
            if (tab.category && !categoryKeys.includes(tab.category)) categoryKeys.push(tab.category)
        }
        const categoryList = categoryKeys.map(key => ({
            key,
            name: (tabsMap && tabsMap.categoryNames && tabsMap.categoryNames[key]) || key,
            count: categoryCounts[key] || 0
        }))

        const artifacts = await listBackupArtifacts()
        const intervalMs = getBackupIntervalMs()
        const settings = getManageSettingsSchema().map(f => ({ ...f, value: api.getConfig(f.key) }))

        ctx.body = {
            ok: true,
            tabs: tabData,
            order: (tabsMap && tabsMap.order) || tabs,
            categories: (tabsMap && tabsMap.categories) || {},
            categoryList,
            uncategorizedCount: categoryCounts[''] || 0,
            categoryOrder: (tabsMap && tabsMap.categoryOrder) || [],
            categoryNames: (tabsMap && tabsMap.categoryNames) || {},
            categoryTabOrders: (tabsMap && tabsMap.categoryTabOrders) || {},
            tabNames: (tabsMap && tabsMap.names) || {},
            settings,
            backups: artifacts.backups,
            txtExports: artifacts.txtExports,
            lastBackupAt: lastBackupAt || null,
            nextBackupAt: (lastBackupAt && intervalMs) ? (lastBackupAt + intervalMs) : null,
            backupRunning: isBackupRunning,
            backupJob: getBackupJobState(),
            serverTime: Date.now()
        }
        ctx.status = 200
    }

    async function adminManageTabs(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const body = await readJsonBody(ctx)
        const incoming = Array.isArray(body.tabs) ? body.tabs : []
        if (incoming.length === 0) { ctx.status = 400; ctx.body = { error: 'At least one tab is required' }; return }

        const oldList = (api.getConfig('tabList') || []).filter(t => t && t.name)
        const oldNames = new Set(oldList.map(t => t.name))
        const newList = []
        const usedFolders = new Map()

        for (const raw of incoming) {
            const name = String(raw && raw.name || '').trim()
            if (!name) continue
            if (name.length > 100) { ctx.status = 400; ctx.body = { error: 'Tab name is too long' }; return }
            if (/[\\/:*?"<>|]/.test(name) && !oldNames.has(name)) {
                ctx.status = 400; ctx.body = { error: `Invalid tab name: ${name}` }; return
            }
            const folder = safeTabFolderName(name)
            if (usedFolders.has(folder)) {
                ctx.status = 400
                ctx.body = { error: `Duplicate tab folder: ${name}` }
                return
            }
            usedFolders.set(folder, name)
            newList.push({
                name,
                category: String(raw.category == null ? '' : raw.category).trim(),
                publicNote: raw.publicNote === true,
                allowedUsers: Array.isArray(raw.allowedUsers)
                    ? [...new Set(raw.allowedUsers.map(x => String(x).trim()).filter(Boolean))]
                    : []
            })
        }
        if (newList.length === 0) { ctx.status = 400; ctx.body = { error: 'At least one valid tab is required' }; return }

        const names = newList.map(t => t.name)
        const nameSet = new Set(names)
        const requestedOrder = Array.isArray(body.order) ? body.order.map(String) : []
        const order = []
        for (const n of requestedOrder) if (nameSet.has(n) && !order.includes(n)) order.push(n)
        for (const n of names) if (!order.includes(n)) order.push(n)

        const removed = [...oldNames].filter(n => !nameSet.has(n))
        const added = names.filter(n => !oldNames.has(n))

        // 先將被移??tab 的資料庫與附件移??trash，tabList 寫入成功後再真正刪除
        const staged = []
        try {
            for (const name of removed) {
                staged.push({ name, ...(await stageTabStorageForDeletion(name, getTimestamp())) })
            }
        } catch {
            for (const item of staged) await restoreStagedTabStorage(item.moves)
            ctx.status = 500
            ctx.body = { error: 'Cannot remove tab storage' }
            return
        }

        isApplyingTabList = true
        api.setTimeout(() => { isApplyingTabList = false }, 10000).unref?.()
        try {
            await api.setConfig('tabList', newList)
        } catch {
            isApplyingTabList = false
            // 設定沒寫成功就把暫存??tab 資料搬回??
            for (const item of staged) await restoreStagedTabStorage(item.moves)
            ctx.status = 500
            ctx.body = { error: 'Cannot save tab list' }
            return
        }

        await commitStagedTabDeletion(staged)

        for (const name of added) {
            const dir = getTabDir(name)
            await fs.mkdir(dir, { recursive: true }).catch(() => {})
            const indexPath = getTabIndexPath(name)
            const exists = await fs.stat(indexPath).then(() => true).catch(() => false)
            if (!exists) await fs.writeFile(indexPath, JSON.stringify({ notes: {} }, null, 2)).catch(() => {})
        }

        const tabsMap = await loadTabsMap()
        tabsMap.order = order
        tabsMap.names = tabsMap.names || {}
        tabsMap.categories = tabsMap.categories || {}
        tabsMap.categoryOrder = tabsMap.categoryOrder || []
        tabsMap.categoryNames = tabsMap.categoryNames || {}

        for (const name of removed) {
            delete tabsMap.names[name]
            delete tabsMap.categories[name]
            tabUsageCache.delete(name)
            lastIndexStats.delete(name)
            lastIndexScanAt.delete(name)
        }
        for (const tab of newList) tabsMap.categories[tab.name] = tab.category

        const tabCategories = [...new Set(newList.map(t => t.category).filter(Boolean))]
        const categoryOrder = [...(tabsMap.categoryOrder || [])]
        for (const cat of tabCategories) {
            if (!categoryOrder.includes(cat)) categoryOrder.push(cat)
        }
        tabsMap.categoryOrder = categoryOrder

        // 每??category 內的順序（與全域 order 完全獨立??
        const providedOrders = (body.categoryOrders && typeof body.categoryOrders === 'object')
            ? body.categoryOrders
            : (tabsMap.categoryTabOrders || {})
        const categoryTabOrders = {}
        for (const cat of categoryOrder) categoryTabOrders[cat] = []
        for (const cat of Object.keys(providedOrders)) {
            if (!categoryTabOrders[cat]) categoryTabOrders[cat] = []
        }
        for (const cat of Object.keys(categoryTabOrders)) {
            const previous = Array.isArray(providedOrders[cat]) ? providedOrders[cat] : []
            for (const name of previous) {
                const tab = newList.find(t => t.name === name)
                if (tab && (tab.category || '') === cat && !categoryTabOrders[cat].includes(name)) {
                    categoryTabOrders[cat].push(name)
                }
            }
        }
        for (const tab of newList) {
            const cat = tab.category || ''
            if (!categoryTabOrders[cat]) categoryTabOrders[cat] = []
            if (!categoryTabOrders[cat].includes(tab.name)) categoryTabOrders[cat].push(tab.name)
        }
        tabsMap.categoryTabOrders = categoryTabOrders

        const displayNames = body.names && typeof body.names === 'object' ? body.names : {}
        const nextNames = {}
        for (const tab of newList) {
            const displayName = String(displayNames[tab.name] == null ? '' : displayNames[tab.name]).trim()
            if (displayName && displayName !== tab.name) nextNames[tab.name] = displayName
        }
        tabsMap.names = nextNames

        try {
            await saveTabsMap(tabsMap)
        } finally {
            isApplyingTabList = false
        }
        lastKnownTabNames = new Set(newList.map(t => t.name))
        api.notifyClient('notes', 'tabsReordered', {
            tabs: tabsMap.order,
            categories: tabsMap.categories,
            categoryOrder: tabsMap.categoryOrder,
            categoryNames: tabsMap.categoryNames,
            categoryTabOrders: tabsMap.categoryTabOrders
        })

        ctx.body = { ok: true, tabs: newList, order, added, removed, deleted: removed }
        ctx.status = 200
    }

    async function adminManageCategories(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const body = await readJsonBody(ctx)
        const incoming = Array.isArray(body.categories) ? body.categories : []
        const tabsMap = await loadTabsMap()
        const oldCategories = new Set([
            ...(tabsMap.categoryOrder || []),
            ...Object.keys(tabsMap.categoryNames || {}),
            ...Object.values(tabsMap.categories || {}).filter(Boolean)
        ])

        const seen = new Set()
        const categories = []
        for (const raw of incoming) {
            const key = String(raw && raw.key || '').trim()
            if (!key || seen.has(key)) continue
            seen.add(key)
            categories.push({
                key,
                name: String(raw.name == null ? key : raw.name).trim() || key
            })
        }

        const removed = [...oldCategories].filter(cat => !seen.has(cat))

        // 被移除的分類：其??tab 回到未分類，資料本身不動
        let tabListChanged = false
        const tabList = (api.getConfig('tabList') || []).map(t => ({ ...t }))
        for (const tab of tabList) {
            if (tab.category && removed.includes(tab.category)) {
                tab.category = ''
                tabListChanged = true
            }
        }
        if (!tabsMap.categories) tabsMap.categories = {}
        for (const [tab, cat] of Object.entries(tabsMap.categories)) {
            if (cat && removed.includes(cat)) tabsMap.categories[tab] = ''
        }

        tabsMap.categoryOrder = categories.map(c => c.key)
        tabsMap.categoryNames = {}
        for (const cat of categories) {
            if (cat.name !== cat.key) tabsMap.categoryNames[cat.key] = cat.name
        }

        // 分類被移除時，其 tab ??category 已改??''，順序也搬到未分??
        const previousCategoryOrders = (tabsMap.categoryTabOrders && typeof tabsMap.categoryTabOrders === 'object')
            ? tabsMap.categoryTabOrders
            : {}
        const nextCategoryOrders = {}
        for (const cat of categories) nextCategoryOrders[cat.key] = []
        for (const cat of categories) {
            const previous = Array.isArray(previousCategoryOrders[cat.key]) ? previousCategoryOrders[cat.key] : []
            for (const name of previous) {
                if ((tabsMap.categories[name] || '') === cat.key && !nextCategoryOrders[cat.key].includes(name)) {
                    nextCategoryOrders[cat.key].push(name)
                }
            }
        }
        const uncategorized = []
        for (const name of (Array.isArray(previousCategoryOrders['']) ? previousCategoryOrders[''] : [])) {
            if ((tabsMap.categories[name] || '') === '' && !uncategorized.includes(name)) uncategorized.push(name)
        }
        for (const [name, cat] of Object.entries(tabsMap.categories)) {
            if (!cat && !uncategorized.includes(name)) uncategorized.push(name)
        }
        if (uncategorized.length > 0 || previousCategoryOrders['']) nextCategoryOrders[''] = uncategorized
        tabsMap.categoryTabOrders = nextCategoryOrders

        if (tabListChanged) {
            isApplyingTabList = true
            api.setTimeout(() => { isApplyingTabList = false }, 10000).unref?.()
            try {
                await api.setConfig('tabList', tabList)
            } catch {
                isApplyingTabList = false
                ctx.status = 500
                ctx.body = { error: 'Cannot update tabs after category removal' }
                return
            }
            lastKnownTabNames = new Set(tabList.map(t => t.name).filter(Boolean))
        }

        try {
            await saveTabsMap(tabsMap)
        } finally {
            isApplyingTabList = false
        }

        api.notifyClient('notes', 'tabsReordered', {
            tabs: tabsMap.order,
            categories: tabsMap.categories,
            categoryOrder: tabsMap.categoryOrder,
            categoryNames: tabsMap.categoryNames,
            categoryTabOrders: tabsMap.categoryTabOrders
        })

        ctx.body = { ok: true, categories, removed }
        ctx.status = 200
    }

    async function adminManageSettings(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const body = await readJsonBody(ctx)
        const rawValues = body.settings && typeof body.settings === 'object' ? body.settings : body
        const schema = new Map(getManageSettingsSchema().map(f => [f.key, f]))
        const applied = {}

        for (const [key, raw] of Object.entries(rawValues || {})) {
            const field = schema.get(key)
            if (!field) continue
            let value = raw

            if (field.type === 'number') {
                value = Number(raw)
                if (!isFinite(value)) continue
                if (field.min != null) value = Math.max(field.min, value)
                if (field.max != null) value = Math.min(field.max, value)
            } else if (field.type === 'boolean') {
                value = raw === true || raw === 'true' || raw === 1 || raw === '1'
            } else if (field.type === 'username-multi') {
                value = Array.isArray(raw)
                    ? [...new Set(raw.map(x => String(x).trim()).filter(Boolean))]
                    : String(raw == null ? '' : raw).split(',').map(x => x.trim()).filter(Boolean)
            } else if (field.type === 'select') {
                if (!field.options.some(o => o.value === raw)) continue
                value = raw
            } else {
                value = String(raw == null ? '' : raw)
            }

            try {
                await api.setConfig(key, value)
                applied[key] = value
            } catch {
                ctx.status = 500
                ctx.body = { error: `Cannot save setting: ${key}` }
                return
            }
        }
        setupBackupTimer()
        cleanupOldBackups().catch(() => {})
        ctx.body = { ok: true, applied }
        ctx.status = 200
    }

    async function adminCollapseTab(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const body = await readJsonBody(ctx)
        const tab = String(body.tab || '')
        if (!tab || !getTabs().includes(tab)) { ctx.status = 400; ctx.body = { error: 'Invalid tab' }; return }

        const index = await loadTabIndex(tab)
        let collapsed = 0
        let total = 0
        for (const ts of Object.keys(index.notes || {})) {
            total++
            if (!index.notes[ts].collapsed) {
                index.notes[ts].collapsed = true
                collapsed++
            }
        }
        if (collapsed > 0) await saveTabIndex(tab, index)

        api.notifyClient('notes', 'collapseAll', { tab })
        ctx.body = { ok: true, tab, collapsed, total }
        ctx.status = 200
    }

    async function adminCleanCategoryOrphans(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }
        if (isBackupRunning || isRestoring) { ctx.status = 409; ctx.body = { error: 'A backup or restore is running' }; return }

        const body = await readJsonBody(ctx)
        const allCategories = body.category === undefined || body.category === null || body.category === '*'
        const category = allCategories ? '' : String(body.category)
        const tabs = allCategories
            ? getTabs()
            : getTabs().filter(tab => ((getTabConfig(tab) || {}).category || '') === category)

        let added = 0
        let removed = 0
        for (const tab of tabs) {
            try {
                const stats = await reconcileTabIndex(tab, { force: true })
                added += stats ? stats.added : 0
                removed += stats ? stats.removed : 0
            } catch {}
        }

        // 以「所??tab」的引用為準，避免刪到其??tab 仍在使用的附??
        const refs = await collectReferencedAttachmentIds(getTabs())
        let deleted = 0
        let freedBytes = 0
        for (const tab of tabs) {
            try {
                const result = await cleanTabOrphanAttachments(tab, refs)
                deleted += result.deleted
                freedBytes += result.freedBytes
            } catch {}
        }

        ctx.body = {
            ok: true,
            category: allCategories ? null : category,
            allCategories,
            tabs: tabs.length,
            added,
            removed,
            deleted,
            freedBytes,
            freedReadable: formatBytes(freedBytes)
        }
        ctx.status = 200
    }

    async function adminMigrateTabContent(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }
        if (isRestoring) { ctx.status = 409; ctx.body = { error: 'A restore is running' }; return }
        // 備份可能正在讀取同一個 tab；先等它結束，避免遷移與備份互相踩踏
        for (let i = 0; i < 40 && isBackupRunning; i++) {
            await new Promise(resolve => setTimeout(resolve, 250))
        }
        if (isBackupRunning) { ctx.status = 409; ctx.body = { error: 'A backup is running, try again shortly' }; return }

        const body = await readJsonBody(ctx)
        const source = String(body.source || '')
        const target = String(body.target || '')
        const allTabs = getTabs()
        if (!allTabs.includes(source) || !allTabs.includes(target) || source === target) {
            ctx.status = 400
            ctx.body = { error: 'Invalid source or target tab' }
            return
        }

        const sourceIndex = await loadTabIndex(source)
        const targetIndex = await loadTabIndex(target)
        const sourceTsList = Object.keys(sourceIndex.notes || {}).sort()
        if (sourceTsList.length === 0) {
            ctx.status = 400
            ctx.body = { error: 'Source tab has no notes to migrate' }
            return
        }

        const targetNotes = { ...(targetIndex.notes || {}) }
        const mappings = { img: new Map(), mov: new Map(), att: new Map() }
        const copiedFiles = []
        const copiedThumbs = []
        const missing = []
        const migrateItems = []
        let skipped = 0

        const safeAttachmentId = id => typeof id === 'string' && id.length > 0 && id.length < 200
            && path.basename(id) === id && !id.includes('/') && !id.includes('\\')
        const targetThumbDir = getTabThumbDir(target)
        await ensureDir(getTabImgDir(target))
        await ensureDir(getTabMovDir(target))
        await ensureDir(getTabAttDir(target))
        await ensureDir(targetThumbDir)

        const uniqueAttachmentId = (dir, originalName) => {
            let id = generateFileId(originalName)
            while (fss.existsSync(path.join(dir, id))) id = generateFileId(originalName)
            return id
        }

        const copyWithRetry = async (src, dst, label) => {
            let lastError = null
            for (let attempt = 0; attempt < 5; attempt++) {
                try {
                    await fs.copyFile(src, dst)
                    return
                } catch (e) {
                    lastError = e
                    await new Promise(resolve => setTimeout(resolve, 200))
                }
            }
            const code = lastError && lastError.code ? ` (${lastError.code})` : ''
            throw new Error(`Cannot copy "${label}"${code}`)
        }

        const copyImageThumb = async (oldId, newId) => {
            const src = path.join(getTabThumbDir(source), oldId)
            if (!fss.existsSync(src)) return
            const dst = path.join(targetThumbDir, newId)
            try {
                await copyWithRetry(src, dst, path.basename(src))
                copiedThumbs.push(src)
            } catch {}
        }

        const copyVideoThumbs = async (oldId, newId) => {
            const oldBase = path.basename(oldId, path.extname(oldId))
            const newBase = path.basename(newId, path.extname(newId))
            for (const ext of ['.jpg', '.gif']) {
                const src = path.join(getTabThumbDir(source), oldBase + ext)
                if (!fss.existsSync(src)) continue
                try {
                    await copyWithRetry(src, path.join(targetThumbDir, newBase + ext), path.basename(src))
                    copiedThumbs.push(src)
                } catch {}
            }
        }

        const copyAttachment = async (type, oldId) => {
            if (mappings[type].has(oldId)) return mappings[type].get(oldId)
            if (!safeAttachmentId(oldId)) {
                mappings[type].set(oldId, oldId)
                missing.push(`${type}:${oldId}`)
                return oldId
            }
            const srcDir = type === 'img' ? getTabImgDir(source) : type === 'mov' ? getTabMovDir(source) : getTabAttDir(source)
            const dstDir = type === 'img' ? getTabImgDir(target) : type === 'mov' ? getTabMovDir(target) : getTabAttDir(target)
            const src = path.join(srcDir, oldId)
            if (!fss.existsSync(src)) {
                mappings[type].set(oldId, oldId)
                missing.push(`${type}:${oldId}`)
                return oldId
            }
            const newId = uniqueAttachmentId(dstDir, oldId)
            await copyWithRetry(src, path.join(dstDir, newId), path.basename(src))
            mappings[type].set(oldId, newId)
            copiedFiles.push(src)
            if (type === 'img') await copyImageThumb(oldId, newId)
            if (type === 'mov') await copyVideoThumbs(oldId, newId)
            return newId
        }

        const replaceRefs = (content, type, oldId, newId) => {
            if (oldId === newId) return content
            if (type === 'img') return content.split(`[img:${oldId}]`).join(`[img:${newId}]`)
            return content.split(`[${type}:${oldId}:`).join(`[${type}:${newId}:`)
        }

        const tsIsFree = ts => !targetNotes[ts] && !fss.existsSync(getNoteFilePath(target, ts))
        const makeUniqueTs = ts => {
            if (tsIsFree(ts)) return ts
            const base = Date.parse(ts)
            let offset = 1
            let candidate = ts
            do {
                candidate = isFinite(base) ? new Date(base + offset).toISOString() : `${ts}-${offset}`
                offset++
            } while (!tsIsFree(candidate) && offset < 10000)
            return candidate
        }

        for (const oldTs of sourceTsList) {
            let content = await loadNoteContent(source, oldTs)
            if (content == null) {
                skipped++
                continue
            }

            for (const oldId of extractImageIds(content)) {
                const newId = await copyAttachment('img', oldId)
                content = replaceRefs(content, 'img', oldId, newId)
            }
            for (const oldId of extractMovIds(content)) {
                const newId = await copyAttachment('mov', oldId)
                content = replaceRefs(content, 'mov', oldId, newId)
            }
            for (const oldId of extractAttIds(content)) {
                const newId = await copyAttachment('att', oldId)
                content = replaceRefs(content, 'att', oldId, newId)
            }

            const newTs = makeUniqueTs(oldTs)
            targetNotes[newTs] = { ...sourceIndex.notes[oldTs] }
            migrateItems.push({ oldTs, newTs, content })
        }

        if (migrateItems.length === 0) {
            ctx.status = 400
            ctx.body = { error: 'No readable notes to migrate', skipped }
            return
        }

        try {
            // 先寫入內容，再更新索引；最後才清空來源
            for (const item of migrateItems) {
                await saveNoteContent(target, item.newTs, item.content)
            }
            // 依時間順序合併，讓前端與索引的排序一致
            const sortedNotes = {}
            for (const ts of Object.keys(targetNotes).sort()) sortedNotes[ts] = targetNotes[ts]
            targetIndex.notes = sortedNotes
            await saveTabIndex(target, targetIndex)

            const emptySource = { ...sourceIndex, notes: {} }
            await saveTabIndex(source, emptySource)

            for (const ts of sourceTsList) {
                await fs.unlink(getNoteFilePath(source, ts)).catch(() => {})
            }
            for (const src of copiedFiles) await fs.unlink(src).catch(() => {})
            for (const src of copiedThumbs) await fs.unlink(src).catch(() => {})

            tabUsageCache.delete(source)
            tabUsageCache.delete(target)
            lastIndexStats.delete(source)
            lastIndexStats.delete(target)

            api.notifyClient('notes', 'tabCleared', { tab: source })
            api.notifyClient('notes', 'notesMerged', { tab: target, count: migrateItems.length, from: source })

            ctx.body = {
                ok: true,
                source,
                target,
                movedNotes: migrateItems.length,
                skipped,
                movedAttachments: copiedFiles.length,
                movedThumbs: copiedThumbs.length,
                missingAttachments: missing.length,
                sourceLeftEmpty: true
            }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500
            ctx.body = { error: 'Migration failed: ' + (e && e.message ? e.message : String(e)) }
        }
    }

    async function adminManageRepair(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const result = await runFullRepair({ force: true })
        const tabs = []
        for (const tab of getTabs()) {
            try { tabs.push(await getTabStatsForAdmin(tab, { forceUsage: true })) } catch {}
        }
        ctx.body = { ok: true, ...result, tabs }
        ctx.status = 200
    }

    async function adminManageBackupDelete(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const body = await readJsonBody(ctx)
        const type = body.type === 'txt' ? 'txt' : 'backup'
        const rawName = String(body.name || '')
        const name = path.basename(rawName)
        if (!name || name !== rawName || name.startsWith('_') || name.startsWith('.') || name === 'txt_exports') {
            ctx.status = 400; ctx.body = { error: 'Invalid backup name' }; return
        }
        if (!parseBackupNameDate(name)) { ctx.status = 400; ctx.body = { error: 'Invalid backup name' }; return }

        const dir = type === 'txt' ? path.join(BACKUP_DIR, 'txt_exports') : BACKUP_DIR
        const full = path.join(dir, name)
        const st = await fs.stat(full).catch(() => null)
        if (!st) { ctx.status = 404; ctx.body = { error: 'Backup not found' }; return }
        await fs.rm(full, { recursive: true, force: true })
        ctx.body = { ok: true, name, type }
        ctx.status = 200
    }

    async function adminManageBackupCleanup(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        await cleanupOldBackups()
        const artifacts = await listBackupArtifacts()
        ctx.body = { ok: true, ...artifacts }
        ctx.status = 200
    }

    async function adminManageBackupDownload(ctx) {
        const username = getCurrentUsername(ctx)
        if (!isHfsAdmin(username)) { ctx.status = 403; ctx.body = { error: 'Admin only' }; return }

        const type = ctx.query?.type === 'txt' ? 'txt' : 'backup'
        const rawName = String(ctx.query?.name || '')
        const name = path.basename(rawName)
        if (!name || name !== rawName || !/\.zip$/i.test(name) || !parseBackupNameDate(name)) {
            ctx.status = 400; ctx.body = { error: 'Invalid backup name' }; return
        }

        const dir = type === 'txt' ? path.join(BACKUP_DIR, 'txt_exports') : BACKUP_DIR
        const full = path.join(dir, name)
        const st = await fs.stat(full).catch(() => null)
        if (!st || !st.isFile()) { ctx.status = 404; ctx.body = { error: 'Backup not found' }; return }

        ctx.type = 'application/zip'
        ctx.set('Content-Disposition', `attachment; filename="${name}"`)
        ctx.set('Cache-Control', 'no-store')
        ctx.body = fss.createReadStream(full)
        ctx.status = 200
    }

    // ============================================
    // 分塊上傳：接收單一 chunk（JSON + base64??
    // ============================================
    async function uploadChunk(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        try {
            let body = ctx.state.params || ctx.request?.body || {}
            if (typeof ctx.getBody === 'function') {
                try {
                    const b = await ctx.getBody()
                    if (b && typeof b === 'object') body = b
                } catch {}
            }

            const { uploadId, index, totalChunks, data, mimeType } = body
            if (!uploadId || typeof index !== 'number' || !totalChunks || !data) {
                ctx.status = 400
                ctx.body = { error: 'Missing chunk fields' }
                return
            }
            if (!/^[A-Za-z0-9_-]{1,80}$/.test(String(uploadId))) {
                ctx.status = 400
                ctx.body = { error: 'Invalid uploadId' }
                return
            }
            if (!Number.isInteger(index) || !Number.isInteger(totalChunks) || index < 0 || totalChunks < 1 || totalChunks > 100000 || index >= totalChunks) {
                ctx.status = 400
                ctx.body = { error: 'Invalid chunk index' }
                return
            }

            const buf = Buffer.from(data, 'base64')
            if (buf.length === 0) {
                ctx.status = 400
                ctx.body = { error: 'Empty chunk' }
                return
            }

            const chunksDir = path.join(TEMP_DIR, 'chunks', uploadId)
            await ensureDir(chunksDir)

            const maxChunkBytes = getUploadChunkBytes() + 2 * 1024 * 1024
            if (buf.length > maxChunkBytes) {
                ctx.status = 413
                ctx.body = { error: 'Chunk too large' }
                return
            }

            const chunkPath = path.join(chunksDir, `${String(index).padStart(6, '0')}.part`)
            await fs.writeFile(chunkPath, buf)

            const metaPath = path.join(chunksDir, '_meta.json')
            let meta = {}
            try {
                meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'))
            } catch {}
            meta = {
                uploadId,
                totalChunks,
                mimeType: mimeType || meta.mimeType || 'application/octet-stream',
                createdAt: meta.createdAt || Date.now()
            }
            await fs.writeFile(metaPath, JSON.stringify(meta))

            ctx.body = { ok: true, index, received: buf.length }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500
            ctx.body = { error: 'Chunk upload failed: ' + (e && e.message ? e.message : String(e)) }
        }
    }

    // ============================================
    // 分塊上傳：合併所??chunk，產生最終檔??
    // ============================================
    async function uploadFinalize(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        let body = ctx.state.params || ctx.request?.body || {}
        if (typeof ctx.getBody === 'function') {
            try {
                const b = await ctx.getBody()
                if (b && typeof b === 'object') body = b
            } catch {}
        }

        const { uploadId, totalChunks, name, displayName, originalName, mimeType } = body
        if (!uploadId || !totalChunks) {
            ctx.status = 400
            ctx.body = { error: 'Missing uploadId or totalChunks' }
            return
        }
        if (!/^[A-Za-z0-9_-]{1,80}$/.test(String(uploadId))
            || !Number.isInteger(totalChunks) || totalChunks < 1 || totalChunks > 100000) {
            ctx.status = 400
            ctx.body = { error: 'Invalid upload session' }
            return
        }

        const chunksDir = path.join(TEMP_DIR, 'chunks', uploadId)
        try {
            await fs.stat(chunksDir)
        } catch {
            ctx.status = 404
            ctx.body = { error: 'Upload session not found' }
            return
        }

        try {
            const files = await fs.readdir(chunksDir)
            const partFiles = files.filter(f => f.endsWith('.part')).sort()

            if (partFiles.length !== totalChunks) {
                ctx.status = 400
                ctx.body = { error: `Incomplete upload: got ${partFiles.length}/${totalChunks} chunks` }
                return
            }

            const mime = mimeType || 'application/octet-stream'
            const isImage = mime.startsWith('image/')
            const isVideo = mime.startsWith('video/')
            const isAudio = mime.startsWith('audio/')
            const maxSize = getUploadLimitBytes(mime)

            let totalSize = 0
            for (const pf of partFiles) {
                const st = await fs.stat(path.join(chunksDir, pf)).catch(() => null)
                if (st) totalSize += st.size
            }
            if (totalSize === 0) {
                ctx.status = 400
                ctx.body = { error: 'Empty file after merge' }
                return
            }
            if (totalSize > maxSize) {
                ctx.status = 413
                ctx.body = { error: `File too large (max ${formatBytes(maxSize)})` }
                fs.rm(chunksDir, { recursive: true, force: true }).catch(() => {})
                return
            }

            const origName = originalName || name || 'file'
            const display = displayName || origName

            await ensureDir(TEMP_DIR)
            const fileId = generateFileId(origName)
            const filePath = path.join(TEMP_DIR, fileId)

            // 逐段拼接，避免把整份大檔案同時放進記憶體
            const fh = await fs.open(filePath, 'w')
            let written = 0
            try {
                for (const pf of partFiles) {
                    const data = await fs.readFile(path.join(chunksDir, pf))
                    written += data.length
                    if (written > maxSize) {
                        throw Object.assign(new Error('File too large'), { status: 413 })
                    }
                    await fh.write(data)
                }
            } catch (writeErr) {
                await fh.close().catch(() => {})
                await fs.unlink(filePath).catch(() => {})
                await fs.rm(chunksDir, { recursive: true, force: true }).catch(() => {})
                if (writeErr.status === 413) {
                    ctx.status = 413
                    ctx.body = { error: `File too large (max ${formatBytes(maxSize)})` }
                } else {
                    ctx.status = 500
                    ctx.body = { error: 'Finalize failed: ' + (writeErr.message || String(writeErr)) }
                }
                return
            }
            await fh.close().catch(() => {})

            const tempMapPath = path.join(TEMP_DIR, '_temp_names.json')
            let tempNameMap = {}
            try {
                tempNameMap = JSON.parse(await fs.readFile(tempMapPath, 'utf-8'))
            } catch {}
            tempNameMap[fileId] = display
            await fs.writeFile(tempMapPath, JSON.stringify(tempNameMap))

            let hasThumb = false
            if (isImage && totalSize <= 200 * 1024 * 1024) {
                // 超大圖片跳過縮圖，避免把整張圖讀進記憶體
                const imageBuffer = await fs.readFile(filePath)
                const thumbDir = await ensureDir(THUMB_BASE_DIR)
                const thumbSubDir = path.join(thumbDir, '_temp')
                await ensureDir(thumbSubDir)
                const thumbPath = path.join(thumbSubDir, fileId)
                hasThumb = await generateThumbnail(imageBuffer, thumbPath)
            }

            fs.rm(chunksDir, { recursive: true, force: true }).catch(() => {})

            ctx.body = {
                ok: true,
                fileId,
                isImage,
                isVideo,
                isAudio,
                isOther: !isImage && !isVideo && !isAudio,
                url: `/~/notes/temp/${fileId}`,
                name: display,
                hasThumb,
                originalName: origName
            }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500
            ctx.body = { error: 'Finalize failed: ' + (e && e.message ? e.message : String(e)) }
        }
    }

    // ============================================
    // 舊版上傳：單??JSON + base64（保留兼容，小檔案可用）
    // ============================================
    async function uploadFileToTemp(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        try {
            const body = ctx.request?.body || ctx.state?.params || {}
            if (!body.data) { ctx.status = 400; ctx.body = { error: 'No file data' }; return }

            const matches = body.data.match(/^data:(.+);base64,(.+)$/)
            if (!matches) { ctx.status = 400; ctx.body = { error: 'Invalid base64 format' }; return }

            const mimeType = matches[1]
            const fileBuffer = Buffer.from(matches[2], 'base64')
            const originalName = body.name || 'file'
            const displayName = body.displayName || originalName

            if (fileBuffer.length === 0) { ctx.status = 400; ctx.body = { error: 'Empty file' }; return }

            const isImage = mimeType.startsWith('image/')
            const maxSize = getUploadLimitBytes(mimeType)
            if (fileBuffer.length > maxSize) {
                ctx.status = 413; ctx.body = { error: `File too large (max ${formatBytes(maxSize)})` }; return
            }

            await ensureDir(TEMP_DIR)
            const fileId = generateFileId(originalName)
            const filePath = path.join(TEMP_DIR, fileId)

            await fs.writeFile(filePath, fileBuffer)

            const tempMapPath = path.join(TEMP_DIR, '_temp_names.json')
            let tempNameMap = {}
            try {
                tempNameMap = JSON.parse(await fs.readFile(tempMapPath, 'utf-8'))
            } catch {}
            tempNameMap[fileId] = originalName
            await fs.writeFile(tempMapPath, JSON.stringify(tempNameMap))

            const isVideo = mimeType.startsWith('video/')
            const isAudio = mimeType.startsWith('audio/')

            let hasThumb = false
            if (isImage) {
                const thumbDir = await ensureDir(THUMB_BASE_DIR)
                const thumbSubDir = path.join(thumbDir, '_temp')
                await ensureDir(thumbSubDir)
                const thumbPath = path.join(thumbSubDir, fileId)
                hasThumb = await generateThumbnail(fileBuffer, thumbPath)
            }

            ctx.body = {
                ok: true,
                fileId,
                isImage,
                isVideo,
                isAudio,
                isOther: !isImage && !isVideo && !isAudio,
                url: `/~/notes/temp/${fileId}`,
                name: displayName,
                hasThumb,
                originalName: originalName
            }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500; ctx.body = { error: 'Upload failed: ' + e.message }
        }
    }

    async function serveTempFile(ctx) {
        const params = ctx.params || {}
        let fileId = params.fileId

        if (!fileId) { ctx.status = 404; return }

        try {
            fileId = decodeURIComponent(fileId)
            if (fileId.includes('%')) {
                fileId = decodeURIComponent(fileId)
            }
        } catch (e) {}

        const filePath = path.join(TEMP_DIR, fileId)

        try {
            await fs.stat(filePath)
            const ext = path.extname(fileId).slice(1).toLowerCase()
            const mimeTypes = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'png': 'image/png', 'gif': 'image/gif',
                'webp': 'image/webp', 'bmp': 'image/bmp',
                'svg': 'image/svg+xml',
                'mp4': 'video/mp4', 'webm': 'video/webm',
                'ogg': 'video/ogg', 'mov': 'video/quicktime',
                'mp3': 'audio/mpeg', 'wav': 'audio/wav',
                'flac': 'audio/flac', 'aac': 'audio/aac',
                'm4a': 'audio/mp4', 'opus': 'audio/opus'
            }
            ctx.type = mimeTypes[ext] || 'application/octet-stream'
            ctx.set('Cache-Control', 'no-cache')
            ctx.body = await fs.readFile(filePath)
            ctx.status = 200
        } catch {
            ctx.status = 404
        }
    }

    async function serveImage(ctx) {
        const params = ctx.params || {}
        const tab = params.tab
        let imageId = params.imageId

        if (!tab || !imageId) { ctx.status = 404; return }

        try {
            imageId = decodeURIComponent(imageId)
            if (imageId.includes('%')) {
                imageId = decodeURIComponent(imageId)
            }
        } catch (e) {}

        let filePath = path.join(getTabImgDir(tab), imageId)
        try {
            await fs.stat(filePath)
        } catch {
            filePath = path.join(TEMP_DIR, imageId)
            try {
                await fs.stat(filePath)
            } catch {
                ctx.status = 404; return
            }
        }

        try {
            const ext = path.extname(imageId).slice(1).toLowerCase()
            const mimeTypes = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'png': 'image/png', 'gif': 'image/gif',
                'webp': 'image/webp', 'bmp': 'image/bmp',
                'svg': 'image/svg+xml'
            }
            ctx.type = mimeTypes[ext] || 'application/octet-stream'
            ctx.set('Cache-Control', 'public, max-age=3600')
            ctx.body = await fs.readFile(filePath)
            ctx.status = 200
        } catch {
            ctx.status = 404
        }
    }

    async function serveThumb(ctx) {
        const params = ctx.params || {}
        const tab = params.tab
        let thumbId = params.thumbId

        if (!tab || !thumbId) { ctx.status = 404; return }

        try {
            thumbId = decodeURIComponent(thumbId)
            if (thumbId.includes('%')) {
                thumbId = decodeURIComponent(thumbId)
            }
        } catch (e) {}

        let thumbPath = path.join(getTabThumbDir(tab), thumbId)
        try {
            await fs.stat(thumbPath)
        } catch {
            thumbPath = path.join(THUMB_BASE_DIR, '_temp', thumbId)
            try {
                await fs.stat(thumbPath)
            } catch {
                ctx.status = 404; return
            }
        }

        try {
            const ext = path.extname(thumbId).slice(1).toLowerCase()
            if (ext === 'gif') {
                ctx.type = 'image/gif'
            } else {
                ctx.type = 'image/jpeg'
            }
            ctx.set('Cache-Control', 'public, max-age=86400')
            ctx.body = await fs.readFile(thumbPath)
            ctx.status = 200
        } catch {
            ctx.status = 404
        }
    }

    async function serveMov(ctx) {
        const params = ctx.params || {}
        const tab = params.tab
        let fileId = params.fileId
        if (!tab || !fileId) { ctx.status = 404; return }

        try {
            fileId = decodeURIComponent(fileId)
            if (fileId.includes('%')) {
                fileId = decodeURIComponent(fileId)
            }
        } catch (e) {}

        let filePath = path.join(getTabMovDir(tab), fileId)
        try {
            await fs.stat(filePath)
        } catch {
            filePath = path.join(TEMP_DIR, fileId)
            try {
                await fs.stat(filePath)
            } catch {
                ctx.status = 404; return
            }
        }

        try {
            const stat = await fs.stat(filePath)
            const fileSize = stat.size
            const ext = path.extname(fileId).slice(1).toLowerCase()
            const mimeMap = {
                'mp4': 'video/mp4', 'webm': 'video/webm',
                'ogg': 'video/ogg', 'mov': 'video/quicktime',
                'mp3': 'audio/mpeg', 'wav': 'audio/wav',
                'flac': 'audio/flac', 'aac': 'audio/aac',
                'm4a': 'audio/mp4', 'opus': 'audio/opus'
            }
            ctx.type = mimeMap[ext] || 'application/octet-stream'
            ctx.set('Accept-Ranges', 'bytes')

            const originalName = await getFileName(tab, 'mov', fileId).catch(() => fileId)
            ctx.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(originalName)}`)

            const range = ctx.get('Range')
            if (range) {
                const parts = range.replace(/bytes=/, '').split('-')
                const start = parseInt(parts[0], 10)
                const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

                if (start >= fileSize) {
                    ctx.status = 416
                    ctx.set('Content-Range', `bytes */${fileSize}`)
                    return
                }

                const chunksize = (end - start) + 1

                ctx.status = 206
                ctx.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
                ctx.set('Content-Length', String(chunksize))

                const stream = fss.createReadStream(filePath, { start, end })
                ctx.body = stream
            } else {
                ctx.set('Content-Length', String(fileSize))
                ctx.body = fss.createReadStream(filePath)
            }

            ctx.set('Cache-Control', 'public, max-age=3600')
        } catch { ctx.status = 404 }
    }

    async function serveAtt(ctx) {
        const params = ctx.params || {}
        const tab = params.tab
        let fileId = params.fileId

        if (!tab || !fileId) { ctx.status = 404; return }

        try {
            fileId = decodeURIComponent(fileId)
            if (fileId.includes('%')) {
                fileId = decodeURIComponent(fileId)
            }
        } catch (e) {}

        let filePath = path.join(getTabAttDir(tab), fileId)
        try {
            await fs.stat(filePath)
        } catch {
            filePath = path.join(TEMP_DIR, fileId)
            try {
                await fs.stat(filePath)
            } catch {
                ctx.status = 404
                ctx.body = { error: 'File not found' }
                return
            }
        }

        try {
            const originalName = await getFileName(tab, 'att', fileId).catch(() => fileId)

            ctx.type = 'application/octet-stream'
            ctx.set('Cache-Control', 'no-cache')

            const encodedName = encodeURIComponent(originalName)
                .replace(/['()]/g, escape)
                .replace(/\*/g, '%2A');

            ctx.set('Content-Disposition',
                `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`
            );

            ctx.set('Access-Control-Allow-Origin', '*')
            ctx.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ctx.set('Access-Control-Allow-Headers', 'Content-Type')
            ctx.set('X-Content-Type-Options', 'nosniff')

            ctx.body = await fs.readFile(filePath)
            ctx.status = 200
        } catch (err) {
            console.error('Serve attachment error:', err)
            ctx.status = 404
        }
    }

    const NOTES_ADMIN_ASSET_VERSION = `${exports.version}-${Date.now()}`

    // ??Notes 管理頁注入到 /~/admin/ ??HTML，由 admin-tab.js ??Plugins 頁面上加一個頂??tab
    function injectNotesAdminTab(ctx) {
        if (typeof ctx.body !== 'string' || ctx.body.includes('notes-admin-tab')) return
        const base = `${ctx.state?.revProxyPath || ''}/~/plugins/Notes/`
        const v = encodeURIComponent(NOTES_ADMIN_ASSET_VERSION)
        const tags = `<link rel="stylesheet" href="${base}admin-tab.css?v=${v}"><script id="notes-admin-tab" src="${base}admin-tab.js?v=${v}"></script>`
        if (ctx.body.includes('</head>')) ctx.body = ctx.body.replace('</head>', tags + '</head>')
        else if (ctx.body.includes('</body>')) ctx.body = ctx.body.replace('</body>', tags + '</body>')
    }

    return {
        async middleware(ctx) {
            const p = ctx.path
            const method = ctx.method.toUpperCase()

            if (method === 'GET' && (p === '/~/admin' || p === '/~/admin/')) {
                return () => injectNotesAdminTab(ctx)
            }

            if (p.startsWith('/~/notes/temp/')) {
                const fileId = p.replace('/~/notes/temp/', '')
                if (fileId) {
                    ctx.params = { fileId }
                    await serveTempFile(ctx)
                } else { ctx.status = 404 }
                return
            }

            if (p.startsWith('/~/notes/thumb/')) {
                const parts = p.replace('/~/notes/thumb/', '').split('/')
                if (parts.length >= 2) {
                    ctx.params = { tab: parts[0], thumbId: parts.slice(1).join('/') }
                    await serveThumb(ctx)
                } else { ctx.status = 404 }
                return
            }

            if (p.startsWith('/~/notes/img/')) {
                const parts = p.replace('/~/notes/img/', '').split('/')
                if (parts.length >= 2) {
                    ctx.params = { tab: parts[0], imageId: parts.slice(1).join('/') }
                    await serveImage(ctx)
                } else {
                    ctx.status = 404; return
                }
                return
            }

            if (p.startsWith('/~/notes/mov/')) {
                const parts = p.replace('/~/notes/mov/', '').split('/')
                if (parts.length >= 2) {
                    ctx.params = { tab: parts[0], fileId: parts.slice(1).join('/') }
                    await serveMov(ctx)
                } else { ctx.status = 404 }
                return
            }

            if (p.startsWith('/~/notes/att/')) {
                const parts = p.replace('/~/notes/att/', '').split('/')
                if (parts.length >= 2) {
                    ctx.params = { tab: parts[0], fileId: parts.slice(1).join('/') }
                    await serveAtt(ctx)
                } else { ctx.status = 404 }
                return
            }

            if (!p.startsWith(API_BASE)) return

            if (p === `${API_BASE}check` && method === 'GET') { await checkAccess(ctx); return }
            if (p === `${API_BASE}list` && method === 'GET') { await listNotes(ctx); return }
            if (p === `${API_BASE}get-full` && method === 'GET') { await getNoteFull(ctx); return }
            if (p === `${API_BASE}tabs` && method === 'GET') { await getTabInfo(ctx); return }
            if (p === `${API_BASE}add` && method === 'POST') { await addNote(ctx); return }
            if (p === `${API_BASE}update` && method === 'POST') { await updateNote(ctx); return }
            if (p === `${API_BASE}rename-ts` && method === 'POST') { await renameNoteTs(ctx); return }
            if (p === `${API_BASE}toggle-star` && method === 'POST') { await toggleStar(ctx); return }
            if (p === `${API_BASE}toggle-collapse` && method === 'POST') { await toggleCollapse(ctx); return }
            if (p === `${API_BASE}delete` && method === 'POST') { await deleteNote(ctx); return }
            if (p === `${API_BASE}reorder-tabs` && method === 'POST') { await reorderTabs(ctx); return }
            if (p === `${API_BASE}reorder-category-tabs` && method === 'POST') { await reorderCategoryTabs(ctx); return }
            if (p === `${API_BASE}rename-tab` && method === 'POST') { await renameTab(ctx); return }
            if (p === `${API_BASE}update-category` && method === 'POST') { await updateCategory(ctx); return }
            if (p === `${API_BASE}update-category-name` && method === 'POST') { await updateCategoryName(ctx); return }
            if (p === `${API_BASE}update-category-order` && method === 'POST') { await updateCategoryOrder(ctx); return }
            if (p === `${API_BASE}upload` && method === 'POST') { await uploadFileToTemp(ctx); return }
            if (p === `${API_BASE}upload-chunk` && method === 'POST') { await uploadChunk(ctx); return }
            if (p === `${API_BASE}upload-finalize` && method === 'POST') { await uploadFinalize(ctx); return }

            if (p === `${ADMIN_API}overview` && method === 'GET') { await adminOverview(ctx); return }
            if (p === `${ADMIN_API}export` && method === 'GET') { await adminExport(ctx); return }
            if (p === `${ADMIN_API}import` && method === 'POST') { await adminImport(ctx); return }
            if (p === `${ADMIN_API}backup` && method === 'POST') { await adminBackup(ctx); return }
            if (p === `${ADMIN_API}backup-status` && method === 'GET') { await adminBackupStatus(ctx); return }
            if (p === `${ADMIN_API}rollback` && method === 'POST') { await adminRollback(ctx); return }
            if (p === `${ADMIN_API}clear` && method === 'POST') { await adminClearTab(ctx); return }
            if (p === `${ADMIN_API}export-txt` && method === 'POST') { await adminExportTxt(ctx); return }

            if (p === `${ADMIN_API}manage` && method === 'GET') { await adminManageGet(ctx); return }
            if (p === `${ADMIN_API}manage/tabs` && method === 'POST') { await adminManageTabs(ctx); return }
            if (p === `${ADMIN_API}manage/categories` && method === 'POST') { await adminManageCategories(ctx); return }
            if (p === `${ADMIN_API}manage/settings` && method === 'POST') { await adminManageSettings(ctx); return }
            if (p === `${ADMIN_API}manage/repair` && method === 'POST') { await adminManageRepair(ctx); return }
            if (p === `${ADMIN_API}manage/collapse-tab` && method === 'POST') { await adminCollapseTab(ctx); return }
            if (p === `${ADMIN_API}manage/clean-orphans` && method === 'POST') { await adminCleanCategoryOrphans(ctx); return }
            if (p === `${ADMIN_API}manage/migrate-tab-content` && method === 'POST') { await adminMigrateTabContent(ctx); return }
            if (p === `${ADMIN_API}manage/backup-delete` && method === 'POST') { await adminManageBackupDelete(ctx); return }
            if (p === `${ADMIN_API}manage/backup-cleanup` && method === 'POST') { await adminManageBackupCleanup(ctx); return }
            if (p === `${ADMIN_API}manage/backup-download` && method === 'GET') { await adminManageBackupDownload(ctx); return }
        }
    }
}