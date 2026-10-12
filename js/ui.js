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
            
            if(modeMessage) {
                modeMessage.innerText = `Kamu memilih mode: ${selectedMode}! Klik Start Game untuk mulai.`;
                modeMessage.style.color = "#2b3a4a";
            }
        });
    });

    // ==========================================
    // 5. TOMBOL START GAME (Pindah Halaman)
    // ==========================================
    const btnStart = document.getElementById('btnStart');

    if (btnStart) {
        btnStart.addEventListener('click', function () {
            // Cek apakah mode sudah dipilih
            if (selectedMode === "") {
                modeMessage.innerText = "Silakan pilih tingkat kesulitan terlebih dahulu!";
                modeMessage.style.color = "red";
                return;
            }
            // Jika sudah pilih mode, PINDAH ke halaman game!
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
    // 8. SINKRONISASI DATABASE SUPABASE (NAMA, STREAK, SKOR)
    // ==========================================
    const teksStreak = document.getElementById('home-streak-value');
    const teksSkor = document.getElementById('home-highscore-value');
    const btnProfile = document.getElementById('btnProfile');

    // Buat tombol profil bisa diklik ke halaman profil
    if (btnProfile) {
        btnProfile.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    try {
        // Cek siapa user yang sedang login saat ini
        const { data: { session }, error: sessionError } = await db.auth.getSession();
        
        if (session && !sessionError) {
            const userId = session.user.id;
            
            // Tarik data nama, streak, dan skor dari tabel players
            const { data, error } = await db.from('players')
                .select('username, daily_streak, highest_score')
                .eq('user_id', userId)
                .maybeSingle();

            if (data && !error) {
                // Update Nama di Pojok Kanan Atas
                if (btnProfile) {
                    btnProfile.innerHTML = `<span class="icon-user">👤</span> ${data.username || 'Player'}`;
                    btnProfile.style.display = 'block';
                }
                
                // Update Angka dari Database ke Kotak
                if (teksStreak) teksStreak.innerText = `${data.daily_streak || 0} Hari`;
                if (teksSkor) teksSkor.innerText = `${data.highest_score || 0} Poin`;
            }
        } else {
            // Jika belum login (Tamu), pakai data LocalStorage seperti aslinya
            const streakTertinggi = localStorage.getItem('matchStreak') || '0';
            const skorTertinggi = localStorage.getItem('matchSkorAkhir') || '0';

            if (teksStreak) teksStreak.innerText = streakTertinggi + ' Hari';
            if (teksSkor) teksSkor.innerText = skorTertinggi + ' Poin';
        }
    } catch (error) {
        console.error("Gagal memuat profil di UI:", error);
    }
});