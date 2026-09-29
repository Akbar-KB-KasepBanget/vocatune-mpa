import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
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

    // 3. TARIK DATA DARI SUPABASE
    async function loadDataPerformaSupabase() {
        try {
            const { data: { session }, error: sessionError } = await db.auth.getSession();
            
            if (sessionError) {
                console.error("Gagal mengecek sesi login:", sessionError);
                return;
            }

            const wadahGlobalPerforma = document.getElementById('global-performa-section');
            
            if (session) {
                const userId = session.user.id;
                
                const { data, error } = await db
                    .from('players')
                    .select('highest_score, highest_combo, total_days_played, total_score')
                    .eq('user_id', userId)
                    .single();

                if (error) {
                    console.error("Gagal menarik data dari tabel players:", error.message);
                    return;
                }

                if (data) {
                    // Masukkan data ke HTML
                    document.getElementById('dbHighestScore').innerText = data.highest_score || 0;
                    document.getElementById('dbHighestStreak').innerText = data.highest_combo || 0;
                    document.getElementById('dbTotalDays').innerText = data.total_days_played || 0; 
                    document.getElementById('dbTotalScore').innerText = data.total_score || 0;
                }
            } else {
                // Jika Guest Mode (Visit)
                if (wadahGlobalPerforma) {
                    wadahGlobalPerforma.style.display = 'none';
                }
            }
        } catch (error) {
            console.error("Terjadi kesalahan:", error);
        }
    }

    loadDataPerformaSupabase();
});