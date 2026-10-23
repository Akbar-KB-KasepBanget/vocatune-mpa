import { db } from './supabase.js';

let daftarLaguGlobal = [];
let daftarLaguTersaring = [];
let halamanAktif = 1;
const itemPerHalaman = 5;

function tampilkanNotifikasi(pesan, tipe = 'sukses') {
    let container = document.getElementById('notifPopup');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifPopup';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            padding: 14px 24px;
            border-radius: 10px;
            font-weight: bold;
            color: #ffffff;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            display: none;
            font-family: 'Nunito', sans-serif;
        `;
        document.body.appendChild(container);
    }
    
    container.style.backgroundColor = tipe === 'sukses' ? '#10B981' : '#EF4444';
    container.innerText = pesan;
    container.style.display = 'block';

    setTimeout(() => {
        container.style.display = 'none';
    }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
    memuatDataLagu();
    setupSearchLagu();
    setupModalTambah();
    setupModalEdit();
    setupModalHapus();
});

// ==========================================
// 1. MEMUAT DATA DARI SUPABASE
// ==========================================
async function memuatDataLagu() {
    const tableBody = document.getElementById('tableBodyLagu');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data... ⏳</td></tr>';

    const { data, error } = await db.from('songs').select('*').order('id', { ascending: true });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Gagal memuat: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data lagu.</td></tr>';
        updatePaginationUI(0, 0, 0);
        return;
    }

    daftarLaguGlobal = data;
    daftarLaguTersaring = [...daftarLaguGlobal];
    halamanAktif = 1;
    renderTabelLagu();
}

// ==========================================
// 2. RENDER TABEL LAGU & PAGINATION
// ==========================================
function renderTabelLagu() {
    const tableBody = document.getElementById('tableBodyLagu');
    if (!tableBody) return;

    const totalData = daftarLaguTersaring.length;

    if (totalData === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Lagu tidak ditemukan.</td></tr>';
        updatePaginationUI(0, 0, 0);
        return;
    }

    const totalHalaman = Math.ceil(totalData / itemPerHalaman);
    if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

    const indeksAwal = (halamanAktif - 1) * itemPerHalaman;
    const indeksAkhir = Math.min(indeksAwal + itemPerHalaman, totalData);
    const dataHalaman = daftarLaguTersaring.slice(indeksAwal, indeksAkhir);

    tableBody.innerHTML = '';

    dataHalaman.forEach((item, index) => {
        const row = document.createElement('tr');
        const nomorBaris = indeksAwal + index + 1;

        row.innerHTML = `
            <td>${nomorBaris}</td>
            <td><strong>${item.judul}</strong></td>
            <td>${item.artis || '-'}</td>
            <td>${item.genre || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit-btn" data-id="${item.id}">✏️</button>
                    <button class="btn-icon delete-btn" data-id="${item.id}">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    pasangEventTombolAksi();
    updatePaginationUI(indeksAwal + 1, indeksAkhir, totalData);
}

// ==========================================
// 3. FITUR PENCARIAN REAL-TIME
// ==========================================
function setupSearchLagu() {
    const inputCari = document.getElementById('inputCariLagu') || document.querySelector('.admin-search');
    if (!inputCari) return;

    inputCari.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        daftarLaguTersaring = daftarLaguGlobal.filter((item) => {
            const judul = (item.judul || '').toLowerCase();
            const artis = (item.artis || '').toLowerCase();
            const genre = (item.genre || '').toLowerCase();

            return judul.includes(query) || artis.includes(query) || genre.includes(query);
        });

        halamanAktif = 1;
        renderTabelLagu();
    });
}

// ==========================================
// 4. PASANG KLIK KE TOMBOL ✏️ DAN 🗑️
// ==========================================
function pasangEventTombolAksi() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const data = daftarLaguGlobal.find(item => item.id == id);

            if (!data) return tampilkanNotifikasi('Data tidak ditemukan!', 'error');

            document.getElementById('editLaguId').value = data.id;
            document.getElementById('editJudulLagu').value = data.judul || '';
            document.getElementById('editArtisLagu').value = data.artis || '';
            document.getElementById('editGenreLagu').value = data.genre || '';
            document.getElementById('editLirikLagu').value = data.lirik || '';
            document.getElementById('editFileMp3').value = data.file_mp3 || '';
            document.getElementById('editDetikMulai').value = data.detik_mulai || 0;

            if (document.getElementById('editPilihanA')) document.getElementById('editPilihanA').value = data.pilihan_a || '';
            if (document.getElementById('editPilihanB')) document.getElementById('editPilihanB').value = data.pilihan_b || '';
            if (document.getElementById('editPilihanC')) document.getElementById('editPilihanC').value = data.pilihan_c || '';
            if (document.getElementById('editPilihanD')) document.getElementById('editPilihanD').value = data.pilihan_d || '';
            if (document.getElementById('editJawabanBenar')) document.getElementById('editJawabanBenar').value = data.jawaban_benar || '';

            document.getElementById('modalEditLagu').style.display = 'flex';
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            document.getElementById('hapusLaguId').value = id;
            document.getElementById('modalHapusLagu').style.display = 'flex';
        });
    });
}

