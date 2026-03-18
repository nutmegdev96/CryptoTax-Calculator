// scripts/coingecko.js
// ============================================
// CoinGecko API Integration - FULL LIST
// ============================================

class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cache = {
            prices: null,
            top100: null,
            timestamp: null
        };
        this.updateInterval = 60000; // 60 seconds
        
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
                    prices[coin.symbol] = {  // Use symbol as key!
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
     * Search for coins
     */
    async searchCoins(query) {
        if (!query || query.length < 2) return [];
        
        try {
            const response = await axios.get(
                `${this.baseURL}/search?query=${query}`
            );
            
            return response.data.coins.slice(0, 10).map(coin => ({
                id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                thumb: coin.thumb
            }));
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    /**
     * Get price for a specific coin by symbol
     */
    async getPriceBySymbol(symbol) {
        symbol = symbol.toUpperCase();
        
        // Check cache first
        if (this.cache.prices && this.cache.prices[symbol]) {
            return this.cache.prices[symbol];
        }
        
        // If not in cache, fetch it
        try {
            const coinId = this.symbolMap[symbol];
            if (!coinId) return null;
            
            const response = await axios.get(
                `${this.baseURL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
            );
            
            const data = response.data[coinId];
            if (data) {
                return {
                    symbol: symbol,
                    usd: data.usd,
                    change24h: data.usd_24h_change || 0
                };
            }
        } catch (error) {
            console.error('Error fetching price:', error);
        }
        
        return null;
    }

    /**
     * Update the UI with price data
     */
    updateUI(prices) {
        const pricesList = document.getElementById('pricesList');
        if (!pricesList) return;

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
    }

    /**
     * Start polling
     */
    startPolling() {
        this.fetchPrices();
        setInterval(() => {
            this.fetchPrices();
        }, this.updateInterval);
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
