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

document.addEventListener('DOMContentLoaded', () => {
    Navigation.init();
    PasswordGenerator.init();
    TodoList.init();
    Shortcuts.init();
});