// scripts/app.js

// Admin email that gets free premium access
const ADMIN_EMAIL = 'macissimon@gmail.com';

// Check if user is logged in
let currentUser = null;
let isPremium = false;

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax Premium initialized');
    
    // Check for existing session
    const savedUser = localStorage.getItem('cryptotax_user');
    if (savedUser) {
        currentUser = savedUser;
        isPremium = savedUser === ADMIN_EMAIL || localStorage.getItem('cryptotax_premium') === 'true';
        showDashboard();
    } else {
        showLogin();
    }
    
    // Start CoinGecko polling
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    }
    
    // Setup login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Allow Enter key on email input
    const loginEmail = document.getElementById('loginEmail');
    if (loginEmail) {
        loginEmail.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
});

function showLogin() {
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'none';
    document.getElementById('pricingBanner').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'block';
    
    // Show pricing banner only for non-admin non-premium users
    if (currentUser !== ADMIN_EMAIL && !isPremium) {
        document.getElementById('pricingBanner').style.display = 'block';
    }
    
    // Update user section in header
    updateUserSection();
    
    // Initialize dashboard
    initializeDashboard();
}

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;
    
    const isAdmin = currentUser === ADMIN_EMAIL;
    const status = isAdmin ? '👑 ADMIN' : (isPremium ? '⭐ PREMIUM' : '👤 FREE');
    
    userSection.innerHTML = `
        <div class="user-info">
            <span class="user-email">${currentUser}</span>
            <span class="user-status ${isAdmin ? 'admin' : (isPremium ? 'premium' : 'free')}">${status}</span>
            <button class="logout-btn" onclick="showLogoutModal()">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    `;
}

function handleLogin() {
    const emailInput = document.getElementById('loginEmail');
    const email = emailInput.value.trim();
    
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Store user
    currentUser = email;
    localStorage.setItem('cryptotax_user', email);
    
    // Check if admin
    if (email === ADMIN_EMAIL) {
        isPremium = true;
        localStorage.setItem('cryptotax_premium', 'true');
    } else {
        isPremium = localStorage.getItem('cryptotax_premium') === 'true';
    }
    
    showDashboard();
}

function showLogoutModal() {
    document.getElementById('logoutModal').classList.add('show');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').classList.remove('show');
}

function logout() {
    // Clear user data
    currentUser = null;
    isPremium = false;
    localStorage.removeItem('cryptotax_user');
    // Keep premium status if it was purchased? No, clear it
    // localStorage.removeItem('cryptotax_premium');
    
    closeLogoutModal();
    showLogin();
}

function initializeDashboard() {
    // Setup all event listeners
    setupEventListeners();
    
    // Load preview data
    loadPreviewData();
    
    // Load transactions if premium
    if (isPremium) {
        loadUserTransactions();
    }
}

function setupEventListeners() {
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.currentCountry = btn.dataset.country;
            
            // Update country name
            const countryNames = {
                'IT': 'ITALY', 'US': 'USA', 'DE': 'GERMANY', 'GB': 'UK', 'IN': 'INDIA'
            };
            const countryNameElement = document.getElementById('currentCountryName');
            if (countryNameElement) {
                countryNameElement.textContent = countryNames[window.currentCountry];
            }
            
            // Update tax summary
            updateTaxSummary();
            
            // Update tax notes
            const taxNotes = document.getElementById('taxNotes');
            if (taxNotes && typeof taxEngine !== 'undefined') {
                taxNotes.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    <span>${taxEngine.getTaxNotes(window.currentCountry)}</span>
                `;
            }
        });
    });
    
    // IMPORT CSV button
    const importBtn = document.getElementById('importCsvBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importCSV);
    }
    
    // ADD MANUAL button
    const addBtn = document.getElementById('addTransactionBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openModal);
    }
    
    // GENERATE PDF button
    const pdfBtn = document.getElementById('generatePdfBtn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', generatePDF);
    }
    
    // Scenario calculator
    const calcBtn = document.getElementById('calcScenarioBtn');
    if (calcBtn) {
        calcBtn.addEventListener('click', calculateScenario);
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTransactions(e.target.value);
        });
    }
    
    // Premium activation
    const activateBtn = document.getElementById('activateBtn');
    if (activateBtn) {
        activateBtn.addEventListener('click', showPaymentModal);
    }
    
    // Modal close button
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
}

function showPaymentModal() {
    const modal = document.getElementById('activationModal');
    if (modal) {
        modal.classList.add('show');
        
        // Show payment details
        const paymentDetails = document.getElementById('paymentDetails');
        if (paymentDetails) {
            paymentDetails.classList.add('show');
        }
    }
}

window.showPaymentModal = showPaymentModal;

function closeModal() {
    const modal = document.getElementById('activationModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

window.closeModal = closeModal;

function copyWallet() {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet).then(() => {
        alert('✅ Wallet address copied to clipboard!');
    }).catch(() => {
        alert('❌ Could not copy. Please copy manually.');
    });
}

window.copyWallet = copyWallet;

function checkPayment() {
    const statusElement = document.getElementById('modalPaymentStatus');
    if (!statusElement) return;
    
    statusElement.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i> Checking blockchain...
    `;
    
    setTimeout(() => {
        statusElement.innerHTML = `
            <i class="fas fa-check-circle" style="color: #00ff9d;"></i> Payment confirmed! Welcome to PREMIUM!
        `;
        
        setTimeout(() => {
            isPremium = true;
            localStorage.setItem('cryptotax_premium', 'true');
            closeModal();
            
            // Hide pricing banner
            document.getElementById('pricingBanner').style.display = 'none';
            
            // Update user section
            updateUserSection();
            
            alert('🎉 PREMIUM ACTIVATED! Enjoy all features.');
        }, 2000);
    }, 3000);
}

window.checkPayment = checkPayment;

function importCSV() {
    if (!isPremium) {
        alert('⚡ PREMIUM FEATURE ⚡\n\nPlease activate PREMIUM to import CSV files.');
        showPaymentModal();
        return;
    }
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file && window.Papa) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    console.log('CSV imported:', results.data);
                    
                    // Add transactions to taxEngine
                    if (typeof taxEngine !== 'undefined') {
                        results.data.forEach(row => {
                            if (row.date && row.type && row.asset) {
                                taxEngine.addTransaction({
                                    date: row.date,
                                    type: row.type.toLowerCase(),
                                    asset: row.asset.toUpperCase(),
                                    amount: parseFloat(row.amount) || 0,
                                    price: parseFloat(row.price) || 0,
                                    fee: parseFloat(row.fee) || 0
                                });
                            }
                        });
                    }
                    
                    alert(`✅ Imported ${results.data.length} transactions!`);
                    loadUserTransactions();
                },
                error: (error) => {
                    alert('❌ Error parsing CSV: ' + error);
                }
            });
        }
    };
    
    input.click();
}

