// Pricing utility for AI image generation
class PricingCalculator {
    constructor() {
        // Direct generation pricing (per image)
        this.directPricing = {
            'gpt-image-1': {
                'low': {
                    '1024x1024': 0.011,
                    '1024x1536': 0.016,
                    '1536x1024': 0.016
                },
                'medium': {
                    '1024x1024': 0.042,
                    '1024x1536': 0.063,
                    '1536x1024': 0.063
                },
                'high': {
                    '1024x1024': 0.167,
                    '1024x1536': 0.25,
                    '1536x1024': 0.25
                },
                'auto': {
                    '1024x1024': 0.167,
                    '1024x1536': 0.25,
                    '1536x1024': 0.25
                }
            },
            'dall-e-3': {
                'standard': {
                    '1024x1024': 0.04,
                    '1024x1792': 0.08,
                    '1792x1024': 0.08
                },
                'hd': {
                    '1024x1024': 0.08,
                    '1024x1792': 0.12,
                    '1792x1024': 0.12
                },
                'auto': {
                    '1024x1024': 0.08,
                    '1024x1792': 0.12,
                    '1792x1024': 0.12
                }
            },
            'dall-e-2': {
                'standard': {
                    '256x256': 0.016,
                    '512x512': 0.018,
                    '1024x1024': 0.02
                },
                'auto': {
                    '256x256': 0.016,
                    '512x512': 0.018,
                    '1024x1024': 0.02
                }
            }
        };

        // Chat generation token costs (GPT Image 1 only)
        this.chatTokens = {
            'low': {
                '1024x1024': 272,
                '1024x1536': 408,
                '1536x1024': 400
            },
            'medium': {
                '1024x1024': 1056,
                '1024x1536': 1584,
                '1536x1024': 1568
            },
            'high': {
                '1024x1024': 4160,
                '1024x1536': 6240,
                '1536x1024': 6208
            }
        };

        // Token pricing: $10 per 1,000,000 tokens
        this.tokenPrice = 10 / 1000000; // $0.00001 per token
    }

    // Calculate direct generation cost
    getDirectCost(model, quality, size) {
        try {
            const modelPricing = this.directPricing[model];
            if (!modelPricing) return null;

            const qualityPricing = modelPricing[quality];
            if (!qualityPricing) return null;

            return qualityPricing[size] || null;
        } catch (error) {
            console.error('Error calculating direct cost:', error);
            return null;
        }
    }

    // Calculate chat generation cost (token-based)
    getChatCost(quality, size) {
        try {
            const qualityTokens = this.chatTokens[quality];
            if (!qualityTokens) return null;

            const tokens = qualityTokens[size];
            if (!tokens) return null;

            return tokens * this.tokenPrice;
        } catch (error) {
            console.error('Error calculating chat cost:', error);
            return null;
        }
    }

    // Get token count for chat generation
    getChatTokens(quality, size) {
        try {
            const qualityTokens = this.chatTokens[quality];
            if (!qualityTokens) return null;

            return qualityTokens[size] || null;
        } catch (error) {
            console.error('Error getting chat tokens:', error);
            return null;
        }
    }

    // Format price for display
    formatPrice(price) {
        if (price === null || price === undefined) return 'N/A';
        
        if (price < 0.001) {
            return `$${(price * 1000).toFixed(3)}k`; // Show in thousandths
        } else if (price < 0.01) {
            return `$${price.toFixed(4)}`;
        } else {
            return `$${price.toFixed(3)}`;
        }
    }

    // Format token count for display
    formatTokens(tokens) {
        if (tokens === null || tokens === undefined) return 'N/A';
        
        if (tokens >= 1000) {
            return `${(tokens / 1000).toFixed(1)}k tokens`;
        } else {
            return `${tokens} tokens`;
        }
    }

    // Get all available sizes for a model
    getAvailableSizes(model, quality = null) {
        try {
            const modelPricing = this.directPricing[model];
            if (!modelPricing) return [];

            if (quality) {
                const qualityPricing = modelPricing[quality];
                return qualityPricing ? Object.keys(qualityPricing) : [];
            } else {
                // Return all sizes across all qualities
                const allSizes = new Set();
                Object.values(modelPricing).forEach(qualityPricing => {
                    Object.keys(qualityPricing).forEach(size => allSizes.add(size));
                });
                return Array.from(allSizes);
            }
        } catch (error) {
            console.error('Error getting available sizes:', error);
            return [];
        }
    }

    // Get all available qualities for a model
    getAvailableQualities(model) {
        try {
            const modelPricing = this.directPricing[model];
            return modelPricing ? Object.keys(modelPricing) : [];
        } catch (error) {
            console.error('Error getting available qualities:', error);
            return [];
        }
    }

    // Generate pricing table HTML for direct generation
    generateDirectPricingTable(model) {
        const modelPricing = this.directPricing[model];
        if (!modelPricing) return '<p>Pricing not available for this model.</p>';

        const qualities = Object.keys(modelPricing);
        const allSizes = this.getAvailableSizes(model);

        let html = `
            <div class="pricing-table">
                <h4>${model.toUpperCase()} Pricing</h4>
                <table class="price-table">
                    <thead>
                        <tr>
                            <th>Quality</th>
                            ${allSizes.map(size => `<th>${size}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        qualities.forEach(quality => {
            html += `<tr><td class="quality-cell">${quality.charAt(0).toUpperCase() + quality.slice(1)}</td>`;
            allSizes.forEach(size => {
                const price = this.getDirectCost(model, quality, size);
                html += `<td class="price-cell">${this.formatPrice(price)}</td>`;
            });
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    // Generate pricing table HTML for chat generation
    generateChatPricingTable() {
        const qualities = Object.keys(this.chatTokens);
        const sizes = Object.keys(this.chatTokens.low);

        let html = `
            <div class="pricing-table">
                <h4>GPT Image 1 Token Usage (Chat)</h4>
                <table class="price-table">
                    <thead>
                        <tr>
                            <th>Quality</th>
                            ${sizes.map(size => `<th>${size}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        qualities.forEach(quality => {
            html += `<tr><td class="quality-cell">${quality.charAt(0).toUpperCase() + quality.slice(1)}</td>`;
            sizes.forEach(size => {
                const tokens = this.getChatTokens(quality, size);
                const cost = this.getChatCost(quality, size);
                html += `<td class="price-cell">
                    ${this.formatTokens(tokens)}<br>
                    <small>(${this.formatPrice(cost)})</small>
                </td>`;
            });
            html += '</tr>';
        });

        html += `
                    </tbody>
                </table>
                <p class="pricing-note">
                    <small>Token pricing: $10 per 1,000,000 tokens. 
                    Note: This does not include input text tokens for prompts.</small>
                </p>
            </div>
        `;

        return html;
    }
}

// Export for use in other files
window.PricingCalculator = PricingCalculator;
