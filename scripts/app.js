// scripts/app.js

// ============================================
// CONFIGURATION
// ============================================
const ADMIN_EMAIL = 'macissimon@gmail.com'; // Admin gets automatic premium

// Global state
let currentUser = null;
let isPremium = false;
let currentCountry = 'IT';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting CryptoTax...');

    // Get references to main elements
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');

    // FORCE initial view: login visible, dashboard hidden
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
    
    // RESET the status message to default
    resetStatusMessage();
    
    console.log('-> Initial state: Login visible, Dashboard hidden.');

    // Check for existing session
    const savedUser = localStorage.getItem('cryptotax_user');
    
    if (savedUser) {
        console.log('-> Found existing session for:', savedUser);
        currentUser = savedUser;
        isPremium = (savedUser === ADMIN_EMAIL) || (localStorage.getItem('cryptotax_premium') === 'true');
        showDashboard();
    } else {
        console.log('-> No session, showing login.');
    }

    // Setup login listener
    setupLoginListener();

    // Start CoinGecko polling
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    } else {
        console.error('CoinGecko not loaded!');
    }
});

// ============================================
// HELPER TO RESET STATUS MESSAGE
// ============================================
function resetStatusMessage() {
    const statusMsg = document.querySelector('.status-message');
    if (statusMsg) {
        statusMsg.style.borderColor = '#00f7ff';
        statusMsg.innerHTML = `<i class="fas fa-lock" style="color: #00f7ff;"></i>
                               <span style="color: #a0a0b0;">Enter your email to continue</span>`;
    }
}

// ============================================
// LOGIN FUNCTIONS
// ============================================
function setupLoginListener() {
    const loginBtn = document.getElementById('loginBtn');
    const emailInput = document.getElementById('loginEmail');

    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
        
        emailInput.addEventListener('input', () => {
            resetStatusMessage();
        });
    }
}

function handleLogin() {
    console.log('Login attempt...');
    const emailInput = document.getElementById('loginEmail');
    
    const email = emailInput?.value.trim().toLowerCase() || '';

    if (!email || !email.includes('@')) {
        showStatus('❌ Valid email required', 'error');
        return;
    }

    // Check if admin
    if (email === ADMIN_EMAIL) {
        console.log('Admin access');
        currentUser = email;
        isPremium = true;
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_premium', 'true');
        showStatus('👑 Admin access granted!', 'success');
        setTimeout(showDashboard, 1000);
        return;
    }

    // Regular user
    console.log('Regular user access');
    currentUser = email;
    isPremium = false;
    localStorage.setItem('cryptotax_user', email);
    showStatus('✅ Access granted!', 'success');
    setTimeout(showDashboard, 1000);
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('loginStatus');
    const statusMsg = statusDiv?.querySelector('.status-message');
    if (!statusMsg) return;

    const colors = { error: '#ff3b3b', success: '#00ff9d', info: '#00f7ff' };
    const icons = { error: 'fa-exclamation-circle', success: 'fa-check-circle', info: 'fa-lock' };

    statusMsg.style.borderColor = colors[type] || colors.info;
    statusMsg.innerHTML = `<i class="fas ${icons[type] || icons.info}" style="color: ${colors[type] || colors.info};"></i>
                           <span style="color: ${colors[type] || colors.info};">${message}</span>`;
}

function showLogin() {
    console.log('Showing login');
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
    
    resetStatusMessage();
}

