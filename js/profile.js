import { db } from './supabase.js';

// ==========================================
// 1. FILTER KATA KASAR (PROFANITY FILTER)
// ==========================================
const kataTerlarang = ["anjing", "babi", "bangsat", "goblok", "tolol", "jancok", "tai", "bodoh", "prabowo", "presiden", "kontol", "sawit", "nyawit", "pemerintah", "kintil"];

function mengandungKataKasar(nama) {
    const namaKecil = nama.toLowerCase();
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
    const toggleBgm = document.getElementById('toggleBgm');
    const bgmAudio = document.getElementById('bgmAudio');

    // Elemen Foto Profil
    const avatarPreview = document.getElementById('avatarPreview');
    const inputAvatar = document.getElementById('inputAvatar');

    // ✨ FUNGSI POP-UP DIPERBARUI: Dibuat otomatis via JS agar pasti muncul
    function tampilkanPopup(pesan, tipe = 'error') {
        let popup = document.getElementById('customPopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'customPopup';
            document.body.appendChild(popup);
        }
        
        popup.textContent = pesan;
        // Styling langsung via JS agar terlihat melayang di atas
        popup.style.display = 'block';
        popup.style.position = 'fixed';
        popup.style.top = '20px';
        popup.style.right = '20px';
        popup.style.padding = '15px 20px';
        popup.style.borderRadius = '8px';
        popup.style.color = '#fff';
        popup.style.zIndex = '9999';
        popup.style.fontWeight = 'bold';
        popup.style.backgroundColor = tipe === 'success' ? '#10B981' : '#E74C3C';
        popup.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        popup.style.opacity = '1';
        popup.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => { 
            popup.style.opacity = '0';
            setTimeout(() => popup.style.display = 'none', 300);
        }, 3000);
    }

    // Pratinjau Foto Profil saat user memilih file gambar baru
    if (inputAvatar && avatarPreview) {
        inputAvatar.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                avatarPreview.src = URL.createObjectURL(file);
            }
        });
    }

    // Fitur Toggle Mata Password
    if (togglePassword && inputPassword) {
        togglePassword.addEventListener('click', () => {
            const type = inputPassword.getAttribute('type') === 'password' ? 'text' : 'password';
            inputPassword.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁' : '🙈';
        });
    }

    // ==========================================
    // ✨ FITUR TOGGLE MUSIK LATAR (SINKRON DENGAN KEYBOARD)
    // ==========================================
    if (toggleBgm && bgmAudio) {
        // Jika toggle diklik manual oleh user
        toggleBgm.addEventListener('change', (e) => {
            if (e.target.checked) bgmAudio.play();
            else bgmAudio.pause();
        });

        // Geser toggle otomatis ke "Mati" jika di-pause dari tombol keyboard/OS
        bgmAudio.addEventListener('pause', () => {
            toggleBgm.checked = false; 
        });

        // Geser toggle otomatis ke "Nyala" jika di-play dari tombol keyboard/OS
        bgmAudio.addEventListener('play', () => {
            toggleBgm.checked = true; 
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
            const namaPemain = data.username || 'Player';

            // Isi Profil & Form
            if (document.getElementById('playerTitleDisplay')) {
                document.getElementById('playerTitleDisplay').innerText = getPlayerTitle(totalSkor);
            }
            if (document.getElementById('inputUsername')) {
                document.getElementById('inputUsername').value = namaPemain;
            }
            if (document.getElementById('inputEmail')) {
                document.getElementById('inputEmail').value = emailUser;
            }

            // Muat Foto Profil yang Tersimpan ke Pratinjau
            if (data.avatar_url && avatarPreview) {
                avatarPreview.src = data.avatar_url;
            }

            // Muat Tampilan Navbar (Gambar atau Ikon)
            const btnProfileNav = document.getElementById('btnProfileNav');
            if (btnProfileNav) {
                if (data.avatar_url) {
                    btnProfileNav.innerHTML = `<img src="${data.avatar_url}" alt="Avatar" class="avatar-nav"> ${namaPemain}`;
                } else {
                    btnProfileNav.innerHTML = `👤 ${namaPemain}`;
                }
            }

            if (document.getElementById('setHighestStreak')) {
                document.getElementById('setHighestStreak').innerText = data.daily_streak || data.highest_combo || 0;
            }
            if (document.getElementById('setHighestScore')) {
                document.getElementById('setHighestScore').innerText = data.highest_score || 0;
            }
            if (document.getElementById('setTotalScore')) {
                document.getElementById('setTotalScore').innerText = totalSkor;
            }
        }

        // ==========================================
        // LOGIKA MODAL POP-UP LOGOUT
        // ==========================================
        function setupModalLogout() {
            const modalLogout = document.getElementById('modalLogout');
            const btnBuka = document.getElementById('btnOpenLogoutModal') || document.getElementById('btnLogout') || document.querySelector('.btn-logout');
            const btnBatal = document.getElementById('btnBatalLogout');
            const btnKonfirmasi = document.getElementById('btnKonfirmasiLogout');

            // Klik tombol Logout di halaman -> Buka Pop-up
            if (btnBuka && modalLogout) {
                btnBuka.addEventListener('click', (e) => {
                    e.preventDefault();
                    modalLogout.style.display = 'flex';
                });
            }

            // Klik Batal -> Tutup Pop-up
            if (btnBatal && modalLogout) {
                btnBatal.addEventListener('click', () => {
                    modalLogout.style.display = 'none';
                });
            }

            // Klik area luar transparan -> Tutup Pop-up
            if (modalLogout) {
                modalLogout.addEventListener('click', (e) => {
                    if (e.target === modalLogout) {
                        modalLogout.style.display = 'none';
                    }
                });
            }

            // Eksekusi Logout Supabase
            if (btnKonfirmasi) {
                btnKonfirmasi.addEventListener('click', async () => {
                    const teksAsli = btnKonfirmasi.innerText;
                    btnKonfirmasi.innerText = 'Keluar...';
                    btnKonfirmasi.disabled = true;

                    const { error } = await db.auth.signOut();

                    if (error) {
                        tampilkanPopup('Gagal logout: ' + error.message, 'error');
                        btnKonfirmasi.innerText = teksAsli;
                        btnKonfirmasi.disabled = false;
                    } else {
                        localStorage.removeItem('vocaTuneUserLoggedIn');
                        window.location.href = 'index.html';
                    }
                });
            }
        }

        // Jalankan listener modal logout secara langsung
        setupModalLogout();

        // ==========================================
        // FITUR SIMPAN PERUBAHAN (FOTO, NAMA & PASSWORD)
        // ==========================================
        const btnSimpanProfil = document.getElementById('btnSimpanProfil');
        if (btnSimpanProfil) {
            btnSimpanProfil.addEventListener('click', async (e) => {
                e.preventDefault();

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

                // 2. Upload Foto Profil ke Supabase Storage (jika file dipilih)
                let avatarUrlBaru = null;
                const fileAvatar = (inputAvatar && inputAvatar.files.length > 0) ? inputAvatar.files[0] : null;

                if (fileAvatar) {
                    btnSimpanProfil.innerText = "Mengunggah foto...";
                    const fileExt = fileAvatar.name.split('.').pop();
                    const filePath = `user_${userId}.${fileExt}`;

                    // Upload file ke bucket 'avatars'
                    const { error: uploadError } = await db.storage
                        .from('avatars')
                        .upload(filePath, fileAvatar, { upsert: true });

                    if (uploadError) {
                        tampilkanPopup("❌ Gagal mengunggah foto: " + uploadError.message, "error");
                        btnSimpanProfil.innerText = "Simpan Perubahan";
                        return;
                    }

                    // Ambil Public URL foto
                    const { data: urlData } = db.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    // Tambahkan query parameter timestamp agar browser mereset cache gambar lama
                    avatarUrlBaru = `${urlData.publicUrl}?t=${new Date().getTime()}`;
                }

                // 3. Cek Filter Nama Kasar
                if (namaBaru !== "") {
                    if (mengandungKataKasar(namaBaru)) {
                        tampilkanPopup("⚠ Nama tidak boleh mengandung kata yang tidak pantas!", "error");
                        btnSimpanProfil.innerText = "Simpan Perubahan";
                        return;
                    }
                }

                // 4. Update Database 'players' & Metadata
                const updatePayload = {};
                if (namaBaru !== "") updatePayload.username = namaBaru;
                if (avatarUrlBaru) updatePayload.avatar_url = avatarUrlBaru;

                if (Object.keys(updatePayload).length > 0) {
                    const { error: updateError } = await db.from('players')
                        .update(updatePayload)
                        .eq('user_id', userId);

                    if (updateError) {
                        tampilkanPopup("❌ Gagal menyimpan profil!", "error");
                        isSuccess = false;
                    } else {
                        // Perbarui Tampilan Navbar Secara Langsung
                        const nav = document.getElementById('btnProfileNav');
                        const finalNama = namaBaru || 'Player';
                        const finalAvatar = avatarUrlBaru || (data?.avatar_url || null);

                        if (nav) {
                            if (finalAvatar) {
                                nav.innerHTML = `<img src="${finalAvatar}" alt="Avatar" class="avatar-nav"> ${finalNama}`;
                            } else {
                                nav.innerHTML = `👤 ${finalNama}`;
                            }
                        }

                        // Simpan ke Cache & Auth Metadata
                        if (namaBaru !== "") localStorage.setItem('vocaTuneUserName', namaBaru);

                        const userMetaData = {};
                        if (namaBaru !== "") userMetaData.full_name = namaBaru;
                        if (avatarUrlBaru) userMetaData.avatar_url = avatarUrlBaru;

                        await db.auth.updateUser({ data: userMetaData });
                    }
                }

                // 5. Notifikasi Akhir
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