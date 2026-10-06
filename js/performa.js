import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
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
            const emailUser = session.user.email; // Melacak email yang sedang dipakai
            const username = session.user.user_metadata?.username || 'Player';
            const btnProfileNav = document.getElementById('btnProfileNav');
            if (btnProfileNav) btnProfileNav.innerHTML = `👤 ${username}`;
            // Menampilkan info ke console
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

                // Masukkan data ke HTML
                document.getElementById('dbHighestScore').innerText = data.highest_score || 0;
                document.getElementById('dbHighestStreak').innerText = data.daily_streak || data.highest_combo || 0;
                document.getElementById('dbTotalDays').innerText = data.total_days_played || 0; 
                document.getElementById('dbTotalScore').innerText = data.total_score || 0;
            } else {
                console.warn("⚠️ Data kosong! User ini belum memiliki baris data di tabel players.");
            }
        } catch (error) {
            console.error("❌ Terjadi kesalahan fatal:", error);
        }
    }

    loadDataPerformaSupabase();
});