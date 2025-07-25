class ChatInterface {
    constructor() {
        this.sessionId = null;
        this.isLoading = false;
        this.pricingCalculator = new PricingCalculator();
        this.initializeElements();
        this.attachEventListeners();
        this.createNewSession();
        this.initializePricing();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.chatForm = document.getElementById('chatForm');
        this.sendButton = document.getElementById('sendButton');
        this.loadingIndicator = document.getElementById('loading');
        this.sizeSelect = document.getElementById('sizeSelect');
        this.qualitySelect = document.getElementById('qualitySelect');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        
        // Cost display element
        this.priceAmount = document.getElementById('priceAmount');
    }

    attachEventListeners() {
        this.chatForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Pricing event listeners
        this.sizeSelect.addEventListener('change', () => this.updatePricing());
        this.qualitySelect.addEventListener('change', () => this.updatePricing());
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.handleSubmit(e);
        }
    }

    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    async createNewSession() {
        try {
            const response = await fetch('/api/chat/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to create session');
            }

            const session = await response.json();
            this.sessionId = session.id;
            console.log('New chat session created:', this.sessionId);
        } catch (error) {
            console.error('Error creating session:', error);
            this.showError('Failed to initialize chat session');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;

        await this.sendMessage(message);
    }

    async sendMessage(message) {
        if (!message.trim()) return;
        
        // Get current size and quality settings
        const size = this.sizeSelect.value;
        const quality = this.qualitySelect.value;
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Clear input and show loading
        this.messageInput.value = '';
        this.setLoading(true);

        try {
            const response = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    message: message,
                    size: size,
                    quality: quality
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Chat response received:', result);
            
            // Update session ID if it changed (new session created)
            if (result.session && result.session.id !== this.sessionId) {
                this.sessionId = result.session.id;
            }

            // Add assistant response to chat
            // Handle the response content properly
            console.log('Response structure:', {
                hasResponse: !!result.response,
                responseKeys: result.response ? Object.keys(result.response) : [],
                content: result.response?.content,
                contentType: typeof result.response?.content
            });
            
            const responseContent = result.response?.content || 'I processed your request.';
            
            // Ensure content is a string
            const displayContent = typeof responseContent === 'string' 
                ? responseContent 
                : JSON.stringify(responseContent);
                
            this.addMessage('assistant', displayContent, result.response);

        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('assistant', '❌ Sorry, I encountered an error processing your request. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(role, content, messageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Handle text content
        const textP = document.createElement('p');
        textP.textContent = content;
        contentDiv.appendChild(textP);

        // Handle image if present
        if (messageData && messageData.localImageUrl) {
            const imageDiv = document.createElement('div');
            imageDiv.className = 'message-image';
            
            const img = document.createElement('img');
            img.src = messageData.localImageUrl;
            img.alt = 'Generated image';
            img.loading = 'lazy';
            
            // Add click to view full size
            img.addEventListener('click', () => {
                window.open(messageData.localImageUrl, '_blank');
            });
            img.style.cursor = 'pointer';
            
            imageDiv.appendChild(img);
            
            // Add image info
            if (messageData.filename) {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'image-info';
                infoDiv.textContent = `📁 ${messageData.filename}`;
                imageDiv.appendChild(infoDiv);
            }
            
            contentDiv.appendChild(imageDiv);
        }

        messageDiv.appendChild(contentDiv);
        
        // Always append new messages to the end of the chat
        // The welcome message will naturally stay at the top
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        this.messageInput.disabled = loading;
        
        if (loading) {
            this.loadingIndicator.classList.remove('hidden');
        } else {
            this.loadingIndicator.classList.add('hidden');
        }
    }

    async clearChat() {
        if (this.isLoading) return;
        
        // Show confirmation dialog
        const confirmed = confirm('Are you sure you want to clear the chat history? This cannot be undone.');
        if (!confirmed) return;
        
        try {
            this.setLoading(true);
            
            // Clear the chat UI
            const welcomeMessage = this.chatMessages.querySelector('.welcome-message');
            this.chatMessages.innerHTML = '';
            if (welcomeMessage) {
                this.chatMessages.appendChild(welcomeMessage);
            }
            
            // Create a new session on the server
            await this.createNewSession();
            
            // Show success message
            this.showTemporaryMessage('Chat history cleared', 'success');
        } catch (error) {
            console.error('Error clearing chat:', error);
            this.showTemporaryMessage('Failed to clear chat. Please try again.', 'error');
        } finally {
            this.setLoading(false);
        }
    }

    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type}`;
        messageDiv.textContent = message;
        
        // Add to the top of the chat messages
        const firstChild = this.chatMessages.firstChild;
        if (firstChild) {
            this.chatMessages.insertBefore(messageDiv, firstChild);
        } else {
            this.chatMessages.appendChild(messageDiv);
        }
        
        // Remove after 3 seconds
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    showError(message) {
        this.addMessage('assistant', `❌ Error: ${message}`);
    }

    // Utility method to format timestamps
    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    // Pricing functionality
    initializePricing() {
        this.updatePricing();
    }

    updatePricing() {
        const size = this.sizeSelect.value;
        const quality = this.qualitySelect.value;
        
        // Update price display
        const cost = this.pricingCalculator.getChatCost(quality, size);
        
        if (cost !== null) {
            this.priceAmount.textContent = `$${cost.toFixed(3)}`;
        }
    }

    displayChatPricingTable() {
        if (this.chatPricingTable) {
            this.chatPricingTable.innerHTML = this.pricingCalculator.generateChatPricingTable();
        }
    }
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatInterface = new ChatInterface();
});

// Add some helpful keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to send message
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (window.chatInterface && !window.chatInterface.isLoading) {
            window.chatInterface.handleSubmit(e);
        }
    }
});
