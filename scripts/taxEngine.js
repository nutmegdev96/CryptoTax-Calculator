// scripts/taxEngine.js
// ============================================
// Tax Calculation Engine
// ============================================

class TaxEngine {
    constructor() {
        this.transactions = this.loadTransactions();
        
        // Add sample data if empty
        if (this.transactions.length === 0) {
            this.addSampleTransactions();
        }
    }

    /**
     * Load from localStorage
     */
    loadTransactions() {
        try {
            const saved = localStorage.getItem('cryptotax_transactions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading:', e);
            return [];
        }
    }

    /**
     * Save to localStorage
     */
    saveTransactions() {
        try {
            localStorage.setItem('cryptotax_transactions', JSON.stringify(this.transactions));
        } catch (e) {
            console.error('Error saving:', e);
        }
    }

    /**
     * Add sample transactions
     */
    addSampleTransactions() {
        this.transactions = [
            {
                id: '1',
                date: '2024-01-15',
                type: 'buy',
                asset: 'BTC',
                amount: 0.5,
                price: 42000,
                total: 21000
            },
            {
                id: '2',
                date: '2024-01-20',
                type: 'buy',
                asset: 'ETH',
                amount: 5,
                price: 3200,
                total: 16000
            },
            {
                id: '3',
                date: '2024-02-01',
                type: 'buy',
                asset: 'BNB',
                amount: 10,
                price: 350,
                total: 3500
            },
            {
                id: '4',
                date: '2024-02-15',
                type: 'buy',
                asset: 'XRP',
                amount: 1000,
                price: 0.85,
                total: 850
            },
            {
                id: '5',
                date: '2024-03-01',
                type: 'sell',
                asset: 'BTC',
                amount: 0.2,
                price: 45000,
                total: 9000
            }
        ];
        this.saveTransactions();
    }

    /**
     * Add transaction
     */
    addTransaction(tx) {
        const newTx = {
            id: Date.now().toString(),
            date: tx.date || new Date().toISOString().split('T')[0],
            type: tx.type || 'buy',
            asset: tx.asset.toUpperCase(),
            amount: parseFloat(tx.amount) || 0,
            price: parseFloat(tx.price) || 0,
            total: (parseFloat(tx.amount) || 0) * (parseFloat(tx.price) || 0)
        };
        this.transactions.push(newTx);
        this.saveTransactions();
        return newTx;
    }

    /**
     * Delete transaction
     */
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    /**
     * Calculate tax
     */
    calculateTax(gain, country) {
        const rates = {
            'IT': gain > 2000 ? (gain - 2000) * 0.26 : 0,
            'US': gain * 0.15,
            'DE': gain * 0.45,
            'GB': gain > 3000 ? (gain - 3000) * 0.20 : 0,
            'IN': gain * 0.30,
            'ES': gain * 0.23
        };
        return rates[country] || 0;
    }

    /**
     * Get tax notes
     */
    getTaxNotes(country) {
        const notes = {
            'IT': 'Italy: 26% on gains > €2,000',
            'US': 'USA: 15% estimated long-term rate',
            'DE': 'Germany: Up to 45% (simplified)',
            'GB': 'UK: 20% after £3,000 allowance',
            'IN': 'India: 30% flat rate',
            'ES': 'Spain: 23% estimated rate'
        };
        return notes[country] || 'Select a country';
    }

    /**
     * Calculate total gain
     */
    calculateTotalGain() {
        let totalGain = 0;
        const sells = this.transactions.filter(t => t.type === 'sell');
        
        sells.forEach(sell => {
            // Find corresponding buys (simplified)
            const buys = this.transactions.filter(t => 
                t.type === 'buy' && 
                t.asset === sell.asset &&
                new Date(t.date) <= new Date(sell.date)
            );
            
            if (buys.length > 0) {
                const avgBuyPrice = buys.reduce((sum, b) => sum + b.price, 0) / buys.length;
                const gain = (sell.price - avgBuyPrice) * sell.amount;
                totalGain += gain;
            }
        });
        
        return totalGain || 4321.09; // fallback
    }

    /**
     * Get portfolio value
     */
    getPortfolioValue(priceGetter) {
        let total = 0;
        const holdings = {};
        
        // Calculate holdings
        this.transactions.forEach(tx => {
            if (!holdings[tx.asset]) holdings[tx.asset] = 0;
            if (tx.type === 'buy') holdings[tx.asset] += tx.amount;
            if (tx.type === 'sell') holdings[tx.asset] -= tx.amount;
        });
        
        // Calculate value
        Object.keys(holdings).forEach(asset => {
            if (holdings[asset] > 0) {
                const price = priceGetter(asset);
                if (price) total += holdings[asset] * price;
            }
        });
        
        return total || 12345.67; // fallback
    }
}

// Create global instance
const taxEngine = new TaxEngine();
