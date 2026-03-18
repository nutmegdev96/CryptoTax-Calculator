// scripts/coingecko.js

class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cache = { prices: null, timestamp: null };
        this.updateInterval = 60000; // 60 seconds
        this.supportedCoins = [
            { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
            { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
            { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
            { id: 'solana', symbol: 'SOL', name: 'Solana' }
        ];
        this.symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'binancecoin',
            'SOL': 'solana'
        };
    }

    async fetchPrices() {
        try {
            const ids = this.supportedCoins.map(c => c.id).join(',');
            const response = await axios.get(
                `${this.baseURL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
            );
            
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
            
            this.cache = { prices, timestamp: Date.now() };

            // Call updateUI if it exists
            if (typeof this.updateUI === 'function') {
                this.updateUI(prices);
            } else {
                this.defaultUpdateUI(prices);
            }
            return prices;
        } catch (error) {
            console.error('CoinGecko API Error:', error);
            this.showError();
        }
    }

    defaultUpdateUI(prices) {
        const pricesList = document.getElementById('pricesList');
        if (!pricesList) return;
        
        pricesList.innerHTML = '';
        
        for (const [coinId, data] of Object.entries(prices)) {
            const item = document.createElement('div');
            item.className = 'price-item';
            item.innerHTML = `
                <span class="coin">${data.symbol}</span>
                <span class="price">$${data.usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                    ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                </span>`;
            pricesList.appendChild(item);
        }

        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
        }
    }

    showError() {
        const pricesList = document.getElementById('pricesList');
        if (pricesList) {
            pricesList.innerHTML = `<div class="price-item"><span class="coin" style="color: #ff3b3b;">API Error</span><span class="price">Retrying...</span></div>`;
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
