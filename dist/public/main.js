"use strict"; {
    const PAGE_SIZE = 10;
    const { h } = HFS;
    const { useState, useEffect, useRef, useMemo, useCallback } = HFS.React;

    const CACHE_ACTIVE_TAB = 'notes_activeTab';
    const CACHE_INPUT_TEXT = 'notes_inputText';

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

    function getVideoThumbPath(tab, fileId) {
        const ext = fileId.split('.').pop();
        const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'];
        if (videoExts.includes(ext.toLowerCase())) {
            const baseName = fileId.substring(0, fileId.lastIndexOf('.'));
            return `/~/notes/thumb/${tab}/${baseName}.jpg`;
        }
        return null;
    }

    let globalEditingNoteTs = null;
    let globalEditingTab = null;
    let globalEditTextareaRef = null;
    let globalEditValue = '';
    let globalSetEditValue = null;
    let globalActiveTab = '';

    function NoteItem({ note, onDelete, onEdit, onToggleStar, onToggleCollapse, searchTerm, activeMatches, noteRef, activeTab, fontSize, thumbMap, attNames, isFullscreenColumn, tabName }) {
        const { u, m, ts, starred, collapsed } = note;
        const { username } = HFS.useSnapState();
        const [editing, setEditing] = useState(false);
        const [editVal, setEditVal] = useState(m);
        const inputRef = useRef(null);
        const textareaRef = useRef(null);
        const noteItemRef = useRef(null);
        const videoRef = useRef(null);
        const [videoPlaying, setVideoPlaying] = useState(false);
        const [localCollapsed, setLocalCollapsed] = useState(null);
        const [imageViewMode, setImageViewMode] = useState({});
        
        const isAdminUser = username === 'admin';
        const isOwner = username && (isAdminUser || username === u);
        const currentGuest = isGuest;
        
        const effectiveTab = tabName || activeTab;
        
        const effectiveCollapsed = isFullscreenColumn ? true : (localCollapsed !== null ? localCollapsed : (collapsed || false));
        
        useEffect(() => {
            setEditing(false);
            setLocalCollapsed(null);
            setImageViewMode({});
            setVideoPlaying(false);
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
        
        const handleDblClick = () => {
            if (isFullscreenColumn) return;
            if (isOwner && !currentGuest) {
                setEditing(true);
                setEditVal(m);
                globalEditingNoteTs = ts;
                globalEditingTab = effectiveTab;
                globalEditValue = m;
                globalSetEditValue = setEditVal;
                globalActiveTab = effectiveTab;
                
                setTimeout(() => {
                    inputRef.current?.focus();
                    if (textareaRef.current) {
                        globalEditTextareaRef = textareaRef;
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
                        requestAnimationFrame(() => {
                            textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        });
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
            globalEditingNoteTs = null;
            globalEditingTab = null;
            globalEditTextareaRef = null;
            globalEditValue = '';
            globalSetEditValue = null;
            globalActiveTab = '';
        };
        
        const handleCancel = () => {
            setEditing(false);
            globalEditingNoteTs = null;
            globalEditingTab = null;
            globalEditTextareaRef = null;
            globalEditValue = '';
            globalSetEditValue = null;
            globalActiveTab = '';
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
                        if (file.type.startsWith('image/')) {
                            const result = await uploadImage(file, effectiveTab);
                            allMarks += `[img:${result.imageId}]`;
                        } else {
                            const result = await uploadFileToServer(file, effectiveTab);
                            if (result.isVideo) {
                                allMarks += `[mov:${result.fileId}:${result.name}]`;
                            } else if (result.isAudio) {
                                allMarks += `[mov:${result.fileId}:${result.name}]`;
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
        
        const handleImageToggle = (e, imageId) => {
            e.stopPropagation();
            const img = e.currentTarget;
            const currentMode = imageViewMode[imageId] || 'thumbnail';
            
            let newMode;
            let toastMessage;
            
            if (currentMode === 'thumbnail') {
                newMode = 'full';
                toastMessage = 'Switched to original image';
            } else {
                newMode = 'thumbnail';
                toastMessage = 'Switched to thumbnail';
            }
            
            setImageViewMode(prev => ({
                ...prev,
                [imageId]: newMode
            }));
            
            HFS.toast(toastMessage, 'info');
            
            const fullSrc = img.dataset.fullSrc;
            const thumbSrc = img.dataset.thumbSrc;
            
            if (newMode === 'full') {
                img.src = fullSrc;
                img.dataset.isThumb = 'false';
                img.title = 'Click to switch to thumbnail';
            } else {
                img.src = thumbSrc;
                img.dataset.isThumb = 'true';
                img.title = 'Click to view original image';
            }
        };

        const renderContentWithHighlight = (content, isEditMode) => {
            if (!content) return '';
            
            const imgMarkRegex = /\[img:(.+?)\]/g;
            const movMarkRegex = /\[mov:(.+?):(.+?)\]/g;
            const attMarkRegex = /\[att:(.+?):(.+?)\]/g;
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
            let match;
            
            const allMatches = [];
            
            imgMarkRegex.lastIndex = 0;
            while ((match = imgMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'image', imageId: match[1] });
            }
            
            movMarkRegex.lastIndex = 0;
            while ((match = movMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'media', fileId: match[1], name: match[2] });
            }
            
            attMarkRegex.lastIndex = 0;
            while ((match = attMarkRegex.exec(text)) !== null) {
                allMatches.push({ index: match.index, endIndex: match.index + match[0].length, type: 'attachment', fileId: match[1], name: match[2] });
            }
            
            allMatches.sort((a, b) => a.index - b.index);
            
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
                    const imgBase = isEditMode ? `/~/notes/img/temp/${effectiveTab}/` : `/~/notes/img/${effectiveTab}/`;
                    const thumbBase = `/~/notes/thumb/${effectiveTab}/`;
                    const fullUrl = imgBase + part.imageId;
                    const thumbUrl = thumbBase + part.imageId;
                    const ext = part.imageId.split('.').pop()?.toLowerCase();
                    const isGif = ext === 'gif';
                    const hasThumb = thumbMap && thumbMap[part.imageId];
                    
                    const viewMode = imageViewMode[part.imageId] || 'thumbnail';
                    const useThumb = !isGif && !isEditMode && hasThumb && viewMode === 'thumbnail';
                    const initialSrc = useThumb ? thumbUrl : fullUrl;
                    const isThumbMode = useThumb;
                    
                    return h('img', { 
                        key: `img-${i}`, 
                        src: initialSrc,
                        'data-full-src': fullUrl,
                        'data-thumb-src': thumbUrl,
                        'data-has-thumb': hasThumb ? 'true' : 'false',
                        'data-is-thumb': isThumbMode ? 'true' : 'false',
                        'data-image-id': part.imageId,
                        alt: isGif ? 'GIF Image' : 'Image',
                        className: 'note-inline-img',
                        loading: 'lazy',
                        onClick: function(e) {
                            const img = e.currentTarget;
                            const imageId = img.dataset.imageId;
                            
                            if (isGif) {
                                return;
                            }
                            
                            if (img.dataset.hasThumb !== 'true') {
                                return;
                            }
                            
                            handleImageToggle(e, imageId);
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
                            }
                            img.style.opacity = '1';
                        },
                        style: { 
                            opacity: 0, 
                            transition: 'opacity 0.5s ease-in-out',
                            cursor: (isGif || !hasThumb) ? 'default' : 'pointer'
                        },
                        title: isGif ? 'GIF Image' : (hasThumb ? 'Click to toggle thumbnail/original' : 'Image (no thumbnail)')
                    });
                }
                if (part.type === 'media') {
                    const movUrl = `/~/notes/mov/${effectiveTab}/${part.fileId}`;
                    const ext = part.fileId.split('.').pop()?.toLowerCase();
                    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'm4a', 'opus', 'ogg', 'oga'];
                    const isAudio = audioExts.includes(ext);
                    const displayName = part.name || attNames[part.fileId] || part.fileId;
                    const hasThumb = thumbMap && thumbMap[part.fileId];
                    const videoThumbPath = hasThumb ? getVideoThumbPath(effectiveTab, part.fileId) : null;
                    
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
                    
                    if (videoThumbPath) {
                        return h('div', { 
                            key: `media-${i}`, 
                            className: 'note-inline-mov'
                        },
                            h('div', { 
                                className: 'note-mov-wrapper',
                                onClick: (e) => {
                                    setVideoPlaying(true);
                                    setTimeout(() => {
                                        const video = videoRef.current;
                                        if (video) {
                                            video.style.display = 'block';
                                            video.play().catch(() => {});
                                        }
                                    }, 50);
                                }
                            },
                                videoPlaying ? null : h('div', { className: 'note-mov-thumb-cover' },
                                    h('img', {
                                        src: videoThumbPath,
                                        alt: displayName,
                                        className: 'note-mov-thumb-img',
                                        onError: function(e) {
                                            const wrapper = e.target.closest('.note-mov-wrapper');
                                            if (wrapper) {
                                                const thumbCover = wrapper.querySelector('.note-mov-thumb-cover');
                                                if (thumbCover) thumbCover.style.display = 'none';
                                                const placeholder = wrapper.querySelector('.note-mov-placeholder');
                                                if (placeholder) placeholder.style.display = 'flex';
                                            }
                                        }
                                    }),
                                    h('div', { className: 'note-mov-thumb-overlay' },
                                        h('div', { className: 'note-mov-placeholder-bg' },
                                            h('span', { className: 'note-mov-play-icon' }, '\u25B6')
                                        ),
                                        h('div', { className: 'note-mov-placeholder-info' },
                                            h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video'),
                                            h('span', { 
                                                className: 'note-mov-filename',
                                                title: part.fileId
                                            }, displayName)
                                        )
                                    )
                                ),
                                h('div', { 
                                    className: 'note-mov-placeholder', 
                                    style: { display: videoPlaying ? 'none' : 'none' }
                                },
                                    h('div', { className: 'note-mov-placeholder-bg' },
                                        h('span', { className: 'note-mov-play-icon' }, '\u25B6')
                                    ),
                                    h('div', { className: 'note-mov-placeholder-info' },
                                        h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video'),
                                        h('span', { 
                                            className: 'note-mov-filename',
                                            title: part.fileId
                                        }, displayName)
                                    )
                                ),
                                h('video', { 
                                    ref: videoRef,
                                    className: 'note-mov-player',
                                    style: { display: videoPlaying ? 'block' : 'none' },
                                    controls: true,
                                    preload: 'metadata',
                                    onPlay: (e) => {
                                        const wrapper = e.target.closest('.note-mov-wrapper');
                                        const placeholder = wrapper?.querySelector('.note-mov-placeholder');
                                        const thumbCover = wrapper?.querySelector('.note-mov-thumb-cover');
                                        if (placeholder) placeholder.style.display = 'none';
                                        if (thumbCover) thumbCover.style.display = 'none';
                                        e.target.style.display = 'block';
                                    },
                                    onPause: (e) => {
                                        e.target.style.display = 'block';
                                    }
                                },
                                    h('source', { src: movUrl })
                                )
                            )
                        );
                    }
                    
                    return h('div', { 
                        key: `media-${i}`, 
                        className: 'note-inline-mov'
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
                            h('div', { className: 'note-mov-placeholder' },
                                h('div', { className: 'note-mov-placeholder-bg' },
                                    h('span', { className: 'note-mov-play-icon' }, '\u25B6')
                                ),
                                h('div', { className: 'note-mov-placeholder-info' },
                                    h('span', { className: 'note-mov-placeholder-text' }, 'Click to play video'),
                                    h('span', { 
                                        className: 'note-mov-filename',
                                        title: part.fileId
                                    }, displayName)
                                )
                            ),
                            h('video', { 
                                className: 'note-mov-player',
                                style: { display: 'none' },
                                controls: true,
                                preload: 'metadata',
                                onPlay: (e) => {
                                    const wrapper = e.target.closest('.note-mov-wrapper');
                                    const placeholder = wrapper?.querySelector('.note-mov-placeholder');
                                    if (placeholder) placeholder.style.display = 'none';
                                    e.target.style.display = 'block';
                                },
                                onPause: (e) => {
                                    e.target.style.display = 'block';
                                }
                            },
                                h('source', { src: movUrl })
                            )
                        )
                    );
                }
                if (part.type === 'attachment') {
                    const attUrl = `/~/notes/att/${effectiveTab}/${part.fileId}`;
                    const displayName = part.name || attNames[part.fileId] || part.fileId;
                    return h('span', { key: `att-${i}`, className: 'note-inline-att' },
                        h('span', { className: 'note-att-icon' }, '\u2B07'),
                        h('a', { href: attUrl, download: displayName, className: 'note-att-link' }, displayName)
                    );
                }
                const textParts = part.content.split(linkRegex);
                return textParts.map((textPart, j) => {
                    const key = `text-${i}-${j}`;
                    if (linkRegex.test(textPart)) {
                        if (imgExtRegex.test(textPart)) {
                            return h('img', { key, src: textPart, alt: textPart, className: 'note-inline-img', loading: 'lazy' });
                        }
                        return h('a', { key, href: textPart, target: '_blank', rel: 'noopener noreferrer', className: 'note-inline-link' }, textPart);
                    }
                    return applyHighlight(textPart);
                });
            });
        };

        const getCoverImage = (content) => {
            if (!content) return null;
            const match = content.match(/\[img:(.+?)\]/);
            if (!match) return null;
            return match[1];
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
                        }, '\uD83D\uDCCE'),
                        h('button', { 
                            className: 'note-copy-btn', 
                            onClick: handleCopyAll,
                            title: 'Copy all content'
                        }, '\uD83D\uDCCB'),
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
        const noteLength = m ? m.length : 0;
        const lineCount = m ? m.split('\n').length : 0;
        const showFooter = !isFullscreenColumn && !isCollapsed && lineCount > 10;
        const coverImageId = getCoverImage(m);
        const plainText = getPlainText(m);
        
        const coverExt = coverImageId ? coverImageId.split('.').pop()?.toLowerCase() : null;
        const coverIsGif = coverExt === 'gif';
        const coverHasThumb = coverImageId && !coverIsGif && thumbMap && thumbMap[coverImageId];
        const coverSrc = coverHasThumb 
            ? `/~/notes/thumb/${effectiveTab}/${coverImageId}`
            : (coverImageId ? `/~/notes/img/${effectiveTab}/${coverImageId}` : '');
        
        const canManage = isAdminUser || isOwner;
        
        return h('div', { 
            className: `note-item ${starred ? 'note-item-starred' : ''} ${isCollapsed && coverImageId ? 'note-item-has-cover' : ''} ${isFullscreenColumn ? 'note-item-compact' : ''}`, 
            onDblClick: handleDblClick,
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
                    !isFullscreenColumn && h('button', {
                        className: 'note-collapse-btn',
                        onClick: handleCollapseToggle,
                        title: isCollapsed ? 'Expand note' : 'Collapse note'
                    }, isCollapsed ? '\u25B6' : '\u25BC'),
                    canManage && h('button', {
                        className: 'note-delete-btn',
                        onClick: handleDeleteClick,
                        title: 'Delete note'
                    }, '\u00D7')
                )
            ),
            isCollapsed && coverImageId ? 
                h('div', { 
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
                            onClick: function(e) {
                                e.stopPropagation();
                            },
                            onError: function(e) {
                                const img = e.currentTarget;
                                if (img.dataset.hasThumb === 'true' && img.src !== img.dataset.fullSrc) {
                                    img.src = img.dataset.fullSrc;
                                    img.dataset.hasThumb = 'false';
                                }
                            },
                            onLoad: function(e) {
                                e.currentTarget.style.opacity = '1';
                            },
                            style: { 
                                opacity: 0, 
                                transition: 'opacity 0.5s ease-in-out',
                                cursor: 'default'
                            },
                            title: coverIsGif ? 'GIF Image' : 'Cover Image'
                        }),
                        plainText && h('div', { className: 'note-cover-overlay' },
                            h('div', { className: 'note-cover-text' }, plainText)
                        ),
                        !plainText && h('div', { className: 'note-cover-overlay' })
                    )
                )
            :
                h('div', { className: `note-text ${isCollapsed ? 'note-text-collapsed' : ''}` }, 
                    renderContentWithHighlight(m, false)
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
        const [fullscreenStarFilter, setFullscreenStarFilter] = useState(false);
        const [isDragging, setIsDragging] = useState(false);
        const [thumbMap, setThumbMap] = useState({});
        const [attNames, setAttNames] = useState({});
        const [hasMore, setHasMore] = useState(false);
        const [loadingMore, setLoadingMore] = useState(false);
        const [currentOffset, setCurrentOffset] = useState(0);
        const [showSortButtons, setShowSortButtons] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [otherTabData, setOtherTabData] = useState({});
        const [tabClickCount, setTabClickCount] = useState({});
        const tabClickTimerRef = useRef({});
        const tabClickCountRef = useRef({});
        const isLoadingMoreRef = useRef(false);
        const hasMoreRef = useRef(false);
        const scrollRestoreRef = useRef(0);
        const sentinelRef = useRef(null);
        const observerRef = useRef(null);
        const fullscreenChangeHandlerRef = useRef(null);
        const isFullscreenRef = useRef(false);
        const fullscreenGridRef = useRef(null);
        const esRef = useRef(null);
        const loadNotesAbortControllerRef = useRef(null);
        
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
        
        useEffect(() => { mRef.current = m; }, [m]);
        useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
        useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
        useEffect(() => { isLoadingMoreRef.current = loadingMore; }, [loadingMore]);
        useEffect(() => { currentOffsetRef.current = currentOffset; }, [currentOffset]);
        useEffect(() => { isFullscreenRef.current = isFullscreen; }, [isFullscreen]);
        
        useEffect(() => {
            globalActiveTab = activeTab;
        }, [activeTab]);

        useEffect(() => {
            try {
                localStorage.setItem(CACHE_INPUT_TEXT, m);
            } catch {}
        }, [m]);

        useEffect(() => {
            if (!activeTab) return;
            
            setNotes([]);
            setHasMore(false);
            setCurrentOffset(0);
            setThumbMap({});
            setAttNames({});
            
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
            
        }, [activeTab]);

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
                if (fullscreenChangeHandlerRef.current) {
                    document.removeEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                    fullscreenChangeHandlerRef.current = null;
                }
                globalEditingNoteTs = null;
                globalEditingTab = null;
                globalEditTextareaRef = null;
                globalEditValue = '';
                globalSetEditValue = null;
                globalActiveTab = '';
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
                    if (data.tab !== activeTabRef.current) return;
                    
                    if (e === 'newNote') {
                        shouldAutoScrollRef.current = true;
                        setNotes(prev => {
                            const exists = prev.some(n => n.ts === data.ts);
                            if (exists) return prev;
                            return [...prev, { ...data, _tab: activeTabRef.current }];
                        });
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
                    } else if (e === 'tabCleared' && data.tab === activeTabRef.current) {
                        setNotes([]);
                        setHasMore(false);
                        setCurrentOffset(0);
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
            localStorage.setItem('notes_fontSize', fontSize);
        }, [fontSize]);
        
        useEffect(() => {
            const handleResize = () => setIsMobile(window.innerWidth <= 768);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }, []);

        useEffect(() => {
            return () => {
                if (fullscreenChangeHandlerRef.current) {
                    document.removeEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                    fullscreenChangeHandlerRef.current = null;
                }
                if (document.fullscreenElement) {
                    document.exitFullscreen?.().catch(() => {});
                }
            };
        }, []);

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
                                if (file.type.startsWith('image/')) {
                                    const result = await uploadImage(file, activeTabRef.current);
                                    allMarks += `[img:${result.imageId}]`;
                                } else {
                                    const result = await uploadFileToServer(file, activeTabRef.current);
                                    if (result.isVideo) {
                                        allMarks += `[mov:${result.fileId}:${result.name}]`;
                                    } else if (result.isAudio) {
                                        allMarks += `[mov:${result.fileId}:${result.name}]`;
                                    } else {
                                        allMarks += `[att:${result.fileId}:${result.name}]`;
                                    }
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
                                    allMarks += `[mov:${result.fileId}:${result.name}]`;
                                } else if (result.isAudio) {
                                    allMarks += `[mov:${result.fileId}:${result.name}]`;
                                } else {
                                    allMarks += `[att:${result.fileId}:${result.name}]`;
                                }
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
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            if (loadNotesAbortControllerRef.current) {
                loadNotesAbortControllerRef.current.abort();
                loadNotesAbortControllerRef.current = null;
            }
            if (fullscreenChangeHandlerRef.current) {
                document.removeEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                fullscreenChangeHandlerRef.current = null;
            }
            if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
            setClosing(true);
            setTimeout(onClose, 300);
        };

        const toggleFullscreen = useCallback(() => {
            const el = document.documentElement;
            
            if (!isFullscreenRef.current) {
                el.requestFullscreen?.()
                    .then(() => {
                        setIsFullscreen(true);
                        setFullscreenStarFilter(false);
                        
                        if (fullscreenChangeHandlerRef.current) {
                            document.removeEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                        }
                        
                        fullscreenChangeHandlerRef.current = () => {
                            if (!document.fullscreenElement) {
                                el.requestFullscreen?.().catch(() => {
                                    setIsFullscreen(false);
                                });
                            }
                        };
                        
                        document.addEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                    })
                    .catch(err => {
                        HFS.toast("Enter fullscreen failed: " + err, 'error');
                    });
            } else {
                if (fullscreenChangeHandlerRef.current) {
                    document.removeEventListener('fullscreenchange', fullscreenChangeHandlerRef.current);
                    fullscreenChangeHandlerRef.current = null;
                }
                
                document.exitFullscreen?.();
                setIsFullscreen(false);
                setFullscreenStarFilter(false);
            }
        }, []);

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
        }, [sanitizeText]);

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
                    }
                } catch (e) {}
            };
            doEdit();
        }, [activeTab, sanitizeText]);

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
    // 修改：允許空名稱以恢復默認，只要與當前顯示名稱不同就發送
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

        const loadTabs = useCallback(() => {
            fetch('/~/api/notes/tabs')
                .then(r => r.json())
                .then(data => {
                    const tabsList = data.tabs || [];
                    setTabs(tabsList);
                    setTabCounts(data.counts || {});
                    setStorageWarning(data.warning || false);
                    setTabNames(data.tabNames || {});
                    const cachedTab = localStorage.getItem(CACHE_ACTIVE_TAB);
                    if (cachedTab && tabsList.includes(cachedTab)) {
                        setActiveTab(cachedTab);
                    } else if (tabsList.length > 0 && !activeTabRef.current) {
                        setActiveTab(tabsList[0]);
                    }
                    if (tabsList.length > 0 && !tabsList.includes(activeTabRef.current)) {
                        setActiveTab(prev => tabsList.includes(prev) ? prev : tabsList[0]);
                    }
                    if (data.isGuest !== undefined) {
                        isGuest = data.isGuest;
                    }
                })
                .catch(e => {});
        }, []);

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
            
            try {
                const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=${offset}&limit=${PAGE_SIZE}`, {
                    signal: controller.signal
                });
                const data = await res.json();
                
                const rawNotes = data.notes || {};
                const sortedKeys = Object.keys(rawNotes).sort();
                const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));
                
                if (append) {
                    setNotes(prev => {
                        const existingTs = new Set(prev.map(n => n.ts));
                        const newNotes = notesWithTab.filter(n => !existingTs.has(n.ts));
                        return [...newNotes, ...prev];
                    });
                } else {
                    setNotes(notesWithTab);
                }
                const newHasMore = data.hasMore || false;
                setHasMore(newHasMore);
                setCurrentOffset(offset + notesWithTab.length);
                setThumbMap(data.thumbMap || {});
                setAttNames(data.fileNames || {});
                return newHasMore;
            } catch (e) {
                if (e.name === 'AbortError') {
                    // 请求被取消，忽略
                }
            } finally {
                if (loadNotesAbortControllerRef.current === controller) {
                    loadNotesAbortControllerRef.current = null;
                }
            }
        }, []);

        const loadOtherTabNotes = useCallback(async (tab) => {
            if (!tab) return;
            try {
                const res = await fetch(`/~/api/notes/list?tab=${encodeURIComponent(tab)}&offset=0&limit=30`);
                const data = await res.json();
                const rawNotes = data.notes || {};
                const sortedKeys = Object.keys(rawNotes).sort();
                const notesWithTab = sortedKeys.map(ts => ({ ...rawNotes[ts], ts, _tab: tab }));
                
                setOtherTabData(prev => ({
                    ...prev,
                    [tab]: {
                        notes: notesWithTab,
                        thumbMap: data.thumbMap || {},
                        fileNames: data.fileNames || {}
                    }
                }));
            } catch (e) {}
        }, []);

        const getFullscreenColumns = useCallback(() => {
            if (!isFullscreen || isMobile) return [];
            
            const activeIdx = tabs.indexOf(activeTab);
            if (activeIdx === -1) return tabs.slice(0, 3);
            
            const result = [];
            for (let i = 0; i < 3; i++) {
                const idx = (activeIdx + i) % tabs.length;
                result.push(tabs[idx]);
            }
            return result;
        }, [isFullscreen, isMobile, tabs, activeTab]);

        const fullscreenColumns = useMemo(() => {
            return getFullscreenColumns();
        }, [getFullscreenColumns]);

        useEffect(() => {
            if (isFullscreen && !isMobile) {
                fullscreenColumns.forEach(tab => {
                    if (tab !== activeTab) {
                        loadOtherTabNotes(tab);
                    }
                });
            }
        }, [isFullscreen, fullscreenColumns, activeTab, isMobile, loadOtherTabNotes]);

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
            
            requestAnimationFrame(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
            });
            
            shouldAutoScrollRef.current = true;
        }, [notes]);

        const displayNotes = useMemo(() => {
            return starFilterActive ? notes.filter(n => n.starred) : notes;
        }, [notes, starFilterActive]);

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
            if (isGuest) { HFS.toast('Please login to manage tabs', 'info'); return; }
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
            if (isFullscreen) {
                if (tab === activeTab) {
                    setFullscreenStarFilter(prev => !prev);
                } else {
                    setActiveTab(tab);
                    setFullscreenStarFilter(false);
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
            }
        };

        const dragOverlayContent = isGuest ? 'Please login to upload files' : 'Drop files to upload (multi-file supported)';

        return h('div', { 
            className: `note-panel ${isMobile ? 'note-mobile' : 'note-desktop'} ${closing ? 'note-closing' : ''} ${isDragging ? 'note-dragging' : ''} ${isFullscreen ? 'note-fullscreen' : ''}`,
            style: { fontSize: fontSize + 'px', overscrollBehavior: 'contain' },
            ref: panelRef
        },
            isDragging && h('div', { className: 'note-drag-overlay' },
                h('div', { className: 'note-drag-overlay-content' }, dragOverlayContent)
            ),
            h('div', { className: 'note-panel-header', ref: headerRef },
                h('div', { className: 'note-header-left' },
                    h('span', { 
                        className: 'note-panel-title',
                        onClick: toggleFullscreen,
                        style: { cursor: 'pointer' },
                        title: isFullscreen ? 'Click to exit fullscreen' : 'Click to enter fullscreen'
                    }, isGuest ? 'Notes (Guest)' : 'Notes'),
                    isFullscreen && h('span', { className: 'note-fullscreen-indicator' }, ' \u229E'),
                    starFilterActive && !isFullscreen && h('span', { className: 'note-star-filter-indicator' }, '\u2605'),
                    fullscreenStarFilter && isFullscreen && h('span', { className: 'note-star-filter-indicator' }, '\u2605'),
                    !isGuest && h('div', { className: 'note-font-btns-header' },
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
                    storageWarning && h('span', { className: 'note-warn-icon', title: 'Storage limit approaching' }, '\u26A0')
                ),
                h('div', { className: 'note-header-right' },
                    !isFullscreen && h('button', {
                        className: 'note-search-toggle',
                        onClick: () => {
                            setShowSearch(!showSearch);
                            if (showSearch) setSearchTerm('');
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        },
                        title: 'Search'
                    }, showSearch ? '\u2715' : '\u03D8'),
                    searchTerm && h('span', { className: 'note-header-stats' },
                        `${filteredNotes.length} notes / ${totalMatches} matches`
                    ),
                    h('button', { className: 'note-close-btn', onClick: handleClose }, '\u00D7')
                )
            ),
            
            showSearch && !isFullscreen && h('div', { className: 'note-search-bar' },
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
                    }, '\u25B2'),
                    h('span', { className: 'note-search-nav-num' }, `${currentMatch + 1}/${totalMatches}`),
                    h('button', {
                        className: 'note-search-nav-btn',
                        onClick: goToNextMatch,
                        title: 'Next'
                    }, '\u25BC')
                )
            ),
            
            isFullscreen && h('div', { className: 'note-tabs-container note-tabs-fullscreen' },
                h('div', { className: 'note-tabs' },
                    tabs.map((tab, i) =>
                        h('span', { key: tab, className: 'note-tab-wrapper' },
                            i > 0 && h('span', { className: 'note-tab-sep' }, '|'),
                            h('button', {
                                className: `note-tab ${activeTab === tab ? 'note-tab-active' : ''} ${fullscreenStarFilter && activeTab === tab ? 'note-tab-star-mode' : ''}`,
                                onClick: () => handleTabClick(tab),
                                title: activeTab === tab ? (fullscreenStarFilter ? 'Click to exit star filter' : 'Click to filter starred') : 'Click to select tab'
                            }, getTabDisplayName(tab))
                        )
                    )
                )
            ),
            
            !isFullscreen && h('div', { className: 'note-tabs-container' },
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
                                title: activeTab === tab ? (starFilterActive ? 'Click to exit star filter' : 'Click to filter starred') : (isGuest ? '' : 'Triple-click to rename')
                            }, getTabDisplayName(tab))
                        )
                    )
                ),
                showSortButtons && h('div', { className: 'note-tab-sort' },
                    h('button', {
                        className: 'note-sort-btn',
                        onMouseDown: handleSortBtnMouseDown,
                        onClick: () => moveTab(activeTab, 'left'),
                        disabled: tabs.indexOf(activeTab) <= 0,
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
                        disabled: tabs.indexOf(activeTab) >= tabs.length - 1,
                        title: 'Move right'
                    }, '\u25B6')
                )
            ),
            
            isFullscreen && !isMobile ? 
                h('div', { className: 'note-fullscreen-grid', ref: fullscreenGridRef },
                    fullscreenColumns.map((tab, colIdx) => {
                        const isActive = tab === activeTab;
                        const tabData = isActive 
                            ? { notes: fullscreenActiveNotes, thumbMap, fileNames: attNames }
                            : (otherTabData[tab] || { notes: [], thumbMap: {}, fileNames: {} });
                        
                        return h('div', { 
                            className: `note-fullscreen-column ${isActive ? 'note-fullscreen-column-active' : ''}`,
                            key: tab
                        },
                            isActive && fullscreenStarFilter && h('div', { className: 'note-star-filter-banner' }, '\u2605 Showing starred notes only'),
                            h('div', { className: 'note-items note-items-fullscreen' },
                                tabData.notes.length > 0
                                    ? tabData.notes.map((note, i) => h(NoteItem, { 
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
                                        isFullscreenColumn: !isActive
                                    }))
                                    : h('div', { className: 'note-empty' }, isActive ? 'No notes' : 'Loading...')
                            )
                        );
                    })
                )
            :
                h('div', { className: 'note-items', ref: listRef, style: { overscrollBehavior: 'contain' } },
                    h('div', { 
                        ref: sentinelRef,
                        className: 'note-loading-indicator note-loading-clickable',
                        key: 'load-more-sentinel',
                        style: { display: (hasMore && !searchTerm) ? 'block' : 'none' },
                        onClick: doLoadMore
                    }, loadingMore ? 'Loading older notes...' : '\u25B2 Load older notes'),
                    
                    starFilterActive && h('div', { className: 'note-star-filter-banner' }, '\u2605 Showing starred notes only'),
                    filteredNotes.length > 0
                        ? filteredNotes.map((note, i) => h(NoteItem, { 
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
                            isFullscreenColumn: false
                        }))
                        : h('div', { className: 'note-empty' }, searchTerm ? 'No matches found' : (starFilterActive ? 'No starred notes.' : 'No notes yet.'))
                ),
            
            h('div', { className: `note-input-form ${isFullscreen ? 'note-input-fullscreen' : ''}` },
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
            )
        );
    }

    function NoteApp() {
        const [show, setShow] = useState(false);
        const [hasAccess, setHasAccess] = useState(false);

        useEffect(() => {
            checkAccess().then(allowed => {
                setHasAccess(allowed || publicTabsList.length > 0);
            });
            const fn = () => setShow(prev => !prev);
            window.addEventListener('toggle-notes', fn);
            return () => window.removeEventListener('toggle-notes', fn);
        }, []);

        if (!hasAccess || !show) return null;

        return h('div', {
            className: 'note-overlay'
        }, h(NotePanel, { onClose: () => setShow(false) }));
    }

    HFS.onEvent('appendMenuBar', () => {
        return h('button', {
            className: 'menu-bar-notes-btn',
            onClick() { window.dispatchEvent(new CustomEvent('toggle-notes')) },
            title: 'Open Notes'
        }, [
            h('span', { 'aria-hidden': 'true' }, '\u2710'),
            h('span', { className: 'btn-label' }, 'Notes')
        ]);
    });

    HFS.onEvent('footer', () => h(NoteApp));
}