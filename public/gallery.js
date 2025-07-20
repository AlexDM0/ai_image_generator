class GalleryManager {
    constructor() {
        this.images = [];
        this.filteredImages = [];
        this.currentView = 'grid'; // 'grid' or 'list'
        this.filters = {
            model: '',
            type: '',
            size: ''
        };
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadGallery();
    }

    initializeElements() {
        // Main elements
        this.galleryGrid = document.getElementById('galleryGrid');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorOverlay = document.getElementById('errorOverlay');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Controls
        this.reloadBtn = document.getElementById('reloadBtn');
        this.viewToggle = document.getElementById('viewToggle');
        this.modelFilter = document.getElementById('modelFilter');
        this.typeFilter = document.getElementById('typeFilter');
        this.sizeFilter = document.getElementById('sizeFilter');
        
        // Stats
        this.totalImages = document.getElementById('totalImages');
        this.totalSize = document.getElementById('totalSize');
        
        // Modal elements
        this.imageModal = document.getElementById('imageModal');
        this.modalBackdrop = document.getElementById('modalBackdrop');
        this.modalClose = document.getElementById('modalClose');
        this.modalImage = document.getElementById('modalImage');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalFilename = document.getElementById('modalFilename');
        this.modalModel = document.getElementById('modalModel');
        this.modalSize = document.getElementById('modalSize');
        this.modalQuality = document.getElementById('modalQuality');
        this.modalType = document.getElementById('modalType');
        this.modalFileSize = document.getElementById('modalFileSize');
        this.modalCreated = document.getElementById('modalCreated');
        this.modalPrompt = document.getElementById('modalPrompt');
        this.modalPromptRow = document.getElementById('modalPromptRow');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyUrlBtn = document.getElementById('copyUrlBtn');
        this.errorClose = document.getElementById('errorClose');
    }

    attachEventListeners() {
        // Control buttons
        this.reloadBtn.addEventListener('click', () => this.loadGallery());
        this.viewToggle.addEventListener('click', () => this.toggleView());
        
        // Filters
        this.modelFilter.addEventListener('change', () => this.applyFilters());
        this.typeFilter.addEventListener('change', () => this.applyFilters());
        this.sizeFilter.addEventListener('change', () => this.applyFilters());
        
        // Modal controls
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalBackdrop.addEventListener('click', () => this.closeModal());
        this.errorClose.addEventListener('click', () => this.hideError());
        this.downloadBtn.addEventListener('click', () => this.downloadCurrentImage());
        this.copyUrlBtn.addEventListener('click', () => this.copyCurrentImageUrl());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.hideError();
            }
        });
    }

    async loadGallery() {
        console.log('🔄 Loading gallery...');
        this.showLoading();
        
        try {
            const response = await fetch('/api/gallery/images');
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to load gallery');
            }
            
            console.log(`✅ Gallery loaded: ${data.images.length} images`);
            this.images = data.images;
            this.filteredImages = [...this.images];
            
            this.updateStats();
            this.updateFilters();
            this.renderGallery();
            
        } catch (error) {
            console.error('❌ Gallery loading error:', error);
            this.showError(`Failed to load gallery: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    updateStats() {
        this.totalImages.textContent = this.images.length;
        
        const totalBytes = this.images.reduce((sum, img) => sum + img.size, 0);
        this.totalSize.textContent = this.formatFileSize(totalBytes);
    }

    updateFilters() {
        // Update model filter
        const models = [...new Set(this.images.map(img => img.metadata.model).filter(Boolean))];
        this.updateSelectOptions(this.modelFilter, models);
        
        // Update size filter
        const sizes = [...new Set(this.images.map(img => img.metadata.size).filter(Boolean))];
        this.updateSelectOptions(this.sizeFilter, sizes);
    }

    updateSelectOptions(selectElement, options) {
        const currentValue = selectElement.value;
        
        // Clear existing options (except the first "All" option)
        while (selectElement.children.length > 1) {
            selectElement.removeChild(selectElement.lastChild);
        }
        
        // Add new options
        options.sort().forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
        
        // Restore previous selection if still valid
        if (options.includes(currentValue)) {
            selectElement.value = currentValue;
        }
    }

    applyFilters() {
        this.filters.model = this.modelFilter.value;
        this.filters.type = this.typeFilter.value;
        this.filters.size = this.sizeFilter.value;
        
        this.filteredImages = this.images.filter(image => {
            return (!this.filters.model || image.metadata.model === this.filters.model) &&
                   (!this.filters.type || image.metadata.type === this.filters.type) &&
                   (!this.filters.size || image.metadata.size === this.filters.size);
        });
        
        console.log(`🔍 Filtered: ${this.filteredImages.length}/${this.images.length} images`);
        this.renderGallery();
    }

    renderGallery() {
        if (this.filteredImages.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        const containerClass = this.currentView === 'grid' ? 'gallery-grid' : 'gallery-list';
        this.galleryGrid.className = containerClass;
        
        this.galleryGrid.innerHTML = this.filteredImages.map(image => 
            this.createImageCard(image)
        ).join('');
        
        // Attach click listeners to image cards
        this.galleryGrid.querySelectorAll('.gallery-item').forEach((card, index) => {
            card.addEventListener('click', () => this.openModal(this.filteredImages[index]));
        });
    }

    createImageCard(image) {
        const prompt = image.metadata.prompt || 'No prompt available';
        const model = image.metadata.model || 'Unknown';
        const size = image.metadata.size || 'Unknown';
        const createdDate = new Date(image.createdAt).toLocaleDateString();
        
        return `
            <div class="gallery-item" data-filename="${image.filename}">
                <img class="gallery-item-image" src="${image.url}" alt="${prompt}" loading="lazy">
                <div class="gallery-item-info">
                    <div class="gallery-item-title">${image.filename}</div>
                    <div class="gallery-item-meta">
                        <span class="gallery-item-model">${model}</span>
                        <span class="gallery-item-size">${size}</span>
                    </div>
                    <div class="gallery-item-prompt">${prompt}</div>
                    <div class="gallery-item-date">${createdDate}</div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        this.galleryGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🖼️</div>
                <h3>No Images Found</h3>
                <p>No images match your current filters, or no images have been generated yet.</p>
                <button class="btn btn-primary" onclick="window.location.href='direct.html'">
                    🎨 Generate Your First Image
                </button>
            </div>
        `;
    }

    toggleView() {
        this.currentView = this.currentView === 'grid' ? 'list' : 'grid';
        this.viewToggle.textContent = this.currentView === 'grid' ? '📋 List View' : '🔲 Grid View';
        this.renderGallery();
    }

    openModal(image) {
        console.log('🖼️ Opening modal for:', image.filename);
        
        this.currentModalImage = image;
        
        // Set modal content
        this.modalTitle.textContent = image.filename;
        this.modalImage.src = image.url;
        this.modalImage.alt = image.metadata.prompt || image.filename;
        
        // Set details
        this.modalFilename.textContent = image.filename;
        this.modalModel.textContent = image.metadata.model || 'Unknown';
        this.modalSize.textContent = image.metadata.size || 'Unknown';
        this.modalQuality.textContent = image.metadata.quality || 'Unknown';
        this.modalType.textContent = image.metadata.type || 'Unknown';
        this.modalFileSize.textContent = this.formatFileSize(image.size);
        this.modalCreated.textContent = new Date(image.createdAt).toLocaleString();
        
        // Handle prompt
        if (image.metadata.prompt) {
            this.modalPrompt.textContent = image.metadata.prompt;
            this.modalPromptRow.style.display = 'flex';
        } else {
            this.modalPromptRow.style.display = 'none';
        }
        
        // Show modal
        this.imageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.imageModal.classList.add('hidden');
        document.body.style.overflow = '';
        this.currentModalImage = null;
    }

    downloadCurrentImage() {
        if (!this.currentModalImage) return;
        
        const link = document.createElement('a');
        link.href = this.currentModalImage.url;
        link.download = this.currentModalImage.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('💾 Downloaded:', this.currentModalImage.filename);
    }

    async copyCurrentImageUrl() {
        if (!this.currentModalImage) return;
        
        const fullUrl = window.location.origin + this.currentModalImage.url;
        
        try {
            await navigator.clipboard.writeText(fullUrl);
            
            // Visual feedback
            const originalText = this.copyUrlBtn.textContent;
            this.copyUrlBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyUrlBtn.textContent = originalText;
            }, 2000);
            
            console.log('🔗 Copied URL:', fullUrl);
        } catch (error) {
            console.error('❌ Failed to copy URL:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = fullUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            this.copyUrlBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyUrlBtn.textContent = '🔗 Copy URL';
            }, 2000);
        }
    }

    showLoading() {
        this.loadingIndicator.classList.remove('hidden');
        this.galleryGrid.style.opacity = '0.5';
    }

    hideLoading() {
        this.loadingIndicator.classList.add('hidden');
        this.galleryGrid.style.opacity = '1';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorOverlay.classList.remove('hidden');
    }

    hideError() {
        this.errorOverlay.classList.add('hidden');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Gallery Manager');
    new GalleryManager();
});
