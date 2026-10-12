import { db } from './supabase.js';

// ==========================================
// 1. FILTER KATA KASAR (PROFANITY FILTER)
// ==========================================
// Kamu bisa menambahkan kata-kata lain ke dalam tanda kurung siku ini
const kataTerlarang = ["anjing", "babi", "bangsat", "goblok", "tolol", "jancok", "tai", "bodoh", "prabowo", "presiden", "kontol", "sawit", "nyawit", "pemerintah", "k"];

function mengandungKataKasar(nama) {
    const namaKecil = nama.toLowerCase();
    // Mengecek apakah nama yang diketik mengandung salah satu kata di atas
    return kataTerlarang.some(kata => namaKecil.includes(kata));
}

// ==========================================
// 2. FUNGSI LOGIKA TITLE (PANGKAT)
// ==========================================
function getPlayerTitle(totalScore) {
    if (totalScore <= 999) return "Newbie";
    if (totalScore <= 4999) return "Rookie";
    if (totalScore <= 9999) return "Pro";
    if (totalScore <= 14999) return "Master";
    if (totalScore <= 19999) return "Grand Master";
    if (totalScore <= 24999) return "Legend";
    if (totalScore <= 29999) return "Mytic";
    if (totalScore <= 100000) return "Myth";
    return "Hacker";
}

document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 3. KODE VISUAL & UI (Langsung jalan)
    // ==========================================
    const togglePassword = document.getElementById('togglePassword');
    const inputPassword = document.getElementById('inputPassword');
    const customPopup = document.getElementById('customPopup');
    const toggleBgm = document.getElementById('toggleBgm');
    const bgmAudio = document.getElementById('bgmAudio');

    // Fungsi Pop-up Notifikasi (Toast)
    function tampilkanPopup(pesan, tipe = 'error') {
        if (!customPopup) return;
        customPopup.textContent = pesan;
        customPopup.className = `popup-toast show ${tipe}`;
        setTimeout(() => { customPopup.className = 'popup-toast'; }, 3000);
    }

    // Fitur Toggle Mata Password
    if (togglePassword && inputPassword) {
        togglePassword.addEventListener('click', () => {
            const type = inputPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            inputPassword.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁' : '🙈';
        });
    }

    // Fitur Toggle Musik Latar
    if (toggleBgm && bgmAudio) {
        toggleBgm.addEventListener('change', (e) => {
            if (e.target.checked) bgmAudio.play();
            else bgmAudio.pause();
        });
    }

    // ==========================================
    // 4. KODE DATABASE SUPABASE
    // ==========================================
    try {
        const { data: { session }, error: sessionError } = await db.auth.getSession();
        
        if (!session || sessionError) {
            window.location.href = 'index.html';
            return;
        }

        const userId = session.user.id;
        const emailUser = session.user.email;
        
        // Tarik Data Utama dari Database
        const { data, error } = await db.from('players').select('*').eq('user_id', userId).maybeSingle();

        if (data && !error) {
            const totalSkor = data.total_score || 0;
            
            // Isi Profil & Form
            document.getElementById('playerTitleDisplay').innerText = getPlayerTitle(totalSkor);
            document.getElementById('inputUsername').value = data.username || 'Player';
            document.getElementById('inputEmail').value = emailUser;
            
            const btnProfileNav = document.getElementById('btnProfileNav');
            if (btnProfileNav) btnProfileNav.innerHTML = `👤 ${data.username || 'Player'}`;

            document.getElementById('setHighestStreak').innerText = data.daily_streak || data.highest_combo || 0;
            document.getElementById('setHighestScore').innerText = data.highest_score || 0;
            document.getElementById('setTotalScore').innerText = totalSkor;
        }

       // FITUR LOGOUT
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        let yakinKeluar = confirm("Apakah kamu yakin ingin Log Out?");
        if (yakinKeluar) {
            await db.auth.signOut();
            localStorage.removeItem('vocaTuneUserName'); // Hapus cache nama saat logout
            window.location.href = 'index.html';
        }
    });
}

        // ==========================================
        // FITUR SIMPAN PERUBAHAN (NAMA & PASSWORD)
        // ==========================================
        const btnSimpanProfil = document.getElementById('btnSimpanProfil');
        if (btnSimpanProfil) {
            btnSimpanProfil.addEventListener('click', async () => {
                const namaBaru = document.getElementById('inputUsername').value.trim();
                const passwordBaru = inputPassword ? inputPassword.value.trim() : "";
                let isSuccess = true;

                btnSimpanProfil.innerText = "Menyimpan...";

                // 1. Proses Update Password
                if (passwordBaru !== "") {
                    if (passwordBaru.length < 6) {
                        tampilkanPopup("⚠ Password baru harus lebih dari 6 karakter!", "error");
                        btnSimpanProfil.innerText = "Simpan Perubahan";
                        return;
                    }

                    const { error: passError } = await db.auth.updateUser({ password: passwordBaru });
                    
                    if (passError) {
                        tampilkanPopup("❌ Gagal mengganti password: " + passError.message, "error");
                        isSuccess = false;
                    } else {
                        inputPassword.value = ""; 
                    }
                }

               // 2. Proses Update Nama (GANTI BAGIAN INI DENGAN KODE BARU)
if (namaBaru !== "") {
    if (mengandungKataKasar(namaBaru)) {
        tampilkanPopup("⚠ Nama tidak boleh mengandung kata yang tidak pantas!", "error");
        btnSimpanProfil.innerText = "Simpan Perubahan";
        return;
    }

    const { error: updateError } = await db.from('players')
        .update({ username: namaBaru })
        .eq('user_id', userId);
        
    if (updateError) {
        tampilkanPopup("❌ Gagal menyimpan nama!", "error");
        isSuccess = false;
    } else {
        const nav = document.getElementById('btnProfileNav');
        if(nav) nav.innerHTML = `👤 ${namaBaru}`;

        // Simpan ke local storage & update metadata Supabase
        localStorage.setItem('vocaTuneUserName', namaBaru);
        await db.auth.updateUser({
            data: { full_name: namaBaru }
        });
    }
}

                // 3. Tampilkan Notifikasi Akhir
                btnSimpanProfil.innerText = "Simpan Perubahan";
                if (isSuccess) {
                    tampilkanPopup("✅ Profil berhasil diperbarui!", "success");
                }
            });
        }

    } catch (error) {
        console.error("Terjadi kesalahan sistem profil:", error);
    }
});