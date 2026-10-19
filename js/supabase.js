// ==========================================
// 1. FUNGSI PENENTU GELAR (TITLE - SINKRON DENGAN PROFIL & LEADERBOARD)
// ==========================================
function tentukanGelar(skor) {
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
export async function simpanSkorKeDatabase(skorBaru, streakRondeIni) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return { status: 'error', bonus: 0, streak: 0 }; 

    const userId = session.user.id;

    try {
        // 1. Ambil data lama pemain dari Supabase
        const { data: playerData, error: fetchError } = await db
            .from('players')
            .select('highest_score, total_score, daily_streak, last_play_date, highest_combo, total_days_played')
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
        } else if (lastPlayStr === kemarinStr) {
            // Kemarin main -> Streak AMAN!
            streakBaru += 1;
            totalHariBaru += 1;
            bonusSkor = (streakBaru * 200) - 100;
            statusNotif = 'aman';
        } else {
            // Kemarin TIDAK main
            if ((playerData?.daily_streak || 0) > 1) {
                statusNotif = 'hancur'; // Punya streak > 1 tapi kemarin bolong
            } else {
                statusNotif = 'baru'; // Baru pertama kali main lagi
            }
            streakBaru = 1;
            totalHariBaru += 1;
            bonusSkor = (streakBaru * 200) - 100;
        }

        // Skor Ronde Ini Ditambah Bonus Streak
        const skorTotalRondeIni = skorBaru + bonusSkor;

        // Kalkulasi Rekor
        let skorTertinggiBaru = Math.max(playerData?.highest_score || 0, skorTotalRondeIni);
        let totalSkorBaru = (playerData?.total_score || 0) + skorTotalRondeIni;
        let comboTertinggiBaru = Math.max(playerData?.highest_combo || 0, streakRondeIni);
        let gelarBaru = tentukanGelar(skorTertinggiBaru);

        // 4. Update HANYA SATU KALI ke Supabase
        const { error: updateError } = await db
            .from('players')
            .update({
                highest_score: skorTertinggiBaru,
                total_score: totalSkorBaru,
                highest_combo: comboTertinggiBaru,
                daily_streak: streakBaru,
                total_days_played: totalHariBaru,
                title: gelarBaru,
                last_play_date: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

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