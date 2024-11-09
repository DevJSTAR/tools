class ToolsHub {
    constructor() {
        this.initializeTheme();
        this.setupEventListeners();
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
        const themeToggle = document.querySelector('.theme-toggle');
        themeToggle.addEventListener('click', () => this.toggleTheme());

        // Handle system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
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
        const icon = document.querySelector('.theme-toggle i');
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = notification.querySelector('i');
        const text = notification.querySelector('span');
        const progress = notification.querySelector('.notification-progress');

        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        icon.className = icons[type] || icons.info;

        // Set text
        text.textContent = message;

        // Show notification
        notification.classList.remove('hidden');

        // Reset and start progress animation
        progress.style.animation = 'none';
        progress.offsetHeight; // Trigger reflow
        progress.style.animation = 'progress 5s linear';

        // Hide after 5 seconds
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.toolsHub = new ToolsHub();
});