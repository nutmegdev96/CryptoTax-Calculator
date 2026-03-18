// scripts/taxEngine.js

class TaxEngine {
    constructor() {
        this.transactions = [];
        this.country = 'IT';
        this.premiumActive = false;
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
}
