在阅读下面用AI写的内容之前，我先简单介绍这个插件，为了满足我日常工作生活便捷需要而利用deepseek写下这个工具，并且会在随后的日子里不断使用、完善、优化，力求做到最纯粹的多设备同步的档案记录，值得注意的是需要登录后刷新页面才会出现这个按钮，由于我一直时个人工作使用，所以不会考虑多用户介入共用，虽然这是基于聊天插件进行改进开发，但我日常很少与人聊天，所以都基本是自言自语为主要用途，基于安全性考虑大家斟酌使用。

Before reading the AI-generated content below, let me briefly introduce this plugin. I created this tool with the help of DeepSeek to meet the convenience needs of my daily work and life, and I will continue to use, refine, and optimize it over time, striving to make it the most streamlined multi-device synchronization archive tool possible. One thing to note is that you need to refresh the page after logging in for the button to appear. Since I have always used it for personal work, I do not consider multi-user shared access. Although this was developed based on a chat plugin, I rarely chat with others in daily life, so it is primarily used for self-dialogue. For security considerations, please use it with discretion.





Notes Plugin Documentation
I. Overview
Notes is a lightweight, built-in note-taking tool for HFS (HTTP File Server) that supports multi-tab management, real-time synchronization, auto-backup, TXT export, and file uploads (images, videos, and attachments). Version 2.4 introduces a revolutionary file-based storage architecture that eliminates note limits and provides superior data resilience.

Version: 2.4
API Required: 8.87
Repository: Hug3O/Notes

II. Key Features
Feature	Description
File-Based Storage	Each note stored as an independent JSON file for maximum reliability
Unlimited Notes	No maximum note count or character limit per note
Crash Resilience	Single corrupted note never affects the entire database
Multi-Tab	Create multiple independent note tabs, rename, reorder
Real-Time Sync	Notes sync instantly across all connected clients via WebSocket
File Uploads	Support images (40MB), videos (100MB), and other files (100MB)
Drag & Drop	Drag files directly into the panel to upload
Long Press Upload	Long press the Send button to upload files
Note Editing	Double-click notes to edit, Shift+Enter to save
Star/Filter	Star important notes, filter to show starred only
Collapse/Expand	Auto-collapse long notes (>100 lines), manual toggle
Search	Full-text search with match navigation (▲/▼)
Fullscreen Mode	Click the title to enter 3-column fullscreen view
Auto-Backup	Configurable interval backups with retention policy
TXT Export	Auto-export notes as individual TXT files organized by tab
Font Control	Increase (A+) or reset (A) font size
User Restrictions	Optional whitelist for allowed users
Admin Panel	Overview, backup, import/export, clear tabs via API
III. Version 2.4 - What's New
🏗️ File-Based Storage Architecture
The entire storage system has been rebuilt from the ground up. Each note is now stored as an independent file rather than being packed into a single database.

Benefits:

No Note Limits: Removed the 500-notes-per-tab limit

No Character Limits: Removed the 2000-character-per-note limit

Crash Isolation: A single corrupted note file won't crash the entire tab or plugin

Easy Recovery: Damaged notes can be deleted individually without data loss

Better Backup: Mirror-based backups preserve the exact file structure

📂 TXT Export Overhaul
TXT exports now mirror the file structure:

Each export creates a timestamped folder

Inside, each tab has its own subdirectory

Each note is exported as an individual .txt file

File names use the note's timestamp for easy identification

IV. Configuration Options
Config	Type	Default	Description
tabList	Array	[{ name: 'General', publicNote: false }]	Define tabs. Each tab has independent storage. Set publicNote: true to allow guest access
backupInterval	Number	6	Hours between auto-backups (0 = disabled)
backupRetentionDays	Number	3	Days to retain backup files before cleanup
autoExportTxt	Boolean	true	Auto-export notes as individual TXT files alongside each backup
restrictUsers	Boolean	false	Restrict access to specific users only
allowedUsers	List	[]	Whitelist of usernames (only when restrictUsers is true)
ffmpeg_path	String	ffmpeg.exe	Path to FFmpeg for video thumbnail extraction
thumbnail_time	String	00:00:05	Time position for video thumbnail (HH:MM:SS)
thumbQuality	Number	70	JPEG quality for thumbnails (1-100)
thumbPixels	Number	800	Longest side dimension of thumbnails in pixels
useSharpPlugin	Boolean	true	Use rejetto/sharp plugin for better thumbnails
V. How to Use
5.1 Opening Notes
Click the ✐ Notes button in the HFS menu bar. The notes panel appears as:

