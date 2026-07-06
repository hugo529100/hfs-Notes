在阅读下面用AI写的内容之前，我先简单介绍这个插件，为了满足我日常工作生活便捷需要而利用deepseek写下这个工具，并且会在随后的日子里不断使用、完善、优化，力求做到最纯粹的多设备同步的档案记录，值得注意的是需要登录后刷新页面才会出现这个按钮，由于我一直时个人工作使用，所以不会考虑多用户介入共用，虽然这是基于聊天插件进行改进开发，但我日常很少与人聊天，所以都基本是自言自语为主要用途，处于安全性考虑大家斟酌使用。

Before reading the AI-generated content below, let me briefly introduce this plugin. I created this tool with the help of DeepSeek to meet the convenience needs of my daily work and life, and I will continue to use, refine, and optimize it over time, striving to make it the most streamlined multi-device synchronization archive tool possible. One thing to note is that you need to refresh the page after logging in for the button to appear. Since I have always used it for personal work, I do not consider multi-user shared access. Although this was developed based on a chat plugin, I rarely chat with others in daily life, so it is primarily used for self-dialogue. For security considerations, please use it with discretion.





Notes Plugin Documentation
I. Overview
Notes is a lightweight, built-in note-taking tool for HFS (HTTP File Server) that supports multi-tab management, real-time synchronization, auto-backup, TXT export, and file uploads (images, videos, and attachments).

Version: 1.9
API Required: 8.87
Repository: Hug3O/Notes

II. Key Features
Feature	Description
Multi-Tab	Create multiple independent note tabs, rename, reorder
Real-Time Sync	Notes sync instantly across all connected clients via WebSocket
File Uploads	Support images (40MB), videos (500MB), and other files (500MB)
Drag & Drop	Drag files directly into the panel to upload
Long Press Upload	Long press the Send button to upload files
Note Editing	Double-click notes to edit, Shift+Enter to save
Star/Filter	Star important notes, filter to show starred only
Collapse/Expand	Auto-collapse long notes (>100 lines), manual toggle
Search	Full-text search with match navigation (▲/▼)
Auto-Backup	Configurable interval backups with retention policy
TXT Export	Auto-export notes as TXT files on each backup
Font Control	Increase (A+) or reset font size
User Restrictions	Optional whitelist for allowed users
Admin Panel	Overview, backup, import/export, clear tabs via API


III. Configuration Options
Config	Type	Default	Description
tabList	Array	[{ name: 'General' }]	Define tabs. Each tab has independent storage
backupInterval	Number	6	Hours between auto-backups (0 = disabled)
backupRetentionDays	Number	3	Days to retain backup files before cleanup
autoExportTxt	Boolean	true	Auto-export notes as TXT alongside each backup
restrictUsers	Boolean	false	Restrict access to specific users only
allowedUsers	List	[]	Whitelist of usernames (only when restrictUsers is true)

IV. How to Use
4.1 Opening Notes

Click the ✐ Notes button in the HFS menu bar. The notes panel appears as:

Desktop: Sliding panel on the right side

Mobile: Full-screen panel from the bottom

4.2 Managing Tabs
Switch tabs: Click on tab names

Star filter: Click the active tab again to toggle starred notes filter (★ indicator)

Rename tabs: Double-click a tab, type new name, press Enter to save

Reorder tabs: Use ◀ ▶ buttons to move tabs left/right

4.3 Writing Notes
Type your note in the input field at the bottom

Press Shift+Enter or click Send to submit

Character counter shows usage (current/2000)

Content exceeding 2000 characters is auto-split into multiple notes

4.4 Uploading Files
Method 1 - Long Press:
Long press the Send button (≥600ms) to open file picker. Supports multi-select.

Method 2 - Drag & Drop:
Drag files directly into the notes panel. A dashed border appears to indicate upload zone.

Method 3 - Edit Mode:
Double-click a note to edit, click the 📎 button to upload files.

Supported File Types:

Type	Max Size	Storage	Tag Format
Images	40MB	img/	[img:fileId]
Videos	500MB	mov/	[mov:fileId]
Others	500MB	att/	[att:fileId:name]


4.5 Managing Notes

Star: Click ★ on a note to mark as important

Edit: Double-click a note to enter edit mode

Delete: Click × button on a note (confirmation required)

Collapse/Expand: Click ▼/▶ to toggle long notes

Copy: In edit mode, click 📋 to copy all content

4.6 Searching

Click Ϙ (search toggle) in the header

Type search term - notes with matches are filtered

Use ▲/▼ to navigate between matches

Active match is highlighted and scrolled into view

Click ✕ to exit search

4.7 Font Size

Use A+ and A buttons in the header to increase or reset font size.

