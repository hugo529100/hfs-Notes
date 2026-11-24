/* Notes 資料庫管理面板（獨立頁面，嵌入 HFS 外掛設定或直接開啟） */
(() => {
    'use strict'

    const API = '/~/api/notes/admin/'
    const state = {
        data: null,
        draftTabs: [],
        draftCategories: [],
        draftCategoryTabOrders: {},
        dragTabIndex: null,
        dragCategoryIndex: null,
        dragCategoryTab: null,
        backupRunning: false,
        backupPollTimer: null,
        lastBackupJobId: null,
        autoSaveTimer: null,
        autoSaveInFlight: null,
        autoSaveQueued: false,
        autoSaveStructural: false,
        busy: false
    }

    const $ = sel => document.querySelector(sel)

    function el(tag, props, ...children) {
        const node = document.createElement(tag)
        if (props) {
            for (const [k, v] of Object.entries(props)) {
                if (v === undefined || v === null || v === false) continue
                if (k === 'class') node.className = v
                else if (k === 'text') node.textContent = v
                else if (k === 'html') node.innerHTML = v
                else if (k === 'dataset') Object.assign(node.dataset, v)
                else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v)
                else if (k === 'checked' || k === 'disabled' || k === 'draggable' || k === 'selected') node[k] = v
                else if (k === 'value') node.value = v
                else node.setAttribute(k, v)
            }
        }
        for (const child of children.flat(Infinity)) {
            if (child === undefined || child === null || child === false) continue
            node.append(child instanceof Node ? child : document.createTextNode(String(child)))
        }
        return node
    }

    function formatBytes(bytes) {
        const n = Number(bytes) || 0
        if (n <= 0) return '0 B'
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
        let i = 0
        let value = n
        while (value >= 1024 && i < units.length - 1) { value /= 1024; i++ }
        return (i === 0 || value >= 10 ? value.toFixed(0) : value.toFixed(1)) + ' ' + units[i]
    }

    function formatDate(value) {
        if (!value) return '—'
        const d = new Date(value)
        return isNaN(d) ? '—' : d.toLocaleString()
    }

    function setStatus(message, isError = false) {
        const node = $('#status')
        if (!node) {
            if (message) console[isError ? 'error' : 'log']('[Notes admin]', message)
            return
        }
        node.textContent = message || ''
        node.classList.toggle('error', !!isError)
    }

    function setBusy(busy) {
        state.busy = busy
        document.body.classList.toggle('loading', busy)
    }

    function escapeAttr(value) {
        return String(value).replace(/["\\]/g, '\\$&')
    }

    async function api(path, { method = 'GET', body } = {}) {
        const response = await fetch(API + path, {
            method,
            credentials: 'same-origin',
            headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        })
        let payload = null
        try { payload = await response.json() } catch {}
        if (!response.ok) {
            const err = new Error((payload && (payload.error || payload.message)) || ('HTTP ' + response.status))
            err.status = response.status
            throw err
        }
        return payload || {}
    }

    function getTabStats(name) {
        return (state.data.tabs || []).find(t => t.name === name)
    }

    function categoryName(key) {
        if (!key) return 'Uncategorized'
        const cat = state.draftCategories.find(c => c.key === key)
        return cat ? (cat.name || cat.key) : key
    }

    function categoryExists(key) {
        return state.draftCategories.some(c => c.key === key)
    }

    function tabDisplayName(tab) {
        return tab.displayName || tab.name
    }

    function tabCategoryKey(tab) {
        return categoryExists(tab.category) ? tab.category : ''
    }

    // 某個 category 內的顯示順序：由該 category 自己的 order 決定，與全域 order 無關
    function orderedTabsForCategory(category) {
        const key = category || ''
        const list = state.draftTabs.filter(tab => tabCategoryKey(tab) === key)
        const order = state.draftCategoryTabOrders[key] || []
        const rank = new Map(order.map((name, index) => [name, index]))
        const globalRank = new Map(state.draftTabs.map((tab, index) => [tab.name, index]))
        return list.sort((a, b) => {
            const ra = rank.has(a.name) ? rank.get(a.name) : 1e9
            const rb = rank.has(b.name) ? rank.get(b.name) : 1e9
            if (ra !== rb) return ra - rb
            return (globalRank.get(a.name) || 0) - (globalRank.get(b.name) || 0)
        })
    }

    function setCategoryTabOrder(category, tabs) {
        state.draftCategoryTabOrders[category || ''] = tabs.map(tab => tab.name)
    }

    function makeSummary() {
        const data = state.data
        const tabs = data.tabs || []
        const notes = tabs.reduce((sum, t) => sum + (t.indexCount || 0), 0)
        const attachments = tabs.reduce((sum, t) => sum + ((t.attachments && t.attachments.totalSize) || 0), 0)
        const backupCount = (data.backups || []).length + (data.txtExports || []).length

        const card = (key, value, sub) => el('div', { class: 'card' },
            el('div', { class: 'k', text: key }),
            el('div', { class: 'v', text: value }),
            sub ? el('div', { class: 's', text: sub }) : null
        )

        return el('div', { class: 'cards' },
            card('Tabs', String(tabs.length), `${state.draftCategories.length} categories`),
            card('Notes', notes.toLocaleString()),
            card('Attachments', formatBytes(attachments)),
            card('Backups', String(backupCount)),
            card('Last backup', formatDate(data.lastBackupAt)),
            card('Next backup', formatDate(data.nextBackupAt))
        )
    }

    // ============================================
    // Categories
    // ============================================
    function makeCategoriesSection() {
        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'Categories & order' })
            ),
            el('div', { class: 'notice' },
                'Categories are independent here: add, rename, reorder or remove them even when empty. ',
                'A tab can be moved to another category at any time from its Category dropdown below. Changes are saved automatically.'
            ),
            el('div', { id: 'category-list' })
        )
    }

    function renderCategories() {
        const wrap = $('#category-list')
        if (!wrap) return
        wrap.replaceChildren()

        const table = el('table')
        table.append(el('thead', {},
            el('tr', {},
                el('th', { text: '' }),
                el('th', { text: 'Display name' }),
                el('th', { class: 'hide-sm', text: 'Key' }),
                el('th', { class: 'num', text: 'Tabs' }),
                el('th', { text: '' })
            )
        ))

        const tbody = el('tbody')
        if (state.draftCategories.length === 0) {
            tbody.append(el('tr', {}, el('td', { colspan: 5, class: 'empty', text: 'No categories yet. Add one below.' })))
        }

        state.draftCategories.forEach((cat, index) => {
            const count = state.draftTabs.filter(t => t.category === cat.key).length
            const row = el('tr', { dataset: { index: String(index) } })

            const handle = el('span', { class: 'drag-handle', title: 'Drag to reorder categories', text: '⋮⋮', draggable: true })
            handle.addEventListener('dragstart', ev => {
                state.dragCategoryIndex = index
                row.classList.add('dragging')
                try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(index)) } catch {}
            })
            handle.addEventListener('dragend', () => { state.dragCategoryIndex = null; clearDragClasses() })
            row.addEventListener('dragover', ev => {
                if (state.dragCategoryIndex === null) return
                ev.preventDefault()
                row.classList.add('drop-target')
            })
            row.addEventListener('dragleave', () => row.classList.remove('drop-target'))
            row.addEventListener('drop', ev => {
                ev.preventDefault()
                if (state.dragCategoryIndex === null) return
                moveCategory(state.dragCategoryIndex, index)
                state.dragCategoryIndex = null
                clearDragClasses()
            })

            const nameInput = el('input', { type: 'text', class: 'category-name-input', value: cat.name, 'aria-label': 'Category display name' })
            nameInput.addEventListener('input', () => {
                cat.name = nameInput.value
                scheduleAutoSave()
                renderGroupedTabs()
            })
            nameInput.addEventListener('change', () => {
                renderGroupedTabs()
                autoSaveNow()
            })

            const remove = el('button', {
                class: 'small danger',
                title: 'Remove category',
                onClick: () => {
                    const msg = count > 0
                        ? `Remove category "${categoryName(cat.key)}"?\n\nIts ${count} tab(s) will become uncategorized (notes are kept).`
                        : `Remove empty category "${categoryName(cat.key)}"?`
                    if (!confirm(msg)) return
                    const removedKey = cat.key
                    const movedNames = orderedTabsForCategory(removedKey).map(tab => tab.name)
                    state.draftCategories.splice(index, 1)
                    delete state.draftCategoryTabOrders[removedKey]
                    const uncategorizedOrder = state.draftCategoryTabOrders[''] || []
                    for (const name of movedNames) {
                        if (!uncategorizedOrder.includes(name)) uncategorizedOrder.push(name)
                    }
                    state.draftCategoryTabOrders[''] = uncategorizedOrder
                    renderCategories()
                    renderGroupedTabs()
                    autoSaveNow({ structural: true })
                }
            }, '✕')

            row.append(
                el('td', {}, handle),
                el('td', {}, nameInput),
                el('td', { class: 'hide-sm small-muted', text: cat.key }),
                el('td', { class: 'num', text: String(count) }),
                el('td', {}, el('div', { class: 'row-actions' },
                    el('button', { class: 'small', title: 'Move up', disabled: index === 0, onClick: () => moveCategory(index, index - 1) }, '▲'),
                    el('button', { class: 'small', title: 'Move down', disabled: index === state.draftCategories.length - 1, onClick: () => moveCategory(index, index + 1) }, '▼'),
                    remove
                ))
            )
            tbody.append(row)
        })

        table.append(tbody)
        wrap.append(table)

        const addInput = el('input', { type: 'text', placeholder: 'New category name', 'aria-label': 'New category name' })
        const add = () => {
            const name = addInput.value.trim()
            if (!name) return
            if (state.draftCategories.some(c => c.key.toLowerCase() === name.toLowerCase())) {
                return setStatus('That category already exists', true)
            }
            state.draftCategories.push({ key: name, name })
            if (!state.draftCategoryTabOrders[name]) state.draftCategoryTabOrders[name] = []
            addInput.value = ''
            renderCategories()
            renderGroupedTabs()
            autoSaveNow({ structural: true })
        }
        addInput.addEventListener('keydown', ev => { if (ev.key === 'Enter') add() })
        wrap.append(el('div', { class: 'row-actions', style: 'margin-top:8px' },
            addInput,
            el('button', { class: 'primary', onClick: add }, 'Add category')
        ))
    }

    function moveCategory(from, to) {
        const list = state.draftCategories
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return
        const [item] = list.splice(from, 1)
        list.splice(to, 0, item)
        renderCategories()
        renderGroupedTabs()
        autoSaveNow({ structural: true })
    }

    // ============================================
    // Compact overall tab order
    // ============================================
    function makeTabOrderSection() {
        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'Overall tab order' })
            ),
            el('div', { class: 'notice', text: 'Drag the chips to set the order used by the frontend when "All" is selected. This order is independent from the order inside each category.' }),
            el('div', { id: 'tab-order', class: 'chip-strip' })
        )
    }

    function renderTabOrder() {
        const wrap = $('#tab-order')
        if (!wrap) return
        wrap.replaceChildren()

        state.draftTabs.forEach((tab, index) => {
            const chip = el('div', {
                class: `chip${tab.category ? ' has-category' : ''}`,
                draggable: true,
                title: `${tab.name}${tab.category ? ' · ' + categoryName(tab.category) : ''}`
            },
                el('span', { class: 'chip-grip', text: '⋮⋮' }),
                el('span', { class: 'chip-label', text: tabDisplayName(tab) }),
                tab.displayName && tab.displayName !== tab.name ? el('span', { class: 'chip-sub', text: tab.name }) : null
            )
            chip.addEventListener('dragstart', ev => {
                state.dragTabIndex = index
                chip.classList.add('dragging')
                try { ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', String(index)) } catch {}
            })
            chip.addEventListener('dragend', () => { state.dragTabIndex = null; clearDragClasses() })
            chip.addEventListener('dragover', ev => {
                if (state.dragTabIndex === null) return
                ev.preventDefault()
                chip.classList.add('drop-target')
            })
            chip.addEventListener('dragleave', () => chip.classList.remove('drop-target'))
            chip.addEventListener('drop', ev => {
                ev.preventDefault()
                if (state.dragTabIndex === null) return
                moveTab(state.dragTabIndex, index)
                state.dragTabIndex = null
                clearDragClasses()
            })
            wrap.append(chip)
        })

        if (state.draftTabs.length === 0) {
            wrap.append(el('div', { class: 'empty', text: 'No tabs.' }))
        }
    }

    function moveTab(from, to) {
        const list = state.draftTabs
        if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return
        const [item] = list.splice(from, 1)
        list.splice(to, 0, item)
        renderTabOrder()
        renderGroupedTabs()
        autoSaveNow({ structural: true })
    }

    // ============================================
    // Grouped tab management
    // ============================================
    function makeTabListSection() {
        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'Tabs by category' })
            ),
            el('div', { class: 'notice' },
                'The ↑/↓ buttons reorder tabs inside their own category only and do not affect the Overall tab order above. ',
                'Changing the Category dropdown moves a tab to that category and appends it there. ',
                'Removing a tab permanently deletes its database folder and all images, videos, attachments and thumbnails uploaded in that tab. ',
                'Changes are saved automatically.'
            ),
            el('div', { id: 'tab-groups' })
        )
    }

    function makeCategorySelect(tab) {
        const select = el('select', { class: 'category-select', 'aria-label': 'Category' })
        select.append(el('option', { value: '' }, 'Uncategorized'))
        for (const cat of state.draftCategories) {
            select.append(el('option', { value: cat.key }, cat.name || cat.key))
        }
        if (!tab.category || !categoryExists(tab.category)) select.value = ''
        else select.value = tab.category
        select.addEventListener('change', () => {
            const oldCategory = tabCategoryKey(tab)
            const newCategory = select.value && categoryExists(select.value) ? select.value : ''
            if (newCategory === oldCategory) return

            state.draftCategoryTabOrders[oldCategory] = (state.draftCategoryTabOrders[oldCategory] || [])
                .filter(name => name !== tab.name)
            tab.category = newCategory
            const targetOrder = state.draftCategoryTabOrders[newCategory] || []
            if (!targetOrder.includes(tab.name)) targetOrder.push(tab.name)
            state.draftCategoryTabOrders[newCategory] = targetOrder

            renderTabOrder()
            renderGroupedTabs()
            setStatus(`Moved "${tab.name}" to ${categoryName(newCategory)}`)
            autoSaveNow({ structural: true })
        })
        return select
    }

    function renderGroupedTabs() {
        const wrap = $('#tab-groups')
        if (!wrap) return
        wrap.replaceChildren()

        const groupKeys = state.draftCategories.map(c => c.key)
        if (state.draftTabs.some(t => !t.category || !categoryExists(t.category))) groupKeys.push('')

        for (const key of groupKeys) {
            const tabs = orderedTabsForCategory(key)
            const group = el('div', { class: 'tab-group' })
            group.append(el('div', { class: 'group-head' },
                el('h3', { text: (key ? categoryName(key) : 'Uncategorized') + ' (' + tabs.length + ')' }),
                key ? el('span', { class: 'small-muted', text: key }) : null
            ))

            if (tabs.length === 0) {
                group.append(el('div', { class: 'empty', text: 'No tabs in this category.' }))
                wrap.append(group)
                continue
            }

            const table = el('table')
            table.append(el('thead', {},
                el('tr', {},
                    el('th', { text: 'Tab' }),
                    el('th', { text: 'Display name' }),
                    el('th', { text: 'Category' }),
                    el('th', { text: 'Public' }),
                    el('th', { text: 'Allowed users' }),
                    el('th', { class: 'num', text: 'Notes' }),
                    el('th', { class: 'num hide-sm', text: 'Files' }),
                    el('th', { class: 'num hide-sm', text: 'Attachments' }),
                    el('th', { text: '' })
                )
            ))
            const tbody = el('tbody')

            for (const tab of tabs) {
                const stats = getTabStats(tab.name)
                const row = el('tr', {})

                const nameCell = el('div', { class: 'tab-name-cell' })
                if (tab.isNew) {
                    const nameInput = el('input', { type: 'text', value: tab.name, 'aria-label': 'New tab name' })
                    nameInput.addEventListener('input', () => { tab.name = nameInput.value })
                    nameCell.append(nameInput)
                } else {
                    nameCell.append(el('span', { text: tab.name }))
                }

                const displayInput = el('input', {
                    type: 'text', class: 'display-name-input',
                    value: tab.displayName || '',
                    placeholder: tab.name,
                    'aria-label': 'Display name'
                })
                displayInput.addEventListener('input', () => {
                    tab.displayName = displayInput.value
                    scheduleAutoSave()
                })
                displayInput.addEventListener('change', () => {
                    renderTabOrder()
                    autoSaveNow()
                })

                const publicCheck = el('input', { type: 'checkbox', checked: !!tab.publicNote, 'aria-label': 'Public' })
                publicCheck.addEventListener('change', () => {
                    tab.publicNote = publicCheck.checked
                    autoSaveNow()
                })

                const usersInput = el('input', {
                    type: 'text', class: 'users-input',
                    value: (tab.allowedUsers || []).join(', '),
                    placeholder: 'everyone',
                    'aria-label': 'Allowed users'
                })
                usersInput.addEventListener('input', () => {
                    tab.allowedUsers = usersInput.value.split(',').map(x => x.trim()).filter(Boolean)
                    scheduleAutoSave()
                })
                usersInput.addEventListener('change', () => autoSaveNow())

                const attachments = stats && stats.attachments
                const attachmentTitle = attachments
                    ? `img ${formatBytes(attachments.img.size)} (${attachments.img.count}), mov ${formatBytes(attachments.mov.size)} (${attachments.mov.count}), att ${formatBytes(attachments.att.size)} (${attachments.att.count}), thumb ${formatBytes(attachments.thumb.size)} (${attachments.thumb.count})`
                    : ''

                const actions = el('td', {},
                    el('div', { class: 'row-actions' },
                        el('button', { class: 'small', title: 'Move up within this category', onClick: () => moveTabInCategory(tab, -1) }, '↑'),
                        el('button', { class: 'small', title: 'Move down within this category', onClick: () => moveTabInCategory(tab, 1) }, '↓'),
                        el('button', { class: 'small danger', title: 'Remove tab', onClick: () => removeTab(tab) }, '✕')
                    )
                )

                row.append(
                    el('td', {}, nameCell),
                    el('td', {}, displayInput),
                    el('td', {}, makeCategorySelect(tab)),
                    el('td', {}, publicCheck),
                    el('td', {}, usersInput),
                    el('td', { class: 'num' },
                        String(stats ? stats.indexCount : 0),
                        stats && stats.orphanCount ? el('span', { class: 'pill warn', text: '+' + stats.orphanCount, title: 'Recovered entries found in the last scan' }) : null,
                        stats && stats.missingCount ? el('span', { class: 'pill bad', text: '-' + stats.missingCount, title: 'Ghost entries removed in the last scan' }) : null
                    ),
                    el('td', { class: 'num hide-sm', text: stats && stats.fileCount != null ? String(stats.fileCount) : '—' }),
                    el('td', { class: 'num hide-sm', text: attachments ? formatBytes(attachments.totalSize) : '—', title: attachmentTitle }),
                    actions
                )
                tbody.append(row)
            }

            table.append(tbody)
            group.append(table)
            wrap.append(group)
        }

        if (state.draftTabs.length === 0) {
            wrap.append(el('div', { class: 'empty', text: 'No tabs yet. Add one below.' }))
        }

        // 新增 tab
        const addName = el('input', { type: 'text', placeholder: 'New tab name', 'aria-label': 'New tab name' })
        const addCategory = el('select', { 'aria-label': 'New tab category' })
        addCategory.append(el('option', { value: '' }, 'Uncategorized'))
        for (const cat of state.draftCategories) addCategory.append(el('option', { value: cat.key }, cat.name || cat.key))
        const add = () => {
            const name = addName.value.trim()
            if (!name) return
            if (state.draftTabs.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                return setStatus('That tab already exists', true)
            }
            state.draftTabs.push({
                name,
                displayName: '',
                category: addCategory.value,
                publicNote: false,
                allowedUsers: [],
                isNew: true
            })
            const newCategoryKey = addCategory.value && categoryExists(addCategory.value) ? addCategory.value : ''
            const order = state.draftCategoryTabOrders[newCategoryKey] || []
            if (!order.includes(name)) order.push(name)
            state.draftCategoryTabOrders[newCategoryKey] = order
            addName.value = ''
            renderTabOrder()
            renderGroupedTabs()
            setStatus(`Added tab "${name}"`)
            autoSaveNow({ structural: true })
        }
        addName.addEventListener('keydown', ev => { if (ev.key === 'Enter') add() })
        wrap.append(el('div', { class: 'row-actions', style: 'margin-top:8px' },
            addName, addCategory,
            el('button', { class: 'primary', onClick: add }, 'Add tab')
        ))
    }

    function moveTabInCategory(tab, step) {
        const category = tabCategoryKey(tab)
        const tabs = orderedTabsForCategory(category)
        const index = tabs.indexOf(tab)
        const target = index + step
        if (index < 0 || target < 0 || target >= tabs.length) return
        const [item] = tabs.splice(index, 1)
        tabs.splice(target, 0, item)
        setCategoryTabOrder(category, tabs)
        renderGroupedTabs()
        setStatus(`Reordered within ${categoryName(category)} — this does not change Overall tab order`)
        autoSaveNow({ structural: true })
    }

    function removeTab(tab) {
        if (!tab.isNew) {
            const ok = confirm(`Remove tab "${tab.name}"?\n\nThis permanently deletes its database folder and all uploaded images, videos, files and thumbnails that belong to this tab. This cannot be undone.`)
            if (!ok) return
        }
        const index = state.draftTabs.indexOf(tab)
        if (index >= 0) state.draftTabs.splice(index, 1)
        for (const key of Object.keys(state.draftCategoryTabOrders)) {
            state.draftCategoryTabOrders[key] = state.draftCategoryTabOrders[key].filter(name => name !== tab.name)
        }
        renderTabOrder()
        renderGroupedTabs()
        autoSaveNow({ structural: true })
    }

    function clearDragClasses() {
        document.querySelectorAll('.dragging, .drop-target').forEach(row => row.classList.remove('dragging', 'drop-target'))
    }

    // ============================================
    // Save categories + tabs together
    // ============================================
    function buildSavePayload() {
        const categories = []
        const seen = new Set()
        for (const cat of state.draftCategories) {
            const key = cat.key.trim()
            if (!key) continue
            if (seen.has(key)) throw new Error('Duplicate category: ' + key)
            seen.add(key)
            categories.push({ key, name: (cat.name || key).trim() || key })
        }

        const tabs = []
        for (const tab of state.draftTabs) {
            const name = tab.name.trim()
            if (!name) throw new Error('Every tab needs a name')
            tabs.push({
                name,
                category: seen.has(tab.category) ? tab.category : '',
                publicNote: !!tab.publicNote,
                allowedUsers: tab.allowedUsers || []
            })
        }
        if (tabs.length === 0) throw new Error('At least one tab is required')

        const names = {}
        for (const tab of state.draftTabs) {
            const displayName = (tab.displayName || '').trim()
            if (displayName && displayName !== tab.name.trim()) names[tab.name.trim()] = displayName
        }

        const categoryOrders = {}
        for (const cat of state.draftCategories) categoryOrders[cat.key] = []
        categoryOrders[''] = []
        for (const [key, names] of Object.entries(state.draftCategoryTabOrders)) {
            if (key && !categoryExists(key)) continue
            if (!Array.isArray(names)) continue
            categoryOrders[key] = names.slice()
        }

        return { categories, tabs, names, categoryOrders }
    }

    function cancelScheduledAutoSave() {
        if (state.autoSaveTimer) {
            clearTimeout(state.autoSaveTimer)
            state.autoSaveTimer = null
        }
    }

    async function saveChangesNow({ structural = false } = {}) {
        if (state.autoSaveInFlight) {
            state.autoSaveQueued = true
            state.autoSaveStructural = state.autoSaveStructural || structural
            return state.autoSaveInFlight
        }

        let payload
        try {
            payload = buildSavePayload()
        } catch (e) {
            setStatus('Auto-save failed: ' + e.message, true)
            return
        }

        setStatus('Saving…')
        state.autoSaveInFlight = (async () => {
            let res
            try {
                await api('manage/categories', { method: 'POST', body: { categories: payload.categories } })
                res = await api('manage/tabs', {
                    method: 'POST',
                    body: {
                        tabs: payload.tabs,
                        order: payload.tabs.map(t => t.name),
                        names: payload.names,
                        categoryOrders: payload.categoryOrders
                    }
                })
                let hasNew = false
                const savedNames = new Set(payload.tabs.map(t => t.name))
                for (const tab of state.draftTabs) {
                    if (tab.isNew && savedNames.has(tab.name.trim())) {
                        tab.isNew = false
                        hasNew = true
                    }
                }
                if (structural || hasNew) {
                    renderTabOrder()
                    renderGroupedTabs()
                }
                const bits = []
                if (res.added && res.added.length) bits.push('added: ' + res.added.join(', '))
                if (res.deleted && res.deleted.length) bits.push('deleted: ' + res.deleted.join(', '))
                setStatus('Saved automatically' + (bits.length ? ' (' + bits.join('; ') + ')' : ''))
            } catch (e) {
                setStatus('Auto-save failed: ' + e.message, true)
            } finally {
                state.autoSaveInFlight = null
                if (state.autoSaveQueued) {
                    state.autoSaveQueued = false
                    const nextStructural = state.autoSaveStructural
                    state.autoSaveStructural = false
                    saveChangesNow({ structural: nextStructural })
                }
            }
        })()

        return state.autoSaveInFlight
    }

    // 文字輸入延遲合併，避免每敲一個字就打一次 API
    function scheduleAutoSave({ delay = 650, structural = false } = {}) {
        state.autoSaveStructural = state.autoSaveStructural || structural
        cancelScheduledAutoSave()
        state.autoSaveTimer = setTimeout(() => {
            state.autoSaveTimer = null
            const nextStructural = state.autoSaveStructural
            state.autoSaveStructural = false
            saveChangesNow({ structural: nextStructural })
        }, delay)
    }

    function autoSaveNow({ structural = false } = {}) {
        cancelScheduledAutoSave()
        state.autoSaveStructural = false
        return saveChangesNow({ structural })
    }

    // ============================================
    // Repair
    // ============================================
    function makeRepairSection() {
        const button = el('button', {
            class: 'primary',
            onClick: async () => {
                setBusy(true)
                setStatus('Scanning tabs and indexes…')
                try {
                    const res = await api('manage/repair', { method: 'POST', body: {} })
                    await load()
                    const notesAdded = res.totalAdded || 0
                    const notesRemoved = res.totalRemoved || 0
                    const tabsAdded = (res.addedTabs || []).length
                    setStatus(`Scan finished: ${notesAdded} note entries restored, ${notesRemoved} ghost entries removed, ${tabsAdded} orphan tab folder(s) registered.`)
                } catch (e) {
                    setStatus('Scan failed: ' + e.message, true)
                } finally {
                    setBusy(false)
                }
            }
        }, 'Scan & repair now')

        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'Repair / consistency check' }),
                el('div', { class: 'row-actions' }, button)
            ),
            el('div', { class: 'notice' },
                'A tab index is also checked automatically when a tab is opened (throttled) and after server startup. ',
                'Orphan note files are added back to _index.json; index entries whose files no longer exist are removed after a short grace period. ',
                'Tab folders found in storage/tabs but missing from the database are registered automatically.'
            )
        )
    }

    // ============================================
    // Backups
    // ============================================
    function makeBackupsSection() {
        const wrap = el('div', { id: 'backups-tables' })

        const manualBtn = el('button', {
            id: 'manual-backup-btn',
            class: 'primary',
            onClick: async () => {
                if (state.backupRunning) {
                    setStatus('A backup is already running in the background…')
                    return
                }
                if (!confirm('Start a backup in the background?')) return
                setStatus('Backup started — you can keep working, leave or refresh this page.')
                setBackupRunning(true)
                try {
                    const res = await api('backup', { method: 'POST', body: {} })
                    if (res.job) state.backupJob = res.job
                    startBackupPolling()
                } catch (e) {
                    setBackupRunning(false)
                    setStatus('Backup failed to start: ' + e.message, true)
                }
            }
        }, 'Manual backup')

        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'Backups' }),
                el('div', { class: 'row-actions' }, manualBtn)
            ),
            el('div', { class: 'notice', text: 'Old backups are cleaned automatically after every backup according to the retention setting.' }),
            wrap
        )
    }

    function renderBackups() {
        const wrap = $('#backups-tables')
        if (!wrap) return
        wrap.replaceChildren()

        const makeTable = (title, rows, type) => {
            const section = el('div', { class: 'backup-panel' })
            section.append(el('h3', { text: title }))
            if (!rows || rows.length === 0) {
                section.append(el('div', { class: 'empty', text: 'No backups.' }))
                return section
            }
            const table = el('table')
            table.append(el('thead', {},
                el('tr', {},
                    el('th', { text: 'Name' }),
                    el('th', { class: 'num', text: 'Size' }),
                    el('th', { class: 'hide-sm', text: 'Created' }),
                    el('th', { text: '' })
                )
            ))
            const tbody = el('tbody')
            for (const row of rows) {
                const del = el('button', {
                    class: 'small danger',
                    onClick: async () => {
                        if (!confirm(`Delete backup "${row.name}"?`)) return
                        setBusy(true)
                        try {
                            await api('manage/backup-delete', { method: 'POST', body: { type, name: row.name } })
                            await load()
                            setStatus('Backup deleted')
                        } catch (e) {
                            setStatus('Delete failed: ' + e.message, true)
                        } finally {
                            setBusy(false)
                        }
                    }
                }, 'Delete')

                const actions = [del]
                if (type === 'backup' && row.packaged) {
                    const rollback = el('button', {
                        class: 'small',
                        title: 'Restore the notes database from this backup',
                        onClick: async () => {
                            if (!confirm(`Rollback the database to "${row.name}"?\n\nCurrent notes will be replaced. A safety backup of the current database is created first.\n\nAttachments (images, videos, files) are not included in database backups.`)) return
                            setBusy(true)
                            setStatus('Rolling back database…')
                            try {
                                const res = await api('rollback', { method: 'POST', body: { name: row.name } })
                                await load()
                                const safetyName = res.safetyBackup ? String(res.safetyBackup).split(/[\\/]/).pop() : ''
                                setStatus(`Rolled back to ${res.restored} (${res.noteCount} notes, ${(res.tabs || []).length} tabs)` + (safetyName ? `; safety backup: ${safetyName}` : ''))
                            } catch (e) {
                                setStatus('Rollback failed: ' + e.message, true)
                            } finally {
                                setBusy(false)
                            }
                        }
                    }, 'Rollback')
                    actions.unshift(rollback)
                }
                const nameNode = row.packaged
                    ? el('a', {
                        class: 'backup-name-link',
                        href: `${API}manage/backup-download?type=${encodeURIComponent(type)}&name=${encodeURIComponent(row.name)}`,
                        target: '_blank',
                        rel: 'noopener',
                        title: 'Download this backup'
                    }, row.name)
                    : el('span', { text: row.name })

                tbody.append(el('tr', {},
                    el('td', { class: 'backup-name' }, nameNode, row.packaged ? null : el('span', { class: 'pill warn', text: 'folder' })),
                    el('td', { class: 'num', text: row.sizeReadable || formatBytes(row.size) }),
                    el('td', { class: 'hide-sm', text: formatDate(row.created) }),
                    el('td', {}, el('div', { class: 'row-actions' }, actions))
                ))
            }
            table.append(tbody)
            section.append(el('div', { class: 'table-scroll' }, table))
            return section
        }

        const backupPanel = makeTable('Database archives', state.data.backups, 'backup')
        const txtPanel = makeTable('TXT exports', state.data.txtExports, 'txt')
        if ((state.data.txtExports || []).length > 0) {
            wrap.append(el('div', { class: 'backup-columns' }, backupPanel, txtPanel))
        } else {
            wrap.append(backupPanel)
        }
    }

    function applyBackupButtonState() {
        const button = document.getElementById('manual-backup-btn')
        if (!button) return
        button.classList.toggle('backup-running', !!state.backupRunning)
        button.setAttribute('aria-busy', state.backupRunning ? 'true' : 'false')
        button.title = state.backupRunning
            ? 'Backup in progress… you can refresh or leave this page'
            : 'Start a background backup'
    }

    function setBackupRunning(running) {
        state.backupRunning = !!running
        if (!running) stopBackupPolling()
        applyBackupButtonState()
    }

    function stopBackupPolling() {
        if (state.backupPollTimer) {
            clearTimeout(state.backupPollTimer)
            state.backupPollTimer = null
        }
    }

    function startBackupPolling() {
        stopBackupPolling()
        const tick = async () => {
            try {
                const status = await api('backup-status')
                if (status.running) {
                    setBackupRunning(true)
                    state.backupPollTimer = setTimeout(tick, 1500)
                    return
                }
                setBackupRunning(false)
                const job = status.job
                if (job && job.finishedAt && job.id !== state.lastBackupJobId) {
                    state.lastBackupJobId = job.id
                    await load()
                    setStatus(job.ok ? 'Backup completed' : ('Backup failed: ' + (job.error || 'unknown error')), !job.ok)
                }
            } catch {
                state.backupPollTimer = setTimeout(tick, 2500)
            }
        }
        state.backupPollTimer = setTimeout(tick, 700)
    }

    // ============================================
    // Settings
    // ============================================
    function makeSettingsSection() {
        const wrap = el('div', { id: 'settings-form' })
        const save = el('button', { class: 'primary', onClick: saveSettings }, 'Save settings')
        return el('section', { class: 'block' },
            el('div', { class: 'block-head' },
                el('h2', { text: 'All settings' }),
                el('div', { class: 'row-actions' }, save)
            ),
            el('div', { class: 'notice' },
                'These are the same values used by the plugin options. Tab-specific settings are managed in the tab table above.'
            ),
            wrap
        )
    }

    function renderSettings() {
        const wrap = $('#settings-form')
        if (!wrap) return
        wrap.replaceChildren()

        const groups = new Map()
        for (const field of state.data.settings || []) {
            if (!groups.has(field.group)) groups.set(field.group, [])
            groups.get(field.group).push(field)
        }

        for (const [group, fields] of groups) {
            wrap.append(el('h3', { text: group }))
            const grid = el('div', { class: 'settings-grid' })
            for (const field of fields) grid.append(makeSettingField(field))
            wrap.append(grid)
        }
    }

    function makeSettingField(field) {
        const id = 'setting-' + field.key
        let input
        let wrap
        const value = field.value

        if (field.type === 'boolean') {
            input = el('input', { type: 'checkbox', id, checked: value === true || value === 'true' })
            wrap = el('div', { class: 'field inline' }, input, el('label', { for: id, text: field.label }))
        } else if (field.type === 'select') {
            input = el('select', { id })
            for (const option of field.options || []) {
                input.append(el('option', { value: option.value }, option.label))
            }
            input.value = value == null ? '' : String(value)
            wrap = el('div', { class: 'field' }, el('label', { for: id, text: field.label }), input)
        } else {
            const type = field.type === 'number' ? 'number' : 'text'
            input = el('input', {
                type, id,
                value: field.type === 'username-multi'
                    ? (Array.isArray(value) ? value.join(', ') : (value || ''))
                    : (value == null ? '' : String(value))
            })
            if (field.type === 'number') {
                if (field.min != null) input.min = String(field.min)
                if (field.max != null) input.max = String(field.max)
                if (field.step != null) input.step = String(field.step)
            }
            wrap = el('div', { class: 'field' }, el('label', { for: id, text: field.label }), input)
        }
        if (field.hint) wrap.append(el('div', { class: 'hint', text: field.hint }))
        input.dataset.key = field.key
        input.dataset.type = field.type
        return wrap
    }

    async function saveSettings() {
        const settings = {}
        document.querySelectorAll('#settings-form [data-key]').forEach(input => {
            const key = input.dataset.key
            const type = input.dataset.type
            if (type === 'boolean') settings[key] = input.checked
            else if (type === 'number') settings[key] = Number(input.value)
            else if (type === 'username-multi') settings[key] = input.value.split(',').map(x => x.trim()).filter(Boolean)
            else settings[key] = input.value
        })

        setBusy(true)
        setStatus('Saving settings…')
        try {
            await api('manage/settings', { method: 'POST', body: { settings } })
            await load()
            setStatus('Settings saved')
        } catch (e) {
            setStatus('Save failed: ' + e.message, true)
        } finally {
            setBusy(false)
        }
    }

    // ============================================
    // Page
    // ============================================
    function render() {
        const app = $('#app')
        app.replaceChildren()

        const data = state.data
        app.append(
            el('header', {},
                el('div', {},
                    el('h1', { text: 'Notes database management' }),
                    el('div', { class: 'small-muted', text: `${(data.tabs || []).length} tabs · ${state.draftCategories.length} categories · ${(data.backups || []).length} database archives · ${(data.txtExports || []).length} TXT exports` })
                ),
                el('div', { class: 'actions' },
                    el('button', { onClick: () => load() }, 'Reload')
                )
            ),
            el('div', { id: 'status', class: 'status' }),
            makeSummary(),
            makeCategoriesSection(),
            makeTabOrderSection(),
            makeTabListSection(),
            makeRepairSection(),
            makeBackupsSection(),
            makeSettingsSection(),
            el('div', { class: 'footer-note' },
                'Last backup: ', formatDate(data.lastBackupAt), ' · Next scheduled backup: ', formatDate(data.nextBackupAt),
                ' · Server time: ', formatDate(data.serverTime)
            )
        )

        renderCategories()
        renderTabOrder()
        renderGroupedTabs()
        renderBackups()
        renderSettings()
    }

    async function load() {
        cancelScheduledAutoSave()
        state.autoSaveStructural = false
        setBusy(true)
        try {
            const data = await api('manage')
            state.data = data

            const byName = new Map()
            for (const tab of data.tabs || []) byName.set(tab.name, tab)
            const orderedTabs = []
            for (const name of data.order || []) {
                const tab = byName.get(name)
                if (tab) { orderedTabs.push(tab); byName.delete(name) }
            }
            for (const tab of byName.values()) orderedTabs.push(tab)

            state.draftTabs = orderedTabs.map(tab => ({
                name: tab.name,
                displayName: tab.displayName || '',
                category: tab.category || '',
                publicNote: !!tab.publicNote,
                allowedUsers: Array.isArray(tab.allowedUsers) ? tab.allowedUsers.slice() : [],
                isNew: false
            }))
            state.draftCategories = (data.categoryList || []).map(cat => ({
                key: cat.key,
                name: cat.name || cat.key
            }))

            state.draftCategoryTabOrders = {}
            for (const [cat, names] of Object.entries(data.categoryTabOrders || {})) {
                if (Array.isArray(names)) state.draftCategoryTabOrders[cat] = names.slice()
            }

            render()

            state.backupJob = data.backupJob || null
            if (data.backupJob && data.backupJob.running) {
                setBackupRunning(true)
                startBackupPolling()
            } else {
                setBackupRunning(false)
            }
        } catch (e) {
            const app = $('#app')
            app.replaceChildren(el('div', { class: 'block' },
                el('h1', { text: 'Notes database management' }),
                el('div', { class: 'notice error' },
                    e.status === 403
                        ? 'Admin access is required. Log in to the HFS admin panel with an admin account, then reload this page.'
                        : ('Cannot load management data: ' + e.message)
                ),
                el('button', { onClick: () => location.reload() }, 'Retry')
            ))
            throw e
        } finally {
            setBusy(false)
        }
    }

    function start() {
        load().catch(() => {})
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', start)
    } else {
        start()
    }
})()
