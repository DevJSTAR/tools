class TextAnalysis {
    constructor() {
        this.initializeElements();
        this.initializeTheme();
        this.setupEventListeners();
        this.updateStats('');
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.fileInput = document.getElementById('fileInput');
        this.dropZone = document.getElementById('dropZone');
        this.copyBtn = document.getElementById('copyBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.findInput = document.getElementById('findInput');
        this.replaceInput = document.getElementById('replaceInput');
        this.replaceBtn = document.getElementById('replaceBtn');
        this.notification = document.getElementById('notification');
        this.themeToggle = document.querySelector('.theme-toggle');
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme) {
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
            this.updateThemeIcon(savedTheme === 'dark');
        } else if (prefersDark) {
            document.body.classList.add('dark-theme');
            this.updateThemeIcon(true);
        }
    }

    setupEventListeners() {
        // Text input
        this.textInput.addEventListener('input', () => this.updateStats(this.textInput.value));

        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', () => this.handleDragLeave());
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

        // Actions
        this.copyBtn.addEventListener('click', () => this.copyText());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.replaceBtn.addEventListener('click', () => this.replaceText());

        // Theme
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });

        // Notification close
        const closeBtn = this.notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hideNotification());

        // Pause notification progress on hover
        this.notification.addEventListener('mouseenter', () => this.pauseNotification());
        this.notification.addEventListener('mouseleave', () => this.resumeNotification());
    }

    updateStats(text) {
        const stats = {
            characters: text.length,
            words: text.trim() ? text.trim().split(/\s+/).length : 0,
            sentences: text.trim() ? text.split(/[.!?]+/).filter(Boolean).length : 0,
            paragraphs: text.trim() ? text.split(/\n\s*\n/).filter(Boolean).length : 0
        };

        Object.entries(stats).forEach(([key, value]) => {
            const card = document.querySelector(`[data-stat="${key}"] .stat-value`);
            if (card) {
                const currentValue = parseInt(card.textContent);
                this.animateValue(card, currentValue, value);
            }
        });
    }

    animateValue(element, start, end) {
        if (start === end) return;
        
        const duration = 200;
        const range = end - start;
        const minStep = 1;
        let startTime = null;

        const animation = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            
            const value = Math.floor(progress * range + start);
            element.textContent = value.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animation);
            } else {
                element.textContent = end.toLocaleString();
            }
        };

        requestAnimationFrame(animation);
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) this.readFile(file);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.dropZone.classList.add('drag-over');
    }

    handleDragLeave() {
        this.dropZone.classList.remove('drag-over');
    }

    handleDrop(event) {
        event.preventDefault();
        this.dropZone.classList.remove('drag-over');
        
        const file = event.dataTransfer.files[0];
        if (file) this.readFile(file);
    }

    readFile(file) {
        if (file.type !== 'text/plain') {
            this.showNotification('Please select a text file (.txt)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.textInput.value = e.target.result;
            this.updateStats(this.textInput.value);
            this.showNotification('File loaded successfully', 'success');
        };
        reader.onerror = () => {
            this.showNotification('Error reading file', 'error');
        };
        reader.readAsText(file);
    }

    async copyText() {
        try {
            await navigator.clipboard.writeText(this.textInput.value);
            this.showNotification('Text copied to clipboard', 'success');
        } catch (err) {
            this.showNotification('Failed to copy text', 'error');
        }
    }

    clearText() {
        this.textInput.value = '';
        this.updateStats('');
        this.showNotification('Text cleared', 'info');
    }

    replaceText() {
        const findText = this.findInput.value;
        const replaceText = this.replaceInput.value;

        if (!findText) {
            this.showNotification('Please enter text to find', 'error');
            return;
        }

        const text = this.textInput.value;
        const newText = text.replaceAll(findText, replaceText);
        
        if (text === newText) {
            this.showNotification('No matches found', 'info');
            return;
        }

        this.textInput.value = newText;
        this.updateStats(newText);
        this.showNotification('Text replaced successfully', 'success');
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        this.setTheme(isDark ? 'dark' : 'light');
    }

    setTheme(theme) {
        localStorage.setItem('theme', theme);
        this.updateThemeIcon(theme === 'dark');
    }

    updateThemeIcon(isDark) {
        const icon = this.themeToggle.querySelector('i');
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    }

    showNotification(message, type = 'info') {
        // Clear any existing timeout
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }

        const icon = this.notification.querySelector('i');
        const text = this.notification.querySelector('span');
        const progress = this.notification.querySelector('.notification-progress');

        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        icon.className = icons[type] || icons.info;

        // Set text and type
        text.textContent = message;
        this.notification.className = `notification ${type}`;

        // Reset and start progress animation
        progress.style.animation = 'none';
        progress.offsetHeight; // Trigger reflow
        progress.style.animation = 'progress 5s linear';

        // Show notification
        this.notification.classList.remove('hidden');

        // Set timeout to hide
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, 5000);
    }

    hideNotification() {
        this.notification.classList.add('hidden');
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
    }

    pauseNotification() {
        const progress = this.notification.querySelector('.notification-progress');
        const computedStyle = window.getComputedStyle(progress);
        const width = computedStyle.getPropertyValue('width');
        progress.style.animation = 'none';
        progress.style.width = width;
        
        if (this.notificationTimeout) {
            clearTimeout(this.notificationTimeout);
        }
    }

    resumeNotification() {
        const progress = this.notification.querySelector('.notification-progress');
        const computedStyle = window.getComputedStyle(progress);
        const width = computedStyle.getPropertyValue('width');
        const duration = (parseInt(width) / parseInt(computedStyle.getPropertyValue('width'))) * 5;
        
        progress.style.animation = `progress ${duration}s linear`;
        
        this.notificationTimeout = setTimeout(() => {
            this.hideNotification();
        }, duration * 1000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.textAnalysis = new TextAnalysis();
});