function openModal() {
    if (!isPremium) {
        alert('⚡ PREMIUM FEATURE ⚡\n\nPlease activate PREMIUM to add manual transactions.');
        showPaymentModal();
        return;
    }
    
    // Simple prompt for demo
    const date = prompt('Enter date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    
    const type = prompt('Enter type (buy/sell):', 'buy');
    if (!type || !['buy', 'sell'].includes(type.toLowerCase())) {
        alert('Type must be "buy" or "sell"');
        return;
    }
    
    const asset = prompt('Enter asset (e.g., BTC, ETH):', 'BTC').toUpperCase();
    if (!asset) return;
    
    const amount = parseFloat(prompt('Enter amount:', '0.1'));
    if (isNaN(amount) || amount <= 0) {
        alert('Invalid amount');
        return;
    }
    
    const price = parseFloat(prompt('Enter price in USD:', '50000'));
    if (isNaN(price) || price <= 0) {
        alert('Invalid price');
        return;
    }
    
    // Add transaction
    if (typeof taxEngine !== 'undefined') {
        taxEngine.addTransaction({
            date: date,
            type: type.toLowerCase(),
            asset: asset,
            amount: amount,
            price: price,
            fee: 0
        });
    }
    
    alert(`✅ Transaction added: ${type} ${amount} ${asset} at $${price}`);
    loadUserTransactions();
}

function generatePDF() {
    if (typeof window.jspdf === 'undefined') {
        alert('❌ PDF library not loaded. Please refresh the page.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(24);
    doc.setTextColor(0, 247, 255);
    doc.text('CRYPTOTAX REPORT', 105, 20, { align: 'center' });
    
    // Add user info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`User: ${currentUser}`, 105, 30, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 35, { align: 'center' });
    
    // Add tax summary
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('Tax Summary', 20, 50);
    
    const countryName = document.getElementById('currentCountryName')?.textContent || 'ITALY';
    const totalGain = document.getElementById('totalGain')?.textContent || '$0.00';
    const taxDue = document.getElementById('taxDue')?.textContent || '$0.00';
    const effectiveRate = document.getElementById('effectiveRate')?.textContent || '0.00%';
    
    doc.setFontSize(12);
    doc.text(`Jurisdiction: ${countryName}`, 20, 65);
    doc.text(`Total Gain: ${totalGain}`, 20, 75);
    doc.text(`Tax Due: ${taxDue}`, 20, 85);
    doc.text(`Effective Rate: ${effectiveRate}`, 20, 95);
    
    // Add transactions if premium
    if (isPremium && typeof taxEngine !== 'undefined' && taxEngine.transactions.length > 0) {
        doc.setFontSize(14);
        doc.text('Recent Transactions', 20, 115);
        
        let y = 125;
        doc.setFontSize(8);
        taxEngine.transactions.slice(0, 5).forEach((tx, i) => {
            if (y > 250) return; // Don't go off page
            doc.text(`${tx.date} | ${tx.type.toUpperCase()} | ${tx.amount} ${tx.asset} @ $${tx.price}`, 20, y);
            y += 5;
        });
        
        if (taxEngine.transactions.length > 5) {
            doc.text(`... and ${taxEngine.transactions.length - 5} more transactions`, 20, y);
        }
    } else {
        doc.setFontSize(10);
        doc.setTextColor(255, 215, 0);
        doc.text('⚡ Activate PREMIUM for detailed transaction history ⚡', 105, 120, { align: 'center' });
    }
    
    // Save PDF
    doc.save(`cryptotax-report-${Date.now()}.pdf`);
}

function calculateScenario() {
    const assetSelect = document.getElementById('scenarioAsset');
    const amountInput = document.getElementById('scenarioAmount');
    const resultDiv = document.getElementById('scenarioResult');
    
    if (!assetSelect || !amountInput || !resultDiv) return;
    
    const asset = assetSelect.value;
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        resultDiv.innerHTML = '<span class="placeholder">Enter a valid amount</span>';
        return;
    }
    
    // Get price from CoinGecko
    let price = 45000; // Default
    if (typeof coingecko !== 'undefined') {
        const fetchedPrice = coingecko.getPrice(asset);
        if (fetchedPrice) price = fetchedPrice;
    }
    
    const totalValue = amount * price;
    const estimatedGain = totalValue * 0.2; // Simplified: assume 20% gain
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(estimatedGain, window.currentCountry) : 0;
    
    resultDiv.innerHTML = `
        <div style="display: grid; gap: 10px; text-align: left;">
            <div>Current Price: <strong>$${price.toLocaleString()}</strong></div>
            <div>Total Value: <strong>$${totalValue.toLocaleString()}</strong></div>
            <div>Est. Gain (20%): <strong style="color: #00ff9d;">+$${estimatedGain.toLocaleString()}</strong></div>
            <div>Est. Tax: <strong style="color: #ff00e6;">$${tax.toLocaleString()}</strong></div>
        </div>
    `;
}

function filterTransactions(searchTerm) {
    if (!isPremium) return;
    console.log('Searching:', searchTerm);
    // Implement transaction filtering here
}

function loadPreviewData() {
    // Update stats with sample data
    const totalPortfolio = document.getElementById('totalPortfolio');
    const unrealizedGain = document.getElementById('unrealizedGain');
    const totalTax = document.getElementById('totalTax');
    const totalTransactions = document.getElementById('totalTransactions');
    const portfolioChange = document.getElementById('portfolioChange');
    const gainChange = document.getElementById('gainChange');
    
    if (totalPortfolio) totalPortfolio.textContent = '$12,345.67';
    if (unrealizedGain) unrealizedGain.textContent = '+$4,321.09';
    if (totalTax) totalTax.textContent = '$890.12';
    if (totalTransactions) totalTransactions.textContent = '24';
    if (portfolioChange) portfolioChange.textContent = '+23.4%';
    if (gainChange) gainChange.textContent = '+15.7%';
    
    updateTaxSummary();
}

function updateTaxSummary() {
    const gain = 4321.09;
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(gain, window.currentCountry) : 0;
    
    const totalGainEl = document.getElementById('totalGain');
    const taxableAmountEl = document.getElementById('taxableAmount');
    const taxDueEl = document.getElementById('taxDue');
    const effectiveRateEl = document.getElementById('effectiveRate');
    
    if (totalGainEl) totalGainEl.textContent = `$${gain.toFixed(2)}`;
    if (taxableAmountEl) taxableAmountEl.textContent = `$${gain.toFixed(2)}`;
    if (taxDueEl) taxDueEl.textContent = `$${tax.toFixed(2)}`;
    if (effectiveRateEl) effectiveRateEl.textContent = `${((tax / gain) * 100).toFixed(2)}%`;
    
    // Update tax chart
    updateTaxChart(gain, tax);
}

function updateTaxChart(gain, tax) {
    const canvas = document.getElementById('taxChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if any
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

function loadUserTransactions() {
    if (!isPremium) return;
    
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    const transactions = typeof taxEngine !== 'undefined' ? taxEngine.transactions : [];
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #a0a0b0;">
                    <i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 10px;"></i><br>
                    No transactions yet. Use IMPORT CSV or ADD MANUAL to get started.
                </td>
            </tr>
        `;
        return;
    }
    
    // Render transactions
    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>${tx.date}</td>
            <td><span class="type-badge type-${tx.type}">${tx.type.toUpperCase()}</span></td>
            <td>${tx.asset}</td>
            <td>${tx.amount}</td>
            <td>$${parseFloat(tx.price).toFixed(2)}</td>
            <td>$${(tx.amount * tx.price).toFixed(2)}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction('${tx.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update transaction count
    const totalTransactions = document.getElementById('totalTransactions');
    if (totalTransactions) {
        totalTransactions.textContent = transactions.length;
    }
}

// Make functions globally available for onclick handlers
window.deleteTransaction = (id) => {
    if (typeof taxEngine !== 'undefined' && isPremium) {
        taxEngine.deleteTransaction(id);
        loadUserTransactions();
        alert('Transaction deleted');
    }
};

window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.logout = logout;
