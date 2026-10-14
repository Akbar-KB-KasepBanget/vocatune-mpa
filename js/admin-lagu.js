import { db } from './supabase.js';

// Variabel penampung data agar tombol Edit langsung terbuka tanpa loading
let daftarLaguGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Muat tabel saat halaman pertama kali dibuka
    memuatDataLagu();

    // 2. Siapkan semua logika modal (Tambah, Edit, Hapus)
    setupModalTambah();
    setupModalEdit();
    setupModalHapus();
});

// ==========================================
// 1. FUNGSI MEMUAT DATA KE TABEL
// ==========================================
async function memuatDataLagu() {
    const tableBody = document.getElementById('tableBodyLagu');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>';

    const { data, error } = await db.from('songs').select('*').order('id', { ascending: true });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center;">Gagal memuat: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada data lagu.</td></tr>';
        return;
    }

    // Simpan ke memori agar tombol Edit bisa langsung mengambil datanya
    daftarLaguGlobal = data;
    tableBody.innerHTML = '';

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${item.judul}</strong></td>
            <td>${item.artis || '-'}</td>
            <td>${item.genre || '-'}</td>
            <td><span class="badge ${item.tingkat_kesulitan ? item.tingkat_kesulitan.toLowerCase() : 'mudah'}">${item.tingkat_kesulitan || 'Mudah'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit-btn" data-index="${index}">✏️</button>
                    <button class="btn-icon delete-btn" data-id="${item.id}">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    pasangEventTombolAksi();
}

// ==========================================
// 2. PASANG KLIK KE TOMBOL ✏️ DAN 🗑️
// ==========================================
function pasangEventTombolAksi() {
    // Tombol Edit
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            const data = daftarLaguGlobal[index];

            if (!data) return alert('Data tidak ditemukan!');

            document.getElementById('editLaguId').value = data.id;
            document.getElementById('editJudulLagu').value = data.judul || '';
            document.getElementById('editArtisLagu').value = data.artis || '';
            document.getElementById('editGenreLagu').value = data.genre || '';
            document.getElementById('editKesulitanLagu').value = data.tingkat_kesulitan || 'Mudah';
            document.getElementById('editLirikLagu').value = data.lirik || '';
            document.getElementById('editFileMp3').value = data.file_mp3 || '';
            document.getElementById('editDetikMulai').value = data.detik_mulai || 0;

            if (document.getElementById('editPilihanA')) document.getElementById('editPilihanA').value = data.pilihan_a || '';
            if (document.getElementById('editPilihanB')) document.getElementById('editPilihanB').value = data.pilihan_b || '';
            if (document.getElementById('editPilihanC')) document.getElementById('editPilihanC').value = data.pilihan_c || '';
            if (document.getElementById('editPilihanD')) document.getElementById('editPilihanD').value = data.pilihan_d || '';
            if (document.getElementById('editJawabanBenar')) document.getElementById('editJawabanBenar').value = data.jawaban_benar || '';

            document.getElementById('editVocaKata').value = data.voca_kata || '';
            document.getElementById('editVocaArti').value = data.voca_arti || '';
            document.getElementById('editVocaPenjelasan').value = data.voca_penjelasan || '';

            const editContainerPG = document.getElementById('editContainerPilihanGanda');
            if (editContainerPG) {
                editContainerPG.style.display = (data.tingkat_kesulitan === 'Sedang' || data.tingkat_kesulitan === 'Sulit') ? 'none' : 'block';
            }

            document.getElementById('modalEditLagu').style.display = 'flex';
        });
    });

    // Tombol Hapus
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            document.getElementById('hapusLaguId').value = id;
            document.getElementById('modalHapusLagu').style.display = 'flex';
        });
    });
}

// ==========================================
// 3. LOGIKA POP-UP HAPUS
// ==========================================
function setupModalHapus() {
    const modalHapus = document.getElementById('modalHapusLagu');
    const btnBatal = document.getElementById('btnBatalHapus');
    const btnHapus = document.getElementById('btnKonfirmasiHapus');

    // Tombol Batal
    if (btnBatal && modalHapus) {
        btnBatal.addEventListener('click', () => modalHapus.style.display = 'none');
    }

    // Klik luar area modal untuk menutup
    if (modalHapus) {
        modalHapus.addEventListener('click', (e) => {
            if (e.target === modalHapus) modalHapus.style.display = 'none';
        });
    }

    // Konfirmasi Hapus
    if (btnHapus) {
        btnHapus.addEventListener('click', async () => {
            const teksAsli = btnHapus.innerText;
            btnHapus.innerText = 'Menghapus...';
            btnHapus.style.opacity = '0.7';
            btnHapus.disabled = true;

            const id = document.getElementById('hapusLaguId').value;
            const { error } = await db.from('songs').delete().eq('id', id);

            btnHapus.innerText = teksAsli;
            btnHapus.style.opacity = '1';
            btnHapus.disabled = false;

            if (error) {
                alert('Gagal menghapus: ' + error.message);
            } else {
                modalHapus.style.display = 'none';
                memuatDataLagu();
            }
        });
    }
}

