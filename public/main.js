"use strict"; {
    const MAX_NOTE_LEN = 2000;
    const { h } = HFS;
    const { useState, useEffect, useRef, useMemo, useCallback } = HFS.React;

    const CACHE_ACTIVE_TAB = 'notes_activeTab';
    const CACHE_INPUT_TEXT = 'notes_inputText';

    async function uploadImage(file, tab) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const res = await fetch('/~/api/notes/upload-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: file.name,
                            data: reader.result,
                            tab: tab
                        })
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Upload failed (status: ' + res.status + ')');
                    }
                    const data = await res.json();
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    async function uploadFileToServer(file, tab) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const res = await fetch('/~/api/notes/upload-file', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: file.name,
                            data: reader.result,
                            tab: tab
                        })
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Upload failed');
                    }
                    const data = await res.json();
                    resolve(data);
                } catch (e) { reject(e); }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    function createImagePicker(multiple = true) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = multiple;
            input.onchange = async () => {
                const files = Array.from(input.files);
                if (files.length === 0) {
                    reject(new Error('No file selected'));
                    return;
                }
                for (const file of files) {
                    if (file.size > 40 * 1024 * 1024) {
                        HFS.toast(`Image "${file.name}" too large (max 40MB)`, 'error');
                        reject(new Error('File too large'));
                        return;
                    }
                }
                resolve(files);
            };
            input.click();
        });
    }

    function createFilePicker(accept = '*') {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.multiple = true;
            input.onchange = async () => {
                const files = Array.from(input.files);
                if (files.length === 0) { reject(new Error('No file selected')); return; }
                for (const f of files) {
                    if (f.size > 100 * 1024 * 1024) {
                        HFS.toast(`File "${f.name}" too large (max 100MB)`, 'error');
                        reject(new Error('File too large')); return;
                    }
                }
                resolve(files);
            };
            input.click();
        });
    }

    function NoteItem({ note, onDelete, onEdit, onToggleStar, onToggleCollapse, searchTerm, activeMatches, noteRef, activeTab, fontSize }) {
        const { u, m, ts, starred, collapsed } = note;
        const { username } = HFS.useSnapState();
        const [editing, setEditing] = useState(false);
        const [editVal, setEditVal] = useState(m);
        const inputRef = useRef(null);
        const textareaRef = useRef(null);
        const collapseBtnRef = useRef(null);
        const noteItemRef = useRef(null);
        
        useEffect(() => {
            setEditing(false);
        }, [activeTab]);
        
        useEffect(() => {
            if (editing && textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }, [editVal, editing]);
        
        const handleDblClick = () => {
            if (username === u) {
                setEditing(true);
                setEditVal(m);
                setTimeout(() => {
                    inputRef.current?.focus();
                    if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                    }
                }, 50);
            }
        };
        
        const handleSave = () => {
            const trimmed = editVal.trim();
            if (trimmed) {
                onEdit(ts, trimmed);
            }
            setEditing(false);
        };
        
        const handleCancel = () => {
            setEditing(false);
        };

        const handleCopyAll = () => {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(editVal).then(() => {
                    HFS.toast('Copied to clipboard', 'success');
                }).catch(() => {
                    HFS.toast('Failed to copy', 'error');
                });
            } else {
                const ta = textareaRef.current;
                if (ta) {
                    ta.select();
                    document.execCommand('copy');
                    HFS.toast('Copied to clipboard', 'success');
                }
            }
        };

        const handleEditUpload = async () => {
            try {
                const files = await createFilePicker('*');
                HFS.toast(`Uploading ${files.length} file(s)...`, 'info');
                let allMarks = '';
                for (const file of files) {
                    try {
                        if (file.type.startsWith('image/')) {
                            const result = await uploadImage(file, activeTab);
                            allMarks += `[img:${result.imageId}]`;
                        } else {
                            const result = await uploadFileToServer(file, activeTab);
                            if (result.isVideo) {
                                allMarks += `[mov:${result.fileId}]`;
                            } else {
                                allMarks += `[att:${result.fileId}:${result.name}]`;
                            }
                        }
                    } catch (e) {
                        HFS.toast(`Failed to upload "${file.name}"`, 'error');
                    }
                }
                if (allMarks) {
                    const textarea = textareaRef.current;
                    if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const newVal = editVal.slice(0, start) + allMarks + editVal.slice(end);
                        setEditVal(newVal);
                        setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + allMarks.length, start + allMarks.length);
                        }, 50);
                    } else {
                        setEditVal(prev => prev + allMarks);
                    }
                    HFS.toast(`${files.length} file(s) uploaded`, 'success');
                }
            } catch (e) {
                if (e.message !== 'No file selected') {
                    HFS.toast('Failed to upload file(s)', 'error');
                }
            }
        };
        
        const isLongContent = m && m.split('\n').length > 20;
        
        const renderContentWithHighlight = (content, isEditMode) => {
            if (!content) return '';
            
            const imgMarkRegex = /\[img:(.+?)\]/g;
            const movMarkRegex = /\[mov:(.+?)\]/g;
            const attMarkRegex = /\[att:(.+?):(.+?)\]/g;
            const linkRegex = /(https?:\/\/\S+)/gi;
            const imgExtRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)(\?.*)?$/i;
            
            const text = typeof content === 'string' ? content : '';
            if (!text) return '';
            
            // 对文本应用搜索高亮
            const applyHighlight = (textContent) => {
                if (!searchTerm) return textContent;
                const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const regex = new RegExp(`(${escaped})`, 'gi');
                const parts = textContent.split(regex);
                let matchIdx = 0;
                return parts.map((part, i) => {
                    if (regex.test(part)) {
                        const idx = matchIdx++;
                        const isActive = activeMatches && activeMatches.includes(idx);
                        return h('mark', { 
                            key: `hl-${i}`, 
                            className: `note-highlight${isActive ? ' note-highlight-active' : ''}`,
                            ref: isActive ? noteRef : null
                        }, part);
                    }
                    return part;
                });
            };
            
            const parts = [];
            let lastIndex = 0;
            let match;
            
            // 先收集所有标记位置
            const allMatches = [];
            
            // 图片标记
            imgMarkRegex.lastIndex = 0;
            while ((match = imgMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'image', imageId: match[1] });
            }
            
            // 视频标记
            movMarkRegex.lastIndex = 0;
            while ((match = movMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'video', fileId: match[1] });
            }
            
            // 附件标记
            attMarkRegex.lastIndex = 0;
            while ((match = attMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'attachment', fileId: match[1], name: match[2] });
            }
            
            // 按位置排序
            allMatches.sort((a, b) => a.index - b.index);
            
            // 构建 parts
            lastIndex = 0;
            for (const m of allMatches) {
                if (m.index > lastIndex) {
                    parts.push({ type: 'text', content: text.slice(lastIndex, m.index) });
                }
                if (m.type === 'image') {
                    parts.push({ type: 'image', imageId: m.imageId });
                } else if (m.type === 'video') {
                    parts.push({ type: 'video', fileId: m.fileId });
                } else if (m.type === 'attachment') {
                    parts.push({ type: 'attachment', fileId: m.fileId, name: m.name });
                }
                lastIndex = m.endIndex;
            }
            
            if (lastIndex < text.length) {
                parts.push({ type: 'text', content: text.slice(lastIndex) });
            }
            
            return parts.map((part, i) => {
                if (part.type === 'image') {
                    const imgBase = isEditMode ? `/~/notes/img/temp/${activeTab}/` : `/~/notes/img/${activeTab}/`;
                    return h('img', { 
                        key: `img-${i}`, 
                        src: imgBase + part.imageId,
                        alt: 'Image',
                        className: 'note-inline-img',
                        loading: 'lazy'
                    });
                }
                if (part.type === 'video') {
                    const movUrl = `/~/notes/mov/${activeTab}/${part.fileId}`;
                    const videoId = `mov-${activeTab}-${part.fileId}-${i}`;
                    
                    return h('div', { 
                        key: `mov-${i}`, 
                        className: 'note-inline-mov',
                        'data-video-id': videoId
                    },
                        h('div', { 
                            className: 'note-mov-wrapper',
                            onClick: (e) => {
                                const wrapper = e.currentTarget;
                                const placeholder = wrapper.querySelector('.note-mov-placeholder');
                                const video = wrapper.querySelector('video');
                                if (video && video.paused) {
                                    placeholder.style.display = 'none';
                                    video.style.display = 'block';
                                    video.play().catch(() => {});
                                }
                            }
                        },
                            // 占位封面（节省资源）
                            h('div', { className: 'note-mov-placeholder' },
                                h('div', { className: 'note-mov-placeholder-bg' },
                                    h('span', { className: 'note-mov-play-icon' }, '▶')
                                ),
                                h('div', { className: 'note-mov-placeholder-info' },
                                    h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video')
                                )
                            ),
                            // 实际视频元素（初始隐藏）
                            h('video', { 
                                className: 'note-mov-player',
                                style: { display: 'none' },
                                controls: true,
                                preload: 'none', // 不预加载，节省资源
                                onPlay: (e) => {
                                    const wrapper = e.target.closest('.note-mov-wrapper');
                                    const placeholder = wrapper?.querySelector('.note-mov-placeholder');
                                    if (placeholder) placeholder.style.display = 'none';
                                    e.target.style.display = 'block';
                                },
                                onPause: (e) => {
                                    // 暂停时保持显示视频
                                    e.target.style.display = 'block';
                                }
                            },
                                h('source', { src: movUrl })
                            )
                        )
                    );
                }
                if (part.type === 'attachment') {
                    const attUrl = `/~/notes/att/${activeTab}/${part.fileId}`;
                    return h('span', { key: `att-${i}`, className: 'note-inline-att' },
                        h('span', { className: 'note-att-icon' }, '⬇'),
                        h('a', { href: attUrl, download: part.name, className: 'note-att-link' }, part.name)
                    );
                }
                // 文本部分：先处理链接，再应用高亮
                const textParts = part.content.split(linkRegex);
                return textParts.map((textPart, j) => {
                    const key = `text-${i}-${j}`;
                    if (linkRegex.test(textPart)) {
                        if (imgExtRegex.test(textPart)) {
                            return h('img', { key, src: textPart, alt: textPart, className: 'note-inline-img', loading: 'lazy' });
                        }
                        return h('a', { key, href: textPart, target: '_blank', rel: 'noopener noreferrer', className: 'note-inline-link' }, textPart);
                    }
                    // 对纯文本应用高亮
                    return applyHighlight(textPart);
                });
            });
        };

        const handleCollapseToggle = (e) => {
            e.stopPropagation();
            const noteEl = noteItemRef.current;
            if (noteEl) {
                const scrollContainer = noteEl.closest('.note-items');
                if (scrollContainer) {
                    const noteRect = noteEl.getBoundingClientRect();
                    const containerRect = scrollContainer.getBoundingClientRect();
                    const noteTopInContainer = noteRect.top - containerRect.top + scrollContainer.scrollTop;
                    
                    onToggleCollapse(ts);
                    
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            scrollContainer.scrollTop = noteTopInContainer;
                        });
                    });
                    return;
                }
            }
            onToggleCollapse(ts);
        };
        
        if (editing) {
            return h('div', { 
                className: `note-item note-item-editing ${starred ? 'note-item-starred' : ''}`, 
                ref: noteItemRef,
                'data-note-ts': ts,
                style: { fontSize: fontSize + 'px' } 
            },
                h('div', { className: 'note-header-row' },
                    h('div', { className: 'note-meta' },
                        h('span', { className: 'note-ts' }, new Date(ts).toLocaleString()),
                        h('span', { className: 'note-author' }, ' - ' + (u || 'anon'))
                    ),
                    h('div', { className: 'note-edit-actions' },
                        h('span', { 
                            className: 'note-edit-charcount',
                            style: { color: editVal.length >= MAX_NOTE_LEN * 0.9 ? '#fe5757' : undefined }
                        }, `${editVal.length}/${MAX_NOTE_LEN}`),
                        h('button', { 
                            className: 'note-img-upload-btn', 
                            onClick: handleEditUpload,
                            title: 'Upload files (multi-select supported)'
                        }, '📎'),
                        h('button', { 
                            className: 'note-copy-btn', 
                            onClick: handleCopyAll,
                            title: 'Copy all content'
                        }, '📋'),
                        h('button', { className: 'note-save-btn', onClick: handleSave }, '✓'),
                        h('button', { className: 'note-cancel-btn', onClick: handleCancel }, '✕')
                    )
                ),
                h('textarea', {
                    ref: (el) => {
                        inputRef.current = el;
                        textareaRef.current = el;
                    },
                    value: editVal,
                    onChange(e) { setEditVal(e.target.value) },
                    onKeyDown(e) {
                        if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            handleSave();
                        }
                        if (e.key === 'Escape') {
                            handleCancel();
                        }
                    },
                    className: 'note-edit-input'
                })
            );
        }
        
        // 搜索时强制展开笔记
        const isCollapsed = searchTerm ? false : (collapsed || false);
        const noteLength = m ? m.length : 0;
        const lineCount = m ? m.split('\n').length : 0;
        const showFooter = !isCollapsed && lineCount > 10;
        
        return h('div', { 
            className: `note-item ${starred ? 'note-item-starred' : ''}`, 
            onDblClick: handleDblClick,
            ref: noteItemRef,
            'data-note-ts': ts,
            style: { fontSize: fontSize + 'px' }
        },
            h('div', { className: 'note-header-row' },
                h('div', { className: 'note-meta' },
                    h('span', { className: 'note-ts' }, new Date(ts).toLocaleString()),
                    h('span', { className: 'note-author' }, ' - ' + (u || 'anon')),
                    h('button', {
                        className: `note-star-btn-inline ${starred ? 'note-starred' : ''}`,
                        onClick: (e) => { e.stopPropagation(); onToggleStar(ts); },
                        title: starred ? 'Unstar' : 'Star'
                    }, '★')
                ),
                h('div', { className: 'note-header-actions' },
                    h('button', {
                        className: 'note-collapse-btn',
                        ref: collapseBtnRef,
                        onClick: handleCollapseToggle,
                        title: isCollapsed ? 'Expand note' : 'Collapse note'
                    }, isCollapsed ? '▶' : '▼'),
                    username === u && h('button', {
                        className: 'note-delete-btn',
                        onClick: () => onDelete(ts),
                        title: 'Delete note'
                    }, '×')
                )
            ),
            h('div', { 
                className: `note-text ${isCollapsed ? 'note-text-collapsed' : ''}` 
            }, renderContentWithHighlight(m, false)),
            isCollapsed && h('div', { className: 'note-collapsed-indicator' }, '…'),
            showFooter && h('div', { className: 'note-footer-bar' },
                h('div', { className: 'note-footer-info' },
                    h('span', { className: 'note-footer-ts' }, new Date(ts).toLocaleString()),
                    h('span', { className: 'note-footer-length' }, `${noteLength} chars, ${lineCount} lines`)
                ),
                h('div', { className: 'note-footer-actions' },
                    h('button', {
                        className: 'note-footer-collapse-btn',
                        ref: collapseBtnRef,
                        onClick: handleCollapseToggle,
                        title: 'Collapse note'
                    }, '▲'),
                    username === u && h('button', {
                        className: 'note-footer-delete-btn',
                        onClick: () => onDelete(ts),
                        title: 'Delete note'
                    }, '×')
                )
            )
        );
    }

    function NotePanel({ onClose }) {
        const getCachedInput = () => {
            try {
                return localStorage.getItem(CACHE_INPUT_TEXT) || '';
            } catch { return ''; }
        };
        const [m, sm] = useState(getCachedInput);
        const [tabs, setTabs] = useState([]);
        const [activeTab, setActiveTab] = useState(() => {
            try {
                return localStorage.getItem(CACHE_ACTIVE_TAB) || '';
            } catch { return ''; }
        });
        const [notes, setNotes] = useState([]);
        const [tabCounts, setTabCounts] = useState({});
        const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
        const [storageWarning, setStorageWarning] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const [showSearch, setShowSearch] = useState(false);
        const [currentMatch, setCurrentMatch] = useState(0);
        const [closing, setClosing] = useState(false);
        const [fontSize, setFontSize] = useState(() => {
            try {
                return parseInt(localStorage.getItem('notes_fontSize')) || 14;
            } catch { return 14; }
        });
        const [tabNames, setTabNames] = useState({});
        const [renamingTab, setRenamingTab] = useState(null);
        const [renameValue, setRenameValue] = useState('');
        const renameInputRef = useRef(null);
        const [starFilterActive, setStarFilterActive] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        
        const inputRef = useRef(null);
        const listRef = useRef(null);
        const esRef = useRef(null);
        const searchInputRef = useRef(null);
        const activeMatchRef = useRef(null);
        const mRef = useRef(m);
        const activeTabRef = useRef(activeTab);
        const headerRef = useRef(null);
        const sendBtnRef = useRef(null);
        const longPressTimerRef = useRef(null);
        const shouldAutoScrollRef = useRef(true);
        const dragCounterRef = useRef(0);
        const panelRef = useRef(null);
        
        useEffect(() => { mRef.current = m; }, [m]);

        useEffect(() => {
            try {
                localStorage.setItem(CACHE_INPUT_TEXT, m);
            } catch {}
        }, [m]);

        useEffect(() => {
            try {
                if (activeTab) {
                    localStorage.setItem(CACHE_ACTIVE_TAB, activeTab);
                }
            } catch {}
            setStarFilterActive(false);
        }, [activeTab]);
        
        useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
        
        useEffect(() => {
            if (renamingTab && renameInputRef.current) {
                renameInputRef.current.focus();
                renameInputRef.current.select();
            }
        }, [renamingTab]);
        
        useEffect(() => {
            localStorage.setItem('notes_fontSize', fontSize);
        }, [fontSize]);
        
        useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth <= 768);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        // 处理长按上传文件（支持所有类型）
        useEffect(() => {
            const btn = sendBtnRef.current;
            if (!btn) return;
            
            const handlePointerDown = () => {
                longPressTimerRef.current = setTimeout(async () => {
                    try {
                        const files = await createFilePicker('*');
                        HFS.toast(`Uploading ${files.length} file(s)...`, 'info');
                        
                        let allMarks = '';
                        for (const file of files) {
                            try {
                                if (file.type.startsWith('image/')) {
                                    const result = await uploadImage(file, activeTabRef.current);
                                    allMarks += `[img:${result.imageId}]`;
                                } else {
                                    const result = await uploadFileToServer(file, activeTabRef.current);
                                    if (result.isVideo) {
                                        allMarks += `[mov:${result.fileId}]`;
                                    } else {
                                        allMarks += `[att:${result.fileId}:${result.name}]`;
                                    }
                                }
                            } catch (e) {
                                HFS.toast(`Failed to upload "${file.name}"`, 'error');
                            }
                        }
                        
                        if (allMarks) {
                            const textarea = inputRef.current;
                            if (textarea) {
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const newVal = mRef.current.slice(0, start) + allMarks + mRef.current.slice(end);
                                sm(newVal);
                                setTimeout(() => {
                                    textarea.focus();
                                    const pos = start + allMarks.length;
                                    textarea.setSelectionRange(pos, pos);
                                }, 50);
                            } else {
                                sm(prev => prev + allMarks);
                            }
                            HFS.toast(`${files.length} file(s) uploaded`, 'success');
                        }
                    } catch (e) {
                        if (e.message !== 'No file selected') {
                            HFS.toast('Failed to upload file(s)', 'error');
                        }
                    }
                }, 600);
            };
            
            const handlePointerUp = () => {
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                    longPressTimerRef.current = null;
                }
            };
            
            btn.addEventListener('pointerdown', handlePointerDown);
            btn.addEventListener('pointerup', handlePointerUp);
            btn.addEventListener('pointerleave', handlePointerUp);
            
            return () => {
                btn.removeEventListener('pointerdown', handlePointerDown);
                btn.removeEventListener('pointerup', handlePointerUp);
                btn.removeEventListener('pointerleave', handlePointerUp);
                if (longPressTimerRef.current) {
                    clearTimeout(longPressTimerRef.current);
                }
            };
        }, []);

        // 拖拽上传功能（支持所有文件类型拖拽）
        useEffect(() => {
            const panel = panelRef.current;
            if (!panel) return;

            const handleDragEnter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounterRef.current++;
                if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
                    setIsDragging(true);
                }
            };

            const handleDragOver = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };

            const handleDragLeave = (e) => {
                e.preventDefault();
                e.stopPropagation();
                dragCounterRef.current--;
                if (dragCounterRef.current <= 0) {
                    dragCounterRef.current = 0;
                    setIsDragging(false);
                }
            };

            const handleDrop = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                dragCounterRef.current = 0;

                const files = Array.from(e.dataTransfer.files);
                if (files.length === 0) {
                    HFS.toast('No files dropped', 'error');
                    return;
                }

                // 检查文件大小
                for (const file of files) {
                    if (file.size > 100 * 1024 * 1024) {
                        HFS.toast(`File "${file.name}" too large (max 100MB)`, 'error');
                        return;
                    }
                }

                try {
                    HFS.toast(`Uploading ${files.length} file(s)...`, 'info');
                    
                    let allMarks = '';
                    for (const file of files) {
                        try {
                            if (file.type.startsWith('image/')) {
                                const result = await uploadImage(file, activeTabRef.current);
                                allMarks += `[img:${result.imageId}]`;
                            } else {
                                const result = await uploadFileToServer(file, activeTabRef.current);
                                if (result.isVideo) {
                                    allMarks += `[mov:${result.fileId}]`;
                                } else {
                                    allMarks += `[att:${result.fileId}:${result.name}]`;
                                }
                            }
                        } catch (e) {
                            HFS.toast(`Failed to upload "${file.name}"`, 'error');
                        }
                    }
                    
                    if (allMarks) {
                        const textarea = inputRef.current;
                        if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const newVal = mRef.current.slice(0, start) + allMarks + mRef.current.slice(end);
                            sm(newVal);
                            setTimeout(() => {
                                textarea.focus();
                                const pos = start + allMarks.length;
                                textarea.setSelectionRange(pos, pos);
                            }, 50);
                        } else {
                            sm(prev => prev + allMarks);
                        }
                        HFS.toast(`${files.length} file(s) uploaded`, 'success');
                    }
                } catch (e) {
                    HFS.toast('Failed to upload files', 'error');
                }
            };

            panel.addEventListener('dragenter', handleDragEnter);
            panel.addEventListener('dragover', handleDragOver);
            panel.addEventListener('dragleave', handleDragLeave);
            panel.addEventListener('drop', handleDrop);

            return () => {
                panel.removeEventListener('dragenter', handleDragEnter);
                panel.removeEventListener('dragover', handleDragOver);
                panel.removeEventListener('dragleave', handleDragLeave);
                panel.removeEventListener('drop', handleDrop);
            };
        }, []);

        useEffect(() => {
            if (!isMobile) return;
            
            const handleVisualViewport = () => {
                const viewport = window.visualViewport;
                if (!viewport || !headerRef.current) return;
                
                const headerHeight = headerRef.current.offsetHeight;
                const panelTop = headerRef.current.closest('.note-panel')?.getBoundingClientRect().top || 0;
                
                if (viewport.height < window.innerHeight) {
                    const offsetTop = Math.max(0, panelTop);
                    headerRef.current.style.position = 'sticky';
                    headerRef.current.style.top = offsetTop + 'px';
                    headerRef.current.style.zIndex = '10';
                    headerRef.current.style.background = 'var(--bg)';
                    
                    const tabsContainer = headerRef.current.nextElementSibling;
                    if (tabsContainer && tabsContainer.classList.contains('note-search-bar')) {
                        const nextTabs = tabsContainer.nextElementSibling;
                        if (nextTabs && nextTabs.classList.contains('note-tabs-container')) {
                            nextTabs.style.position = 'sticky';
                            nextTabs.style.top = (offsetTop + headerRef.current.offsetHeight) + 'px';
                            nextTabs.style.zIndex = '10';
                            nextTabs.style.background = 'var(--bg)';
                        }
                    } else if (tabsContainer && tabsContainer.classList.contains('note-tabs-container')) {
                        tabsContainer.style.position = 'sticky';
                        tabsContainer.style.top = (offsetTop + headerRef.current.offsetHeight) + 'px';
                        tabsContainer.style.zIndex = '10';
                        tabsContainer.style.background = 'var(--bg)';
                    }
                } else {
                    if (headerRef.current) {
                        headerRef.current.style.position = '';
                        headerRef.current.style.top = '';
                        headerRef.current.style.zIndex = '';
                        headerRef.current.style.background = '';
                    }
                    const tabsContainers = document.querySelectorAll('.note-tabs-container');
                    tabsContainers.forEach(el => {
                        el.style.position = '';
                        el.style.top = '';
                        el.style.zIndex = '';
                        el.style.background = '';
                    });
                }
            };
            
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', handleVisualViewport);
                window.visualViewport.addEventListener('scroll', handleVisualViewport);
            }
            
            return () => {
                if (window.visualViewport) {
                    window.visualViewport.removeEventListener('resize', handleVisualViewport);
                    window.visualViewport.removeEventListener('scroll', handleVisualViewport);
                }
            };
        }, [isMobile, showSearch]);

        const getTabDisplayName = useCallback((tabKey) => {
            return tabNames[tabKey] || tabKey;
        }, [tabNames]);

        const handleClose = () => {
            setClosing(true);
            setTimeout(onClose, 300);
        };

        const tabUsagePercent = useMemo(() => {
            if (!activeTab || !tabCounts[activeTab]) return 0;
            return Math.min(Math.round((tabCounts[activeTab] / 500) * 100), 100);
        }, [activeTab, tabCounts]);

        const sendChunks = useCallback(async (text, tab) => {
            const chunks = [];
            let remaining = text;
            while (remaining.length > 0) {
                chunks.push(remaining.slice(0, MAX_NOTE_LEN));
                remaining = remaining.slice(MAX_NOTE_LEN);
            }
            
            for (let i = 0; i < chunks.length; i++) {
                const res = await fetch('/~/api/notes/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ m: chunks[i], tab, collapsed: true })
                });
                if (!res.ok) {
                    if (res.status === 429) HFS.toast('Please wait before adding another note', 'error');
                    if (res.status === 400) HFS.toast('Invalid input', 'error');
                    throw new Error('Send failed');
                }
                if (i < chunks.length - 1) {
                    await new Promise(r => setTimeout(r, 250));
                }
            }
        }, []);

        const handleSubmit = useCallback(() => {
            const currentM = mRef.current;
            const currentTab = activeTabRef.current;
            const trim = currentM.trim();
            if (!trim) return;
            
            const doSend = async () => {
                try {
                    if (trim.length > MAX_NOTE_LEN) {
                        await sendChunks(trim, currentTab);
                        HFS.toast(`Content split into ${Math.ceil(trim.length / MAX_NOTE_LEN)} notes (auto-collapsed)`, 'info');
                    } else {
                        const res = await fetch('/~/api/notes/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ m: trim, tab: currentTab })
                        });
                        if (!res.ok) {
                            if (res.status === 429) HFS.toast('Please wait before adding another note', 'error');
                            if (res.status === 400) HFS.toast('Invalid input', 'error');
                            return;
                        }
                        const data = await res.json().catch(() => {});
                        if (data && data.warning) setStorageWarning(true);
                    }
                    sm('');
                    try { localStorage.removeItem(CACHE_INPUT_TEXT); } catch {}
                    if (inputRef.current) {
                        inputRef.current.style.height = 'auto';
                    }
                    shouldAutoScrollRef.current = true;
                    setTimeout(() => inputRef.current?.focus(), 50);
                } catch (e) {}
            };
            doSend();
        }, [sendChunks]);

        const handleEdit = useCallback((ts, newText) => {
            const doEdit = async () => {
                try {
                    if (newText.length > MAX_NOTE_LEN) {
                        const firstChunk = newText.slice(0, MAX_NOTE_LEN);
                        const restChunks = [];
                        let remaining = newText.slice(MAX_NOTE_LEN);
                        while (remaining.length > 0) {
                            restChunks.push(remaining.slice(0, MAX_NOTE_LEN));
                            remaining = remaining.slice(MAX_NOTE_LEN);
                        }
                        
                        const res = await fetch('/~/api/notes/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ts, tab: activeTab, m: firstChunk })
                        });
                        if (!res.ok) {
                            HFS.toast('Failed to update note', 'error');
                            return;
                        }
                        
                        for (const chunk of restChunks) {
                            await fetch('/~/api/notes/add', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ m: chunk, tab: activeTab, collapsed: true })
                            });
                        }
                        HFS.toast(`Content split: first part updated, ${restChunks.length} new notes added (auto-collapsed)`, 'info');
                    } else {
                        const res = await fetch('/~/api/notes/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ts, tab: activeTab, m: newText })
                        });
                        if (!res.ok) {
                            HFS.toast('Failed to update note', 'error');
                        }
                    }
                } catch (e) {}
            };
            doEdit();
        }, [activeTab]);

        const handleToggleStar = useCallback((ts) => {
            fetch('/~/api/notes/toggle-star', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ts, tab: activeTab })
            }).catch(e => {});
        }, [activeTab]);

        const handleToggleCollapse = useCallback((ts) => {
            shouldAutoScrollRef.current = false;
            fetch('/~/api/notes/toggle-collapse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ts, tab: activeTab })
            }).catch(e => {});
        }, [activeTab]);

        const handleRenameStart = (tab) => {
            setRenamingTab(tab);
            setRenameValue(tabNames[tab] || '');
        };

        const handleRenameSave = async () => {
            if (!renamingTab) return;
            const newName = renameValue.trim();
            try {
                await fetch('/~/api/notes/rename-tab', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tab: renamingTab, newName: newName })
                });
            } catch (e) {}
            setRenamingTab(null);
        };

        const handleRenameCancel = () => {
            setRenamingTab(null);
        };

        const handleRenameKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameSave();
            } else if (e.key === 'Escape') {
                handleRenameCancel();
            }
        };

        useEffect(() => {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }, []);

        const loadTabs = useCallback(() => {
            fetch('/~/api/notes/tabs')
                .then(r => r.json())
                .then(data => {
                    setTabs(data.tabs || []);
                    setTabCounts(data.counts || {});
                    setStorageWarning(data.warning || false);
                    setTabNames(data.tabNames || {});
                    const cachedTab = localStorage.getItem(CACHE_ACTIVE_TAB);
                    if (cachedTab && data.tabs?.includes(cachedTab)) {
                        setActiveTab(cachedTab);
                    } else if (data.tabs?.length > 0 && !activeTabRef.current) {
                        setActiveTab(data.tabs[0]);
                    }
                    if (data.tabs?.length > 0 && !data.tabs.includes(activeTabRef.current)) {
                        setActiveTab(prev => data.tabs.includes(prev) ? prev : data.tabs[0]);
                    }
                })
                .catch(e => {});
        }, []);

        useEffect(() => {
            loadTabs();
            
            return () => {
                if (esRef.current) {
                    esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
                }
            };
        }, []);

        useEffect(() => {
            if (!activeTab) return;
            
            fetch(`/~/api/notes/list?tab=${encodeURIComponent(activeTab)}`)
                .then(r => r.json())
                .then(data => {
                    const notesWithTab = HFS._.map(data.notes || {}, (o, ts) => ({ ...o, ts, _tab: activeTab }));
                    setNotes(notesWithTab);
                })
                .catch(e => {});

            if (esRef.current) {
                esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
            }

            try {
                esRef.current = HFS.getNotifications('notes', (e, data) => {
                    if (!data) return;
                    
                    if (e === 'tabsReordered') {
                        if (data.tabs && Array.isArray(data.tabs)) {
                            setTabs(data.tabs);
                            if (!data.tabs.includes(activeTabRef.current)) {
                                setActiveTab(data.tabs[0] || '');
                            }
                        }
                        return;
                    }
                    
                    if (e === 'tabRenamed') {
                        setTabNames(prev => {
                            const updated = { ...prev };
                            if (data.newName === data.tab || !data.newName) {
                                delete updated[data.tab];
                            } else {
                                updated[data.tab] = data.newName;
                            }
                            return updated;
                        });
                        return;
                    }
                    
                    if (!data.tab) return;
                    if (data.tab !== activeTab) return;
                    
                    if (e === 'newNote') {
                        shouldAutoScrollRef.current = true;
                        setNotes(prev => [...prev, { ...data, _tab: activeTab }]);
                        loadTabs();
                    } else if (e === 'updateNote') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? { ...n, m: data.m, collapsed: data.collapsed } : n));
                    } else if (e === 'toggleStar') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? { ...n, starred: data.starred } : n));
                    } else if (e === 'toggleCollapse') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? { ...n, collapsed: data.collapsed } : n));
                    } else if (e === 'deleteNote') {
                        setNotes(prev => prev.filter(n => n.ts !== data.ts));
                        loadTabs();
                    } else if (e === 'tabCleared' && data.tab === activeTab) {
                        setNotes([]);
                        loadTabs();
                    }
                });
            } catch (e) {}

            setTimeout(() => {
                if (listRef.current && shouldAutoScrollRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
            }, 100);
        }, [activeTab]);

        useEffect(() => {
            if (listRef.current && shouldAutoScrollRef.current) {
                listRef.current.scrollTop = listRef.current.scrollHeight;
            }
            shouldAutoScrollRef.current = true;
        }, [notes]);

        const displayNotes = useMemo(() => {
            return starFilterActive ? notes.filter(n => n.starred) : notes;
        }, [notes, starFilterActive]);

        const { filteredNotes, totalMatches, noteMatchMap } = useMemo(() => {
            if (!searchTerm) return { filteredNotes: displayNotes, totalMatches: 0, noteMatchMap: new Map() };
            
            const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            const filtered = [];
            const matchMap = new Map();
            let total = 0;
            
            for (const note of displayNotes) {
                if (!note.m) continue;
                const matches = (note.m.match(regex) || []).length;
                if (matches > 0) {
                    filtered.push(note);
                    matchMap.set(note, matches);
                    total += matches;
                }
            }
            
            return { filteredNotes: filtered, totalMatches: total, noteMatchMap: matchMap };
        }, [displayNotes, searchTerm]);

        useEffect(() => {
            setCurrentMatch(0);
        }, [searchTerm]);

        useEffect(() => {
            if (activeMatchRef.current) {
                activeMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, [currentMatch, filteredNotes]);

        const getMatchLocation = useCallback((matchIdx) => {
            if (!searchTerm || filteredNotes.length === 0) return null;
            let remaining = matchIdx;
            for (const note of filteredNotes) {
                const count = noteMatchMap.get(note) || 0;
                if (remaining < count) {
                    return { note, matchIndex: remaining };
                }
                remaining -= count;
            }
            return null;
        }, [searchTerm, filteredNotes, noteMatchMap]);

        const getActiveMatchesForNote = useCallback((note) => {
            if (!searchTerm) return null;
            const loc = getMatchLocation(currentMatch);
            if (loc && loc.note === note) {
                return [loc.matchIndex];
            }
            return [];
        }, [searchTerm, currentMatch, getMatchLocation]);

        const goToPrevMatch = () => {
            setCurrentMatch(prev => prev <= 0 ? totalMatches - 1 : prev - 1);
        };

        const goToNextMatch = () => {
            setCurrentMatch(prev => prev >= totalMatches - 1 ? 0 : prev + 1);
        };

        const handleDelete = async (ts) => {
            const confirmed = await HFS.dialogLib.confirmDialog(
                'Delete Note',
                'Are you sure you want to delete this note? Any attached images, videos, and files will also be removed.'
            );
            if (!confirmed) return;
            
            fetch('/~/api/notes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ts, tab: activeTab })
            }).catch(e => {});
        };

        const moveTab = (tab, direction) => {
            const idx = tabs.indexOf(tab);
            if (idx === -1) return;
            
            const target = direction === 'left' ? idx - 1 : idx + 1;
            if (target < 0 || target >= tabs.length) return;
            
            const newTabs = [...tabs];
            [newTabs[idx], newTabs[target]] = [newTabs[target], newTabs[idx]];
            setTabs(newTabs);
            
            fetch('/~/api/notes/reorder-tabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabs: newTabs })
            }).catch(e => {});
        };

        const increaseFont = () => {
            setFontSize(prev => Math.min(prev + 2, 24));
        };

        const resetFont = () => {
            setFontSize(14);
        };

        const handleTabClick = (tab) => {
            if (tab === activeTab) {
                setStarFilterActive(prev => !prev);
            } else {
                setActiveTab(tab);
            }
        };

        return h('div', { 
            className: `note-panel ${isMobile ? 'note-mobile' : 'note-desktop'} ${closing ? 'note-closing' : ''} ${isDragging ? 'note-dragging' : ''}`,
            style: { fontSize: fontSize + 'px' },
            ref: panelRef
        },
            isDragging && h('div', { className: 'note-drag-overlay' },
                h('div', { className: 'note-drag-overlay-content' }, '📎 Drop files to upload (multi-file supported)')
            ),
            h('div', { className: 'note-panel-header', ref: headerRef },
                h('div', { className: 'note-header-left' },
                    h('span', { className: 'note-panel-title' }, '✐ Notes'),
                    starFilterActive && h('span', { className: 'note-star-filter-indicator' }, '★'),
                    h('div', { className: 'note-font-btns-header' },
                        h('button', {
                            className: 'note-font-btn-header',
                            onClick: increaseFont,
                            title: 'Increase font size'
                        }, 'A+'),
                        h('button', {
                            className: 'note-font-btn-header',
                            onClick: resetFont,
                            title: 'Reset font size'
                        }, 'A')
                    ),
                    storageWarning && h('span', { className: 'note-warn-icon', title: 'Storage limit approaching' }, '⚠')
                ),
                h('div', { className: 'note-header-right' },
                    h('button', {
                        className: 'note-search-toggle',
                        onClick: () => {
                            setShowSearch(!showSearch);
                            if (showSearch) setSearchTerm('');
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        },
                        title: 'Search'
                    }, showSearch ? '✕' : 'Ϙ'),
                    searchTerm && h('span', { className: 'note-header-stats' },
                        `${filteredNotes.length} notes / ${totalMatches} matches`
                    ),
                    h('span', {
                        className: 'note-header-charcount',
                        style: { color: m.length >= MAX_NOTE_LEN * 0.9 ? '#fe5757' : undefined }
                    }, `${m.length}/${MAX_NOTE_LEN}`),
                    h('span', { 
                        className: `note-header-usage ${tabUsagePercent >= 80 ? 'note-usage-warning' : ''}`,
                        title: tabUsagePercent >= 80 ? 'Tab storage is nearly full!' : ''
                    }, ` - ${tabUsagePercent}%`),
                    h('button', { className: 'note-close-btn', onClick: handleClose }, '×')
                )
            ),
            
            showSearch && h('div', { className: 'note-search-bar' },
                h('input', {
                    ref: searchInputRef,
                    value: searchTerm,
                    onChange: (e) => setSearchTerm(e.target.value),
                    placeholder: 'Search notes...',
                    className: 'note-search-input'
                }),
                searchTerm && h('span', { className: 'note-search-count' },
                    `${filteredNotes.length} notes, ${totalMatches} matches`
                ),
                searchTerm && totalMatches > 0 && h('span', { className: 'note-search-nav' },
                    h('button', {
                        className: 'note-search-nav-btn',
                        onClick: goToPrevMatch,
                        title: 'Previous'
                    }, '▲'),
                    h('span', { className: 'note-search-nav-num' }, `${currentMatch + 1}/${totalMatches}`),
                    h('button', {
                        className: 'note-search-nav-btn',
                        onClick: goToNextMatch,
                        title: 'Next'
                    }, '▼')
                )
            ),
            
            h('div', { className: 'note-tabs-container' },
                h('div', { className: 'note-tabs' },
                    tabs.map((tab, i) =>
                        h('span', { key: tab, className: 'note-tab-wrapper' },
                            i > 0 && h('span', { className: 'note-tab-sep' }, '|'),
                            renamingTab === tab ? h('input', {
                                ref: renameInputRef,
                                className: 'note-tab-rename-input',
                                value: renameValue,
                                onChange: (e) => setRenameValue(e.target.value),
                                onKeyDown: handleRenameKeyDown,
                                onBlur: handleRenameSave,
                                placeholder: tab
                            }) : h('button', {
                                className: `note-tab ${activeTab === tab ? 'note-tab-active' : ''} ${starFilterActive && activeTab === tab ? 'note-tab-star-mode' : ''}`,
                                onClick: () => handleTabClick(tab),
                                onDoubleClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleRenameStart(tab);
                                },
                                title: activeTab === tab ? (starFilterActive ? 'Click to exit star filter' : 'Click to filter starred') : 'Double-click to rename'
                            }, getTabDisplayName(tab))
                        )
                    )
                ),
                h('div', { className: 'note-tab-sort' },
                    h('button', {
                        className: 'note-sort-btn',
                        onClick: () => moveTab(activeTab, 'left'),
                        disabled: tabs.indexOf(activeTab) <= 0,
                        title: 'Move left'
                    }, '◀'),
                    h('button', {
                        className: 'note-sort-btn',
                        onClick: () => moveTab(activeTab, 'right'),
                        disabled: tabs.indexOf(activeTab) >= tabs.length - 1,
                        title: 'Move right'
                    }, '▶')
                )
            ),
            
            h('div', { className: 'note-items', ref: listRef },
                storageWarning && h('div', { className: 'note-warning-banner' },
                    '⚠ Storage limit approaching. Older notes auto-removed at limit.'
                ),
                starFilterActive && h('div', { className: 'note-star-filter-banner' }, '★ Showing starred notes only'),
                filteredNotes.length > 0
                    ? filteredNotes.map((note, i) => h(NoteItem, { 
                        key: i, 
                        note, 
                        onDelete: handleDelete,
                        onEdit: handleEdit,
                        onToggleStar: handleToggleStar,
                        onToggleCollapse: handleToggleCollapse,
                        searchTerm,
                        activeMatches: getActiveMatchesForNote(note),
                        noteRef: activeMatchRef,
                        activeTab,
                        fontSize
                    }))
                    : h('div', { className: 'note-empty' }, searchTerm ? 'No matches found' : (starFilterActive ? 'No starred notes.' : 'No notes yet.'))
            ),
            
            h('div', { className: 'note-input-form' },
                h('textarea', {
                    ref: inputRef,
                    value: m,
                    onChange(e) { sm(e.target.value) },
                    onKeyDown(e) {
                        if (e.key === 'Enter' && e.shiftKey) {
                            e.preventDefault();
                            handleSubmit();
                        }
                    },
                    onInput(e) {
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    },
                    placeholder: 'Shift+Enter↵ send | Long press Send upload | Drag & drop files',
                    className: 'note-input',
                    rows: 1
                }),
                h('button', { 
                    className: 'note-send-btn', 
                    onClick: handleSubmit, 
                    type: 'button',
                    ref: sendBtnRef,
                    title: 'Send (long press to upload files)'
                }, 'Send')
            )
        );
    }

    function NoteApp() {
        const { username } = HFS.useSnapState();
        const [show, setShow] = useState(false);

        useEffect(() => {
            const fn = () => setShow(prev => !prev);
            window.addEventListener('toggle-notes', fn);
            return () => window.removeEventListener('toggle-notes', fn);
        }, []);

        if (!username || !show) return null;

        return h('div', {
            className: 'note-overlay'
        }, h(NotePanel, { onClose: () => setShow(false) }));
    }

    if (HFS.state.username) {
        HFS.onEvent('appendMenuBar', () => {
            return h('button', {
                className: 'menu-bar-notes-btn',
                onClick() { window.dispatchEvent(new CustomEvent('toggle-notes')) },
                title: 'Open Notes'
            }, [
                h('span', { 'aria-hidden': 'true' }, '✐'),
                h('span', { className: 'btn-label' }, 'Notes')
            ]);
        });
    }

    HFS.onEvent('footer', () => h(NoteApp));
}