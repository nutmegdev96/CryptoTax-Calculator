// scripts/app.js

// ============================================
// CONFIGURATION
// ============================================
const ADMIN_EMAIL = 'macissimon@gmail.com'; // 

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

    // Start CoinGecko polling (will run in background)
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    } else {
        console.error('CoinGecko not loaded!');
    }
});

// ============================================
// LOGIN FUNCTIONS - SIMPLE EMAIL ONLY
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

    // Load initial data
    updateTaxSummary();
    updateTaxChart(4321.09, 890.12);

    // Setup price updates
    if (typeof coingecko !== 'undefined') {
        coingecko.updateUI = function(prices) {
            const pricesList = document.getElementById('pricesList');
            if (!pricesList) return;

            const coinMap = { 'bitcoin': 'BTC', 'ethereum': 'ETH', 'binancecoin': 'BNB', 'solana': 'SOL' };
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

// Feature functions
function importCSV() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to import CSV.');
        showPaymentModal();
        return;
    }
    alert('📁 CSV Import - Premium feature (demo)');
}

function openModal() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to add transactions.');
        showPaymentModal();
        return;
    }
    alert('➕ Add Transaction - Premium feature (demo)');
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

    let price = 45000; // Default
    if (typeof coingecko !== 'undefined') {
        const fetched = coingecko.getPrice(asset);
        if (fetched) price = fetched;
    }

    const totalValue = amount * price;
    const estimatedGain = totalValue * 0.2; // Assume 20% gain
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
    const gain = 4321.09;
    const tax = typeof taxEngine !== 'undefined' ? taxEngine.calculateTax(gain, currentCountry) : 890.12;

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
            
            alert('🎉 PREMIUM ACTIVATED!');
        }, 1500);
    }, 3000);
}

function logout() {
    localStorage.removeItem('cryptotax_user');
    // Keep premium status if they paid
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
window.importCSV = importCSV;
window.generatePDF = generatePDF;
window.calculateScenario = calculateScenario;
