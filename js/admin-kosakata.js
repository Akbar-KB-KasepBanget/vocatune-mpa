import { db } from './supabase.js';

let daftarKosakataGlobal = [];
let daftarKosakataTersaring = [];
let idVocaDihapus = null;

// KONFIGURASI PAGINATION
let halamanAktif = 1;
const itemPerHalaman = 5; // Jumlah data per halaman (misal 5 baris)

const NAMA_TABEL_VOCA = 'vocabulary'; 

document.addEventListener('DOMContentLoaded', () => {
    memuatDataKosakata();
    muatOpsiLagu();
    setupSearchKosakata();

    setupModalTambah();
    setupModalEdit();
    setupModalHapus();
});

// 1. MEMUAT DAFTAR LAGU UNTUK DROPDOWN SELECT
async function muatOpsiLagu() {
    const { data, error } = await db.from('songs').select('id, judul, artis').order('judul', { ascending: true });
    if (error || !data) return;

    const selectTambah = document.getElementById('selectLaguTambah');
    const selectEdit = document.getElementById('selectLaguEdit');

    let htmlOptions = '<option value="">-- Pilih Lagu --</option>';
    data.forEach(song => {
        htmlOptions += `<option value="${song.id}">${song.judul} - ${song.artis || ''}</option>`;
    });

    if (selectTambah) selectTambah.innerHTML = htmlOptions;
    if (selectEdit) selectEdit.innerHTML = htmlOptions;
}

// 2. MEMUAT TABEL KOSAKATA + RELASI JUDUL LAGU
async function memuatDataKosakata() {
    const tableBody = document.getElementById('tableBodyKosakata');
    if (!tableBody) return;

    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat data... ⏳</td></tr>';

    const { data, error } = await db
        .from(NAMA_TABEL_VOCA)
        .select('*, songs(judul, artis)')
        .order('id', { ascending: true });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="5" style="color:red; text-align:center;">Gagal memuat: ${error.message}</td></tr>`;
        return;
    }

    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data kosakata.</td></tr>';
        updatePaginationUI(0, 0, 0);
        return;
    }

    daftarKosakataGlobal = data;
    daftarKosakataTersaring = [...daftarKosakataGlobal];
    
    halamanAktif = 1;
    renderTabelKosakata();
}

// 3. FUNGSI RENDER TABEL & PAGINATION
function renderTabelKosakata() {
    const tableBody = document.getElementById('tableBodyKosakata');
    if (!tableBody) return;

    const totalData = daftarKosakataTersaring.length;

    if (totalData === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:20px;">Kosakata tidak ditemukan.</td></tr>';
        updatePaginationUI(0, 0, 0);
        return;
    }

    const totalHalaman = Math.ceil(totalData / itemPerHalaman);
    if (halamanAktif > totalHalaman) halamanAktif = totalHalaman;

    const indeksAwal = (halamanAktif - 1) * itemPerHalaman;
    const indeksAkhir = Math.min(indeksAwal + itemPerHalaman, totalData);
    const dataHalaman = daftarKosakataTersaring.slice(indeksAwal, indeksAkhir);

    tableBody.innerHTML = '';

    dataHalaman.forEach((item, index) => {
        const row = document.createElement('tr');
        const nomorBaris = indeksAwal + index + 1;
        const judulLagu = item.songs ? `${item.songs.judul} (${item.songs.artis || '-'})` : 'Lagu Tidak Ditemukan';

        row.innerHTML = `
            <td>${nomorBaris}</td>
            <td><strong>${item.kata}</strong></td>
            <td>${item.arti}</td>
            <td><small>${judulLagu}</small></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit-voca-btn" data-id="${item.id}">✏️</button>
                    <button class="btn-icon delete-voca-btn" data-id="${item.id}">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    pasangEventTombol();
    updatePaginationUI(indeksAwal + 1, indeksAkhir, totalData);
}

// 4. MEMPERBARUI TOMBOL DAN TEKS PAGINATION
function updatePaginationUI(mulai, sampai, total) {
    const infoText = document.getElementById('paginationInfo');
    const controlsContainer = document.getElementById('paginationControls');

    if (infoText) {
        infoText.textContent = `Menampilkan ${mulai}-${sampai} dari ${total.toLocaleString('id-ID')} kosakata`;
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
            renderTabelKosakata();
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
                renderTabelKosakata();
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
            renderTabelKosakata();
        }
    };
    controlsContainer.appendChild(btnNext);
}

// FUNGSI MEMBUAT SKEMA NUMERIK [1, 2, 3, '...', 250]
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

