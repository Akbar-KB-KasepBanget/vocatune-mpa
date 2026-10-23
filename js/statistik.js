document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data skor, mode, dan riwayat dari localStorage
    const skor = localStorage.getItem('matchSkorAkhir') || '0';
    const streak = localStorage.getItem('matchStreak') || '0';
    const benar = localStorage.getItem('matchBenar') || '0';
    const hampir = localStorage.getItem('matchHampir') || '0';
    const modePlay = localStorage.getItem('matchMode') || 'Easy';
    
    const riwayatMentah = localStorage.getItem('matchRiwayatSoal');
    const daftarSoalMain = riwayatMentah ? JSON.parse(riwayatMentah) : [];

    // 2. Suntikkan statistik angka ke HTML
    const teksSkorAkhir = document.getElementById('skorAkhir');
    const teksStreakAkhir = document.getElementById('streakAkhir');
    const teksJumlahBenar = document.getElementById('jumlahBenarAkhir');
    const teksJumlahHampirBenar = document.getElementById('jumlahHampirBenarAkhir');

    if (teksSkorAkhir) teksSkorAkhir.innerText = skor;
    if (teksStreakAkhir) teksStreakAkhir.innerText = streak;
    if (teksJumlahBenar) teksJumlahBenar.innerText = benar;
    
    if (teksJumlahHampirBenar) {
        teksJumlahHampirBenar.innerText = hampir;
        const containerHampir = teksJumlahHampirBenar.closest('.stat-item');
        if (containerHampir) {
            containerHampir.style.display = (modePlay === 'Easy') ? 'none' : 'inline-block';
        }
    }

    // 3. Render Daftar Kosakata & Lagu Berdasarkan yang Ditebak
    const wadahKosakata = document.getElementById('daftarKosakata');
    const badgeTotalKata = document.querySelector('.badge-total');
    
    if (wadahKosakata) {
        wadahKosakata.innerHTML = ''; 
        
        if (daftarSoalMain.length === 0) {
            wadahKosakata.innerHTML = '<p style="text-align: center; color: #64748b; font-style: italic; grid-column: 1/-1;">Belum ada riwayat soal pada sesi ini.</p>';
            if (badgeTotalKata) badgeTotalKata.innerText = '0 Kata';
        } else {
            const kosakataUnik = [];
            const kataTerdaftar = new Set();

            daftarSoalMain.forEach((soal) => {
                const listKata = (soal.daftarVoca && soal.daftarVoca.length > 0) 
                    ? soal.daftarVoca 
                    : [soal.voca || { kata: '-', arti: '-', penjelasan: '-' }];

                listKata.forEach((vocaItem) => {
                    const kataClean = (vocaItem.kata || '-').trim();
                    if (kataClean !== '-' && !kataTerdaftar.has(kataClean.toLowerCase())) {
                        kataTerdaftar.add(kataClean.toLowerCase());
                        kosakataUnik.push({
                            judul: soal.judul || 'Lagu Tanpa Judul',
                            artis: soal.artis || 'Artis Tidak Diketahui',
                            kata: vocaItem.kata || '-',
                            arti: vocaItem.arti || '-',
                            penjelasan: vocaItem.penjelasan || 'Tidak ada penjelasan khusus.'
                        });
                    }
                });
            });

            if (badgeTotalKata) {
                badgeTotalKata.innerText = `${kosakataUnik.length} Kata`;
            }

            kosakataUnik.forEach((item) => {
                const cardKosakata = document.createElement('div');
                cardKosakata.className = 'kosakata-item kosa-card-container'; 
                
                // ✨ LOGIKA MENEBAK LINK LANGSUNG GENIUS ✨
                const formatGenius = (item.artis + " " + item.judul)
                    .toLowerCase()
                    .replace(/[^a-z0-9\s]/g, '')
                    .trim()
                    .replace(/\s+/g, '-') + '-lyrics';
                
                const linkGeniusLangsung = `https://genius.com/${formatGenius}`;

                cardKosakata.innerHTML = `
                    <div class="kosa-header">
                        🎵 <strong>${item.judul}</strong> — <span>${item.artis}</span>
                    </div>
                    <div class="kosa-word-group">
                        <span class="kosa-tag">abc</span>
                        <strong class="kosa-word">${item.kata}</strong>
                    </div>
                    <div class="kosa-section">
                        <div class="kosa-label">📖 Arti:</div>
                        <div class="kosa-meaning">${item.arti}</div>
                        <a href="${linkGeniusLangsung}" target="_blank" class="kosa-link">📝 Lirik & Makna di Genius ↗</a>
                    </div>
                    <div>
                        <div class="kosa-label">💡 Penjelasan:</div>
                        <div class="kosa-desc">${item.penjelasan}</div>
                    </div>
                `;
                
                wadahKosakata.appendChild(cardKosakata);
            });
        }
    }

    // 4. Logika Tombol Navigasi
    const btnMainLagi = document.getElementById('btnMainLagi');
    const btnKembaliHome = document.getElementById('btnKembaliHome');

    if (btnMainLagi) {
        btnMainLagi.addEventListener('click', () => {
            localStorage.setItem('vocaTuneAutoStart', 'yes');
            window.location.href = 'game.html';
        });
    }

    if (btnKembaliHome) {
        btnKembaliHome.addEventListener('click', () => {
            localStorage.removeItem('vocaTuneAutoStart');
            window.location.href = 'index.html';
        });
    }

    // 5. Logika Tombol BGM
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
});