Desktop: Sliding panel on the right side (450px wide)

Mobile: Full-screen panel from the bottom

5.2 Managing Tabs
Switch tabs: Click on tab names

Star filter: Click the active tab again to toggle starred notes filter (★ indicator)

Rename tabs: Triple-click a tab quickly, type new name, press Enter to save

Reorder tabs: Use ◀ ▶ buttons to move tabs left/right

5.3 Writing Notes
Type your note in the input field at the bottom

Press Shift+Enter or click Send to submit

No character limit - write as much as you need

Long notes (>100 lines) are auto-collapsed for readability

5.4 Uploading Files
Method 1 - Long Press: Long press the Send button (≥600ms) to open file picker. Supports multi-select.

Method 2 - Drag & Drop: Drag files directly into the notes panel. A dashed border indicates the upload zone.

Method 3 - Edit Mode: Double-click a note to edit, click the 📎 button to upload files.

Supported File Types:

Type	Max Size	Storage	Tag Format
Images	40MB	img/	[img:fileId]
Videos	100MB	mov/	[mov:fileId:name]
Audio	100MB	mov/	[mov:fileId:name]
Others	100MB	att/	[att:fileId:name]
5.5 Managing Notes
Star: Click ★ on a note to mark as important

Edit: Double-click a note to enter edit mode

Delete: Click × button on a note (confirmation required)

Collapse/Expand: Click ▼/▶ to toggle long notes

Copy: In edit mode, click 📋 to copy all content

5.6 Searching
Click Ϙ (search toggle) in the header

Type search term - notes with matches are filtered

Use ▲/▼ to navigate between matches

Active match is highlighted and scrolled into view

Click ✕ to exit search

5.7 Font Size
Use A+ and A buttons in the header to increase or reset font size.

5.8 Fullscreen Mode
Click the Notes title to enter fullscreen mode with a 3-column grid view. The active tab is in the left column, with adjacent tabs in the middle and right columns. Click the title again or press Esc to exit.

VI. Storage Architecture (v2.4)
6.1 Directory Structure
text
storage/
├── tabs/                              # New file-based note storage
│   ├── _tabs_map.json                 # Tab order & custom names mapping
│   ├── General/                       # Tab folder (sanitized name)
│   │   ├── _index.json                # Tab index: timestamps + metadata
│   │   ├── 2026-07-09T14_30_25_000Z.json   # Individual note content
│   │   ├── 2026-07-09T14_31_10_000Z.json
│   │   └── ...
│   ├── Work/
│   │   ├── _index.json
│   │   └── ...
│   └── Personal/
│       ├── _index.json
│       └── ...
├── img/                               # Images (by tab)
│   └── {tab}/
│       ├── temp/                      # Temporary images (auto-promoted)
│       └── *.jpg/png/webp...
├── mov/                               # Videos & Audio (by tab)
│   └── {tab}/
│       ├── .filenames                 # Original filename mapping
│       └── *.mp4/webm/mp3...
├── att/                               # Attachments (by tab)
│   └── {tab}/
│       ├── .filenames                 # Original filename mapping
│       └── *.*
├── thumb/                             # Thumbnails (by tab)
│   └── {tab}/
│       └── *.jpg
└── backup/                            # Backups
    ├── 20260709_143025/               # JSON mirror backup folder
    │   └── tabs/
    │       ├── _tabs_map.json
    │       ├── General/
    │       │   ├── _index.json
    │       │   └── *.json
    │       └── ...
    └── txt_exports/                   # TXT export folder
        └── 20260709_143025/           # Export timestamp folder
            ├── General/               # Tab subdirectory
            │   ├── 2026-07-09T14_30_25_000Z.txt
            │   ├── 2026-07-09T14_31_10_000Z.txt
            │   └── ...
            └── Work/
                └── ...
