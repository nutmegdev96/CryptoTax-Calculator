// scripts/app.js

// Initialize the calculator
const calculator = new TaxCalculator();

// DOM Elements
let currentCountry = 'IT';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax Calculator initialized');
    
    // Load initial data
    loadTransactions();
    updateStats();
    updateTaxSummary();
    updatePortfolioChart();
    updateHoldingPeriods();
    
    // Setup event listeners
    setupEventListeners();
});

// Setup all event listeners
function setupEventListeners() {
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCountry = btn.dataset.country;
            updateTaxSummary();
        });
    });
    
    // Add transaction button
    document.getElementById('addTransactionBtn').addEventListener('click', () => {
        openModal();
    });
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('cancelModal').addEventListener('click', closeModal);
    
    // Transaction form submit
    document.getElementById('transactionForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addNewTransaction();
    });
    
    // Import CSV
    document.getElementById('importCsvBtn').addEventListener('click', () => {
        importCSV();
    });
    
    // Generate PDF
    document.getElementById('generatePdfBtn').addEventListener('click', () => {
        generatePDF();
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTransactions(e.target.value);
    });
    
    // Scenario calculator
    document.getElementById('calculateScenarioBtn').addEventListener('click', () => {
        calculateScenario();
    });
}

// Load transactions into table
function loadTransactions() {
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = '';
    
    calculator.transactions.forEach(tx => {
        const row = document.createElement('tr');
        
        // Format date
        const date = new Date(tx.date).toLocaleDateString();
        
        // Create type badge
        const typeBadge = `<span class="type-badge type-${tx.type}">${tx.type.toUpperCase()}</span>`;
        
        // Calculate total
        const total = (parseFloat(tx.amount) * parseFloat(tx.price)).toFixed(2);
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${typeBadge}</td>
            <td>${tx.asset}</td>
            <td>${tx.amount}</td>
            <td>€${parseFloat(tx.price).toFixed(2)}</td>
            <td>€${total}</td>
            <td>
                <button class="delete-btn" data-id="${tx.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Add delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            calculator.deleteTransaction(id);
            loadTransactions();
            updateStats();
            updateTaxSummary();
            updatePortfolioChart();
            updateHoldingPeriods();
        });
    });
}

// Update statistics cards
function updateStats() {
    const totalPortfolio = Object.values(calculator.portfolio).reduce((sum, asset) => {
        return sum + (asset.totalAmount * calculator.getLatestPrice(Object.keys(calculator.portfolio).find(k => calculator.portfolio[k] === asset) || 'BTC'));
    }, 0);
    
    const unrealizedGain = calculator.calculateTotalGain();
    const taxResult = calculator.calculateTax(currentCountry);
    
    document.getElementById('totalPortfolio').textContent = `€${totalPortfolio.toFixed(2)}`;
    document.getElementById('unrealizedGain').textContent = `€${unrealizedGain.toFixed(2)}`;
    document.getElementById('totalTax').textContent = `€${taxResult.tax.toFixed(2)}`;
    document.getElementById('totalTransactions').textContent = calculator.transactions.length;
}

