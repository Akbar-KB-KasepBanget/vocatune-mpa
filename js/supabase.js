export async function simpanSkorKeDatabase(skorBaru, streakBaru) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return; 

    const userId = session.user.id;

    try {
        // 1. Ambil data lama, termasuk last_play_date dan highest_combo yang baru dibuat
        const { data: playerData, error: fetchError } = await db
            .from('players')
            .select('highest_score, total_score, daily_streak, last_play_date, highest_combo')
            .eq('user_id', userId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Kalkulasi Skor & Skill (Combo Jawaban Benar)
        let skorTertinggiBaru = Math.max(playerData.highest_score || 0, skorBaru);
        let totalSkorBaru = (playerData.total_score || 0) + skorBaru;
        let comboTertinggiBaru = Math.max(playerData.highest_combo || 0, streakBaru);

        // 3. Kalkulasi Logika "Daily Streak" (Login Harian) menggunakan Waktu
        let streakHarianBaru = playerData.daily_streak || 0;
        
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
                streakHarianBaru += 1; // Main di hari berikutnya, tambah streak!
            } else if (selisihHari > 1) {
                streakHarianBaru = 1; // Terlewat lebih dari 1 hari, streak hangus kembali ke 1
            }
            // Jika selisihHari === 0, artinya dia sudah main hari ini, streak tidak ditambah maupun dikurangi
        } else {
            streakHarianBaru = 1; // Jika last_play_date NULL (baru pertama kali main), set streak ke 1
        }

        // 4. Kirim semua data terbaru ke Supabase
        const { error: updateError } = await db
            .from('players')
            .update({
                highest_score: skorTertinggiBaru,
                total_score: totalSkorBaru,
                highest_combo: comboTertinggiBaru,
                daily_streak: streakHarianBaru,
                last_play_date: new Date().toISOString() // Catat waktu bermain detik ini
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;
        
        console.log("Skor, Combo, dan Daily Streak berhasil diamankan! 🚀");

    } catch (error) {
        console.error("Gagal menyimpan data:", error.message);
    }
}
// INISIALISASI SUPABASE
const SUPABASE_URL = 'https://coqumpuqkbtdqgejytre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsIn...'; // Pastikan key panjangmu utuh

if (!window.dbInstance) {
    window.dbInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// 👇 BARIS INI WAJIB ADA AGAR TIDAK ERROR 👇
export const db = window.dbInstance;