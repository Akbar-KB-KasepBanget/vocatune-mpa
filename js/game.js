// ==========================================
// 1. IMPORT DATA & DATABASE
// ==========================================
import { bankSoal } from './data.js';
import { simpanSkorKeDatabase } from './supabase.js';

// ==========================================
// 2. AMBIL MODE YANG DIPILIH DARI BERANDA
// ==========================================
let selectedMode = localStorage.getItem('vocaTuneMode') || 'Easy'; // Default ke Easy jika kosong

// ==========================================
// 3. VARIABEL PERMAINAN
// ==========================================
let skorSaatIni = 0; 
let indeksSoal = 0; 
let streakSaatIni = 0; 
let jumlahBenar = 0; 
let jumlahHampirBenar = 0; 
let streakTertinggi = 0;
let totalDetikBermain = 120; 
let hitungMundur;
let sedangMain = false;
let sedangDiPause = false;
const laguSoal = new Audio(bankSoal[0].lagu);
let detikMulai = bankSoal[0].detikMulai; 
let batasBerhenti = detikMulai + 30; 
laguSoal.currentTime = detikMulai; 

// ==========================================
// 4. INISIALISASI PIXI.JS
// ==========================================
const gameContainer = document.getElementById('game-container');
let gameApp = new PIXI.Application({ width: 800, height: 580, backgroundAlpha: 0, resolution: 3, autoDensity: true, antialias: true });
gameContainer.appendChild(gameApp.view);

const kartuHeader = new PIXI.Graphics();
kartuHeader.beginFill(0xFFFFFF); kartuHeader.lineStyle(2, 0x2b3a4a, 1); kartuHeader.drawRoundedRect(0, 0, 720, 50, 20); kartuHeader.endFill();
kartuHeader.x = 40; kartuHeader.y = 10; gameApp.stage.addChild(kartuHeader);

const kartuSoal = new PIXI.Graphics();
kartuSoal.beginFill(0xFFFFFF); kartuSoal.lineStyle(2, 0x2b3a4a, 1); kartuSoal.drawRoundedRect(0, 0, 720, 185, 20); kartuSoal.endFill();
kartuSoal.x = 40; kartuSoal.y = 75; gameApp.stage.addChild(kartuSoal);

const kartuBawah = new PIXI.Graphics();
kartuBawah.beginFill(0xFFFFFF); kartuBawah.lineStyle(2, 0x2b3a4a, 1); kartuBawah.drawRoundedRect(0, 0, 720, 270, 20); kartuBawah.endFill();
kartuBawah.x = 40; kartuBawah.y = 265; gameApp.stage.addChild(kartuBawah);

if (selectedMode === 'Medium' || selectedMode === 'Hard') { kartuBawah.visible = false; }

// Teks Informasi Header
const teksPertanyaanInfo = new PIXI.Text('🏆 Pertanyaan 1/10', { fontFamily: 'Nunito', fontSize: 16, fill: '#2b3a4a', fontWeight: 'bold' });
teksPertanyaanInfo.x = 60; teksPertanyaanInfo.y = 35; teksPertanyaanInfo.anchor.set(0, 0.5); gameApp.stage.addChild(teksPertanyaanInfo);

const teksSkorInfo = new PIXI.Text('Skor: ' + skorSaatIni, { fontFamily: 'Nunito', fontSize: 16, fill: '#2b3a4a', fontWeight: 'bold' });
teksSkorInfo.x = gameApp.screen.width / 2; teksSkorInfo.y = 35; teksSkorInfo.anchor.set(0.5); gameApp.stage.addChild(teksSkorInfo);

const teksStreakInfo = new PIXI.Text('🔥 Streak: ' + streakSaatIni, { fontFamily: 'Nunito', fontSize: 14, fill: '#F2994A', fontWeight: 'bold' });
teksStreakInfo.x = 740; teksStreakInfo.y = 35; teksStreakInfo.anchor.set(1, 0.5); gameApp.stage.addChild(teksStreakInfo);

const teksTimer = new PIXI.Text('Waktu: 00:00', { fontFamily: 'Nunito', fontSize: 16, fill: '#E74C3C', fontWeight: 'bold' });
teksTimer.x = gameApp.screen.width / 2; teksTimer.y = 95; teksTimer.anchor.set(0.5); gameApp.stage.addChild(teksTimer);

