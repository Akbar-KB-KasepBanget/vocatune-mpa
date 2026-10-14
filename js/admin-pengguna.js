import { db } from './supabase.js';

let semuaPengguna = []; // Tempat menyimpan seluruh data dari Supabase
let selectedUserId = null;
let isAvatarRemoved = false;

// ==========================================
// 1. MEMANGGIL DATA PENGGUNA DARI SUPABASE
// ==========================================
async function muatDaftarPengguna() {
    const tabelBody = document.getElementById('tabelPenggunaBody');
    if (!tabelBody) return;

    const { data: players, error } = await db
        .from('players')
        .select('*')
        .order('total_score', { ascending: false });

    if (error) {
        console.error("Gagal mengambil data pemain:", error.message);
        tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#e74c3c;">Gagal memuat data pengguna: ${error.message}</td></tr>`;
        return;
    }

    if (!players || players.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Belum ada pengguna terdaftar.</td></tr>`;
        return;
    }

    semuaPengguna = players; // Simpan ke variabel global
    renderTabelPengguna(semuaPengguna); // Tampilkan di tabel
}

// ==========================================
// FUNGSI RENDER TABEL (PENCARIAN & DISPLAY)
// ==========================================
function renderTabelPengguna(daftar) {
    const tabelBody = document.getElementById('tabelPenggunaBody');
    if (!tabelBody) return;

    if (daftar.length === 0) {
        tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 20px;">Pengguna tidak ditemukan.</td></tr>`;
        return;
    }

    tabelBody.innerHTML = '';

    daftar.forEach((player, index) => {
        const username = player.username || 'Pengguna';
        const email = player.email || 'Email tidak diset';
        const level = player.title || 'Newbie';
        const totalSkor = (player.total_score || 0).toLocaleString();
        const status = player.status || 'aktif';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <strong>${username}</strong><br>
                <small style="color: #64748b;">${email}</small>
            </td>
            <td><span class="badge mudah">${level}</span></td>
            <td>${totalSkor} XP</td>
            <td>
                <span class="badge ${status === 'banned' ? 'sulit' : 'mudah'}">
                    ${status === 'banned' ? 'Nonaktif' : 'Aktif'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view btn-view-trigger" title="Lihat Detail">👁️</button>
                    <button class="btn-icon edit btn-edit-trigger" title="Edit Moderasi">✏️</button>
                    <button class="btn-icon delete btn-delete-trigger" title="Hapus User">🗑️</button>
                </div>
            </td>
        `;

        tr.querySelector('.btn-view-trigger').addEventListener('click', () => bukaModalDetail(player));
        tr.querySelector('.btn-edit-trigger').addEventListener('click', () => bukaModalEdit(player));
        tr.querySelector('.btn-delete-trigger').addEventListener('click', () => bukaModalHapus(player));

        tabelBody.appendChild(tr);
    });
}

// ==========================================
// LOGIKA INPUT FITUR SEARCH
// ==========================================
function setupSearchPengguna() {
    const inputCari = document.getElementById('inputCariPengguna');
    if (!inputCari) return;

    inputCari.addEventListener('input', (e) => {
        const kataKunci = e.target.value.toLowerCase().trim();

        const hasilFilter = semuaPengguna.filter((player) => {
            const username = (player.username || '').toLowerCase();
            const email = (player.email || '').toLowerCase();
            
            return username.includes(kataKunci) || email.includes(kataKunci);
        });

        renderTabelPengguna(hasilFilter);
    });
}

// ==========================================
// 2. LOGIKA POP-UP DETAIL PENGGUNA
// ==========================================
function bukaModalDetail(player) {
    const modalDetail = document.getElementById('modalDetailUser');
    const imgAvatar = document.getElementById('detailAvatar');
    const placeholderAvatar = document.getElementById('detailAvatarPlaceholder');

    if (imgAvatar && placeholderAvatar) {
        if (player.avatar_url) {
            imgAvatar.src = player.avatar_url;
            imgAvatar.style.display = 'block';
            placeholderAvatar.style.display = 'none';
        } else {
            imgAvatar.style.display = 'none';
            placeholderAvatar.style.display = 'flex';
        }
    }

    if (document.getElementById('detailUsername')) document.getElementById('detailUsername').innerText = player.username || 'Pengguna';
    if (document.getElementById('detailEmail')) document.getElementById('detailEmail').innerText = player.email || 'Email tidak terdaftar';
    if (document.getElementById('detailLevel')) document.getElementById('detailLevel').innerText = player.title || 'Newbie';
    if (document.getElementById('detailSkor')) document.getElementById('detailSkor').innerText = (player.total_score || 0).toLocaleString() + ' XP';
    if (document.getElementById('detailStreak')) document.getElementById('detailStreak').innerText = (player.daily_streak || 0) + ' Hari';
    if (document.getElementById('detailStatus')) document.getElementById('detailStatus').innerText = player.status === 'banned' ? 'Nonaktif / Banned' : 'Aktif';
    if (document.getElementById('detailRole')) document.getElementById('detailRole').innerText = player.role || 'User biasa';

    if (modalDetail) modalDetail.style.display = 'flex';
}

function setupModalDetail() {
    const modal = document.getElementById('modalDetailUser');
    const btnTutup = document.getElementById('btnTutupDetail');

    if (btnTutup && modal) {
        btnTutup.addEventListener('click', () => modal.style.display = 'none');
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }
}

// ==========================================
// 3. LOGIKA POP-UP HAPUS PENGGUNA
// ==========================================
function bukaModalHapus(player) {
    const modalHapus = document.getElementById('modalHapusUser');
    const inputId = document.getElementById('hapusUserId');
    const teksKonfirmasi = document.getElementById('teksKonfirmasiHapus');

    if (inputId) inputId.value = player.user_id;
    if (teksKonfirmasi) teksKonfirmasi.innerText = `Apakah kamu yakin ingin menghapus akun "${player.username || 'Pengguna'}"? Tindakan ini tidak dapat dibatalkan.`;
    if (modalHapus) modalHapus.style.display = 'flex';
}

function setupModalHapus() {
    const modal = document.getElementById('modalHapusUser');
    const btnBatal = document.getElementById('btnBatalHapusUser');
    const btnHapus = document.getElementById('btnKonfirmasiHapusUser');

    if (btnBatal && modal) {
        btnBatal.addEventListener('click', () => modal.style.display = 'none');
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    if (btnHapus && modal) {
        btnHapus.addEventListener('click', async () => {
            const teksAsli = btnHapus.innerText;
            btnHapus.innerText = 'Menghapus...';
            btnHapus.style.opacity = '0.7';
            btnHapus.disabled = true;

            const id = document.getElementById('hapusUserId').value;
            const { error } = await db.from('players').delete().eq('user_id', id);

            btnHapus.innerText = teksAsli;
            btnHapus.style.opacity = '1';
            btnHapus.disabled = false;

            if (error) {
                alert('Gagal menghapus pengguna: ' + error.message);
            } else {
                modal.style.display = 'none';
                muatDaftarPengguna();
            }
        });
    }
}

// ==========================================
// 4. LOGIKA POP-UP EDIT MODERASI
// ==========================================
function bukaModalEdit(player) {
    selectedUserId = player.user_id;
    isAvatarRemoved = false;

    if (document.getElementById('editUserEmail')) document.getElementById('editUserEmail').innerText = player.email || 'Email tidak tersedia';
    if (document.getElementById('editUsername')) document.getElementById('editUsername').value = player.username || '';
    if (document.getElementById('editRole')) document.getElementById('editRole').value = player.role || 'user';
    if (document.getElementById('editStatus')) document.getElementById('editStatus').value = player.status || 'aktif';
    if (document.getElementById('notifResetAvatar')) document.getElementById('notifResetAvatar').style.display = 'none';

    const modal = document.getElementById('modalEditUser');
    if (modal) modal.style.display = 'flex';
}

function setupModalEdit() {
    const modal = document.getElementById('modalEditUser');
    const btnBatal = document.getElementById('btnBatalEdit');
    const btnResetUsername = document.getElementById('btnResetUsername');
    const btnResetAvatar = document.getElementById('btnResetAvatar');
    const btnSimpan = document.getElementById('btnSimpanEdit');

    if (btnBatal && modal) {
        btnBatal.addEventListener('click', () => modal.style.display = 'none');
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    if (btnResetUsername) {
        btnResetUsername.addEventListener('click', () => {
            document.getElementById('editUsername').value = 'Pengguna';
        });
    }

    if (btnResetAvatar) {
        btnResetAvatar.addEventListener('click', () => {
            isAvatarRemoved = true;
            document.getElementById('notifResetAvatar').style.display = 'block';
        });
    }

    if (btnSimpan) {
        btnSimpan.addEventListener('click', async () => {
            if (!selectedUserId) return;

            const usernameBaru = document.getElementById('editUsername').value.trim() || 'Pengguna';
            const roleBaru = document.getElementById('editRole').value;
            const statusBaru = document.getElementById('editStatus').value;

            const payloadUpdate = {
                username: usernameBaru,
                role: roleBaru,
                status: statusBaru
            };

            if (isAvatarRemoved) {
                payloadUpdate.avatar_url = null;
            }

            const { error } = await db
                .from('players')
                .update(payloadUpdate)
                .eq('user_id', selectedUserId);

            if (error) {
                alert('❌ Gagal memperbarui data pengguna: ' + error.message);
            } else {
                modal.style.display = 'none';
                muatDaftarPengguna();
            }
        });
    }
}

// ==========================================
// 5. INISIALISASI SAAT HALAMAN SELESAI DIMUAT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    muatDaftarPengguna();
    setupSearchPengguna(); // 👈 Fitur pencarian dinyalakan
    setupModalDetail();
    setupModalHapus();
    setupModalEdit();
});