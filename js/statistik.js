// js/statistik.js

import { bankSoal } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data skor ronde terakhir dari localStorage
    const skor = localStorage.getItem('matchSkorAkhir') || '0';
    const streak = localStorage.getItem('matchStreak') || '0';
    const benar = localStorage.getItem('matchBenar') || '0';
    const hampir = localStorage.getItem('matchHampir') || '0';

    // 2. Suntikkan ke HTML
    const teksSkorAkhir = document.getElementById('skorAkhir');
    const teksStreakAkhir = document.getElementById('streakAkhir');
    const teksJumlahBenar = document.getElementById('jumlahBenarAkhir');
    const teksJumlahHampirBenar = document.getElementById('jumlahHampirBenarAkhir');

    if(teksSkorAkhir) teksSkorAkhir.innerText = skor;
    if(teksStreakAkhir) teksStreakAkhir.innerText = streak;
    if(teksJumlahBenar) teksJumlahBenar.innerText = benar + "/10";
    if(teksJumlahHampirBenar) teksJumlahHampirBenar.innerText = hampir;

    // 3. Render Daftar Kosakata (Mock Database)
    const wadahKosakata = document.getElementById('daftarKosakata');
    
    if (wadahKosakata && bankSoal) {
        wadahKosakata.innerHTML = ''; 
        
        const jumlahDitampilkan = Math.min(10, bankSoal.length);
        
        for (let i = 0; i < jumlahDitampilkan; i++) {
            if (bankSoal[i].voca) {
                const kata = bankSoal[i].voca.kata;
                const arti = bankSoal[i].voca.arti; 
                const penjelasan = bankSoal[i].voca.penjelasan;
                
                const cardKosakata = document.createElement('div');
                cardKosakata.className = 'kosakata-item'; 
                cardKosakata.style.cssText = 'background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 10px; text-align: left;';
                
                cardKosakata.innerHTML = `
                    <div style="font-weight: 900; font-size: 16px; color: #2b3a4a; margin-bottom: 2px;">${kata}</div>
                    <div style="font-weight: 700; font-size: 14px; color: #F39C12; margin-bottom: 4px;">${arti}</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.4; font-style: italic;">${penjelasan}</div>
                `;
                
                wadahKosakata.appendChild(cardKosakata);
            }
        }
    }

    // 4. Logika Tombol di Halaman Statistik
    const btnMainLagi = document.getElementById('btnMainLagi');
    const btnKembaliHome = document.getElementById('btnKembaliHome');

    if (btnMainLagi) {
        btnMainLagi.addEventListener('click', () => {
            localStorage.setItem('vocaTuneAutoStart', 'yes');
            window.location.href = 'game.html';
        });
    }

    if (btnKembaliHome) {
        btnKembaliHome.addEventListener('click', () => {
            localStorage.removeItem('vocaTuneAutoStart');
            window.location.href = 'index.html';
        });
    }

    // ==========================================
    // 5. LOGIKA TOMBOL BGM
    // ==========================================
    const bgmAudio = document.getElementById('bgmAudio');
    const btnBgm = document.getElementById('btnBgm');
    let isPlaying = true; // Default nyala karena autoplay

    if (btnBgm && bgmAudio) {
        btnBgm.addEventListener('click', () => {
            if (isPlaying) {
                bgmAudio.pause();
                btnBgm.innerText = '🔇 Music Off';
            } else {
                bgmAudio.play();
                btnBgm.innerText = '🔊 Music On';
            }
            isPlaying = !isPlaying;
        });
    }
});