function showDashboard() {
    console.log('Showing dashboard for user:', currentUser);
    
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboardWrapper) dashboardWrapper.style.display = 'block';
    if (headerTop) headerTop.style.display = 'flex';

    // Update UI with user data
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    if (userEmailDisplay) userEmailDisplay.textContent = currentUser;

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
            userBadge.innerHTML = '<i class="fas fa-user"></i> FREE USER';
        }
    }

    // Show pricing banner only for non-premium users
    const pricingBanner = document.getElementById('pricingBanner');
    if (pricingBanner) {
        pricingBanner.style.display = (currentUser === ADMIN_EMAIL || isPremium) ? 'none' : 'block';
    }

    // Initialize dashboard
    initializeDashboard();
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================
function initializeDashboard() {
    console.log('Initializing dashboard...');

    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.removeEventListener('click', handleCountryChange);
        btn.addEventListener('click', handleCountryChange);
    });

    // Action buttons
    document.getElementById('importCsvBtn')?.addEventListener('click', importCSV);
    document.getElementById('addTransactionBtn')?.addEventListener('click', openModal);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('calcScenarioBtn')?.addEventListener('click', calculateScenario);
    document.getElementById('activateBtn')?.addEventListener('click', showPaymentModal);

    // Search
    document.getElementById('searchInput')?.addEventListener('input', (e) => filterTransactions(e.target.value));

    // Load transactions
    loadUserTransactions();
    
    // Update stats based on actual transactions
    updateStats();
    updateTaxSummary();

    // Setup price updates with proper symbol display
    if (typeof coingecko !== 'undefined') {
        coingecko.updateUI = function(prices) {
            const pricesList = document.getElementById('pricesList');
            if (!pricesList) return;

            pricesList.innerHTML = '';

            for (const [coinId, data] of Object.entries(prices)) {
                const item = document.createElement('div');
                item.className = 'price-item';
                item.innerHTML = `
                    <span class="coin">${data.symbol}</span>
                    <span class="price">$${data.usd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                    <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                        ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                    </span>`;
                pricesList.appendChild(item);
            }

            const updateTime = document.getElementById('updateTime');
            if (updateTime) {
                updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
            }
        };

        if (coingecko.cache.prices) {
            coingecko.updateUI(coingecko.cache.prices);
        }
    }
}

function handleCountryChange(event) {
    const btn = event.currentTarget;
    document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCountry = btn.dataset.country;

    const countryNames = { 'IT': 'ITALY', 'US': 'USA', 'DE': 'GERMANY', 'GB': 'UK', 'IN': 'INDIA' };
    const countryNameEl = document.getElementById('currentCountryName');
    if (countryNameEl) countryNameEl.textContent = countryNames[currentCountry] || 'ITALY';

    updateTaxSummary();

    const taxNotes = document.getElementById('taxNotes');
    if (taxNotes && typeof taxEngine !== 'undefined') {
        taxNotes.innerHTML = `<i class="fas fa-info-circle"></i> ${taxEngine.getTaxNotes(currentCountry)}`;
    }
}

function loadUserTransactions() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    if (!isPremium) {
        // Show upgrade message for non-premium users
        tbody.innerHTML = `
            <tr class="premium-row">
                <td colspan="7" class="premium-message">
                    <i class="fas fa-lock"></i>
                    <span>Upgrade to Premium to add and view transactions</span>
                    <button class="mini-premium-btn" onclick="showPaymentModal()">✨ UPGRADE NOW</button>
                </td>
            </tr>
        `;
        return;
    }
    
    // Show transactions for premium users
    const transactions = typeof taxEngine !== 'undefined' ? taxEngine.transactions : [];
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #a0a0b0;">
                    <i class="fas fa-inbox" style="font-size: 2em; margin-bottom: 10px;"></i><br>
                    No transactions yet. Use IMPORT or ADD to get started.
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
            <td>$${tx.price.toLocaleString()}</td>
            <td>$${(tx.amount * tx.price).toLocaleString()}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction('${tx.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    if (!isPremium || typeof taxEngine === 'undefined') return;
    
    const transactions = taxEngine.transactions;
    
    // Calculate total portfolio value
    let totalValue = 0;
    const holdings = {};
    
    transactions.forEach(tx => {
        if (tx.type === 'buy') {
            holdings[tx.asset] = (holdings[tx.asset] || 0) + tx.amount;
        } else if (tx.type === 'sell') {
            holdings[tx.asset] = (holdings[tx.asset] || 0) - tx.amount;
        }
    });
    
    // Get current prices and calculate value
    Object.keys(holdings).forEach(asset => {
        if (holdings[asset] > 0 && typeof coingecko !== 'undefined') {
            const price = coingecko.getPrice(asset);
            if (price) {
                totalValue += holdings[asset] * price;
            }
        }
    });
    
    // Update UI
    document.getElementById('totalPortfolio').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('totalTransactions').textContent = transactions.length;
}

