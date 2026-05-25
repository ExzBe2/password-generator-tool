/**
 * 待办清单模块
 */
const TodoList = {
    data: [],
    filter: 'all',
    elements: {},
    
    init() {
        this.elements = {
            input: document.getElementById('todoInput'),
            addBtn: document.getElementById('addTodoBtn'),
            list: document.getElementById('todoList'),
            emptyState: document.getElementById('emptyState'),
            chartSection: document.getElementById('chartSection'),
            pieChart: document.getElementById('pieChart'),
            totalCount: document.getElementById('totalCount'),
            completedCount: document.getElementById('completedCount'),
            pendingCount: document.getElementById('pendingCount'),
            exportJson: document.getElementById('exportJson'),
            exportCsv: document.getElementById('exportCsv'),
            filters: document.querySelectorAll('.filter-btn')
        };
        
        this.loadFromStorage();
        this.bindEvents();
        this.render();
    },
    
    bindEvents() {
        this.elements.addBtn.addEventListener('click', () => this.addTodo());
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });
        
        this.elements.filters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filter = btn.dataset.filter;
                this.elements.filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.render();
            });
        });
        
        this.elements.exportJson.addEventListener('click', () => this.exportAs('json'));
        this.elements.exportCsv.addEventListener('click', () => this.exportAs('csv'));
    },
    
    loadFromStorage() {
        const stored = localStorage.getItem('efficiencyTools_todos');
        if (stored) {
            this.data = JSON.parse(stored);
        }
    },
    
    saveToStorage() {
        localStorage.setItem('efficiencyTools_todos', JSON.stringify(this.data));
    },
    
    addTodo() {
        const text = this.elements.input.value.trim();
        
        if (!text) {
            Toast.show('请输入任务内容', 'error');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toLocaleDateString('zh-CN')
        };
        
        this.data.unshift(todo);
        this.saveToStorage();
        this.elements.input.value = '';
        this.render();
        Toast.show('任务添加成功', 'success');
    },
    
    toggleTodo(id) {
        const todo = this.data.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    },
    
    deleteTodo(id, element) {
        element.classList.add('removing');
        
        setTimeout(() => {
            this.data = this.data.filter(t => t.id !== id);
            this.saveToStorage();
            this.render();
            Toast.show('任务已删除', 'info');
        }, 300);
    },
    
    getFilteredData() {
        switch (this.filter) {
            case 'active':
                return this.data.filter(t => !t.completed);
            case 'completed':
                return this.data.filter(t => t.completed);
            default:
                return this.data;
        }
    },
    
    updateStats() {
        const total = this.data.length;
        const completed = this.data.filter(t => t.completed).length;
        const pending = total - completed;
        
        ['totalCount', 'completedCount', 'pendingCount'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('updating');
                setTimeout(() => el.classList.remove('updating'), 400);
            }
        });
        
        this.elements.totalCount.textContent = total;
        this.elements.completedCount.textContent = completed;
        this.elements.pendingCount.textContent = pending;
        
        if (total > 0) {
            this.elements.chartSection.style.display = 'block';
            const angle = (completed / total) * 360;
            this.elements.pieChart.style.setProperty('--complete-angle', `${angle}deg`);
        } else {
            this.elements.chartSection.style.display = 'none';
        }
    },
    
    render() {
        const filtered = this.getFilteredData();
        
        if (this.data.length === 0) {
            this.elements.list.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
            this.elements.chartSection.style.display = 'none';
        } else {
            this.elements.list.style.display = 'block';
            this.elements.emptyState.style.display = 'none';
            
            this.elements.list.innerHTML = filtered.map(todo => `
                <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <input type="checkbox" class="todo-checkbox" 
                           ${todo.completed ? 'checked' : ''} 
                           onchange="TodoList.toggleTodo(${todo.id})">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <span class="todo-date">${todo.createdAt}</span>
                    <button class="todo-delete" onclick="TodoList.deleteTodo(${todo.id}, this.parentElement)">🗑️</button>
                </li>
            `).join('');
        }
        
        this.updateStats();
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    exportAs(format) {
        if (this.data.length === 0) {
            Toast.show('没有可导出的数据', 'error');
            return;
        }
        
        let content, filename, mimeType;
        
        if (format === 'json') {
            content = JSON.stringify(this.data, null, 2);
            filename = `待办清单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
            mimeType = 'application/json';
        } else {
            const headers = 'ID,任务内容,完成状态,创建日期';
            const rows = this.data.map(t => 
                `${t.id},"${t.text}",${t.completed ? '已完成' : '未完成'},${t.createdAt}`
            );
            content = [headers, ...rows].join('\n');
            filename = `待办清单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
            mimeType = 'text/csv;charset=utf-8';
        }
        
        const blob = new Blob(['\ufeff' + content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        Toast.show(`已导出为${format.toUpperCase()}文件`, 'success');
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
            
            if (e.ctrlKey && e.key === 'Enter') {
                const activePanel = document.querySelector('.tool-panel.active');
                if (activePanel && activePanel.id === 'todoPanel') {
                    e.preventDefault();
                    TodoList.addTodo();
                }
            }
        });
    }
};

/**
 * IP转换器模块
 */
