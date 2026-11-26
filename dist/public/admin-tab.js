/* Notes admin tab - injected into /~/admin/ HTML by the plugin middleware.
   Adds a "Notes" tab next to Plugin Tree / Installed / Analyze & Repair and
   embeds the Notes management page in an iframe. */
(function () {
    'use strict'
    if (!location.pathname.includes('/~/admin')) return

    const LABEL = 'Notes'
    const state = {
        tab: null,
        panel: null,
        iframe: null,
        root: null,
        tabsRoot: null,
        active: false,
        prevSelected: null,
        savedDisplays: new Map(),
        ensureTimer: null,
        iframeTheme: null
    }

    const $ = (sel, root) => (root || document).querySelector(sel)
    const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)]

    function findTablist() {
        const lists = $$('[role="tablist"]')
        const match = lists.find(list => {
            const texts = $$('[role="tab"]', list).map(t => t.textContent.trim().toLowerCase())
            return texts.includes('installed') && texts.includes('get more')
        })
        if (match) return match
        if (location.hash.includes('/plugins/installed')) return lists[0] || null
        return null
    }

    function currentTheme() {
        try {
            let bg = getComputedStyle(document.body).backgroundColor
            if (!bg || /,\s*0(?:\.0+)?\)$/.test(bg) || bg === 'transparent') {
                bg = getComputedStyle(document.documentElement).backgroundColor
            }
            const m = bg.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/)
            if (!m) return 'light'
            const luminance = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])
            return luminance < 128 ? 'dark' : 'light'
        } catch {
            return 'light'
        }
    }

    function adminPageBase() {
        const script = document.getElementById('notes-admin-tab')
        if (script && script.src) return script.src.replace(/admin-tab\.js(?:\?.*)?$/, '')
        return '/~/plugins/Notes/'
    }

    function iframeSrc(theme) {
        return adminPageBase() + 'admin.html?theme=' + encodeURIComponent(theme || currentTheme())
    }

    function fitPanel() {
        if (!state.active || !state.panel || !state.root) return
        const panelTop = state.panel.getBoundingClientRect().top
        const rootRect = state.root.getBoundingClientRect()
        const rootStyle = getComputedStyle(state.root)
        const padBottom = parseFloat(rootStyle.paddingBottom) || 0
        const bottom = Math.min(window.innerHeight, rootRect.bottom)
        const height = Math.max(320, Math.round(bottom - panelTop))
        const nextHeight = height + 'px'
        if (state.panel.style.height !== nextHeight) state.panel.style.height = nextHeight
        // 用負 margin 抵掉 admin 容器的底部 padding，讓 iframe 真正貼齊視窗底部
        const nextMargin = (-padBottom) + 'px'
        if (state.panel.style.marginBottom !== nextMargin) state.panel.style.marginBottom = nextMargin
    }

    function ensurePanel(list, tabsRoot, root) {
        if (state.panel && state.panel.isConnected && state.panel.parentElement === root) {
            // 不要為了「緊貼 tabsRoot」而反覆搬動 panel：其他 admin 外掛（Optimizer/Repair）
            // 也會在同一個容器插入 panel，反覆 insertBefore 會造成整頁持續閃爍。
            if (!state.active) state.panel.style.display = 'none'
            return
        }

        const panel = document.createElement('div')
        panel.className = 'notes-admin-panel'
        panel.dataset.notesPanel = '1'
        panel.dataset.active = '0'
        panel.style.display = 'none'

        const frame = document.createElement('iframe')
        frame.className = 'notes-admin-frame'
        frame.title = 'Notes management'
        frame.setAttribute('loading', 'lazy')
        panel.appendChild(frame)

        root.insertBefore(panel, tabsRoot.nextSibling)
        state.panel = panel
        state.iframe = frame
        state.iframeTheme = null
    }

    function ensure() {
        const list = findTablist()
        if (!list) {
            // 離開 Plugins 頁面後，React 會移除整個區塊；清掉失效的參照
            if (state.panel && !state.panel.isConnected) {
                state.panel = null
                state.iframe = null
                state.tab = null
                state.root = null
                state.tabsRoot = null
                state.savedDisplays.clear()
                state.active = false
            }
            return
        }

        if (state.tab && !state.tab.isConnected) state.tab = null
        if (state.panel && !state.panel.isConnected) {
            state.panel = null
            state.iframe = null
            state.savedDisplays.clear()
        }

        let tab = $('[data-notes-tab]', list)
        if (!tab) {
            const native = list.querySelector('[role="tab"]')
            if (!native) return
            tab = native.cloneNode(true)
            tab.dataset.notesTab = '1'
            tab.classList.remove('Mui-selected')
            tab.removeAttribute('id')
            tab.removeAttribute('aria-controls')
            tab.setAttribute('aria-selected', 'false')
            tab.setAttribute('aria-label', LABEL)
            tab.tabIndex = -1
            tab.textContent = LABEL
            tab.style.order = '100'
            tab.addEventListener('click', ev => {
                ev.preventDefault()
                ev.stopPropagation()
                activate()
            })
            const indicator = $('.MuiTabs-indicator', list)
            try {
                if (indicator && indicator.parentElement === list) list.insertBefore(tab, indicator)
                else list.appendChild(tab)
            } catch {
                try { list.appendChild(tab) } catch {}
            }

            if (!list.dataset.notesBound) {
                list.dataset.notesBound = '1'
                list.addEventListener('click', ev => {
                    const target = ev.target.closest && ev.target.closest('[role="tab"]')
                    if (target && target !== state.tab && state.active) deactivate()
                }, true)
            }
        }

        tab.style.order = '100'
        state.tab = tab

        const tabsRoot = list.closest('.MuiTabs-root')
        const root = tabsRoot && tabsRoot.parentElement
        if (!tabsRoot || !root) return
        // Ensure the admin tab strip stays at the top even if other admin plugins
        // reorder the flex children during repeated tab switches.
        tabsRoot.classList.add('notes-admin-tabs-root')
        root.classList.add('notes-admin-root')
        if (state.active && tabsRoot.style.display === 'none') tabsRoot.style.display = ''
        state.tabsRoot = tabsRoot
        state.root = root
        ensurePanel(list, tabsRoot, root)

        if (state.active) applyActive()
    }

    function applyActive() {
        if (!state.tab || !state.panel || !state.tabsRoot || !state.root) return
        state.active = true

        const nativeTabs = $$('[role="tab"]', state.tabsRoot)
        if (!state.prevSelected) {
            state.prevSelected = nativeTabs.find(t => t !== state.tab && t.classList.contains('Mui-selected')) || null
        }
        for (const t of nativeTabs) {
            if (t === state.tab) {
                if (!t.classList.contains('Mui-selected')) t.classList.add('Mui-selected')
                if (t.getAttribute('aria-selected') !== 'true') t.setAttribute('aria-selected', 'true')
            } else {
                if (t.classList.contains('Mui-selected')) t.classList.remove('Mui-selected')
                if (t.getAttribute('aria-selected') !== 'false') t.setAttribute('aria-selected', 'false')
            }
        }

        for (const child of [...state.root.children]) {
            if (child === state.tabsRoot || child === state.panel) continue
            if (!state.savedDisplays.has(child)) state.savedDisplays.set(child, child.style.display)
            if (child.style.display !== 'none') child.style.display = 'none'
        }

        if (state.panel.dataset.active !== '1') state.panel.dataset.active = '1'
        if (state.panel.style.display !== '') state.panel.style.display = ''
        if (state.iframe && !state.iframe.getAttribute('src')) {
            const theme = currentTheme()
            state.iframeTheme = theme
            state.iframe.src = iframeSrc(theme)
        }
        fitPanel()
    }

    function activate() {
        ensure()
        applyActive()
    }

    function deactivate() {
        if (!state.active) return
        state.active = false

        if (state.tab) {
            state.tab.classList.remove('Mui-selected')
            state.tab.setAttribute('aria-selected', 'false')
        }
        if (state.panel) {
            state.panel.dataset.active = '0'
            state.panel.style.display = 'none'
        }
        for (const [node, display] of state.savedDisplays) {
            if (node.isConnected) node.style.display = display
        }
        state.savedDisplays.clear()

        const previous = state.prevSelected
        state.prevSelected = null
        if (previous && previous.isConnected) {
            previous.classList.add('Mui-selected')
            previous.setAttribute('aria-selected', 'true')
        }
    }

    let ensureQueued = false
    function scheduleEnsure() {
        if (ensureQueued) return
        // Microtask: run once per DOM-mutation batch, before Chromium paints the
        // freshly rendered tab strip, so the Notes tab appears together with the
        // native tabs instead of popping in on the next frame.
        ensureQueued = true
        queueMicrotask(() => {
            ensureQueued = false
            ensure()
        })
    }

    // React 重新渲染、切換頁面後把 tab/panel 補回來
    new MutationObserver(scheduleEnsure).observe(document.documentElement, { childList: true, subtree: true })
    setInterval(scheduleEnsure, 2000)
    window.addEventListener('resize', fitPanel)

    window.addEventListener('hashchange', () => {
        if (!location.hash.includes('/plugins')) deactivate()
        scheduleEnsure()
    })

    // 初始掛載（admin SPA 可能還沒渲染完，MutationObserver 會補上）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleEnsure, { once: true })
    } else {
        scheduleEnsure()
    }
})()
