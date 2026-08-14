在阅读下面用AI写的内容之前，我先简单介绍这个插件，为了满足我日常工作生活便捷需要而利用deepseek写下这个工具，并且会在随后的日子里不断使用、完善、优化，力求做到最纯粹的多设备同步的档案记录，值得注意的是需要登录后刷新页面才会出现这个按钮，由于我一直时个人工作使用，所以不会考虑多用户介入共用，虽然这是基于聊天插件进行改进开发，但我日常很少与人聊天，所以都基本是自言自语为主要用途，基于安全性考虑大家斟酌使用。

Before reading the AI-generated content below, let me briefly introduce this plugin. I created this tool with the help of DeepSeek to meet the convenience needs of my daily work and life, and I will continue to use, refine, and optimize it over time, striving to make it the most streamlined multi-device synchronization archive tool possible. One thing to note is that you need to refresh the page after logging in for the button to appear. Since I have always used it for personal work, I do not consider multi-user shared access. Although this was developed based on a chat plugin, I rarely chat with others in daily life, so it is primarily used for self-dialogue. For security considerations, please use it with discretion.




Notes Plugin - User Guide
📝 Introduction
Notes is a lightweight note-taking tool integrated directly into HFS (HTTP File Server). It allows you to:

Create multiple independent tabs to organize your notes

Support text, images, videos, audio, and file attachments

Auto-save notes with real-time synchronization

Search, star, and collapse notes for better management

🚀 Getting Started
1. Open Notes
Click the 「✐ Notes」 button in the HFS top menu bar. The notes panel will slide out from the right side.

2. Send a Note
Type your message in the input box at the bottom

Press Shift + Enter to send

3. Upload Files
Long press the "Send" button (about 0.6 seconds) → Select files to upload

Or simply drag & drop files directly into the notes panel

Supported formats are automatically converted to the appropriate markup:

Images → [img:fileID]

Videos/Audio → [mov:fileID:displayName]

Other files → [att:fileID:displayName]

📂 Tab Management
Switch Tabs
Click on a tab name at the top to switch. Each tab stores its notes independently.

Filter by Stars
Single-click an active tab → Toggle "show only starred notes"

Rename a Tab
Double-click the tab name → Enter new name → Press Enter to confirm

Reorder Tabs
Click the sort buttons (◀ ▶) next to the tabs

Drag to adjust the order

📂 Category Management
Create/Assign Categories
In the plugin.js configuration, set the category field for each tab. Tabs with the same category will be automatically grouped together.

Switch Categories
Click a category label to filter and display only the tabs belonging to that category.

Rename a Category
Double-click the category name → Enter new name → Press Enter to confirm

Reorder Categories
Double-click the "All" category to enter sorting mode → Use ◀ ▶ buttons to adjust the order

⭐ Note Operations
Edit a Note
Double-click on the note content → Enter edit mode

Click ✓ to save, or press Shift + Enter

Click ✕ to cancel

Delete a Note
Click the ✕ button in the top-right corner of the note → Confirm deletion (all attachments will be removed as well)

Star a Note
Click the ★ button next to the note to mark it as important

Collapse/Expand
Click the ▼/▶ button in the top-right corner of the note to collapse long notes and save space

Copy Content
In edit mode, click the Ⓒ button to copy the entire note content

🔍 Search Function
Click the ⌢ search button at the top

Enter a keyword → Automatically searches all historical notes

Use the ▲/▼ buttons to jump to the previous/next match

🖥️ Fullscreen Mode
Click the "Notes" title to enter fullscreen mode (desktop only)

In fullscreen mode, all tabs in the current category are displayed side by side (up to 3 columns)

Press Esc or click ✕ to exit

🎯 Keyboard Shortcuts
Action	Shortcut
Send note	Shift + Enter
Save edit	Shift + Enter
Cancel edit	Esc
Open/Close Notes	Click menu button
⚙️ Admin Settings
The following options can be configured in the HFS plugin settings:

Setting	Description
Tab List	Add/remove/configure tabs and categories
Restrict Users	Restrict access to specific users
Backup Interval	Auto-backup interval (hours)
Auto Export TXT	Export notes as TXT files during backup
Thumbnail Settings	Video thumbnail format (JPG/GIF) and quality
FFmpeg Path	Path to FFmpeg for video thumbnail extraction
📦 Storage Locations
Type	Path
Note data	storage/notes/tabs/[TabName]/
Images	storage/notes/img/[TabName]/
Videos/Audio	storage/notes/mov/[TabName]/
Attachments	storage/notes/att/[TabName]/
Thumbnails	storage/notes/thumb/[TabName]/
Backups	storage/notes/backup/
❓ FAQ
Q: Can guests use Notes?
A: Yes, but only on tabs marked as "public notes," and they can only send plain text.

Q: What is the file size limit?
A: Images up to 80MB, other files up to 200MB.

Q: Are notes automatically backed up?
A: Yes, backups run automatically at the configured interval and are retained for the specified number of days.

📌 Tip: All data is stored on the server. Please perform regular backups to ensure data safety.

<img width="1080" height="2400" alt="Screenshot_2026-08-14-08-11-47-568_com android chrome" src="https://github.com/user-attachments/assets/931bc157-6f6c-4997-98bc-ec1543708a29" />
<img width="1080" height="2400" alt="Screenshot_2026-08-14-08-11-11-484_com android chrome" src="https://github.com/user-attachments/assets/5268c9f9-905a-4f4a-8452-d87d64cd7863" />
<img width="1080" height="2400" alt="Screenshot_2026-08-14-08-11-27-827_com android chrome" src="https://github.com/user-attachments/assets/fd6c8669-82b8-42c9-87a2-7ece5138606f" />



<img width="3072" height="4096" alt="IMG_20260706_163135" src="https://github.com/user-attachments/assets/1a602d18-5d48-4fbb-9804-349ff2cfa1f3" />
<img width="4096" height="3072" alt="IMG_20260706_163142" src="https://github.com/user-attachments/assets/514f86b9-622b-49f9-84d4-20d3c9a02f9c" />
<img width="4096" height="3072" alt="IMG_20260706_163234" src="https://github.com/user-attachments/assets/bab1b62b-40e7-43f6-9ee6-7af2acbacc24" />
<img width="4096" height="3072" alt="IMG_20260706_163154" src="https://github.com/user-attachments/assets/c3a92d88-8d24-4a75-a2d0-92e13b10457a" />
<img width="4096" height="3072" alt="IMG_20260706_163310" src="https://github.com/user-attachments/assets/348bfa5f-7234-47e2-a0cc-99da338ed771" />

<img width="4096" height="3072" alt="IMG_20260707_133103" src="https://github.com/user-attachments/assets/053c8fc6-fc69-41d4-9f7b-9494e4a3b3c8" />