// ==========================================
// 5. UPDATE TOMBOL & INFO PAGINATION
// ==========================================
function updatePaginationUI(mulai, sampai, total) {
    const infoText = document.getElementById('paginationInfo');
    const controlsContainer = document.getElementById('paginationControls');

    if (infoText) {
        infoText.textContent = `Menampilkan ${mulai}-${sampai} dari ${total.toLocaleString('id-ID')} lagu`;
    }

    if (!controlsContainer) return;

    controlsContainer.innerHTML = '';
    const totalHalaman = Math.ceil(total / itemPerHalaman) || 1;

    const btnPrev = document.createElement('button');
    btnPrev.className = 'page-btn';
    btnPrev.innerHTML = '&lt;';
    btnPrev.disabled = halamanAktif === 1;
    btnPrev.onclick = () => {
        if (halamanAktif > 1) {
            halamanAktif--;
            renderTabelLagu();
        }
    };
    controlsContainer.appendChild(btnPrev);

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
                renderTabelLagu();
            };
            controlsContainer.appendChild(btnNum);
        }
    });

    const btnNext = document.createElement('button');
    btnNext.className = 'page-btn';
    btnNext.innerHTML = '&gt;';
    btnNext.disabled = halamanAktif === totalHalaman || total === 0;
    btnNext.onclick = () => {
        if (halamanAktif < totalHalaman) {
            halamanAktif++;
            renderTabelLagu();
        }
    };
    controlsContainer.appendChild(btnNext);
}

function buatSkemaAngkaHalaman(aktif, total) {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (aktif <= 3) return [1, 2, 3, 4, '...', total];
    if (aktif >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
    return [1, '...', aktif - 1, aktif, aktif + 1, '...', total];
}

// ==========================================
// 6. LOGIKA POP-UP HAPUS
// ==========================================
function setupModalHapus() {
    const modalHapus = document.getElementById('modalHapusLagu');
    const btnBatal = document.getElementById('btnBatalHapus');
    const btnHapus = document.getElementById('btnKonfirmasiHapus');

    if (btnBatal && modalHapus) {
        btnBatal.addEventListener('click', () => modalHapus.style.display = 'none');
    }

    if (modalHapus) {
        modalHapus.addEventListener('click', (e) => {
            if (e.target === modalHapus) modalHapus.style.display = 'none';
        });
    }

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
                tampilkanNotifikasi('Gagal menghapus: ' + error.message, 'error');
            } else {
                modalHapus.style.display = 'none';
                tampilkanNotifikasi('Lagu berhasil dihapus!', 'sukses');
                memuatDataLagu();
            }
        });
    }
}

