// ==========================================
// 1. FUNGSI PENENTU GELAR (TITLE - SINKRON DENGAN PROFIL & LEADERBOARD)
// ==========================================
export function tentukanGelar(skor) {
    if (skor <= 999) return "Newbie";
    if (skor <= 4999) return "Rookie";
    if (skor <= 9999) return "Pro";
    if (skor <= 14999) return "Master";
    if (skor <= 19999) return "Grand Master";
    if (skor <= 24999) return "Legend";
    if (skor <= 29999) return "Mytic";
    if (skor <= 100000) return "Myth";
    return "Hacker";
}

// ==========================================
// 2. FUNGSI SIMPAN SKOR & HITUNG STREAK (SATU PINTU)
// ==========================================
// ✨ PERHATIAN: Ada tambahan parameter 'jumlahLaguRondeIni' dan 'jumlahBenarRondeIni'
export async function simpanSkorKeDatabase(skorBaru, streakRondeIni, jumlahLaguRondeIni = 0, jumlahBenarRondeIni = 0) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return { status: 'error', bonus: 0, streak: 0 }; 

    const userId = session.user.id;

    try {
        // 1. Ambil data lama pemain dari Supabase (termasuk kolom total lagu dan benar)
        const { data: playerData, error: fetchError } = await db
            .from('players')
            .select('highest_score, total_score, daily_streak, last_play_date, highest_combo, total_days_played, total_songs_played, correct_answers')
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Format Tanggal Lokal (YYYY-MM-DD)
        const now = new Date();
        const hariIniStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        let lastPlayStr = null;
        if (playerData?.last_play_date) {
            const lp = new Date(playerData.last_play_date);
            lastPlayStr = `${lp.getFullYear()}-${String(lp.getMonth() + 1).padStart(2, '0')}-${String(lp.getDate()).padStart(2, '0')}`;
        }

        const kemarinObj = new Date();
        kemarinObj.setDate(kemarinObj.getDate() - 1);
        const kemarinStr = `${kemarinObj.getFullYear()}-${String(kemarinObj.getMonth() + 1).padStart(2, '0')}-${String(kemarinObj.getDate()).padStart(2, '0')}`;

        let streakBaru = playerData?.daily_streak || 0;
        let totalHariBaru = playerData?.total_days_played || 0;
        let statusNotif = 'sudah_main';
        let bonusSkor = 0;

        // 3. Logika Penentuan Streak & Notifikasi
        if (lastPlayStr === hariIniStr) {
            // Sudah pernah main hari ini -> tidak ada notifikasi bonus
            statusNotif = 'sudah_main';
            bonusSkor = 0; 
        } else if (lastPlayStr === kemarinStr) {
            // Kemarin main -> Streak AMAN!
            streakBaru += 1;
            totalHariBaru += 1;
            statusNotif = 'aman';
            
            // ✨ BERIKAN BONUS 100 XP HANYA TEPAT DI HARI KE-3
            if (streakBaru === 3) {
                bonusSkor = 100;
            } else {
                bonusSkor = 0;
            }
        } else {
            // Kemarin TIDAK main (atau pembuatan akun baru)
            if ((playerData?.daily_streak || 0) > 1) {
                statusNotif = 'hancur'; // Punya streak > 1 tapi kemarin bolong
            } else {
                statusNotif = 'baru'; // Baru pertama kali main lagi
            }
            streakBaru = 1;
            totalHariBaru += 1;
            bonusSkor = 0; 
        }

        // Kalkulasi Rekor Skor
        const skorTotalRondeIni = skorBaru + bonusSkor;
        let skorTertinggiBaru = Math.max(playerData?.highest_score || 0, skorTotalRondeIni);
        let totalSkorBaru = (playerData?.total_score || 0) + skorTotalRondeIni;
        let comboTertinggiBaru = Math.max(playerData?.highest_combo || 0, streakRondeIni);
        let gelarBaru = tentukanGelar(skorTertinggiBaru);

        // ✨ Kalkulasi Total Lagu dan Jawaban Benar
        let totalLaguBaru = (playerData?.total_songs_played || 0) + jumlahLaguRondeIni;
        let totalBenarBaru = (playerData?.correct_answers || 0) + jumlahBenarRondeIni;

        // 4. Update HANYA SATU KALI ke Supabase (tabel players)
        const { error: updateError } = await db
            .from('players')
            .update({
                highest_score: skorTertinggiBaru,
                total_score: totalSkorBaru,
                highest_combo: comboTertinggiBaru,
                daily_streak: streakBaru,
                total_days_played: totalHariBaru,
                total_songs_played: totalLaguBaru,       // ✨ Menyimpan akumulasi lagu
                correct_answers: totalBenarBaru,         // ✨ Menyimpan akumulasi jawaban benar
                title: gelarBaru,
                last_play_date: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        // 5. CATAT RIWAYAT SKOR HARIAN KE TABEL score_logs
        const { error: logError } = await db
            .from('score_logs')
            .insert([
                {
                    user_id: userId,
                    skor_tambahan: skorTotalRondeIni,
                    // created_at akan terisi otomatis oleh Supabase
                }
            ]);

        if (logError) {
            console.error("Gagal mencatat riwayat harian:", logError.message);
        }

        return {
            status: statusNotif,
            bonus: bonusSkor,
            streak: streakBaru,
            skorTotalRondeIni: skorTotalRondeIni
        };

    } catch (error) {
        console.error("Gagal menyimpan data:", error.message);
        return { status: 'error', bonus: 0, streak: 0 };
    }
}
// ==========================================
// INISIALISASI SUPABASE
// ==========================================
const SUPABASE_URL = ' https://coqumpuqkbtdqgejytre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXVtcHVxa2J0ZHFnZWp5dHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjA2MTAsImV4cCI6MjEwMzQ5NjYxMH0.mGN98jHAITSigCoJjldmDinQ7pjNqosmBK8OH5p_f34'; 

if (!window.dbInstance) {
    window.dbInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

export const db = window.dbInstance;