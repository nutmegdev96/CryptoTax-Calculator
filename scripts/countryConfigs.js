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
        currency: '