function deleteTransaction(id) {
    if (!isPremium || typeof taxEngine === 'undefined') return;
    
    if (confirm('Delete this transaction?')) {
        taxEngine.deleteTransaction(id);
        loadUserTransactions();
        updateStats();
        updateTaxSummary();
    }
}

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
                    results.data.forEach(row => {
                        if (row.date && row.type && row.asset && row.amount && row.price) {
                            taxEngine.addTransaction({
                                date: row.date,
                                type: row.type.toLowerCase(),
                                asset: row.asset.toUpperCase(),
                                amount: parseFloat(row.amount),
                                price: parseFloat(row.price),
                                fee: parseFloat(row.fee) || 0
                            });
                        }
                    });
                    alert(`✅ Imported ${results.data.length} transactions!`);
                    loadUserTransactions();
                    updateStats();
                    updateTaxSummary();
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
    if (!type || !['buy', 'sell'].includes(type.toLowerCase())) return;
    
    const asset = prompt('Enter asset (e.g., BTC, ETH):', 'BTC').toUpperCase();
    if (!asset) return;
    
    const amount = parseFloat(prompt('Enter amount:', '0.1'));
    if (isNaN(amount) || amount <= 0) return;
    
    const price = parseFloat(prompt('Enter price in USD:', '50000'));
    if (isNaN(price) || price <= 0) return;
    
    taxEngine.addTransaction({
        date: date,
        type: type.toLowerCase(),
        asset: asset,
        amount: amount,
        price: price,
        fee: 0
    });
    
    alert(`✅ Transaction added!`);
    loadUserTransactions();
    updateStats();
    updateTaxSummary();
}

function generatePDF() {
    alert('📄 PDF Generated! (Demo report)');
}

function calculateScenario() {
    const asset = document.getElementById('scenarioAsset')?.value || 'BTC';
    const amount = parseFloat(document.getElementById('scenarioAmount')?.value);
    const resultDiv = document.getElementById('scenarioResult');

    if (!amount || amount <= 0) {
        resultDiv.innerHTML = '<span class="placeholder">Enter amount →</span>';
        return;
    }

    let price = 45000;
    if (typeof coingecko !== 'undefined') {
        const fetched = coingecko.getPrice(asset);
        if (fetched) price = fetched;
    }

    const totalValue = amount * price;
    const estimatedGain = totalValue * 0.2;
    const tax = typeof taxEngine !== 'undefined' ? taxEngine.calculateTax(estimatedGain, currentCountry) : 0;

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
}

function updateTaxSummary() {
    if (typeof taxEngine === 'undefined') return;
    
    const gain = taxEngine.calculateTotalGain();
    const tax = taxEngine.calculateTax(gain, currentCountry);

    document.getElementById('totalGain').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxableAmount').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${((tax / gain) * 100).toFixed(1)}%`;

    updateTaxChart(gain, tax);
}

function updateTaxChart(gain, tax) {
    const canvas = document.getElementById('taxChart');
    if (!canvas) return;

    if (window.taxChartInstance) window.taxChartInstance.destroy();

    window.taxChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Tax Due', 'Net Gain'],
            datasets: [{
                data: [tax, gain - tax],
                backgroundColor: ['#ff00e6', '#00f7ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
        }
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showPaymentModal() { 
    document.getElementById('activationModal')?.classList.add('show'); 
}

function closeModal() { 
    document.getElementById('activationModal')?.classList.remove('show'); 
}

function showLogoutModal() { 
    document.getElementById('logoutModal')?.classList.add('show'); 
}

function closeLogoutModal() { 
    document.getElementById('logoutModal')?.classList.remove('show'); 
}

function copyWallet() {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet)
        .then(() => alert('✅ Wallet address copied!'))
        .catch(() => alert('❌ Please copy manually'));
}

function checkPayment() {
    const statusElement = document.getElementById('modalPaymentStatus');
    if (!statusElement) return;
    
    statusElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    
    setTimeout(() => {
        statusElement.innerHTML = '<i class="fas fa-check-circle" style="color:#00ff9d;"></i> Payment confirmed!';
        
        setTimeout(() => {
            isPremium = true;
            localStorage.setItem('cryptotax_premium', 'true');
            closeModal();
            
            const pricingBanner = document.getElementById('pricingBanner');
            if (pricingBanner) pricingBanner.style.display = 'none';
            
            const badge = document.getElementById('userBadge');
            if (badge) {
                badge.className = 'user-badge premium';
                badge.innerHTML = '<i class="fas fa-star"></i> PREMIUM';
            }
            
            // Reload transactions for premium view
            loadUserTransactions();
            updateStats();
            
            alert('🎉 PREMIUM ACTIVATED!');
        }, 1500);
    }, 3000);
}

function logout() {
    localStorage.removeItem('cryptotax_user');
    closeLogoutModal();
    showLogin();
}

// Expose functions globally
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
window.logout = logout;
window.deleteTransaction = deleteTransaction;
window.importCSV = importCSV;
window.generatePDF = generatePDF;
window.calculateScenario = calculateScenario;
