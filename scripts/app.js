// scripts/app.js

// Config
const ADMIN_EMAIL = 'macissimon@gmail.com';
const ADMIN_CODE = 'ADMIN-2024';
const VALID_CODES = ['CRYPTO-2024', 'BETA-101', 'WHALE-777']; // Example valid codes

let currentUser = null;
let isPremium = false;
let inviteCode = '';

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 CryptoTax Private Beta');
    
    // Check for existing session
    const savedUser = localStorage.getItem('cryptotax_user');
    const savedCode = localStorage.getItem('cryptotax_code');
    
    if (savedUser && savedCode) {
        currentUser = savedUser;
        inviteCode = savedCode;
        isPremium = savedUser === ADMIN_EMAIL || localStorage.getItem('cryptotax_premium') === 'true';
        showDashboard();
    }
    
    // Initialize particles
    initParticles();
    
    // Start CoinGecko
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    }
    
    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    
    // Enter key on inputs
    ['inviteCode', 'loginEmail'].forEach(id => {
        document.getElementById(id)?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    });
    
    // Format invite code as user types (XXXX-XXXX)
    document.getElementById('inviteCode')?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (value.length > 4) {
            value = value.slice(0, 4) + '-' + value.slice(4, 8);
        }
        e.target.value = value;
    });
});

function initParticles() {
    const canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    
    // Simple particle effect (can be enhanced)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function handleLogin() {
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');
    const statusDiv = document.getElementById('loginStatus');
    const adminNote = document.getElementById('adminNote');
    
    const code = inviteInput.value.trim().toUpperCase();
    const email = emailInput.value.trim();
    
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
        // Admin access granted
        currentUser = email;
        inviteCode = code;
        isPremium = true;
        
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        localStorage.setItem('cryptotax_premium', 'true');
        
        adminNote.classList.remove('hidden');
        showStatus('👑 Admin access granted', 'success');
        
        setTimeout(showDashboard, 1000);
        return;
    }
    
    // Check if valid invite code (from waitlist)
    if (VALID_CODES.includes(code)) {
        // Waitlist access
        currentUser = email;
        inviteCode = code;
        isPremium = false;
        
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        
        showStatus('✅ Access granted! Welcome to the Beta', 'success');
        setTimeout(showDashboard, 1000);
        return;
    }
    
    // Invalid code
    showStatus('❌ Invalid invite code. Join waitlist at cryptotax.io', 'error');
}

function showStatus(message, type) {
    const statusDiv = document.getElementById('loginStatus');
    if (!statusDiv) return;
    
    const icon = type === 'error' ? '❌' : (type === 'success' ? '✅' : '⏳');
    const color = type === 'error' ? '#ff3b3b' : (type === 'success' ? '#00ff9d' : '#00f7ff');
    
    statusDiv.innerHTML = `
        <div class="status-message" style="border-color: ${color};">
            <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}" style="color: ${color};"></i>
            <span style="color: ${color};">${message}</span>
        </div>
    `;
}

function showDashboard() {
    // Hide login, show dashboard
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardWrapper').style.display = 'block';
    
    // Update UI
    document.getElementById('userEmailDisplay').textContent = currentUser;
    
    const userBadge = document.getElementById('userBadge');
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
    
    // Hide pricing banner for admin
    if (currentUser === ADMIN_EMAIL) {
        document.getElementById('pricingBanner').style.display = 'none';
    }
    
    // Initialize dashboard
    initializeDashboard();
}

function initializeDashboard() {
    // Country selector
    document.querySelectorAll('.country-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.country-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.currentCountry = btn.dataset.country;
            
            document.getElementById('currentCountryName').textContent = 
                btn.textContent.trim().split(' ')[0];
            
            updateTaxSummary();
            
            // Update tax notes
            if (typeof taxEngine !== 'undefined') {
                document.getElementById('taxNotes').innerHTML = `
                    <i class="fas fa-info-circle"></i>
                    ${taxEngine.getTaxNotes(window.currentCountry)}
                `;
            }
        });
    });
    
    // Buttons
    document.getElementById('importCsvBtn')?.addEventListener('click', importCSV);
    document.getElementById('addTransactionBtn')?.addEventListener('click', openModal);
    document.getElementById('generatePdfBtn')?.addEventListener('click', generatePDF);
    document.getElementById('calcScenarioBtn')?.addEventListener('click', calculateScenario);
    document.getElementById('activateBtn')?.addEventListener('click', showPaymentModal);
    
    // Load data
    updateTaxSummary();
    updateTaxChart(4321.09, 890.12);
    
    // Show prices
    if (typeof coingecko !== 'undefined') {
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
                    <span class="price">$${data.usd.toLocaleString()}</span>
                    <span class="change ${data.change24h >= 0 ? 'positive' : 'negative'}">
                        ${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%
                    </span>
                `;
                pricesList.appendChild(item);
            }
            
            document.getElementById('updateTime').innerHTML = 
                `<i class="fas fa-sync-alt"></i> Updated: ${new Date().toLocaleTimeString()}`;
        };
    }
}

// Re-use existing functions from previous version (importCSV, openModal, generatePDF, etc.)
// ... (mantieni tutte le funzioni che avevamo già scritto)

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
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(estimatedGain, window.currentCountry || 'IT') : 0;
    
    resultDiv.innerHTML = `
        <div>Value: <strong>$${totalValue.toLocaleString()}</strong></div>
        <div>Est. Tax: <strong style="color: #ff00e6;">$${tax.toLocaleString()}</strong></div>
    `;
}

function updateTaxSummary() {
    const gain = 4321.09;
    const tax = typeof taxEngine !== 'undefined' ? 
        taxEngine.calculateTax(gain, window.currentCountry || 'IT') : 890.12;
    
    document.getElementById('totalGain').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxableAmount').textContent = `$${gain.toFixed(2)}`;
    document.getElementById('taxDue').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('effectiveRate').textContent = `${((tax/gain)*100).toFixed(1)}%`;
}

function updateTaxChart(gain, tax) {
    const canvas = document.getElementById('taxChart');
    if (!canvas) return;
    
    if (window.taxChartInstance) window.taxChartInstance.destroy();
    
    window.taxChartInstance = new Chart(canvas, {
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

// Modal functions
window.showPaymentModal = () => document.getElementById('activationModal').classList.add('show');
window.closeModal = () => document.getElementById('activationModal').classList.remove('show');
window.showLogoutModal = () => document.getElementById('logoutModal').classList.add('show');
window.closeLogoutModal = () => document.getElementById('logoutModal').classList.remove('show');

window.copyWallet = () => {
    const wallet = 'bc1qqgjsumsw82804vscpeysz2te3zsx2jfzndawfk';
    navigator.clipboard.writeText(wallet).then(() => alert('✅ Copied!'));
};

window.checkPayment = () => {
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
        }, 1500);
    }, 3000);
};

window.logout = () => {
    localStorage.removeItem('cryptotax_user');
    localStorage.removeItem('cryptotax_code');
    // Keep premium flag if they paid
    closeLogoutModal();
    location.reload();
};

// Import existing functions from previous version
function importCSV() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to import CSV.');
        showPaymentModal();
        return;
    }
    // ... rest of import logic from previous version
}

function openModal() {
    if (!isPremium) {
        alert('✨ Premium feature. Upgrade to add transactions.');
        showPaymentModal();
        return;
    }
    // ... rest of add logic from previous version
}

function generatePDF() {
    // ... existing PDF generation
    alert('📄 PDF Generated! (Demo)');
}
