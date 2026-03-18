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
        this.pollingInterval = null;
        
        // Default top coins to show
        this.defaultCoins = [
            { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
            { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
            { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
            { id: 'ripple', symbol: 'XRP', name: 'XRP' },
            { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
            { id: 'solana', symbol: 'SOL', name: 'Solana' },
            { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
            { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
            { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
            { id: 'stellar', symbol: 'XLM', name: 'Stellar' }
        ];
        
        // Map for quick lookup
        this.symbolMap = {};
        this.defaultCoins.forEach(coin => {
            this.symbolMap[coin.symbol] = coin.id;
        });
    }

    /**
     * Fetch current prices for default coins
     */
    async fetchPrices() {
        try {
            const ids = this.defaultCoins.map(c => c.id).join(',');
            const response = await axios.get(
                `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            
            // Format the response with proper symbols
            const prices = {};
            for (const coin of this.defaultCoins) {
                const data = response.data[coin.id];
                if (data) {
                    prices[coin.symbol] = {
                        symbol: coin.symbol,
                        name: coin.name,
                        id: coin.id,
                        usd: data.usd,
                        change24h: data.usd_24h_change || 0
                    };
                }
            }
            
            this.cache = {
                prices,
                timestamp: Date.now()
            };

            // Update UI
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

        // Se non ci sono prezzi, mostra il messaggio di caricamento
        if (!prices || Object.keys(prices).length === 0) {
            pricesList.innerHTML = `
                <div class="price-item">
                    <span class="coin" style="color: #00f7ff;">Loading...</span>
                </div>
            `;
            return;
        }

        pricesList.innerHTML = '';

        // Sort by symbol
        const sortedSymbols = Object.keys(prices).sort();
        
        for (const symbol of sortedSymbols) {
            const data = prices[symbol];
            if (!data) continue;
            
            const priceItem = document.createElement('div');
            priceItem.className = 'price-item';
            
            const changeClass = data.change24h >= 0 ? 'positive' : 'negative';
            const changeSign = data.change24h >= 0 ? '+' : '';
            
            priceItem.innerHTML = `
                <span class="coin">${symbol}</span>
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
     * Show error message
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
        
        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.innerHTML = `<i class="fas fa-exclamation-triangle" style="color: #ff3b3b;"></i> Connection error`;
        }
    }

    /**
     * Start polling - CHIAMATA QUANDO LA DASHBOARD È VISIBILE
     */
    startPolling() {
        console.log('🚀 Starting CoinGecko polling...');
        
        // Fetch immediately
        this.fetchPrices();
        
        // Clear any existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Set up new interval
        this.pollingInterval = setInterval(() => {
            console.log('⏳ Fetching updated prices...');
            this.fetchPrices();
        }, this.updateInterval);
    }

    /**
     * Stop polling - OPZIONALE, per pulire quando serve
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('🛑 CoinGecko polling stopped');
        }
    }

    /**
     * Get current price for a symbol
     */
    getPrice(symbol) {
        symbol = symbol.toUpperCase();
        if (this.cache.prices && this.cache.prices[symbol]) {
            return this.cache.prices[symbol].usd;
        }
        return null;
    }
}

// Create global instance
const coingecko = new CoinGeckoAPI();

// Auto-start polling when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📊 Initializing CoinGecko...');
    // Breve ritardo per permettere alla pagina di caricarsi
    setTimeout(() => {
        coingecko.startPolling();
    }, 500);
});