// Teks Lirik Tengah
const teksLabelLirik = new PIXI.Text('TEBAK LIRIKNYA!', { fontFamily: 'Nunito', fontSize: 16, fill: '#2b3a4a', fontWeight: '900', letterSpacing: 2 });
teksLabelLirik.x = gameApp.screen.width / 2; teksLabelLirik.y = 120; teksLabelLirik.anchor.set(0.5); gameApp.stage.addChild(teksLabelLirik);

const teksLirik = new PIXI.Text(bankSoal[0].lirik, { fontFamily: 'Nunito', fontSize: 16, fill: '#2b3a4a', fontWeight: 'bold' });
teksLirik.x = gameApp.screen.width / 2; teksLirik.y = 170; teksLirik.anchor.set(0.5); gameApp.stage.addChild(teksLirik);

// Player Audio Visual
const tombolPlayBulat = new PIXI.Graphics();
tombolPlayBulat.beginFill(0xF4D03F); tombolPlayBulat.lineStyle(2, 0x2b3a4a, 1); tombolPlayBulat.drawCircle(0, 0, 25); tombolPlayBulat.endFill();
tombolPlayBulat.x = 100; tombolPlayBulat.y = 220; tombolPlayBulat.interactive = true; tombolPlayBulat.cursor = 'pointer'; gameApp.stage.addChild(tombolPlayBulat);

const ikonPlay = new PIXI.Text('▶', { fontSize: 20, fill: '#2b3a4a' });
ikonPlay.anchor.set(0.5); ikonPlay.x = 100; ikonPlay.y = 220; gameApp.stage.addChild(ikonPlay);

const ikonReplay = new PIXI.Text('↺', { fontSize: 24, fill: '#64748b', fontWeight: 'bold' });
ikonReplay.anchor.set(0.5); ikonReplay.x = 55; ikonReplay.y = 220; ikonReplay.interactive = true; ikonReplay.cursor = 'pointer'; gameApp.stage.addChild(ikonReplay);

const barAbu = new PIXI.Graphics();
barAbu.beginFill(0xE2E8F0); barAbu.drawRoundedRect(0, 0, 480, 8, 4); barAbu.endFill();
barAbu.x = 140; barAbu.y = 216; barAbu.interactive = true; barAbu.cursor = 'pointer'; gameApp.stage.addChild(barAbu);

const barKuning = new PIXI.Graphics();
barKuning.beginFill(0xF4D03F); barKuning.drawRoundedRect(0, 0, 0, 8, 4); barKuning.endFill(); barKuning.x = 140; barKuning.y = 216; gameApp.stage.addChild(barKuning);

const teksWaktuBerjalan = new PIXI.Text('0:00', { fontFamily: 'Nunito', fontSize: 12, fill: '#64748b', fontWeight: 'bold' });
teksWaktuBerjalan.x = 140; teksWaktuBerjalan.y = 235; gameApp.stage.addChild(teksWaktuBerjalan);

const teksSisaWaktu = new PIXI.Text('Sisa Waktu: 0:30', { fontFamily: 'Nunito', fontSize: 14, fill: '#2b3a4a', fontWeight: 'bold' });
teksSisaWaktu.x = 620; teksSisaWaktu.y = 235; teksSisaWaktu.anchor.set(1, 0); gameApp.stage.addChild(teksSisaWaktu);

// ==========================================
// 5. EVENT LISTENER AUDIO
// ==========================================
laguSoal.addEventListener('play', () => { sedangMain = true; ikonPlay.text = '⏸'; });
laguSoal.addEventListener('pause', () => { sedangMain = false; ikonPlay.text = '▶'; });

tombolPlayBulat.on('pointerdown', () => { if (!sedangMain) { laguSoal.play(); } else { laguSoal.pause(); } });
ikonReplay.on('pointerdown', () => { laguSoal.currentTime = detikMulai; laguSoal.play(); });

barAbu.on('pointerdown', (event) => {
    let posisiKlikX = event.data.getLocalPosition(barAbu.parent).x - barAbu.x;
    let persentase = Math.max(0, Math.min(posisiKlikX / 480, 1));
    laguSoal.currentTime = detikMulai + (persentase * 30);
    if (!sedangMain) laguSoal.play();
});

laguSoal.addEventListener('timeupdate', () => {
    let waktuBerjalan = Math.max(0, Math.floor(laguSoal.currentTime - detikMulai));
    let sisaWaktu = Math.max(0, 30 - waktuBerjalan);
    teksWaktuBerjalan.text = '0:' + (waktuBerjalan < 10 ? '0' + waktuBerjalan : waktuBerjalan);
    teksSisaWaktu.text = 'Sisa Waktu: 0:' + (sisaWaktu < 10 ? '0' + sisaWaktu : sisaWaktu);
    barKuning.clear(); barKuning.beginFill(0xF4D03F); barKuning.drawRoundedRect(0, 0, 480 * (waktuBerjalan / 30), 8, 4); barKuning.endFill();

    if (laguSoal.currentTime >= batasBerhenti) { laguSoal.pause(); laguSoal.currentTime = detikMulai; }
});

