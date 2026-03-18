// scripts/taxEngine.js

class TaxEngine {
    constructor() {
        this.transactions = this.loadTransactions();
        this.country = 'IT';
        this.premiumActive = localStorage.getItem('cryptotax_premium') === 'true';
    }

    loadTransactions() {
        const saved = localStorage.getItem('cryptotax_transactions');
        return saved ? JSON.parse(saved) : [];
    }

    saveTransactions() {
        localStorage.setItem('cryptotax_transactions', JSON.stringify(this.transactions));
    }

    addTransaction(transaction) {
        transaction.id = crypto.randomUUID ? crypto.randomUUID() : 'tx_' + Date.now() + Math.random();
        transaction.date = transaction.date || new Date().toISOString().split('T')[0];
        this.transactions.push(transaction);
        this.saveTransactions();
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
    }

    calculateTax(gain, country) {
        const rules = {
            IT: (g) => g > 2000 ? (g - 2000) * 0.26 : 0,
            US: (g) => g * 0.15, // Simplified long-term
            DE: (g) => g * 0.45, // Max rate
            GB: (g) => g > 3000 ? (g - 3000) * 0.20 : 0,
            IN: (g) => g * 0.30
        };

        return rules[country] ? rules[country](gain) : 0;
    }

    getTaxNotes(country) {
        const notes = {
            IT: 'Italy: 26% on gains > €2,000. Crypto-to-crypto tax-free since 2023.',
            US: 'USA: Long-term capital gains (held >1 year): 0-20%. Short-term: ordinary income rates.',
            DE: 'Germany: Tax-free if held >1 year. Otherwise up to 45% income tax.',
            GB: 'UK: First £3,000 tax-free. Basic rate 20%, higher rate 40%, additional 45%.',
            IN: 'India: 30% flat tax on crypto gains + 1% TDS on transactions.'
        };
        return notes[country] || 'Select a jurisdiction to see tax rules.';
    }

    calculateTotalGain() {
        // Simplified calculation for demo
        return 4321.09;
    }
}

// Initialize global instance
const taxEngine = new TaxEngine();
