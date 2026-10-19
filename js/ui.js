import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 1. SETUP AUDIO & VARIABEL UTAMA
    // ==========================================
    const bgmAudio = document.getElementById('bgmAudio');
    const btnBgm = document.getElementById('btnBgm');       // Tombol teks di bawah
    const navPause = document.getElementById('navPause');   // Tombol ikon SVG di Navbar atas

    // Siapkan dua bentuk ikon (Pause dan Play) untuk Navbar
    const ikonPause = `
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
            <rect x="0" y="0" width="4" height="16" rx="1"></rect>
            <rect x="10" y="0" width="4" height="16" rx="1"></rect>
        </svg>
    `;
    const ikonPlay = `
        <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
            <polygon points="2,0 14,8 2,16"></polygon>
        </svg>
    `;

    // ==========================================
    // 2. FUNGSI UPDATE UI (Otomatis Mendeteksi Status Audio)
    // ==========================================
    function sinkronkanUI() {
        if (!bgmAudio) return;

        // bgmAudio.paused adalah variabel bawaan browser untuk mengecek status audio asli
        if (bgmAudio.paused) {
            // Jika statusnya mati/berhenti, ubah semua UI ke mode "Play/Off"
            if (btnBgm) btnBgm.innerText = '🔇 Music Off';
            if (navPause) navPause.innerHTML = ikonPlay;
        } else {
            // Jika statusnya menyala, ubah semua UI ke mode "Pause/On"
            if (btnBgm) btnBgm.innerText = '🔊 Music On';
            if (navPause) navPause.innerHTML = ikonPause;
        }
    }

    // ==========================================
    // 3. PASANG EVENT LISTENER KE AUDIO & TOMBOL
    // ==========================================
    if (bgmAudio) {
        // 👇 INI KUNCINYA: UI akan merespon tombol hardware dari keyboard/laptop!
        bgmAudio.addEventListener('play', sinkronkanUI);
        bgmAudio.addEventListener('pause', sinkronkanUI);

        // Panggil sekali saat halaman dimuat agar UI sesuai dengan status awal audio
        sinkronkanUI();
    }

    // Fungsi klik tombol manual di layar
    function toggleMusikManual() {
        if (!bgmAudio) return;
        if (bgmAudio.paused) {
            bgmAudio.play();
        } else {
            bgmAudio.pause();
        }
    }

    if (btnBgm) {
        btnBgm.addEventListener('click', toggleMusikManual);
    }

    if (navPause) {
        navPause.addEventListener('click', (e) => {
            e.preventDefault();
            toggleMusikManual();
        });
    }

    // ==========================================
    // 4. PEMILIHAN MODE GAME
    // ==========================================
    const modeButtons = document.querySelectorAll('.btn-mode');
    const modeMessage = document.getElementById('mode-message');
    let selectedMode = "";

    modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            selectedMode = event.target.innerText;
            // Simpan mode yang dipilih ke memori browser
            localStorage.setItem('vocaTuneMode', selectedMode);

            if (modeMessage) {
                modeMessage.innerText = `Kamu memilih mode: ${selectedMode}! Klik Start Game untuk mulai.`;
                modeMessage.style.color = "#2b3a4a";
            }
        });
    });


    // ==========================================
    // 5. LOGIKA CHECKBOX GENRE & TOMBOL START
    // ==========================================
    const chkSemua = document.querySelector('.chk-genre[value="Semua"]');
    const chkLainnya = document.querySelectorAll('.chk-genre:not([value="Semua"])');

    // Jika "Semua" dicentang, otomatis hilangkan centang genre lain (dan sebaliknya)
    if (chkSemua) {
        chkSemua.addEventListener('change', function () {
            if (this.checked) {
                chkLainnya.forEach(chk => chk.checked = false);
            }
        });

        chkLainnya.forEach(chk => {
            chk.addEventListener('change', function () {
                if (this.checked && chkSemua) {
                    chkSemua.checked = false;
                }
            });
        });
    }

    const btnStart = document.getElementById('btnStart');

    if (btnStart) {
        btnStart.addEventListener('click', function () {
            // 1. Cek apakah mode kesulitan sudah dipilih
            if (selectedMode === "") {
                modeMessage.innerText = "Silakan pilih tingkat kesulitan terlebih dahulu!";
                modeMessage.style.color = "red";
                return;
            }

            // 2. Ambil semua genre yang dicentang
            const selectedGenres = [];
            document.querySelectorAll('.chk-genre:checked').forEach(chk => {
                selectedGenres.push(chk.value);
            });

            // Jika tidak ada yang dicentang, otomatis jadikan "Semua"
            if (selectedGenres.length === 0) {
                selectedGenres.push('Semua');
            }

            // 3. Simpan daftar genre sebagai array JSON ke localStorage
            localStorage.setItem('vocaTuneGenre', JSON.stringify(selectedGenres));

            // 4. Pindah ke halaman permainan
            window.location.href = 'game.html';
        });
    }

    // ==========================================
    // 6. CEK AUTO-START
    // ==========================================
    let autoStart = localStorage.getItem('vocaTuneAutoStart');
    let modeTerakhir = localStorage.getItem('vocaTuneModeTerakhir');

    if (autoStart === 'yes' && modeTerakhir) {
        localStorage.removeItem('vocaTuneAutoStart');
        window.location.href = 'game.html';
    }

    // ==========================================
    // 7. NAVIGASI TOMBOL MENU BAWAH (Bisa Diklik)
    // ==========================================
    const btnSkorTertinggi = document.getElementById('btnSkorTertinggi');
    if (btnSkorTertinggi) {
        btnSkorTertinggi.addEventListener('click', () => {
            window.location.href = 'performa.html';
        });
        btnSkorTertinggi.style.cursor = 'pointer'; // Efek kursor tangan saat disorot
    }

    const btnRuntunanHarian = document.getElementById('btnRuntunanHarian');
    if (btnRuntunanHarian) {
        btnRuntunanHarian.addEventListener('click', () => {
            window.location.href = 'runtunan.html';
        });
        btnRuntunanHarian.style.cursor = 'pointer'; // Efek kursor tangan saat disorot
    }

    // ==========================================
    // 8. SINKRONISASI DATABASE SUPABASE (REALTIME / REAKSIF)
    // ==========================================
    const teksStreak = document.getElementById('home-streak-value');
    const teksSkor = document.getElementById('home-highscore-value');
    const btnProfile = document.getElementById('btnProfile');
    const btnLogin = document.getElementById('btnLogin'); // Pastikan ini ditangkap

    if (btnProfile) {
        btnProfile.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // Fungsi utama untuk menarik dan merender data pemain
async function muatDataPemain(session) {
    const dashboardMenu = document.getElementById('dashboard-menu-buttons');

    if (!session) {
        // Jika belum login (Tamu)
        if (btnProfile) btnProfile.style.display = 'none';
        if (btnLogin) btnLogin.style.display = 'block';

        // Sembunyikan wadah tombol runtunan & skor tertinggi
        if (dashboardMenu) {
            dashboardMenu.classList.remove('is-active');
            dashboardMenu.style.setProperty('display', 'none', 'important');
        }

        const streakTertinggi = localStorage.getItem('matchStreak') || '0';
        const skorTertinggi = localStorage.getItem('matchSkorAkhir') || '0';

        if (teksStreak) teksStreak.innerText = streakTertinggi + ' Hari';
        if (teksSkor) teksSkor.innerText = skorTertinggi + ' Poin';
        return;
    }

    // Jika user terdeteksi login -> Tampilkan wadah tombol runtunan & skor tertinggi
    if (btnLogin) btnLogin.style.display = 'none';
    if (dashboardMenu) {
        dashboardMenu.classList.add('is-active');
        dashboardMenu.style.setProperty('display', 'flex', 'important');
    }

    if (btnProfile) {
        btnProfile.style.display = 'flex';
        btnProfile.innerHTML = `<span class="icon-user">⏳</span> <span>Memuat...</span>`;
    }

    try {
        // Menambahkan last_play_date di dalam query
        const { data, error } = await db.from('players')
            .select('username, daily_streak, highest_score, avatar_url, last_play_date')
            .eq('user_id', session.user.id)
            .maybeSingle();

        if (data && !error) {
            const username = data.username || 'Player';

            // Gunakan foto profil DB atau hasilkan avatar otomatis
            const fotoUrl = data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

            // Langsung suntikkan elemen <img> dengan atribut loading="lazy"
            if (btnProfile) {
                btnProfile.style.display = 'flex';
                btnProfile.innerHTML = `
                    <img src="${fotoUrl}" alt="Avatar" class="profile-avatar-img" loading="lazy">
                    <span>${username}</span>
                `;
            }

            if (teksStreak) teksStreak.innerText = `${data.daily_streak || 0} Hari`;
            if (teksSkor) teksSkor.innerText = `${data.highest_score || 0} Poin`;

            // LOGIKA PERINGATAN STREAK MAU MATI
            const hariIni = new Date().toLocaleDateString('en-CA');
            const terakhirMain = data.last_play_date ? data.last_play_date.split('T')[0] : null;

            if (terakhirMain !== hariIni && data.daily_streak > 0) {
                setTimeout(() => {
                    window.tampilkanNotif('Cepat bermain, streak mu mau mati nih.', 'peringatan');
                }, 1500);
            }
        }
    } catch (err) {
        console.error("Gagal memuat data profil:", err);
    }
}

// Pendeteksi status login real-time dari Supabase
db.auth.onAuthStateChange((event, session) => {
    muatDataPemain(session);
});
    // ==========================================
    // LOGIKA BUKA & TUTUP MODAL GENRE (DI PALING BAWAH UI.JS)
    // ==========================================
    const btnOpenGenreModal = document.getElementById('btnOpenGenreModal');
    const btnCloseGenreModal = document.getElementById('btnCloseGenreModal');
    const btnSaveGenre = document.getElementById('btnSaveGenre');
    const genreModal = document.getElementById('genreModal');

    if (btnOpenGenreModal && genreModal) {
        btnOpenGenreModal.addEventListener('click', () => {
            genreModal.classList.add('active');
        });
    }

    if (btnCloseGenreModal && genreModal) {
        btnCloseGenreModal.addEventListener('click', () => {
            genreModal.classList.remove('active');
        });
    }

    if (btnSaveGenre && genreModal) {
        btnSaveGenre.addEventListener('click', () => {
            genreModal.classList.remove('active');
        });
    }

    // Tutup modal jika pemain mengklik area hitam di luar pop-up
    if (genreModal) {
        genreModal.addEventListener('click', (e) => {
            if (e.target === genreModal) {
                genreModal.classList.remove('active');
            }
        });
    }
});