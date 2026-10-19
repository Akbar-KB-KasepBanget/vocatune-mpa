import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. TANGKAP ID SESUAI DENGAN FILE HTML-MU
    const wadahLeaderboard = document.getElementById('wadahLeaderboard');

    // ==========================================
    // FUNGSI PELINDUNG (ANTI-XSS)
    // ==========================================
    function teksAman(teks) {
        if (!teks) return '';
        const div = document.createElement('div');
        div.textContent = teks;
        return div.innerHTML;
    }

    // ==========================================
    // LOGIKA TITLE BARU (SAMA DENGAN PROFIL)
    // ==========================================
    function getPlayerTitle(totalScore) {
        const skor = Number(totalScore) || 0;
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
    // TARIK DATA LEADERBOARD DARI SUPABASE
    // ==========================================
    async function muatLeaderboard() {
        try {
            const { data, error } = await db
                .from('players')
                .select('username, highest_score, highest_combo, daily_streak, avatar_url')
                .order('highest_score', { ascending: false });

            if (error) throw error;

            if (wadahLeaderboard) wadahLeaderboard.innerHTML = '';

            if (data && data.length > 0) {
                data.forEach((player, index) => {
                    let rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                    let rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';

                    let namaPemain = teksAman(player.username) || 'Anonim';
                    let skorPemain = player.highest_score || 0;
                    
                    let titlePemain = getPlayerTitle(skorPemain);
                    let streakPemain = player.daily_streak ?? player.highest_combo ?? 0;

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
                                <span class="player-streak">🔥 Streak: ${streakPemain}</span>
                            </div>
                        </div>
                    `;
                    if (wadahLeaderboard) wadahLeaderboard.innerHTML += barisHtml;
                });
            } else {
                if (wadahLeaderboard) wadahLeaderboard.innerHTML = '<p style="text-align: center; color: #64748b;">Belum ada data skor.</p>';
            }
        } catch (error) {
            console.error("Gagal memuat leaderboard:", error);
            if (wadahLeaderboard) wadahLeaderboard.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data dari server.</p>';
        }
    }

    muatLeaderboard();
});