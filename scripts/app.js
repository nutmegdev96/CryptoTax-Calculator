// scripts/app.js
// ============================================
// Main Application
// ============================================

const ADMIN_EMAIL = 'macissimon@gmail.com';
let currentUser = null;
let isPremium = false;
let currentCountry = 'IT';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax starting...');
    
    // Show login by default
    showLogin();
    
    // Check for saved session
    const savedUser = localStorage.getItem('cryptotax_user');
    if (savedUser) {
        currentUser = savedUser;
        isPremium = (savedUser === ADMIN_EMAIL) || (localStorage.getItem('cryptotax_premium') === 'true');
        showDashboard();
    }
    
    // Setup login
    setupLogin();
    
    // Start price updates
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    }
});

// ============================================
// LOGIN FUNCTIONS
// ============================================
function setupLogin() {
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
    const email = document.getElementById('loginEmail')?.value.trim().toLowerCase();
    
    if (!email || !email.includes('@')) {
        showStatus('❌ Valid email required', 'error');
        return;
    }
    
    currentUser = email;
    isPremium = (email === ADMIN_EMAIL);
    
    localStorage.setItem('cryptotax_user', email);
    if (isPremium) localStorage.setItem('cryptotax_premium', 'true');
    
    showStatus('✅ Access granted!', 'success');
    setTimeout(showDashboard, 1000);
}

function showStatus(message, type) {
    const statusMsg = document.querySelector('.status-message');
    if (!statusMsg) return;
    
    const colors = { error: '#ff3b3b', success: '#00ff9d' };
    const icons = { error: 'fa-exclamation-circle', success: 'fa-check-circle' };
    
    statusMsg.style.borderColor = colors[type] || '#00f7ff';
    statusMsg.innerHTML = `
        <i class="fas ${icons[type] || 'fa-lock'}" style="color: ${colors[type] || '#00f7ff'};"></i>
        <span style="color: ${colors[type] || '#a0a0b0'};">${message}</span>
    `;
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('dashboardWrapper').style.display = 'none';
    document.getElementById('headerTop').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardWrapper').style.display = 'block';
    document.getElementById('headerTop').style.display = 'flex';
    
    // Update user info
    document.getElementById('userEmailDisplay').textContent = currentUser;
    
    const badge = document.getElementById('userBadge');
    if (badge) {
        if (currentUser === ADMIN_EMAIL) {
            badge.className = 'user-badge admin';
            badge.innerHTML = '<i class="fas fa-crown"></i> ADMIN';
        } else if (isPremium) {
            badge.className = 'user-badge premium';
            badge.innerHTML = '<i class="fas fa-star"></i> PREMIUM';
        } else {
            badge.className = 'user-badge free';
            badge.innerHTML = '<i class="fas fa-user"></i> FREE';
        }
    }
    
    // Hide pricing for admin/premium
    const pricing = document.getElementById('pricingBanner');
    if (pricing) {
        pricing.style.display = (currentUser === ADMIN_EMAIL || isPremium) ? 'none' : 'block';
    }
    
    // Initialize dashboard
    initDashboard();
}

// ============================================
// DASHBOARD FUNCTIONS
// ============================================
function initDashboard() {
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCountry = btn.dataset.country;
            
            document.getElementById('currentCountryName').textContent = 
                btn.textContent.trim().split(' ')[0];
            
            updateTaxSummary();
            
            const notes = document.getElementById('taxNotes');
            if (notes && typeof taxEngine !== 'undefined') {
                notes.innerHTML = `<i class="fas fa-info-circle"></i> ${taxEngine.getTaxNotes(currentCountry)}`;
            }
        });
    });
    
    // Buttons
    document.getElementById('importCsvBtn')?.addEventListener('click', importCSV);
    document.getElementById('addTransactionBtn')?.addEventListener('click', addTransaction);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('calcScenarioBtn')?.addEventListener('click', calculateScenario);
    document.getElementById('activateBtn')?.addEventListener('click', showPaymentModal);
    
    // Setup searchable scenario dropdown
    setupScenarioSearch();
    
    // Load transactions
    loadTransactions();
    
    // Update stats
    updateStats();
    updateTaxSummary();
}