// ==========================================
// 7. LOGIKA POP-UP EDIT
// ==========================================
function setupModalEdit() {
    const modalEdit = document.getElementById('modalEditLagu');
    const btnBatal = document.getElementById('btnBatalEdit');
    const formEdit = document.getElementById('formEditLagu');

    if (btnBatal && modalEdit) {
        btnBatal.addEventListener('click', () => modalEdit.style.display = 'none');
    }

    if (modalEdit) {
        modalEdit.addEventListener('click', (e) => {
            if (e.target === modalEdit) modalEdit.style.display = 'none';
        });
    }

    if (formEdit) {
        const btnSimpan = formEdit.querySelector('.btn-save');
        if(btnSimpan) {
            btnSimpan.addEventListener('click', async (e) => {
                e.preventDefault(); 
                
                btnSimpan.innerText = 'Menyimpan...';
                btnSimpan.disabled = true;

                const id = document.getElementById('editLaguId').value;
                
                const payload = {
                    judul: document.getElementById('editJudulLagu').value,
                    artis: document.getElementById('editArtisLagu').value,
                    genre: document.getElementById('editGenreLagu').value,
                    lirik: document.getElementById('editLirikLagu').value,
                    file_mp3: document.getElementById('editFileMp3').value,
                    detik_mulai: parseInt(document.getElementById('editDetikMulai').value) || 0,
                    pilihan_a: document.getElementById('editPilihanA')?.value || '',
                    pilihan_b: document.getElementById('editPilihanB')?.value || '',
                    pilihan_c: document.getElementById('editPilihanC')?.value || '',
                    pilihan_d: document.getElementById('editPilihanD')?.value || '',
                    jawaban_benar: document.getElementById('editJawabanBenar')?.value || ''
                };
                
                try {
                    const { error } = await db.from('songs').update(payload).eq('id', id);

                    if (error) {
                        tampilkanNotifikasi('Gagal mengedit lagu: ' + error.message, 'error');
                    } else {
                        modalEdit.style.display = 'none';
                        tampilkanNotifikasi('Data lagu berhasil diperbarui!', 'sukses');
                        memuatDataLagu();
                    }
                } catch (err) {
                    tampilkanNotifikasi('Terjadi kesalahan tidak terduga.', 'error');
                } finally {
                    btnSimpan.innerText = '💾 Simpan Perubahan';
                    btnSimpan.disabled = false;
                }
            });
        }
    }
}

// ==========================================
// 8. LOGIKA POP-UP TAMBAH (DENGAN UPLOAD MP3)
// ==========================================
function setupModalTambah() {
    const modalTambah = document.getElementById('modalTambahLagu');
    const btnBuka = document.getElementById('btnBukaModal');
    const btnBatal = document.getElementById('btnBatalTambah');
    const formTambah = document.getElementById('formTambahLagu');

    if (btnBuka && modalTambah) btnBuka.addEventListener('click', () => modalTambah.style.display = 'flex');
    if (btnBatal && modalTambah) btnBatal.addEventListener('click', () => modalTambah.style.display = 'none');

    if (modalTambah) {
        modalTambah.addEventListener('click', (e) => {
            if (e.target === modalTambah) modalTambah.style.display = 'none';
        });
    }

    if (formTambah) {
        const btnSimpan = formTambah.querySelector('.btn-save');
        if(btnSimpan) {
            btnSimpan.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const fileInput = document.getElementById('fileMp3');
                const file = fileInput ? fileInput.files[0] : null;

                if (!file) {
                    tampilkanNotifikasi('Pilih file audio MP3 terlebih dahulu!', 'error');
                    return;
                }

                try {
                    btnSimpan.innerText = 'Uploading MP3...';
                    btnSimpan.disabled = true;

                    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

                    const { data: storageData, error: storageError } = await db.storage
                        .from('audio_files')
                        .upload(fileName, file);

                    if (storageError) throw storageError;

                    const { data: publicUrlData } = db.storage
                        .from('audio_files')
                        .getPublicUrl(fileName);

                    const audioUrl = publicUrlData.publicUrl;

                    btnSimpan.innerText = 'Menyimpan Data...';

                    const payload = {
                        judul: document.getElementById('judulLagu').value,
                        artis: document.getElementById('artisLagu').value,
                        genre: document.getElementById('genreLagu').value,
                        lirik: document.getElementById('lirikLagu').value,
                        file_mp3: audioUrl,
                        detik_mulai: parseInt(document.getElementById('detikMulai').value) || 0,
                        pilihan_a: document.getElementById('pilihanA')?.value || '',
                        pilihan_b: document.getElementById('pilihanB')?.value || '',
                        pilihan_c: document.getElementById('pilihanC')?.value || '',
                        pilihan_d: document.getElementById('pilihanD')?.value || '',
                        jawaban_benar: document.getElementById('jawabanBenar')?.value || ''
                    };

                    const { error: dbError } = await db.from('songs').insert([payload]);

                    if (dbError) throw dbError;

                    modalTambah.style.display = 'none';
                    formTambah.reset();
                    tampilkanNotifikasi('Lagu dan file MP3 berhasil ditambahkan!', 'sukses');
                    memuatDataLagu();

                } catch (err) {
                    tampilkanNotifikasi('Terjadi kesalahan: ' + err.message, 'error');
                } finally {
                    btnSimpan.innerText = '💾 Simpan Lagu';
                    btnSimpan.disabled = false;
                }
            });
        }
    }
}

// ==========================================
// 9. TOGGLE SIDEBAR (MOBILE)
// ==========================================
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