// scripts/coingecko.js

class CoinGeckoAPI {
    constructor() {
        this.baseURL = 'https://api.coingecko.com/api/v3';
        this.cache = { prices: null, timestamp: null };
        this.updateInterval = 60000; // 60 secondi
        this.supportedCoins = ['bitcoin', 'ethereum', 'binancecoin', 'solana'];
        this.symbolMap = { 'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana' };
    }

    async fetchPrices() {
        try {
            const ids = this.supportedCoins.join(',');
            const response = await axios.get(`${this.baseURL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
            const prices = {};
            for (const [coin, data] of Object.entries(response.data)) {
                prices[coin] = { usd: data.usd, change24h: data.usd_24h_change || 0 };
            }
            this.cache = { prices, timestamp: Date.now() };

            // Chiama updateUI SOLO se è stata definita (es. da app.js)
            if (typeof this.updateUI === 'function') {
                this.updateUI(prices);
            } else {
                // Altrimenti, usa un update di default per non lasciare tutto vuoto
                this.defaultUpdateUI(prices);
            }
            return prices;
        } catch (error) {
            console.error('CoinGecko API Error:', error);
            this.showError();
        }
    }

    // Funzione di default per mostrare i prezzi se app.js non l'ha sovrascritta
    defaultUpdateUI(prices) {
        const pricesList = document.getElementById('pricesList');
        if (!pricesList) return;
        const coinMap = { 'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB', 'solana': 'SOL' };
        pricesList.innerHTML = '';
        for (const [coin, data] of Object.entries(prices)) {
            const symbol = coinMap[coin];
            if (!symbol) continue;
            const item = document.createElement('div');
            item.className = 'price-item';
            item.innerHTML = `
                <span class="coin">${symbol}</span>
                <span class="price">$${data.usd.toLocaleString()}</span>
                <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                    ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                </span>`;
            pricesList.appendChild(item);
        }
        const updateTime = document.getElementById('updateTime');
        if (updateTime) updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
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

// Crea e rendi disponibile globalmente l'istanza
const coingecko = new CoinGeckoAPI();
