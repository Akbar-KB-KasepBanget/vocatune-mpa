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
    if (teksJumlahBenar) teksJumlahBenar.innerText = benar + "/" + daftarSoalMain.length;
    
    if (teksJumlahHampirBenar) {
        teksJumlahHampirBenar.innerText = hampir;
        // SEMBUNYIKAN WADAH HAMPIR BENAR JIKA MODE EASY
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
            // A. Filter kata agar tidak muncul ganda (Deduplikasi)
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

            // B. Update angka di badge "Total Kata"
            if (badgeTotalKata) {
                badgeTotalKata.innerText = `${kosakataUnik.length} Kata`;
            }

            // C. Render kartu kosakata ke dalam wadah
            kosakataUnik.forEach((item) => {
                const cardKosakata = document.createElement('div');
                cardKosakata.className = 'kosakata-item'; 
                cardKosakata.style.cssText = 'background: #ffffff; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: left; box-shadow: 0 2px 8px rgba(0,0,0,0.03);';
                
                cardKosakata.innerHTML = `
                    <div style="font-size: 13px; font-weight: 800; color: #e74c3c; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                        🎵 <strong style="color: #e74c3c;">${item.judul}</strong> — <span style="color: #64748b; font-weight: 700;">${item.artis}</span>
                    </div>
                    <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <span style="background: #3b82f6; color: white; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">abc</span>
                        <strong style="font-size: 16px; color: #1e293b; font-weight: 900;">${item.kata}</strong>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <div style="font-size: 12px; color: #64748b; font-weight: 700;">📖 Arti:</div>
                        <div style="font-weight: 900; font-size: 15px; color: #F39C12;">${item.arti}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #64748b; font-weight: 700;">💡 Penjelasan:</div>
                        <div style="font-size: 12px; color: #64748b; line-height: 1.4; font-style: italic;">${item.penjelasan}</div>
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