V. File Storage Structure
text
storage/
├── img/                    # Images (by tab)
│   └── {tab}/
│       ├── temp/           # Temporary images (auto-promoted on save)
│       └── *.jpg/png...
├── mov/                    # Videos (by tab)
│   └── {tab}/
│       └── *.mp4/webm...
├── att/                    # Attachments (by tab)
│   └── {tab}/
│       └── *.*
├── notes_{tab}.json        # Note databases
├── notes_backup_{tab}_{timestamp}.json
├── notes_export_{tab}.txt
└── notes_tabs_order.json   # Tab order & names

File ID Format: YYYYMMDDHHmmss_xxxxxx.ext (timestamp + random hex + original extension)

VI. Cleanup Mechanisms

6.1 On Note Deletion
All referenced images, videos, and attachments are deleted from storage

6.2 On Note Update
Files no longer referenced in the updated content are deleted

Only the difference between old and new references is removed

6.3 On Tab Clear (Admin)
All notes deleted

All files in img, mov, att directories for that tab are removed

Temp directory is cleaned

6.4 Temp Image Cleanup
Runs every hour via timer

Removes temp images older than 1 hour

Empty temp directories are removed

VII. Video Player Behavior

Videos use a lazy-load placeholder to save resources:

Initial State: Dark background with ▶ play icon and "Click to play video" text

On Click: Placeholder hides, video loads and starts playing

After Play: Native HTML5 video controls appear (play/pause, progress bar, volume)

On Pause: Video stays visible with controls

preload="none" ensures no data is loaded until user clicks

VIII. Admin API Endpoints
All admin endpoints require authentication and appropriate permissions.

Endpoint	Method	Description
GET /~/api/notes/admin/overview	GET	Database stats, backups, file statistics
GET /~/api/notes/admin/export	GET	Export all notes as JSON (optional ?tab=xxx)
POST /~/api/notes/admin/import	POST	Import notes from JSON (auto-backup first)
POST /~/api/notes/admin/backup	POST	Trigger manual backup + TXT export
POST /~/api/notes/admin/clear	POST	Clear all notes and files for a tab
POST /~/api/notes/admin/export-txt	POST	Trigger manual TXT export
IX. Auto-Backup & Export
Backup Interval: Default every 6 hours (configurable)

Backup Format: JSON files named notes_backup_{tab}_{timestamp}.json

Retention: Files older than backupRetentionDays are auto-cleaned (default 3 days)

TXT Export: When enabled, creates notes_export_{tab}.txt (overwritten each time)

On Startup: Initial backup runs 5 seconds after plugin initialization

X. Performance & Limits
Parameter	Value	Description
MAX_NOTE_LEN	2000 chars	Maximum characters per note
RETAIN_NOTES	500	Max notes per tab (oldest auto-removed)
SPAM_DELAY	200ms	Minimum interval between posts per user
MAX_STORAGE_WARNING	400 notes	Warning threshold per tab
AUTO_COLLAPSE_LINES	100 lines	Auto-collapse notes exceeding this
MAX_IMG_SIZE	40MB	Maximum image upload size
MAX_FILE_SIZE	500MB	Maximum video/attachment upload size
TEMP_IMG_TTL	1 hour	Temp image lifetime before cleanup

XI. Key Technical Points
Image Promotion: Uploaded images go to temp/ first, then moved to permanent storage when the note is saved

Orphan Cleanup: Temp images not referenced by any note after 1 hour are removed

Concurrent Safety: Uses per-tab databases with rewriteLater for performance

Real-Time Notifications: Uses HFS event system for instant multi-client sync

Mobile Optimization: Handles virtual keyboard viewport changes for sticky headers

Content Rendering: Supports inline images, videos, attachments, links, and auto-detection of image URLs

Search: Case-insensitive regex matching with individual match navigation

XII. Browser Compatibility
Modern browsers (Chrome, Firefox, Safari, Edge)

Mobile responsive with separate layouts for ≤768px and >768px

Touch support for mobile long-press upload

VisualViewport API for mobile keyboard handling




<img width="3072" height="4096" alt="IMG_20260706_163135" src="https://github.com/user-attachments/assets/1a602d18-5d48-4fbb-9804-349ff2cfa1f3" />
<img width="4096" height="3072" alt="IMG_20260706_163142" src="https://github.com/user-attachments/assets/514f86b9-622b-49f9-84d4-20d3c9a02f9c" />
<img width="4096" height="3072" alt="IMG_20260706_163234" src="https://github.com/user-attachments/assets/bab1b62b-40e7-43f6-9ee6-7af2acbacc24" />
<img width="4096" height="3072" alt="IMG_20260706_163154" src="https://github.com/user-attachments/assets/c3a92d88-8d24-4a75-a2d0-92e13b10457a" />
<img width="4096" height="3072" alt="IMG_20260706_163310" src="https://github.com/user-attachments/assets/348bfa5f-7234-47e2-a0cc-99da338ed771" />

