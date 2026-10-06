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
// 4. CEK AUTO-START & TAMPILKAN ANGKA STATISTIK
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // --- Bagian Auto-Start ---
    let autoStart = localStorage.getItem('vocaTuneAutoStart');
    let modeTerakhir = localStorage.getItem('vocaTuneModeTerakhir');
    
    if (autoStart === 'yes' && modeTerakhir) {
        localStorage.removeItem('vocaTuneAutoStart');
        window.location.href = 'game.html';
    }

    // --- Ambil Data Angka Statistik dari LocalStorage ---
    const teksStreak = document.getElementById('home-streak-value');
    const teksSkor = document.getElementById('home-highscore-value');
    
    const streakTertinggi = localStorage.getItem('matchStreak') || '0';
    const skorTertinggi = localStorage.getItem('matchSkorAkhir') || '0';

    if (teksStreak) teksStreak.innerText = streakTertinggi + ' Hari';
    if (teksSkor) teksSkor.innerText = skorTertinggi + ' Poin';
});

// ==========================================
// 5. NAVIGASI TOMBOL MENU BAWAH
// ==========================================
const btnSkorTertinggi = document.getElementById('btnSkorTertinggi');
if (btnSkorTertinggi) {
    btnSkorTertinggi.addEventListener('click', () => {
        window.location.href = 'performa.html'; 
    });
}

const btnRuntunanHarian = document.getElementById('btnRuntunanHarian');
if (btnRuntunanHarian) {
    btnRuntunanHarian.addEventListener('click', () => {
        window.location.href = 'runtunan.html'; 
    });
}