// ==========================================
// IMPORT KONEKSI DATABASE
// ==========================================
import { db } from './supabase.js';

// ==========================================
// DEKLARASI ELEMEN HTML
// ==========================================
const btnLoginNav = document.getElementById('btnLogin');
const btnProfileNav = document.getElementById('btnProfile');
const heroSection = document.querySelector('.hero-section');
const authSection = document.getElementById('auth-section');

const formLogin = document.getElementById('form-login');
const formSignup = document.getElementById('form-signup');
const linkToSignUp = document.getElementById('linkToSignUp');
const linkToLogin = document.getElementById('linkToLogin');

const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');

// ==========================================
// 1. CEK SESI LOGIN, ROLE ADMIN, & BONUS STREAK
// ==========================================
export async function cekStatusLogin() {
    try {
        const { data: { session }, error } = await db.auth.getSession();
        const dashboardMenu = document.getElementById('dashboard-menu-buttons');
        const tombolAdmin = document.getElementById('tombolMenuAdmin');

        if (session) {
            let userTersimpan = session.user.user_metadata?.username || 'Player';
            const userId = session.user.id;

            if (btnLoginNav) btnLoginNav.style.display = 'none';
            if (btnProfileNav) {
                btnProfileNav.style.display = 'flex';
                btnProfileNav.innerHTML = `<span class="icon-user">👤</span> ${userTersimpan}`;
            }
            if (dashboardMenu) dashboardMenu.style.display = 'flex';

            const { data, error: playerError } = await db.from('players').select('*').eq('user_id', userId).single();
            
            if (!playerError && data) {
                // --- LOGIKA BONUS LOGIN HARIAN & STREAK ---
                const sekarang = new Date();
                const tanggalHariIni = sekarang.toISOString().split('T')[0]; 
                const tanggalTerakhir = data.last_play_date ? data.last_play_date.split('T')[0] : null;

                let streakSekarang = data.daily_streak || 0;
                let totalSkorSekarang = data.total_score || 0;
                let totalHariSekarang = data.total_days_played || data.total_days || 0;

                // Jika tanggal login terakhir BUKAN hari ini (berarti hari baru)
                if (tanggalTerakhir !== tanggalHariIni) {
                    
                    if (tanggalTerakhir) {
                        const waktuTerakhir = new Date(tanggalTerakhir);
                        const waktuSekarang = new Date(tanggalHariIni);
                        const selisihHari = (waktuSekarang - waktuTerakhir) / (1000 * 60 * 60 * 24);

                        if (selisihHari === 1) {
                            streakSekarang += 1; // Lanjut streak jika besoknya langsung main
                        } else if (selisihHari > 1) {
                            streakSekarang = 1; // Putus, reset ke 1
                        }
                    } else {
                        streakSekarang = 1; // Pemain baru pertama kali login
                    }

                    // Tambahkan Bonus XP (Ubah angka 100 sesuai keinginanmu)
                    const bonusLogin = 100; 
                    totalSkorSekarang += bonusLogin;
                    totalHariSekarang += 1;

                    // Update data ke Supabase
                    await db.from('players').update({
                        daily_streak: streakSekarang,
                        total_score: totalSkorSekarang,
                        total_days_played: totalHariSekarang,
                        last_play_date: sekarang.toISOString()
                    }).eq('user_id', userId);
                }
                // ------------------------------------------

                if (data.role === 'admin' && tombolAdmin) {
                    tombolAdmin.style.display = 'inline-block';
                }

                // Tampilkan ke UI menggunakan data yang sudah diperbarui
                const homeStreak = document.getElementById('home-streak-value');
                const homeHighscore = document.getElementById('home-highscore-value');
                
                if (homeStreak) homeStreak.innerText = streakSekarang + ' Hari';
                if (homeHighscore) homeHighscore.innerText = (data.highest_score || 0) + ' Poin';
            }
        } else {
            // JIKA BELUM LOGIN
            if (btnLoginNav) btnLoginNav.style.display = 'flex';
            if (btnProfileNav) btnProfileNav.style.display = 'none';
            if (authSection) authSection.style.display = 'none';
            if (heroSection) heroSection.style.display = 'flex';
            if (dashboardMenu) dashboardMenu.style.display = 'none';
            if (tombolAdmin) tombolAdmin.style.display = 'none';
        }
    } catch (err) {
        console.error("Gagal mengecek sesi:", err);
    }
}
cekStatusLogin();

// ==========================================
// 2. NAVIGASI FORM LOG IN & SIGN UP
// ==========================================
function resetPesanError() {
    if (loginError) loginError.style.display = 'none';
    if (signupError) signupError.style.display = 'none';
}

// ⚠️ INI ADALAH FUNGSI YANG MEMBUAT TOMBOL LOGIN BISA DIPENCET
if (btnLoginNav) {
    btnLoginNav.addEventListener('click', (e) => {
        e.preventDefault();
        resetPesanError();
        if (heroSection) heroSection.style.display = 'none';
        if (authSection) authSection.style.display = 'flex';
        if (formLogin) formLogin.style.display = 'block';
        if (formSignup) formSignup.style.display = 'none';
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
        
        // Ganti textContent menjadi innerHTML di sini 👇
        this.innerHTML = isPassword ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off preview-icon"><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye preview-icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>';
    });
}

// ==========================================
// 4. PROSES SIGN UP (Daftar Akun)
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

        const { error } = await db.auth.signInWithPassword({ email: emailInput, password: passInput });

        btnSubmitLogin.innerText = 'Log In';

        if (error) {
            loginError.style.display = 'block';
            loginError.innerText = '*' + error.message; 
        } else {
            resetPesanError();
            localStorage.setItem('vocaTuneUserLoggedIn', 'yes');
            window.location.reload(); 
        }
    });
}

// ==========================================
// 6. NAVIGASI KE HALAMAN PROFIL
// ==========================================
if (btnProfileNav) {
    btnProfileNav.addEventListener('click', (e) => {
        e.preventDefault();
        // Arahkan ke halaman pengaturan/profil
        window.location.href = 'profile.html'; 
    });
}