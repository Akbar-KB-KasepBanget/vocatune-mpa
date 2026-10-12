// ==========================================
// 1. FUNGSI PENENTU GELAR (TITLE)
// ==========================================
function tentukanGelar(skorTertinggi) {
    if (skorTertinggi >= 10000) return 'Voca Master';
    if (skorTertinggi >= 6000) return 'Chart Topper';
    if (skorTertinggi >= 3000) return 'Stage Performer';
    if (skorTertinggi >= 1000) return 'Rising Star';
    return 'Novice Singer';
}

// ==========================================
// 2. FUNGSI SIMPAN SKOR & DATA PEMAIN
// ==========================================
export async function simpanSkorKeDatabase(skorBaru, streakBaru) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return; 

    const userId = session.user.id;

    try {
        // 1. Ambil data lama pemain dari Supabase
        const { data: playerData, error: fetchError } = await db
            .from('players')
            .select('highest_score, total_score, daily_streak, last_play_date, highest_combo, total_days_played')
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Kalkulasi Skor & Skill
        let skorTertinggiBaru = Math.max(playerData.highest_score || 0, skorBaru);
        let totalSkorBaru = (playerData.total_score || 0) + skorBaru;
        let comboTertinggiBaru = Math.max(playerData.highest_combo || 0, streakBaru);

        // 3. Tentukan Gelar Baru berdasarkan Skor Tertinggi Terbaru
        let gelarBaru = tentukanGelar(skorTertinggiBaru);

        // 4. Kalkulasi Logika "Daily Streak" dan "Total Hari Bermain"
        let streakHarianBaru = playerData.daily_streak || 0;
        let totalHariBaru = playerData.total_days_played || 0;
        
        const now = new Date();
        const hariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (playerData.last_play_date) {
            const lastPlay = new Date(playerData.last_play_date);
            const tglTerakhir = new Date(lastPlay.getFullYear(), lastPlay.getMonth(), lastPlay.getDate());
            
            const selisihWaktu = hariIni - tglTerakhir;
            const selisihHari = Math.round(selisihWaktu / (1000 * 60 * 60 * 24));

            if (selisihHari === 1) {
                streakHarianBaru += 1; 
                totalHariBaru += 1; 
            } else if (selisihHari > 1) {
                streakHarianBaru = 1; 
                totalHariBaru += 1; 
            }
        } else {
            streakHarianBaru = 1; 
            totalHariBaru = 1; 
        }

        // 5. Kirim semua data terbaru (termasuk title) ke Supabase
        const { error: updateError } = await db
            .from('players')
            .update({
                highest_score: skorTertinggiBaru,
                total_score: totalSkorBaru,
                highest_combo: comboTertinggiBaru,
                daily_streak: streakHarianBaru,
                total_days_played: totalHariBaru,
                title: gelarBaru, // <-- Gelar otomatis tersimpan di sini
                last_play_date: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;
        
        console.log("Skor, Combo, Umur Akun, Daily Streak, dan Gelar berhasil diamankan! 🚀");

    } catch (error) {
        console.error("Gagal menyimpan data:", error.message);
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