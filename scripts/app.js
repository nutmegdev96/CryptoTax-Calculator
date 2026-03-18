// scripts/app.js

// Initialize
const coingecko = new CoinGeckoAPI();
const taxEngine = new TaxEngine();
let currentCountry = 'IT';

// DOM Elements
const dashboard = document.getElementById('dashboardContainer');
const pricingBanner = document.getElementById('pricingBanner');
const activateBtn = document.getElementById('activateBtn');
const modal = document.getElementById('activationModal');
const paymentDetails = document.getElementById('paymentDetails');

// Check if premium is active
let premiumActive = localStorage.getItem('cryptotax_premium') === 'true';

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax Premium initialized');
    
    // Start CoinGecko polling
    coingecko.startPolling();
    
    // Update UI based on premium status
    updatePremiumStatus();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load sample data for preview
    loadPreviewData();
});

function setupEventListeners() {
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCountry = btn.dataset.country;
            
            // Update country name
            const countryNames = {
                'IT': 'ITALY', 'US': 'USA', 'DE': 'GERMANY', 'GB': 'UK', 'IN': 'INDIA'
            };
            document.getElementById('currentCountryName').textContent = countryNames[currentCountry];
            
            // Update tax summary
            updateTaxSummary();
            
            // Update tax notes
            document.getElementById('taxNotes').innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${taxEngine.getTaxNotes(currentCountry)}</span>
            `;
        });
    });
    
    // Generate PDF button
    document.getElementById('generatePdfBtn').addEventListener('click', generatePDF);
    
    // Scenario calculator
    document.getElementById('calcScenarioBtn').addEventListener('click', calculateScenario);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTransactions(e.target.value);
    });
    
    // Premium activation
    activateBtn.addEventListener('click', showPaymentModal);
}

function updatePremiumStatus() {
    if (premiumActive) {
        dashboard.classList.remove('blurred');
        pricingBanner.style.display = 'none';
        loadUserTransactions();
    } else {
        dashboard.classList.add('blurred');
    }
}

function showPaymentModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
}

function copyWallet() {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet).then(() => {
        alert('Wallet address copied!');
    });
}

function checkPayment() {
    // Simulate payment check
    document.getElementById('modalPaymentStatus').innerHTML = `
        <i class="fas fa-spinner fa-spin"></i> Checking blockchain...
    `;
    
    setTimeout(() => {
        document.getElementById('modalPaymentStatus').innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--neon-green);"></i> Payment confirmed! Welcome to PREMIUM!
        `;
        
        setTimeout(() => {
            premiumActive = true;
            localStorage.setItem('cryptotax_premium', 'true');
            modal.classList.remove('show');
            updatePremiumStatus();
        }, 2000);
    }, 3000);
}

function loadPreviewData() {
    // Show premium placeholder
    document.getElementById('totalPortfolio').textContent = '$12,345.67';
    document.getElementById('unrealizedGain').textContent = '+$4,321.09';
    document.getElementById('totalTax').textContent = '$890.12';
    document.getElementById('totalTransactions').textContent = '24';
    
    document.getElementById('portfolioChange').textContent = '+23.4%';
    document.getElementById('gainChange').textContent = '+15.7%';
    
    updateTaxSummary();
}

function updateTaxSummary() {
    const gain = 4321.09;
    const tax = taxEngine.calculateTax(gain, currentCountry);
    
    document.getElementById('totalGain').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxableAmount').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${((tax / gain) * 100).toFixed(2)}%`;
    
    // Update tax chart
    updateTaxChart(gain, tax);
}

function updateTaxChart(gain, tax) {
    const ctx = document.getElementById('taxChart').getContext('2d');
    
    if (window.taxChartInstance) {
        window.taxChartInstance.destroy();
    }
    
    window.taxChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tax Due', 'Net Gain'],
            datasets: [{
                data: [tax, gain - tax],
                backgroundColor: ['#ff00e6', '#00f7ff'],
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function calculateScenario() {
    const asset = document.getElementById('scenarioAsset').value;
    const amount = parseFloat(document.getElementById('scenarioAmount').value);
    
    if (!amount) {
        document.getElementById('scenarioResult').innerHTML = `
            <span class="placeholder">Enter an amount to calculate</span>
        `;
        return;
    }
    
    const price = coingecko.getPrice(asset) || 45000;
    const totalValue = amount * price;
    const estimatedGain = totalValue * 0.2; // Simplified
    const tax = taxEngine.calculateTax(estimatedGain, currentCountry);
    
    document.getElementById('scenarioResult').innerHTML = `
        <div style="display: grid; gap: 10px;">
            <div>Estimated Value: <strong>$${totalValue.toLocaleString()}</strong></div>
            <div>Estimated Gain: <strong style="color: var(--neon-green);">+$${estimatedGain.toLocaleString()}</strong></div>
            <div>Estimated Tax: <strong style="color: var(--neon-magenta);">$${tax.toLocaleString()}</strong></div>
        </div>
    `;
}

function filterTransactions(search) {
    // Only if premium active
    if (!premiumActive) return;
    // Filter logic here
}

function loadUserTransactions() {
    // Load from localStorage if premium
}

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add logo/title
    doc.setFontSize(24);
    doc.setTextColor(0, 247, 255);
    doc.text('CRYPTOTAX REPORT', 105, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    // Add tax summary
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Tax Summary', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Jurisdiction: ${document.getElementById('currentCountryName').textContent}`, 20, 65);
    doc.text(`Total Gain: $${document.getElementById('totalGain').textContent}`, 20, 75);
    doc.text(`Tax Due: $${document.getElementById('taxDue').textContent}`, 20, 85);
    doc.text(`Effective Rate: ${document.getElementById('effectiveRate').textContent}`, 20, 95);
    
    // Add note
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a preview. Activate PREMIUM for full transaction history and detailed reports.', 105, 140, { align: 'center' });
    
    // Save PDF
    doc.save('cryptotax-report.pdf');
    
    // Show premium prompt if not active
    if (!premiumActive) {
        setTimeout(() => {
            alert('⚡ PREMIUM FEATURE ⚡\n\nGenerate unlimited detailed PDF reports with transaction history by activating PREMIUM for just $10!');
        }, 500);
    }
}

// Expose functions to global scope
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
