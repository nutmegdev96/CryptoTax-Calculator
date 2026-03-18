// scripts/taxEngine.js
// ============================================
// Tax Calculation Engine
// ============================================

class TaxEngine {
    constructor() {
        this.transactions = this.loadTransactions();
        this.currentCountry = 'IT';
        
        // Add sample data if no transactions exist
        if (this.transactions.length === 0) {
            this.addSampleTransactions();
        }
    }

    /**
     * Load transactions from localStorage
     */
    loadTransactions() {
        try {
            const saved = localStorage.getItem('cryptotax_transactions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading transactions:', e);
            return [];
        }
    }

    /**
     * Save transactions to localStorage
     */
    saveTransactions() {
        try {
            localStorage.setItem('cryptotax_transactions', JSON.stringify(this.transactions));
        } catch (e) {
            console.error('Error saving transactions:', e);
        }
    }

    /**
     * Add sample transactions for demo
     */
    addSampleTransactions() {
        const sampleTxs = [
            {
                id: this.generateId(),
                date: '2024-01-15',
                type: 'buy',
                asset: 'BTC',
                amount: 0.5,
                price: 42000,
                fee: 10
            },
            {
                id: this.generateId(),
                date: '2024-01-20',
                type: 'buy',
                asset: 'ETH',
                amount: 5,
                price: 3200,
                fee: 8
            },
            {
                id: this.generateId(),
                date: '2024-02-01',
                type: 'buy',
                asset: 'BNB',
                amount: 10,
                price: 350,
                fee: 5
            },
            {
                id: this.generateId(),
                date: '2024-02-15',
                type: 'buy',
                asset: 'SOL',
                amount: 15,
                price: 95,
                fee: 3
            },
            {
                id: this.generateId(),
                date: '2024-03-01',
                type: 'sell',
                asset: 'BTC',
                amount: 0.2,
                price: 45000,
                fee: 5
            },
            {
                id: this.generateId(),
                date: '2024-03-10',
                type: 'sell',
                asset: 'ETH',
                amount: 2,
                price: 3350,
                fee: 4
            }
        ];
        
        this.transactions = sampleTxs;
        this.saveTransactions();
    }

    /**
     * Generate unique ID for transaction
     */
    generateId() {
        return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Add a new transaction
     */
    addTransaction(transaction) {
        const newTx = {
            id: this.generateId(),
            date: transaction.date || new Date().toISOString().split('T')[0],
            type: transaction.type || 'buy',
            asset: transaction.asset.toUpperCase(),
            amount: parseFloat(transaction.amount) || 0,
            price: parseFloat(transaction.price) || 0,
            fee: parseFloat(transaction.fee) || 0
        };
        
        this.transactions.push(newTx);
        this.saveTransactions();
        return newTx;
    }

    /**
     * Delete a transaction by ID
     */
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    /**
     * Calculate tax based on country rules
     */
    calculateTax(gain, country) {
        const rules = {
            IT: (g) => g > 2000 ? (g - 2000) * 0.26 : 0,
            US: (g) => g * 0.15, // Simplified long-term rate
            DE: (g) => g * 0.45, // Maximum rate
            GB: (g) => g > 3000 ? (g - 3000) * 0.20 : 0,
            IN: (g) => g * 0.30,
            ES: (g) => g * 0.23 // Simplified Spanish rate
        };

        const calculator = rules[country];
        return calculator ? calculator(gain) : 0;
    }

    /**
     * Get tax notes for a country
     */
    getTaxNotes(country) {
        const notes = {
            IT: 'Italy: 26% on gains > €2,000. Crypto-to-crypto tax-free.',
            US: 'USA: Long-term (held >1 year): 0-20%. Short-term: ordinary income.',
            DE: 'Germany: Tax-free if held >1 year. Otherwise up to 45%.',
            GB: 'UK: First £3,000 tax-free. Basic rate 20%, higher rate 40-45%.',
            IN: 'India: 30% flat tax on crypto gains + 1% TDS.',
            ES: 'Spain: Progressive from 19% to 28% on gains.'
        };
        
        return notes[country] || 'Select a jurisdiction to see tax rules.';
    }

    /**
     * Calculate total gain/loss from all transactions
     */
    calculateTotalGain() {
        let totalGain = 0;
        
        // Group by asset
        const assets = {};
        
        this.transactions.forEach(tx => {
            if (!assets[tx.asset]) {
                assets[tx.asset] = [];
            }
            assets[tx.asset].push(tx);
        });
        
        // Calculate gain for each asset using FIFO
        Object.keys(assets).forEach(asset => {
            const txs = assets[asset].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
            );
            
            const buys = [];
            txs.forEach(tx => {
                if (tx.type === 'buy') {
                    buys.push({
                        amount: tx.amount,
                        price: tx.price
                    });
                } else if (tx.type === 'sell') {
                    let remainingAmount = tx.amount;
                    let sellTotal = 0;
                    
                    while (remainingAmount > 0 && buys.length > 0) {
                        const buy = buys[0];
                        const usedAmount = Math.min(remainingAmount, buy.amount);
                        
                        const costBasis = usedAmount * buy.price;
                        const sellValue = usedAmount * tx.price;
                        const gain = sellValue - costBasis;
                        
                        sellTotal += gain;
                        
                        buy.amount -= usedAmount;
                        remainingAmount -= usedAmount;
                        
                        if (buy.amount <= 0) {
                            buys.shift();
                        }
                    }
                    
                    totalGain += sellTotal;
                }
            });
        });
        
        return totalGain;
    }

    /**
     * Get current holdings
     */
    getHoldings() {
        const holdings = {};
        
        this.transactions.forEach(tx => {
            if (!holdings[tx.asset]) {
                holdings[tx.asset] = 0;
            }
            
            if (tx.type === 'buy') {
                holdings[tx.asset] += tx.amount;
            } else if (tx.type === 'sell') {
                holdings[tx.asset] -= tx.amount;
            }
        });
        
        // Remove assets with zero holdings
        Object.keys(holdings).forEach(asset => {
            if (holdings[asset] <= 0) {
                delete holdings[asset];
            }
        });
        
        return holdings;
    }

    /**
     * Calculate portfolio value using current prices
     */
    calculatePortfolioValue(priceGetter) {
        const holdings = this.getHoldings();
        let totalValue = 0;
        
        Object.keys(holdings).forEach(asset => {
            const price = priceGetter(asset);
            if (price) {
                totalValue += holdings[asset] * price;
            }
        });
        
        return totalValue;
    }
}

// Create global instance
const taxEngine = new TaxEngine();
