import { db } from './supabase.js';

let daftarKosakataGlobal = [];
let idVocaDihapus = null;
const NAMA_TABEL_VOCA = 'vocabulary'; // Ganti ke 'kosakata' jika nama tabelmu di Supabase adalah 'kosakata'

document.addEventListener('DOMContentLoaded', () => {
    memuatDataKosakata();
    muatOpsiLagu();

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

    // Mengambil data kosakata + JOIN ke tabel songs berdasarkan song_id
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
        return;
    }

    daftarKosakataGlobal = data;
    tableBody.innerHTML = '';

    data.forEach((item, index) => {
        const row = document.createElement('tr');
        const judulLagu = item.songs ? `${item.songs.judul} (${item.songs.artis || '-'})` : 'Lagu Tidak Ditemukan';

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${item.kata}</strong></td>
            <td>${item.arti}</td>
            <td><small>${judulLagu}</small></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon edit-voca-btn" data-index="${index}">✏️</button>
                    <button class="btn-icon delete-voca-btn" data-id="${item.id}">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    pasangEventTombol();
}

// 3. PASANG EVENT TOMBOL EDIT & HAPUS
function pasangEventTombol() {
    document.querySelectorAll('.edit-voca-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            const data = daftarKosakataGlobal[index];
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

// 4. LOGIKA TAMBAH KOSAKATA
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

// 5. LOGIKA EDIT KOSAKATA
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

// 6. LOGIKA HAPUS KOSAKATA
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