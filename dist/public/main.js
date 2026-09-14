"use strict"; {
    const PAGE_SIZE = 10;
    const { h } = HFS;
    const { useState, useEffect, useRef, useMemo, useCallback } = HFS.React;

    const CACHE_ACTIVE_TAB = 'notes_activeTab';
    const CACHE_INPUT_TEXT = 'notes_inputText';
    const CACHE_ACTIVE_CATEGORY = 'notes_activeCategory';
    const CACHE_CATEGORY_ORDER = 'notes_categoryOrder';

    let isGuest = false;
    let publicTabsList = [];

    async function checkAccess() {
        try {
            const res = await fetch('/~/api/notes/check');
            const data = await res.json();
            isGuest = data.isGuest || false;
            publicTabsList = data.publicTabs || [];
            return data.allowed;
        } catch { return false; }
    }

    function sanitizeFileNameForUpload(originalName) {
        return { safeName: originalName, displayName: originalName };
    }

    async function uploadFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const originalName = file.name;
                    const res = await fetch('/~/api/notes/upload', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: originalName,
                            data: reader.result,
                            displayName: originalName
                        })
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.error || 'Upload failed (status: ' + res.status + ')');
                    }
                    const data = await res.json();
                    resolve({ ...data, displayName: originalName });
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
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
                    if (f.size > 200 * 1024 * 1024) {
                        HFS.toast(`File "${f.name}" too large (max 200MB)`, 'error');
                        reject(new Error('File too large'));
                        return;
                    }
                }
                resolve(files);
            };
            input.click();
        });
    }

    function getVideoThumbPath(tab, fileId, thumbFormat) {
        const ext = fileId.split('.').pop();
        const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'];
        if (videoExts.includes(ext.toLowerCase())) {
            const baseName = fileId.substring(0, fileId.lastIndexOf('.'));
            const jpgPath = `/~/notes/thumb/${tab}/${baseName}.jpg`;
            const gifPath = `/~/notes/thumb/${tab}/${baseName}.gif`;
            return {
                jpg: jpgPath,
                gif: gifPath,
                primary: thumbFormat === 'gif' ? gifPath : jpgPath,
                fallback: thumbFormat === 'gif' ? jpgPath : gifPath
            };
        }
        return null;
    }

    let globalEditingNoteTs = null;
    let globalEditingTab = null;
    let globalEditTextareaRef = null;
    let globalEditValue = '';
    let globalSetEditValue = null;
    let globalActiveTab = '';

    function AdaptiveThumbImage(props) {
        const { src, alt, className, loading } = props;
        const thumbSrc = src + '?get=thumb';
        const isGif = /\.gif(\?.*)?$/i.test(src);
        const [currentSrc, setCurrentSrc] = useState(isGif ? src : thumbSrc);
        const [useThumb, setUseThumb] = useState(!isGif);
        const [thumbFailed, setThumbFailed] = useState(isGif);

        const handleError = useCallback(() => {
            if (useThumb && !thumbFailed) {
                setThumbFailed(true);
                setCurrentSrc(src);
                setUseThumb(false);
            }
        }, [useThumb, thumbFailed, src]);

        const handleClick = useCallback((e) => {
            e.stopPropagation();
            if (isGif) return;
            if (thumbFailed) return;
            if (useThumb) {
                setUseThumb(false);
                setCurrentSrc(src);
                HFS.toast('Switched to original image', 'info');
            } else {
                setUseThumb(true);
                setCurrentSrc(thumbSrc);
                HFS.toast('Switched to thumbnail', 'info');
            }
        }, [useThumb, thumbFailed, isGif, src, thumbSrc]);

        const handleLoad = useCallback((e) => {
            e.currentTarget.style.opacity = '1';
        }, []);

        return h('img', {
            src: currentSrc,
            alt: alt,
            className: className,
            loading: loading,
            onClick: handleClick,
            onError: handleError,
            onLoad: handleLoad,
            'data-original-src': src,
            'data-thumb-src': thumbSrc,
            'data-use-thumb': useThumb ? 'true' : 'false',
            'data-is-gif': isGif ? 'true' : 'false'
        });
    }

    // ========== NoteItem 组件 ==========
    function NoteItem({ note, onDelete, onEdit, onToggleStar, onToggleCollapse, searchTerm, activeMatches, noteRef, activeTab, fontSize, thumbMap, attNames, isFullscreenColumn, tabName, thumbFormat, isVisible = false, onEditingChange, isEditingThis }) {
        const { u, ts, starred, collapsed } = note;
        const summaryText = note.s || (note.m ? note.m.substring(0, 200) : '');
        const hasMoreContent = note.hasMore !== undefined ? note.hasMore : (note.m ? note.m.length > 200 : false);
        const initialFullContent = note.m || null;

        const { username } = HFS.useSnapState();
        const [editing, setEditing] = useState(false);
        const [editVal, setEditVal] = useState('');
        const inputRef = useRef(null);
        const textareaRef = useRef(null);
        const noteItemRef = useRef(null);
        const videoRef = useRef(null);
        const [videoPlaying, setVideoPlaying] = useState(false);
        const [localCollapsed, setLocalCollapsed] = useState(null);
        const [imageViewMode, setImageViewMode] = useState({});
        const [fullContent, setFullContent] = useState(initialFullContent);
        const [loadingFull, setLoadingFull] = useState(false);
        const [isContentFullyLoaded, setIsContentFullyLoaded] = useState(initialFullContent !== null);

        // ===== iPad 双击支持 refs =====
        const lastTapRef = useRef(0);
        const tapTimerRef = useRef(null);

        const isAdminUser = username === 'admin';
        const isOwner = username && (isAdminUser || username === u);
        const currentGuest = isGuest;
        const effectiveTab = tabName || activeTab;
        const effectiveCollapsed = localCollapsed !== null ? localCollapsed : (collapsed || false);

        // ===== 游客可下载判断 =====
        const canGuestDownload = currentGuest &&
            Array.isArray(publicTabsList) &&
            publicTabsList.includes(effectiveTab);

        useEffect(() => {
            if (isEditingThis && !editing) {
                loadFullContentForEdit();
            } else if (!isEditingThis && editing) {
                setEditing(false);
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
            }
        }, [isEditingThis]);

        useEffect(() => {
            if (onEditingChange) {
                onEditingChange(editing ? ts : null);
            }
        }, [editing, ts, onEditingChange]);

        useEffect(() => {
            setEditing(false);
            setLocalCollapsed(null);
            setImageViewMode({});
            setVideoPlaying(false);
            setFullContent(initialFullContent);
            setLoadingFull(false);
            setIsContentFullyLoaded(initialFullContent !== null);
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.style.display = 'none';
            }
            if (globalEditingNoteTs === ts && globalEditingTab === effectiveTab) {
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
            }
        }, [activeTab, ts, effectiveTab]);

        useEffect(() => {
            if (editing && textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }, [editVal, editing]);

        useEffect(() => {
            if (editing) {
                globalEditingNoteTs = ts;
                globalEditingTab = effectiveTab;
                globalEditTextareaRef = textareaRef;
                globalEditValue = editVal;
                globalSetEditValue = setEditVal;
                globalActiveTab = effectiveTab;
            } else {
                if (globalEditingNoteTs === ts && globalEditingTab === effectiveTab) {
                    globalEditingNoteTs = null;
                    globalEditingTab = null;
                    globalEditTextareaRef = null;
                    globalEditValue = '';
                    globalSetEditValue = null;
                    globalActiveTab = '';
                }
            }
            return () => {
                if (globalEditingNoteTs === ts && globalEditingTab === effectiveTab) {
                    globalEditingNoteTs = null;
                    globalEditingTab = null;
                    globalEditTextareaRef = null;
                    globalEditValue = '';
                    globalSetEditValue = null;
                    globalActiveTab = '';
                }
            };
        }, [editing, ts, effectiveTab, editVal]);

        // ===== 清理触摸定时器 =====
        useEffect(() => {
            return () => {
                if (tapTimerRef.current) {
                    clearTimeout(tapTimerRef.current);
                    tapTimerRef.current = null;
                }
            };
        }, []);

        const mediaThumbPaths = useMemo(() => {
            const paths = {};
            if (!thumbMap) return paths;
            const text = fullContent || summaryText || '';
            const unifiedRegex = /\[(mov):([^\]]+)\]/g;
            let match;
            while ((match = unifiedRegex.exec(text)) !== null) {
                const payload = match[2];
                const ci = payload.indexOf(':');
                const fid = ci > -1 ? payload.substring(0, ci) : payload;
                if (thumbMap[fid]) {
                    paths[fid] = getVideoThumbPath(effectiveTab, fid, thumbFormat);
                }
            }
            return paths;
        }, [thumbMap, fullContent, summaryText, effectiveTab, thumbFormat]);

        const loadFullContentForEdit = useCallback(async () => {
            let content = fullContent;
            if (content === null) {
                setLoadingFull(true);
                try {
                    const res = await fetch(`/~/api/notes/get-full?ts=${encodeURIComponent(ts)}&tab=${encodeURIComponent(effectiveTab)}`);
                    if (res.ok) {
                        const data = await res.json();
                        content = data.m || summaryText;
                        setFullContent(content);
                        setIsContentFullyLoaded(true);
                    } else {
                        content = summaryText;
                        setFullContent(summaryText);
                        setIsContentFullyLoaded(true);
                    }
                } catch (e) {
                    content = summaryText;
                    setFullContent(summaryText);
                    setIsContentFullyLoaded(true);
                } finally {
                    setLoadingFull(false);
                }
            } else {
                setIsContentFullyLoaded(true);
            }

            if (effectiveCollapsed) {
                if (currentGuest || isFullscreenColumn) {
                    setLocalCollapsed(false);
                } else {
                    onToggleCollapse(ts);
                }
            }

            setTimeout(() => {
                setEditing(true);
                const editContent = content || '';
                setEditVal(editContent);
                globalEditingNoteTs = ts;
                globalEditingTab = effectiveTab;
                globalEditValue = editContent;
                globalSetEditValue = setEditVal;
                globalActiveTab = effectiveTab;
                setTimeout(() => {
                    inputRef.current?.focus();
                    if (textareaRef.current) {
                        globalEditTextareaRef = textareaRef;
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                        textareaRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
                    }
                }, 50);
            }, effectiveCollapsed ? 150 : 50);
        }, [ts, effectiveTab, fullContent, summaryText, effectiveCollapsed, currentGuest, isFullscreenColumn, onToggleCollapse]);

        const loadFullContent = useCallback(async () => {
            if (fullContent !== null || loadingFull || !hasMoreContent) return;
            setLoadingFull(true);
            try {
                const res = await fetch(`/~/api/notes/get-full?ts=${encodeURIComponent(ts)}&tab=${encodeURIComponent(effectiveTab)}`);
                if (res.ok) {
                    const data = await res.json();
                    setFullContent(data.m || summaryText);
                    setIsContentFullyLoaded(true);
                } else {
                    setFullContent(summaryText);
                    setIsContentFullyLoaded(true);
                }
            } catch (e) {
                setFullContent(summaryText);
                setIsContentFullyLoaded(true);
            } finally {
                setLoadingFull(false);
            }
        }, [fullContent, loadingFull, hasMoreContent, ts, effectiveTab, summaryText]);

        useEffect(() => {
            if (!effectiveCollapsed && fullContent === null && hasMoreContent) {
                loadFullContent();
            }
        }, [effectiveCollapsed, fullContent, hasMoreContent, loadFullContent]);

        const handleDblClick = async () => {
            if (isFullscreenColumn) return;
            if (isOwner && !currentGuest) {
                if (globalEditingNoteTs && globalEditingNoteTs !== ts) {
                }
                loadFullContentForEdit();
            }
        };

        // ===== iPad 双击编辑支持 =====
        const handleTouchEnd = useCallback((e) => {
            // 只在触屏设备上处理
            if (!('ontouchstart' in window)) return;
            if (isFullscreenColumn) return;
            if (!(isOwner && !currentGuest)) return;

            // 排除交互元素
            const target = e.target;
            if (target.closest('button, a, input, textarea, audio, video, .note-inline-img, .note-cover-image')) {
                return;
            }

            const now = Date.now();
            const DOUBLE_TAP_DELAY = 300;

            if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
                if (tapTimerRef.current) {
                    clearTimeout(tapTimerRef.current);
                    tapTimerRef.current = null;
                }
                lastTapRef.current = 0;
                e.preventDefault();
                loadFullContentForEdit();
            } else {
                lastTapRef.current = now;
                if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
                tapTimerRef.current = setTimeout(() => {
                    tapTimerRef.current = null;
                }, DOUBLE_TAP_DELAY);
            }
        }, [isFullscreenColumn, isOwner, currentGuest, loadFullContentForEdit]);

        const handleSave = () => {
            const trimmed = editVal.trim();
            const doSave = () => {
                if (trimmed) {
                    onEdit(ts, trimmed);
                    setFullContent(trimmed);
                    setIsContentFullyLoaded(true);
                }
                setEditing(false);
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
            };
            doSave();
        };

        const handleCancel = () => {
            const doCancel = () => {
                setEditing(false);
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
            };
            doCancel();
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
            if (currentGuest) { HFS.toast('Please login to upload files', 'info'); return; }
            try {
                const files = await createFilePicker('*');
                HFS.toast(`Uploading ${files.length} file(s)...`, 'info');
                let allMarks = '';
                for (const file of files) {
                    try {
                        const result = await uploadFile(file);
                        const displayName = result.displayName || result.name || file.name;
                        if (result.isImage) {
                            allMarks += `[img:${result.fileId}]`;
                        } else if (result.isVideo) {
                            allMarks += `[mov:${result.fileId}:${displayName}]`;
                        } else if (result.isAudio) {
                            allMarks += `[mov:${result.fileId}:${displayName}]`;
                        } else {
                            allMarks += `[att:${result.fileId}:${displayName}]`;
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
                        globalEditValue = newVal;
                        setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + allMarks.length, start + allMarks.length);
                        }, 50);
                    } else {
                        setEditVal(prev => {
                            const newV = prev + allMarks;
                            globalEditValue = newV;
                            return newV;
                        });
                    }
                    HFS.toast(`${files.length} file(s) uploaded`, 'success');
                }
            } catch (e) {
                if (e.message !== 'No file selected') {
                    HFS.toast('Failed to upload file(s)', 'error');
                }
            }
        };

        const renderContentWithHighlight = (content, isEditMode) => {
            if (!content) return '';

            const linkRegex = /(https?:\/\/\S+)/gi;
            const imgExtRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)(\?.*)?$/i;

            const text = typeof content === 'string' ? content : '';
            if (!text) return '';

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

            const allMatches = [];
            const unifiedRegex = /\[(img|mov|att):([^\]]+)\]/g;
            let match;
            while ((match = unifiedRegex.exec(text)) !== null) {
                const t = match[1];
                const payload = match[2];
                if (t === 'img') {
                    allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'image', imageId: payload });
                } else if (t === 'mov' || t === 'att') {
                    const ci = payload.indexOf(':');
                    const fid = ci > -1 ? payload.substring(0, ci) : payload;
                    const nm = ci > -1 ? payload.substring(ci + 1) : payload;
                    allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: t === 'mov' ? 'media' : 'attachment', fileId: fid, name: nm });
                }
            }

            lastIndex = 0;
            for (const m of allMatches) {
                if (m.index > lastIndex) {
                    parts.push({ type: 'text', content: text.slice(lastIndex, m.index) });
                }
                if (m.type === 'image') {
                    parts.push({ type: 'image', imageId: m.imageId });
                } else if (m.type === 'media') {
                    parts.push({ type: 'media', fileId: m.fileId, name: m.name });
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
                    const imgBase = isEditMode ? `/~/notes/temp/` : `/~/notes/img/${effectiveTab}/`;
                    const thumbBase = `/~/notes/thumb/${effectiveTab}/`;
                    const fullUrl = imgBase + part.imageId;
                    const thumbUrl = thumbBase + part.imageId;
                    const ext = part.imageId.split('.').pop()?.toLowerCase();
                    const isGif = ext === 'gif';

                    const hasThumb = !isGif;
                    const viewMode = imageViewMode[part.imageId] || 'thumbnail';
                    const useThumb = !isGif && !isEditMode && viewMode === 'thumbnail';
                    const initialSrc = useThumb ? thumbUrl : fullUrl;

                    return h('img', {
                        key: `img-${i}`,
                        src: initialSrc,
                        'data-full-src': fullUrl,
                        'data-thumb-src': thumbUrl,
                        'data-has-thumb': hasThumb ? 'true' : 'false',
                        'data-is-thumb': useThumb ? 'true' : 'false',
                        'data-image-id': part.imageId,
                        alt: isGif ? 'GIF Image' : 'Image',
                        className: 'note-inline-img',
                        loading: 'lazy',
                        onClick: function(e) {
                            const img = e.currentTarget;
                            const imageId = img.dataset.imageId;
                            if (isGif) return;
                            const isThumb = img.dataset.isThumb === 'true';
                            if (isThumb) {
                                img.src = img.dataset.fullSrc;
                                img.dataset.isThumb = 'false';
                                img.title = 'Click to view thumbnail';
                                HFS.toast('Switched to original image', 'info');
                            } else {
                                img.src = img.dataset.thumbSrc;
                                img.dataset.isThumb = 'true';
                                img.title = 'Click to view original image';
                                HFS.toast('Switched to thumbnail', 'info');
                            }
                        },
                        onLoad: function(e) {
                            const img = e.currentTarget;
                            img.style.opacity = '1';
                        },
                        onError: function(e) {
                            const img = e.currentTarget;
                            if (img.dataset.isThumb === 'true' && img.src !== img.dataset.fullSrc) {
                                img.src = img.dataset.fullSrc;
                                img.dataset.isThumb = 'false';
                                img.dataset.hasThumb = 'false';
                                img.title = 'Image (no thumbnail available)';
                            }
                            img.style.opacity = '1';
                        },
                        title: isGif ? 'GIF Image' : (hasThumb ? 'Click to toggle thumbnail/original' : 'Image')
                    });
                }

                if (part.type === 'media') {
                    const movUrl = `/~/notes/mov/${effectiveTab}/${part.fileId}`;
                    const ext = part.fileId.split('.').pop()?.toLowerCase();
                    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'ogg', 'oga'];
                    const isAudio = audioExts.includes(ext);
                    const displayName = part.name || attNames[part.fileId] || part.fileId;
                    const hasThumb = thumbMap && thumbMap[part.fileId];
                    const videoThumbPaths = hasThumb ? (mediaThumbPaths[part.fileId] || getVideoThumbPath(effectiveTab, part.fileId, thumbFormat)) : null;

                    if (isAudio) {
                        return h('div', {
                            key: `media-${i}`,
                            className: 'note-inline-audio'
                        },
                            h('div', { className: 'note-audio-wrapper' },
                                h('div', { className: 'note-audio-info' },
                                    h('span', { className: 'note-audio-icon' }, '\uD83C\uDFB5'),
                                    h('span', {
                                        className: 'note-audio-filename',
                                        title: part.fileId
                                    }, displayName)
                                ),
                                h('audio', {
                                    className: 'note-audio-player',
                                    controls: true,
                                    preload: 'metadata'
                                },
                                    h('source', { src: movUrl })
                                )
                            )
                        );
                    }

                    let videoThumbPath = null;
                    let fallbackThumbPath = null;
                    if (videoThumbPaths) {
                        videoThumbPath = videoThumbPaths.primary;
                        fallbackThumbPath = videoThumbPaths.fallback;
                    }

                    const hasValidThumb = videoThumbPath !== null;

                    return h('div', {
                        key: `media-${i}`,
                        className: 'note-inline-mov'
                    },
                        h('div', {
                            className: 'note-mov-wrapper',
                            onClick: (e) => {
                                const wrapper = e.currentTarget;
                                const thumbCover = wrapper.querySelector('.note-mov-thumb-cover');
                                const video = wrapper.querySelector('video');
                                if (thumbCover) thumbCover.style.display = 'none';
                                if (video) {
                                    video.style.display = 'block';
                                    video.play().catch(() => {});
                                }
                            }
                        },
                            h('div', { className: 'note-mov-thumb-cover' },
                                hasValidThumb ?
                                    h('img', {
                                        src: videoThumbPath,
                                        alt: displayName,
                                        className: 'note-mov-thumb-img',
                                        loading: 'lazy',
                                        onLoad: function(e) {
                                            e.currentTarget.style.opacity = '1';
                                        },
                                        onError: function(e) {
                                            const img = e.currentTarget;
                                            if (fallbackThumbPath && img.src !== fallbackThumbPath) {
                                                img.src = fallbackThumbPath;
                                                return;
                                            }
                                            const wrapper = img.closest('.note-mov-wrapper');
                                            if (wrapper) {
                                                const thumbCover = wrapper.querySelector('.note-mov-thumb-cover');
                                                if (thumbCover) {
                                                    const div = document.createElement('div');
                                                    div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;background:var(--bg);color:var(--text);';
                                                    const span1 = document.createElement('span');
                                                    span1.style.cssText = 'font-size:48px;';
                                                    span1.textContent = '\u25B6\uFE0E';
                                                    const span2 = document.createElement('span');
                                                    span2.style.cssText = 'margin-top:8px;font-size:14px;';
                                                    span2.textContent = displayName;
                                                    div.appendChild(span1);
                                                    div.appendChild(span2);
                                                    thumbCover.innerHTML = '';
                                                    thumbCover.appendChild(div);
                                                }
                                            }
                                        }
                                    }) :
                                    h('div', {
                                        className: 'note-mov-placeholder'
                                    },
                                        h('span', { className: 'note-mov-play-icon' }, '\u25B6\uFE0E'),
                                        h('span', { className: 'note-mov-placeholder-text' }, displayName)
                                    ),
                                h('div', { className: 'note-mov-thumb-overlay' },
                                    h('div', { className: 'note-mov-placeholder-bg' },
                                        h('span', { className: 'note-mov-play-icon' }, '\u25B6\uFE0E')
                                    ),
                                    h('div', { className: 'note-mov-placeholder-info' },
                                        h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video')
                                    )
                                )
                            ),
                            h('video', {
                                className: 'note-mov-player',
                                style: { display: 'none' },
                                controls: true,
                                preload: 'metadata',
                                onPlay: (e) => {
                                    const wrapper = e.target.closest('.note-mov-wrapper');
                                    const thumbCover = wrapper?.querySelector('.note-mov-thumb-cover');
                                    if (thumbCover) thumbCover.style.display = 'none';
                                    e.target.style.display = 'block';
                                }
                            },
                                h('source', { src: movUrl })
                            )
                        )
                    );
                }

                if (part.type === 'attachment') {
                    let displayName = attNames[part.fileId] || part.name || part.fileId;
                    if (!attNames[part.fileId] && !part.name) {
                        const parts = part.fileId.split('_');
                        if (parts.length >= 3) {
                            displayName = parts.slice(2).join('_');
                        }
                    }

                    const handleDownload = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // ===== 游客下载权限：公开 tab 允许下载 =====
                        if (currentGuest && !canGuestDownload) {
                            HFS.toast('Please login to download files', 'info');
                            return;
                        }
                        const url = `/~/notes/att/${effectiveTab}/${part.fileId}`;
                        const iframe = document.createElement('iframe');
                        iframe.style.display = 'none';
                        iframe.src = url;
                        document.body.appendChild(iframe);
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                        }, 5000);
                    };

                    return h('span', { key: `att-${i}`, className: 'note-inline-att' },
                        h('span', { className: 'note-att-icon' }, '\u2B07\uFE0E'),
                        h('a', {
                            href: '#',
                            onClick: handleDownload,
                            className: 'note-att-link',
                            title: (currentGuest && !canGuestDownload) ? 'Login to download' : `Download: ${displayName}`
                        }, displayName)
                    );
                }

                const textParts = part.content.split(linkRegex);
                return textParts.map((textPart, j) => {
                    const key = `text-${i}-${j}`;
                    if (linkRegex.test(textPart)) {
                        if (imgExtRegex.test(textPart)) {
                            const isHttpUrl = /^https?:\/\//i.test(textPart);
                            if (isHttpUrl) {
                                return h(AdaptiveThumbImage, {
                                    key,
                                    src: textPart,
                                    alt: textPart,
                                    className: 'note-inline-img',
                                    loading: 'lazy'
                                });
                            }
                            return h('img', { key, src: textPart, alt: textPart, className: 'note-inline-img', loading: 'lazy' });
                        }
                        const httpVideoExtRegex = /^https?:\/\/.+\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv|ts|rmvb|rm|dat|vob)(\?.*)?$/i;
                        if (httpVideoExtRegex.test(textPart)) {
                            const videoUrl = textPart;
                            const videoNameMatch = videoUrl.match(/\/([^\/]+)\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv|ts|rmvb|rm|dat|vob)(\?.*)?$/i);
                            if (videoNameMatch) {
                                const videoBaseName = videoNameMatch[1];
                                const videoDir = videoUrl.substring(0, videoUrl.lastIndexOf('/'));
                                const gifCoverUrl = `${videoDir}/cache/videothumbnail/${videoBaseName}.gif`;
                                const jpgCoverUrl = `${videoDir}/cache/videothumbnail/${videoBaseName}.jpg`;
                                const displayName = videoBaseName + '.' + videoNameMatch[2];

                                return h('div', {
                                    key: `http-video-${i}-${j}`,
                                    className: 'note-inline-mov'
                                },
                                    h('div', {
                                        className: 'note-mov-wrapper',
                                        onClick: function(e) {
                                            const wrapper = e.currentTarget;
                                            const thumbCover = wrapper.querySelector('.note-mov-thumb-cover');
                                            const placeholder = wrapper.querySelector('.note-mov-placeholder');
                                            const video = wrapper.querySelector('video');
                                            if (thumbCover) thumbCover.style.display = 'none';
                                            if (placeholder) placeholder.style.display = 'none';
                                            if (video) {
                                                video.style.display = 'block';
                                                video.play().catch(() => {});
                                            }
                                        }
                                    },
                                        h('div', { className: 'note-mov-thumb-cover' },
                                            h('img', {
                                                src: gifCoverUrl,
                                                'data-fallback-src': jpgCoverUrl,
                                                alt: displayName,
                                                className: 'note-mov-thumb-img',
                                                loading: 'lazy',
                                                onLoad: function(e) {
                                                    e.currentTarget.style.opacity = '1';
                                                },
                                                onError: function(e) {
                                                    const img = e.currentTarget;
                                                    const fallback = img.dataset.fallbackSrc;
                                                    if (fallback && img.src !== fallback) {
                                                        img.src = fallback;
                                                    } else {
                                                        img.style.display = 'none';
                                                        const wrapper = img.closest('.note-mov-wrapper');
                                                        if (wrapper) {
                                                            const placeholder = wrapper.querySelector('.note-mov-placeholder');
                                                            if (placeholder) placeholder.style.display = 'flex';
                                                        }
                                                    }
                                                }
                                            }),
                                            h('div', { className: 'note-mov-thumb-overlay' },
                                                h('div', { className: 'note-mov-placeholder-bg' },
                                                    h('span', { className: 'note-mov-play-icon' }, '\u25B6\uFE0E')
                                                ),
                                                h('div', { className: 'note-mov-placeholder-info' },
                                                    h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video'),
                                                    h('span', {
                                                        className: 'note-mov-filename',
                                                        title: videoUrl
                                                    }, displayName)
                                                )
                                            )
                                        ),
                                        h('div', {
                                            className: 'note-mov-placeholder',
                                            style: { display: 'none' }
                                        },
                                            h('div', { className: 'note-mov-placeholder-bg' },
                                                h('span', { className: 'note-mov-play-icon' }, '\u25B6\uFE0E')
                                            ),
                                            h('div', { className: 'note-mov-placeholder-info' },
                                                h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video'),
                                                h('span', {
                                                    className: 'note-mov-filename',
                                                    title: videoUrl
                                                }, displayName)
                                            )
                                        ),
                                        h('video', {
                                            className: 'note-mov-player',
                                            style: { display: 'none' },
                                            controls: true,
                                            preload: 'metadata',
                                            onPlay: function(e) {
                                                const wrapper = e.target.closest('.note-mov-wrapper');
                                                const placeholder = wrapper?.querySelector('.note-mov-placeholder');
                                                const thumbCover = wrapper?.querySelector('.note-mov-thumb-cover');
                                                if (placeholder) placeholder.style.display = 'none';
                                                if (thumbCover) thumbCover.style.display = 'none';
                                                e.target.style.display = 'block';
                                            },
                                            onPause: function(e) {
                                                e.target.style.display = 'block';
                                            }
                                        },
                                            h('source', { src: videoUrl })
                                        )
                                    )
                                );
                            }
                        }
                        const httpAudioExtRegex = /^https?:\/\/.+\.(mp3|wav|flac|aac|m4a|opus|ogg|oga|wma|ape|aiff|alac|dsf|dff)(\?.*)?$/i;
                        if (httpAudioExtRegex.test(textPart)) {
                            return h('div', {
                                key: `http-audio-${i}-${j}`,
                                className: 'note-inline-audio'
                            },
                                h('div', { className: 'note-audio-wrapper' },
                                    h('div', { className: 'note-audio-info' },
                                        h('span', { className: 'note-audio-icon' }, '\uD83C\uDFB5'),
                                        h('span', {
                                            className: 'note-audio-filename',
                                            title: textPart
                                        }, decodeURIComponent(textPart.split('/').pop() || textPart))
                                    ),
                                    h('audio', {
                                        className: 'note-audio-player',
                                        controls: true,
                                        preload: 'metadata',
                                        style: { width: '100%' }
                                    },
                                        h('source', { src: textPart })
                                    )
                                )
                            );
                        }
                        return h('a', { key, href: textPart, target: '_blank', rel: 'noopener noreferrer', className: 'note-inline-link' }, textPart);
                    }
                    return applyHighlight(textPart);
                });
            });
        };

        const getCoverImage = (content) => {
            if (!content) return null;

            const imgMatch = content.match(/\[img:(.+?)\]/);
            if (imgMatch) return { type: 'image', id: imgMatch[1] };

            const movMatch = content.match(/\[mov:(.+?):(.+?)\]/);
            if (movMatch) {
                const fileId = movMatch[1];
                const ext = fileId.split('.').pop()?.toLowerCase();
                const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'];
                if (videoExts.includes(ext)) {
                    const baseName = fileId.substring(0, fileId.lastIndexOf('.'));
                    return { type: 'video', id: fileId, thumbPath: `${baseName}.jpg`, thumbPathGif: `${baseName}.gif` };
                }
            }

            const httpVideoRegex = /(https?:\/\/[^\s]+\.(?:mp4|webm|ogg|mov|avi|mkv|wmv|flv|ts|rmvb|rm|dat|vob)(?:\?[^\s]*)?)/gi;
            const httpVideoMatch = content.match(httpVideoRegex);
            if (httpVideoMatch) {
                const videoUrl = httpVideoMatch[0];
                const videoNameMatch = videoUrl.match(/\/([^\/]+)\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv|ts|rmvb|rm|dat|vob)(\?.*)?$/i);
                if (videoNameMatch) {
                    const videoBaseName = videoNameMatch[1];
                    const videoDir = videoUrl.substring(0, videoUrl.lastIndexOf('/'));
                    const gifCoverUrl = `${videoDir}/cache/videothumbnail/${videoBaseName}.gif`;
                    const jpgCoverUrl = `${videoDir}/cache/videothumbnail/${videoBaseName}.jpg`;
                    return {
                        type: 'http_video',
                        id: videoUrl,
                        url: videoUrl,
                        thumbPath: jpgCoverUrl,
                        thumbPathGif: gifCoverUrl,
                        displayName: videoBaseName + '.' + videoNameMatch[2]
                    };
                }
            }

            const httpImgRegex = /(https?:\/\/\S+\.(?:jpe?g|tiff?|png|webp|bmp)(?:\?\S*)?)/gi;
            const httpImgMatch = content.match(httpImgRegex);
            if (httpImgMatch) {
                const nonGifImages = httpImgMatch.filter(url => !/\.gif(\?.*)?$/i.test(url));
                if (nonGifImages.length > 0) {
                    const firstImageUrl = nonGifImages[0];
                    return {
                        type: 'http',
                        id: firstImageUrl,
                        url: firstImageUrl,
                        thumbUrl: firstImageUrl + '?get=thumb'
                    };
                }
            }

            return null;
        };

        const getPlainText = (content) => {
            if (!content) return '';
            return content
                .replace(/\[img:(.+?)\]/g, '')
                .replace(/\[mov:(.+?):(.+?)\]/g, '')
                .replace(/\[att:(.+?):(.+?)\]/g, '')
                .trim()
                .substring(0, 150);
        };

        const handleCollapseToggle = (e) => {
            e.stopPropagation();

            if (currentGuest || isFullscreenColumn) {
                setLocalCollapsed(prev => prev === null ? !effectiveCollapsed : !prev);
                return;
            }
            onToggleCollapse(ts);
        };

        const handleCoverClick = (e) => {
            e.stopPropagation();
        };

        const handleDeleteClick = () => {
            if (currentGuest) { HFS.toast('Please login to manage notes', 'info'); return; }
            onDelete(ts);
        };

        const handleStarClick = (e) => {
            e.stopPropagation();
            if (currentGuest) { HFS.toast('Please login to use this feature', 'info'); return; }
            onToggleStar(ts);
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
                        h('span', { className: 'note-author' }, ' - ' + (u || 'Guest'))
                    ),
                    h('div', { className: 'note-edit-actions' },
                        !currentGuest && h('button', {
                            className: 'note-img-upload-btn',
                            onClick: handleEditUpload,
                            title: 'Upload files (multi-select supported)'
                        }, '\u24CA'),
                        h('button', {
                            className: 'note-copy-btn',
                            onClick: handleCopyAll,
                            title: 'Copy all content'
                        }, '\u24B8'),
                        h('button', { className: 'note-save-btn', onClick: handleSave }, '\u2713'),
                        h('button', { className: 'note-cancel-btn', onClick: handleCancel }, '\u2715')
                    )
                ),
                h('textarea', {
                    ref: (el) => {
                        inputRef.current = el;
                        textareaRef.current = el;
                        if (el) {
                            globalEditTextareaRef = { current: el };
                        }
                    },
                    value: editVal,
                    onChange(e) {
                        setEditVal(e.target.value);
                        globalEditValue = e.target.value;
                    },
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

        const isCollapsed = searchTerm ? false : effectiveCollapsed;
        const displayContent = fullContent || summaryText;
        const noteLength = displayContent ? displayContent.length : 0;
        const lineCount = displayContent ? displayContent.split('\n').length : 0;
        const showFooter = !isFullscreenColumn && !isCollapsed && lineCount > 10;
        const coverData = getCoverImage(displayContent);
        const coverType = coverData?.type || null;
        const plainText = getPlainText(displayContent);

        const hasCover = coverData !== null;
        const coverImageId = coverData?.id || null;

        let coverSrc = '';
        let coverExt = '';
        let coverIsGif = false;
        let coverHasThumb = false;

        if (coverType === 'image') {
            coverExt = coverImageId.split('.').pop()?.toLowerCase();
            coverIsGif = coverExt === 'gif';
            coverHasThumb = !coverIsGif && thumbMap && thumbMap[coverImageId];
            coverSrc = coverHasThumb ?
                `/~/notes/thumb/${effectiveTab}/${coverImageId}` :
                `/~/notes/img/${effectiveTab}/${coverImageId}`;
        } else if (coverType === 'video') {
            const gifPath = `/~/notes/thumb/${effectiveTab}/${coverData.thumbPathGif}`;
            const jpgPath = `/~/notes/thumb/${effectiveTab}/${coverData.thumbPath}`;
            if (thumbFormat === 'gif') {
                coverSrc = gifPath;
                coverIsGif = true;
            } else {
                coverSrc = jpgPath;
                coverIsGif = false;
            }
            coverHasThumb = true;
        } else if (coverType === 'http') {
            coverSrc = coverData.thumbUrl;
            coverHasThumb = true;
            coverIsGif = false;
        }

        const canManage = isAdminUser || isOwner;

        return h('div', {
            className: `note-item ${starred ? 'note-item-starred' : ''} ${isCollapsed && coverImageId ? 'note-item-has-cover' : ''} ${isFullscreenColumn ? 'note-item-compact' : ''} ${isVisible ? 'note-item-visible' : ''}`,
            onDblClick: handleDblClick,
            onTouchEnd: handleTouchEnd,
            ref: noteItemRef,
            'data-note-ts': ts,
            style: { fontSize: fontSize + 'px' }
        },
            h('div', { className: 'note-header-row' },
                h('div', { className: 'note-meta' },
                    h('span', { className: 'note-ts' }, new Date(ts).toLocaleString()),
                    h('span', { className: 'note-author' }, ' - ' + (u || 'Guest')),
                    !currentGuest && h('button', {
                        className: `note-star-btn-inline ${starred ? 'note-starred' : ''}`,
                        onClick: handleStarClick,
                        title: starred ? 'Unstar' : 'Star'
                    }, '\u2605')
                ),
                h('div', { className: 'note-header-actions' },
                    h('button', {
                        className: 'note-collapse-btn',
                        onClick: handleCollapseToggle,
                        title: isCollapsed ? 'Expand note' : 'Collapse note'
                    }, isCollapsed ? '\u25B6\uFE0E' : '\u25BC\uFE0E'),
                    canManage && h('button', {
                        className: 'note-delete-btn',
                        onClick: handleDeleteClick,
                        title: 'Delete note'
                    }, '\u00D7')
                )
            ),
            isCollapsed && hasCover ? (() => {
                if (coverType === 'http') {
                    const httpCoverSrc = coverData.url;
                    const httpThumbSrc = coverData.thumbUrl;

                    return h('div', {
                        className: 'note-cover-wrapper',
                        onClick: handleCoverClick
                    },
                        h('div', { className: 'note-cover-image-container' },
                            h('img', {
                                src: httpThumbSrc,
                                'data-full-src': httpCoverSrc,
                                'data-thumb-src': httpThumbSrc,
                                'data-is-thumb': 'true',
                                'data-has-thumb': 'true',
                                alt: 'Cover',
                                className: 'note-cover-image',
                                loading: 'lazy',
                                onClick: function(e) {
                                    e.stopPropagation();
                                    const img = e.currentTarget;
                                    const fullSrc = img.dataset.fullSrc;
                                    const thumbSrc = img.dataset.thumbSrc;
                                    const isCurrentlyThumb = img.dataset.isThumb === 'true';
                                    if (isCurrentlyThumb) {
                                        img.src = fullSrc;
                                        img.dataset.isThumb = 'false';
                                        img.title = 'Click to view thumbnail';
                                        HFS.toast('Switched to original image', 'info');
                                    } else {
                                        img.src = thumbSrc;
                                        img.dataset.isThumb = 'true';
                                        img.title = 'Click to view original image';
                                        HFS.toast('Switched to thumbnail', 'info');
                                    }
                                },
                                onError: function(e) {
                                    const img = e.currentTarget;
                                    if (img.dataset.isThumb === 'true') {
                                        img.src = img.dataset.fullSrc;
                                        img.dataset.isThumb = 'false';
                                        img.dataset.hasThumb = 'false';
                                        img.title = 'Image (no thumbnail available)';
                                    }
                                },
                                onLoad: function(e) {
                                    e.currentTarget.style.opacity = '1';
                                },
                                title: 'Click to view original image'
                            }),
                            h('div', { className: 'note-cover-overlay' }),
                            plainText ? h('div', { className: 'note-cover-text' }, plainText) : null
                        )
                    );
                } else if (coverType === 'video') {
                    const gifThumbSrc = `/~/notes/thumb/${effectiveTab}/${coverData.thumbPathGif}`;
                    const jpgThumbSrc = `/~/notes/thumb/${effectiveTab}/${coverData.thumbPath}`;
                    const primarySrc = thumbFormat === 'gif' ? gifThumbSrc : jpgThumbSrc;
                    const fallbackSrc = thumbFormat === 'gif' ? jpgThumbSrc : gifThumbSrc;

                    return h('div', {
                        className: 'note-cover-wrapper',
                        onClick: handleCoverClick
                    },
                        h('div', { className: 'note-cover-image-container' },
                            h('img', {
                                src: primarySrc,
                                'data-fallback-src': fallbackSrc,
                                alt: 'Cover',
                                className: 'note-cover-image',
                                loading: 'lazy',
                                onError: function(e) {
                                    const img = e.currentTarget;
                                    const fallback = img.dataset.fallbackSrc;
                                    if (fallback && img.src !== fallback) {
                                        img.src = fallback;
                                        return;
                                    }
                                    if (!img.dataset.retried) {
                                        img.dataset.retried = '1';
                                        img.src = img.src.replace(/[?&]t=\d+/, '') + '?t=' + Date.now();
                                        return;
                                    }
                                },
                                onLoad: function(e) {
                                    e.currentTarget.style.opacity = '1';
                                },
                                title: 'Video Cover'
                            }),
                            h('div', { className: 'note-cover-overlay' }),
                            plainText ? h('div', { className: 'note-cover-text' }, plainText) : null
                        )
                    );
                } else if (coverType === 'http_video') {
                    const gifThumbSrc = coverData.thumbPathGif;
                    const jpgThumbSrc = coverData.thumbPath;
                    const primarySrc = thumbFormat === 'gif' ? gifThumbSrc : jpgThumbSrc;
                    const fallbackSrc = thumbFormat === 'gif' ? jpgThumbSrc : gifThumbSrc;
                    const displayName = coverData.displayName || 'Video';

                    return h('div', {
                        className: 'note-cover-wrapper',
                        onClick: handleCoverClick
                    },
                        h('div', { className: 'note-cover-image-container' },
                            h('img', {
                                src: primarySrc,
                                'data-fallback-src': fallbackSrc,
                                alt: displayName,
                                className: 'note-cover-image',
                                loading: 'lazy',
                                onError: function(e) {
                                    const img = e.currentTarget;
                                    const fallback = img.dataset.fallbackSrc;
                                    if (fallback && img.src !== fallback) {
                                        img.src = fallback;
                                        return;
                                    }
                                    if (!img.dataset.retried) {
                                        img.dataset.retried = '1';
                                        img.src = img.src.replace(/[?&]t=\d+/, '') + '?t=' + Date.now();
                                        return;
                                    }
                                    const container = img.closest('.note-cover-image-container');
                                    if (container) {
                                        const overlay = container.querySelector('.note-cover-overlay');
                                        if (overlay) {
                                            overlay.innerHTML = '\uD83C\uDFAC ' + displayName;
                                            overlay.style.display = 'flex';
                                            overlay.style.alignItems = 'center';
                                            overlay.style.justifyContent = 'center';
                                            overlay.style.fontSize = '14px';
                                            overlay.style.color = '#fff';
                                            overlay.style.background = 'rgba(0,0,0,0.6)';
                                        }
                                    }
                                },
                                onLoad: function(e) {
                                    e.currentTarget.style.opacity = '1';
                                },
                                title: 'Video Cover: ' + displayName
                            }),
                            h('div', { className: 'note-cover-overlay' }),
                            plainText ? h('div', { className: 'note-cover-text' }, plainText) : null
                        )
                    );
                } else {
                    return h('div', {
                        className: 'note-cover-wrapper',
                        onClick: handleCoverClick
                    },
                        h('div', { className: 'note-cover-image-container' },
                            h('img', {
                                src: coverSrc,
                                'data-full-src': `/~/notes/img/${effectiveTab}/${coverImageId}`,
                                'data-thumb-src': `/~/notes/thumb/${effectiveTab}/${coverImageId}`,
                                'data-has-thumb': coverHasThumb ? 'true' : 'false',
                                'data-is-gif': coverIsGif ? 'true' : 'false',
                                'data-image-id': coverImageId,
                                alt: 'Cover',
                                className: 'note-cover-image',
                                loading: 'lazy',
                                onError: function(e) {
                                    const img = e.currentTarget;
                                    if (img.dataset.isGif === 'true') {
                                        const jpgSrc = `/~/notes/thumb/${effectiveTab}/${coverImageId.replace(/\.[^.]+$/, '.jpg')}`;
                                        img.src = jpgSrc;
                                        img.dataset.isGif = 'false';
                                    }
                                },
                                onLoad: function(e) {
                                    e.currentTarget.style.opacity = '1';
                                },
                                title: coverIsGif ? 'GIF Image' : 'Cover Image'
                            }),
                            h('div', { className: 'note-cover-overlay' }),
                            plainText ? h('div', { className: 'note-cover-text' }, plainText) : null
                        )
                    );
                }
            })() :
                h('div', { className: `note-text ${isCollapsed ? 'note-text-collapsed' : ''}` },
                    isCollapsed ?
                        getPlainText(summaryText) :
                        (loadingFull ?
                            h('span', { style: { opacity: 0.5, fontStyle: 'italic' } }, 'Loading...') :
                            renderContentWithHighlight(displayContent, false))
                ),
            isCollapsed && !coverImageId && h('div', { className: 'note-collapsed-indicator' }, '\u2026'),
            showFooter && h('div', { className: 'note-footer-bar' },
                h('div', { className: 'note-footer-info' },
                    h('span', { className: 'note-footer-ts' }, new Date(ts).toLocaleString()),
                    h('span', { className: 'note-footer-length' }, `${noteLength} chars, ${lineCount} lines`)
                ),
                h('div', { className: 'note-footer-actions' },
                    h('button', {
                        className: 'note-footer-collapse-btn',
                        onClick: handleCollapseToggle,
                        title: 'Collapse note'
                    }, '\u25B2'),
                    canManage && h('button', {
                        className: 'note-footer-delete-btn',
                        onClick: handleDeleteClick,
                        title: 'Delete note'
                    }, '\u00D7')
                )
            )
        );
    }

    // ========== NotePanel 组件 ==========
    function NotePanel({ onClose }) {
        const CACHE_TTL = 5 * 60 * 1000;

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
        const [activeCategory, setActiveCategory] = useState(() => {
            try {
                return localStorage.getItem(CACHE_ACTIVE_CATEGORY) || '';
            } catch { return ''; }
        });
        const [notes, setNotes] = useState([]);
        const [tabCounts, setTabCounts] = useState({});
        const [isMobile, setIsMobile] = useState(false);
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
        const [categories, setCategories] = useState({});
        const [categoryNames, setCategoryNames] = useState({});
        const [categoryOrder, setCategoryOrder] = useState(() => {
            try {
                return JSON.parse(localStorage.getItem(CACHE_CATEGORY_ORDER)) || [];
            } catch { return []; }
        });
        const [renamingTab, setRenamingTab] = useState(null);
        const [renameValue, setRenameValue] = useState('');
        const [renamingCategory, setRenamingCategory] = useState(null);
        const [renameCategoryValue, setRenameCategoryValue] = useState('');
        const renameInputRef = useRef(null);
        const categoryRenameInputRef = useRef(null);
        const [starFilterActive, setStarFilterActive] = useState(false);
        const [fullscreenStarFilter, setFullscreenStarFilter] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [thumbMap, setThumbMap] = useState({});
        const [attNames, setAttNames] = useState({});
        const [hasMore, setHasMore] = useState(false);
        const [loadingMore, setLoadingMore] = useState(false);
        const [currentOffset, setCurrentOffset] = useState(0);
        const [showSortButtons, setShowSortButtons] = useState(false);
        const [showCategorySort, setShowCategorySort] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [otherTabData, setOtherTabData] = useState({});
        const [fullscreenLoadState, setFullscreenLoadState] = useState({});
        const [tabClickCount, setTabClickCount] = useState({});
        const [thumbFormat, setThumbFormat] = useState('jpg');
        const [searchResults, setSearchResults] = useState([]);
        const [isSearchingAll, setIsSearchingAll] = useState(false);
        const [searchLoadedAll, setSearchLoadedAll] = useState(false);
        const [searchProgress, setSearchProgress] = useState(0);
        const [visibleItems, setVisibleItems] = useState(new Set());
        const [editingNoteTs, setEditingNoteTs] = useState(null);
        const revealTimerRef = useRef(null);
        const tabClickTimerRef = useRef({});
        const tabClickCountRef = useRef({});
        const isLoadingMoreRef = useRef(false);
        const hasMoreRef = useRef(false);
        const scrollRestoreRef = useRef(0);
        const sentinelRef = useRef(null);
        const observerRef = useRef(null);
        const isFullscreenRef = useRef(false);
        const fullscreenGridRef = useRef(null);
        const esRef = useRef(null);
        const loadNotesAbortControllerRef = useRef(null);

        const tabCacheRef = useRef({});

        const inputRef = useRef(null);
        const listRef = useRef(null);
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
        const currentOffsetRef = useRef(0);
        const fullContentFallbackRef = useRef({});

        const categoryList = useMemo(() => {
            const cats = new Set();
            cats.add('');
            for (const tab of tabs) {
                const cat = categories[tab] || '';
                cats.add(cat);
            }
            const allCats = Array.from(cats);
            if (categoryOrder.length > 0) {
                const ordered = categoryOrder.filter(c => allCats.includes(c));
                const unordered = allCats.filter(c => !ordered.includes(c) && c !== '');
                return ['', ...ordered, ...unordered];
            }
            const sorted = allCats.sort();
            const emptyIndex = sorted.indexOf('');
            if (emptyIndex > 0) {
                sorted.splice(emptyIndex, 1);
                sorted.unshift('');
            }
            return sorted;
        }, [tabs, categories, categoryOrder]);

        const filteredTabs = useMemo(() => {
            if (!activeCategory) return tabs;
            if (activeCategory === '') return tabs;
            return tabs.filter(tab => (categories[tab] || '') === activeCategory);
        }, [tabs, categories, activeCategory]);

        const getCategoryDisplayName = useCallback((cat) => {
            if (!cat) return 'All';
            return categoryNames[cat] || cat;
        }, [categoryNames]);

        useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth <= 768);
            handleResize();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        useEffect(() => { mRef.current = m; }, [m]);
        useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
        useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
        useEffect(() => { isLoadingMoreRef.current = loadingMore; }, [loadingMore]);
        useEffect(() => { currentOffsetRef.current = currentOffset; }, [currentOffset]);
        useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);
        useEffect(() => { globalActiveTab = activeTab; }, [activeTab]);

        useEffect(() => {
            if (filteredTabs.length > 0 && !filteredTabs.includes(activeTab)) {
                setActiveTab(filteredTabs[0]);
                try {
                    localStorage.setItem(CACHE_ACTIVE_TAB, filteredTabs[0]);
                } catch {}
            }
            if (filteredTabs.length === 0) {
                setActiveTab('');
            }
        }, [filteredTabs, activeTab]);

        useEffect(() => {
            try {
                localStorage.setItem(CACHE_INPUT_TEXT, m);
            } catch {}
        }, [m]);

        useEffect(() => {
            if (!activeTab) return;

            const cached = tabCacheRef.current[activeTab];
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                setNotes(cached.notes);
                setThumbMap(cached.thumbMap);
                setAttNames(cached.attNames);
                setHasMore(cached.hasMore);
                setCurrentOffset(cached.offset);
                if (cached.thumbFormat) setThumbFormat(cached.thumbFormat);
            } else {
                setNotes([]);
                setHasMore(false);
                setCurrentOffset(0);
                setThumbMap({});
                setAttNames({});
                fullContentFallbackRef.current = {};
            }

            if (loadNotesAbortControllerRef.current) {
                loadNotesAbortControllerRef.current.abort();
                loadNotesAbortControllerRef.current = null;
            }

            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            setOtherTabData({});

            if (listRef.current) {
                listRef.current.scrollTop = 0;
            }

            setSearchTerm('');
            setShowSearch(false);
            setStarFilterActive(false);
            setFullscreenStarFilter(false);
            setSearchResults([]);
            setSearchLoadedAll(false);
            setSearchProgress(0);
            setIsSearchingAll(false);
            setEditingNoteTs(null);
            if (loadNotesAbortControllerRef.current) {
                loadNotesAbortControllerRef.current.abort();
                loadNotesAbortControllerRef.current = null;
            }

            Object.keys(tabClickTimerRef.current).forEach(key => {
                if (key.startsWith('timeout_')) {
                    clearTimeout(tabClickTimerRef.current[key]);
                }
            });

            globalEditingNoteTs = null;
            globalEditingTab = null;
            globalEditTextareaRef = null;
            globalEditValue = '';
            globalSetEditValue = null;
            globalActiveTab = '';

            try {
                if (activeTab) {
                    localStorage.setItem(CACHE_ACTIVE_TAB, activeTab);
                }
            } catch {}

            shouldAutoScrollRef.current = true;
            loadNotes(activeTab, false);
            setupSSE(activeTab);

            let scrollAttempts = 0;
            const maxAttempts = 3;
            const persistentScroll = () => {
                if (isFullscreen) return;
                if (scrollAttempts >= maxAttempts) return;
                if (!listRef.current) return;
                listRef.current.scrollTop = listRef.current.scrollHeight;
                scrollAttempts++;
                setTimeout(persistentScroll, 100);
            };
            setTimeout(persistentScroll, 300);
        }, [activeTab, isFullscreen]);

        useEffect(() => {
            return () => {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                }
                if (loadNotesAbortControllerRef.current) {
                    loadNotesAbortControllerRef.current.abort();
                    loadNotesAbortControllerRef.current = null;
                }
                if (esRef.current) {
                    esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
                    esRef.current = null;
                }
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
                tabCacheRef.current = {};
                fullContentFallbackRef.current = {};
            };
        }, []);

        const setupSSE = useCallback((tab) => {
            if (esRef.current) {
                esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
                esRef.current = null;
            }
            try {
                esRef.current = HFS.getNotifications('notes', (e, data) => {
                    if (!data) return;

                    if (e === 'tabsReordered') {
                        if (data.tabs && Array.isArray(data.tabs)) {
                            setTabs(data.tabs);
                            if (data.categories) {
                                setCategories(data.categories);
                            }
                            if (data.categoryOrder) {
                                setCategoryOrder(data.categoryOrder);
                                try {
                                    localStorage.setItem(CACHE_CATEGORY_ORDER, JSON.stringify(data.categoryOrder));
                                } catch {}
                            }
                            if (data.categoryNames) {
                                setCategoryNames(data.categoryNames);
                            }
                            const currentTab = activeTabRef.current;
                            if (currentTab && !data.tabs.includes(currentTab)) {
                                const sameCategoryTabs = data.tabs.filter(tab => 
                                    (data.categories || {})[tab] === (data.categories || {})[currentTab]
                                );
                                setActiveTab(sameCategoryTabs.length > 0 ? sameCategoryTabs[0] : data.tabs[0] || '');
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

                    if (e === 'categoryUpdated') {
                        if (data.tab && data.category !== undefined) {
                            setCategories(prev => {
                                const updated = { ...prev };
                                if (data.category) {
                                    updated[data.tab] = data.category;
                                } else {
                                    delete updated[data.tab];
                                }
                                return updated;
                            });
                        }
                        return;
                    }

                    if (e === 'categoryNameUpdated') {
                        setCategoryNames(prev => {
                            const updated = { ...prev };
                            if (data.newCategory && data.newCategory !== data.oldCategory) {
                                updated[data.oldCategory] = data.newCategory;
                            } else {
                                delete updated[data.oldCategory];
                            }
                            return updated;
                        });
                        return;
                    }

                    if (e === 'categoryOrderUpdated') {
                        setCategoryOrder(data.order);
                        try {
                            localStorage.setItem(CACHE_CATEGORY_ORDER, JSON.stringify(data.order));
                        } catch {}
                        return;
                    }

                    if (!data.tab) return;
                    if (data.tab !== activeTabRef.current) return;

                    if (e === 'newNote') {
                        shouldAutoScrollRef.current = true;
                        const noteData = {
                            ...data,
                            _tab: activeTabRef.current,
                            s: data.m ? data.m.substring(0, 200) : '',
                            hasMore: data.m ? data.m.length > 200 : false,
                            m: data.m
                        };
                        setNotes(prev => {
                            const exists = prev.some(n => n.ts === data.ts);
                            if (exists) return prev;
                            return [...prev, noteData];
                        });
                        loadTabs();
                        if (isFullscreenRef.current && !isMobile) {
                            setTimeout(() => {
                                const container = document.querySelector('.note-fullscreen-column-active .note-items.note-items-fullscreen');
                                if (container) {
                                    container.scrollTop = container.scrollHeight;
                                }
                            }, 100);
                        }
                    } else if (e === 'updateNote') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? {
                            ...n,
                            m: data.m,
                            s: data.m ? data.m.substring(0, 200) : '',
                            hasMore: data.m ? data.m.length > 200 : false,
                            collapsed: data.collapsed
                        } : n));
                    } else if (e === 'toggleStar') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? { ...n, starred: data.starred } : n));
                    } else if (e === 'toggleCollapse') {
                        setNotes(prev => prev.map(n => n.ts === data.ts ? { ...n, collapsed: data.collapsed } : n));
                    } else if (e === 'deleteNote') {
                        setNotes(prev => prev.filter(n => n.ts !== data.ts));
                        loadTabs();
                    } else if (e === 'tabCleared' && data.tab === activeTabRef.current) {
                        fullContentFallbackRef.current = {};
                        setNotes([]);
                        setHasMore(false);
                        setCurrentOffset(0);
                        delete tabCacheRef.current[data.tab];
                        loadTabs();
                    }
                });
            } catch (e) {}
        }, []);

        useEffect(() => {
            if (!activeTab) return;
            setupSSE(activeTab);
        }, [activeTab, setupSSE]);

        useEffect(() => {
            if (renamingTab && renameInputRef.current) {
                renameInputRef.current.focus();
                renameInputRef.current.select();
            }
        }, [renamingTab]);

        useEffect(() => {
            if (renamingCategory && categoryRenameInputRef.current) {
                categoryRenameInputRef.current.focus();
                categoryRenameInputRef.current.select();
            }
        }, [renamingCategory]);

        useEffect(() => {
            localStorage.setItem('notes_fontSize', fontSize);
        }, [fontSize]);

        useEffect(() => {
            const originalOverflow = document.body.style.overflow;
            const originalTouchAction = document.body.style.touchAction;
            const originalOverscrollBehavior = document.body.style.overscrollBehavior;

            if (!isFullscreen) {
                document.body.style.overflow = 'hidden';
                document.body.style.touchAction = 'none';
                document.body.style.overscrollBehavior = 'contain';
            }

            return () => {
                if (!isFullscreen) {
                    document.body.style.overflow = originalOverflow;
                    document.body.style.touchAction = originalTouchAction;
                    document.body.style.overscrollBehavior = originalOverscrollBehavior;
                }
            };
        }, [isFullscreen]);

        useEffect(() => {
            const btn = sendBtnRef.current;
            if (!btn) return;

            const handlePointerDown = () => {
                if (isGuest) { HFS.toast('Please login to upload files', 'info'); return; }
                longPressTimerRef.current = setTimeout(async () => {
                    try {
                        const files = await createFilePicker('*');
                        HFS.toast(`Uploading ${files.length} file(s)...`, 'info');

                        let allMarks = '';
                        for (const file of files) {
                            try {
                                const result = await uploadFile(file);
                                const displayName = result.displayName || result.name || file.name;
                                if (result.isImage) {
                                    allMarks += `[img:${result.fileId}]`;
                                } else if (result.isVideo) {
                                    allMarks += `[mov:${result.fileId}:${displayName}]`;
                                } else if (result.isAudio) {
                                    allMarks += `[mov:${result.fileId}:${displayName}]`;
                                } else {
                                    allMarks += `[att:${result.fileId}:${displayName}]`;
                                }
                            } catch (e) {
                                HFS.toast(`Failed to upload "${file.name}"`, 'error');
                            }
                        }

                        if (globalEditingNoteTs && globalSetEditValue && globalEditTextareaRef && globalEditTextareaRef.current) {
                            const textarea = globalEditTextareaRef.current;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const currentVal = globalEditValue;
                            const newVal = currentVal.slice(0, start) + allMarks + currentVal.slice(end);
                            globalSetEditValue(newVal);
                            globalEditValue = newVal;
                            setTimeout(() => {
                                textarea.focus();
                                const pos = start + allMarks.length;
                                textarea.setSelectionRange(pos, pos);
                            }, 50);
                        } else if (allMarks) {
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
                        }
                        if (allMarks) {
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

        useEffect(() => {
            const panel = panelRef.current;
            if (!panel) return;

            const handleDragEnter = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isGuest) return;
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
                if (isGuest) { HFS.toast('Please login to upload files', 'info'); return; }

                const files = Array.from(e.dataTransfer.files);
                if (files.length === 0) {
                    HFS.toast('No files dropped', 'error');
                    return;
                }

                for (const file of files) {
                    if (file.size > 200 * 1024 * 1024) {
                        HFS.toast(`File "${file.name}" too large (max 200MB)`, 'error');
                        return;
                    }
                }

                try {
                    HFS.toast(`Uploading ${files.length} file(s)...`, 'info');

                    let allMarks = '';
                    for (const file of files) {
                        try {
                            const result = await uploadFile(file);
                            const displayName = result.displayName || result.name || file.name;
                            if (result.isImage) {
                                allMarks += `[img:${result.fileId}]`;
                            } else if (result.isVideo) {
                                allMarks += `[mov:${result.fileId}:${displayName}]`;
                            } else if (result.isAudio) {
                                allMarks += `[mov:${result.fileId}:${displayName}]`;
                            } else {
                                allMarks += `[att:${result.fileId}:${displayName}]`;
                            }
                        } catch (e) {
                            HFS.toast(`Failed to upload "${file.name}"`, 'error');
                        }
                    }

                    if (allMarks) {
                        if (globalEditingNoteTs && globalSetEditValue && globalEditTextareaRef && globalEditTextareaRef.current) {
                            const textarea = globalEditTextareaRef.current;
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const currentVal = globalEditValue;
                            const newVal = currentVal.slice(0, start) + allMarks + currentVal.slice(end);
                            globalSetEditValue(newVal);
                            globalEditValue = newVal;
                            setTimeout(() => {
                                textarea.focus();
                                const pos = start + allMarks.length;
                                textarea.setSelectionRange(pos, pos);
                            }, 50);
                        } else {
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

                    const searchBar = headerRef.current.nextElementSibling;
                    if (searchBar && searchBar.classList.contains('note-search-bar')) {
                        const nextTabs = searchBar.nextElementSibling;
                        if (nextTabs && nextTabs.classList.contains('note-tabs-container')) {
                            nextTabs.style.position = 'sticky';
                            nextTabs.style.top = (offsetTop + headerRef.current.offsetHeight + searchBar.offsetHeight) + 'px';
                            nextTabs.style.zIndex = '10';
                            nextTabs.style.background = 'var(--bg)';
                        }
                    } else {
                        const tabsContainer = searchBar?.nextElementSibling || headerRef.current.nextElementSibling;
                        if (tabsContainer && tabsContainer.classList.contains('note-tabs-container')) {
                            tabsContainer.style.position = 'sticky';
                            tabsContainer.style.top = (offsetTop + headerRef.current.offsetHeight) + 'px';
                            tabsContainer.style.zIndex = '10';
                            tabsContainer.style.background = 'var(--bg)';
                        }
                    }
                } else {
                    if (headerRef.current) {
                        headerRef.current.style.position = '';
                        headerRef.current.style.top = '';
                        headerRef.current.style.zIndex = '';
                        headerRef.current.style.background = '';
                    }
                    const containers = document.querySelectorAll('.note-tabs-container, .note-search-bar');
                    containers.forEach(el => {
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
            document.body.style.overflow = '';
            document.body.style.touchAction = '';
            document.body.style.overscrollBehavior = '';
            
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (loadNotesAbortControllerRef.current) {
                loadNotesAbortControllerRef.current.abort();
                loadNotesAbortControllerRef.current = null;
            }
            if (esRef.current) {
                esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
                esRef.current = null;
            }
            globalEditingNoteTs = null;
            globalEditingTab = null;
            globalEditTextareaRef = null;
            globalEditValue = '';
            globalSetEditValue = null;
            globalActiveTab = '';
            setEditingNoteTs(null);
            setClosing(true);
            setTimeout(onClose, 300);
        };

        const isDesktopDevice = useCallback(() => {
            return window.innerWidth > 768 && !('ontouchstart' in window);
        }, []);

        useEffect(() => {
            if (!isDesktopDevice()) return;

            const handleClickOutside = (e) => {
                const panel = panelRef.current;
                if (!panel || closing) return;

                const rect = panel.getBoundingClientRect();
                const margin = 100;

                const isOutside = (
                    e.clientX < rect.left - margin ||
                    e.clientX > rect.right + margin ||
                    e.clientY < rect.top - margin ||
                    e.clientY > rect.bottom + margin
                );

                if (isOutside) {
                    handleClose();
                }
            };

            document.addEventListener('click', handleClickOutside);

            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }, [closing, isDesktopDevice]);

        const toggleFullscreen = useCallback(() => {
            if (isMobile) {
                HFS.toast('Fullscreen mode not available on mobile', 'info');
                return;
            }

            const el = document.documentElement;

            if (!isFullscreenRef.current) {
                el.requestFullscreen?.()
                    .then(() => {
                        setIsFullscreen(true);
                        setFullscreenStarFilter(false);
                        setTimeout(() => {
                            const container = document.querySelector('.note-fullscreen-column-active .note-items.note-items-fullscreen');
                            if (container) {
                                container.scrollTop = container.scrollHeight;
                            }
                        }, 400);
                    })
                    .catch(err => {
                        HFS.toast("Enter fullscreen failed: " + err, 'error');
                    });
            } else {
                document.exitFullscreen?.();
                setIsFullscreen(false);
                setFullscreenStarFilter(false);
            }
        }, [isMobile]);

        const sanitizeText = useCallback((text) => {
            if (!text) return '';
            return text
                .replace(/\x00/g, '')
                .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                .replace(/\u200B/g, '')
                .replace(/[\u200C\u200D]/g, '')
                .replace(/\uFEFF/g, '')
                .replace(/[\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F]/g, '')
                .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
                .normalize('NFC');
        }, []);

        const handleSubmit = useCallback(() => {
            if (editingNoteTs) {
                HFS.toast('Please finish editing current note first', 'info');
                return;
            }
            const currentM = mRef.current;
            const currentTab = activeTabRef.current;
            const trim = currentM.trim();
            if (!trim) return;

            const doSend = async () => {
                try {
                    const sanitizedM = sanitizeText(trim);
                    if (!sanitizedM) return;

                    const res = await fetch('/~/api/notes/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ m: sanitizedM, tab: currentTab })
                    });
                    if (!res.ok) {
                        if (res.status === 429) HFS.toast('Please wait before adding another note', 'error');
                        if (res.status === 400) HFS.toast('Invalid input', 'error');
                        return;
                    }
                    const data = await res.json().catch(() => {});
                    if (data && data.warning) setStorageWarning(true);

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
        }, [sanitizeText, editingNoteTs]);

        // ===== 簡化版本 =====
const handleEdit = useCallback((ts, newText) => {
    const doEdit = async () => {
        try {
            const sanitizedText = sanitizeText(newText);
            if (!sanitizedText) return;

            const res = await fetch('/~/api/notes/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ts, tab: activeTab, m: sanitizedText })
            });
            if (!res.ok) {
                HFS.toast('Failed to update note', 'error');
            } else {
                // ===== 修復：模擬切換 tab 刷新列表 =====
                const currentTab = activeTabRef.current || activeTab;
                if (currentTab && filteredTabs.length > 1) {
                    const currentIndex = filteredTabs.indexOf(currentTab);
                    if (currentIndex !== -1) {
                        const nextTab = filteredTabs[(currentIndex + 1) % filteredTabs.length];
                        if (nextTab) {
                            setActiveTab(nextTab);
                            setTimeout(() => {
                                setActiveTab(currentTab);
                                try {
                                    localStorage.setItem(CACHE_ACTIVE_TAB, currentTab);
                                } catch {}
                            }, 50);
                        }
                    }
                }
                // ===== 修復結束 =====
            }
        } catch (e) {}
    };
    doEdit();
}, [activeTab, sanitizeText, filteredTabs]);

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
            if (isGuest) return;
            setRenamingTab(tab);
            setRenameValue(tabNames[tab] || '');
            setShowSortButtons(true);
        };

        const handleRenameSave = async () => {
            if (!renamingTab) return;
            const newName = renameValue.trim();
            const currentDisplayName = tabNames[renamingTab] || renamingTab;
            if (newName !== currentDisplayName) {
                try {
                    await fetch('/~/api/notes/rename-tab', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tab: renamingTab, newName: newName })
                    });
                } catch (e) {}
            }
            setRenamingTab(null);
            setShowSortButtons(false);
        };

        const handleRenameCancel = () => {
            setRenamingTab(null);
            setShowSortButtons(false);
        };

        const handleRenameKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRenameSave();
            } else if (e.key === 'Escape') {
                handleRenameCancel();
            }
        };

        const handleSortBtnMouseDown = (e) => {
            e.preventDefault();
        };

        const handleCategoryClick = (cat) => {
            if (cat === '') {
                if (activeCategory !== '') {
                    setActiveCategory('');
                    try {
                        localStorage.setItem(CACHE_ACTIVE_CATEGORY, '');
                    } catch {}
                    if (tabs.length > 0) {
                        setActiveTab(tabs[0]);
                    }
                }
                return;
            }
            
            const newCategory = cat === activeCategory ? '' : cat;
            setActiveCategory(newCategory);
            try {
                localStorage.setItem(CACHE_ACTIVE_CATEGORY, newCategory);
            } catch {}
            
            const tabsInCategory = tabs.filter(tab => (categories[tab] || '') === newCategory);
            if (tabsInCategory.length > 0) {
                setActiveTab(tabsInCategory[0]);
            } else if (tabs.length > 0) {
                setActiveTab(tabs[0]);
            }
        };

        const handleCategoryDoubleClick = (cat) => {
            if (isGuest) return;
            if (cat === '') {
                setShowCategorySort(prev => !prev);
                if (showCategorySort) {
                    const order = categoryList.filter(c => c !== '');
                    fetch('/~/api/notes/update-category-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order })
                    }).catch(() => {});
                    HFS.toast('Category sort order saved', 'success');
                } else {
                    HFS.toast('Double-click ◀ ▶ buttons to reorder categories', 'info');
                }
                return;
            }
            handleCategoryRenameStart(cat);
        };

        const handleCategoryRenameStart = (cat) => {
            if (isGuest || !cat) return;
            setRenamingCategory(cat);
            setRenameCategoryValue(categoryNames[cat] || cat);
            setTimeout(() => categoryRenameInputRef.current?.focus(), 50);
        };

        const handleCategoryRenameSave = async () => {
            if (!renamingCategory) return;
            const newName = renameCategoryValue.trim();
            
            if (newName === '') {
                setCategoryNames(prev => {
                    const updated = { ...prev };
                    delete updated[renamingCategory];
                    return updated;
                });
                try {
                    await fetch('/~/api/notes/update-category-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldCategory: renamingCategory, newCategory: renamingCategory })
                    });
                    HFS.toast(`Category name reset to "${renamingCategory}"`, 'info');
                } catch (e) {}
                setRenamingCategory(null);
                setRenameCategoryValue('');
                return;
            }
            
            if (newName !== (categoryNames[renamingCategory] || renamingCategory)) {
                try {
                    const res = await fetch('/~/api/notes/update-category-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oldCategory: renamingCategory, newCategory: newName })
                    });
                    if (res.ok) {
                        setCategoryNames(prev => {
                            const updated = { ...prev };
                            updated[renamingCategory] = newName;
                            return updated;
                        });
                        HFS.toast(`Category renamed to "${newName}"`, 'success');
                    } else {
                        HFS.toast('Failed to rename category', 'error');
                    }
                } catch (e) {
                    HFS.toast('Failed to rename category', 'error');
                }
            }
            setRenamingCategory(null);
            setRenameCategoryValue('');
        };

        const handleCategoryRenameCancel = () => {
            setRenamingCategory(null);
            setRenameCategoryValue('');
        };

        const handleCategoryRenameKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleCategoryRenameSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setRenamingCategory(null);
                setRenameCategoryValue('');
            }
        };

        const moveCategory = async (cat, direction) => {
            if (isGuest || !cat) return;
            const idx = categoryList.indexOf(cat);
            if (idx === -1) return;
            const target = direction === 'left' ? idx - 1 : idx + 1;
            if (target < 1 || target >= categoryList.length) return;
            
            const newOrder = [...categoryList.filter(c => c !== '')];
            const catIdx = newOrder.indexOf(cat);
            if (catIdx > -1) {
                newOrder.splice(catIdx, 1);
                newOrder.splice(target - 1, 0, cat);
            }
            setCategoryOrder(newOrder);
            try {
                localStorage.setItem(CACHE_CATEGORY_ORDER, JSON.stringify(newOrder));
            } catch {}
            
            try {
                await fetch('/~/api/notes/update-category-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ order: newOrder })
                });
            } catch (e) {}
        };

        const loadTabs = useCallback(() => {
            fetch('/~/api/notes/tabs')
                .then(r => r.json())
                .then(data => {
                    const tabsList = data.tabs || [];
                    setTabs(tabsList);
                    setTabCounts(data.counts || {});
                    setStorageWarning(data.warning || false);
                    setTabNames(data.tabNames || {});
                    setCategories(data.categories || {});
                    setCategoryNames(data.categoryNames || {});
                    
                    const categoryOrderFromServer = data.categoryOrder || [];
                    if (categoryOrderFromServer.length > 0) {
                        setCategoryOrder(categoryOrderFromServer);
                        try {
                            localStorage.setItem(CACHE_CATEGORY_ORDER, JSON.stringify(categoryOrderFromServer));
                        } catch {}
                    }
                    
                    const currentTab = activeTabRef.current;
                    const currentCategory = activeCategory;
                    
                    if (currentTab && tabsList.includes(currentTab)) {
                        const tabCategory = (data.categories || {})[currentTab] || '';
                        if (!currentCategory || tabCategory === currentCategory || currentCategory === '') {
                            setActiveTab(currentTab);
                            try {
                                localStorage.setItem(CACHE_ACTIVE_TAB, currentTab);
                            } catch {}
                            return;
                        }
                    }
                    
                    const cachedTab = localStorage.getItem(CACHE_ACTIVE_TAB);
                    const cachedCategory = localStorage.getItem(CACHE_ACTIVE_CATEGORY) || '';
                    
                    if (cachedCategory) {
                        const tabsInCategory = tabsList.filter(tab => (data.categories || {})[tab] === cachedCategory);
                        if (tabsInCategory.length > 0) {
                            if (cachedTab && tabsInCategory.includes(cachedTab)) {
                                setActiveTab(cachedTab);
                            } else {
                                setActiveTab(tabsInCategory[0]);
                            }
                            setActiveCategory(cachedCategory);
                            return;
                        }
                    }
                    
                    if (tabsList.length > 0) {
                        setActiveTab(tabsList[0]);
                    }
                    
                    if (data.isGuest !== undefined) {
                        isGuest = data.isGuest;
                    }
                })
                .catch(e => {});
        }, [activeCategory]);

        const loadNotes = useCallback(async (tab, append = false) => {
            if (!tab) return;

            if (loadNotesAbortControllerRef.current) {
                loadNotesAbortControllerRef.current.abort();
            }

            const controller = new AbortController();
            loadNotesAbortControllerRef.current = controller;

            let offset = 0;
            if (append) {
                offset = currentOffsetRef.current;
            }

            const isFullscreenTab = isFullscreen && tab !== activeTab;

            try {
                const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=${offset}&limit=${PAGE_SIZE}&summary=1`, {
                    signal: controller.signal
                });
                const data = await res.json();

                const rawNotes = data.notes || {};
                const sortedKeys = Object.keys(rawNotes).sort();
                const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));

                const newThumbMap = data.thumbMap || {};
                const newFileNames = data.fileNames || {};
                const newThumbFormat = data.thumbFormat || 'jpg';

                const returnedCount = sortedKeys.length;
                let newHasMore = false;
                if (data.hasMore !== undefined) {
                    newHasMore = data.hasMore;
                } else {
                    newHasMore = returnedCount >= PAGE_SIZE;
                }
                if (returnedCount === 0) {
                    newHasMore = false;
                }

                if (append) {
                    if (isFullscreenTab) {
                        setOtherTabData(prev => {
                            const existingTs = new Set((prev[tab]?.notes || []).map(n => n.ts));
                            const newNotes = notesWithTab.filter(n => !existingTs.has(n.ts));
                            const newOffset = (prev[tab]?.offset || 0) + notesWithTab.length;
                            return {
                                ...prev,
                                [tab]: {
                                    ...prev[tab],
                                    notes: [...newNotes, ...(prev[tab]?.notes || [])],
                                    offset: newOffset,
                                    hasMore: newHasMore,
                                    thumbMap: { ...prev[tab]?.thumbMap, ...newThumbMap },
                                    fileNames: { ...prev[tab]?.fileNames, ...newFileNames },
                                    thumbFormat: newThumbFormat
                                }
                            };
                        });
                        setFullscreenLoadState(prev => ({
                            ...prev,
                            [tab]: {
                                offset: (prev[tab]?.offset || 0) + notesWithTab.length,
                                hasMore: newHasMore,
                                loading: false
                            }
                        }));
                    } else {
                        setNotes(prev => {
                            const existingTs = new Set(prev.map(n => n.ts));
                            const newNotes = notesWithTab.filter(n => !existingTs.has(n.ts));
                            const combined = [...newNotes, ...prev];
                            tabCacheRef.current[tab] = {
                                notes: combined,
                                thumbMap: { ...thumbMap, ...newThumbMap },
                                attNames: { ...attNames, ...newFileNames },
                                hasMore: newHasMore,
                                offset: offset + notesWithTab.length,
                                timestamp: Date.now(),
                                thumbFormat: newThumbFormat
                            };
                            return combined;
                        });
                        setThumbMap(prev => ({ ...prev, ...newThumbMap }));
                        setAttNames(prev => ({ ...prev, ...newFileNames }));
                    }
                } else {
                    if (isFullscreenTab) {
                        setOtherTabData(prev => ({
                            ...prev,
                            [tab]: {
                                notes: notesWithTab,
                                offset: notesWithTab.length,
                                hasMore: newHasMore,
                                thumbMap: newThumbMap,
                                fileNames: newFileNames,
                                thumbFormat: newThumbFormat
                            }
                        }));
                        setFullscreenLoadState(prev => ({
                            ...prev,
                            [tab]: {
                                offset: notesWithTab.length,
                                hasMore: newHasMore,
                                loading: false
                            }
                        }));
                    } else {
                        setNotes(notesWithTab);
                        setThumbMap(newThumbMap);
                        setAttNames(newFileNames);
                        tabCacheRef.current[tab] = {
                            notes: notesWithTab,
                            thumbMap: newThumbMap,
                            attNames: newFileNames,
                            hasMore: newHasMore,
                            offset: notesWithTab.length,
                            timestamp: Date.now(),
                            thumbFormat: newThumbFormat
                        };
                    }
                }

                setThumbFormat(newThumbFormat);

                if (!isFullscreenTab) {
                    setHasMore(newHasMore);
                    setCurrentOffset(offset + notesWithTab.length);
                }

                return newHasMore;
            } catch (e) {
                if (e.name === 'AbortError') {}
            } finally {
                if (loadNotesAbortControllerRef.current === controller) {
                    loadNotesAbortControllerRef.current = null;
                }
            }
        }, [thumbMap, attNames, isFullscreen, activeTab]);

        const searchAllNotes = useCallback(async (tab, searchTerm) => {
            if (!tab || !searchTerm || isSearchingAll) return;

            setSearchResults([]);
            setSearchLoadedAll(false);
            setSearchProgress(0);
            setIsSearchingAll(true);

            let offset = 0;
            let hasMore = true;
            let totalLoaded = 0;
            let matchedNotes = [];

            const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');

            try {
                while (hasMore && !loadNotesAbortControllerRef.current?.signal?.aborted) {
                    const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=${offset}&limit=${PAGE_SIZE}&summary=1`);
                    const data = await res.json();

                    const rawNotes = data.notes || {};
                    const sortedKeys = Object.keys(rawNotes).sort();
                    const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));

                    for (const note of notesWithTab) {
                        const text = note.m || note.s || '';
                        if (text && regex.test(text)) {
                            regex.lastIndex = 0;
                            matchedNotes.push(note);
                        }
                    }

                    totalLoaded += notesWithTab.length;
                    setSearchProgress(totalLoaded);
                    setSearchResults([...matchedNotes]);

                    const returnedCount = sortedKeys.length;
                    if (data.hasMore !== undefined) {
                        hasMore = data.hasMore;
                    } else {
                        hasMore = returnedCount >= PAGE_SIZE;
                    }
                    if (returnedCount === 0) {
                        hasMore = false;
                    }

                    offset += notesWithTab.length;
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } catch (e) {
                if (e.name === 'AbortError') {}
            } finally {
                setIsSearchingAll(false);
                setSearchLoadedAll(true);
            }
        }, [isSearchingAll]);

        const loadOtherTabNotes = useCallback(async (tab) => {
            if (!tab) return;
            try {
                const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=0&limit=${PAGE_SIZE}&summary=1`);
                const data = await res.json();
                const rawNotes = data.notes || {};
                const sortedKeys = Object.keys(rawNotes).sort();
                const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));

                const returnedCount = notesWithTab.length;
                let hasMoreData = false;
                if (data.hasMore !== undefined) {
                    hasMoreData = data.hasMore;
                } else {
                    hasMoreData = returnedCount >= PAGE_SIZE;
                }
                if (returnedCount === 0) {
                    hasMoreData = false;
                }

                setOtherTabData(prev => ({
                    ...prev,
                    [tab]: {
                        notes: notesWithTab,
                        offset: notesWithTab.length,
                        hasMore: hasMoreData,
                        thumbMap: data.thumbMap || {},
                        fileNames: data.fileNames || {},
                        thumbFormat: data.thumbFormat || 'jpg'
                    }
                }));
                setFullscreenLoadState(prev => ({
                    ...prev,
                    [tab]: {
                        offset: notesWithTab.length,
                        hasMore: hasMoreData,
                        loading: false
                    }
                }));
            } catch (e) {}
        }, []);

        const getFullscreenColumns = useCallback(() => {
            if (!isFullscreen || isMobile) return [];

            let tabsInCategory;
            if (!activeCategory) {
                tabsInCategory = tabs;
            } else if (activeCategory === '') {
                tabsInCategory = tabs;
            } else {
                tabsInCategory = tabs.filter(tab => (categories[tab] || '') === activeCategory);
            }

            if (tabsInCategory.length === 0) {
                tabsInCategory = tabs;
            }

            const activeIdx = tabsInCategory.indexOf(activeTab);
            if (activeIdx === -1) {
                return tabsInCategory.slice(0, 3);
            }

            const result = [];
            for (let i = 0; i < 3; i++) {
                const idx = (activeIdx + i) % tabsInCategory.length;
                result.push(tabsInCategory[idx]);
            }
            return result;
        }, [isFullscreen, isMobile, tabs, activeTab, activeCategory, categories]);

        const fullscreenColumns = useMemo(() => {
            return getFullscreenColumns();
        }, [getFullscreenColumns]);

        useEffect(() => {
            if (isFullscreen && !isMobile) {
                const tabsToLoad = filteredTabs.filter(tab => tab !== activeTab);
                tabsToLoad.forEach(tab => {
                    loadOtherTabNotes(tab);
                    setFullscreenLoadState(prev => ({
                        ...prev,
                        [tab]: {
                            offset: 0,
                            hasMore: false,
                            loading: false
                        }
                    }));
                });
            }
        }, [isFullscreen, filteredTabs, activeTab, isMobile, loadOtherTabNotes]);

        useEffect(() => {
            if (!isFullscreen || isMobile) return;

            const timer = setTimeout(() => {
                const container = document.querySelector('.note-fullscreen-column-active .note-items.note-items-fullscreen');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            }, 50);

            return () => clearTimeout(timer);
        }, [notes, isFullscreen, isMobile]);

        const doLoadMore = useCallback(() => {
            if (isLoadingMoreRef.current || !hasMoreRef.current || searchTerm) return;

            shouldAutoScrollRef.current = false;

            const el = listRef.current;
            isLoadingMoreRef.current = true;
            setLoadingMore(true);
            if (el) {
                scrollRestoreRef.current = el.scrollHeight;
            }

            loadNotes(activeTabRef.current, true).finally(() => {
                setLoadingMore(false);
                isLoadingMoreRef.current = false;

                requestAnimationFrame(() => {
                    if (listRef.current) {
                        const newScrollHeight = listRef.current.scrollHeight;
                        const heightDiff = newScrollHeight - scrollRestoreRef.current;
                        listRef.current.scrollTop = heightDiff;

                        if (hasMoreRef.current && listRef.current.scrollHeight <= listRef.current.clientHeight + 200) {
                            setTimeout(() => doLoadMore(), 300);
                        }
                    }
                });
            });
        }, [searchTerm, loadNotes]);

        const loadMoreFullscreenTab = useCallback(async (tab) => {
            if (!isFullscreenRef.current) return;
            if (tab === activeTabRef.current) {
                if (!isLoadingMoreRef.current && hasMoreRef.current && !searchTerm) {
                    doLoadMore();
                }
                return;
            }

            const currentData = otherTabData[tab];
            if (!currentData) return;

            if (fullscreenLoadState[tab]?.loading) return;
            if (fullscreenLoadState[tab]?.hasMore === false) return;

            const hasMoreData = fullscreenLoadState[tab]?.hasMore !== undefined ?
                fullscreenLoadState[tab].hasMore :
                currentData.hasMore;
            if (!hasMoreData) return;

            setFullscreenLoadState(prev => ({
                ...prev,
                [tab]: { ...prev[tab], loading: true }
            }));

            try {
                const offset = currentData.offset || 0;
                const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=${offset}&limit=${PAGE_SIZE}&summary=1`);
                const data = await res.json();

                const rawNotes = data.notes || {};
                const sortedKeys = Object.keys(rawNotes).sort();
                const returnedCount = sortedKeys.length;

                if (returnedCount === 0) {
                    setFullscreenLoadState(prev => ({
                        ...prev,
                        [tab]: { ...prev[tab], hasMore: false, loading: false }
                    }));
                    return;
                }

                let newHasMore = false;
                if (data.hasMore !== undefined) {
                    newHasMore = data.hasMore;
                } else {
                    newHasMore = returnedCount >= PAGE_SIZE;
                }

                const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));
                const newThumbMap = data.thumbMap || {};
                const newFileNames = data.fileNames || {};
                const newThumbFormat = data.thumbFormat || 'jpg';

                setOtherTabData(prev => {
                    const existingTs = new Set((prev[tab]?.notes || []).map(n => n.ts));
                    const newNotes = notesWithTab.filter(n => !existingTs.has(n.ts));
                    const newOffset = (prev[tab]?.offset || 0) + notesWithTab.length;
                    return {
                        ...prev,
                        [tab]: {
                            ...prev[tab],
                            notes: [...newNotes, ...(prev[tab]?.notes || [])],
                            offset: newOffset,
                            hasMore: newHasMore,
                            thumbMap: { ...prev[tab]?.thumbMap, ...newThumbMap },
                            fileNames: { ...prev[tab]?.fileNames, ...newFileNames },
                            thumbFormat: newThumbFormat
                        }
                    };
                });

                setFullscreenLoadState(prev => {
                    const newOffset = (prev[tab]?.offset || 0) + notesWithTab.length;
                    return {
                        ...prev,
                        [tab]: {
                            offset: newOffset,
                            hasMore: newHasMore,
                            loading: false
                        }
                    };
                });

                setThumbFormat(newThumbFormat);
            } catch (e) {
                setFullscreenLoadState(prev => ({
                    ...prev,
                    [tab]: { ...prev[tab], loading: false }
                }));
            }
        }, [otherTabData, fullscreenLoadState, activeTabRef, isFullscreenRef, searchTerm, doLoadMore]);

        const setupSentinelObserver = useCallback(() => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }

            const el = listRef.current;
            const sentinel = sentinelRef.current;
            if (!el || !sentinel || !hasMore || searchTerm) return;

            observerRef.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current && !searchTerm) {
                    doLoadMore();
                }
            }, {
                root: el,
                rootMargin: '300px 0px 0px 0px',
                threshold: 0
            });

            observerRef.current.observe(sentinel);
        }, [hasMore, searchTerm, doLoadMore]);

        useEffect(() => {
            setupSentinelObserver();
            return () => {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                }
            };
        }, [setupSentinelObserver]);

        useEffect(() => {
            loadTabs();

            return () => {
                if (esRef.current) {
                    esRef.current.then?.(v => v?.close?.()).catch?.(() => {});
                    esRef.current = null;
                }
                if (observerRef.current) {
                    observerRef.current.disconnect();
                    observerRef.current = null;
                }
                if (loadNotesAbortControllerRef.current) {
                    loadNotesAbortControllerRef.current.abort();
                    loadNotesAbortControllerRef.current = null;
                }
            };
        }, []);

        useEffect(() => {
            if (!listRef.current) return;
            if (!shouldAutoScrollRef.current) return;

            const container = listRef.current;
            const images = container.querySelectorAll('img');

            if (images.length === 0) {
                requestAnimationFrame(() => {
                    container.scrollTop = container.scrollHeight;
                });
                return;
            }

            const imageLoadPromises = Array.from(images).map(img => {
                if (img.complete) {
                    return Promise.resolve();
                }
                return new Promise(resolve => {
                    img.addEventListener('load', resolve, { once: true });
                    img.addEventListener('error', resolve, { once: true });
                });
            });

            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));

            Promise.race([
                Promise.all(imageLoadPromises),
                timeoutPromise
            ]).then(() => {
                requestAnimationFrame(() => {
                    if (container && shouldAutoScrollRef.current) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            });
        }, [notes]);

        const displayNotes = useMemo(() => {
            if (searchTerm.trim()) {
                let notesToShow = searchResults;
                if (starFilterActive) {
                    notesToShow = notesToShow.filter(n => n.starred);
                }
                return notesToShow;
            }
            return starFilterActive ? notes.filter(n => n.starred) : notes;
        }, [notes, starFilterActive, searchTerm, searchResults]);

        const fullscreenActiveNotes = useMemo(() => {
            return fullscreenStarFilter ? notes.filter(n => n.starred) : notes;
        }, [notes, fullscreenStarFilter]);

        const { filteredNotes, totalMatches, noteMatchMap } = useMemo(() => {
            if (!searchTerm) return { filteredNotes: displayNotes, totalMatches: 0, noteMatchMap: new Map() };

            const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            const filtered = [];
            const matchMap = new Map();
            let total = 0;

            const notesToSearch = searchTerm.trim() ? searchResults : displayNotes;

            for (const note of notesToSearch) {
                const text = note.m || note.s || '';
                if (!text) continue;
                regex.lastIndex = 0;
                const matches = (text.match(regex) || []).length;
                if (matches > 0) {
                    filtered.push(note);
                    matchMap.set(note, matches);
                    total += matches;
                }
            }

            return { filteredNotes: filtered, totalMatches: total, noteMatchMap: matchMap };
        }, [displayNotes, searchTerm, searchResults]);

        useEffect(() => {
            setVisibleItems(new Set());

            if (revealTimerRef.current) {
                clearTimeout(revealTimerRef.current);
                revealTimerRef.current = null;
            }

            const notesList = filteredNotes;
            if (notesList.length === 0) return;

            if (listRef.current) {
                listRef.current.classList.add('no-transition');
            }

            requestAnimationFrame(() => {
                let index = 0;
                const revealNext = () => {
                    if (index >= notesList.length) {
                        if (listRef.current) {
                            listRef.current.classList.remove('no-transition');
                        }
                        if (listRef.current && shouldAutoScrollRef.current) {
                            listRef.current.scrollTop = listRef.current.scrollHeight;
                        }
                        return;
                    }

                    setVisibleItems(prev => {
                        const newSet = new Set(prev);
                        const note = notesList[index];
                        if (note && note.ts) {
                            newSet.add(note.ts);
                        }
                        return newSet;
                    });

                    index++;
                    revealTimerRef.current = setTimeout(revealNext, 60);
                };

                revealTimerRef.current = setTimeout(revealNext, 30);
            });

            return () => {
                if (revealTimerRef.current) {
                    clearTimeout(revealTimerRef.current);
                    revealTimerRef.current = null;
                }
            };
        }, [filteredNotes]);

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
            if (isGuest) { HFS.toast('Please login to manage tabs', 'info'); return; }
            const idx = filteredTabs.indexOf(tab);
            if (idx === -1) return;

            const target = direction === 'left' ? idx - 1 : idx + 1;
            if (target < 0 || target >= filteredTabs.length) return;

            const newTabs = [...tabs];
            const currentIdx = tabs.indexOf(tab);
            const targetTab = filteredTabs[target];
            const targetIdx = tabs.indexOf(targetTab);
            [newTabs[currentIdx], newTabs[targetIdx]] = [newTabs[targetIdx], newTabs[currentIdx]];
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
            if (isFullscreen) {
                if (tab === activeTab) {
                    setFullscreenStarFilter(prev => !prev);
                } else {
                    setActiveTab(tab);
                    setFullscreenStarFilter(false);
                    try {
                        localStorage.setItem(CACHE_ACTIVE_TAB, tab);
                    } catch {}
                    setTimeout(() => {
                        const container = document.querySelector('.note-fullscreen-column-active .note-items.note-items-fullscreen');
                        if (container) {
                            container.scrollTop = container.scrollHeight;
                        }
                    }, 150);
                }
                return;
            }

            if (tab === activeTab) {
                if (isGuest) {
                    setStarFilterActive(prev => !prev);
                    return;
                }

                const now = Date.now();
                const lastClickTime = tabClickTimerRef.current[tab] || 0;
                const currentCount = tabClickCountRef.current[tab] || 0;

                if (tabClickTimerRef.current[`timeout_${tab}`]) {
                    clearTimeout(tabClickTimerRef.current[`timeout_${tab}`]);
                }

                if (now - lastClickTime < 400) {
                    const newCount = currentCount + 1;
                    tabClickCountRef.current[tab] = newCount;
                    setTabClickCount(prev => ({ ...prev, [tab]: newCount }));

                    if (newCount >= 2) {
                        tabClickCountRef.current[tab] = 0;
                        setTabClickCount(prev => ({ ...prev, [tab]: 0 }));
                        tabClickTimerRef.current[tab] = 0;
                        handleRenameStart(tab);
                        return;
                    }
                } else {
                    tabClickCountRef.current[tab] = 0;
                    setTabClickCount(prev => ({ ...prev, [tab]: 0 }));
                }

                tabClickTimerRef.current[tab] = now;

                tabClickTimerRef.current[`timeout_${tab}`] = setTimeout(() => {
                    if (tabClickCountRef.current[tab] < 2) {
                        setStarFilterActive(prev => !prev);
                    }
                    tabClickCountRef.current[tab] = 0;
                    setTabClickCount(prev => ({ ...prev, [tab]: 0 }));
                }, 600);

            } else {
                setActiveTab(tab);
                try {
                    localStorage.setItem(CACHE_ACTIVE_TAB, tab);
                } catch {}
            }
        };

        const handleEditingChange = useCallback((ts) => {
            setEditingNoteTs(ts);
            if (ts) {
                setSearchTerm('');
                setShowSearch(false);
                setSearchResults([]);
                setSearchLoadedAll(false);
                setSearchProgress(0);
                setIsSearchingAll(false);
                if (loadNotesAbortControllerRef.current) {
                    loadNotesAbortControllerRef.current.abort();
                    loadNotesAbortControllerRef.current = null;
                }
            }
        }, []);

        const dragOverlayContent = isGuest ? 'Please login to upload files' : 'Drop files to upload (multi-file supported)';

        const isEditingMode = !isFullscreen && editingNoteTs !== null;

        // ========== 渲染面板 ==========
        return h('div', {
            className: `note-panel ${isMobile ? 'note-mobile' : 'note-desktop'} ${closing ? 'note-closing' : ''} ${isDragging ? 'note-dragging' : ''} ${isFullscreen ? 'note-fullscreen' : ''}`,
            style: { fontSize: fontSize + 'px', overscrollBehavior: 'contain' },
            ref: panelRef
        },
            isDragging && h('div', { className: 'note-drag-overlay' },
                h('div', { className: 'note-drag-overlay-content' }, dragOverlayContent)
            ),
            // ========== 全屏模式头部 ==========
            isFullscreen ? h('div', {
                className: 'note-panel-header',
                ref: headerRef
            },
                h('div', { className: 'note-header-left' },
                    h('span', {
                        className: 'note-panel-title',
                        onClick: toggleFullscreen,
                        title: 'Click to exit fullscreen'
                    }, 'Notes'),
                    h('span', { className: 'note-fullscreen-indicator' }, ' \u229E'),
                    fullscreenStarFilter && h('span', { className: 'note-star-filter-indicator' }, '\u2605')
                ),
                h('div', { className: 'note-fullscreen-categories' },
                    categoryList.map((cat, idx) => {
                        const isActive = activeCategory === cat;
                        const displayName = getCategoryDisplayName(cat);
                        
                        if (renamingCategory === cat) {
                            return h('input', {
                                key: `rename-cat-${cat || 'all'}`,
                                ref: categoryRenameInputRef,
                                className: 'note-category-rename-input',
                                value: renameCategoryValue,
                                onChange: (e) => setRenameCategoryValue(e.target.value),
                                onKeyDown: handleCategoryRenameKeyDown,
                                onBlur: handleCategoryRenameSave,
                                placeholder: displayName || 'All'
                            });
                        }
                        
                        return h('span', {
                            key: cat || 'all',
                            className: `note-category-tab ${isActive ? 'note-category-tab-active' : ''}`,
                            onClick: () => handleCategoryClick(cat),
                            onDoubleClick: () => handleCategoryDoubleClick(cat),
                            onMouseEnter: (e) => {
                                if (renamingCategory !== cat) {

                                    e.currentTarget.style.background = 'transparent';
                                }
                            },
                            onMouseLeave: (e) => {
                                if (renamingCategory !== cat && !isActive) {

                                    e.currentTarget.style.background = 'transparent';
                                }
                            },
                            title: cat ? 
                                (isGuest ? '' : 'Double-click to rename') : 
                                (isGuest ? 'Show all tabs' : 'Double-click to sort categories')
                        }, [
                            displayName,
                            !isGuest && cat !== '' && showCategorySort && h('span', {
                                onMouseDown: (e) => e.stopPropagation()
                            },
                                h('button', {
                                    className: 'note-category-sort-btn',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        moveCategory(cat, 'left');
                                    },
                                    disabled: idx <= 1,
                                    title: 'Move left'
                                }, '\u25C0'),
                                h('button', {
                                    className: 'note-category-sort-btn',
                                    onClick: (e) => {
                                        e.stopPropagation();
                                        moveCategory(cat, 'right');
                                    },
                                    disabled: idx >= categoryList.length - 1,
                                    title: 'Move right'
                                }, '\u25B6\uFE0E')
                            )
                        ]);
                    })
                ),
                h('div', { className: 'note-fullscreen-tabs' },
                    filteredTabs.length > 0 ?
                        filteredTabs.map((tab, i) =>
                            h('span', { key: tab, className: 'note-tab-wrapper' },
                                i > 0 && h('span', { className: 'note-tab-sep' }, '|'),
                                h('button', {
                                    className: `note-tab ${activeTab === tab ? 'note-tab-active' : ''} ${fullscreenStarFilter && activeTab === tab ? 'note-tab-star-mode' : ''}`,
                                    onClick: () => handleTabClick(tab),
                                    title: activeTab === tab ? (fullscreenStarFilter ? 'Click to exit star filter' : 'Click to filter starred') : 'Click to select tab'
                                }, getTabDisplayName(tab))
                            )
                        ) :
                        h('span', { className: 'note-empty-text' }, 'No tabs')
                ),
                h('div', { className: 'note-header-right' },
                    h('button', { 
                        className: 'note-close-btn', 
                        onClick: handleClose
                    }, '\u00D7')
                )
            ) :
            // ========== 非全屏模式头部 ==========
            h('div', {
                className: 'note-panel-header',
                ref: headerRef
            },
                h('div', { className: 'note-header-left' },
                    h('span', {
                        className: 'note-panel-title',
                        onClick: toggleFullscreen,
                        title: isFullscreen ? 'Click to exit fullscreen' : (isMobile ? 'Fullscreen not available on mobile' : 'Click to enter fullscreen')
                    }, isGuest ? 'Notes (Guest)' : 'Notes'),
                    !isGuest && !isFullscreen && h('div', { className: 'note-font-btns-header' },
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
                    storageWarning && h('span', { className: 'note-warn-icon', title: 'Storage limit approaching' }, '\u26A0'),
                    !isFullscreen && h('div', { className: 'note-header-categories' },
                        categoryList.map((cat, idx) => {
                            const isActive = activeCategory === cat;
                            const displayName = getCategoryDisplayName(cat);
                            
                            if (renamingCategory === cat) {
                                return h('input', {
                                    key: `rename-cat-${cat || 'all'}`,
                                    ref: categoryRenameInputRef,
                                    className: 'note-category-rename-input',
                                    value: renameCategoryValue,
                                    onChange: (e) => setRenameCategoryValue(e.target.value),
                                    onKeyDown: handleCategoryRenameKeyDown,
                                    onBlur: handleCategoryRenameSave,
                                    placeholder: displayName || 'All'
                                });
                            }
                            
                            return h('span', {
                                key: cat || 'all',
                                className: `note-category-tab ${isActive ? 'note-category-tab-active' : ''}`,
                                onClick: () => handleCategoryClick(cat),
                                onDoubleClick: () => handleCategoryDoubleClick(cat),
                                onMouseEnter: (e) => {
                                    if (renamingCategory !== cat) {

                                        e.currentTarget.style.background = 'transparent';
                                    }
                                },
                                onMouseLeave: (e) => {
                                    if (renamingCategory !== cat && !isActive) {

                                        e.currentTarget.style.background = 'transparent';
                                    }
                                },
                                title: cat ? 
                                    (isGuest ? '' : 'Double-click to rename') : 
                                    (isGuest ? 'Show all tabs' : 'Double-click to sort categories')
                            }, [
                                displayName,
                                !isGuest && cat !== '' && showCategorySort && h('span', {
                                    onMouseDown: (e) => e.stopPropagation()
                                },
                                    h('button', {
                                        className: 'note-category-sort-btn',
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            moveCategory(cat, 'left');
                                        },
                                        disabled: idx <= 1,
                                        title: 'Move left'
                                    }, '\u25C0'),
                                    h('button', {
                                        className: 'note-category-sort-btn',
                                        onClick: (e) => {
                                            e.stopPropagation();
                                            moveCategory(cat, 'right');
                                        },
                                        disabled: idx >= categoryList.length - 1,
                                        title: 'Move right'
                                    }, '\u25B6\uFE0E')
                                )
                            ]);
                        })
                    )
                ),
                h('div', { className: 'note-header-right' },
                    !isFullscreen && !isEditingMode && h('button', {
                        className: 'note-search-toggle',
                        onClick: () => {
                            setShowSearch(!showSearch);
                            if (showSearch) setSearchTerm('');
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        },
                        title: 'Search'
                    }, '\u24E2'),
                    !isFullscreen && searchTerm && h('span', { className: 'note-header-stats' },
                        `${filteredNotes.length} notes / ${totalMatches} matches`
                    ),
                    h('button', { className: 'note-close-btn', onClick: handleClose }, '\u00D7')
                )
            ),
            // 搜索栏 - 编辑模式下隐藏
            showSearch && !isFullscreen && !isEditingMode && h('div', { className: 'note-search-bar' },
                h('input', {
                    ref: searchInputRef,
                    value: searchTerm,
                    onChange: async (e) => {
                        const term = e.target.value;
                        setSearchTerm(term);

                        if (loadNotesAbortControllerRef.current) {
                            loadNotesAbortControllerRef.current.abort();
                            loadNotesAbortControllerRef.current = null;
                        }

                        if (term.trim()) {
                            setSearchResults([]);
                            setSearchLoadedAll(false);
                            setSearchProgress(0);
                            searchAllNotes(activeTabRef.current, term.trim());
                        } else {
                            setSearchResults([]);
                            setSearchLoadedAll(false);
                            setSearchProgress(0);
                            setIsSearchingAll(false);
                        }
                    },
                    placeholder: 'Search notes... (searches all history)',
                    className: 'note-search-input'
                }),
                searchTerm.trim() && h('div', { className: 'note-search-status' },
                    isSearchingAll && h('span', { className: 'note-search-progress' },
                        `\u231B Searching... scanned ${searchProgress} notes`
                    ),
                    !isSearchingAll && searchLoadedAll && h('span', { className: 'note-search-result-count' },
                        `Found ${searchResults.length} matches in ${searchProgress} notes`
                    ),
                    !isSearchingAll && !searchLoadedAll && searchResults.length > 0 && h('span', { className: 'note-search-result-count' },
                        `Found ${searchResults.length} matches`
                    )
                ),
                !isSearchingAll && searchLoadedAll && searchResults.length === 0 && searchTerm.trim() &&
                h('span', { className: 'note-search-no-result' }, 'No matches found'),
                isSearchingAll && h('button', {
                    className: 'note-search-cancel-btn',
                    onClick: () => {
                        if (loadNotesAbortControllerRef.current) {
                            loadNotesAbortControllerRef.current.abort();
                            loadNotesAbortControllerRef.current = null;
                        }
                        setIsSearchingAll(false);
                        setSearchLoadedAll(true);
                        if (searchResults.length === 0) {
                            setSearchTerm('');
                        }
                    },
                    title: 'Cancel search'
                }, '\u2715'),
                searchTerm.trim() && searchResults.length > 0 && h('span', { className: 'note-search-nav' },
                    h('button', {
                        className: 'note-search-nav-btn',
                        onClick: goToPrevMatch,
                        title: 'Previous'
                    }, '\u25B2'),
                    h('span', { className: 'note-search-nav-num' }, `${currentMatch + 1}/${totalMatches}`),
                    h('button', {
                        className: 'note-search-nav-btn',
                        onClick: goToNextMatch,
                        title: 'Next'
                    }, '\u25BC\uFE0E')
                )
            ),
            // Tab容器 - 编辑模式下隐藏
            !isFullscreen && !isEditingMode && h('div', { className: 'note-tabs-container' },
                h('div', { className: 'note-tabs' },
                    filteredTabs.length > 0 ?
                        filteredTabs.map((tab, i) =>
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
                                    title: activeTab === tab ? (starFilterActive ? 'Click to exit star filter' : 'Click to filter starred') : (isGuest ? '' : 'Triple-click to rename')
                                }, getTabDisplayName(tab))
                            )
                        ) :
                        h('div', { className: 'note-empty-text' }, 'No tabs in this category')
                ),
                showSortButtons && filteredTabs.length > 0 && h('div', { className: 'note-tab-sort' },
                    h('button', {
                        className: 'note-sort-btn',
                        onMouseDown: handleSortBtnMouseDown,
                        onClick: () => moveTab(activeTab, 'left'),
                        disabled: filteredTabs.indexOf(activeTab) <= 0,
                        title: 'Move left'
                    }, '\u25C0'),
                    h('button', {
                        className: 'note-sort-btn',
                        onMouseDown: handleSortBtnMouseDown,
                        onClick: () => {
                            moveTab(activeTab, 'right');
                            setTimeout(() => {
                                const currentTab = activeTabRef.current;
                                handleRenameStart(currentTab);
                            }, 50);
                        },
                        disabled: filteredTabs.indexOf(activeTab) >= filteredTabs.length - 1,
                        title: 'Move right'
                    }, '\u25B6\uFE0E')
                )
            ),
            isFullscreen ?
                h('div', {
                    className: 'note-fullscreen-grid',
                    ref: fullscreenGridRef
                },
                    (isMobile ? [activeTab] : fullscreenColumns).map((tab, colIdx) => {
                        const isActive = tab === activeTab;
                        const tabData = isActive ?
                            { notes: fullscreenActiveNotes, thumbMap, fileNames: attNames, thumbFormat } :
                            (otherTabData[tab] || { notes: [], thumbMap: {}, fileNames: {}, thumbFormat: 'jpg' });

                        const loadState = fullscreenLoadState[tab] || { offset: 0, hasMore: false, loading: false };
                        const hasMoreData = isActive ? hasMore : (tabData.hasMore !== undefined ? tabData.hasMore : loadState.hasMore);
                        const isLoading = isActive ? loadingMore : (loadState.loading || false);

                        return h('div', {
                            className: `note-fullscreen-column ${isActive ? 'note-fullscreen-column-active' : ''}`,
                            key: tab
                        },
                            isMobile && h('div', { className: 'note-column-title' }, getTabDisplayName(tab)),
                            isActive && fullscreenStarFilter && h('div', { className: 'note-star-filter-banner' }, '\u2605 Showing starred notes only'),
                            h('div', {
                                className: 'note-items note-items-fullscreen',
                            },
                                hasMoreData && h('div', {
                                    className: `note-loading-indicator note-fullscreen-loading${isLoading ? ' is-loading' : ''}`,
                                    onClick: isLoading ? undefined : () => {
                                        if (isActive) {
                                            if (!isLoadingMoreRef.current && hasMoreRef.current && !searchTerm) {
                                                doLoadMore();
                                            }
                                        } else {
                                            loadMoreFullscreenTab(tab);
                                        }
                                    }
                                }, isLoading ? '\u25B2 Loading older notes...' : '\u25B2 Load older notes'),
                                tabData.notes.length > 0 ?
                                    tabData.notes.map((note, i) => h(NoteItem, {
                                        key: note.ts || i,
                                        note,
                                        onDelete: handleDelete,
                                        onEdit: handleEdit,
                                        onToggleStar: handleToggleStar,
                                        onToggleCollapse: handleToggleCollapse,
                                        searchTerm: '',
                                        activeMatches: null,
                                        noteRef: null,
                                        activeTab: tab,
                                        tabName: note._tab || tab,
                                        fontSize: fontSize - 1,
                                        thumbMap: tabData.thumbMap,
                                        attNames: tabData.fileNames,
                                        isFullscreenColumn: !isActive,
                                        thumbFormat: tabData.thumbFormat,
                                        onEditingChange: null
                                    })) :
                                    h('div', { className: 'note-empty' }, isActive ? 'No notes' : 'Loading...')
                            )
                        );
                    })
                ) :
                // ========== 非全屏笔记列表 ==========
                h('div', {
                    className: 'note-items',
                    ref: listRef,
                },
                    !isEditingMode && h('div', {
                        ref: sentinelRef,
                        className: `note-loading-indicator${loadingMore ? ' is-loading' : ''}`,
                        key: 'load-more-sentinel',
                        style: {
                            display: (hasMore && !searchTerm) ? 'flex' : 'none',
                            cursor: 'default',
                            minHeight: '20px',
                            padding: '8px 10px'
                        },
                    }, loadingMore ? '\u25B2 Loading older notes...' : '\u25B2 Scroll to load more'),
                    !isEditingMode && starFilterActive && h('div', { className: 'note-star-filter-banner' }, '\u2605 Showing starred notes only'),
                    filteredNotes.length > 0 ?
                        filteredNotes.map((note, i) => {
                            if (isEditingMode && note.ts !== editingNoteTs) {
                                return null;
                            }
                            return h(NoteItem, {
                                key: note.ts || i,
                                note,
                                onDelete: handleDelete,
                                onEdit: handleEdit,
                                onToggleStar: handleToggleStar,
                                onToggleCollapse: handleToggleCollapse,
                                searchTerm,
                                activeMatches: getActiveMatchesForNote(note),
                                noteRef: activeMatchRef,
                                activeTab,
                                tabName: note._tab || activeTab,
                                fontSize,
                                thumbMap,
                                attNames,
                                isFullscreenColumn: false,
                                thumbFormat,
                                isVisible: visibleItems.has(note.ts),
                                onEditingChange: handleEditingChange,
                                isEditingThis: isEditingMode && note.ts === editingNoteTs
                            });
                        }) :
                        h('div', { className: 'note-empty' }, searchTerm ? 'No matches found' : (starFilterActive ? 'No starred notes.' : 'No notes yet.'))
                ),
            // ========== 输入表单 - 编辑模式下隐藏 ==========
            !isEditingMode && h('div', { className: `note-input-form ${isFullscreen ? 'note-input-fullscreen' : ''}` },
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
                    placeholder: isGuest ? 'Shift+Enter to send (Login to upload files)' : 'Shift+Enter send | Long press Send to upload | Drag & drop files',
                    className: 'note-input',
                    rows: 1
                }),
                h('button', {
                    className: 'note-send-btn',
                    onClick: handleSubmit,
                    type: 'button',
                    ref: sendBtnRef,
                    title: isGuest ? 'Send' : 'Send (long press to upload files)'
                }, 'Send')
            ),
            // ========== 编辑模式提示 ==========
            isEditingMode && h('div', { 
                className: 'note-editing-mode-banner'
            }, '\u270F\uFE0F Editing note... Press ESC to cancel, Shift+Enter to save')
        );
    }

    function NoteApp() {
        const [show, setShow] = useState(false);
        const [hasAccess, setHasAccess] = useState(false);
        const mountRef = useRef(null);

        useEffect(() => {
            checkAccess().then(allowed => {
                setHasAccess(allowed || publicTabsList.length > 0);
            });
            const fn = () => setShow(prev => !prev);
            window.addEventListener('toggle-notes', fn);
            return () => window.removeEventListener('toggle-notes', fn);
        }, []);

        useEffect(() => {
            if (mountRef.current) {
                if (mountRef.current.parentNode) {
                    document.body.removeChild(mountRef.current);
                }
                mountRef.current = null;
            }

            if (!hasAccess || !show) return;

            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 10 !important;
                pointer-events: none !important;
                overflow: hidden !important;
                touch-action: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: transparent !important;
            `;
            document.body.appendChild(container);
            mountRef.current = container;

            try {
                const element = h(NotePanel, { onClose: () => setShow(false) });

                if (HFS.ReactDOM && HFS.ReactDOM.render) {
                    HFS.ReactDOM.render(element, container);
                    console.log('Notes: Rendered with ReactDOM.render');
                } else if (HFS.React && HFS.React.render) {
                    HFS.React.render(element, container);
                    console.log('Notes: Rendered with React.render');
                } else {
                    renderFallbackUI(container);
                }
            } catch (e) {
                console.error('Notes: Render error:', e);
                renderFallbackUI(container);
            }

            function renderFallbackUI(container) {
                const panel = document.createElement('div');
                panel.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    right: 0 !important;
                    width: 480px !important;
                    max-width: 92vw !important;
                    height: 100vh !important;
                    background: #1a1a1a !important;
                    color: #ccc !important;
                    z-index: 10 !important;
                    pointer-events: auto !important;
                    padding: 20px !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    box-shadow: -8px 0 40px rgba(0,0,0,0.5) !important;
                `;

                panel.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #333;padding-bottom:10px;margin-bottom:10px;">
                        <h2 style="margin:0;color:#fff;">Notes</h2>
                        <button onclick="this.closest('.note-overlay').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer;">\u00D7</button>
                    </div>
                    <div style="flex:1;overflow-y:auto;">
                        <p style="color:#666;text-align:center;padding-top:40px;">
                            ⚠️ React render failed.<br>
                            <span style="font-size:0.85em;">Please check browser console for errors.</span>
                        </p>
                    </div>
                    <div style="border-top:1px solid #333;padding-top:10px;display:flex;gap:8px;">
                        <input type="text" placeholder="Shift+Enter to send" style="flex:1;padding:8px;background:#222;border:1px solid #444;border-radius:4px;color:#ccc;">
                        <button style="padding:8px 14px;background:#444;border:none;border-radius:4px;color:#fff;cursor:pointer;">Send</button>
                    </div>
                `;

                container.style.pointerEvents = 'none';
                panel.style.pointerEvents = 'auto';
                container.appendChild(panel);

                container.addEventListener('click', function(e) {
                    if (e.target === container) {
                        setShow(false);
                    }
                });
            }

            return () => {
                if (mountRef.current && mountRef.current.parentNode) {
                    document.body.removeChild(mountRef.current);
                }
                mountRef.current = null;
            };
        }, [hasAccess, show]);

        return null;
    }

    HFS.onEvent('appendMenuBar', () => {
        return h('button', {
            className: 'menu-bar-notes-btn',
            onClick() {
                window.dispatchEvent(new CustomEvent('toggle-notes'));
            },
            title: 'Open Notes'
        }, [
            h('span', { 'aria-hidden': 'true' }, '\u2710'),
            h('span', { className: 'btn-label' }, 'Notes')
        ]);
    });

    HFS.onEvent('footer', () => h(NoteApp));
}