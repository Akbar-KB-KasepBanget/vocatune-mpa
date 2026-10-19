import { db } from './supabase.js';

let semuaPengguna = []; 
let daftarPenggunaTersaring = [];
let selectedUserId = null;
let isAvatarRemoved = false;
let halamanAktif = 1;
const itemPerHalaman = 5;

document.addEventListener('DOMContentLoaded', () => {
    muatDaftarPengguna();
    setupSearchPengguna();
    setupModalDetail();
    setupModalHapus();
    setupModalEdit();
});

// ==========================================
// 1. MEMANGGIL DATA PENGGUNA DARI SUPABASE
// ==========================================
async function muatDaftarPengguna() {
    const tabelBody = document.getElementById('tabelPenggunaBody');
    if (!tabelBody) return;

    tabelBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data pengguna... ⏳</td></tr>';

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
        updatePaginationUI(0, 0, 0);
        return;
    }

    semuaPengguna = players;
    daftarPenggunaTersaring = [...semuaPengguna];
    halamanAktif = 1;
    renderTabelPengguna();
}

// ==========================================
// 2. RENDER TABEL & PAGINATION
// ==========================================
function renderTabelPengguna() {
    const tabelBody = document.getElementById('tabelPenggunaBody');
    if (!tabelBody) return;

    const totalData = daftarPenggunaTersaring.length;

    if (totalData === 0) {
        tabelBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding: 20px;">Pengguna tidak ditemukan.</td></tr>`;
        updatePaginationUI(0, 0, 0);
        return;
    }

    const totalHalaman = Math.ceil(totalData / itemPerHalaman);
    if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

    const indeksAwal = (halamanAktif - 1) * itemPerHalaman;
    const indeksAkhir = Math.min(indeksAwal + itemPerHalaman, totalData);
    const dataHalaman = daftarPenggunaTersaring.slice(indeksAwal, indeksAkhir);

    tabelBody.innerHTML = '';

    dataHalaman.forEach((player, index) => {
        const nomorBaris = indeksAwal + index + 1;
        const username = player.username || 'Pengguna';
        const email = player.email || 'Email tidak diset';
        const level = player.title || 'Newbie';
        const totalSkor = (player.total_score || 0).toLocaleString();
        const status = player.status || 'aktif';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${nomorBaris}</td>
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

    updatePaginationUI(indeksAwal + 1, indeksAkhir, totalData);
}

// ==========================================
// 3. LOGIKA INPUT FITUR SEARCH
// ==========================================
function setupSearchPengguna() {
    const inputCari = document.getElementById('inputCariPengguna') || document.querySelector('.admin-search');
    if (!inputCari) return;

    inputCari.addEventListener('input', (e) => {
        const kataKunci = e.target.value.toLowerCase().trim();

        daftarPenggunaTersaring = semuaPengguna.filter((player) => {
            const username = (player.username || '').toLowerCase();
            const email = (player.email || '').toLowerCase();
            
            return username.includes(kataKunci) || email.includes(kataKunci);
        });

        halamanAktif = 1;
        renderTabelPengguna();
    });
}

// ==========================================
// 4. UPDATE TOMBOL & INFO PAGINATION
// ==========================================
function updatePaginationUI(mulai, sampai, total) {
    const infoText = document.getElementById('paginationInfo');
    const controlsContainer = document.getElementById('paginationControls');

    if (infoText) {
        infoText.textContent = `Menampilkan ${mulai}-${sampai} dari ${total.toLocaleString('id-ID')} pengguna`;
    }

    if (!controlsContainer) return;

    controlsContainer.innerHTML = '';
    const totalHalaman = Math.ceil(total / itemPerHalaman) || 1;

    // Tombol Prev (<)
    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '&lt;';
    btnPrev.disabled = halamanAktif === 1;
    btnPrev.onclick = () => {
        if (halamanAktif > 1) {
            halamanAktif--;
            renderTabelPengguna();
        }
    };
    controlsContainer.appendChild(btnPrev);

    // Generate Angka Halaman
    const daftarAngka = buatSkemaAngkaHalaman(halamanAktif, totalHalaman);

    daftarAngka.forEach(item => {
        if (item === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'page-ellipsis';
            ellipsis.textContent = '...';
            controlsContainer.appendChild(ellipsis);
        } else {
            const btnNum = document.createElement('button');
            btnNum.className = `page-btn ${item === halamanAktif ? 'active' : ''}`;
            btnNum.textContent = item;
            btnNum.onclick = () => {
                halamanAktif = item;
                renderTabelPengguna();
            };
            controlsContainer.appendChild(btnNum);
        }
    });

    // Tombol Next (>)
    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = '&gt;';
    btnNext.disabled = halamanAktif === totalHalaman || total === 0;
    btnNext.onclick = () => {
        if (halamanAktif < totalHalaman) {
            halamanAktif++;
            renderTabelPengguna();
        }
    };
    controlsContainer.appendChild(btnNext);
}

function buatSkemaAngkaHalaman(aktif, total) {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (aktif <= 3) {
        return [1, 2, 3, 4, '...', total];
    }

    if (aktif >= total - 2) {
        return [1, '...', total - 3, total - 2, total - 1, total];
    }

    return [1, '...', aktif - 1, aktif, aktif + 1, '...', total];
}

// ==========================================
// 5. LOGIKA POP-UP DETAIL PENGGUNA
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
// 6. LOGIKA POP-UP HAPUS PENGGUNA
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
// 7. LOGIKA POP-UP EDIT MODERASI
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

// TOGGLE SIDEBAR MOBILE
const btnBurger = document.getElementById('btnBurger');
const sidebarAdmin = document.querySelector('.admin-sidebar');
const btnCloseSidebar = document.getElementById('btnCloseSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (btnBurger && sidebarAdmin) {
    btnBurger.addEventListener('click', () => {
        sidebarAdmin.classList.add('buka');
        if (sidebarOverlay) sidebarOverlay.classList.add('aktif');
    });
}

if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => {
        sidebarAdmin.classList.remove('buka');
        if (sidebarOverlay) sidebarOverlay.classList.remove('aktif');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebarAdmin.classList.remove('buka');
        sidebarOverlay.classList.remove('aktif');
    });
}