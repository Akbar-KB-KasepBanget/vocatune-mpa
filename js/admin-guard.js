// js/admin-guard.js
import { db } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cek apakah ada sesi login aktif
    const { data: { session }, error: sessionError } = await db.auth.getSession();

    if (sessionError || !session) {
        // Jika belum login, paksa kembali ke beranda (atau halaman login)
        window.location.replace('index.html');
        return;
    }

    // 2. Cek apakah role-nya adalah 'admin'
    const userId = session.user.id;
    const { data, error } = await db
        .from('players')
        .select('role')
        .eq('user_id', userId)
        .single();

    if (error || !data || data.role !== 'admin') {
        // Jika ada pemain iseng yang mengetik URL manual, kita tindak tegas!
        
        // 1. Keluarkan (Logout) akun mereka secara paksa
        await db.auth.signOut(); 
        
        // 2. Lempar kembali ke pintu masuk admin tanpa pesan peringatan (agar mereka bingung)
        window.location.replace('admin-login.html');
        return;
    }
    // Jika sampai di baris ini, berarti dia adalah Admin yang sah!
    console.log("Akses Admin Diberikan.");
});