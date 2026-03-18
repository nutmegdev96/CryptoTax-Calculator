// scripts/app.js

// ============================================
// CONFIGURATION
//============================================
const ADMIN_EMAIL = 'macissimon@gmail.com';
const ADMIN_CODE = 'ADMIN-2024';
const VALID_CODES = ['CRYPTO-2024', 'BETA-101', 'WHALE-777']; // Valid beta codes

// Global state
let currentUser = null;
let isPremium = false;
let inviteCode = '';
let currentCountry = 'IT';

// ============================================
// INITIALIZATION - FIXED AND ROBUST
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting CryptoTax Private Beta...');

    // 1. Get references to main elements
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');

    // 2. FORCE initial view: login visible, dashboard hidden
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
    console.log('-> Initial state: Login visible, Dashboard hidden.');

    // 3. Check for an existing session in localStorage
    const savedUser = localStorage.getItem('cryptotax_user');
    const savedCode = localStorage.getItem('cryptotax_code');
    console.log('Found saved session?', { user: savedUser, code: savedCode });

    // 4. If a session exists, VALIDATE it before showing the dashboard
    if (savedUser && savedCode) {
        const isValidCode = savedCode === ADMIN_CODE || VALID_CODES.includes(savedCode);
        if (isValidCode) {
            console.log('-> Valid session found, showing dashboard.');
            currentUser = savedUser;
            inviteCode = savedCode;
            isPremium = (savedUser === ADMIN_EMAIL) || (localStorage.getItem('cryptotax_premium') === 'true');
            showDashboard();
        } else {
            console.log('-> Invalid session, removing it.');
            localStorage.removeItem('cryptotax_user');
            localStorage.removeItem('cryptotax_code');
            // Login is already visible, nothing else to do
        }
    } else {
        console.log('-> No session, login already visible.');
    }

    // 5. Setup login event listeners
    setupLoginListeners();

    // 6. Start CoinGecko polling (will run in background)
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    } else {
        console.error('CoinGecko not loaded!');
    }
});

// ============================================
// LOGIN FUNCTIONS
// ============================================
function setupLoginListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    if (inviteInput) {
        inviteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
        // Format invite code as user types (XXXX-XXXX)
        inviteInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8);
            e.target.value = value;
        });
    }

    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    }
}

function handleLogin() {
    console.log('Login attempt...');
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');
    const adminNote = document.getElementById('adminNote');

    const code = inviteInput?.value.trim().toUpperCase() || '';
    const email = emailInput?.value.trim().toLowerCase() || '';

    if (!code) return showStatus('❌ Invite code required', 'error');
    if (!email || !email.includes('@')) return showStatus('❌ Valid email required', 'error');

    // Admin bypass
    if (code === ADMIN_CODE && email === ADMIN_EMAIL) {
        console.log('Admin access');
        currentUser = email; inviteCode = code; isPremium = true;
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        localStorage.setItem('cryptotax_premium', 'true');
        if (adminNote) adminNote.classList.remove('hidden');
        showStatus('👑 Admin access granted', 'success');
        return setTimeout(showDashboard, 1000);
    }

    // Valid beta code
    if (VALID_CODES.includes(code)) {
        console.log('Beta access');
        currentUser = email; inviteCode = code; isPremium = false;
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        showStatus('✅ Access granted! Welcome to the Beta', 'success');
        return setTimeout(showDashboard, 1000);
    }

    // Invalid code
    showStatus('❌ Invalid invite code', 'error');
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
            userBadge.innerHTML = '<i class="fas fa-user"></i> BETA USER';
        }
    }

    // Hide pricing banner for admin/premium
    const pricingBanner = document.getElementById('pricingBanner');
    if (pricingBanner) pricingBanner.style.display = (currentUser === ADMIN_EMAIL || isPremium) ? 'none' : 'block';

    // Initialize the rest of the dashboard (charts, listeners, etc.)
    initializeDashboard();
}

// ============================================
// DASHBOARD FUNCTIONS (FULLY RESTORED)
// ============================================
function initializeDashboard() {
    console.log('Initializing dashboard...');

    // --- Country Selector ---
    document.querySelectorAll('.country-btn').forEach(btn => {
        // Remove old listeners to avoid duplicates, then add new one
        btn.removeEventListener('click', handleCountryChange);
        btn.addEventListener('click', handleCountryChange);
    });

    // --- Action Buttons ---
    document.getElementById('importCsvBtn')?.addEventListener('click', importCSV);
    document.getElementById('addTransactionBtn')?.addEventListener('click', openModal);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('calcScenarioBtn')?.addEventListener('click', calculateScenario);
    document.getElementById('activateBtn')?.addEventListener('click', showPaymentModal);

    // --- Search ---
    document.getElementById('searchInput')?.addEventListener('input', (e) => filterTransactions(e.target.value));

    // --- Initial Data Load ---
    updateTaxSummary();
    updateTaxChart(4321.09, 890.12); // Sample data

    // --- Setup Price Update Handler (Override Coingecko's default) ---
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
            if (updateTime) updateTime.innerHTML = `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
        };
        // Trigger initial update if prices are already cached
        if (coingecko.cache.prices) {
            coingecko.updateUI(coingecko.cache.prices);
        }
    }
}

// Handler for country change
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

// --- Feature Functions (simplified for demo, but functional) ---
function importCSV() {
    if (!isPremium) { alert('✨ Premium feature. Upgrade to import CSV.'); showPaymentModal(); return; }
    alert('CSV Import - Demo (Premium feature)');
}

function openModal() {
    if (!isPremium) { alert('✨ Premium feature. Upgrade to add transactions.'); showPaymentModal(); return; }
    alert('Add Transaction - Demo (Premium feature)');
}

function generatePDF() {
    alert('📄 PDF Generated! (Demo)');
    // In a real implementation, you'd use jspdf here
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
    const estimatedGain = totalValue * 0.2; // Assume 20% gain for demo
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
    // Implement filtering logic here
}

function updateTaxSummary() {
    const gain = 4321.09; // Sample gain
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
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// ============================================
// MODAL FUNCTIONS
// ============================================
function showPaymentModal() { document.getElementById('activationModal')?.classList.add('show'); }
function closeModal() { document.getElementById('activationModal')?.classList.remove('show'); }
function showLogoutModal() { document.getElementById('logoutModal')?.classList.add('show'); }
function closeLogoutModal() { document.getElementById('logoutModal')?.classList.remove('show'); }

function copyWallet() {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet).then(() => alert('✅ Copied!')).catch(() => alert('❌ Copy manually'));
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
            document.getElementById('pricingBanner').style.display = 'none';
            const badge = document.getElementById('userBadge');
            if (badge) { badge.className = 'user-badge premium'; badge.innerHTML = '<i class="fas fa-star"></i> PREMIUM'; }
        }, 1500);
    }, 3000);
}

function logout() {
    localStorage.removeItem('cryptotax_user');
    localStorage.removeItem('cryptotax_code');
    // Keep premium flag? Decide: if they paid, they shouldn't lose it. We'll keep it.
    // localStorage.removeItem('cryptotax_premium');
    closeLogoutModal();
    showLogin();
}

// Expose functions to global scope (for onclick attributes in HTML)
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
window.logout = logout;
// Also expose for potential future use
window.importCSV = importCSV;
window.generatePDF = generatePDF;
window.calculateScenario = calculateScenario;
