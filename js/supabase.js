export async function simpanSkorKeDatabase(skorBaru, streakBaru) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return; 

    const userId = session.user.id;

    try {
        // 1. Ambil data lama, TAMBAHKAN total_days_played
        const { data: playerData, error: fetchError } = await db
            .from('players')
            .select('highest_score, total_score, daily_streak, last_play_date, highest_combo, total_days_played')
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Kalkulasi Skor & Skill (Combo Jawaban Benar)
        let skorTertinggiBaru = Math.max(playerData.highest_score || 0, skorBaru);
        let totalSkorBaru = (playerData.total_score || 0) + skorBaru;
        let comboTertinggiBaru = Math.max(playerData.highest_combo || 0, streakBaru);

        // 3. Kalkulasi Logika "Daily Streak" dan "Total Hari Bermain"
        let streakHarianBaru = playerData.daily_streak || 0;
        let totalHariBaru = playerData.total_days_played || 0; // Variabel baru
        
        // Ambil waktu hari ini (jam 00:00:00 agar perbandingan akurat)
        const now = new Date();
        const hariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (playerData.last_play_date) {
            // Ubah timestamp dari Supabase menjadi tanggal lokal
            const lastPlay = new Date(playerData.last_play_date);
            const tglTerakhir = new Date(lastPlay.getFullYear(), lastPlay.getMonth(), lastPlay.getDate());
            
            // Hitung selisih hari
            const selisihWaktu = hariIni - tglTerakhir;
            const selisihHari = Math.round(selisihWaktu / (1000 * 60 * 60 * 24));

            if (selisihHari === 1) {
                streakHarianBaru += 1; 
                totalHariBaru += 1; // Main di hari baru beruntun, umur akun tambah 1 hari
            } else if (selisihHari > 1) {
                streakHarianBaru = 1; 
                totalHariBaru += 1; // Main di hari baru tapi bolos, umur akun tetap tambah 1 hari
            }
            // Jika selisihHari === 0 (sudah main hari ini), tidak ada penambahan apa-apa
        } else {
            streakHarianBaru = 1; 
            totalHariBaru = 1; // Baru pertama kali main
        }

        // 4. Kirim semua data terbaru ke Supabase
        const { error: updateError } = await db
            .from('players')
            .update({
                highest_score: skorTertinggiBaru,
                total_score: totalSkorBaru,
                highest_combo: comboTertinggiBaru,
                daily_streak: streakHarianBaru,
                total_days_played: totalHariBaru, // Kirim data total hari
                last_play_date: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;
        
        console.log("Skor, Combo, Umur Akun, dan Daily Streak berhasil diamankan! 🚀");

    } catch (error) {
        console.error("Gagal menyimpan data:", error.message);
    }
}
// INISIALISASI SUPABASE
const SUPABASE_URL = 'https://coqumpuqkbtdqgejytre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvcXVtcHVxa2J0ZHFnZWp5dHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MjA2MTAsImV4cCI6MjEwMzQ5NjYxMH0.mGN98jHAITSigCoJjldmDinQ7pjNqosmBK8OH5p_f34'; 

if (!window.dbInstance) {
    window.dbInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// 👇 BARIS INI WAJIB ADA AGAR TIDAK ERROR 👇
export const db = window.dbInstance;