6.2 Core Data Files
_tabs_map.json - Tab Mapping
json
{
  "order": ["General", "Work", "Personal"],
  "names": {
    "Work": "Office Notes",
    "Personal": "My Diary"
  }
}
<tab>/_index.json - Tab Index
json
{
  "notes": {
    "2026-07-09T14:30:25.000Z": {
      "u": "admin",
      "starred": false,
      "collapsed": false
    },
    "2026-07-09T14:31:10.000Z": {
      "u": "user1",
      "starred": true,
      "collapsed": true
    }
  }
}
<tab>/<timestamp>.json - Note Content
text
This is the plain text content of the note.
No metadata - just the message body.
Can be extremely long without limits.
6.3 File ID Format
Media files use: YYYYMMDDHHmmss_xxxxxx.ext

Timestamp portion: 14 digits (year, month, day, hour, minute, second)

Random portion: 6 hex characters

Extension: Preserved from original file

VII. Data Flow
7.1 Adding a Note
Client sends POST /api/notes/add with {m: "text", tab: "General"}

Server sanitizes text (removes dangerous characters)

Server creates timestamp: new Date().toISOString()

Server writes content to tabs/General/<timestamp>.json

Server updates tabs/General/_index.json with metadata

Server broadcasts newNote event to all connected clients

If autoExportTxt is enabled, triggers TXT export

7.2 Reading Notes (Paginated)
Client sends GET /api/notes/list?tab=General&offset=0&limit=10

Server reads tabs/General/_index.json to get all timestamps

Server slices timestamps by offset/limit (newest first)

For each timestamp, reads tabs/General/<timestamp>.json

Returns combined notes with metadata, thumbnail info, and file names

7.3 Backup Process
Creates backup/<timestamp>/tabs/ directory

Copies entire tabs/ folder structure (mirror backup)

Also copies _tabs_map.json

If autoExportTxt is enabled, creates individual TXT files

VIII. Cleanup Mechanisms
8.1 On Note Deletion
Removes entry from _index.json

Deletes the note content file (<timestamp>.json)

Deletes all referenced images, videos, attachments from storage

Cleans up filename mappings

8.2 On Note Update
Compares old and new content references

Removes files no longer referenced

Promotes temp images to permanent storage

8.3 On Tab Clear (Admin)
Backs up data first

Deletes entire tab folder (tabs/<tab>/)

Removes all files in img/, mov/, att/ directories for that tab

Cleans temp directory and thumbnails

Re-creates empty tab directory on next use

8.4 Temp Image Cleanup
Runs every hour via timer

Removes temp images older than 1 hour (TEMP_IMG_TTL)

Empty temp directories are removed

8.5 Backup Cleanup
Runs after each backup

Removes backup folders older than backupRetentionDays

Removes TXT export folders older than backupRetentionDays

IX. Video & Audio Player
9.1 Video Player
Initial State: Thumbnail cover with ▶ play icon (when thumbnail available)

Fallback: Dark background with ▶ and "Click to play video" text

On Click: Cover/placeholder hides, video loads and plays

After Play: Native HTML5 video controls appear

Thumbnails: Auto-extracted using FFmpeg at configured time position

Multiple Attempts: FFmpeg tries multiple time offsets to avoid black frames

9.2 Audio Player
Compact inline player with 🎵 icon

Shows filename above the player

Native HTML5 audio controls

X. Admin API Endpoints
All admin endpoints require authentication and appropriate permissions.

Endpoint	Method	Description
/~/api/notes/admin/overview	GET	Database stats, backups, file statistics
/~/api/notes/admin/export	GET	Export all notes as JSON (optional ?tab=xxx)
/~/api/notes/admin/import	POST	Import notes from JSON (auto-backup first)
/~/api/notes/admin/backup	POST	Trigger manual backup + TXT export
/~/api/notes/admin/clear	POST	Clear all notes and files for a tab
/~/api/notes/admin/export-txt	POST	Trigger manual TXT export
XI. Public API Endpoints
Endpoint	Method	Description
/~/api/notes/check	GET	Check access and guest status
/~/api/notes/tabs	GET	Get tab list, counts, names
/~/api/notes/list	GET	Paginated note listing (?tab=&offset=&limit=)
/~/api/notes/add	POST	Add a new note ({m, tab, collapsed?})
/~/api/notes/update	POST	Update existing note ({ts, tab, m})
/~/api/notes/toggle-star	POST	Toggle star status ({ts, tab})
/~/api/notes/toggle-collapse	POST	Toggle collapse status ({ts, tab})
/~/api/notes/delete	POST	Delete a note ({ts, tab})
/~/api/notes/reorder-tabs	POST	Reorder tabs ({tabs: [...]})
/~/api/notes/rename-tab	POST	Rename a tab ({tab, newName})
/~/api/notes/upload-image	POST	Upload an image (base64)
/~/api/notes/upload-file	POST	Upload a video/audio/file (base64)
XII. Auto-Backup & Export
Backup Interval: Default every 6 hours (configurable via backupInterval)

