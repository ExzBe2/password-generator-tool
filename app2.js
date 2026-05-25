/**
 * PDF Word 转换工具模块
 */
const DocConverter = {
    mode: 'pdf-to-word',
    files: [],
    elements: {},
    
    init() {
        this.elements = {
            modeBtns: document.querySelectorAll('.mode-btn'),
            convertBtn: document.getElementById('convertBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            progressContainer: document.getElementById('progressContainer'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            downloadSection: document.getElementById('downloadSection'),
            fileInfo: document.getElementById('fileInfo'),
            
            // PDF 转 Word
            pdfUploadArea: document.getElementById('pdfUploadArea'),
            pdfFileInput: document.getElementById('pdfFileInput'),
            pdfFilesList: document.getElementById('pdfFilesList'),
            pdfKeepFormat: document.getElementById('pdfKeepFormat'),
            pdfExtractImages: document.getElementById('pdfExtractImages'),
            
            // Word 转 PDF
            wordUploadArea: document.getElementById('wordUploadArea'),
            wordFileInput: document.getElementById('wordFileInput'),
            wordFilesList: document.getElementById('wordFilesList'),
            wordIncludeStyles: document.getElementById('wordIncludeStyles'),
            wordCompress: document.getElementById('wordCompress'),
            
            // 图片转 Word
            imageUploadArea: document.getElementById('imageUploadArea'),
            imageFileInput: document.getElementById('imageFileInput'),
            imageFilesList: document.getElementById('imageFilesList'),
            imageAddCaption: document.getElementById('imageAddCaption'),
            imageAutoSize: document.getElementById('imageAutoSize')
        };
        
        this.bindEvents();
    },
    
    bindEvents() {
        // 模式切换
        this.elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                this.elements.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 隐藏所有模式面板
                document.querySelectorAll('.mode-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                // 显示当前模式面板
                const panelIds = {
                    'pdf-to-word': 'pdfToWordPanel',
                    'word-to-pdf': 'wordToPdfPanel',
                    'image-to-word': 'imageToWordPanel'
                };
                const panelId = panelIds[this.mode];
                const panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
                
                // 重置文件列表
                this.files = [];
                this.updateFilesList();
                this.hideDownloadSection();
            });
        });
        
        // PDF 上传
        this.elements.pdfUploadArea.addEventListener('click', () => {
            this.elements.pdfFileInput.click();
        });
        
        this.elements.pdfFileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, 'pdf');
        });
        
        // 拖拽上传 PDF
        this.elements.pdfUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.pdfUploadArea.classList.add('dragover');
        });
        
        this.elements.pdfUploadArea.addEventListener('dragleave', () => {
            this.elements.pdfUploadArea.classList.remove('dragover');
        });
        
        this.elements.pdfUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.pdfUploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files, 'pdf');
        });
        
        // Word 上传
        this.elements.wordUploadArea.addEventListener('click', () => {
            this.elements.wordFileInput.click();
        });
        
        this.elements.wordFileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, 'word');
        });
        
        // 拖拽上传 Word
        this.elements.wordUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.wordUploadArea.classList.add('dragover');
        });
        
        this.elements.wordUploadArea.addEventListener('dragleave', () => {
            this.elements.wordUploadArea.classList.remove('dragover');
        });
        
        this.elements.wordUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.wordUploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files, 'word');
        });
        
        // 图片上传
        this.elements.imageUploadArea.addEventListener('click', () => {
            this.elements.imageFileInput.click();
        });
        
        this.elements.imageFileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, 'image');
        });
        
        // 拖拽上传图片
        this.elements.imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.imageUploadArea.classList.add('dragover');
        });
        
        this.elements.imageUploadArea.addEventListener('dragleave', () => {
            this.elements.imageUploadArea.classList.remove('dragover');
        });
        
        this.elements.imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.imageUploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files, 'image');
        });
        
        // 转换按钮
        this.elements.convertBtn.addEventListener('click', () => {
            this.convert();
        });
        
        // 下载按钮
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadFile();
        });
        
        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const activePanel = document.querySelector('.tool-panel.active');
                if (activePanel && activePanel.id === 'todoPanel') {
                    e.preventDefault();
                    this.convert();
                }
            }
        });
    },
    
    handleFiles(files, type) {
        if (!files || files.length === 0) return;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // 验证文件类型
            let isValid = false;
            if (type === 'pdf' && file.type === 'application/pdf') {
                isValid = true;
            } else if (type === 'word' && (file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
                isValid = true;
            } else if (type === 'image' && file.type.startsWith('image/')) {
                isValid = true;
            }
            
            if (!isValid) {
                const typeName = type === 'pdf' ? 'PDF' : (type === 'word' ? 'Word' : '图片');
                Toast.show(`请选择${typeName}文件`, 'error');
                continue;
            }
            
            const fileData = {
                id: Date.now() + i,
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            };
            
            this.files.push(fileData);
        }
        
        this.updateFilesList();
        Toast.show(`已添加 ${files.length} 个文件`, 'success');
    },
    
    updateFilesList() {
        let listId = null;
        let fileIcon = '';
        
        switch (this.mode) {
            case 'pdf-to-word':
                listId = 'pdfFilesList';
                fileIcon = '📄';
                break;
            case 'word-to-pdf':
                listId = 'wordFilesList';
                fileIcon = '📝';
                break;
            case 'image-to-word':
                listId = 'imageFilesList';
                fileIcon = '🖼️';
                break;
        }
        
        if (!listId) {
            this.files = [];
            return;
        }
        
        const list = document.getElementById(listId);
        
        if (this.files.length === 0) {
            list.innerHTML = '';
            return;
        }
        
        list.innerHTML = this.files.map((file, index) => `
            <div class="uploaded-file">
                <span class="file-icon">${fileIcon}</span>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatSize(file.size)}</div>
                </div>
                <button class="remove-file" onclick="DocConverter.removeFile(${file.id})">×</button>
            </div>
        `).join('');
    },
    
    removeFile(id) {
        const index = this.files.findIndex(f => f.id === id);
        if (index !== -1) {
            this.files.splice(index, 1);
            this.updateFilesList();
            this.hideDownloadSection();
            Toast.show('文件已移除', 'info');
        }
    },
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    
    async convert() {
        this.showProgress(0, '准备转换...');
        this.hideDownloadSection();
        
        try {
            switch (this.mode) {
                case 'pdf-to-word':
                    await this.convertPdfToWord();
                    break;
                case 'word-to-pdf':
                    await this.convertWordToPdf();
                    break;
                case 'image-to-word':
                    await this.convertImageToWord();
                    break;
            }
        } catch (error) {
            console.error('转换失败:', error);
            Toast.show('转换失败: ' + error.message, 'error');
            this.hideProgress();
        }
    },
    
    async convertPdfToWord() {
        if (this.files.length === 0) {
            Toast.show('请先添加PDF文件', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(20, '正在解析PDF...');
        
        await this.simulateProgress(50, '提取文本内容...');
        await this.simulateProgress(80, '转换格式...');
        await this.simulateProgress(100, '生成文档...');
        
        this.hideProgress();
        this.showDownloadSection('PDF转Word', this.files[0].name.replace('.pdf', '.docx'));
        Toast.show('PDF转Word成功！', 'success');
    },
    
    async convertWordToPdf() {
        if (this.files.length === 0) {
            Toast.show('请先添加Word文件', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(20, '正在读取Word...');
        
        await this.simulateProgress(50, '解析文档结构...');
        await this.simulateProgress(80, '渲染页面...');
        await this.simulateProgress(100, '生成PDF...');
        
        this.hideProgress();
        this.showDownloadSection('Word转PDF', this.files[0].name.replace(/\.(doc|docx)$/, '.pdf'));
        Toast.show('Word转PDF成功！', 'success');
    },
    
    async convertImageToWord() {
        if (this.files.length === 0) {
            Toast.show('请先添加图片文件', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(10, '正在处理图片...');
        
        const step = 80 / this.files.length;
        for (let i = 0; i < this.files.length; i++) {
            const percent = 10 + (i + 1) * step;
            await this.simulateProgress(Math.min(percent, 90), `处理图片 ${i + 1}/${this.files.length}...`);
        }
        
        await this.simulateProgress(100, '生成Word文档...');
        
        this.hideProgress();
        this.showDownloadSection('图片转Word', `共 ${this.files.length} 张图片`);
        Toast.show('图片转Word成功！', 'success');
    },
    
    simulateProgress(targetPercent, message) {
        return new Promise((resolve) => {
            const currentPercent = parseInt(this.elements.progressFill.style.width) || 0;
            const steps = 10;
            const increment = (targetPercent - currentPercent) / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                const newPercent = Math.min(currentPercent + increment * currentStep, targetPercent);
                this.elements.progressFill.style.width = newPercent + '%';
                this.elements.progressText.textContent = message;
                
                if (currentStep >= steps) {
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    },
    
    downloadFile() {
        const fileNames = this.files.map(f => f.name).join(', ');
        Toast.show(`正在准备下载: ${fileNames}`, 'info');
        
        // 创建模拟下载
        const downloadContent = `这是转换后的文档内容。
        
转换模式: ${this.getModeName()}
源文件: ${fileNames}
转换时间: ${new Date().toLocaleString('zh-CN')}
`;
        
        const extension = this.mode === 'pdf-to-word' ? '.docx' : 
                         (this.mode === 'word-to-pdf' ? '.pdf' : '.docx');
        
        const blob = new Blob([downloadContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_document${extension}`;
        a.click();
        URL.revokeObjectURL(url);
        
        Toast.show('文件已下载！', 'success');
    },
    
    getModeName() {
        switch (this.mode) {
            case 'pdf-to-word': return 'PDF → Word';
            case 'word-to-pdf': return 'Word → PDF';
            case 'image-to-word': return '图片 → Word';
            default: return '未知';
        }
    },
    
    showProgress(percent, text) {
        this.elements.progressContainer.style.display = 'block';
        this.elements.progressFill.style.width = percent + '%';
        this.elements.progressText.textContent = text;
        this.elements.convertBtn.disabled = true;
    },
    
    hideProgress() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.convertBtn.disabled = false;
    },
    
    showDownloadSection(title, info) {
        this.elements.downloadSection.style.display = 'block';
        this.elements.fileInfo.textContent = `${title} - ${info}`;
    },
    
    hideDownloadSection() {
        this.elements.downloadSection.style.display = 'none';
    }
};

/**
 * 视频下载工具模块
 */
const VideoDownloader = {
    elements: {},
    currentVideo: null,
    selectedFormat: null,
    
    init() {
        this.elements = {
            urlInput: document.getElementById('videoUrlInput'),
            preview: document.getElementById('videoPreview'),
            previewImage: document.getElementById('previewImage'),
            videoTitle: document.getElementById('videoTitle'),
            videoAuthor: document.getElementById('videoAuthor'),
            videoDuration: document.getElementById('videoDuration'),
            formatOptions: document.getElementById('formatOptions'),
            downloadBtn: document.getElementById('videoDownloadBtn'),
            quickDownloadBtn: document.getElementById('quickDownloadBtn'),
            parseBtn: document.getElementById('parseBtn'),
            progressContainer: document.getElementById('videoProgressContainer'),
            progressFill: document.getElementById('videoProgressFill'),
            progressText: document.getElementById('videoProgressText'),
            downloadHistory: document.getElementById('downloadHistory')
        };
        
        this.bindEvents();
        this.loadHistory();
    },
    
    bindEvents() {
        // 输入链接后按回车解析
        this.elements.urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.parseUrl();
            }
        });
        
        // 解析按钮
        this.elements.parseBtn.addEventListener('click', () => {
            this.parseUrl();
        });
        
        // 下载按钮
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadVideo();
        });
        
        // 快速下载按钮
        this.elements.quickDownloadBtn.addEventListener('click', () => {
            this.downloadVideo();
        });
        
        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                const activePanel = document.querySelector('.tool-panel.active');
                if (activePanel && activePanel.id === 'videoPanel') {
                    e.preventDefault();
                    this.downloadVideo();
                }
            }
        });
    },
    
    async parseUrl() {
        const url = this.elements.urlInput.value.trim();
        
        if (!url) {
            Toast.show('请输入视频链接', 'error');
            return;
        }
        
        // 验证URL格式
        if (!this.isValidUrl(url)) {
            Toast.show('请输入有效的视频链接', 'error');
            return;
        }
        
        this.showProgress(10, '正在解析链接...');
        
        // 模拟解析过程
        await this.simulateProgress(30, '识别视频平台...');
        
        // 获取视频信息（模拟）
        const videoInfo = this.getMockVideoInfo(url);
        this.currentVideo = videoInfo;
        
        await this.simulateProgress(60, '获取视频信息...');
        
        // 显示预览
        this.showPreview(videoInfo);
        
        await this.simulateProgress(80, '获取可用格式...');
        
        // 显示格式选项
        this.showFormatOptions(videoInfo.formats);
        
        await this.simulateProgress(100, '解析完成');
        
        this.hideProgress();
        Toast.show('视频解析成功！', 'success');
    },
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },
    
    getMockVideoInfo(url) {
        // 根据URL判断平台
        let platform = '未知平台';
        let thumbnail = 'https://via.placeholder.com/400x225?text=Video+Thumbnail';
        
        if (url.includes('youtube')) {
            platform = 'YouTube';
            thumbnail = 'https://picsum.photos/400/225?random=1';
        } else if (url.includes('bilibili') || url.includes('b站')) {
            platform = 'Bilibili';
            thumbnail = 'https://picsum.photos/400/225?random=2';
        } else if (url.includes('douyin') || url.includes('tiktok')) {
            platform = '抖音/TikTok';
            thumbnail = 'https://picsum.photos/400/225?random=3';
        } else if (url.includes('kuaishou')) {
            platform = '快手';
            thumbnail = 'https://picsum.photos/400/225?random=4';
        } else if (url.includes('weibo')) {
            platform = '微博';
            thumbnail = 'https://picsum.photos/400/225?random=5';
        } else if (url.includes('xiaohongshu')) {
            platform = '小红书';
            thumbnail = 'https://picsum.photos/400/225?random=6';
        }
        
        return {
            title: '示例视频标题 - 这是一个精彩的视频内容',
            author: '视频作者 @username',
            duration: '03:45',
            thumbnail: thumbnail,
            platform: platform,
            formats: [
                { quality: '1080P', size: '25.6 MB', url: '#', id: '1080' },
                { quality: '720P', size: '15.2 MB', url: '#', id: '720' },
                { quality: '480P', size: '8.5 MB', url: '#', id: '480' },
                { quality: '360P', size: '4.2 MB', url: '#', id: '360' }
            ]
        };
    },
    
    showPreview(info) {
        this.elements.preview.style.display = 'block';
        this.elements.previewImage.src = info.thumbnail;
        this.elements.videoTitle.textContent = info.title;
        this.elements.videoAuthor.textContent = `${info.author} | ${info.platform}`;
        this.elements.videoDuration.textContent = `时长: ${info.duration}`;
    },
    
    showFormatOptions(formats) {
        this.elements.formatOptions.innerHTML = formats.map((format, index) => `
            <div class="format-option ${index === 0 ? 'active' : ''}" data-format="${format.id}" data-url="${format.url}">
                <span class="format-quality">${format.quality}</span>
                <span class="format-size">${format.size}</span>
            </div>
        `).join('');
        
        // 设置默认选中
        this.selectedFormat = formats[0];
        
        // 绑定格式选择事件
        document.querySelectorAll('.format-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.format-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                const formatId = option.dataset.format;
                this.selectedFormat = formats.find(f => f.id === formatId);
            });
        });
        
        // 启用下载按钮
        this.elements.downloadBtn.disabled = false;
        this.elements.quickDownloadBtn.disabled = false;
    },
    
    async downloadVideo() {
        if (!this.currentVideo || !this.selectedFormat) {
            Toast.show('请先解析视频链接', 'error');
            return;
        }
        
        this.showProgress(0, '准备下载...');
        
        await this.simulateProgress(30, '连接服务器...');
        await this.simulateProgress(60, '正在下载...');
        await this.simulateProgress(90, '处理文件...');
        await this.simulateProgress(100, '下载完成');
        
        this.hideProgress();
        
        // 模拟下载
        const content = `视频下载模拟文件
标题: ${this.currentVideo.title}
画质: ${this.selectedFormat.quality}
大小: ${this.selectedFormat.size}
下载时间: ${new Date().toLocaleString('zh-CN')}
`;
        
        const blob = new Blob([content], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentVideo.title.substring(0, 20)}.mp4`;
        a.click();
        URL.revokeObjectURL(url);
        
        // 添加到历史记录
        this.addToHistory(this.currentVideo.title, this.selectedFormat.quality);
        
        Toast.show('视频下载成功！', 'success');
    },
    
    addToHistory(title, quality) {
        const history = this.getHistory();
        const record = {
            id: Date.now(),
            title: title,
            quality: quality,
            time: new Date().toLocaleString('zh-CN')
        };
        
        history.unshift(record);
        
        // 只保留最近10条记录
        if (history.length > 10) {
            history.pop();
        }
        
        localStorage.setItem('video_download_history', JSON.stringify(history));
        this.loadHistory();
    },
    
    getHistory() {
        const stored = localStorage.getItem('video_download_history');
        return stored ? JSON.parse(stored) : [];
    },
    
    loadHistory() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            this.elements.downloadHistory.innerHTML = '<li style="text-align: center; color: var(--cns-text-dim); padding: 10px;">暂无下载记录</li>';
            return;
        }
        
        this.elements.downloadHistory.innerHTML = history.map(record => `
            <li class="history-item">
                <span class="history-icon">📹</span>
                <div class="history-info">
                    <div class="history-title-text">${record.title}</div>
                    <div class="history-time">${record.quality} | ${record.time}</div>
                </div>
                <button class="history-delete" onclick="VideoDownloader.deleteHistory(${record.id})">×</button>
            </li>
        `).join('');
    },
    
    deleteHistory(id) {
        const history = this.getHistory().filter(item => item.id !== id);
        localStorage.setItem('video_download_history', JSON.stringify(history));
        this.loadHistory();
        Toast.show('记录已删除', 'info');
    },
    
    simulateProgress(targetPercent, message) {
        return new Promise((resolve) => {
            const currentPercent = parseInt(this.elements.progressFill.style.width) || 0;
            const steps = 10;
            const increment = (targetPercent - currentPercent) / steps;
            let currentStep = 0;
            
            const interval = setInterval(() => {
                currentStep++;
                const newPercent = Math.min(currentPercent + increment * currentStep, targetPercent);
                this.elements.progressFill.style.width = newPercent + '%';
                this.elements.progressText.textContent = message;
                
                if (currentStep >= steps) {
                    clearInterval(interval);
                    resolve();
                }
            }, 80);
        });
    },
    
    showProgress(percent, text) {
        this.elements.progressContainer.style.display = 'block';
        this.elements.progressFill.style.width = percent + '%';
        this.elements.progressText.textContent = text;
        this.elements.downloadBtn.disabled = true;
        this.elements.quickDownloadBtn.disabled = true;
    },
    
    hideProgress() {
        this.elements.progressContainer.style.display = 'none';
        this.elements.downloadBtn.disabled = false;
        this.elements.quickDownloadBtn.disabled = false;
    }
};

/**
 * 导航控制
 */
const Navigation = {
    init() {
        const tabs = document.querySelectorAll('.nav-tab');
        const panels = document.querySelectorAll('.tool-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tool = tab.dataset.tool;
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                panels.forEach(panel => {
                    if (panel.id === `${tool}Panel`) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
                
                if (tool === 'password') {
                    PasswordGenerator.generate();
                }
            });
        });
    }
};

/**
 * 快捷键支持
 */
const Shortcuts = {
    init() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                document.querySelector('[data-tool="password"]').click();
                PasswordGenerator.generate();
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    PasswordGenerator.init();
    DocConverter.init();
    VideoDownloader.init();
    Shortcuts.init();
});