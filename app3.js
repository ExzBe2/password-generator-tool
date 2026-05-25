/**
 * 像素艺术生成器 - 科比像素画
 */
const PixelArtGenerator = {
    originalImage: null,
    pixelSize: 8,
    outputSize: 500,
    elements: {},
    
    // 科比配色方案
    kobeColors: [
        { r: 114, g: 47, b: 55 },   // 湖人紫色
        { r: 255, g: 215, b: 0 },   // 湖人金色
        { r: 255, g: 255, b: 255 }, // 白色
        { r: 0, g: 0, b: 0 },       // 黑色
        { r: 192, g: 192, b: 192 }, // 银色
        { r: 64, g: 64, b: 64 },    // 深灰色
        { r: 160, g: 82, b: 45 },   // 棕色（皮肤）
        { r: 255, g: 165, b: 0 },   // 橙色（皮肤高光）
    ],
    
    init() {
        this.elements = {
            uploadArea: document.getElementById('pixelUploadArea'),
            fileInput: document.getElementById('pixelFileInput'),
            originalImage: document.getElementById('originalImage'),
            pixelImage: document.getElementById('pixelImage'),
            pixelSizeSlider: document.getElementById('pixelSizeSlider'),
            pixelSizeValue: document.getElementById('pixelSizeValue'),
            outputSizeSlider: document.getElementById('outputSizeSlider'),
            outputSizeValue: document.getElementById('outputSizeValue'),
            convertBtn: document.getElementById('pixelConvertBtn'),
            progressContainer: document.getElementById('pixelProgressContainer'),
            progressFill: document.getElementById('pixelProgressFill'),
            progressText: document.getElementById('pixelProgressText'),
            downloadSection: document.getElementById('pixelDownloadSection'),
            downloadBtn: document.getElementById('pixelDownloadBtn')
        };
        
        this.bindEvents();
    },
    
    bindEvents() {
        // 上传图片
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });
        
        this.elements.fileInput.addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });
        
        // 拖拽上传
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });
        
        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });
        
        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            this.loadImage(e.dataTransfer.files[0]);
        });
        
        // 参数设置
        this.elements.pixelSizeSlider.addEventListener('input', (e) => {
            this.pixelSize = parseInt(e.target.value);
            this.elements.pixelSizeValue.textContent = this.pixelSize;
        });
        
        this.elements.outputSizeSlider.addEventListener('input', (e) => {
            this.outputSize = parseInt(e.target.value);
            this.elements.outputSizeValue.textContent = this.outputSize;
        });
        
        // 转换按钮
        this.elements.convertBtn.addEventListener('click', () => {
            this.generatePixelArt();
        });
        
        // 下载按钮
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadPixelArt();
        });
        
        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                const activePanel = document.querySelector('.tool-panel.active');
                if (activePanel && activePanel.id === 'pixelartPanel') {
                    e.preventDefault();
                    this.generatePixelArt();
                }
            }
        });
    },
    
    loadImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            Toast.show('请选择图片文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.elements.originalImage.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; object-fit: contain;">`;
                Toast.show('图片加载成功！', 'success');
                this.hideDownloadSection();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },
    
    async generatePixelArt() {
        if (!this.originalImage) {
            Toast.show('请先上传图片', 'error');
            return;
        }
        
        this.showProgress(0, '正在处理...');
        
        try {
            await this.simulateProgress(20, '分析图片...');
            
            // 创建画布
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算缩放比例
            const scale = Math.min(this.outputSize / this.originalImage.width, 
                                   this.outputSize / this.originalImage.height);
            
            const scaledWidth = Math.floor(this.originalImage.width * scale);
            const scaledHeight = Math.floor(this.originalImage.height * scale);
            
            // 先缩小图片来创建像素效果
            canvas.width = scaledWidth / this.pixelSize;
            canvas.height = scaledHeight / this.pixelSize;
            
            ctx.drawImage(this.originalImage, 0, 0, canvas.width, canvas.height);
            
            await this.simulateProgress(50, '应用科比配色...');
            
            // 获取像素数据并应用科比配色
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 找到最接近的科比颜色
                const closestColor = this.findClosestColor(r, g, b);
                
                data[i] = closestColor.r;
                data[i + 1] = closestColor.g;
                data[i + 2] = closestColor.b;
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            await this.simulateProgress(80, '生成像素画...');
            
            // 创建输出画布
            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            
            outputCanvas.width = this.outputSize;
            outputCanvas.height = this.outputSize;
            
            // 绘制像素化效果
            const pixelW = this.outputSize / canvas.width;
            const pixelH = this.outputSize / canvas.height;
            
            const outputImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const outputData = outputImageData.data;
            
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const i = (y * canvas.width + x) * 4;
                    const r = outputData[i];
                    const g = outputData[i + 1];
                    const b = outputData[i + 2];
                    
                    outputCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    outputCtx.fillRect(x * pixelW, y * pixelH, pixelW, pixelH);
                }
            }
            
            await this.simulateProgress(100, '完成！');
            
            // 显示结果
            const imgUrl = outputCanvas.toDataURL('image/png');
            this.elements.pixelImage.innerHTML = `<img src="${imgUrl}" style="max-width: 100%; max-height: 250px; object-fit: contain;">`;
            
            // 保存供下载
            this.outputCanvas = outputCanvas;
            
            this.hideProgress();
            this.showDownloadSection();
            Toast.show('科比像素画生成成功！', 'success');
            
        } catch (error) {
            console.error('生成失败:', error);
            Toast.show('生成失败: ' + error.message, 'error');
            this.hideProgress();
        }
    },
    
    findClosestColor(r, g, b) {
        let closestColor = this.kobeColors[0];
        let minDistance = Infinity;
        
        for (const color of this.kobeColors) {
            const distance = this.colorDistance(r, g, b, color.r, color.g, color.b);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        }
        
        return closestColor;
    },
    
    colorDistance(r1, g1, b1, r2, g2, b2) {
        const dr = r1 - r2;
        const dg = g1 - g2;
        const db = b1 - b2;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    },
    
    async simulateProgress(targetPercent, message) {
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
    
    downloadPixelArt() {
        if (!this.outputCanvas) {
            Toast.show('请先生成像素画', 'error');
            return;
        }
        
        const link = document.createElement('a');
        link.download = `kobe-pixel-art_${Date.now()}.png`;
        link.href = this.outputCanvas.toDataURL('image/png');
        link.click();
        
        Toast.show('像素画已下载！', 'success');
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
    
    showDownloadSection() {
        this.elements.downloadSection.style.display = 'block';
    },
    
    hideDownloadSection() {
        this.elements.downloadSection.style.display = 'none';
    }
};

/**
 * 更新导航控制以支持像素艺术面板
 */
document.addEventListener('DOMContentLoaded', () => {
    PixelArtGenerator.init();
    
    // 更新导航点击事件
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tool = tab.dataset.tool;
            
            if (tool === 'pixelart') {
                // 激活像素艺术面板
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.tool-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById('pixelartPanel').classList.add('active');
            }
        });
    });
});