// ==========================================
// 6. LOGIKA GAMEPLAY & MODE
// ==========================================
let arrayTeksPilihan = []; let arrayKotakPilihan = []; let teksJudulPilihan = null;
const overlayInput = document.getElementById('medium-input-overlay');
const kotakKetik = document.getElementById('inputJawabanMedium');
const btnSubmitMedium = document.getElementById('btnSubmitMedium');

// Persiapan Berdasarkan Mode
if (selectedMode === 'Easy') {
    if (overlayInput) overlayInput.style.display = 'none';
    teksJudulPilihan = new PIXI.Text('Pilihan Ganda', { fontFamily: 'Nunito', fontSize: 18, fill: '#2b3a4a', fontWeight: 'bold' });
    teksJudulPilihan.anchor.x = 0.5; teksJudulPilihan.x = gameApp.screen.width / 2; teksJudulPilihan.y = 295; gameApp.stage.addChild(teksJudulPilihan);
    
    let pilihanAwal = bankSoal[indeksSoal].pilihan;
    pilihanAwal.forEach((teks, index) => {
        let kolom = index % 2; let baris = Math.floor(index / 2); let lebarKotak = 320; let tinggiKotak = 60;
        let posisiX = 70 + (kolom * 340); let posisiY = 335 + (baris * 65);
        let kotakTombol = new PIXI.Graphics();
        
        function gambarKotak(warnaIsi) {
            kotakTombol.clear(); kotakTombol.beginFill(warnaIsi); kotakTombol.lineStyle(2, 0x2b3a4a, 1);
            kotakTombol.drawRoundedRect(0, 0, lebarKotak, tinggiKotak, 30); kotakTombol.endFill();
        }
        
        gambarKotak(0xFFFFFF); kotakTombol.x = posisiX; kotakTombol.y = posisiY; kotakTombol.interactive = true; kotakTombol.cursor = 'pointer';
        let tombolPilihan = new PIXI.Text(teks, { fontFamily: 'Nunito', fontSize: 18, fill: '#2b3a4a', fontWeight: 'bold' });
        tombolPilihan.anchor.set(0.5); tombolPilihan.x = posisiX + (lebarKotak / 2); tombolPilihan.y = posisiY + (tinggiKotak / 2);
        arrayKotakPilihan.push(kotakTombol); arrayTeksPilihan.push(tombolPilihan);

        kotakTombol.on('pointerdown', () => {
            arrayKotakPilihan.forEach(kotak => kotak.interactive = false);
            let jawabanBetul = bankSoal[indeksSoal].jawabanBenar;
            
            if (tombolPilihan.text === jawabanBetul) {
                jumlahBenar++; gambarKotak(0x2ECC71);
                let poinDidapat = 100; if (streakSaatIni >= 3) poinDidapat += 50;
                skorSaatIni += poinDidapat; streakSaatIni++;
                if (streakSaatIni > streakTertinggi) streakTertinggi = streakSaatIni;

                teksSkorInfo.text = 'Skor: ' + skorSaatIni; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
                laguSoal.pause(); sedangMain = false; 
                setTimeout(() => { lanjutKeSoalBerikutnya(); }, 500);
            } else {
                gambarKotak(0xE74C3C); tombolPilihan.style.fill = '#FFFFFF'; 
                streakSaatIni = 0; teksSkorInfo.text = 'Skor: ' + skorSaatIni; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
                let getar = 0;
                let animasiGetar = setInterval(() => {
                    kotakTombol.x += (getar % 2 === 0 ? 10 : -10); tombolPilihan.x += (getar % 2 === 0 ? 10 : -10); getar++;
                    if (getar > 5) {
                        clearInterval(animasiGetar); kotakTombol.x = posisiX; tombolPilihan.x = posisiX + (lebarKotak / 2);
                        setTimeout(() => {
                            gambarKotak(0xFFFFFF); tombolPilihan.style.fill = '#2b3a4a'; laguSoal.pause(); sedangMain = false; lanjutKeSoalBerikutnya();
                        }, 500);
                    }
                }, 50);
            }
        });
        gameApp.stage.addChild(kotakTombol); gameApp.stage.addChild(tombolPilihan);
    });
} else {
    if (overlayInput) overlayInput.style.display = 'block';
    if (kotakKetik) kotakKetik.focus();
}

