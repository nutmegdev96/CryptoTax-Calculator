// scripts/app.js

// ============================================
// CONFIGURATION
// ============================================
const ADMIN_EMAIL = 'macissimon@gmail.com';
const ADMIN_CODE = 'ADMIN-2024';
const VALID_CODES = ['CRYPTO-2024', 'BETA-101', 'WHALE-777']; // Valid invite codes

// Global state
let currentUser = null;
let isPremium = false;
let inviteCode = '';
let currentCountry = 'IT';

// ============================================
// INITIALIZATION - FIXED VERSION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax Private Beta - Initializing...');
    
    // Initialize components
    initParticles();
    
    // Check for existing session
    const savedUser = localStorage.getItem('cryptotax_user');
    const savedCode = localStorage.getItem('cryptotax_code');
    
    console.log('Saved user:', savedUser);
    console.log('Saved code:', savedCode);
    
    // Clear any bad data (optional - remove in production)
    // if (savedUser && !savedCode) {
    //     localStorage.removeItem('cryptotax_user');
    // }
    
    // IMPORTANT: Force login container to be visible initially
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
    
    // Check if we have a valid session
    if (savedUser && savedCode) {
        console.log('Found existing session, validating...');
        
        // Validate the saved data
        const isValidCode = savedCode === ADMIN_CODE || VALID_CODES.includes(savedCode);
        
        if (isValidCode) {
            console.log('Valid session found, showing dashboard');
            currentUser = savedUser;
            inviteCode = savedCode;
            isPremium = savedUser === ADMIN_EMAIL || localStorage.getItem('cryptotax_premium') === 'true';
            showDashboard();
        } else {
            console.log('Invalid session data, clearing');
            localStorage.removeItem('cryptotax_user');
            localStorage.removeItem('cryptotax_code');
        }
    } else {
        console.log('No valid session, showing login screen');
        // Login screen is already visible
    }
    
    // Setup login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // Setup Enter key on inputs
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');
    
    if (inviteInput) {
        inviteInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        
        // Format invite code as user types (XXXX-XXXX)
        inviteInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (value.length > 4) {
                value = value.slice(0, 4) + '-' + value.slice(4, 8);
            }
            e.target.value = value;
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }
    
    // Start CoinGecko polling (will work when dashboard loads)
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    }
});

// ============================================
// LOGIN FUNCTIONS
// ============================================
function handleLogin() {
    console.log('Login attempt...');
    
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');
    const statusDiv = document.getElementById('loginStatus');
    const adminNote = document.getElementById('adminNote');
    
    if (!inviteInput || !emailInput) {
        console.error('Login inputs not found');
        return;
    }
    
    const code = inviteInput.value.trim().toUpperCase();
    const email = emailInput.value.trim().toLowerCase();
    
    console.log('Code:', code);
    console.log('Email:', email);
    
    // Validate
    if (!code) {
        showStatus('❌ Invite code required', 'error');
        return;
    }
    
    if (!email || !email.includes('@')) {
        showStatus('❌ Valid email required', 'error');
        return;
    }
    
    // Check if admin (special code + email)
    if (code === ADMIN_CODE && email === ADMIN_EMAIL) {
        console.log('Admin access granted');
        
        // Admin access granted
        currentUser = email;
        inviteCode = code;
        isPremium = true;
        
        // Save to localStorage
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        localStorage.setItem('cryptotax_premium', 'true');
        
        // Show admin note
        if (adminNote) {
            adminNote.classList.remove('hidden');
        }
        
        showStatus('👑 Admin access granted', 'success');
        
        // Show dashboard after delay
        setTimeout(() => {
            showDashboard();
        }, 1000);
        
        return;
    }
    
    // Check if valid invite code (from waitlist)
    if (VALID_CODES.includes(code)) {
        console.log('Valid invite code, beta access granted');
        
        // Waitlist access
        currentUser = email;
        inviteCode = code;
        isPremium = false;
        
        // Save to localStorage
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        
        showStatus('✅ Access granted! Welcome to the Beta', 'success');
        
        // Show dashboard after delay
        setTimeout(() => {
            showDashboard();
        }, 1000);
        
        return;
    }
    
    // Invalid code
    console.log('Invalid code');
    showStatus('❌ Invalid invite code. Join waitlist at cryptotax.io', 'error');
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('loginStatus');
    const statusText = document.getElementById('statusText');
    
    if (!statusDiv || !statusText) return;
    
    const statusMsg = statusDiv.querySelector('.status-message');
    
    // Update based on type
    if (type === 'error') {
        statusMsg.style.borderColor = '#ff3b3b';
        statusMsg.innerHTML = `<i class="fas fa-exclamation-circle" style="color: #ff3b3b;"></i><span style="color: #ff3b3b;">${message}</span>`;
    } else if (type === 'success') {
        statusMsg.style.borderColor = '#00ff9d';
        statusMsg.innerHTML = `<i class="fas fa-check-circle" style="color: #00ff9d;"></i><span style="color: #00ff9d;">${message}</span>`;
    } else {
        statusMsg.style.borderColor = '#00f7ff';
        statusMsg.innerHTML = `<i class="fas fa-lock" style="color: #00f7ff;"></i><span>${message}</span>`;
    }
}

