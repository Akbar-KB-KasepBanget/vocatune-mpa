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
            // Tarik data profil dan statistik pemain dari Supabase
            const { data } = await db.from('players')
                .select('daily_streak, last_play_date, username, avatar_url, total_songs_played, correct_answers') 
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

                // Masukkan data ke Rangkuman Kinerja (Total Lagu & Jawaban Benar)
                const elemenTotalLagu = document.getElementById('totalLaguDitebak'); 
                const elemenBenar = document.getElementById('jawabanBenar'); 
                
                if (elemenTotalLagu) elemenTotalLagu.innerText = `${data.total_songs_played || 0} Lagu`;
                if (elemenBenar) elemenBenar.innerText = `${data.correct_answers || 0} Kali`;

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
        // MENARIK DATA ASLI DARI score_logs (Mulai Senin)
        // ==========================================
        const hariIni = new Date().getDay(); 
        const indexHariIni = hariIni === 0 ? 6 : hariIni - 1; // Senin=0, Minggu=6
        const namaHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        let skorHarianAsli = new Array(7).fill(0);

        let tglSekarang = new Date();
        let selisihKeSenin = tglSekarang.getDay() === 0 ? 6 : tglSekarang.getDay() - 1;
        
        let awalMinggu = new Date(tglSekarang);
        awalMinggu.setDate(tglSekarang.getDate() - selisihKeSenin);
        awalMinggu.setHours(0, 0, 0, 0); 
        let awalMingguISO = awalMinggu.toISOString();

        const { data: logsData, error: logsError } = await db
            .from('score_logs')
            .select('skor_tambahan, created_at')
            .eq('user_id', session.user.id)
            .gte('created_at', awalMingguISO);

        if (!logsError && logsData) {
            logsData.forEach(log => {
                let tanggalMain = new Date(log.created_at);
                let hariMain = tanggalMain.getDay() === 0 ? 6 : tanggalMain.getDay() - 1;
                skorHarianAsli[hariMain] += log.skor_tambahan; 
            });
        }

        // ==========================================
        // STATUS LINGKARAN HARI (CEKLIS BERDASARKAN SKOR)
        // ==========================================
        let hariDone = [false, false, false, false, false, false, false];
        
        // ✨ PERBAIKAN: Lingkaran otomatis diceklis jika grafik batang hari itu memiliki skor
        for (let i = 0; i < 7; i++) {
            if (skorHarianAsli[i] > 0) {
                hariDone[i] = true;
            }
        }

        let dataMingguIni = [];

        for (let i = 0; i < 7; i++) {
            let statusHari = 'empty';

            if (i === indexHariIni) {
                // Jika hari ini, tambahkan class active (bulatan biru)
                statusHari = hariDone[i] ? 'active done' : 'active';
            } else if (hariDone[i]) {
                statusHari = 'done';
            }

            dataMingguIni.push({
                hari: namaHari[i],
                skor: skorHarianAsli[i], 
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

            const skorTertinggi = Math.max(...dataMingguIni.map(item => item.skor));
            const maxSkor = skorTertinggi > 100 ? skorTertinggi + 100 : 100;

            dataMingguIni.forEach((item, index) => {
                let tinggiPersen = (index <= indexHariIni) ? (item.skor / maxSkor) * 100 : 0;
                
                if ((index <= indexHariIni) && item.skor > 0 && tinggiPersen < 2) {
                    tinggiPersen = 2;
                }

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

            // Update Teks Info Skor Tertinggi Mingguan
            const elemenInfoSkor = document.getElementById('infoSkorMingguan');
            if (elemenInfoSkor) {
                const skorMaxMingguan = Math.max(...skorHarianAsli);
                
                if (skorMaxMingguan > 0) {
                    const indexHariMax = skorHarianAsli.indexOf(skorMaxMingguan);
                    const hariMax = namaHari[indexHariMax];
                    
                    elemenInfoSkor.innerHTML = `ℹ Skor tertinggi kamu dalam seminggu terakhir tercapai di hari <strong>${hariMax}</strong> dengan perolehan <strong>${skorMaxMingguan.toLocaleString()} XP</strong>. Keren!`;
                } else {
                    elemenInfoSkor.innerHTML = `ℹ Kamu belum mendapatkan skor minggu ini. Ayo mainkan lagunya sekarang!`;
                }
            }
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