// ==========================================
// 4. LOGIKA POP-UP EDIT
// ==========================================
function setupModalEdit() {
    const modalEdit = document.getElementById('modalEditLagu');
    const btnBatal = document.getElementById('btnBatalEdit');
    const formEdit = document.getElementById('formEditLagu');

    // Tombol Batal
    if (btnBatal && modalEdit) {
        btnBatal.addEventListener('click', () => modalEdit.style.display = 'none');
    }

    // Klik luar area modal untuk menutup
    if (modalEdit) {
        modalEdit.addEventListener('click', (e) => {
            if (e.target === modalEdit) modalEdit.style.display = 'none';
        });
    }

    // Toggle Pilihan Ganda berdasarkan tingkat kesulitan
    const editKesulitan = document.getElementById('editKesulitanLagu');
    const editContainerPG = document.getElementById('editContainerPilihanGanda');
    if (editKesulitan && editContainerPG) {
        editKesulitan.addEventListener('change', (e) => {
            editContainerPG.style.display = (e.target.value === 'Sedang' || e.target.value === 'Sulit') ? 'none' : 'block';
        });
    }

    // Submit Form Edit
    if (formEdit) {
        formEdit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSimpan = formEdit.querySelector('.btn-save');
            btnSimpan.innerText = 'Menyimpan...';
            btnSimpan.disabled = true;

            const id = document.getElementById('editLaguId').value;
            const payload = {
                judul: document.getElementById('editJudulLagu').value,
                artis: document.getElementById('editArtisLagu').value,
                genre: document.getElementById('editGenreLagu').value,
                tingkat_kesulitan: document.getElementById('editKesulitanLagu').value,
                lirik: document.getElementById('editLirikLagu').value,
                file_mp3: document.getElementById('editFileMp3').value,
                detik_mulai: parseInt(document.getElementById('editDetikMulai').value),
                pilihan_a: document.getElementById('editPilihanA')?.value || '',
                pilihan_b: document.getElementById('editPilihanB')?.value || '',
                pilihan_c: document.getElementById('editPilihanC')?.value || '',
                pilihan_d: document.getElementById('editPilihanD')?.value || '',
                jawaban_benar: document.getElementById('editJawabanBenar')?.value || '',
                voca_kata: document.getElementById('editVocaKata').value,
                voca_arti: document.getElementById('editVocaArti').value,
                voca_penjelasan: document.getElementById('editVocaPenjelasan').value
            };

            const { error } = await db.from('songs').update(payload).eq('id', id);

            btnSimpan.innerText = '💾 Simpan Perubahan';
            btnSimpan.disabled = false;

            if (error) {
                alert('Gagal mengedit lagu: ' + error.message);
            } else {
                modalEdit.style.display = 'none';
                memuatDataLagu();
            }
        });
    }
}

// ==========================================
// 5. LOGIKA POP-UP TAMBAH
// ==========================================
function setupModalTambah() {
    const modalTambah = document.getElementById('modalTambahLagu');
    const btnBuka = document.getElementById('btnBukaModal');
    const btnBatal = document.getElementById('btnBatalTambah');
    const formTambah = document.getElementById('formTambahLagu');
    const selectKesulitan = document.getElementById('kesulitanLagu');
    const containerPG = document.getElementById('containerPilihanGanda');

    // Buka & Batal
    if (btnBuka && modalTambah) btnBuka.addEventListener('click', () => modalTambah.style.display = 'flex');
    if (btnBatal && modalTambah) btnBatal.addEventListener('click', () => modalTambah.style.display = 'none');

    // Klik luar area modal untuk menutup
    if (modalTambah) {
        modalTambah.addEventListener('click', (e) => {
            if (e.target === modalTambah) modalTambah.style.display = 'none';
        });
    }

    // Toggle Pilihan Ganda
    if (selectKesulitan && containerPG) {
        selectKesulitan.addEventListener('change', (e) => {
            containerPG.style.display = (e.target.value === 'Sedang' || e.target.value === 'Sulit') ? 'none' : 'block';
        });
    }

    // Submit Form Tambah
    if (formTambah) {
        formTambah.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSimpan = formTambah.querySelector('.btn-save');
            btnSimpan.innerText = 'Menyimpan...';
            btnSimpan.disabled = true;

            const payload = {
                judul: document.getElementById('judulLagu').value,
                artis: document.getElementById('artisLagu').value,
                genre: document.getElementById('genreLagu').value,
                tingkat_kesulitan: document.getElementById('kesulitanLagu').value,
                lirik: document.getElementById('lirikLagu').value,
                file_mp3: document.getElementById('fileMp3').value,
                detik_mulai: parseInt(document.getElementById('detikMulai').value),
                pilihan_a: document.getElementById('pilihanA')?.value || '',
                pilihan_b: document.getElementById('pilihanB')?.value || '',
                pilihan_c: document.getElementById('pilihanC')?.value || '',
                pilihan_d: document.getElementById('pilihanD')?.value || '',
                jawaban_benar: document.getElementById('jawabanBenar')?.value || ''
            };

            const { error } = await db.from('songs').insert([payload]);

            btnSimpan.innerText = '💾 Simpan Lagu';
            btnSimpan.disabled = false;

            if (error) {
                alert('Gagal menambah lagu: ' + error.message);
            } else {
                modalTambah.style.display = 'none';
                formTambah.reset();
                memuatDataLagu();
            }
        });
    }
}
// ==========================================
// FUNGSI HAMBURGER MENU & CLOSE (MOBILE)
// ==========================================
const btnBurger = document.getElementById('btnBurger');
const sidebarAdmin = document.querySelector('.admin-sidebar');
const btnCloseSidebar = document.getElementById('btnCloseSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// 1. Membuka Sidebar & Memunculkan Latar Gelap
if (btnBurger && sidebarAdmin) {
    btnBurger.addEventListener('click', () => {
        sidebarAdmin.classList.add('buka');
        if (sidebarOverlay) sidebarOverlay.classList.add('aktif');
    });
}

// 2. Menutup Sidebar saat tombol "X" ditekan
if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => {
        sidebarAdmin.classList.remove('buka');
        if (sidebarOverlay) sidebarOverlay.classList.remove('aktif');
    });
}

// 3. Menutup Sidebar saat area gelap (luar sidebar) ditekan
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebarAdmin.classList.remove('buka');
        sidebarOverlay.classList.remove('aktif');
    });
}