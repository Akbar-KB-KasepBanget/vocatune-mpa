

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
            // TAMBAHKAN avatar_url DI DALAM .select()
            const { data, error } = await db
                .from('players')
                .select('username, highest_score, highest_combo, title, daily_streak, avatar_url')
                .order('highest_score', { ascending: false });

            if (error) {
                console.error("Detail Error Supabase:", error);
                throw error;
            }

            wadahLeaderboard.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach((player, index) => {
                    let rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                    let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

                    let titlePemain = teksAman(player.title) || 'Novice Singer';
                    let namaPemain = teksAman(player.username) || 'Anonim';
                    let skorPemain = player.highest_score || 0;
                    let streakHardPemain = player.daily_streak || player.highest_combo || 0;

                    // Tambahkan logika pemanggil foto profil
                    let fotoAvatar = player.avatar_url
                        ? `<img src="${teksAman(player.avatar_url)}" alt="${namaPemain}" class="avatar-leaderboard">`
                        : `<div class="avatar-leaderboard-placeholder">👤</div>`;

                    const barisHtml = `
    <div class="leaderboard-item ${rankClass}">
        <div class="player-info-wrapper">
            <div class="rank-badge">${rankIcon}</div>
            ${fotoAvatar}
            <div class="player-details">
                <span class="player-name">${namaPemain}</span>
                <span class="player-title">🎖️ ${titlePemain}</span>
            </div>
        </div>
        <div class="player-stats">
            <span class="player-score">${skorPemain} XP</span>
            <span class="player-streak">🔥 Streak: ${streakHardPemain}</span>
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