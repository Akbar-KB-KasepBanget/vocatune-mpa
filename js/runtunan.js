import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const hariContainer = document.getElementById('hariContainer');
    const chartContainer = document.getElementById('chartContainer');

    async function renderRuntunanDinamic() {
        // 1. Tarik Streak Asli dari Supabase
        const { data: { session } } = await db.auth.getSession();
        let streak = 0;

        if (session) {
            const { data } = await db.from('players').select('daily_streak').eq('user_id', session.user.id).single();
            if (data) {
                streak = data.daily_streak || 0;
                document.getElementById('badgeStreak').innerText = streak;
                document.getElementById('textStreakDays').innerText = streak;
            }
        }

        // 2. LOGIKA RESET MINGGUAN OTOMATIS (Waktu Dunia Nyata)
        // Dapatkan hari saat ini (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
        const hariIni = new Date().getDay(); 
        // Ubah format index agar Senin = 0, Selasa = 1, ..., Minggu = 6
        const indexHariIni = hariIni === 0 ? 6 : hariIni - 1;

        const namaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const skorMock = [650, 890, 1120, 450, 950, 1250, 1300]; // Data grafik sementara

        let dataMingguIni = [];

        // 3. Bangun status hari berdasarkan kalender
        for (let i = 0; i < 7; i++) {
            let statusHari = 'empty';

            if (i < indexHariIni) {
                // Hari-hari yang sudah berlalu di minggu ini
                // Jika streak mencukupi untuk menutupi hari tersebut, tandai selesai
                if (streak >= (indexHariIni - i)) {
                    statusHari = 'done';
                }
            } else if (i === indexHariIni) {
                // Hari ini (Lingkaran aktif)
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
            hariContainer.innerHTML = ''; // Bersihkan container
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

        // 5. Render Diagram Batang (Sembunyikan nilai untuk hari yang belum terjadi)
        if (chartContainer) {
            chartContainer.innerHTML = ''; // Bersihkan container
            const maxSkor = 1500; 

            dataMingguIni.forEach((item, index) => {
                // Jika hari belum terjadi (masa depan), grafiknya 0
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

    // Jalankan render keseluruhan
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