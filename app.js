/**
 * Toast通知系统 - 统一的操作反馈提示
 */
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: '💡'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

/**
 * 密码生成器模块
 */
const PasswordGenerator = {
    charset: {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    },
    
    elements: {},
    
    init() {
        this.elements = {
            display: document.getElementById('passwordDisplay'),
            copyBtn: document.getElementById('copyBtn'),
            generateBtn: document.getElementById('generateBtn'),
            lengthSlider: document.getElementById('lengthSlider'),
            lengthValue: document.getElementById('lengthValue'),
            strengthBar: document.getElementById('strengthBar'),
            loading: document.getElementById('passwordLoading'),
            uppercase: document.getElementById('uppercase'),
            lowercase: document.getElementById('lowercase'),
            numbers: document.getElementById('numbers'),
            symbols: document.getElementById('symbols')
        };
        
        this.bindEvents();
        this.generate();
    },
    
    bindEvents() {
        this.elements.lengthSlider.addEventListener('input', () => {
            this.elements.lengthValue.textContent = this.elements.lengthSlider.value;
        });
        
        this.elements.generateBtn.addEventListener('click', () => this.generate());
        this.elements.copyBtn.addEventListener('click', () => this.copy());
        
        [this.elements.uppercase, this.elements.lowercase, 
         this.elements.numbers, this.elements.symbols].forEach(checkbox => {
            checkbox.addEventListener('change', () => this.generate());
        });
    },
    
    generate() {
        let validChars = '';
        
        if (this.elements.uppercase.checked) validChars += this.charset.uppercase;
        if (this.elements.lowercase.checked) validChars += this.charset.lowercase;
        if (this.elements.numbers.checked) validChars += this.charset.numbers;
        if (this.elements.symbols.checked) validChars += this.charset.symbols;
        
        if (validChars === '') {
            this.elements.display.textContent = '请至少选择一种字符类型';
            this.elements.strengthBar.className = 'strength-bar';
            return;
        }
        
        this.elements.loading.classList.add('active');
        this.elements.display.classList.add('changing');
        
        setTimeout(() => {
            let password = '';
            const length = parseInt(this.elements.lengthSlider.value);
            
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * validChars.length);
                password += validChars[randomIndex];
            }
            
            this.elements.display.textContent = password;
            this.updateStrength(password);
            
            this.elements.loading.classList.remove('active');
            this.elements.display.classList.remove('changing');
            this.elements.copyBtn.textContent = '📋 复制密码';
            this.elements.copyBtn.classList.remove('copied');
        }, 300);
    },
    
    updateStrength(password) {
        const length = password.length;
        let strength = 0;
        
        if (length >= 12) strength++;
        if (length >= 16) strength++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength++;
        
        const bar = this.elements.strengthBar;
        bar.className = 'strength-bar';
        
        if (strength <= 2) {
            bar.classList.add('weak');
        } else if (strength <= 3) {
            bar.classList.add('medium');
        } else {
            bar.classList.add('strong');
        }
    },
    
    async copy() {
        const password = this.elements.display.textContent;
        
        if (!password || password === '点击生成密码' || 
            password === '请至少选择一种字符类型') {
            Toast.show('没有可复制的密码', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(password);
            this.elements.copyBtn.textContent = '✅ 已复制';
            this.elements.copyBtn.classList.add('copied');
            Toast.show('密码已复制到剪贴板', 'success');
            
            setTimeout(() => {
                this.elements.copyBtn.textContent = '📋 复制密码';
                this.elements.copyBtn.classList.remove('copied');
            }, 2000);
        } catch (err) {
            Toast.show('复制失败，请手动复制', 'error');
        }
    }
};