function cekTypo(kata1, kata2) {
    if (kata1.length === 0) return kata2.length; if (kata2.length === 0) return kata1.length;
    const matrix = []; for (let i = 0; i <= kata2.length; i++) matrix[i] = [i];
    for (let j = 0; j <= kata1.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= kata2.length; i++) {
        for (let j = 1; j <= kata1.length; j++) {
            if (kata2.charAt(i - 1) === kata1.charAt(j - 1)) { matrix[i][j] = matrix[i - 1][j - 1]; }
            else { matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)); }
        }
    } return matrix[kata2.length][kata1.length];
}

if (btnSubmitMedium && (selectedMode === 'Medium' || selectedMode === 'Hard')) {
    btnSubmitMedium.addEventListener('click', () => {
        let tebakanPemain = kotakKetik.value.trim().toLowerCase();
        let jawabanLirik = bankSoal[indeksSoal].voca.kata.toLowerCase();
        let melesetLirik = cekTypo(tebakanPemain, jawabanLirik);

        if (melesetLirik === 0) {
            kotakKetik.style.borderColor = '#2ECC71'; kotakKetik.style.backgroundColor = '#EAFAF1'; jumlahBenar++;
            if (selectedMode === 'Hard') { totalDetikBermain += 10; updateTampilanTimer(); }
            let poinDidapat = 100; if (streakSaatIni >= 3) poinDidapat += 50; skorSaatIni += poinDidapat; streakSaatIni++;
        } else if (melesetLirik <= 2) {
            kotakKetik.style.borderColor = '#F39C12'; kotakKetik.style.backgroundColor = '#FEF9E7'; jumlahHampirBenar++;
            if (selectedMode === 'Hard') { totalDetikBermain += 5; updateTampilanTimer(); }
            let poinDidapat = 50; if (streakSaatIni >= 3) poinDidapat += 25; skorSaatIni += poinDidapat; streakSaatIni++;
        } else {
            kotakKetik.style.borderColor = '#E74C3C'; kotakKetik.style.backgroundColor = '#FDEDEC'; streakSaatIni = 0;
            if (selectedMode === 'Hard') { totalDetikBermain -= 5; if (totalDetikBermain < 0) totalDetikBermain = 0; updateTampilanTimer(); }
        }
        if (streakSaatIni > streakTertinggi) streakTertinggi = streakSaatIni;
        teksSkorInfo.text = 'Skor: ' + skorSaatIni; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
        laguSoal.pause(); sedangMain = false; setTimeout(() => { resetDanLanjutModeMedium(); }, 1000);
    });
    kotakKetik.addEventListener('keypress', function (e) { if (e.key === 'Enter') { btnSubmitMedium.click(); } });
}

function resetDanLanjutModeMedium() {
    if (kotakKetik) { kotakKetik.style.borderColor = '#2b3a4a'; kotakKetik.style.backgroundColor = '#f8fafc'; kotakKetik.value = ''; }
    if (selectedMode === 'Hard' && totalDetikBermain <= 0) { akhiriPermainan(); } else { lanjutKeSoalBerikutnya(); }
}

function updateTampilanTimer() {
    let m = Math.floor(totalDetikBermain / 60); let d = totalDetikBermain % 60;
    teksTimer.text = 'Waktu: ' + (m < 10 ? '0' + m : m) + ':' + (d < 10 ? '0' + d : d);
}

function mulaiWaktuBermain() {
    clearInterval(hitungMundur);
    if (selectedMode === 'Hard') { if (indeksSoal === 0) totalDetikBermain = 60; } else { totalDetikBermain = 120; }
    updateTampilanTimer();
    hitungMundur = setInterval(() => {
        totalDetikBermain--; updateTampilanTimer();
        if (totalDetikBermain <= 0) {
            clearInterval(hitungMundur); teksTimer.text = 'Waktu Habis!'; streakSaatIni = 0; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
            laguSoal.pause(); sedangMain = false;
            setTimeout(() => { if (selectedMode === 'Hard') { akhiriPermainan(); } else { if (kotakKetik) kotakKetik.value = ''; lanjutKeSoalBerikutnya(); } }, 1000);
        }
    }, 1000);
}