// 5. FUNGSI PENCARIAN REAL-TIME
function setupSearchKosakata() {
    const inputCari = document.getElementById('inputCariKosakata') || document.querySelector('.admin-search');
    if (!inputCari) return;

    inputCari.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        daftarKosakataTersaring = daftarKosakataGlobal.filter((item) => {
            const kata = (item.kata || '').toLowerCase();
            const arti = (item.arti || '').toLowerCase();
            const penjelasan = (item.penjelasan || '').toLowerCase();
            const judulLagu = item.songs ? (item.songs.judul || '').toLowerCase() : '';
            const artisLagu = item.songs ? (item.songs.artis || '').toLowerCase() : '';

            return kata.includes(query) || 
                   arti.includes(query) || 
                   penjelasan.includes(query) || 
                   judulLagu.includes(query) || 
                   artisLagu.includes(query);
        });

        halamanAktif = 1; // Reset ke halaman 1 setiap kali mencari
        renderTabelKosakata();
    });
}

// 6. PASANG EVENT TOMBOL EDIT & HAPUS
function pasangEventTombol() {
    document.querySelectorAll('.edit-voca-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const data = daftarKosakataGlobal.find(item => item.id == id);
            if (!data) return;

            document.getElementById('editVocaId').value = data.id;
            document.getElementById('selectLaguEdit').value = data.song_id || '';
            document.getElementById('kataEdit').value = data.kata || '';
            document.getElementById('artiEdit').value = data.arti || '';
            document.getElementById('penjelasanEdit').value = data.penjelasan || '';

            document.getElementById('modalEditKosakata').style.display = 'flex';
        });
    });

    document.querySelectorAll('.delete-voca-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            idVocaDihapus = e.currentTarget.getAttribute('data-id');
            document.getElementById('modalHapusKosakata').style.display = 'flex';
        });
    });
}

// 7. LOGIKA TAMBAH KOSAKATA
function setupModalTambah() {
    const modal = document.getElementById('modalTambahKosakata');
    const btnBuka = document.getElementById('btnBukaModalKosakata');
    const btnBatal = document.getElementById('btnBatalTambahVoca');
    const form = document.getElementById('formTambahKosakata');

    if (btnBuka) btnBuka.addEventListener('click', () => modal.style.display = 'flex');
    if (btnBatal) btnBatal.addEventListener('click', () => modal.style.display = 'none');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const songId = document.getElementById('selectLaguTambah').value;
            if (!songId) {
                alert('Silakan pilih lagu terlebih dahulu!');
                return;
            }

            const payload = {
                song_id: songId,
                kata: document.getElementById('kataTambah').value,
                arti: document.getElementById('artiTambah').value,
                penjelasan: document.getElementById('penjelasanTambah').value
            };

            const { error } = await db.from(NAMA_TABEL_VOCA).insert([payload]);
            if (error) {
                alert('Gagal menambah kosakata: ' + error.message);
            } else {
                modal.style.display = 'none';
                form.reset();
                memuatDataKosakata();
            }
        });
    }
}

// 8. LOGIKA EDIT KOSAKATA
function setupModalEdit() {
    const modal = document.getElementById('modalEditKosakata');
    const btnBatal = document.getElementById('btnBatalEditVoca');
    const form = document.getElementById('formEditKosakata');

    if (btnBatal) btnBatal.addEventListener('click', () => modal.style.display = 'none');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editVocaId').value;
            const payload = {
                song_id: document.getElementById('selectLaguEdit').value,
                kata: document.getElementById('kataEdit').value,
                arti: document.getElementById('artiEdit').value,
                penjelasan: document.getElementById('penjelasanEdit').value
            };

            const { error } = await db.from(NAMA_TABEL_VOCA).update(payload).eq('id', id);
            if (error) {
                alert('Gagal mengubah kosakata: ' + error.message);
            } else {
                modal.style.display = 'none';
                memuatDataKosakata();
            }
        });
    }
}

// 9. LOGIKA HAPUS KOSAKATA
function setupModalHapus() {
    const modal = document.getElementById('modalHapusKosakata');
    const btnBatal = document.getElementById('btnBatalHapusVoca');
    const btnKonfirmasi = document.getElementById('btnKonfirmasiHapusVoca');

    if (btnBatal) btnBatal.onclick = () => modal.style.display = 'none';

    if (btnKonfirmasi) {
        btnKonfirmasi.onclick = async () => {
            if (!idVocaDihapus) return;

            const { error } = await db.from(NAMA_TABEL_VOCA).delete().eq('id', idVocaDihapus);
            if (error) {
                alert('Gagal menghapus kosakata: ' + error.message);
            } else {
                modal.style.display = 'none';
                memuatDataKosakata();
            }
        };
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