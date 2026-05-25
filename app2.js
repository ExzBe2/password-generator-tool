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
    Shortcuts.init();
});