function showLogin() {
    console.log('Showing login screen');
    
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    
    if (loginContainer) {
        loginContainer.style.display = 'flex';
    }
    
    if (dashboardWrapper) {
        dashboardWrapper.style.display = 'none';
    }
    
    if (headerTop) {
        headerTop.style.display = 'none';
    }
}

function showDashboard() {
    console.log('Showing dashboard for user:', currentUser);
    
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    
    if (loginContainer) {
        loginContainer.style.display = 'none';
    }
    
    if (dashboardWrapper) {
        dashboardWrapper.style.display = 'block';
    }
    
    if (headerTop) {
        headerTop.style.display = 'flex';
    }
    
    // Update UI with user info
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    if (userEmailDisplay) {
        userEmailDisplay.textContent = currentUser;
    }
    
    // Update user badge
    const userBadge = document.getElementById('userBadge');
    if (userBadge) {
        if (currentUser === ADMIN_EMAIL) {
            userBadge.className = 'user-badge admin';
            userBadge.innerHTML = '<i class="fas fa-crown"></i> ADMIN';
        } else if (isPremium) {
            userBadge.className = 'user-badge premium';
            userBadge.innerHTML = '<i class="fas fa-star"></i> PREMIUM';
        } else {
            userBadge.className = 'user-badge free';
            userBadge.innerHTML = '<i class="fas fa-user"></i> BETA USER';
        }
    }
    
    // Hide pricing banner for admin
    const pricingBanner = document.getElementById('pricingBanner');
    if (pricingBanner) {
        if (currentUser === ADMIN_EMAIL || isPremium) {
            pricingBanner.style.display = 'none';
        } else {
            pricingBanner.style.display = 'block';
        }
    }
    
    // Initialize dashboard functionality
    initializeDashboard();
}