function lanjutKeSoalBerikutnya() {
    indeksSoal++; if (indeksSoal >= bankSoal.length) { akhiriPermainan(); return; }
    let soalBaru = bankSoal[indeksSoal];
    teksPertanyaanInfo.text = '🏆 Pertanyaan ' + (indeksSoal + 1) + '/10'; teksLirik.text = soalBaru.lirik;
    laguSoal.src = soalBaru.lagu; detikMulai = soalBaru.detikMulai; batasBerhenti = detikMulai + 30;
    laguSoal.currentTime = detikMulai; laguSoal.play(); sedangMain = true; ikonPlay.text = '⏸';

    if (selectedMode === 'Easy') {
        for (let i = 0; i < 4; i++) {
            arrayTeksPilihan[i].text = soalBaru.pilihan[i]; arrayTeksPilihan[i].style.fill = '#2b3a4a'; arrayKotakPilihan[i].interactive = true; arrayKotakPilihan[i].clear();
            arrayKotakPilihan[i].beginFill(0xFFFFFF); arrayKotakPilihan[i].lineStyle(2, 0x2b3a4a, 1); arrayKotakPilihan[i].drawRoundedRect(0, 0, 320, 60, 30); arrayKotakPilihan[i].endFill();
        }
    } else { if (overlayInput) overlayInput.style.display = 'block'; if (kotakKetik) kotakKetik.focus(); }
    mulaiWaktuBermain();
}

// ==========================================
// 7. AKHIR PERMAINAN (VERSI MPA)
// ==========================================
async function akhiriPermainan() {
    clearInterval(hitungMundur); 
    laguSoal.pause();

    localStorage.setItem('matchSkorAkhir', skorSaatIni);
    localStorage.setItem('matchStreak', streakTertinggi);
    localStorage.setItem('matchBenar', jumlahBenar);
    localStorage.setItem('matchHampir', jumlahHampirBenar);
    
    await simpanSkorKeDatabase(skorSaatIni, streakTertinggi);

    window.location.href = 'performa.html';
}

// ==========================================
// 8. KONTROL PAUSE DAN NAVIGASI KELUAR
// ==========================================
const tombolPauseGlobal = document.getElementById('navPause');
const modalPause = document.getElementById('modalPause');
const btnResumeModal = document.getElementById('btnResumeModal');
const btnMainLagiModal = document.getElementById('btnMainLagiModal');
const btnHomeDariPause = document.getElementById('btnHomePause'); 

function mainLagiOtomatis() {
    localStorage.setItem('vocaTuneAutoStart', 'yes'); localStorage.setItem('vocaTuneModeTerakhir', selectedMode); window.location.reload();
}

if (btnMainLagiModal) { btnMainLagiModal.onclick = mainLagiOtomatis; }

if (tombolPauseGlobal) {
    tombolPauseGlobal.onclick = (event) => {
        event.preventDefault();
        if (!sedangDiPause) {
            sedangDiPause = true; clearInterval(hitungMundur); laguSoal.pause(); ikonPlay.text = '▶'; sedangMain = false;
            if (arrayKotakPilihan) arrayKotakPilihan.forEach(kotak => kotak.interactive = false);
            modalPause.style.display = 'flex';
        }
    };
}

if (btnResumeModal) {
    btnResumeModal.onclick = () => {
        sedangDiPause = false; modalPause.style.display = 'none'; laguSoal.play(); ikonPlay.text = '⏸'; sedangMain = true;
        if (arrayKotakPilihan && selectedMode === 'Easy') arrayKotakPilihan.forEach(kotak => kotak.interactive = true);
        hitungMundur = setInterval(() => {
            totalDetikBermain--; updateTampilanTimer();
            if (totalDetikBermain <= 0) {
                clearInterval(hitungMundur); teksTimer.text = 'Waktu Habis!'; streakSaatIni = 0; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
                laguSoal.pause(); ikonPlay.text = '▶'; sedangMain = false;
                setTimeout(() => { if (selectedMode === 'Hard') akhiriPermainan(); else lanjutKeSoalBerikutnya(); }, 1000);
            }
        }, 1000);
    };
}

if (btnHomeDariPause) {
    btnHomeDariPause.addEventListener('click', (e) => {
        if (e) e.preventDefault();
        localStorage.removeItem('vocaTuneAutoStart');
        clearInterval(hitungMundur);
        if (laguSoal) laguSoal.pause();
        window.location.href = 'index.html';
    });
}

// JALANKAN PERMAINAN PERTAMA KALI
laguSoal.play(); sedangMain = true; ikonPlay.text = '⏸'; mulaiWaktuBermain();