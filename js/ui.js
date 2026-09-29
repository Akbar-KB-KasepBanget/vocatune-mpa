const bgmAudio = document.getElementById('bgmAudio');
    const btnBgm = document.getElementById('btnBgm');
    let isPlaying = true; 

    if (btnBgm && bgmAudio) {
        btnBgm.addEventListener('click', () => {
            if (isPlaying) {
                bgmAudio.pause();
                btnBgm.innerText = '🔇 Music Off';
            } else {
                bgmAudio.play();
                btnBgm.innerText = '🔊 Music On';
            }
            isPlaying = !isPlaying;
        });
    }

// ==========================================
// 2. PEMILIHAN MODE GAME
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
// 3. TOMBOL START GAME (Pindah Halaman)
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
// 4. CEK AUTO-START, LOGIN STATUS & TAMPILKAN STATISTIK
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // --- 1. Bagian Auto-Start (Kodingan Aslimu) ---
    let autoStart = localStorage.getItem('vocaTuneAutoStart');
    let modeTerakhir = localStorage.getItem('vocaTuneModeTerakhir');
    
    if (autoStart === 'yes' && modeTerakhir) {
        localStorage.removeItem('vocaTuneAutoStart');
        window.location.href = 'game.html';
    }

    // --- 2. Cek Status Login (Visit Mode vs Logged In) ---
    const statusLogin = localStorage.getItem('vocaTuneUserLoggedIn'); 
    const dashboardMenu = document.getElementById('dashboard-menu-buttons'); // Wadah tombol performa & streak

    if (statusLogin !== 'yes') {
        // JIKA BELUM LOGIN (VISIT MODE)
        // HANYA sembunyikan wadah tombol performa dan daily streak
        if (dashboardMenu) dashboardMenu.style.display = 'none';
        
    } else {
        // JIKA SUDAH LOGIN
        // Pastikan wadah tombol statistik tertampil
        if (dashboardMenu) dashboardMenu.style.display = 'flex';

        // Ambil elemen teks
        const teksStreak = document.getElementById('home-streak-value');
        const teksSkor = document.getElementById('home-highscore-value');

        // Ambil data dari localStorage (gunakan '0' jika belum ada data)
        const streakTertinggi = localStorage.getItem('matchStreak') || '0';
        const skorTertinggi = localStorage.getItem('matchSkorAkhir') || '0';

        // Tampilkan angka secara dinamis ke HTML
        if (teksStreak) teksStreak.innerText = streakTertinggi + ' Hari';
        if (teksSkor) teksSkor.innerText = skorTertinggi + ' Poin';
    }
});
const btnSkorTertinggi = document.getElementById('btnSkorTertinggi');

if (btnSkorTertinggi) {
    btnSkorTertinggi.addEventListener('click', () => {
        window.location.href = 'performa.html'; 
    });
}