import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    // TANGKAP TOMBOL PROFIL & JADIKAN BISA DIKLIK
    const btnProfileNav = document.getElementById('btnProfileNav') || document.getElementById('btnProfile');
    if (btnProfileNav) {
        btnProfileNav.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
        btnProfileNav.style.cursor = 'pointer';
    }

    // 1. LOGIKA BGM (Music)
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

    // 2. LOGIKA TOMBOL KE BERANDA
    const btnKembaliHome = document.getElementById('btnKembaliHome');
    if (btnKembaliHome) {
        btnKembaliHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 3. TARIK DATA DARI SUPABASE (Dengan Super Debugger)
    async function loadDataPerformaSupabase() {
        try {
            const { data: { session }, error: sessionError } = await db.auth.getSession();
            
            const wadahGlobalPerforma = document.getElementById('global-performa-section');

            if (sessionError || !session) {
                console.warn("⚠️ Status: Belum login. Data disembunyikan.");
                if (wadahGlobalPerforma) wadahGlobalPerforma.style.display = 'none';
                return;
            }

            const userId = session.user.id;
            const emailUser = session.user.email; 
            console.log("🔍 Mencari data untuk email:", emailUser);
            
            // Menggunakan .maybeSingle() agar kebal terhadap error ganda/kosong
            const { data, error } = await db
                .from('players')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle(); 

            if (error) {
                console.error("❌ Gagal menarik data dari Supabase:", error.message);
                return;
            }

            if (data) {
                console.log("✅ Data BERHASIL ditarik dari Supabase:", data); 

                // UPDATE NAMA DI TOMBOL PROFIL DARI DATABASE TERBARU
                if (btnProfileNav) {
                    btnProfileNav.innerHTML = `👤 ${data.username || 'Player'}`;
                }

                // Masukkan data ke HTML
                const elHighestScore = document.getElementById('dbHighestScore');
                const elHighestStreak = document.getElementById('dbHighestStreak');
                const elTotalDays = document.getElementById('dbTotalDays');
                const elTotalScore = document.getElementById('dbTotalScore');

                if (elHighestScore) elHighestScore.innerText = data.highest_score || 0;
                if (elHighestStreak) elHighestStreak.innerText = data.daily_streak || data.highest_combo || 0;
                if (elTotalDays) elTotalDays.innerText = data.total_days_played || 0; 
                if (elTotalScore) elTotalScore.innerText = data.total_score || 0;
            } else {
                console.warn("⚠️ Data kosong! User ini belum memiliki baris data di tabel players.");
            }
        } catch (error) {
            console.error("❌ Terjadi kesalahan fatal:", error);
        }
    }

    loadDataPerformaSupabase();
});