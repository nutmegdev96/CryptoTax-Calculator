// scripts/coingecko.js

class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cache = {
            prices: null,
            timestamp: null
        };
        this.updateInterval = 60000; // 60 seconds
        this.supportedCoins = ['bitcoin', 'ethereum', 'binancecoin', 'solana'];
        this.symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'SOL': 'solana'
        };
    }

    async fetchPrices() {
        try {
            const ids = this.supportedCoins.join(',');
            const response = await axios.get(
                `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            
            const prices = {};
            for (const [coin, data] of Object.entries(response.data)) {
                prices[coin] = {
                    usd: data.usd,
                    change24h: data.usd_24h_change || 0
                };
            }
            
            this.cache = {
                prices,
                timestamp: Date.now()
            };
            
            // Call updateUI if it exists (will be overridden by app.js)
            if (typeof this.updateUI === 'function') {
                this.updateUI(prices);
            }
            
            return prices;
        } catch (error) {
            console.error('CoinGecko API Error:', error);
            this.showError();
        }
    }

    showError() {
        const pricesList = document.getElementById('pricesList');
        if (pricesList) {
            pricesList.innerHTML = `
                <div class="price-item">
                    <span class="coin" style="color: #ff3b3b;">API Error</span>
                    <span class="price">Retrying...</span>
                </div>
            `;
        }
    }

    startPolling() {
        this.fetchPrices();
        setInterval(() => this.fetchPrices(), this.updateInterval);
    }

    getPrice(symbol) {
        const coinId = this.symbolMap[symbol];
        if (coinId && this.cache.prices && this.cache.prices[coinId]) {
            return this.cache.prices[coinId].usd;
        }
        return null;
    }
}

// Initialize global instance
const coingecko = new CoinGeckoAPI();
