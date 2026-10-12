import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const hariContainer = document.getElementById('hariContainer');
    const chartContainer = document.getElementById('chartContainer');

    // TANGKAP TOMBOL PROFIL & JADIKAN BISA DIKLIK
    const btnProfileNav = document.getElementById('btnProfileNav') || document.getElementById('btnProfile');
    if (btnProfileNav) {
        btnProfileNav.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        btnProfileNav.style.cursor = 'pointer';
    }

    async function renderRuntunanDinamic() {
        // 1. Tarik Streak & Username Asli dari Supabase
        const { data: { session } } = await db.auth.getSession();
        let streak = 0;

        if (session) {
            // KUNCI: Tambahkan 'username' di select
            const { data } = await db.from('players').select('daily_streak, username').eq('user_id', session.user.id).single();
            if (data) {
                streak = data.daily_streak || 0;
                
                // Update elemen angka runtunan
                const badgeStreak = document.getElementById('badgeStreak');
                const textStreakDays = document.getElementById('textStreakDays');
                if (badgeStreak) badgeStreak.innerText = streak;
                if (textStreakDays) textStreakDays.innerText = streak;

                // Update teks tombol profil dengan nama terbaru
                if (btnProfileNav) {
                    btnProfileNav.innerHTML = `👤 ${data.username || 'Player'}`;
                }
            }
        }

        // 2. LOGIKA RESET MINGGUAN OTOMATIS (Waktu Dunia Nyata)
        const hariIni = new Date().getDay(); 
        const indexHariIni = hariIni === 0 ? 6 : hariIni - 1;

        const namaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const skorMock = [650, 890, 1120, 450, 950, 1250, 1300]; 

        let dataMingguIni = [];

        // 3. Bangun status hari berdasarkan kalender
        for (let i = 0; i < 7; i++) {
            let statusHari = 'empty';

            if (i < indexHariIni) {
                if (streak >= (indexHariIni - i)) {
                    statusHari = 'done';
                }
            } else if (i === indexHariIni) {
                statusHari = streak > 0 ? 'active done' : 'active';
            }

            dataMingguIni.push({
                hari: namaHari[i],
                skor: skorMock[i], 
                status: statusHari
            });
        }

        // 4. Render Lingkaran Hari ke HTML
        if (hariContainer) {
            hariContainer.innerHTML = ''; 
            dataMingguIni.forEach(item => {
                const isDone = item.status.includes('done');
                const checkMark = isDone ? '✔' : '';
                
                const dayHtml = `
                    <div class="day-item">
                        <span class="day-label">${item.hari}</span>
                        <div class="day-circle ${item.status}">${checkMark}</div>
                    </div>
                `;
                hariContainer.innerHTML += dayHtml;
            });
        }

        // 5. Render Diagram Batang
        if (chartContainer) {
            chartContainer.innerHTML = ''; 
            const maxSkor = 1500; 

            dataMingguIni.forEach((item, index) => {
                const tinggiPersen = (index <= indexHariIni) ? (item.skor / maxSkor) * 100 : 0;
                const nilaiSkor = (index <= indexHariIni) ? item.skor : '';

                const barHtml = `
                    <div class="bar-wrapper">
                        <span class="bar-value">${nilaiSkor}</span>
                        <div class="chart-bar" style="height: ${tinggiPersen}%;"></div>
                        <span class="day-label">${item.hari}</span>
                    </div>
                `;
                chartContainer.innerHTML += barHtml;
            });
        }
    }

    renderRuntunanDinamic();

    // 6. Logika BGM
    const bgmAudio = document.getElementById('bgmAudio');
    const btnBgm = document.getElementById('btnBgm');
    let isPlaying = true; 
    
    if (btnBgm && bgmAudio) {
        btnBgm.addEventListener('click', () => {
            isPlaying ? bgmAudio.pause() : bgmAudio.play();
            btnBgm.innerText = isPlaying ? '🔇 Music Off' : '🔊 Music On';
            isPlaying = !isPlaying;
        });
    }
});