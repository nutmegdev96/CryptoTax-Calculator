// scripts/coingecko.js
// ============================================
// CoinGecko API Integration
// ============================================

class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cache = {
            prices: null,
            timestamp: null
        };
        this.updateInterval = 60000; // 60 seconds
        
        // Supported coins with their IDs and symbols
        this.supportedCoins = [
            { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
            { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
            { id: 'binancecoin', symbol: 'BNB', name: 'Binance Coin' },
            { id: 'solana', symbol: 'SOL', name: 'Solana' }
        ];
        
        // Map for quick symbol to ID lookup
        this.symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'SOL': 'solana'
        };
    }

    /**
     * Fetch current prices from CoinGecko
     */
    async fetchPrices() {
        try {
            const ids = this.supportedCoins.map(c => c.id).join(',');
            const response = await axios.get(
                `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            
            // Format the response
            const prices = {};
            for (const coin of this.supportedCoins) {
                const data = response.data[coin.id];
                if (data) {
                    prices[coin.id] = {
                        symbol: coin.symbol,
                        name: coin.name,
                        usd: data.usd,
                        change24h: data.usd_24h_change || 0
                    };
                }
            }
            
            // Update cache
            this.cache = {
                prices,
                timestamp: Date.now()
            };

            // Trigger UI update
            this.updateUI(prices);
            
            return prices;
        } catch (error) {
            console.error('CoinGecko API Error:', error);
            this.showError();
            return null;
        }
    }

    /**
     * Update the UI with price data
     */
    updateUI(prices) {
        const pricesList = document.getElementById('pricesList');
        if (!pricesList) return;

        pricesList.innerHTML = '';

        for (const [coinId, data] of Object.entries(prices)) {
            const priceItem = document.createElement('div');
            priceItem.className = 'price-item';
            
            const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = data.change24h >= 0 ? '+' : '';
            
            priceItem.innerHTML = `
                <span class="coin">${data.symbol}</span>
                <span class="price">$${data.usd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}</span>
                <span class="change ${changeClass}">
                    ${changeSign}${data.change24h.toFixed(2)}%
                </span>
            `;
            
            pricesList.appendChild(priceItem);
        }

        // Update timestamp
        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            const timeStr = new Date().toLocaleTimeString();
            updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${timeStr}`;
        }
    }

    /**
     * Show error message in prices panel
     */
    showError() {
        const pricesList = document.getElementById('pricesList');
        if (pricesList) {
            pricesList.innerHTML = `
                <div class="price-item">
                    <span class="coin" style="color: #ff3b3b;">⚠️ API Error</span>
                    <span class="price">Retrying...</span>
                </div>
            `;
        }
    }

    /**
     * Start polling for price updates
     */
    startPolling() {
        // Initial fetch
        this.fetchPrices();
        
        // Set up interval
        setInterval(() => {
            this.fetchPrices();
        }, this.updateInterval);
    }

    /**
     * Get current price for a specific symbol
     */
    getPrice(symbol) {
        const coinId = this.symbolMap[symbol];
        if (coinId && this.cache.prices && this.cache.prices[coinId]) {
            return this.cache.prices[coinId].usd;
        }
        return null;
    }
}

// Create global instance
const coingecko = new CoinGeckoAPI();
