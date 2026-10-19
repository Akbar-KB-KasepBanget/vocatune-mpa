import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const hariContainer = document.getElementById('hariContainer');
    const chartContainer = document.getElementById('chartContainer');

    const btnProfileNav = document.getElementById('btnProfileNav') || document.getElementById('btnProfile');
    if (btnProfileNav) {
        btnProfileNav.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        btnProfileNav.style.cursor = 'pointer';
    }

    // ==========================================
    // FUNGSI BANTUAN TANGGAL LOKAL
    // ==========================================
    function dapatkanTanggalLokal(objDate) {
        const tahun = objDate.getFullYear();
        const bulan = String(objDate.getMonth() + 1).padStart(2, '0');
        const tanggal = String(objDate.getDate()).padStart(2, '0');
        return `${tahun}-${bulan}-${tanggal}`;
    }

    async function renderRuntunanDinamic() {
        const { data: { session } } = await db.auth.getSession();
        let streak = 0;
        let sudahMainHariIni = false;

        if (session) {
            // PERBAIKAN 1: Tarik juga last_play_date dari Supabase
            const { data } = await db.from('players')
                .select('daily_streak, last_play_date, username, avatar_url') 
                .eq('user_id', session.user.id)
                .single();
                
            if (data) {
                streak = data.daily_streak || 0;
                
                // Cek apakah tanggal terakhir main adalah persis hari ini
                const hariIniTgl = dapatkanTanggalLokal(new Date());
                const lastPlayDate = data.last_play_date ? data.last_play_date.split('T')[0] : null;
                
                if (lastPlayDate === hariIniTgl) {
                    sudahMainHariIni = true;
                }
                
                const badgeStreak = document.getElementById('badgeStreak');
                const textStreakDays = document.getElementById('textStreakDays');
                if (badgeStreak) badgeStreak.innerText = streak;
                if (textStreakDays) textStreakDays.innerText = streak;

                if (btnProfileNav) {
                    const username = data.username || 'Player';
                    const fotoUrl = data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

                    btnProfileNav.style.display = 'flex';
                    btnProfileNav.innerHTML = `
                        <img src="${fotoUrl}" alt="Avatar" class="profile-avatar-img" loading="lazy">
                        <span>${username}</span>
                    `;
                }
            }
        }

        // ==========================================
        // PERBAIKAN 2: LOGIKA LINGKARAN MINGGUAN (ANTI MELESET)
        // ==========================================
        const hariIni = new Date().getDay(); 
        const indexHariIni = hariIni === 0 ? 6 : hariIni - 1; // Senin=0, Minggu=6

        const namaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        const skorMock = [650, 890, 1120, 450, 950, 1250, 1300]; 

        // Siapkan array 7 hari, default belum dicentang (false)
        let hariDone = [false, false, false, false, false, false, false];
        let sisaStreak = streak;
        
        // Jika belum main hari ini, mundurkan perhitungan centang dimulai dari kemarin
        let pointer = sudahMainHariIni ? indexHariIni : indexHariIni - 1;
        
        // Centang hari mundur ke belakang sesuai dengan sisa angka streak
        while (sisaStreak > 0 && pointer >= 0) {
            hariDone[pointer] = true;
            sisaStreak--;
            pointer--;
        }

        let dataMingguIni = [];

        // Rakit status visual CSS-nya
        for (let i = 0; i < 7; i++) {
            let statusHari = 'empty';

            if (i === indexHariIni) {
                // Khusus Hari Ini: beri ring menyala (active), tambah centang (done) kalau sudah main
                statusHari = hariDone[i] ? 'active done' : 'active';
            } else if (hariDone[i]) {
                // Hari-hari sebelumnya yang masuk dalam hitungan streak
                statusHari = 'done';
            }

            dataMingguIni.push({
                hari: namaHari[i],
                skor: skorMock[i], 
                status: statusHari
            });
        }

        // Render Lingkaran Hari ke HTML
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

        // Render Diagram Batang
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

    // Logika BGM
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