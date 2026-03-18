// scripts/countryConfigs.js

const countryConfigs = {
    IT: {
        name: 'Italy',
        currency: 'EUR',
        flag: '🇮🇹',
        taxRules: {
            rate: 0.26, // 26%
            threshold: 2000, // Tax-free under €2000
            holdingPeriodBenefit: true, // Crypto-to-crypto tax-free after 2023
            method: 'LIFO', // Last In First Out
            color: '#00ffff',
            notes: 'Crypto-to-crypto tax-free since 2023. 26% on gains > €2,000.'
        }
    },
    US: {
        name: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        taxRules: {
            shortTermRates: [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37], // Income brackets
            longTermRates: [0, 0.15, 0.20], // 0%, 15%, 20% based on income
            holdingPeriod: 365, // Days for long-term
            method: 'FIFO', // First In First Out
            color: '#ff00ff',
            notes: 'Short-term (held <1 year): ordinary income rates. Long-term: 0-20%.'
        }
    },
    DE: {
        name: 'Germany',
        currency: 'EUR',
        flag: '🇩🇪',
        taxRules: {
            standardRate: 0.45, // 45% max
            taxFreeHolding: 365, // Days to be tax-free
            method: 'FIFO',
            color: '#ffff00',
            notes: 'Tax-free if held >1 year. Otherwise up to 45% income tax.'
        }
    },
    GB: {
        name: 'United Kingdom',
        currency: 'GBP',
        flag: '🇬🇧',
        taxRules: {
            taxFreeAllowance: 3000, // £3,000 tax-free
            rates: [0.20, 0.40, 0.45], // Basic, Higher, Additional
            method: 'Section104', // Pooling method
            color: '#00ff00',
            notes: 'First £3,000 tax-free. Same-day rule applies. Section 104 pool.'
        }
    },
    IN: {
        name: 'India',
        currency: 'INR',
        flag: '🇮🇳',
        taxRules: {
            rate: 0.30, // 30% flat
            tds: 0.01, // 1% TDS on transactions
            method: 'FIFO',
            color: '#ff0000',
            notes: '30% tax on crypto gains + 1% TDS on transactions.'
        }
    },
    ES: {
        name: 'Spain',
        currency: 'EUR',
        flag: '🇪🇸',
        taxRules: {
            rates: [0.19, 0.21, 0.23, 0.27, 0.28], // Progressive up to 28%
            method: 'FIFO',
            color: '#ff6600',
            notes: 'Progressive rates from 19% to 28% on gains.'
        }
    }
};

// Helper functions per paese
const taxHelpers = {
    calculateItaly: (gain, totalIncome = 0) => {
        if (gain <= 2000) return 0;
        return (gain - 2000) * 0.26;
    },
    
    calculateUSA: (gain, holdingDays, income = 50000) => {
        if (holdingDays < 365) {
            // Short-term: ordinary income rates (simplified)
            if (income + gain <= 11000) return gain * 0.10;
            if (income + gain <= 44725) return gain * 0.12;
            if (income + gain <= 95375) return gain * 0.22;
            return gain * 0.24; // Simplified
        } else {
            // Long-term
            if (income <= 44625) return gain * 0;
            if (income <= 492300) return gain * 0.15;
            return gain * 0.20;
        }
    },
    
    calculateGermany: (gain, holdingDays) => {
        if (holdingDays > 365) return 0;
        return gain * 0.45; // Max rate (simplified)
    },
    
    calculateUK: (gain) => {
        if (gain <= 3000) return 0;
        // Simplified: assume basic rate for first £37,700 above allowance
        const taxable = gain - 3000;
        if (taxable <= 37700) return taxable * 0.20;
        return (37700 * 0.20) + ((taxable - 37700) * 0.40);
    },
    
    calculateIndia: (gain) => {
        return gain * 0.30;
    },
    
    calculateSpain: (gain) => {
        if (gain <= 6000) return gain * 0.19;
        if (gain <= 50000) return gain * 0.21;
        if (gain <= 200000) return gain * 0.23;
        return gain * 0.27; // Simplified
    }
};