Backup Format: Full mirror of tabs/ directory structure

Backup Location: backup/<YYYYMMDD_HHmmss>/tabs/

Retention: Folders older than backupRetentionDays are auto-deleted (default 3 days)

TXT Export: Each note exported as individual .txt file in backup/txt_exports/<timestamp>/<tab>/

On Startup: Initial backup triggered via config subscription (500ms delay)

On Config Change: Immediate backup triggered when backup settings change

XIII. Performance & Limits
Parameter	Value	Description
PAGE_SIZE	10	Notes loaded per page
SPAM_DELAY	200ms	Minimum interval between posts per user
MAX_STORAGE_WARNING	400 notes	Warning threshold per tab (soft limit)
MAX_IMG_SIZE	40MB	Maximum image upload size
MAX_FILE_SIZE	100MB	Maximum video/attachment upload size
TEMP_IMG_TTL	1 hour	Temp image lifetime before cleanup
THUMB_QUALITY	85	Default JPEG quality for thumbnails
Note: Version 2.4 has no hard limits on note count or character length. The storage warning is informational only.

XIV. Key Technical Points
File-Based Isolation: Each note is a separate file. Corruption in one file cannot affect others

Atomic Operations: Index updates and content writes are separate operations for safety

Image Promotion: Uploaded images go to temp/ first, then moved to permanent storage when the note is saved

Orphan Cleanup: Temp images not referenced by any note after 1 hour are removed

Real-Time Notifications: Uses HFS WebSocket event system for instant multi-client sync

Mobile Optimization: Handles virtual keyboard viewport changes for sticky headers

Content Rendering: Supports inline images, videos, attachments, links, and auto-detection of image URLs

Search: Case-insensitive regex matching with individual match navigation

Video Thumbnails: FFmpeg extraction with multiple time-offset attempts to avoid black frames

Sharp Integration: Optional rejetto/sharp plugin for better image thumbnail quality

XV. Migration from v1.x/v2.0-v2.3
Version 2.4 uses a completely new file-based storage system. Old notes_*.json database files are not automatically migrated. To migrate:

Export data from the admin panel (JSON format) before upgrading

Upgrade to v2.4

Import the JSON export via the admin panel

Verify all notes are intact

Old database files (notes_*.json) in the storage directory can be safely removed after migration.

XVI. Browser Compatibility
Modern browsers (Chrome, Firefox, Safari, Edge)

Mobile responsive with separate layouts for ≤768px and >768px

Touch support for mobile long-press upload

VisualViewport API for mobile keyboard handling

Fullscreen API support required for fullscreen mode

EventSource (SSE) support required for real-time notifications




<img width="3072" height="4096" alt="IMG_20260706_163135" src="https://github.com/user-attachments/assets/1a602d18-5d48-4fbb-9804-349ff2cfa1f3" />
<img width="4096" height="3072" alt="IMG_20260706_163142" src="https://github.com/user-attachments/assets/514f86b9-622b-49f9-84d4-20d3c9a02f9c" />
<img width="4096" height="3072" alt="IMG_20260706_163234" src="https://github.com/user-attachments/assets/bab1b62b-40e7-43f6-9ee6-7af2acbacc24" />
<img width="4096" height="3072" alt="IMG_20260706_163154" src="https://github.com/user-attachments/assets/c3a92d88-8d24-4a75-a2d0-92e13b10457a" />
<img width="4096" height="3072" alt="IMG_20260706_163310" src="https://github.com/user-attachments/assets/348bfa5f-7234-47e2-a0cc-99da338ed771" />

<img width="4096" height="3072" alt="IMG_20260707_133103" src="https://github.com/user-attachments/assets/053c8fc6-fc69-41d4-9f7b-9494e4a3b3c8" />
