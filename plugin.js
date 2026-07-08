exports.version = 2.2
exports.description = "A lightweight, convenient note-taking tool built into HFS with multi-tab support, real-time sync, auto-backup, pagination, and TXT export."
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
        helperText: 'When enabled, automatically export notes as TXT files (timestamp + content only) alongside each backup. Same filename will be overwritten.',
        defaultValue: true,
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
        label: 'Video thumbnail time position',
        helperText: 'Time position for video thumbnail extraction (HH:MM:SS)',
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
    const IMG_BASE_DIR = path.join(storage, 'img')
    const MOV_BASE_DIR = path.join(storage, 'mov')
    const ATT_BASE_DIR = path.join(storage, 'att')
    const THUMB_BASE_DIR = path.join(storage, 'thumb')
    const BACKUP_DIR = path.join(storage, 'backup')

    const MAX_NOTE_LEN = 2000
    const RETAIN_NOTES = 500
    const SPAM_DELAY = 200
    const MAX_STORAGE_WARNING = 400
    const AUTO_COLLAPSE_LINES = 100
    const MAX_IMG_SIZE = 40 * 1024 * 1024
    const MAX_FILE_SIZE = 100 * 1024 * 1024
    const TEMP_IMG_TTL = 60 * 60 * 1000
    const THUMB_PIXELS = 800
    const THUMB_QUALITY = 85
    const THUMB_MIN_SIZE = 100 * 1024
    const PAGE_SIZE = 30

    const dbs = new Map()
    let backupTimer = null
    let exportTimer = null
    let tempCleanupTimer = null
    
    const throttleDb = api.openDb('notes_throttle', { rewriteLater: true })
    
    await fs.mkdir(IMG_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(MOV_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(ATT_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(THUMB_BASE_DIR, { recursive: true }).catch(() => {})
    await fs.mkdir(BACKUP_DIR, { recursive: true }).catch(() => {})
    
    function getTabPublicConfig(tab) {
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
    
    function getDb(tab) {
        if (!dbs.has(tab)) {
            const db = api.openDb(`notes_${tab}`, { rewriteLater: true })
            dbs.set(tab, db)
        }
        return dbs.get(tab)
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
        return `${y}${m}${d}_${h}${min}`
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
        const ext = path.extname(originalName) || '.jpg'
        return `${dateStr}_${rand}${ext}`
    }

    function getTabImgDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(IMG_BASE_DIR, safeTab)
    }

    function getTempDir(tab) {
        return path.join(getTabImgDir(tab), 'temp')
    }

    function getTabThumbDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(THUMB_BASE_DIR, safeTab)
    }

    function getTabMovDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(MOV_BASE_DIR, safeTab)
    }

    function getTabAttDir(tab) {
        const safeTab = tab.replace(/[\\/:*?"<>|]/g, '_')
        return path.join(ATT_BASE_DIR, safeTab)
    }

    function getNameMapPath(tab, type) {
        const dir = type === 'mov' ? getTabMovDir(tab) : getTabAttDir(tab)
        return path.join(dir, '.filenames')
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
            return nameMap[fileId] || fileId
        } catch {
            return fileId
        }
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
        await fs.mkdir(dir, { recursive: true }).catch(() => {})
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

    async function extractVideoThumbnail(videoPath, tab, fileId) {
        try {
            const ffmpegPath = api.getConfig('ffmpeg_path') || 'ffmpeg'
            const thumbTimeConfig = api.getConfig('thumbnail_time') || '00:00:05'
            
            let timeInSeconds
            if (thumbTimeConfig.includes(':')) {
                timeInSeconds = parseTimeToSeconds(thumbTimeConfig)
            } else {
                timeInSeconds = parseInt(thumbTimeConfig) || 5
            }
            
            const thumbDir = await ensureDir(getTabThumbDir(tab))
            const ext = path.extname(fileId)
            const baseName = path.basename(fileId, ext)
            const thumbId = baseName + '.jpg'
            const thumbPath = path.join(thumbDir, thumbId)
            
            try {
                await fs.stat(thumbPath)
                return true
            } catch {}
            
            return new Promise(resolve => {
                const ffmpeg = spawn(ffmpegPath, [
                    '-ss', formatTimeFromSeconds(timeInSeconds),
                    '-i', videoPath,
                    '-vframes', '1',
                    '-q:v', '2',
                    '-f', 'image2',
                    '-y', thumbPath
                ])
                
                ffmpeg.on('exit', code => {
                    if (code === 0) {
                        resolve(true)
                    } else {
                        fs.unlink(thumbPath).catch(() => {})
                        resolve(false)
                    }
                })
                
                ffmpeg.on('error', err => {
                    fs.unlink(thumbPath).catch(() => {})
                    resolve(false)
                })
            })
        } catch (e) {
            return false
        }
    }

    async function deleteVideoThumbnail(tab, fileId) {
        try {
            const thumbDir = getTabThumbDir(tab)
            const ext = path.extname(fileId)
            const baseName = path.basename(fileId, ext)
            const thumbId = baseName + '.jpg'
            const thumbPath = path.join(thumbDir, thumbId)
            await fs.unlink(thumbPath).catch(() => {})
        } catch {}
    }

    async function generateThumbnail(imageBuffer, outputPath) {
        try {
            const sharp = api.require('sharp')
            if (!sharp) return false
            
            const metadata = await sharp(imageBuffer).metadata()
            if (metadata.format === 'gif') return false
            
            if (imageBuffer.length < THUMB_MIN_SIZE) return false
            
            await sharp(imageBuffer)
                .resize(THUMB_PIXELS, THUMB_PIXELS, { fit: 'inside', withoutEnlargement: true })
                .rotate()
                .jpeg({ quality: THUMB_QUALITY })
                .toFile(outputPath)
            return true
        } catch (e) {
            return false
        }
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
        }
        
        return false
    }

    async function promoteImages(tab, imageIds) {
        const imgDir = getTabImgDir(tab)
        const tempDir = getTempDir(tab)
        const thumbDir = await ensureDir(getTabThumbDir(tab))
        const promoted = []
        
        for (const id of imageIds) {
            const tempPath = path.join(tempDir, id)
            const finalPath = path.join(imgDir, id)
            const thumbPath = path.join(thumbDir, id)
            try {
                await fs.stat(tempPath)
                const imgBuffer = await fs.readFile(tempPath)
                await generateThumbnail(imgBuffer, thumbPath)
                await fs.rename(tempPath, finalPath)
                promoted.push(id)
            } catch {
            }
        }
        return promoted
    }

    async function cleanupTempImages() {
        try {
            const cutoff = Date.now() - TEMP_IMG_TTL
            const tabDirs = await fs.readdir(IMG_BASE_DIR).catch(() => [])
            
            for (const dirName of tabDirs) {
                const tempDir = path.join(IMG_BASE_DIR, dirName, 'temp')
                try {
                    const files = await fs.readdir(tempDir)
                    for (const file of files) {
                        const filePath = path.join(tempDir, file)
                        try {
                            const stat = await fs.stat(filePath)
                            if (stat.mtimeMs < cutoff) {
                                await fs.unlink(filePath)
                            }
                        } catch {}
                    }
                    const remaining = await fs.readdir(tempDir).catch(() => [])
                    if (remaining.length === 0) {
                        await fs.rmdir(tempDir).catch(() => {})
                    }
                } catch {}
            }
        } catch {}
    }

    async function createBackup() {
        const tabs = getTabs()
        const backupFiles = []
        
        for (const tab of tabs) {
            const dbName = `notes_${tab}`
            const sourcePath = path.join(storage, dbName + '.json')
            
            try {
                await fs.stat(sourcePath)
            } catch {
                continue
            }
            
            const timestamp = getTimestamp()
            const backupFileName = `${dbName}_backup_${timestamp}.json`
            const backupPath = path.join(BACKUP_DIR, backupFileName)
            
            try {
                const data = await fs.readFile(sourcePath)
                await fs.writeFile(backupPath, data)
                backupFiles.push(backupPath)
            } catch (e) {
            }
        }
        
        return backupFiles
    }

    async function exportTxtFiles() {
        const autoExport = api.getConfig('autoExportTxt')
        if (!autoExport) return []
        
        const tabs = getTabs()
        const exportFiles = []
        
        for (const tab of tabs) {
            const db = await getDb(tab)
            const notes = await db.asObject()
            const keys = Object.keys(notes).sort()
            
            if (keys.length === 0) continue
            
            let txtContent = ''
            for (const ts of keys) {
                const note = notes[ts]
                if (note && note.m) {
                    const dateStr = new Date(ts).toLocaleString()
                    txtContent += `[${dateStr}]\n${note.m}\n\n`
                }
            }
            
            const safeTabName = tab.replace(/[\\/:*?"<>|]/g, '_')
            const exportFile = path.join(storage, `notes_export_${safeTabName}.txt`)
            await fs.writeFile(exportFile, txtContent.trim() + '\n', 'utf-8')
            exportFiles.push(exportFile)
        }
        
        return exportFiles
    }

    async function cleanupOldBackups() {
        try {
            const retentionDays = api.getConfig('backupRetentionDays') || 3
            const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
            
            const files = await fs.readdir(BACKUP_DIR).catch(() => [])
            const backupFiles = files.filter(f => f.includes('_backup_') && f.endsWith('.json'))
            
            for (const f of backupFiles) {
                try {
                    const stat = await fs.stat(path.join(BACKUP_DIR, f))
                    if (stat.mtime.getTime() < cutoffTime) {
                        await fs.unlink(path.join(BACKUP_DIR, f))
                    }
                } catch {}
            }
        } catch {}
    }

    function setupBackupTimer() {
        const interval = api.getConfig('backupInterval') || 6
        
        if (backupTimer) {
            clearInterval(backupTimer)
            backupTimer = null
        }
        if (exportTimer) {
            clearInterval(exportTimer)
            exportTimer = null
        }
        if (tempCleanupTimer) {
            clearInterval(tempCleanupTimer)
            tempCleanupTimer = null
        }
        
        if (interval <= 0) return
        
        const intervalMs = interval * 60 * 60 * 1000
        
        backupTimer = setInterval(async () => {
            await createBackup()
            await cleanupOldBackups()
        }, intervalMs)
        
        exportTimer = setInterval(async () => {
            await exportTxtFiles()
        }, intervalMs)
        
        tempCleanupTimer = setInterval(async () => {
            await cleanupTempImages()
        }, 60 * 60 * 1000)
    }

    setupBackupTimer()
    setTimeout(async () => {
        await createBackup()
        await cleanupOldBackups()
        await exportTxtFiles()
        await cleanupTempImages()
    }, 5000)

    api.subscribeConfig(['backupInterval', 'backupRetentionDays', 'tabList', 'autoExportTxt'], () => {
        setupBackupTimer()
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
    })

    const TABS_DATA_FILE = path.join(storage, 'notes_tabs_order.json')
    
    async function getTabsData() {
        try {
            const data = await fs.readFile(TABS_DATA_FILE, 'utf-8')
            const saved = JSON.parse(data)
            const currentTabs = getTabs()
            
            let order, names
            if (Array.isArray(saved)) {
                order = saved
                names = {}
            } else {
                order = saved.order || []
                names = saved.names || {}
            }
            
            let valid = order.filter(t => currentTabs.includes(t))
            for (const t of currentTabs) {
                if (!valid.includes(t)) valid.push(t)
            }
            
            const cleanedNames = {}
            for (const [key, value] of Object.entries(names)) {
                if (currentTabs.includes(key)) {
                    cleanedNames[key] = value
                }
            }
            
            if (valid.length !== order.length || 
                valid.some((t, i) => t !== order[i]) ||
                Object.keys(cleanedNames).length !== Object.keys(names).length) {
                await saveTabsData(valid, cleanedNames)
            }
            
            return { order: valid, names: cleanedNames }
        } catch {
            const tabs = getTabs()
            await saveTabsData(tabs, {})
            return { order: tabs, names: {} }
        }
    }
    
    async function saveTabsData(order, names = {}) {
        await fs.writeFile(TABS_DATA_FILE, JSON.stringify({ order, names }, null, 2))
    }

    async function getTabInfo(ctx) {
        const username = getCurrentUsername(ctx)
        const tabsData = await getTabsData()
        let tabs = tabsData.order.length > 0 ? tabsData.order : getTabs()

        if (!username) {
            const pubTabs = getPublicTabs()
            tabs = tabs.filter(t => pubTabs.includes(t))
            const result = {}
            for (const tab of tabs) {
                const db = await getDb(tab)
                result[tab] = db.size()
            }
            ctx.body = { 
                tabs, 
                counts: result, 
                warning: Object.values(result).reduce((a, b) => a + b, 0) >= MAX_STORAGE_WARNING,
                tabNames: tabsData.names,
                maxRetain: RETAIN_NOTES,
                isGuest: true
            }
            ctx.status = 200
            return
        }

        if (!isAllowed(username)) { ctx.status = 403; return }

        const result = {}
        for (const tab of tabs) {
            const db = await getDb(tab)
            result[tab] = db.size()
        }
        ctx.body = { 
            tabs, 
            counts: result, 
            warning: Object.values(result).reduce((a, b) => a + b, 0) >= MAX_STORAGE_WARNING,
            tabNames: tabsData.names,
            maxRetain: RETAIN_NOTES,
            isGuest: false
        }
        ctx.status = 200
    }

    async function renameTab(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        let body = ctx.state.params || ctx.request?.body || {}
        const { tab, newName } = body
        
        if (!tab || newName === undefined) {
            ctx.status = 400; return
        }
        
        const tabsData = await getTabsData()
        if (newName.trim() === '') {
            delete tabsData.names[tab]
        } else {
            tabsData.names[tab] = newName.trim()
        }
        
        await saveTabsData(tabsData.order, tabsData.names)
        api.notifyClient('notes', 'tabRenamed', { tab, newName: newName.trim() || tab })
        ctx.body = { ok: true, tab, newName: newName.trim() || tab }
        ctx.status = 200
    }

    async function listNotes(ctx) {
        const username = getCurrentUsername(ctx)
        const tab = ctx.query?.tab
        if (!tab) { ctx.status = 400; return }
        if (!isAllowed(username, tab)) { ctx.status = 403; return }
        
        const offset = parseInt(ctx.query?.offset) || 0
        const limit = Math.min(parseInt(ctx.query?.limit) || PAGE_SIZE, 100)
        
        const db = await getDb(tab)
        const notes = await db.asObject()
        // Sort chronologically ascending (oldest first)
        const allKeys = Object.keys(notes).sort()
        const totalCount = allKeys.length
        
        // offset=0 means the most recent entries
        // We slice from (totalCount - offset - limit) to (totalCount - offset)
        const endIdx = totalCount - offset
        const startIdx = Math.max(0, endIdx - limit)
        const pageKeys = allKeys.slice(startIdx, endIdx)
        
        // Build pageNotes preserving chronological order (oldest first in the page)
        const pageNotes = {}
        for (const k of pageKeys) {
            pageNotes[k] = notes[k]
        }
        
        const hasMoreData = startIdx > 0
        
        const imageIds = new Set()
        const movIds = new Set()
        for (const note of Object.values(pageNotes)) {
            if (note.m) {
                for (const id of extractImageIds(note.m)) imageIds.add(id)
                for (const id of extractMovIds(note.m)) movIds.add(id)
            }
        }
        
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
            maxRetain: RETAIN_NOTES,
            thumbMap,
            fileNames,
            hasMore: hasMoreData,
            offset: offset,
            limit: limit
        }
        ctx.status = 200
    }

    async function addNote(ctx) {
        const username = getCurrentUsername(ctx) || 'Guest'
        
        let body = ctx.state.params || ctx.request?.body || {}
        
        const m = body.m
        const tab = body.tab
        const forceCollapsed = body.collapsed === true
        
        if (!m || typeof m !== 'string' || m.length > MAX_NOTE_LEN) {
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
        
        const db = await getDb(tab)
        
        if (db.size() >= RETAIN_NOTES) {
            ctx.status = 400
            ctx.body = { error: 'Storage full', message: 'Tab has reached maximum notes limit. Please delete some notes before adding new ones.', count: db.size(), maxRetain: RETAIN_NOTES }
            return
        }
        
        const ts = new Date().toISOString()
        
        const lineCount = m.split('\n').length
        const autoCollapsed = forceCollapsed || lineCount > AUTO_COLLAPSE_LINES
        
        if (username && username !== 'Guest') {
            const imageIds = extractImageIds(m)
            await promoteImages(tab, imageIds)
            
            const movIds = extractMovIds(m)
            if (movIds.length > 0) {
                const movDir = getTabMovDir(tab)
                for (const movId of movIds) {
                    const videoPath = path.join(movDir, movId)
                    try {
                        await fs.stat(videoPath)
                        extractVideoThumbnail(videoPath, tab, movId).catch(() => {})
                    } catch {}
                }
            }
        }
        
        db.put(ts, { m, u: username, starred: false, collapsed: autoCollapsed })
        const count = db.size()
        
        api.notifyClient('notes', 'newNote', { ts, u: username, m, tab, starred: false, collapsed: autoCollapsed })
        
        ctx.status = 201
        ctx.body = { count, warning: count >= MAX_STORAGE_WARNING, maxRetain: RETAIN_NOTES }
        
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
    }

    async function updateNote(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        let body = ctx.state.params || ctx.request?.body || {}
        
        const { ts, tab, m } = body
        
        if (!ts || !tab || !m || typeof m !== 'string' || m.length > MAX_NOTE_LEN) {
            ctx.status = 400; return
        }
        
        const db = await getDb(tab)
        const note = await db.get(ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }
        
        const oldImgIds = extractImageIds(note.m)
        const newImgIds = extractImageIds(m)
        const removedImgIds = oldImgIds.filter(id => !newImgIds.includes(id))
        const imgDir = getTabImgDir(tab)
        const thumbDir = getTabThumbDir(tab)
        for (const id of removedImgIds) {
            await fs.unlink(path.join(imgDir, id)).catch(() => {})
            await fs.unlink(path.join(thumbDir, id)).catch(() => {})
        }
        
        const oldMovIds = extractMovIds(note.m)
        const newMovIds = extractMovIds(m)
        const removedMovIds = oldMovIds.filter(id => !newMovIds.includes(id))
        const movDir = getTabMovDir(tab)
        for (const id of removedMovIds) {
            await fs.unlink(path.join(movDir, id)).catch(() => {})
            await deleteVideoThumbnail(tab, id)
        }
        await cleanFileNameMapping(tab, 'mov', removedMovIds)
        
        const oldAttIds = extractAttIds(note.m)
        const newAttIds = extractAttIds(m)
        const removedAttIds = oldAttIds.filter(id => !newAttIds.includes(id))
        const attDir = getTabAttDir(tab)
        for (const id of removedAttIds) {
            await fs.unlink(path.join(attDir, id)).catch(() => {})
        }
        await cleanFileNameMapping(tab, 'att', removedAttIds)
        
        await promoteImages(tab, newImgIds)
        
        for (const movId of newMovIds) {
            if (!oldMovIds.includes(movId)) {
                const videoPath = path.join(movDir, movId)
                try {
                    await fs.stat(videoPath)
                    extractVideoThumbnail(videoPath, tab, movId).catch(() => {})
                } catch {}
            }
        }
        
        db.put(ts, { m, u: note.u, starred: note.starred || false, collapsed: note.collapsed || false })
        api.notifyClient('notes', 'updateNote', { ts, tab, m, starred: note.starred || false, collapsed: note.collapsed || false })
        ctx.status = 200
        
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
    }

    async function toggleStar(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        let body = ctx.state.params || ctx.request?.body || {}
        
        const { ts, tab } = body
        
        if (!ts || !tab) { ctx.status = 400; return }
        
        const db = await getDb(tab)
        const note = await db.get(ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }
        
        const newStarred = !(note.starred || false)
        db.put(ts, { m: note.m, u: note.u, starred: newStarred, collapsed: note.collapsed || false })
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
        
        const db = await getDb(tab)
        const note = await db.get(ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }
        
        const newCollapsed = !(note.collapsed || false)
        db.put(ts, { m: note.m, u: note.u, starred: note.starred || false, collapsed: newCollapsed })
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
        
        const db = await getDb(tab)
        const note = await db.get(ts)
        if (!note) { ctx.status = 404; return }
        if (username !== 'admin' && note.u !== username) { ctx.status = 403; return }
        
        if (note.m) {
            const imgIds = extractImageIds(note.m)
            const imgDir = getTabImgDir(tab)
            const thumbDir = getTabThumbDir(tab)
            for (const id of imgIds) {
                await fs.unlink(path.join(imgDir, id)).catch(() => {})
                await fs.unlink(path.join(thumbDir, id)).catch(() => {})
            }
            
            const movIds = extractMovIds(note.m)
            const movDir = getTabMovDir(tab)
            for (const id of movIds) {
                await fs.unlink(path.join(movDir, id)).catch(() => {})
                await deleteVideoThumbnail(tab, id)
            }
            await cleanFileNameMapping(tab, 'mov', movIds)
            
            const attIds = extractAttIds(note.m)
            const attDir = getTabAttDir(tab)
            for (const id of attIds) {
                await fs.unlink(path.join(attDir, id)).catch(() => {})
            }
            await cleanFileNameMapping(tab, 'att', attIds)
        }
        
        db.del(ts)
        api.notifyClient('notes', 'deleteNote', { ts, tab })
        ctx.status = 200
        
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
    }

    async function reorderTabs(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        let body = ctx.state.params || ctx.request?.body || {}
        const { tabs: newOrder } = body
        if (!newOrder || !Array.isArray(newOrder)) {
            ctx.status = 400; return
        }
        
        const tabsData = await getTabsData()
        await saveTabsData(newOrder, tabsData.names)
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
            const db = await getDb(tab)
            const notes = await db.asObject()
            const keys = Object.keys(notes)
            const count = keys.length
            dbInfo[tab] = { count, firstNote: count > 0 ? keys[0] : null, lastNote: count > 0 ? keys[count - 1] : null }
            totalNotes += count
        }
        
        let backups = []
        let txtExports = []
        try {
            const backupFiles = await fs.readdir(BACKUP_DIR).catch(() => [])
            const jsonBackups = backupFiles.filter(f => f.includes('_backup_') && f.endsWith('.json'))
            backups = await Promise.all(
                jsonBackups.map(async f => {
                    const stat = await fs.stat(path.join(BACKUP_DIR, f))
                    const nameWithoutExt = f.replace('.json', '')
                    const parts = nameWithoutExt.split('_backup_')
                    const tabName = parts[0] ? parts[0].replace('notes_', '') : ''
                    const timestamp = parts[1] || ''
                    
                    return { 
                        name: f, 
                        tab: tabName,
                        size: stat.size, 
                        sizeReadable: formatBytes(stat.size), 
                        created: stat.mtime.toISOString(), 
                        timestamp: timestamp
                    }
                })
            )
            backups.sort((a, b) => b.created.localeCompare(a.created))
            
            const storageFiles = await fs.readdir(storage).catch(() => [])
            const txtFiles = storageFiles.filter(f => f.startsWith('notes_export_') && f.endsWith('.txt'))
            txtExports = await Promise.all(
                txtFiles.map(async f => {
                    const stat = await fs.stat(path.join(storage, f))
                    const tabName = f.replace('notes_export_', '').replace('.txt', '')
                    return {
                        name: f,
                        tab: tabName,
                        size: stat.size,
                        sizeReadable: formatBytes(stat.size),
                        modified: stat.mtime.toISOString()
                    }
                })
            )
        } catch {}
        
        let imgStats = { count: 0, totalSize: 0, tabs: {}, tempCount: 0 }
        try {
            const tabDirs = await fs.readdir(IMG_BASE_DIR).catch(() => [])
            for (const dirName of tabDirs) {
                const dirPath = path.join(IMG_BASE_DIR, dirName)
                const stat = await fs.stat(dirPath).catch(() => null)
                if (!stat || !stat.isDirectory()) continue
                const files = await fs.readdir(dirPath).catch(() => [])
                const realFiles = files.filter(f => f !== 'temp')
                imgStats.tabs[dirName] = realFiles.length
                imgStats.count += realFiles.length
                for (const f of realFiles) {
                    try {
                        const fstat = await fs.stat(path.join(dirPath, f))
                        imgStats.totalSize += fstat.size
                    } catch {}
                }
                const tempDir = path.join(dirPath, 'temp')
                try {
                    const tempFiles = await fs.readdir(tempDir)
                    imgStats.tempCount += tempFiles.length
                } catch {}
            }
        } catch {}
        
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
                maxNoteLen: MAX_NOTE_LEN, retainNotes: RETAIN_NOTES,
                spamDelay: SPAM_DELAY, storageWarning: MAX_STORAGE_WARNING,
                backupInterval: api.getConfig('backupInterval'),
                backupRetentionDays: api.getConfig('backupRetentionDays'),
                autoExportTxt: api.getConfig('autoExportTxt'),
                maxImgSize: formatBytes(MAX_IMG_SIZE),
                maxFileSize: formatBytes(MAX_FILE_SIZE),
                ffmpegPath: api.getConfig('ffmpeg_path') || 'ffmpeg',
                thumbnailTime: api.getConfig('thumbnail_time') || '00:00:05',
                pageSize: PAGE_SIZE
            },
            databases: dbInfo, totalNotes,
            storageWarning: totalNotes >= MAX_STORAGE_WARNING, backups,
            txtExports,
            imgStats: {
                ...imgStats,
                sizeReadable: formatBytes(imgStats.totalSize)
            },
            thumbStats: {
                ...thumbStats,
                sizeReadable: formatBytes(thumbStats.totalSize)
            },
            movStats: {
                ...movStats,
                sizeReadable: formatBytes(movStats.totalSize)
            },
            attStats: {
                ...attStats,
                sizeReadable: formatBytes(attStats.totalSize)
            }
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
            config: { tabList: api.getConfig('tabList') || [{ name: 'General', publicNote: false }] }, data: {}
        }
        
        const tabsToExport = tab ? [tab] : tabs
        for (const t of tabsToExport) {
            if (!tabs.includes(t)) continue
            const db = await getDb(t)
            exportData.data[t] = await db.asObject()
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
            const db = await getDb(tab)
            for (const [ts, note] of Object.entries(notes)) {
                if (note.m && note.u) {
                    db.put(ts, { m: note.m, u: note.u, starred: note.starred || false, collapsed: note.collapsed || false })
                    imported++
                }
            }
        }
        
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
        
        ctx.body = { ok: true, imported, tabs: Object.keys(body.data) }
        ctx.status = 200
    }

    async function adminBackup(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        try {
            const backupFiles = await createBackup()
            await cleanupOldBackups()
            
            let txtFiles = []
            if (api.getConfig('autoExportTxt')) {
                txtFiles = await exportTxtFiles()
            }
            
            ctx.body = { 
                ok: true, 
                files: backupFiles.map(f => ({
                    name: path.basename(f),
                    path: f
                })),
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
        
        const db = await getDb(tab)
        const notes = await db.asObject()
        const imgDir = getTabImgDir(tab)
        const tempDir = getTempDir(tab)
        const thumbDir = getTabThumbDir(tab)
        const movDir = getTabMovDir(tab)
        const attDir = getTabAttDir(tab)
        
        for (const note of Object.values(notes)) {
            if (note.m) {
                const imgIds = extractImageIds(note.m)
                for (const id of imgIds) {
                    await fs.unlink(path.join(imgDir, id)).catch(() => {})
                    await fs.unlink(path.join(thumbDir, id)).catch(() => {})
                }
                
                const movIds = extractMovIds(note.m)
                for (const id of movIds) {
                    await fs.unlink(path.join(movDir, id)).catch(() => {})
                    await deleteVideoThumbnail(tab, id)
                }
                
                const attIds = extractAttIds(note.m)
                for (const id of attIds) {
                    await fs.unlink(path.join(attDir, id)).catch(() => {})
                }
            }
        }
        
        try {
            const tempFiles = await fs.readdir(tempDir)
            for (const f of tempFiles) await fs.unlink(path.join(tempDir, f)).catch(() => {})
            await fs.rmdir(tempDir).catch(() => {})
        } catch {}
        
        try {
            const thumbFiles = await fs.readdir(thumbDir).catch(() => [])
            for (const f of thumbFiles) await fs.unlink(path.join(thumbDir, f)).catch(() => {})
        } catch {}
        
        try {
            const movFiles = await fs.readdir(movDir).catch(() => [])
            for (const f of movFiles) await fs.unlink(path.join(movDir, f)).catch(() => {})
            await fs.unlink(path.join(movDir, '.filenames')).catch(() => {})
        } catch {}
        
        try {
            const attFiles = await fs.readdir(attDir).catch(() => [])
            for (const f of attFiles) await fs.unlink(path.join(attDir, f)).catch(() => {})
            await fs.unlink(path.join(attDir, '.filenames')).catch(() => {})
        } catch {}
        
        const count = db.size()
        db.clear()
        
        api.notifyClient('notes', 'tabCleared', { tab })
        
        if (api.getConfig('autoExportTxt')) {
            exportTxtFiles().catch(() => {})
        }
        
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
                files: txtFiles.map(f => ({
                    name: path.basename(f),
                    path: f
                }))
            }
        } catch {
            ctx.status = 500; ctx.body = { error: 'TXT export failed' }
        }
    }
    
    async function uploadImage(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }
        
        try {
            const body = ctx.request?.body || ctx.state?.params || {}
            
            if (!body.data) {
                ctx.status = 400
                ctx.body = { error: 'No image data provided' }
                return
            }
            
            const tab = body.tab
            if (!tab) {
                ctx.status = 400
                ctx.body = { error: 'Tab name required' }
                return
            }
            
            const matches = body.data.match(/^data:image\/(\w+);base64,(.+)$/)
            if (!matches) {
                ctx.status = 400
                ctx.body = { error: 'Invalid base64 format' }
                return
            }
            
            const fileBuffer = Buffer.from(matches[2], 'base64')
            const originalName = body.name || `image.${matches[1]}`
            
            if (fileBuffer.length === 0) {
                ctx.status = 400
                ctx.body = { error: 'Empty file' }
                return
            }
            
            if (fileBuffer.length > MAX_IMG_SIZE) {
                ctx.status = 400
                ctx.body = { error: `File too large (max ${formatBytes(MAX_IMG_SIZE)})` }
                return
            }
            
            const tempDir = await ensureDir(getTempDir(tab))
            const imageId = generateFileId(originalName)
            const filePath = path.join(tempDir, imageId)
            
            await fs.writeFile(filePath, fileBuffer)
            
            const thumbDir = await ensureDir(getTabThumbDir(tab))
            const thumbPath = path.join(thumbDir, imageId)
            const hasThumb = await generateThumbnail(fileBuffer, thumbPath)
            
            ctx.body = { 
                ok: true, 
                imageId,
                url: `/~/notes/img/temp/${tab}/${imageId}`,
                hasThumb: hasThumb
            }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500
            ctx.body = { error: 'Upload failed: ' + e.message }
        }
    }
    
    async function uploadFile(ctx) {
        const username = getCurrentUsername(ctx)
        if (!username || !isAllowed(username)) { ctx.status = 403; return }

        try {
            const body = ctx.request?.body || ctx.state?.params || {}
            if (!body.data) { ctx.status = 400; ctx.body = { error: 'No file data' }; return }

            const tab = body.tab
            if (!tab) { ctx.status = 400; ctx.body = { error: 'Tab name required' }; return }

            const matches = body.data.match(/^data:(.+);base64,(.+)$/)
            if (!matches) { ctx.status = 400; ctx.body = { error: 'Invalid base64 format' }; return }

            const mimeType = matches[1]
            const fileBuffer = Buffer.from(matches[2], 'base64')
            const originalName = body.name || 'file'

            if (fileBuffer.length === 0) { ctx.status = 400; ctx.body = { error: 'Empty file' }; return }
            if (fileBuffer.length > MAX_FILE_SIZE) {
                ctx.status = 400; ctx.body = { error: `File too large (max ${formatBytes(MAX_FILE_SIZE)})` }; return
            }

            const isVideo = mimeType.startsWith('video/')
            const isAudio = mimeType.startsWith('audio/')
            const isMedia = isVideo || isAudio

            if (isMedia) {
                const movDir = await ensureDir(getTabMovDir(tab))
                const fileId = generateFileId(originalName)
                const filePath = path.join(movDir, fileId)
                await fs.writeFile(filePath, fileBuffer)
                await saveFileName(tab, 'mov', fileId, originalName)
                
                let hasVideoThumb = false
                if (isVideo) {
                    hasVideoThumb = await extractVideoThumbnail(filePath, tab, fileId)
                }
                
                ctx.body = { 
                    ok: true, 
                    isVideo: isVideo, 
                    isAudio: isAudio, 
                    fileId, 
                    url: `/~/notes/mov/${tab}/${fileId}`, 
                    name: originalName,
                    hasVideoThumb: hasVideoThumb
                }
            } else {
                const attDir = await ensureDir(getTabAttDir(tab))
                const fileId = generateFileId(originalName)
                const filePath = path.join(attDir, fileId)
                await fs.writeFile(filePath, fileBuffer)
                await saveFileName(tab, 'att', fileId, originalName)
                ctx.body = { 
                    ok: true, 
                    isOther: true, 
                    fileId, 
                    url: `/~/notes/att/${tab}/${fileId}`, 
                    name: originalName 
                }
            }
            ctx.status = 200
        } catch (e) {
            ctx.status = 500; ctx.body = { error: 'Upload failed: ' + e.message }
        }
    }
    
    async function serveImage(ctx) {
        const tab = ctx.params?.tab
        const imageId = ctx.params?.imageId
        const isTemp = ctx.params?.isTemp === 'temp'
        
        if (!tab || !imageId) { ctx.status = 404; return }
        
        let filePath
        
        if (isTemp) {
            filePath = path.join(getTempDir(tab), imageId)
        } else {
            filePath = path.join(getTabImgDir(tab), imageId)
            try {
                await fs.stat(filePath)
            } catch {
                filePath = path.join(getTempDir(tab), imageId)
            }
        }
        
        try {
            await fs.stat(filePath)
            const ext = path.extname(imageId).slice(1).toLowerCase()
            const mimeTypes = {
                'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
                'png': 'image/png', 'gif': 'image/gif',
                'webp': 'image/webp', 'bmp': 'image/bmp',
                'svg': 'image/svg+xml'
            }
            ctx.type = mimeTypes[ext] || 'application/octet-stream'
            ctx.set('Cache-Control', 'no-cache')
            ctx.body = await fs.readFile(filePath)
            ctx.status = 200
        } catch {
            ctx.status = 404
        }
    }
    
    async function serveThumb(ctx) {
        const tab = ctx.params?.tab
        const thumbId = ctx.params?.thumbId
        
        if (!tab || !thumbId) { ctx.status = 404; return }
        
        const thumbPath = path.join(getTabThumbDir(tab), thumbId)
        
        try {
            await fs.stat(thumbPath)
            ctx.type = 'image/jpeg'
            ctx.set('Cache-Control', 'public, max-age=3600')
            ctx.body = await fs.readFile(thumbPath)
            ctx.status = 200
        } catch {
            ctx.status = 404
        }
    }
    
    async function serveMov(ctx) {
        const tab = ctx.params?.tab
        const fileId = ctx.params?.fileId
        if (!tab || !fileId) { ctx.status = 404; return }
        const filePath = path.join(getTabMovDir(tab), fileId)
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
            
            const originalName = await getFileName(tab, 'mov', fileId)
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
            
            ctx.set('Cache-Control', 'no-cache')
        } catch { ctx.status = 404 }
    }

    async function serveAtt(ctx) {
        const tab = ctx.params?.tab
        const fileId = ctx.params?.fileId
        if (!tab || !fileId) { ctx.status = 404; return }
        const filePath = path.join(getTabAttDir(tab), fileId)
        try {
            await fs.stat(filePath)
            
            const originalName = await getFileName(tab, 'att', fileId)
            
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
            
            if (p.startsWith('/~/notes/thumb/')) {
                const parts = p.replace('/~/notes/thumb/', '').split('/')
                if (parts.length >= 2) {
                    ctx.params = { tab: parts[0], thumbId: parts.slice(1).join('/') }
                    await serveThumb(ctx)
                } else { ctx.status = 404 }
                return
            }
            
            if (p.startsWith('/~/notes/img/')) {
                const pathParts = p.replace('/~/notes/img/', '').split('/')
                if (pathParts[0] === 'temp' && pathParts.length >= 3) {
                    ctx.params = { isTemp: 'temp', tab: pathParts[1], imageId: pathParts.slice(2).join('/') }
                } else if (pathParts.length >= 2) {
                    ctx.params = { isTemp: 'false', tab: pathParts[0], imageId: pathParts.slice(1).join('/') }
                } else {
                    ctx.status = 404; return
                }
                await serveImage(ctx)
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
            if (p === `${API_BASE}tabs` && method === 'GET') { await getTabInfo(ctx); return }
            if (p === `${API_BASE}add` && method === 'POST') { await addNote(ctx); return }
            if (p === `${API_BASE}update` && method === 'POST') { await updateNote(ctx); return }
            if (p === `${API_BASE}toggle-star` && method === 'POST') { await toggleStar(ctx); return }
            if (p === `${API_BASE}toggle-collapse` && method === 'POST') { await toggleCollapse(ctx); return }
            if (p === `${API_BASE}delete` && method === 'POST') { await deleteNote(ctx); return }
            if (p === `${API_BASE}reorder-tabs` && method === 'POST') { await reorderTabs(ctx); return }
            if (p === `${API_BASE}rename-tab` && method === 'POST') { await renameTab(ctx); return }
            if (p === `${API_BASE}upload-image` && method === 'POST') { await uploadImage(ctx); return }
            if (p === `${API_BASE}upload-file` && method === 'POST') { await uploadFile(ctx); return }
            
            if (p === `${ADMIN_API}overview` && method === 'GET') { await adminOverview(ctx); return }
            if (p === `${ADMIN_API}export` && method === 'GET') { await adminExport(ctx); return }
            if (p === `${ADMIN_API}import` && method === 'POST') { await adminImport(ctx); return }
            if (p === `${ADMIN_API}backup` && method === 'POST') { await adminBackup(ctx); return }
            if (p === `${ADMIN_API}clear` && method === 'POST') { await adminClearTab(ctx); return }
            if (p === `${ADMIN_API}export-txt` && method === 'POST') { await adminExportTxt(ctx); return }
        }
    }
}