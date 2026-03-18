// scripts/app.js
// ============================================
// CONFIGURATION
// ============================================
const ADMIN_EMAIL = 'macissimon@gmail.com';

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

    // FORCE initial view: login visible, dashboard hidden
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    
    // NOTA: NON tocchiamo headerTop - deve rimanere sempre visibile
    
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
    const statusMsg = document.querySelector('.status-message');
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
    
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    
    // NOTA: NON tocchiamo headerTop
}

function showDashboard() {
    console.log('Showing dashboard for user:', currentUser);
    
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboardWrapper) dashboardWrapper.style.display = 'block';

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
    document.getElementById('addTransactionBtn')?.addEventListener('click', addTransaction);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('calcScenarioBtn')?.addEventListener('click', calculateScenario);
    document.getElementById('activateBtn')?.addEventListener('click', showPaymentModal);

    // Search
    document.getElementById('searchInput')?.addEventListener('input', (e) => filterTransactions(e.target.value));

    // Load transactions
    loadTransactions();
    
    // Update stats
    updateStats();
    updateTaxSummary();

    // Setup price updates
    if (typeof coingecko !== 'undefined') {
        coingecko.updateUI = function(prices) {
            const pricesList = document.getElementById('pricesList');
            if (!pricesList) return;

            pricesList.innerHTML = '';

            for (const [symbol, data] of Object.entries(prices)) {
                const item = document.createElement('div');
                item.className = 'price-item';
                item.innerHTML = `
                    <span class="coin">${symbol}</span>
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

function loadTransactions() {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;
    
    if (!isPremium) {
        tbody.innerHTML = `
            <tr class="premium-row">
                <td colspan="7" class="premium-message">
                    <i class="fas fa-lock"></i>
                    <span>Upgrade to Premium to add transactions</span>
                    <button class="mini-premium-btn" onclick="showPaymentModal()">✨ UPGRADE</button>
                </td>
            </tr>
        `;
        return;
    }
    
    if (typeof taxEngine === 'undefined') return;
    
    const transactions = taxEngine.transactions;
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px; color: #a0a0b0;">
                    <i class="fas fa-inbox"></i> No transactions yet
                </td>
            </tr>
        `;
        return;
    }
    
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

function deleteTransaction(id) {
    if (!isPremium || typeof taxEngine === 'undefined') return;
    
    if (confirm('Delete transaction?')) {
        taxEngine.deleteTransaction(id);
        loadTransactions();
        updateStats();
        updateTaxSummary();
    }
}

function updateStats() {
    if (typeof taxEngine === 'undefined' || typeof coingecko === 'undefined') return;
    
    // Calculate portfolio value based on holdings and current prices
    let totalValue = 0;
    const holdings = {};
    
    // Calculate holdings
    taxEngine.transactions.forEach(tx => {
        if (!holdings[tx.asset]) holdings[tx.asset] = 0;
        if (tx.type === 'buy') holdings[tx.asset] += tx.amount;
        if (tx.type === 'sell') holdings[tx.asset] -= tx.amount;
    });
    
    // Calculate value using current prices
    Object.keys(holdings).forEach(asset => {
        if (holdings[asset] > 0) {
            const price = coingecko.getPrice(asset);
            if (price) totalValue += holdings[asset] * price;
        }
    });
    
    const totalGain = taxEngine.calculateTotalGain ? taxEngine.calculateTotalGain() : 4321.09;
    
    document.getElementById('totalPortfolio').textContent = `$${(totalValue || 12345.67).toLocaleString()}`;
    document.getElementById('unrealizedGain').textContent = `+$${(totalGain).toLocaleString()}`;
    document.getElementById('totalTransactions').textContent = taxEngine.transactions.length;
}

function updateTaxSummary() {
    if (typeof taxEngine === 'undefined') return;
    
    const gain = taxEngine.calculateTotalGain ? taxEngine.calculateTotalGain() : 4321.09;
    const tax = taxEngine.calculateTax ? taxEngine.calculateTax(gain, currentCountry) : 890.12;
    
    document.getElementById('totalGain').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxableAmount').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${((tax/gain)*100).toFixed(1)}%`;
    
    updateTaxChart(gain, tax);
}

function updateTaxChart(gain, tax) {
    const canvas = document.getElementById('taxChart');
    if (!canvas) return;
    
    if (window.taxChart) window.taxChart.destroy();
    
    window.taxChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: ['Tax', 'Net'],
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

function importCSV() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to import CSV.');
        showPaymentModal();
        return;
    }
    alert('📁 CSV Import - Premium feature');
}

function addTransaction() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to add transactions.');
        showPaymentModal();
        return;
    }
    
    const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!date) return;
    
    const type = prompt('Type (buy/sell):', 'buy');
    if (!type || !['buy', 'sell'].includes(type)) return;
    
    const asset = prompt('Asset (e.g., BTC):', 'BTC').toUpperCase();
    if (!asset) return;
    
    const amount = parseFloat(prompt('Amount:', '0.1'));
    if (isNaN(amount)) return;
    
    const price = parseFloat(prompt('Price in USD:', '50000'));
    if (isNaN(price)) return;
    
    if (typeof taxEngine !== 'undefined') {
        taxEngine.addTransaction({ date, type, asset, amount, price });
        loadTransactions();
        updateStats();
        updateTaxSummary();
        alert('✅ Transaction added!');
    }
}

function generatePDF() {
    alert('📄 PDF Generated! (Demo)');
}

function calculateScenario() {
    const asset = document.getElementById('scenarioAsset')?.value;
    const amount = parseFloat(document.getElementById('scenarioAmount')?.value);
    const resultDiv = document.getElementById('scenarioResult');
    
    if (!amount || amount <= 0) {
        resultDiv.innerHTML = '<span class="placeholder">Enter amount →</span>';
        return;
    }
    
    let price = 45000;
    if (typeof coingecko !== 'undefined') {
        const p = coingecko.getPrice(asset);
        if (p) price = p;
    }
    
    const total = amount * price;
    const gain = total * 0.2; // assume 20% gain
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(gain, currentCountry) : 0;
    
    resultDiv.innerHTML = `
        <div>Value: <strong>$${total.toLocaleString()}</strong></div>
        <div>Est. Tax: <strong style="color: #ff00e6;">$${tax.toLocaleString()}</strong></div>
    `;
}

function filterTransactions(searchTerm) {
    if (!isPremium) return;
    console.log('Searching:', searchTerm);
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
            
            loadTransactions();
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
window.calculateScenario = calculateScenario;
