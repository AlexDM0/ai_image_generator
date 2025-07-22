class DirectImageGenerator {
    constructor() {
        this.pricingCalculator = new PricingCalculator();
        this.initializeElements();
        this.attachEventListeners();
        this.loadHistory();
        this.initializePricing();
    }

    initializeElements() {
        this.form = document.getElementById('imageForm');
        this.promptInput = document.getElementById('prompt');
        this.systemPromptInput = document.getElementById('systemPrompt');
        this.modelSelect = document.getElementById('model');
        this.sizeSelect = document.getElementById('size');
        this.qualitySelect = document.getElementById('quality');
        this.charCount = document.getElementById('charCount');
        this.systemCharCount = document.getElementById('systemCharCount');
        this.generateBtn = document.getElementById('generateBtn');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.generatedImage = document.getElementById('generatedImage');
        this.filename = document.getElementById('filename');
        this.timestamp = document.getElementById('timestamp');
        this.usedPrompt = document.getElementById('usedPrompt');
        this.usedModel = document.getElementById('usedModel');
        this.usedSize = document.getElementById('usedSize');
        this.usedQuality = document.getElementById('usedQuality');
        this.errorMessage = document.getElementById('errorMessage');
        this.historyList = document.getElementById('historyList');
        this.saveSystemPromptBtn = document.getElementById('saveSystemPrompt');
        this.clearSystemPromptBtn = document.getElementById('clearSystemPrompt');
        
        // Pricing elements
        this.currentPrice = document.getElementById('currentPrice');
        this.costDisplay = document.getElementById('costDisplay');
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.promptInput.addEventListener('input', () => this.updateCharCount());
        this.systemPromptInput.addEventListener('input', () => this.updateSystemCharCount());
        this.promptInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.saveSystemPromptBtn.addEventListener('click', () => this.saveSystemPrompt());
        this.clearSystemPromptBtn.addEventListener('click', () => this.clearSystemPrompt());
        
        // Model change event listener - update dropdowns and pricing
        this.modelSelect.addEventListener('change', () => {
            this.updateDropdownsForModel();
            this.updateCurrentPrice();
        });
        
        // Pricing event listeners
        this.sizeSelect.addEventListener('change', () => this.updateCurrentPrice());
        this.qualitySelect.addEventListener('change', () => this.updateCurrentPrice());
        
        // Load saved system prompt on page load
        this.loadSystemPrompt();
    }

    handleKeyDown(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    updateCharCount() {
        const count = this.promptInput.value.length;
        this.charCount.textContent = count;
        
        if (count > 900) {
            this.charCount.style.color = '#dc3545';
        } else if (count > 800) {
            this.charCount.style.color = '#ffc107';
        } else {
            this.charCount.style.color = '#666';
        }
    }

    updateSystemCharCount() {
        const count = this.systemPromptInput.value.length;
        this.systemCharCount.textContent = count;
        
        if (count > 450) {
            this.systemCharCount.style.color = '#dc3545';
        } else if (count > 400) {
            this.systemCharCount.style.color = '#ffc107';
        } else {
            this.systemCharCount.style.color = '#666';
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const prompt = this.promptInput.value.trim();
        const systemPrompt = this.systemPromptInput.value.trim();
        const model = this.modelSelect.value;
        const size = this.sizeSelect.value;
        const quality = this.qualitySelect.value;
        
        if (!prompt) {
            this.showError('Please enter a prompt for image generation.');
            return;
        }

        this.showLoading();
        
        try {
            const requestData = {
                prompt,
                model,
                size,
                quality,
                systemPrompt: systemPrompt || undefined
            };
            
            console.log('Sending image generation request:', requestData);
            
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Image generation result:', result);
            
            this.showResult(result, { prompt, systemPrompt, model, size, quality });
            this.addToHistory(result, { prompt, systemPrompt, model, size, quality });
            
        } catch (error) {
            console.error('Image generation error:', error);
            this.showError(`Failed to generate image: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.result.classList.add('hidden');
        this.generateBtn.disabled = true;
        document.getElementById('generateText').textContent = 'Generating...';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.generateBtn.disabled = false;
        document.getElementById('generateText').textContent = 'Generate Image';
    }

    showResult(result, requestData) {
        this.generatedImage.src = result.localImageUrl;
        this.generatedImage.alt = `Generated image: ${requestData.prompt}`;
        this.filename.textContent = result.filename;
        this.timestamp.textContent = new Date().toLocaleString();
        this.usedPrompt.textContent = result.finalPrompt || requestData.prompt;
        this.usedModel.textContent = result.model || requestData.model;
        this.usedSize.textContent = result.size || requestData.size;
        this.usedQuality.textContent = result.quality || requestData.quality;
        
        this.result.classList.remove('hidden');
        
        // Scroll to result
        this.result.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.error.classList.remove('hidden');
    }

    hideError() {
        this.error.classList.add('hidden');
    }

    addToHistory(result, requestData) {
        const historyItem = {
            imageUrl: result.localImageUrl,
            filename: result.filename,
            prompt: requestData.prompt,
            systemPrompt: requestData.systemPrompt,
            model: result.model || requestData.model,
            size: result.size || requestData.size,
            quality: result.quality || requestData.quality,
            finalPrompt: result.finalPrompt,
            timestamp: new Date().toISOString()
        };
        
        // Get existing history
        let history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
        
        // Add new item to beginning
        history.unshift(historyItem);
        
        // Keep only last 20 items
        history = history.slice(0, 20);
        
        // Save to localStorage
        localStorage.setItem('imageHistory', JSON.stringify(history));
        
        // Update display
        this.loadHistory();
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem('imageHistory') || '[]');
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<p style="text-align: center; color: #666;">No images generated yet.</p>';
            return;
        }
        
        this.historyList.innerHTML = history.map(item => `
            <div class="history-item">
                <img src="${item.imageUrl}" alt="Generated image" onclick="openImageFullSize('${item.imageUrl}')">
                <div class="prompt" title="${item.finalPrompt || item.prompt}">${item.prompt}</div>
                <div class="history-meta">
                    <div class="model-size">${item.model || 'dall-e-2'} • ${item.size || '256x256'} • ${item.quality || 'auto'}</div>
                    <div class="date">${new Date(item.timestamp).toLocaleDateString()}</div>
                    ${item.systemPrompt ? `<div class="system-prompt" title="${item.systemPrompt}">📝 System prompt</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    clearHistory() {
        localStorage.removeItem('imageHistory');
        this.loadHistory();
    }

    saveSystemPrompt() {
        const systemPrompt = this.systemPromptInput.value.trim();
        if (systemPrompt) {
            localStorage.setItem('defaultSystemPrompt', systemPrompt);
            this.showTemporaryMessage('System prompt saved as default!', 'success');
        } else {
            this.showError('Please enter a system prompt to save.');
        }
    }

    clearSystemPrompt() {
        this.systemPromptInput.value = '';
        this.updateSystemCharCount();
        localStorage.removeItem('defaultSystemPrompt');
        this.showTemporaryMessage('System prompt cleared!', 'info');
    }

    loadSystemPrompt() {
        const savedPrompt = localStorage.getItem('defaultSystemPrompt');
        if (savedPrompt) {
            this.systemPromptInput.value = savedPrompt;
            this.updateSystemCharCount();
        }
    }

    showTemporaryMessage(message, type = 'info') {
        // Create temporary message element
        const messageEl = document.createElement('div');
        messageEl.className = `temp-message temp-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // Dynamic dropdown updating
    updateDropdownsForModel() {
        const selectedModel = this.modelSelect.value;
        
        // Get available options for the selected model
        const availableQualities = this.pricingCalculator.getAvailableQualities(selectedModel);
        const availableSizes = this.pricingCalculator.getAvailableSizes(selectedModel);
        
        // Update quality dropdown
        this.updateQualityDropdown(availableQualities, selectedModel);
        
        // Update size dropdown
        this.updateSizeDropdown(availableSizes, selectedModel);
    }
    
    updateQualityDropdown(availableQualities, model) {
        const currentValue = this.qualitySelect.value;
        
        // Clear existing options
        this.qualitySelect.innerHTML = '';
        
        // Define quality labels and descriptions
        const qualityLabels = {
            'standard': 'Standard',
            'hd': 'HD',
            'low': 'Low ',
            'medium': 'Medium',
            'high': 'High'
        };
        
        // Add available quality options
        let defaultSelected = false;
        availableQualities.forEach(quality => {
            const option = document.createElement('option');
            option.value = quality;
            option.textContent = qualityLabels[quality] || quality.charAt(0).toUpperCase() + quality.slice(1);
            
            // Select the option if it matches the current value, or select 'auto' as default
            if (quality === currentValue || (!defaultSelected && quality === 'auto')) {
                option.selected = true;
                defaultSelected = true;
            }
            
            this.qualitySelect.appendChild(option);
        });
        
        // If no 'auto' option and nothing was selected, select the first available
        if (!defaultSelected && availableQualities.length > 0) {
            this.qualitySelect.children[0].selected = true;
        }
    }
    
    updateSizeDropdown(availableSizes, model) {
        const currentValue = this.sizeSelect.value;
        
        // Clear existing options
        this.sizeSelect.innerHTML = '';
        
        // Define size labels
        const sizeLabels = {
            '256x256': 'Tiny Square (256×256)',
            '512x512': 'Small Square (512×512)',
            '1024x1024': 'Square (1024×1024)',
            '1024x1536': 'Portrait (1024×1536)',
            '1536x1024': 'Landscape (1536×1024)',
            '1024x1792': 'Portrait (1024×1792)',
            '1792x1024': 'Landscape (1792×1024)'
        };
        
        // Add available size options
        let defaultSelected = false;
        availableSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = sizeLabels[size] || size;
            
            // Select the option if it matches the current value, or select '1024x1024' as default
            if (size === currentValue || (!defaultSelected && size === '1024x1024')) {
                option.selected = true;
                defaultSelected = true;
            }
            
            this.sizeSelect.appendChild(option);
        });
        
        // If no '1024x1024' option and nothing was selected, select the first available
        if (!defaultSelected && availableSizes.length > 0) {
            this.sizeSelect.children[0].selected = true;
        }
    }

    // Pricing functionality
    initializePricing() {
        // Initialize dropdowns for the default model
        this.updateDropdownsForModel();
        this.updateCurrentPrice();
    }

    updateCurrentPrice() {
        const model = this.modelSelect.value;
        const size = this.sizeSelect.value;
        const quality = this.qualitySelect.value;
        
        const price = this.pricingCalculator.getDirectCost(model, quality, size);
        const formattedPrice = this.pricingCalculator.formatPrice(price);
        
        if (this.currentPrice) {
            this.currentPrice.textContent = formattedPrice;
        }
        if (this.costDisplay) {
            this.costDisplay.textContent = formattedPrice;
        }
    }


}

// Global functions
function openFullSize() {
    const img = document.getElementById('generatedImage');
    if (img.src) {
        window.open(img.src, '_blank');
    }
}

function openImageFullSize(imageUrl) {
    window.open(imageUrl, '_blank');
}

function downloadImage() {
    const img = document.getElementById('generatedImage');
    const filename = document.getElementById('filename').textContent;
    
    if (img.src) {
        const link = document.createElement('a');
        link.href = img.src;
        link.download = filename || 'generated-image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function generateAnother() {
    document.getElementById('result').classList.add('hidden');
    document.getElementById('prompt').focus();
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all image history?')) {
        window.directGenerator.clearHistory();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.directGenerator = new DirectImageGenerator();
    
    // Add clear history button to history section
    const historySection = document.querySelector('.history');
    if (historySection) {
        const clearBtn = document.createElement('button');
        clearBtn.textContent = '🗑️ Clear History';
        clearBtn.className = 'action-button secondary';
        clearBtn.style.marginBottom = '20px';
        clearBtn.onclick = clearHistory;
        historySection.insertBefore(clearBtn, historySection.querySelector('.history-list'));
    }
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape to close error modal
    if (e.key === 'Escape') {
        hideError();
    }
});
