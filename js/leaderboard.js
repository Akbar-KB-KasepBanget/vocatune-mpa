

// 1. Pastikan import db ada di baris paling atas file
import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // FUNGSI PELINDUNG (ANTI-XSS / HACKER)
    // ==========================================
    function teksAman(teks) {
        if (!teks) return '';
        const div = document.createElement('div');
        div.textContent = teks;
        return div.innerHTML;
    }

    // ==========================================
    // TARIK SEMUA DATA DARI SUPABASE
    // ==========================================
    const wadahLeaderboard = document.getElementById('wadahLeaderboard');

    async function muatLeaderboard() {
        try {
            // 2. Tambahkan kolom daily_streak / streak ke dalam select()
            const { data, error } = await db
                .from('players')
                .select('username, highest_score, highest_combo, title, daily_streak') 
                .order('highest_score', { ascending: false });

            if (error) {
                console.error("Detail Error Supabase:", error);
                throw error;
            }

            wadahLeaderboard.innerHTML = ''; 

            if (data && data.length > 0) {
                data.forEach((player, index) => {
                    let rankIcon = `<span style="font-size: 20px; font-weight: 900; color: #64748b;">#${index + 1}</span>`;
                    let bgColor = 'transparent';

                    if (index === 0) { rankIcon = '🥇'; bgColor = '#FFF9E6'; } 
                    else if (index === 1) { rankIcon = '🥈'; bgColor = '#F1F5F9'; } 
                    else if (index === 2) { rankIcon = '🥉'; bgColor = '#FFF4E6'; } 

                    let titlePemain = teksAman(player.title) || 'Novice Singer';
                    let namaPemain = teksAman(player.username) || 'Anonim';
                    let skorPemain = player.highest_score || 0;
                    let streakHardPemain = player.daily_streak || player.highest_combo || 0; 

                    const barisHtml = `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 18px 15px; border-bottom: 1px solid #e2e8f0; background-color: ${bgColor}; border-radius: 12px; margin-bottom: 8px;">
                            
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="width: 40px; text-align: center; font-size: 28px;">${rankIcon}</div>
                                <div style="display: flex; flex-direction: column;">
                                    <div style="font-size: 18px; font-weight: bold; color: #2b3a4a;">
                                        ${namaPemain}
                                    </div>
                                    <div style="font-size: 13px; font-weight: bold; color: #8592a3; margin-top: 4px;">
                                        🎖️ ${titlePemain}
                                    </div>
                                </div>
                            </div>

                            <div style="text-align: right;">
                                <div style="font-size: 18px; font-weight: 900; color: #F2994A;">
                                    ${skorPemain} XP
                                </div>
                                <div style="font-size: 14px; font-weight: bold; color: #E74C3C; margin-top: 4px;">
                                    🔥 Streak: ${streakHardPemain}
                                </div>
                            </div>

                        </div>
                    `;
                    wadahLeaderboard.innerHTML += barisHtml;
                });
            } else {
                wadahLeaderboard.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada data skor. Jadilah yang pertama!</p>';
            }
        } catch (error) {
            console.error("Gagal memuat leaderboard:", error);
            wadahLeaderboard.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data dari server.</p>';
        }
    }

    muatLeaderboard();
});