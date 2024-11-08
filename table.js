class CSVViewer {
    constructor() {
      this.initializeElements();
      this.setupEventListeners();
      this.setupTheme();
      this.currentPage = 1;
      this.rowsPerPage = 10;
      this.currentSort = { column: null, ascending: true };
      this.data = null;
      this.setupButtonStates();
    }
  
    initializeElements() {
      this.fileInput = document.getElementById('fileInput');
      this.importBtn = document.getElementById('importBtn');
      this.copyBtn = document.getElementById('copyBtn');
      this.exportBtn = document.getElementById('exportBtn');
      this.dropZone = document.getElementById('dropZone');
      this.dataTable = document.getElementById('dataTable');
      this.searchInput = document.getElementById('searchInput');
      this.themeToggle = document.querySelector('.theme-toggle');
      this.notification = document.getElementById('notification');
      this.prevPageBtn = document.getElementById('prevPage');
      this.nextPageBtn = document.getElementById('nextPage');
      this.pageInfo = document.getElementById('pageInfo');
      this.tableContainer = document.querySelector('.table-container');
    }
  
    setupButtonStates() {
      this.copyBtn.disabled = true;
      this.exportBtn.disabled = true;
      this.searchInput.disabled = true;
    }
  
    setupEventListeners() {
      this.importBtn.addEventListener('click', () => this.fileInput.click());
      this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
      this.copyBtn.addEventListener('click', () => this.copyTableData());
      this.exportBtn.addEventListener('click', () => this.exportTableData());
      this.searchInput.addEventListener('input', () => this.handleSearch());
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
      this.prevPageBtn.addEventListener('click', () => this.changePage(-1));
      this.nextPageBtn.addEventListener('click', () => this.changePage(1));
  
      // Drag and drop handlers
      this.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.dropZone.classList.add('drag-over');
      });
  
      this.dropZone.addEventListener('dragleave', () => {
        this.dropZone.classList.remove('drag-over');
      });
  
      this.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        this.dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) this.processFile(file);
      });
  
      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'c' && !this.copyBtn.disabled) {
            e.preventDefault();
            this.copyTableData();
          } else if (e.key === 's' && !this.exportBtn.disabled) {
            e.preventDefault();
            this.exportTableData();
          }
        }
      });
    }
  
    setupTheme() {
      const theme = localStorage.getItem('theme') || 'light';
      document.body.classList.toggle('dark-theme', theme === 'dark');
      this.updateThemeIcon();
    }
  
    toggleTheme() {
      const isDark = document.body.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      this.updateThemeIcon();
    }
  
    updateThemeIcon() {
      const isDark = document.body.classList.contains('dark-theme');
      this.themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'moon' : 'sun'}"></i>`;
    }
  
    handleFileSelect(event) {
      const file = event.target.files[0];
      if (file) this.processFile(file);
    }
  
    processFile(file) {
      if (file.type !== 'text/csv') {
        this.showNotification('Please select a CSV file', 'error');
        return;
      }
  
      Papa.parse(file, {
        complete: (results) => {
          if (results.data.length < 2 || results.data[0].length === 0 || 
              results.data.every(row => row.length === 1 && row[0] === '')) {
            this.showNotification('The CSV file is empty or invalid', 'error');
            return;
          }
  
          this.data = results.data;
          this.filteredData = [...this.data];
          this.renderTable();
          this.showNotification('CSV file loaded successfully', 'success');
          this.tableContainer.style.display = 'block';
          setTimeout(() => this.tableContainer.classList.add('visible'), 50);
          this.dropZone.style.display = 'none';
          
          // Enable buttons after successful load
          this.copyBtn.disabled = false;
          this.exportBtn.disabled = false;
          this.searchInput.disabled = false;
        },
        error: (error) => {
          this.showNotification('Error parsing CSV file: ' + error.message, 'error');
        }
      });
    }
  
    renderTable() {
      const thead = this.dataTable.querySelector('thead');
      const tbody = this.dataTable.querySelector('tbody');
      thead.innerHTML = '';
      tbody.innerHTML = '';
  
      if (!this.data || this.data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="100%" class="empty-state">
              <i class="fas fa-table fa-2x mb-2"></i>
              <p>No data to display</p>
            </td>
          </tr>
        `;
        return;
      }
  
      // Render headers
      const headerRow = document.createElement('tr');
      this.data[0].forEach((header, index) => {
        const th = document.createElement('th');
        th.textContent = header;
        th.addEventListener('click', () => this.sortTable(index));
        if (this.currentSort.column === index) {
          th.classList.add('active');
          th.appendChild(document.createElement('i')).className = 
            `fas fa-sort-${this.currentSort.ascending ? 'up' : 'down'}`;
        }
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
  
      // Calculate pagination
      const startIndex = (this.currentPage - 1) * this.rowsPerPage + 1;
      const endIndex = Math.min(startIndex + this.rowsPerPage - 1, this.filteredData.length - 1);
      const totalPages = Math.ceil((this.filteredData.length - 1) / this.rowsPerPage);
  
      // Update pagination controls
      this.prevPageBtn.disabled = this.currentPage === 1;
      this.nextPageBtn.disabled = this.currentPage === totalPages;
      this.pageInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
  
      // Render rows for current page
      for (let i = startIndex; i <= endIndex; i++) {
        const row = document.createElement('tr');
        this.filteredData[i].forEach(cell => {
          const td = document.createElement('td');
          td.textContent = cell;
          row.appendChild(td);
        });
        tbody.appendChild(row);
      }
    }
  
    sortTable(columnIndex) {
      if (this.currentSort.column === columnIndex) {
        this.currentSort.ascending = !this.currentSort.ascending;
      } else {
        this.currentSort = { column: columnIndex, ascending: true };
      }
  
      const headers = [...this.filteredData[0]];
      const dataToSort = this.filteredData.slice(1);
  
      dataToSort.sort((a, b) => {
        const valueA = a[columnIndex];
        const valueB = b[columnIndex];
        
        // Check if values are numbers
        const numA = parseFloat(valueA);
        const numB = parseFloat(valueB);
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return this.currentSort.ascending ? numA - numB : numB - numA;
        }
        
        // Handle string comparison
        return this.currentSort.ascending ? 
          String(valueA).localeCompare(String(valueB)) : 
          String(valueB).localeCompare(String(valueA));
      });
  
      this.filteredData = [headers, ...dataToSort];
      this.currentPage = 1;
      this.renderTable();
      this.showNotification('Table sorted successfully', 'info');
    }
  
    handleSearch() {
      const searchTerm = this.searchInput.value.toLowerCase();
      this.filteredData = searchTerm ? 
        [this.data[0], ...this.data.slice(1).filter(row => 
          row.some(cell => cell.toString().toLowerCase().includes(searchTerm))
        )] : 
        [...this.data];
      
      this.currentPage = 1;
      this.renderTable();
    }
  
    async copyTableData() {
      if (!this.data) {
        this.showNotification('No data available to copy', 'error');
        return;
      }
  
      try {
        const csvContent = this.filteredData
          .map(row => row.join(','))
          .join('\n');
        await navigator.clipboard.writeText(csvContent);
        this.showNotification('Table data copied to clipboard', 'success');
      } catch (error) {
        this.showNotification('Failed to copy table data', 'error');
      }
    }
  
    exportTableData() {
      if (!this.data) {
        this.showNotification('No data available to export', 'error');
        return;
      }
  
      const csvContent = this.filteredData
        .map(row => row.join(','))
        .join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported_data.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      this.showNotification('Table data exported successfully', 'success');
    }
  
    changePage(delta) {
      this.currentPage += delta;
      this.renderTable();
    }
  
    showNotification(message, type) {
      const icon = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle'
      }[type];
  
      this.notification.querySelector('i').className = `fas fa-${icon}`;
      this.notification.querySelector('span').textContent = message;
      this.notification.className = `notification ${type}`;
      
      // Reset animation
      const progress = this.notification.querySelector('.notification-progress');
      progress.style.animation = 'none';
      progress.offsetHeight; // Trigger reflow
      progress.style.animation = null;
      
      setTimeout(() => {
        this.notification.classList.add('hidden');
      }, 5000);
    }
  }
  
  // Initialize the application
  document.addEventListener('DOMContentLoaded', () => {
    new CSVViewer();
  });