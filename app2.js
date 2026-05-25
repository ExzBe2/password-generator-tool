/**
 * PDF 转换工具模块
 */
const PdfConverter = {
    mode: 'image-to-pdf',
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
            
            // 图片转PDF
            imageUploadArea: document.getElementById('imageUploadArea'),
            imageFileInput: document.getElementById('imageFileInput'),
            imageFilesList: document.getElementById('imageFilesList'),
            imageLandscape: document.getElementById('imageLandscape'),
            imageCompress: document.getElementById('imageCompress'),
            
            // HTML转PDF
            htmlUrlInput: document.getElementById('htmlUrlInput'),
            htmlContentInput: document.getElementById('htmlContentInput'),
            htmlIncludeBackground: document.getElementById('htmlIncludeBackground'),
            htmlPrintMedia: document.getElementById('htmlPrintMedia'),
            
            // PDF合并
            pdfUploadArea: document.getElementById('pdfUploadArea'),
            pdfFileInput: document.getElementById('pdfFileInput'),
            pdfFilesList: document.getElementById('pdfFilesList')
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
                const panelId = `${this.mode.replace(/-/g, '')}Panel`;
                const panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
                
                // 重置文件列表
                this.files = [];
                this.updateFilesList();
                this.hideDownloadSection();
            });
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
        
        // PDF上传
        this.elements.pdfUploadArea.addEventListener('click', () => {
            this.elements.pdfFileInput.click();
        });
        
        this.elements.pdfFileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, 'pdf');
        });
        
        // 拖拽上传PDF
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
        
        // 转换按钮
        this.elements.convertBtn.addEventListener('click', () => {
            this.convert();
        });
        
        // 下载按钮
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadPdf();
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
            if (type === 'image' && !file.type.startsWith('image/')) {
                Toast.show('请选择图片文件', 'error');
                continue;
            }
            
            if (type === 'pdf' && file.type !== 'application/pdf') {
                Toast.show('请选择PDF文件', 'error');
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
        const listId = this.mode === 'image-to-pdf' ? 'imageFilesList' : 
                      (this.mode === 'merge-pdf' ? 'pdfFilesList' : null);
        
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
                <span class="file-icon">${this.mode === 'image-to-pdf' ? '🖼️' : '📄'}</span>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatSize(file.size)} - 第 ${index + 1} 页</div>
                </div>
                <button class="remove-file" onclick="PdfConverter.removeFile(${file.id})">×</button>
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
                case 'image-to-pdf':
                    await this.convertImagesToPdf();
                    break;
                case 'html-to-pdf':
                    await this.convertHtmlToPdf();
                    break;
                case 'merge-pdf':
                    await this.mergePdfs();
                    break;
            }
        } catch (error) {
            console.error('转换失败:', error);
            Toast.show('转换失败: ' + error.message, 'error');
            this.hideProgress();
        }
    },
    
    async convertImagesToPdf() {
        if (this.files.length === 0) {
            Toast.show('请先添加图片文件', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(10, '正在处理图片...');
        
        // 创建一个包含所有图片的HTML页面，然后使用打印功能导出
        const landscape = this.elements.imageLandscape.checked;
        
        // 创建临时容器
        const tempContainer = document.createElement('div');
        tempContainer.style.display = 'none';
        tempContainer.innerHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @page {
                        size: ${landscape ? 'landscape' : 'portrait'};
                        margin: 0;
                    }
                    body { margin: 0; }
                    .page { 
                        width: 100vw; 
                        height: 100vh; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        page-break-after: always;
                    }
                    img { max-width: 100%; max-height: 100%; object-fit: contain; }
                </style>
            </head>
            <body>
                ${this.files.map(f => `<div class="page"><img src="${URL.createObjectURL(f.file)}"></div>`).join('')}
            </body>
            </html>
        `;
        
        document.body.appendChild(tempContainer);
        
        // 使用 iframe 加载并打印
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        return new Promise((resolve) => {
            iframe.onload = () => {
                this.showProgress(50, '正在生成PDF...');
                
                setTimeout(() => {
                    iframe.contentWindow.print();
                    this.showProgress(100, '转换完成');
                    
                    setTimeout(() => {
                        this.hideProgress();
                        this.showDownloadSection('图片转PDF', `${this.files.length} 页`);
                        document.body.removeChild(tempContainer);
                        document.body.removeChild(iframe);
                        Toast.show('PDF生成成功，请在打印对话框中保存', 'success');
                        resolve();
                    }, 1000);
                }, 500);
            };
            
            iframe.srcdoc = tempContainer.innerHTML;
        });
    },
    
    async convertHtmlToPdf() {
        const url = this.elements.htmlUrlInput.value.trim();
        const htmlContent = this.elements.htmlContentInput.value.trim();
        
        if (!url && !htmlContent) {
            Toast.show('请输入网页URL或HTML内容', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(20, '正在处理HTML...');
        
        let content = htmlContent;
        
        if (url) {
            try {
                const response = await fetch(url);
                content = await response.text();
            } catch {
                Toast.show('无法获取网页内容', 'error');
                this.hideProgress();
                return;
            }
        }
        
        const includeBackground = this.elements.htmlIncludeBackground.checked;
        const usePrintMedia = this.elements.htmlPrintMedia.checked;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    @media print {
                        body { -webkit-print-color-adjust: ${includeBackground ? 'exact' : 'none'}; }
                    }
                    ${!usePrintMedia ? '@media screen { body { display: none; } }' : ''}
                </style>
            </head>
            <body>${content}</body>
            </html>
        `);
        printWindow.document.close();
        
        this.showProgress(60, '正在生成PDF...');
        
        return new Promise((resolve) => {
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    this.showProgress(100, '转换完成');
                    
                    setTimeout(() => {
                        this.hideProgress();
                        this.showDownloadSection('HTML转PDF', '1 页');
                        Toast.show('PDF生成成功，请在打印对话框中保存', 'success');
                        resolve();
                    }, 1000);
                }, 1000);
            };
        });
    },
    
    async mergePdfs() {
        if (this.files.length === 0) {
            Toast.show('请先添加PDF文件', 'error');
            this.hideProgress();
            return;
        }
        
        if (this.files.length === 1) {
            Toast.show('请添加多个PDF文件进行合并', 'error');
            this.hideProgress();
            return;
        }
        
        this.showProgress(30, '准备合并...');
        
        // 前端合并PDF需要PDF.js库，这里提供替代方案
        setTimeout(() => {
            this.hideProgress();
            Toast.show('PDF合并需要安装PDF.js库', 'info');
            this.showDownloadSection('合并PDF', `${this.files.length} 个文件`);
            
            // 创建一个简单的下载链接，提示用户使用其他工具
            this.elements.downloadBtn.onclick = () => {
                Toast.show('请使用专业PDF工具合并文件', 'info');
            };
        }, 500);
    },
    
    downloadPdf() {
        // 实际的下载逻辑已在转换过程中处理
        Toast.show('请在打印对话框中选择"保存为PDF"', 'info');
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
    PdfConverter.init();
    Shortcuts.init();
});