// ============================================
// SCENARIO WITH SEARCH
// ============================================
function setupScenarioSearch() {
    const select = document.getElementById('scenarioAsset');
    if (!select) return;
    
    // Clear and add default options
    select.innerHTML = '';
    
    // Add popular coins
    const popularCoins = ['BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT', 'LTC', 'XLM'];
    popularCoins.forEach(symbol => {
        const option = document.createElement('option');
        option.value = symbol;
        option.textContent = symbol;
        select.appendChild(option);
    });
    
    // Make it searchable with datalist
    const datalist = document.createElement('datalist');
    datalist.id = 'coinSuggestions';
    
    // Add all coins from CoinGecko default list
    if (typeof coingecko !== 'undefined' && coingecko.defaultCoins) {
        coingecko.defaultCoins.forEach(coin => {
            const option = document.createElement('option');
            option.value = coin.symbol;
            option.textContent = `${coin.symbol} - ${coin.name}`;
            datalist.appendChild(option);
        });
    }
    
    document.body.appendChild(datalist);
    select.setAttribute('list', 'coinSuggestions');
    
    // Add search input option
    const searchOption = document.createElement('option');
    searchOption.value = 'SEARCH';
    searchOption.textContent = '🔍 Type to search more...';
    select.appendChild(searchOption);
    
    // Handle custom entries
    select.addEventListener('change', async (e) => {
        if (e.target.value === 'SEARCH') {
            const custom = prompt('Enter coin symbol (e.g., XRP, ADA, DOT):');
            if (custom) {
                const newOption = document.createElement('option');
                newOption.value = custom.toUpperCase();
                newOption.textContent = custom.toUpperCase();
                select.insertBefore(newOption, select.lastElementChild);
                select.value = custom.toUpperCase();
            }
        }
    });
}

// ============================================
// TRANSACTIONS
// ============================================
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

// ============================================
// STATS
// ============================================
function updateStats() {
    if (typeof taxEngine === 'undefined' || typeof coingecko === 'undefined') return;
    
    const portfolioValue = taxEngine.getPortfolioValue((symbol) => coingecko.getPrice(symbol));
    const totalGain = taxEngine.calculateTotalGain();
    
    document.getElementById('totalPortfolio').textContent = `$${portfolioValue.toLocaleString()}`;
    document.getElementById('unrealizedGain').textContent = `+$${totalGain.toLocaleString()}`;
    document.getElementById('totalTransactions').textContent = taxEngine.transactions.length;
}

function updateTaxSummary() {
    if (typeof taxEngine === 'undefined') return;
    
    const gain = taxEngine.calculateTotalGain();
    const tax = taxEngine.calculateTax(gain, currentCountry);
    
    document.getElementById('totalGain').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxableAmount').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${((tax/gain)*100).toFixed(1)}%`;
    
    // Update chart
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

// ============================================
// ACTIONS
// ============================================
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

// ============================================
// MODALS
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
    navigator.clipboard.writeText(wallet).then(() => alert('✅ Copied!'));
}

function checkPayment() {
    const status = document.getElementById('modalPaymentStatus');
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
    
    setTimeout(() => {
        status.innerHTML = '<i class="fas fa-check-circle" style="color:#00ff9d;"></i> Payment confirmed!';
        setTimeout(() => {
            isPremium = true;
            localStorage.setItem('cryptotax_premium', 'true');
            closeModal();
            document.getElementById('pricingBanner').style.display = 'none';
            document.getElementById('userBadge').className = 'user-badge premium';
            document.getElementById('userBadge').innerHTML = '<i class="fas fa-star"></i> PREMIUM';
            loadTransactions();
        }, 1500);
    }, 3000);
}

function logout() {
    localStorage.removeItem('cryptotax_user');
    closeLogoutModal();
    showLogin();
}

// Expose functions
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
window.logout = logout;
window.deleteTransaction = deleteTransaction;
window.calculateScenario = calculateScenario;