// Update tax summary
function updateTaxSummary() {
    const taxResult = calculator.calculateTax(currentCountry);
    const config = countryConfigs[currentCountry];
    
    document.getElementById('totalGain').textContent = `€${taxResult.totalGain.toFixed(2)}`;
    document.getElementById('totalGain').className = taxResult.totalGain >= 0 ? 'gain' : 'loss';
    
    document.getElementById('taxableAmount').textContent = `€${taxResult.taxableAmount.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `€${taxResult.tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${taxResult.effectiveRate}%`;
    
    document.getElementById('taxNotes').innerHTML = `
        <i class="fas fa-info-circle"></i> ${taxResult.notes}
    `;
    
    // Update tax chart
    updateTaxChart(taxResult);
}

// Update tax chart
function updateTaxChart(taxResult) {
    const ctx = document.getElementById('taxChart').getContext('2d');
    
    // Destroy existing chart if any
    if (window.taxChart) {
        window.taxChart.destroy();
    }
    
    window.taxChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tax Due', 'Net Gain'],
            datasets: [{
                data: [taxResult.tax, taxResult.totalGain - taxResult.tax],
                backgroundColor: ['#ff00ff', '#00ffff'],
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}

// Update portfolio chart
function updatePortfolioChart() {
    const { distribution, total } = calculator.getPortfolioDistribution();
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    
    // Destroy existing chart if any
    if (window.portfolioChart) {
        window.portfolioChart.destroy();
    }
    
    const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff0000', '#ff6600'];
    
    window.portfolioChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(distribution),
            datasets: [{
                data: Object.values(distribution),
                backgroundColor: colors.slice(0, Object.keys(distribution).length),
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#fff' }
                }
            }
        }
    });
}

// Update holding periods
function updateHoldingPeriods() {
    const periods = calculator.getHoldingPeriods();
    const container = document.getElementById('holdingList');
    
    container.innerHTML = '';
    
    periods.forEach(p => {
        const item = document.createElement('div');
        item.className = 'holding-item';
        
        const daysClass = p.isLongTerm ? 'holding-days long-term' : 'holding-days';
        const daysText = p.isLongTerm ? '✓ Long-term' : `${p.daysHeld} days`;
        
        item.innerHTML = `
            <div class="holding-asset">
                <i class="fas fa-coins" style="color: ${p.isLongTerm ? '#00ff00' : '#ffff00'}"></i>
                <span>${p.asset}</span>
                <span style="color: rgba(255,255,255,0.6)">(${p.amount})</span>
            </div>
            <span class="${daysClass}">${daysText}</span>
        `;
        
        container.appendChild(item);
    });
}

// Open modal
function openModal() {
    document.getElementById('transactionModal').style.display = 'block';
    document.getElementById('txDate').valueAsDate = new Date();
}

// Close modal
function closeModal() {
    document.getElementById('transactionModal').style.display = 'none';
    document.getElementById('transactionForm').reset();
}

// Add new transaction
function addNewTransaction() {
    const transaction = {
        date: document.getElementById('txDate').value,
        type: document.getElementById('txType').value,
        asset: document.getElementById('txAsset').value.toUpperCase(),
        amount: parseFloat(document.getElementById('txAmount').value),
        price: parseFloat(document.getElementById('txPrice').value),
        fee: parseFloat(document.getElementById('txFee').value) || 0,
        notes: document.getElementById('txNotes').value
    };
    
    calculator.addTransaction(transaction);
    
    // Refresh UI
    loadTransactions();
    updateStats();
    updateTaxSummary();
    updatePortfolioChart();
    updateHoldingPeriods();
    
    closeModal();
}

// Import CSV (mock function)
function importCSV() {
    // In a real app, this would open file picker and parse CSV
    alert('CSV Import: Please implement file picker and PapaParse');
    
    // Example CSV data
    const exampleData = [
        { date: '2024-01-15', type: 'buy', asset: 'BTC', amount: 0.5, price: 42000 },
        { date: '2024-02-20', type: 'buy', asset: 'ETH', amount: 5, price: 3200 },
        { date: '2024-03-10', type: 'sell', asset: 'BTC', amount: 0.2, price: 45000 }
    ];
    
    exampleData.forEach(tx => calculator.addTransaction(tx));
    
    loadTransactions();
    updateStats();
    updateTaxSummary();
    updatePortfolioChart();
    updateHoldingPeriods();
}

// Generate PDF
function generatePDF() {
    const pdfData = calculator.generatePDF();
    
    // In a real app, this would use jsPDF to create a PDF
    alert('PDF Generation: Implement with jsPDF library');
    console.log('PDF Data:', pdfData);
}

// Filter transactions
function filterTransactions(searchTerm) {
    const rows = document.querySelectorAll('#transactionsBody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Calculate scenario
function calculateScenario() {
    const asset = document.getElementById('scenarioAsset').value;
    const amount = parseFloat(document.getElementById('scenarioAmount').value);
    const price = parseFloat(document.getElementById('scenarioPrice').value);
    const country = document.getElementById('scenarioCountry').value;
    
    if (!amount || !price) {
        alert('Please enter amount and price');
        return;
    }
    
    const result = calculator.analyzeScenario(asset, amount, price, country);
    const config = countryConfigs[country];
    
    document.getElementById('scenarioResult').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            <div style="text-align: left;">
                <small style="color: #00ffff;">Selling</small><br>
                <strong>${result.amount} ${result.asset}</strong>
            </div>
            <div style="text-align: right;">
                <small style="color: #00ffff;">Value</small><br>
                <strong>€${result.totalValue.toFixed(2)}</strong>
            </div>
            <div style="text-align: left;">
                <small style="color: #00ffff;">Gain/Loss</small><br>
                <span style="color: ${result.gain >= 0 ? '#00ff00' : '#ff0000'}">
                    €${result.gain.toFixed(2)}
                </span>
            </div>
            <div style="text-align: right;">
                <small style="color: #00ffff;">Tax in ${config.name}</small><br>
                <span style="color: #ff00ff">€${result.tax.toFixed(2)}</span>
            </div>
            <div style="grid-column: span 2; text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #00ffff33;">
                <small style="color: #00ffff;">Net after tax</small><br>
                <strong style="font-size: 1.3em; color: #00ffff;">
                    €${result.netAfterTax.toFixed(2)}
                </strong>
            </div>
        </div>
    `;
}