// ============================================
// DASHBOARD INITIALIZATION
// ============================================
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCountry = btn.dataset.country;
            
            // Update country name display
            const countryNameEl = document.getElementById('currentCountryName');
            if (countryNameEl) {
                const countryNames = {
                    'IT': 'ITALY', 'US': 'USA', 'DE': 'GERMANY', 'GB': 'UK', 'IN': 'INDIA'
                };
                countryNameEl.textContent = countryNames[currentCountry] || 'ITALY';
            }
            
            // Update tax summary
            updateTaxSummary();
            
            // Update tax notes
            const taxNotes = document.getElementById('taxNotes');
            if (taxNotes && typeof taxEngine !== 'undefined') {
                taxNotes.innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    ${taxEngine.getTaxNotes(currentCountry)}
                `;
            }
        });
    });
    
    // Button listeners
    const importBtn = document.getElementById('importCsvBtn');
    if (importBtn) importBtn.addEventListener('click', importCSV);
    
    const addBtn = document.getElementById('addTransactionBtn');
    if (addBtn) addBtn.addEventListener('click', openModal);
    
    const pdfBtn = document.getElementById('generatePdfBtn');
    if (pdfBtn) pdfBtn.addEventListener('click', generatePDF);
    
    const calcBtn = document.getElementById('calcScenarioBtn');
    if (calcBtn) calcBtn.addEventListener('click', calculateScenario);
    
    const activateBtn = document.getElementById('activateBtn');
    if (activateBtn) activateBtn.addEventListener('click', showPaymentModal);
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTransactions(e.target.value);
        });
    }
    
    // Load initial data
    updateTaxSummary();
    updateTaxChart(4321.09, 890.12);
    
    // Setup prices update handler
    if (typeof coingecko !== 'undefined') {
        // Override updateUI to use our elements
        coingecko.updateUI = function(prices) {
            const pricesList = document.getElementById('pricesList');
            if (!pricesList) return;
            
            const coinMap = {
                'bitcoin': { symbol: 'BTC', name: 'Bitcoin' },
                'ethereum': { symbol: 'ETH', name: 'Ethereum' },
                'binancecoin': { symbol: 'BNB', name: 'BNB' },
                'solana': { symbol: 'SOL', name: 'Solana' }
            };
            
            pricesList.innerHTML = '';
            
            for (const [coin, data] of Object.entries(prices)) {
                const info = coinMap[coin];
                if (!info) continue;
                
                const item = document.createElement('div');
                item.className = 'price-item';
                item.innerHTML = `
                    <span class="coin">${info.symbol}</span>
                    <span class="price">$${data.usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                        ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                    </span>
                `;
                pricesList.appendChild(item);
            }
            
            const updateTime = document.getElementById('updateTime');
            if (updateTime) {
                updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
            }
        };
    }
}

// ============================================
// FEATURE FUNCTIONS
// ============================================
function importCSV() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to import CSV.');
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
        alert('✨ Premium feature. Upgrade to add transactions.');
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
            if (y > 250) return;
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
        resultDiv.innerHTML = '<span class="placeholder">Enter amount →</span>';
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
        taxEngine.calculateTax(estimatedGain, currentCountry) : 0;
    
    resultDiv.innerHTML = `
        <div style="display: grid; gap: 5px; text-align: left;">
            <div>Value: <strong>$${totalValue.toLocaleString()}</strong></div>
            <div>Est. Tax: <strong style="color: #ff00e6;">$${tax.toLocaleString()}</strong></div>
        </div>
    `;
}

function filterTransactions(searchTerm) {
    if (!isPremium) return;
    console.log('Searching:', searchTerm);
    // Implement transaction filtering here
}

function loadUserTransactions() {
    if (!isPremium) return;
    
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    const transactions = typeof taxEngine !== 'undefined' ? taxEngine.transactions : [];
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="premium-message">
                    <i class="fas fa-inbox"></i>
                    <span>No transactions yet. Use IMPORT or ADD to get started.</span>
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

function deleteTransaction(id) {
    if (typeof taxEngine !== 'undefined' && isPremium) {
        taxEngine.deleteTransaction(id);
        loadUserTransactions();
        alert('Transaction deleted');
    }
}

function updateTaxSummary() {
    const gain = 4321.09;
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(gain, currentCountry) : 890.12;
    
    const totalGainEl = document.getElementById('totalGain');
    const taxableAmountEl = document.getElementById('taxableAmount');
    const taxDueEl = document.getElementById('taxDue');
    const effectiveRateEl = document.getElementById('effectiveRate');
    
    if (totalGainEl) totalGainEl.textContent = `$${gain.toFixed(2)}`;
    if (taxableAmountEl) taxableAmountEl.textContent = `$${gain.toFixed(2)}`;
    if (taxDueEl) taxDueEl.textContent = `$${tax.toFixed(2)}`;
    if (effectiveRateEl) effectiveRateEl.textContent = `${((tax / gain) * 100).toFixed(1)}%`;
    
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

// ============================================
// MODAL FUNCTIONS
// ============================================
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

function closeModal() {
    const modal = document.getElementById('activationModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

function copyWallet() {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet).then(() => {
        alert('✅ Wallet address copied to clipboard!');
    }).catch(() => {
        alert('❌ Could not copy. Please copy manually.');
    });
}

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
            const pricingBanner = document.getElementById('pricingBanner');
            if (pricingBanner) {
                pricingBanner.style.display = 'none';
            }
            
            // Update user badge
            const userBadge = document.getElementById('userBadge');
            if (userBadge) {
                userBadge.className = 'user-badge premium';
                userBadge.innerHTML = '<i class="fas fa-star"></i> PREMIUM';
            }
            
            alert('🎉 PREMIUM ACTIVATED! Enjoy all features.');
        }, 1500);
    }, 3000);
}

function logout() {
    // Clear user data
    localStorage.removeItem('cryptotax_user');
    localStorage.removeItem('cryptotax_code');
    // Keep premium flag if they paid (optional)
    // localStorage.removeItem('cryptotax_premium');
    
    closeLogoutModal();
    
    // Reset state
    currentUser = null;
    isPremium = false;
    
    // Show login screen
    showLogin();
}

// ============================================
// PARTICLE EFFECT 
// ============================================
function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    // Simple resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // more elaborate particle effects here
}

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
window.logout = logout;
window.deleteTransaction = deleteTransaction;
