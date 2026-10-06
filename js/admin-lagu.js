// js/admin-lagu.js
import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
    const tableBodyLagu = document.getElementById('tableBodyLagu');
    
    // FUNGSI 1: MENGAMBIL DAN MENAMPILKAN DATA LAGU (READ)
    async function muatDataLagu() {
        // Tampilkan teks loading sementara mengambil data
        tableBodyLagu.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">⏳ Sedang memuat data...</td></tr>';
        
        // Tarik data dari Supabase, urutkan dari yang terbaru
        const { data, error } = await db
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Gagal mengambil data lagu:", error);
            tableBodyLagu.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">❌ Gagal memuat data dari database.</td></tr>';
            return;
        }

        // Kosongkan tabel
        tableBodyLagu.innerHTML = '';

        // Cek jika database masih kosong
        if (data.length === 0) {
            tableBodyLagu.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #64748b;">Belum ada data lagu. Silakan klik "Tambah Lagu Baru".</td></tr>';
            return;
        }

        // Cetak data ke dalam baris tabel HTML
        data.forEach((lagu, index) => {
            // Tentukan warna badge tingkat kesulitan
            let badgeClass = 'mudah'; 
            let teksKesulitan = lagu.tingkat_kesulitan || 'Mudah';
            
            if (teksKesulitan.toLowerCase() === 'sedang') badgeClass = 'sedang';
            if (teksKesulitan.toLowerCase() === 'sulit') badgeClass = 'sulit';

            const barisHTML = document.createElement('tr');
            barisHTML.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${lagu.judul}</strong></td>
                <td>${lagu.artis}</td>
                <td>${lagu.genre}</td>
                <td><span class="badge ${badgeClass}">${teksKesulitan}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" data-id="${lagu.id}" title="Edit Lagu">✏️</button>
                        <button class="btn-icon delete" data-id="${lagu.id}" title="Hapus Lagu">🗑️</button>
                    </div>
                </td>
            `;
            tableBodyLagu.appendChild(barisHTML);
        });

        // Pasang fungsi klik untuk semua tombol Hapus (Delete)
        document.querySelectorAll('.btn-icon.delete').forEach(tombol => {
            tombol.addEventListener('click', hapusLagu);
        });
    }

    // FUNGSI 2: MENGHAPUS LAGU (DELETE)
    async function hapusLagu(event) {
        const laguId = event.currentTarget.getAttribute('data-id');
        
        // Konfirmasi sebelum menghapus
        const yakin = confirm("Apakah kamu yakin ingin menghapus lagu ini secara permanen?");
        
        if (yakin) {
            const { error } = await db.from('songs').delete().eq('id', laguId);
            
            if (error) {
                alert("Gagal menghapus lagu: " + error.message);
            } else {
                // Jika sukses dihapus, muat ulang tabel
                muatDataLagu();
            }
        }
    }

    // Panggil fungsi muat data saat halaman pertama kali dibuka
    muatDataLagu();
});