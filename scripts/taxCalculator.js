// scripts/taxCalculator.js

class TaxCalculator {
    constructor() {
        this.transactions = this.loadTransactions();
        this.country = 'IT'; // Default
        this.portfolio = {};
    }
    
    // Load transactions from localStorage
    loadTransactions() {
        const saved = localStorage.getItem('cryptoTax_transactions');
        return saved ? JSON.parse(saved) : [];
    }
    
    // Save transactions to localStorage
    saveTransactions() {
        localStorage.setItem('cryptoTax_transactions', JSON.stringify(this.transactions));
    }
    
    // Add a new transaction
    addTransaction(transaction) {
        transaction.id = crypto.randomUUID ? crypto.randomUUID() : 'tx_' + Date.now() + Math.random();
        transaction.date = transaction.date || new Date().toISOString().split('T')[0];
        this.transactions.push(transaction);
        this.saveTransactions();
        this.updatePortfolio();
    }
    
    // Delete a transaction
    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveTransactions();
        this.updatePortfolio();
    }
    
    // Update portfolio based on transactions
    updatePortfolio() {
        this.portfolio = {};
        this.transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.transactions.forEach(tx => {
            const asset = tx.asset;
            if (!this.portfolio[asset]) {
                this.portfolio[asset] = {
                    totalAmount: 0,
                    totalCost: 0,
                    lots: [] // For FIFO/LIFO tracking
                };
            }
            
            const amount = parseFloat(tx.amount) || 0;
            const price = parseFloat(tx.price) || 0;
            const total = amount * price;
            
            if (tx.type === 'buy') {
                // Add to portfolio
                this.portfolio[asset].totalAmount += amount;
                this.portfolio[asset].totalCost += total;
                this.portfolio[asset].lots.push({
                    date: tx.date,
                    amount: amount,
                    cost: total,
                    price: price
                });
            } else if (tx.type === 'sell') {
                // Remove from portfolio (FIFO)
                this.portfolio[asset].totalAmount -= amount;
                this.portfolio[asset].totalCost -= (amount * this.portfolio[asset].lots[0]?.price || 0);
                this.portfolio[asset].lots.shift(); // Remove oldest lot
            }
        });
    }
    
    // Calculate gain for a specific transaction
    calculateGain(transaction) {
        if (transaction.type !== 'sell') return 0;
        
        const asset = transaction.asset;
        const amount = parseFloat(transaction.amount);
        const sellPrice = parseFloat(transaction.price);
        const sellTotal = amount * sellPrice;
        
        // Find cost basis (FIFO)
        let costBasis = 0;
        let remainingAmount = amount;
        
        // Sort all buys before this sell
        const buys = this.transactions.filter(t => 
            t.asset === asset && 
            t.type === 'buy' && 
            new Date(t.date) <= new Date(transaction.date)
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (let buy of buys) {
            if (remainingAmount <= 0) break;
            
            const buyAmount = parseFloat(buy.amount);
            const buyPrice = parseFloat(buy.price);
            const usedAmount = Math.min(remainingAmount, buyAmount);
            
            costBasis += usedAmount * buyPrice;
            remainingAmount -= usedAmount;
        }
        
        return sellTotal - costBasis;
    }
    
    // Calculate total gains/losses
    calculateTotalGain() {
        let totalGain = 0;
        this.transactions.filter(t => t.type === 'sell').forEach(tx => {
            totalGain += this.calculateGain(tx);
        });
        return totalGain;
    }
    
    // Calculate tax for a specific country
    calculateTax(country = this.country) {
        const totalGain = this.calculateTotalGain();
        const config = countryConfigs[country];
        
        if (!config) return { tax: 0, details: 'Country not configured' };
        
        let tax = 0;
        let notes = config.taxRules.notes;
        
        switch(country) {
            case 'IT':
                tax = taxHelpers.calculateItaly(totalGain);
                break;
            case 'US':
                // Simplified: assume average holding days
                const avgHoldingDays = this.getAverageHoldingDays();
                tax = taxHelpers.calculateUSA(totalGain, avgHoldingDays);
                break;
            case 'DE':
                const holdingDays = this.getAverageHoldingDays();
                tax = taxHelpers.calculateGermany(totalGain, holdingDays);
                break;
            case 'GB':
                tax = taxHelpers.calculateUK(totalGain);
                break;
            case 'IN':
                tax = taxHelpers.calculateIndia(totalGain);
                break;
            case 'ES':
                tax = taxHelpers.calculateSpain(totalGain);
                break;
        }
        
        return {
            totalGain: totalGain,
            taxableAmount: totalGain > 0 ? totalGain : 0,
            tax: tax,
            effectiveRate: totalGain > 0 ? (tax / totalGain * 100).toFixed(2) : 0,
            notes: notes
        };
    }
    
    // Get average holding days for all assets
    getAverageHoldingDays() {
        let totalDays = 0;
        let count = 0;
        
        this.transactions.filter(t => t.type === 'sell').forEach(sell => {
            const asset = sell.asset;
            const buyDate = this.transactions.find(t => 
                t.asset === asset && 
                t.type === 'buy' && 
                new Date(t.date) <= new Date(sell.date)
            )?.date;
            
            if (buyDate) {
                const days = (new Date(sell.date) - new Date(buyDate)) / (1000 * 60 * 60 * 24);
                totalDays += days;
                count++;
            }
        });
        
        return count > 0 ? totalDays / count : 0;
    }
    
    // Get portfolio distribution
    getPortfolioDistribution() {
        const distribution = {};
        let total = 0;
        
        Object.keys(this.portfolio).forEach(asset => {
            const amount = this.portfolio[asset].totalAmount;
            const latestPrice = this.getLatestPrice(asset);
            const value = amount * latestPrice;
            distribution[asset] = value;
            total += value;
        });
        
        return { distribution, total };
    }
    
    // Get latest price for an asset (mock data)
    getLatestPrice(asset) {
        const prices = {
            'BTC': 45000,
            'ETH': 3200,
            'USDT': 1,
            'BNB': 350,
            'SOL': 120,
            'ADA': 0.45,
            'DOT': 7.5,
            'MATIC': 0.85
        };
        return prices[asset] || 1;
    }
    
    // Get holding periods
    getHoldingPeriods() {
        const periods = [];
        const now = new Date();
        
        Object.keys(this.portfolio).forEach(asset => {
            const lots = this.portfolio[asset].lots;
            lots.forEach(lot => {
                const buyDate = new Date(lot.date);
                const daysHeld = Math.floor((now - buyDate) / (1000 * 60 * 60 * 24));
                periods.push({
                    asset: asset,
                    amount: lot.amount,
                    daysHeld: daysHeld,
                    isLongTerm: daysHeld > 365
                });
            });
        });
        
        return periods;
    }
    
    // Scenario analysis
    analyzeScenario(asset, amount, sellPrice, country) {
        // Create a mock sell transaction
        const mockTx = {
            type: 'sell',
            asset: asset,
            amount: amount,
            price: sellPrice,
            date: new Date().toISOString().split('T')[0]
        };
        
        // Calculate gain for this specific sell
        const gain = this.calculateGain(mockTx);
        
        // Calculate tax based on country
        const oldCountry = this.country;
        this.country = country;
        const taxResult = this.calculateTax(country);
        this.country = oldCountry;
        
        return {
            asset: asset,
            amount: amount,
            sellPrice: sellPrice,
            totalValue: amount * sellPrice,
            gain: gain,
            tax: taxResult.tax * (gain / taxResult.totalGain) || 0,
            netAfterTax: (amount * sellPrice) - (taxResult.tax * (gain / taxResult.totalGain) || 0)
        };
    }
    
    // Export data
    exportToCSV() {
        const headers = ['Date', 'Type', 'Asset', 'Amount', 'Price', 'Fee', 'Notes'];
        const csvRows = [];
        
        csvRows.push(headers.join(','));
        
        this.transactions.forEach(tx => {
            const row = [
                tx.date,
                tx.type,
                tx.asset,
                tx.amount,
                tx.price,
                tx.fee || 0,
                `"${tx.notes || ''}"`
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    // Generate PDF summary (simplified)
    generatePDF() {
        // This would use jsPDF to create a real PDF
        // For now, return a summary object
        const taxResult = this.calculateTax();
        
        return {
            generated: new Date().toISOString(),
            transactions: this.transactions.length,
            totalGain: taxResult.totalGain,
            taxDue: taxResult.tax,
            portfolio: this.portfolio
        };
    }
}