const IPConverter = {
    elements: {},
    
    init() {
        this.elements = {
            ipInput: document.getElementById('ipInput'),
            subnetInput: document.getElementById('subnetInput'),
            convertBtn: document.getElementById('convertIpBtn'),
            ipBinary: document.getElementById('ipBinary'),
            ipHex: document.getElementById('ipHex'),
            ipDecimal: document.getElementById('ipDecimal'),
            ipOctal: document.getElementById('ipOctal'),
            subnetResults: document.getElementById('subnetResults'),
            networkAddr: document.getElementById('networkAddr'),
            broadcastAddr: document.getElementById('broadcastAddr'),
            ipRange: document.getElementById('ipRange'),
            cidrNotation: document.getElementById('cidrNotation'),
            subnetBits: document.getElementById('subnetBits'),
            hostCount: document.getElementById('hostCount')
        };
        
        this.bindEvents();
    },
    
    bindEvents() {
        this.elements.convertBtn.addEventListener('click', () => this.convert());
        this.elements.ipInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convert();
        });
        this.elements.subnetInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.convert();
        });
    },
    
    validateIP(ip) {
        const pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = ip.match(pattern);
        if (!match) return false;
        
        for (let i = 1; i <= 4; i++) {
            if (parseInt(match[i]) > 255) return false;
        }
        return true;
    },
    
    validateSubnet(subnet) {
        if (!subnet) return true;
        if (!this.validateIP(subnet)) return false;
        
        const octets = subnet.split('.').map(Number);
        const binary = octets.map(o => o.toString(2).padStart(8, '0')).join('');
        
        // 检查是否为有效的子网掩码 (连续的1后面跟连续的0)
        if (!/^1+0+$/.test(binary)) return false;
        return true;
    },
    
    ipToInt(ip) {
        const octets = ip.split('.').map(Number);
        return (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
    },
    
    intToIp(num) {
        return [
            (num >>> 24) & 255,
            (num >>> 16) & 255,
            (num >>> 8) & 255,
            num & 255
        ].join('.');
    },
    
    convert() {
        const ip = this.elements.ipInput.value.trim();
        const subnet = this.elements.subnetInput.value.trim();
        
        if (!ip) {
            Toast.show('请输入IP地址', 'error');
            return;
        }
        
        if (!this.validateIP(ip)) {
            Toast.show('IP地址格式不正确', 'error');
            return;
        }
        
        // 基础转换
        const octets = ip.split('.').map(Number);
        
        // 二进制
        const binary = octets.map(o => o.toString(2).padStart(8, '0')).join('.');
        this.elements.ipBinary.textContent = binary;
        
        // 十六进制
        const hex = octets.map(o => o.toString(16).toUpperCase().padStart(2, '0')).join(':');
        this.elements.ipHex.textContent = hex;
        
        // 十进制
        const decimal = this.ipToInt(ip);
        this.elements.ipDecimal.textContent = decimal.toString();
        
        // 八进制
        const octal = octets.map(o => parseInt(o).toString(8).padStart(3, '0')).join('.');
        this.elements.ipOctal.textContent = octal;
        
        // 子网计算
        if (subnet) {
            if (!this.validateSubnet(subnet)) {
                Toast.show('子网掩码格式不正确', 'error');
                this.elements.subnetResults.style.display = 'none';
            } else {
                this.calculateSubnet(ip, subnet);
            }
        } else {
            this.elements.subnetResults.style.display = 'none';
        }
        
        Toast.show('转换成功', 'success');
    },
    
    calculateSubnet(ip, subnet) {
        const ipInt = this.ipToInt(ip);
        const subnetInt = this.ipToInt(subnet);
        
        // 计算网络地址
        const networkInt = ipInt & subnetInt;
        const networkAddr = this.intToIp(networkInt);
        
        // 计算广播地址
        const wildcardInt = ~subnetInt >>> 0;
        const broadcastInt = networkInt | wildcardInt;
        const broadcastAddr = this.intToIp(broadcastInt);
        
        // 计算CIDR
        const subnetBinary = subnet.split('.').map(o => o.toString(2).padStart(8, '0')).join('');
        const cidrBits = subnetBinary.split('1').length - 1;
        
        // 计算可用主机数
        const hostBits = 32 - cidrBits;
        const hostCount = Math.pow(2, hostBits) - 2;
        
        // IP范围
        const firstIP = cidrBits === 32 ? networkAddr : this.intToIp(networkInt + 1);
        const lastIP = cidrBits === 32 ? broadcastAddr : this.intToIp(broadcastInt - 1);
        
        // 显示结果
        this.elements.subnetResults.style.display = 'block';
        this.elements.networkAddr.textContent = networkAddr;
        this.elements.broadcastAddr.textContent = broadcastAddr;
        this.elements.ipRange.textContent = `${firstIP} ~ ${lastIP}`;
        this.elements.cidrNotation.textContent = `${networkAddr}/${cidrBits}`;
        this.elements.subnetBits.textContent = cidrBits.toString();
        this.elements.hostCount.textContent = hostCount > 0 ? hostCount.toLocaleString() : '0';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    PasswordGenerator.init();
    TodoList.init();
    IPConverter.init();
    Shortcuts.init();
});