// scripts/app.js

// ============================================
// CONFIGURAZIONE
// ============================================
const ADMIN_EMAIL = 'macissimon@gmail.com';
const ADMIN_CODE = 'ADMIN-2024';
const VALID_CODES = ['CRYPTO-2024', 'BETA-101', 'WHALE-777']; // Codici beta validi

// Stato globale
let currentUser = null;
let isPremium = false;
let inviteCode = '';
let currentCountry = 'IT';

// ============================================
// INIZIALIZZAZIONE - CORRETTA E ROBUSTA
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Avvio CryptoTax Private Beta...');

    // 1. Prendi i riferimenti agli elementi principali
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');

    // 2. FORZA la visualizzazione iniziale: login visibile, dashboard nascosta
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
    console.log('-> Stato iniziale: Login visibile, Dashboard nascosta.');

    // 3. Controlla se esiste una sessione salvata in localStorage
    const savedUser = localStorage.getItem('cryptotax_user');
    const savedCode = localStorage.getItem('cryptotax_code');
    console.log('Sessioni trovate?', { user: savedUser, code: savedCode });

    // 4. Se esiste una sessione, VALIDIAMOLA prima di mostrare la dashboard
    if (savedUser && savedCode) {
        const isValidCode = savedCode === ADMIN_CODE || VALID_CODES.includes(savedCode);
        if (isValidCode) {
            console.log('-> Sessione valida trovata, mostro la dashboard.');
            currentUser = savedUser;
            inviteCode = savedCode;
            isPremium = (savedUser === ADMIN_EMAIL) || (localStorage.getItem('cryptotax_premium') === 'true');
            showDashboard(); // Questa funzione si occuperà di nascondere il login
        } else {
            console.log('-> Sessione non valida, la rimuovo.');
            localStorage.removeItem('cryptotax_user');
            localStorage.removeItem('cryptotax_code');
            // Il login è già visibile, non serve fare altro
        }
    } else {
        console.log('-> Nessuna sessione, login già visibile.');
    }

    // 5. Setup degli event listener per il login
    setupLoginListeners();

    // 6. Avvia il polling di CoinGecko (partirà in background)
    if (typeof coingecko !== 'undefined') {
        coingecko.startPolling();
    } else {
        console.error('CoinGecko non caricato!');
    }
});

// ============================================
// FUNZIONI DI LOGIN (SPOSTATE QUI PER CHIAREZZA)
// ============================================
function setupLoginListeners() {
    const loginBtn = document.getElementById('loginBtn');
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');

    if (loginBtn) loginBtn.addEventListener('click', handleLogin);

    if (inviteInput) {
        inviteInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
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
    console.log('Tentativo di login...');
    const inviteInput = document.getElementById('inviteCode');
    const emailInput = document.getElementById('loginEmail');
    const adminNote = document.getElementById('adminNote');

    const code = inviteInput?.value.trim().toUpperCase() || '';
    const email = emailInput?.value.trim().toLowerCase() || '';

    if (!code) return showStatus('❌ Invite code required', 'error');
    if (!email || !email.includes('@')) return showStatus('❌ Valid email required', 'error');

    // Admin bypass
    if (code === ADMIN_CODE && email === ADMIN_EMAIL) {
        console.log('Accesso admin');
        currentUser = email; inviteCode = code; isPremium = true;
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        localStorage.setItem('cryptotax_premium', 'true');
        if (adminNote) adminNote.classList.remove('hidden');
        showStatus('👑 Admin access granted', 'success');
        return setTimeout(showDashboard, 1000);
    }

    // Codice beta valido
    if (VALID_CODES.includes(code)) {
        console.log('Accesso beta');
        currentUser = email; inviteCode = code; isPremium = false;
        localStorage.setItem('cryptotax_user', email);
        localStorage.setItem('cryptotax_code', code);
        showStatus('✅ Access granted! Welcome to the Beta', 'success');
        return setTimeout(showDashboard, 1000);
    }

    // Codice non valido
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
    console.log('Mostro login');
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    if (loginContainer) loginContainer.style.display = 'flex';
    if (dashboardWrapper) dashboardWrapper.style.display = 'none';
    if (headerTop) headerTop.style.display = 'none';
}

function showDashboard() {
    console.log('Mostro dashboard');
    const loginContainer = document.getElementById('loginContainer');
    const dashboardWrapper = document.getElementById('dashboardWrapper');
    const headerTop = document.getElementById('headerTop');
    if (loginContainer) loginContainer.style.display = 'none';
    if (dashboardWrapper) dashboardWrapper.style.display = 'block';
    if (headerTop) headerTop.style.display = 'flex';

    // Aggiorna UI con i dati utente
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

    // Nascondi banner prezzi per admin/premium
    const pricingBanner = document.getElementById('pricingBanner');
    if (pricingBanner) pricingBanner.style.display = (currentUser === ADMIN_EMAIL || isPremium) ? 'none' : 'block';

    // Inizializza il resto della dashboard
    initializeDashboard();
}

// ============================================
// FUNZIONI DASHBOARD (semplificate per ora)
// ============================================
function initializeDashboard() {
    console.log('Inizializzo dashboard...');
    // Qui puoi ricollegare tutti gli altri listener (country, bottoni, etc.)
    // Per ora, ci assicuriamo che i prezzi vengano mostrati
    if (typeof coingecko !== 'undefined' && coingecko.cache.prices) {
         coingecko.updateUI(coingecko.cache.prices);
    }
     // TODO: Aggiungere qui tutti gli altri listener (come nella versione precedente)
}

// ============================================
// FUNZIONI MODAL (da tenere)
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
    closeLogoutModal();
    showLogin();
}

// Esponi funzioni al globale
window.showPaymentModal = showPaymentModal;
window.closeModal = closeModal;
window.showLogoutModal = showLogoutModal;
window.closeLogoutModal = closeLogoutModal;
window.copyWallet = copyWallet;
window.checkPayment = checkPayment;
window.logout = logout;
// ... (eventuali altre funzioni come deleteTransaction, etc.)
