// ==========================================
// IMPORT KONEKSI DATABASE
// ==========================================
import { db } from './supabase.js';

// ==========================================
// DEKLARASI ELEMEN HTML (Auth & UI Terkait)
// ==========================================
const btnLoginNav = document.getElementById('btnLogin');
const btnProfileNav = document.getElementById('btnProfile');
const heroSection = document.querySelector('.hero-section');
const authSection = document.getElementById('auth-section');
const memberStats = document.getElementById('memberStats');

const formLogin = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const linkToSignUp = document.getElementById('linkToSignUp');
const linkToLogin = document.getElementById('linkToLogin');

const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==========================================
// 1. CEK SESI LOGIN (Otomatis jalan saat web dibuka)
// ==========================================
export async function cekStatusLogin() {
    const { data: { session } } = await db.auth.getSession();

    if (session) {
        let userTersimpan = session.user.user_metadata.username;

        if (btnLoginNav) btnLoginNav.style.display = 'none';
        if (btnProfileNav) {
            btnProfileNav.style.display = 'flex';
            btnProfileNav.innerHTML = `<span class="icon-user">👤</span> ${userTersimpan}`;
        }
        if (memberStats) memberStats.style.display = 'flex';
    } else {
        if (btnLoginNav) btnLoginNav.style.display = 'flex';
        if (btnProfileNav) btnProfileNav.style.display = 'none';
        if (authSection) authSection.style.display = 'none';
        if (heroSection) heroSection.style.display = 'flex';
        if (memberStats) memberStats.style.display = 'none';
    }
}
cekStatusLogin(); // Panggil fungsinya langsung

// ==========================================
// 2. NAVIGASI FORM LOG IN & SIGN UP
// ==========================================
function resetPesanError() {
    if (loginError) loginError.style.display = 'none';
    if (signupError) signupError.style.display = 'none';
}

if (btnLoginNav) {
    btnLoginNav.addEventListener('click', (e) => {
        e.preventDefault();
        resetPesanError();
        heroSection.style.display = 'none';
        authSection.style.display = 'flex';
        formLogin.style.display = 'block';
        formSignup.style.display = 'none';
    });
}

if (linkToSignUp) linkToSignUp.addEventListener('click', () => { resetPesanError(); formLogin.style.display = 'none'; formSignup.style.display = 'block'; });
if (linkToLogin) linkToLogin.addEventListener('click', () => { resetPesanError(); formSignup.style.display = 'none'; formLogin.style.display = 'block'; });

// ==========================================
// 3. FITUR IKON MATA LIHAT PASSWORD
// ==========================================
const togglePasswordLogin = document.getElementById('toggleLoginPassword');
const inputPasswordLogin = document.getElementById('loginPassword');

if (togglePasswordLogin && inputPasswordLogin) {
    togglePasswordLogin.addEventListener('click', function () {
        const isPassword = inputPasswordLogin.type === 'password';
        inputPasswordLogin.type = isPassword ? 'text' : 'password';
        this.textContent = isPassword ? '🙈' : '👁️';
    });
}

// ==========================================
// 4. PROSES SIGN UP (Auth + Insert ke Tabel Players)
// ==========================================
const btnSubmitSignup = document.getElementById('btnSubmitSignup');
if (btnSubmitSignup) {
    btnSubmitSignup.addEventListener('click', async () => {
        let user = document.getElementById('signupUsername').value.trim();
        let email = document.getElementById('signupGmail').value.trim();
        let pass = document.getElementById('signupPassword').value.trim();

        if (user === '' || email === '' || pass === '') {
            signupError.style.display = 'block';
            signupError.innerText = '*Mohon isi semua kolom untuk mendaftar.';
            return;
        }

        btnSubmitSignup.innerText = 'Mendaftar...';

        const { data: authData, error: authError } = await db.auth.signUp({
            email: email,
            password: pass,
            options: { data: { username: user } }
        });

        if (authError) {
            btnSubmitSignup.innerText = 'Sign Up';
            signupError.style.display = 'block';
            signupError.innerText = '*' + authError.message;
            return;
        }

        const userId = authData.user.id;
        const { error: dbError } = await db
            .from('players')
            .insert([{ user_id: userId, username: user, highest_score: 0, total_score: 0, daily_streak: 0 }]);

        btnSubmitSignup.innerText = 'Sign Up';

        if (dbError) {
            signupError.style.display = 'block';
            signupError.innerText = '*Gagal membuat profil: ' + dbError.message;
        } else {
            resetPesanError();
            formSignup.style.display = 'none';
            formLogin.style.display = 'block';
            loginError.style.display = 'block';
            loginError.style.color = '#2ECC71';
            loginError.innerText = '✅ Akun berhasil dibuat! Silakan Log In.';
            document.getElementById('signupUsername').value = '';
            document.getElementById('signupGmail').value = '';
            document.getElementById('signupPassword').value = '';
        }
    });
}

// ==========================================
// 5. PROSES LOG IN
// ==========================================
const btnSubmitLogin = document.getElementById('btnSubmitLogin');
if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', async () => {
        let emailInput = document.getElementById('loginGmail').value.trim();
        let passInput = document.getElementById('loginPassword').value.trim();

        loginError.style.color = '#E74C3C';

        if (emailInput === '' || passInput === '') {
            loginError.style.display = 'block';
            loginError.innerText = '*Isi Gmail dan Password terlebih dahulu.';
            return;
        }

        btnSubmitLogin.innerText = 'Memeriksa...';

        const { data, error } = await db.auth.signInWithPassword({ email: emailInput, password: passInput });

        btnSubmitLogin.innerText = 'Log In';

        if (error) {
            loginError.style.display = 'block';
            loginError.innerText = '*' + error.message; 
        } else {
            resetPesanError();
            let userTersimpan = data.user.user_metadata.username;

            authSection.style.display = 'none';
            if (heroSection) heroSection.style.display = 'flex';

            if (btnLoginNav) btnLoginNav.style.display = 'none';
            if (btnProfileNav) {
                btnProfileNav.style.display = 'flex';
                btnProfileNav.innerHTML = `<span class="icon-user">👤</span> ${userTersimpan}`;
            }
            if (memberStats) memberStats.style.display = 'flex';
        }
    });
}

// ==========================================
// 6. FITUR LOG OUT
// ==========================================
if (btnProfileNav) {
    btnProfileNav.addEventListener('click', async (e) => {
        e.preventDefault();
        let yakinKeluar = confirm("Apakah kamu yakin ingin Log Out?");
        if (yakinKeluar) {
            await db.auth.signOut();
            window.location.reload();
        }
    });
}