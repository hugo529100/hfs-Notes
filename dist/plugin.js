exports.version = 3.2
exports.description = "A lightweight, convenient note-taking tool built into HFS with multi-tab support, real-time sync, auto-backup, pagination, TXT export, progressive loading, GIF video thumbnails, and unified temp file management."
exports.apiRequired = 8.87
exports.repo = "Hug3O/Notes"
exports.frontend_js = ['main.js']
exports.frontend_css = ['style.css']
exports.config = {
    tabList: {
        type: 'array',
        label: 'Tab List',
        fields: {
            name: { label: 'Tab Name' },
            publicNote: {
                type: 'boolean',
                label: 'Allow notes visible on public page',
                defaultValue: false,
                helperText: 'When enabled, unauthenticated users (Guest) can see and send text-only notes in this tab.'
            }
        },
        defaultValue: [{ name: 'General', publicNote: false }],
        helperText: 'Add or remove tabs. Each tab has its own independent note storage.',
        frontend: true
    },
    restrictUsers: {
        type: 'boolean',
        label: 'Restrict user access',
        helperText: 'When enabled, only selected users below can access notes. When disabled, all logged-in users can access.',
        defaultValue: false,
        frontend: true
    },
    allowedUsers: {
        type: 'username',
        multiple: true,
        label: 'Allowed users',
        helperText: 'Only applies when "Restrict user access" is enabled above.',
        showIf: x => x.restrictUsers,
        frontend: true
    },
    backupInterval: {
        type: 'number',
        label: 'Auto Backup Interval (hours)',
        defaultValue: 6,
        helperText: 'How often to backup notes database (0 to disable)'
    },
    backupRetentionDays: {
        type: 'number',
        label: 'Backup Retention Days',
        defaultValue: 3,
        helperText: 'How many days to keep backup files'
    },
    autoExportTxt: {
        type: 'boolean',
        label: 'Auto Export TXT',
        helperText: 'When enabled, automatically export notes as individual TXT files (each note as separate file, organized by tab folders) alongside each backup.',
        defaultValue: false,
        frontend: true
    },
    useSharpPlugin: {
        type: 'boolean',
        defaultValue: true,
        label: 'Use Sharp plugin for thumbnails',
        helperText: 'Requires rejetto/sharp plugin to be installed. Falls back to built-in method if disabled.',
        frontend: true
    },
    thumbQuality: {
        type: 'number',
        defaultValue: 70,
        min: 1,
        max: 100,
        label: 'Thumbnail quality',
        helperText: 'JPEG quality for thumbnails (1-100)',
        xs: 6
    },
    thumbPixels: {
        type: 'number',
        defaultValue: 800,
        min: 50,
        max: 2000,
        label: 'Thumbnail size (pixels)',
        helperText: 'Longest side dimension in pixels',
        xs: 6
    },
    ffmpeg_path: {
        type: 'real_path',
        fileMask: 'ffmpeg*',
        defaultValue: 'ffmpeg.exe',
        helperText: 'Path to FFmpeg executable. Leave empty if it\'s in the system path. Used for video thumbnail extraction.',
        xs: 6
    },
    thumbnail_time: {
        type: 'string',
        defaultValue: '00:00:05',
        label: 'JPG thumbnail time position',
        helperText: 'Time position for JPG thumbnail extraction (HH:MM:SS)',
        showIf: x => x.thumbnail_format === 'jpg',
        xs: 6
    },
    thumbnail_format: {
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
    gif_width: {
        type: 'number',
        min: 100,
        max: 800,
        defaultValue: 320,
        label: 'GIF width (pixels)',
        helperText: 'Width of output GIF (height auto-scaled)',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    video_size_threshold: {
        type: 'number',
        defaultValue: 25,
        min: 1,
        max: 100000,
        label: 'Video size threshold (MB)',
        helperText: 'Videos larger than this will use long video settings',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    short_video_start_time: {
        type: 'string',
        defaultValue: '00:01:00',
        label: 'Short video start time (HH:MM:SS)',
        helperText: 'Start time for short videos (<= threshold)',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 12
    },
    short_video_duration: {
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 12,
        label: 'Short video GIF duration (seconds)',
        helperText: 'Duration of GIF for short videos',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    short_video_fps: {
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Short video GIF FPS',
        helperText: 'Frames per second for short videos',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    long_video_start_time: {
        type: 'string',
        defaultValue: '00:3:00',
        label: 'Long video start time (HH:MM:SS)',
        helperText: 'Start time for long videos (> threshold)',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 12
    },
    long_video_duration: {
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 12,
        label: 'Long video GIF duration (seconds)',
        helperText: 'Duration of GIF for long videos',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    long_video_fps: {
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Long video GIF FPS',
        helperText: 'Frames per second for long videos',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    backup_video_start_time: {
        type: 'string',
        defaultValue: '00:00:00',
        label: 'Backup video start time (HH:MM:SS)',
        helperText: 'Fallback start time when other settings fail',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 12
    },
    backup_video_duration: {
        type: 'number',
        min: 1,
        max: 60,
        defaultValue: 6,
        label: 'Backup video GIF duration (seconds)',
        helperText: 'Duration of GIF for backup mode',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    },
    backup_video_fps: {
        type: 'number',
        min: 1,
        max: 30,
        defaultValue: 6,
        label: 'Backup video GIF FPS',
        helperText: 'Frames per second for backup mode',
        showIf: x => x.thumbnail_format === 'gif',
        xs: 6
    }
}

exports.init = async api => {
    const { getCurrentUsername } = api.require('./auth')
    const fs = api.require('fs/promises')
    const fss = api.require('fs')
    const path = api.require('path')
    const crypto = api.require('crypto')
    const { spawn } = api.require('child_process')
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
    const TABS_MAP_FILE = path.join(TABS_DIR, '_tabs_map.json')

    const SPAM_DELAY = 200
    const MAX_STORAGE_WARNING = 400
    const MAX_IMG_SIZE = 40 * 1024 * 1024
    const MAX_FILE_SIZE = 200 * 1024 * 1024
    const TEMP_FILE_TTL = 60 * 1000
    const THUMB_QUALITY = 70
    const PAGE_SIZE = 10
    const SUMMARY_LENGTH = 200

    let backupTimer = null
    let midnightCleanupTimer = null
    let isBackupRunning = false
    
    const throttleDb = api.openDb('notes_throttle', { rewriteLater: true })
    
    await fs.mkdir(TABS_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(IMG_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(MOV_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(ATT_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(THUMB_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(TEMP_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {})

    try {
        await fs.stat(TABS_MAP_FILE)
    } catch {
        const tabs = getTabs()
        await fs.writeFile(TABS_MAP_FILE, JSON.stringify({ order: tabs, names: {} }, null, 2))
    }

    async function syncTabsMapWithConfig() {
        const tabsMap = await loadTabsMap()
        const configTabs = getTabs()
        let needsSave = false
        
        const newOrder = tabsMap.order.filter(t => configTabs.includes(t))
        if (newOrder.length !== tabsMap.order.length) {
            tabsMap.order = newOrder
            needsSave = true
        }
        
        for (const tab of configTabs) {
            if (!tabsMap.order.includes(tab)) {
                tabsMap.order.push(tab)
                needsSave = true
            }
        }
        
        for (const tabName of Object.keys(tabsMap.names)) {
            if (!configTabs.includes(tabName)) {
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
    
    function getTabPublicConfig(tab) {
        if (!tab) return false
        const list = api.getConfig('tabList') || [{ name: 'General', publicNote: false }]
        const found = list.find(t => t.name === tab)
        return found ? (found.publicNote === true) : false
    }

    function isAllowed(username, tab) {
        if (username === 'admin') return true
        if (!username) {
            if (tab) return getTabPublicConfig(tab)
            return false
        }
        if (!api.getConfig('restrictUsers')) return true
        const allowed = api.getConfig('allowedUsers') || []
        return allowed.includes(username)
    }

    function getTabs() {
        const list = api.getConfig('tabList') || [{ name: 'General', publicNote: false }]
        return list.map(t => t.name).filter(Boolean)
    }

    function getPublicTabs() {
        const list = api.getConfig('tabList') || [{ name: 'General', publicNote: false }]
        return list.filter(t => t.publicNote === true).map(t => t.name).filter(Boolean)
    }

    function getTimestamp() {
        const now = new Date()
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
    // 保留原始扩展名，但添加时间前缀
    const ext = path.extname(originalName) || ''
    const baseName = path.basename(originalName, ext)
    // 文件名格式：年月日时分秒_随机数_原始文件名
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
    return path.join(IMG_BASE_DIR, safeTab)  // storage/img/News
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
    return path.join(THUMB_BASE_DIR, safeTab)  // storage/thumb/News
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
                names: parsed.names || {}
            }
        } catch {
            const tabs = getTabs()
            return { order: tabs, names: {} }
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
    // 首先从目标目录的映射中查找
    const mapPath = getNameMapPath(tab, type)
    try {
        const nameMap = JSON.parse(await fs.readFile(mapPath, 'utf-8'))
        if (nameMap[fileId]) return nameMap[fileId]
    } catch {}
    
    // 如果找不到，尝试从临时目录映射中查找
    try {
        const tempMapPath = path.join(TEMP_DIR, '_temp_names.json')
        const tempNameMap = JSON.parse(await fs.readFile(tempMapPath, 'utf-8'))
        if (tempNameMap[fileId]) return tempNameMap[fileId]
    } catch {}
    
    // 如果都找不到，从文件名中提取原始名称（去除时间前缀）
    // 格式：年月日时分秒_随机数_原始文件名
    const parts = fileId.split('_')
    if (parts.length >= 3) {
        // 移除前两个部分（时间和随机数）
        const originalParts = parts.slice(2)
        return originalParts.join('_')
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
                    
                    const tryExtract = (offsetIndex) => {
                        if (offsetIndex >= maxAttempts || success) {
                            if (!success) resolve(false)
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
                        
                        ffmpeg.on('exit', (code) => {
                            if (code === 0) {
                                fs.stat(thumbPath).then(() => {
                                    success = true
                                    resolve(true)
                                }).catch(() => {
                                    tryExtract(offsetIndex + 1)
                                })
                            } else {
                                tryExtract(offsetIndex + 1)
                            }
                        })
                        
                        ffmpeg.on('error', () => {
                            tryExtract(offsetIndex + 1)
                        })
                        
                        setTimeout(() => {
                            tryExtract(offsetIndex + 1)
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
        
        // 复制临时文件名映射到目标目录
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
                    if (stat.mtimeMs < cutoff) {
                        await fs.unlink(filePath)
                    }
                } catch {}
            }
        } catch {}
    }

    async function createBackup() {
        const tabs = getTabs()
        const timestamp = getTimestamp()
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
        
        return { backupFolder, backedUpCount }
    }

    async function exportTxtFiles() {
        const autoExport = api.getConfig('autoExportTxt')
        if (!autoExport) return []
        
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
        
        return exportFiles
    }

    async function cleanupOldBackups() {
        try {
            const retentionDays = api.getConfig('backupRetentionDays') || 3
            const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
            
            const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true }).catch(() => [])
            
            for (const entry of entries) {
                if (!entry.isDirectory()) continue
                if (entry.name === 'txt_exports') continue
                
                const folderPath = path.join(BACKUP_DIR, entry.name)
                try {
                    const stat = await fs.stat(folderPath)
                    if (stat.mtime.getTime() < cutoffTime) {
                        await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {})
                    }
                } catch {}
            }
            
            const txtBaseDir = path.join(BACKUP_DIR, 'txt_exports')
            try {
                const txtFolders = await fs.readdir(txtBaseDir, { withFileTypes: true }).catch(() => [])
                for (const folder of txtFolders) {
                    if (!folder.isDirectory()) continue
                    const folderPath = path.join(txtBaseDir, folder.name)
                    try {
                        const stat = await fs.stat(folderPath)
                        if (stat.mtime.getTime() < cutoffTime) {
                            await fs.rm(folderPath, { recursive: true, force: true }).catch(() => {})
                        }
                    } catch {}
                }
            } catch {}
            
        } catch {}
    }

    async function performScheduledBackup() {
        if (isBackupRunning) return
        
        isBackupRunning = true
        try {
            await createBackup()
            if (api.getConfig('autoExportTxt')) {
                await exportTxtFiles()
            }
        } catch (e) {} finally {
            isBackupRunning = false
        }
    }

    function setupBackupTimer() {
        if (backupTimer) {
            clearInterval(backupTimer)
            backupTimer = null
        }
        
        const interval = api.getConfig('backupInterval') || 6
        
        if (interval <= 0) return
        
        const intervalMs = interval * 60 * 60 * 1000
        
        backupTimer = setInterval(async () => {
            await performScheduledBackup()
        }, intervalMs)
        
        if (backupTimer && backupTimer.unref) {
            backupTimer.unref()
        }
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
            midnightCleanupTimer = setTimeout(() => {
                cleanupTempFiles().catch(() => {})
                cleanupOldBackups().catch(() => {})
                scheduleNext()
            }, delay)
            if (midnightCleanupTimer && midnightCleanupTimer.unref) {
                midnightCleanupTimer.unref()
            }
        }
        scheduleNext()
    }

    setupBackupTimer()
    setupMidnightCleanup()
    
    api.subscribeConfig(['backupInterval', 'backupRetentionDays', 'tabList', 'autoExportTxt'], () => {
        setupBackupTimer()
        setTimeout(async () => {
            await performScheduledBackup()
        }, 500)
        if (api.getConfig('tabList')) {
            syncTabsMapWithConfig().then(tabsMap => {
                api.notifyClient('notes', 'tabsReordered', { tabs: tabsMap.order })
            }).catch(() => {})
        }
    })

    async function getTabInfo(ctx) {
        const username = getCurrentUsername(ctx)
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
                isGuest: true
            }
            ctx.status = 200
            return
        }

        if (!isAllowed(username)) { ctx.status = 403; return }

        const result = {}
        for (const tab of tabs) {
            result[tab] = await getTabNoteCount(tab)
        }
        ctx.body = { 
            tabs, 
            counts: result, 
            warning: Object.values(result).reduce((a, b) => a + b, 0) >= MAX_STORAGE_WARNING,
            tabNames: tabsMap.names,
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

    async function listNotes(ctx) {
        const username = getCurrentUsername(ctx)
        const tab = ctx.query?.tab
        if (!tab) { ctx.status = 400; return }
        if (!isAllowed(username, tab)) { ctx.status = 403; return }
        
        const offset = parseInt(ctx.query?.offset) || 0
        const limit = Math.min(parseInt(ctx.query?.limit) || PAGE_SIZE, 100)
        const summaryOnly = ctx.query?.summary === '1'
        
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
        
        const lineCount = sanitizedM.split('\n').length
        const autoCollapsed = forceCollapsed || lineCount > 100
        
        if (username && username !== 'Guest') {
            await promoteAllAttachments(sanitizedM, tab)
        }
        
        await addNoteToTab(tab, ts, {
            m: sanitizedM,
            u: username,
            starred: false,
            collapsed: autoCollapsed
        })
        
        const newCount = count + 1
        
        api.notifyClient('notes', 'newNote', { ts, u: username, m: sanitizedM, tab, starred: false, collapsed: autoCollapsed })
        
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
        
        const oldImgIds = extractImageIds(note.m)
        const newImgIds = extractImageIds(sanitizedM)
        const removedImgIds = oldImgIds.filter(id => !newImgIds.includes(id))
        for (const id of removedImgIds) {
            await deleteAttachmentAcrossAllTabs(id, 'img')
            await deleteAttachmentAcrossAllTabs(id, 'thumb')
        }
        
        const oldMovIds = extractMovIds(note.m)
        const newMovIds = extractMovIds(sanitizedM)
        const removedMovIds = oldMovIds.filter(id => !newMovIds.includes(id))
        for (const id of removedMovIds) {
            await deleteAttachmentAcrossAllTabs(id, 'mov')
        }
        
        const oldAttIds = extractAttIds(note.m)
        const newAttIds = extractAttIds(sanitizedM)
        const removedAttIds = oldAttIds.filter(id => !newAttIds.includes(id))
        for (const id of removedAttIds) {
            await deleteAttachmentAcrossAllTabs(id, 'att')
        }
        
        await promoteAllAttachments(sanitizedM, tab)
        
        await updateNoteInTab(tab, ts, {
            m: sanitizedM,
            u: note.u,
            starred: note.starred || false,
            collapsed: note.collapsed || false
        })
        
        api.notifyClient('notes', 'updateNote', { ts, tab, m: sanitizedM, starred: note.starred || false, collapsed: note.collapsed || false })
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
        api.notifyClient('notes', 'tabsReordered', { tabs: newOrder })
        ctx.body = { ok: true }
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
            const backupDirs = entries.filter(e => e.isDirectory() && e.name !== 'txt_exports')
            
            for (const entry of backupDirs) {
                const folderPath = path.join(BACKUP_DIR, entry.name)
                try {
                    const stat = await fs.stat(folderPath)
                    let totalSize = 0
                    let fileCount = 0
                    const tabsDirs = await fs.readdir(path.join(folderPath, 'tabs')).catch(() => [])
                    for (const tabDir of tabsDirs) {
                        const tabPath = path.join(folderPath, 'tabs', tabDir)
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
                    
                    backups.push({
                        name: entry.name,
                        timestamp: entry.name,
                        size: totalSize,
                        sizeReadable: formatBytes(totalSize),
                        fileCount: fileCount,
                        created: stat.mtime.toISOString()
                    })
                } catch {}
            }
            backups.sort((a, b) => b.created.localeCompare(a.created))
        } catch {}
        
        let txtExports = []
        try {
            const txtBaseDir = path.join(BACKUP_DIR, 'txt_exports')
            const txtFolders = await fs.readdir(txtBaseDir, { withFileTypes: true }).catch(() => [])
            
            for (const folder of txtFolders) {
                if (!folder.isDirectory()) continue
                const folderPath = path.join(txtBaseDir, folder.name)
                try {
                    const stat = await fs.stat(folderPath)
                    let totalSize = 0
                    let fileCount = 0
                    const tabDirs = await fs.readdir(folderPath).catch(() => [])
                    
                    for (const tabDir of tabDirs) {
                        const tabPath = path.join(folderPath, tabDir)
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
                    
                    txtExports.push({
                        name: folder.name,
                        timestamp: folder.name,
                        size: totalSize,
                        sizeReadable: formatBytes(totalSize),
                        fileCount: fileCount,
                        tabCount: tabDirs.length,
                        created: stat.mtime.toISOString()
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
            tempStats.count = tempFiles.length
            for (const f of tempFiles) {
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
                tabList: api.getConfig('tabList') || [{ name: 'General', publicNote: false }],
                spamDelay: SPAM_DELAY, storageWarning: MAX_STORAGE_WARNING,
                backupInterval: api.getConfig('backupInterval'),
                backupRetentionDays: api.getConfig('backupRetentionDays'),
                autoExportTxt: api.getConfig('autoExportTxt'),
                maxImgSize: formatBytes(MAX_IMG_SIZE),
                maxFileSize: formatBytes(MAX_FILE_SIZE),
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
            config: { tabList: api.getConfig('tabList') || [{ name: 'General', publicNote: false }] }, 
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
        
        try {
            const result = await createBackup()
            await cleanupOldBackups()
            
            let txtFiles = []
            if (api.getConfig('autoExportTxt')) {
                txtFiles = await exportTxtFiles()
            }
            
            ctx.body = { 
                ok: true, 
                backupFolder: result.backupFolder,
                fileCount: result.backedUpCount,
                txtFiles: txtFiles.map(f => ({
                    name: path.basename(f),
                    path: f
                }))
            }
        } catch {
            ctx.status = 500; ctx.body = { error: 'Backup failed' }
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
            const txtFiles = await exportTxtFiles()
            ctx.body = { 
                ok: true, 
                count: txtFiles.length,
                files: txtFiles.map(f => ({
                    name: path.basename(f),
                    path: f,
                    tab: path.basename(path.dirname(f))
                }))
            }
        } catch {
            ctx.status = 500; ctx.body = { error: 'TXT export failed' }
        }
    }
    
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
        const maxSize = isImage ? MAX_IMG_SIZE : MAX_FILE_SIZE
        if (fileBuffer.length > maxSize) {
            ctx.status = 400; ctx.body = { error: `File too large (max ${formatBytes(maxSize)})` }; return
        }

        await ensureDir(TEMP_DIR)
        // 生成带时间前缀的文件名
        const fileId = generateFileId(originalName)
        const filePath = path.join(TEMP_DIR, fileId)
        
        await fs.writeFile(filePath, fileBuffer)
        
        // 保存原始文件名映射（用于下载时还原）
        // 使用全局映射或 temp 目录下的映射文件
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
            originalName: originalName  // 返回原始名称给前端
        }
        ctx.status = 200
    } catch (e) {
        ctx.status = 500; ctx.body = { error: 'Upload failed: ' + e.message }
    }
}
    
    async function serveTempFile(ctx) {
        const params = ctx.params || {}
        const fileId = params.fileId
        
        if (!fileId) { ctx.status = 404; return }
        
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
        const imageId = params.imageId
        
        if (!tab || !imageId) { ctx.status = 404; return }
        
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
        const thumbId = params.thumbId
        
        if (!tab || !thumbId) { ctx.status = 404; return }
        
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
        const fileId = params.fileId
        if (!tab || !fileId) { ctx.status = 404; return }
        
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
        const fileId = params.fileId
        if (!tab || !fileId) { ctx.status = 404; return }
        
        let filePath = path.join(getTabAttDir(tab), fileId)
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
            const originalName = await getFileName(tab, 'att', fileId).catch(() => fileId)
            
            ctx.type = 'application/octet-stream'
            ctx.set('Cache-Control', 'no-cache')
            ctx.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(originalName)}`)
            ctx.body = await fs.readFile(filePath)
            ctx.status = 200
        } catch { ctx.status = 404 }
    }
    
    return {
        async middleware(ctx) {
            const p = ctx.path
            const method = ctx.method.toUpperCase()
            
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
            if (p === `${API_BASE}toggle-star` && method === 'POST') { await toggleStar(ctx); return }
            if (p === `${API_BASE}toggle-collapse` && method === 'POST') { await toggleCollapse(ctx); return }
            if (p === `${API_BASE}delete` && method === 'POST') { await deleteNote(ctx); return }
            if (p === `${API_BASE}reorder-tabs` && method === 'POST') { await reorderTabs(ctx); return }
            if (p === `${API_BASE}rename-tab` && method === 'POST') { await renameTab(ctx); return }
            if (p === `${API_BASE}upload` && method === 'POST') { await uploadFileToTemp(ctx); return }
            
            if (p === `${ADMIN_API}overview` && method === 'GET') { await adminOverview(ctx); return }
            if (p === `${ADMIN_API}export` && method === 'GET') { await adminExport(ctx); return }
            if (p === `${ADMIN_API}import` && method === 'POST') { await adminImport(ctx); return }
            if (p === `${ADMIN_API}backup` && method === 'POST') { await adminBackup(ctx); return }
            if (p === `${ADMIN_API}clear` && method === 'POST') { await adminClearTab(ctx); return }
            if (p === `${ADMIN_API}export-txt` && method === 'POST') { await adminExportTxt(ctx); return }
        }
    }
}