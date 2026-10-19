// ==========================================
// 1. IMPORT DATABASE
// ==========================================
import { db, simpanSkorKeDatabase } from './supabase.js';

// ==========================================
// FUNGSI POP-UP NOTIFIKASI TOAST (JS BERSIH)
// ==========================================
function tampilkanNotifGame(pesan, tipe) {
    // Gembok Pembungkam Notifikasi jika dimatikan di profil
    if (localStorage.getItem('vocaTuneNotif') === 'mati') return;

    let container = document.getElementById('toastNotifGame');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastNotifGame';
        document.body.appendChild(container);
    }

    container.classList.remove('muncul');

    if (tipe === 'rekor') {
        container.style.backgroundColor = '#F59E0B'; // Emas
        container.innerHTML = '🏆 ' + pesan;
    } else {
        container.style.backgroundColor = '#10B981'; // Hijau
        container.innerHTML = '🔥 ' + pesan;
    }

    container.style.display = 'block';
    
    setTimeout(() => {
        container.classList.add('muncul');
    }, 50);
}

// ==========================================
// 2. AMBIL MODE & VARIABEL PERMAINAN
// ==========================================
let riwayatSoalDimaiankan = [];
let bankSoal = [];
let selectedMode = localStorage.getItem('vocaTuneMode') || 'Easy';

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

const laguSoal = new Audio();
let detikMulai = 0; 
let batasBerhenti = 30; 

// ==========================================
// 3. INISIALISASI PIXI.JS (RESPONSIF HP & DESKTOP)
// ==========================================
const gameContainer = document.getElementById('game-container');

const isHp = window.innerWidth <= 768;
const canvasWidth = isHp ? Math.min(window.innerWidth - 20, 380) : 800;
const canvasHeight = isHp ? 640 : 580;
const cardWidth = isHp ? canvasWidth - 20 : 720;
const startX = isHp ? 10 : 40;

let gameApp = new PIXI.Application({ 
    width: canvasWidth, 
    height: canvasHeight, 
    backgroundAlpha: 0, 
    resolution: window.devicePixelRatio || 2, 
    autoDensity: true, 
    antialias: true 
});
gameContainer.appendChild(gameApp.view);

const kartuHeader = new PIXI.Graphics();
kartuHeader.beginFill(0xFFFFFF); kartuHeader.lineStyle(2, 0x2b3a4a, 1); 
kartuHeader.drawRoundedRect(0, 0, cardWidth, 50, 20); kartuHeader.endFill();
kartuHeader.x = startX; kartuHeader.y = 10; gameApp.stage.addChild(kartuHeader);

const kartuSoal = new PIXI.Graphics();
kartuSoal.beginFill(0xFFFFFF); kartuSoal.lineStyle(2, 0x2b3a4a, 1); 
kartuSoal.drawRoundedRect(0, 0, cardWidth, 185, 20); kartuSoal.endFill();
kartuSoal.x = startX; kartuSoal.y = 75; gameApp.stage.addChild(kartuSoal);

const kartuBawah = new PIXI.Graphics();
kartuBawah.beginFill(0xFFFFFF); kartuBawah.lineStyle(2, 0x2b3a4a, 1); 
kartuBawah.drawRoundedRect(0, 0, cardWidth, isHp ? 350 : 270, 20); kartuBawah.endFill();
kartuBawah.x = startX; kartuBawah.y = 265; gameApp.stage.addChild(kartuBawah);

if (selectedMode === 'Medium' || selectedMode === 'Hard') { kartuBawah.visible = false; }

const teksPertanyaanInfo = new PIXI.Text('⏳ Sedang Memuat...', { fontFamily: 'Nunito', fontSize: isHp ? 13 : 16, fill: '#2b3a4a', fontWeight: 'bold' });
teksPertanyaanInfo.x = startX + 15; teksPertanyaanInfo.y = 35; teksPertanyaanInfo.anchor.set(0, 0.5); gameApp.stage.addChild(teksPertanyaanInfo);

const teksSkorInfo = new PIXI.Text('Skor: ' + skorSaatIni, { fontFamily: 'Nunito', fontSize: isHp ? 13 : 16, fill: '#2b3a4a', fontWeight: 'bold' });
teksSkorInfo.x = gameApp.screen.width / 2; teksSkorInfo.y = 35; teksSkorInfo.anchor.set(0.5); gameApp.stage.addChild(teksSkorInfo);

const teksStreakInfo = new PIXI.Text('🔥 Streak: ' + streakSaatIni, { fontFamily: 'Nunito', fontSize: isHp ? 12 : 14, fill: '#F2994A', fontWeight: 'bold' });
teksStreakInfo.x = startX + cardWidth - 15; teksStreakInfo.y = 35; teksStreakInfo.anchor.set(1, 0.5); gameApp.stage.addChild(teksStreakInfo);

const teksTimer = new PIXI.Text('Waktu: 00:00', { fontFamily: 'Nunito', fontSize: isHp ? 14 : 16, fill: '#E74C3C', fontWeight: 'bold' });
teksTimer.x = gameApp.screen.width / 2; teksTimer.y = 95; teksTimer.anchor.set(0.5); gameApp.stage.addChild(teksTimer);

const teksLabelLirik = new PIXI.Text('TEBAK LIRIKNYA!', { fontFamily: 'Nunito', fontSize: isHp ? 14 : 16, fill: '#2b3a4a', fontWeight: '900', letterSpacing: 2 });
teksLabelLirik.x = gameApp.screen.width / 2; teksLabelLirik.y = 120; teksLabelLirik.anchor.set(0.5); gameApp.stage.addChild(teksLabelLirik);

const teksLirik = new PIXI.Text('Tunggu sebentar...', { fontFamily: 'Nunito', fontSize: isHp ? 13 : 16, fill: '#64748b', fontWeight: 'bold' });
teksLirik.x = gameApp.screen.width / 2; teksLirik.y = 170; teksLirik.anchor.set(0.5); gameApp.stage.addChild(teksLirik);

// ==========================================
// PLAYER AUDIO VISUAL
// ==========================================
const playX = startX + (isHp ? 30 : 45);

const tombolPlayBulat = new PIXI.Graphics();
tombolPlayBulat.beginFill(0xF4D03F); 
tombolPlayBulat.lineStyle(2, 0x2b3a4a, 1); 
tombolPlayBulat.drawCircle(0, 0, 25); 
tombolPlayBulat.endFill();
tombolPlayBulat.x = playX; 
tombolPlayBulat.y = 220; 
tombolPlayBulat.interactive = true; 
tombolPlayBulat.cursor = 'pointer'; 
gameApp.stage.addChild(tombolPlayBulat);

const ikonPlay = new PIXI.Text('▶', { fontSize: 20, fill: '#2b3a4a' });
ikonPlay.anchor.set(0.5); 
ikonPlay.x = playX; 
ikonPlay.y = 220; 
gameApp.stage.addChild(ikonPlay);

const barStartX = playX + (isHp ? 35 : 40);
const barWidth = isHp ? (cardWidth - 110) : 460;

const barAbu = new PIXI.Graphics();
barAbu.beginFill(0xE2E8F0); 
barAbu.drawRoundedRect(0, 0, barWidth, 8, 4); 
barAbu.endFill();
barAbu.x = barStartX; 
barAbu.y = 216; 
barAbu.interactive = true; 
barAbu.cursor = 'pointer'; 
gameApp.stage.addChild(barAbu);

const barKuning = new PIXI.Graphics();
barKuning.beginFill(0xF4D03F); 
barKuning.drawRoundedRect(0, 0, 0, 8, 4); 
barKuning.endFill(); 
barKuning.x = barStartX; 
barKuning.y = 216; 
gameApp.stage.addChild(barKuning);

const ikonReplay = new PIXI.Text('↺', { fontSize: 24, fill: '#64748b', fontWeight: 'bold' });
ikonReplay.anchor.set(0.5); 
ikonReplay.x = barStartX + barWidth + (isHp ? 22 : 28); 
ikonReplay.y = 220; 
ikonReplay.interactive = true; 
ikonReplay.cursor = 'pointer'; 
gameApp.stage.addChild(ikonReplay);

const teksWaktuBerjalan = new PIXI.Text('0:00', { fontFamily: 'Nunito', fontSize: 12, fill: '#64748b', fontWeight: 'bold' });
teksWaktuBerjalan.x = barStartX; 
teksWaktuBerjalan.y = 235; 
gameApp.stage.addChild(teksWaktuBerjalan);

const teksSisaWaktu = new PIXI.Text('Sisa Waktu: 0:30', { fontFamily: 'Nunito', fontSize: isHp ? 12 : 14, fill: '#2b3a4a', fontWeight: 'bold' });
teksSisaWaktu.x = barStartX + barWidth; 
teksSisaWaktu.y = 235; 
teksSisaWaktu.anchor.set(1, 0); 
gameApp.stage.addChild(teksSisaWaktu);

// ==========================================
// EFEK ANIMASI TEKS MELAYANG
// ==========================================
function munculkanTeksMelayang(posisiX, posisiY, teks, warna) {
    const teksMelayang = new PIXI.Text(teks, { fontFamily: 'Nunito', fontSize: 26, fill: warna, fontWeight: '900', dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: 0.3, dropShadowBlur: 4, dropShadowDistance: 2 });
    teksMelayang.anchor.set(0.5); teksMelayang.x = posisiX; teksMelayang.y = posisiY; gameApp.stage.addChild(teksMelayang);
    const animasiMelayang = () => {
        teksMelayang.y -= 1.5; teksMelayang.alpha -= 0.02;
        if (teksMelayang.alpha <= 0) {
            gameApp.stage.removeChild(teksMelayang); teksMelayang.destroy(); gameApp.ticker.remove(animasiMelayang);
        }
    };
    gameApp.ticker.add(animasiMelayang);
}

// ==========================================
// 4. FUNGSI TARIK DATA DARI SUPABASE
// ==========================================
let arrayTeksPilihan = []; 
let arrayKotakPilihan = []; 
let teksJudulPilihan = null;
const overlayInput = document.getElementById('medium-input-overlay');
const kotakKetik = document.getElementById('inputJawabanMedium');
const btnSubmitMedium = document.getElementById('btnSubmitMedium');

async function inisialisasiGame() {
    let rawGenre = localStorage.getItem('vocaTuneGenre');
    let selectedGenres = ['Semua'];

    try {
        if (rawGenre) {
            let parsed = JSON.parse(rawGenre);
            selectedGenres = Array.isArray(parsed) ? parsed : [parsed];
        }
    } catch (e) {
        if (rawGenre) selectedGenres = [rawGenre];
    }

    let modeDatabase = 'Mudah';
    if (selectedMode === 'Medium') modeDatabase = 'Sedang';
    if (selectedMode === 'Hard') modeDatabase = 'Sulit';

    let queryLaguModeIni = db.from('songs').select('*').eq('tingkat_kesulitan', modeDatabase);
    
    const filterSpesifik = selectedGenres.filter(g => g !== 'Semua');
    if (filterSpesifik.length > 0) {
        queryLaguModeIni = queryLaguModeIni.in('genre', filterSpesifik);
    }

    let { data: dataLagu, error } = await queryLaguModeIni;
    
    if (error || !dataLagu || dataLagu.length === 0) {
        teksPertanyaanInfo.text = "❌ Gagal memuat data!";
        teksLirik.text = `Tidak ada lagu untuk Mode ${selectedMode}!`; 
        return;
    }

    let { data: semuaLaguDenganVoca } = await db.from('songs').select('judul, vocabulary(*)');

    for (let i = dataLagu.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataLagu[i], dataLagu[j]] = [dataLagu[j], dataLagu[i]];
    }

    dataLagu = dataLagu.slice(0, 10);

    bankSoal = dataLagu.map(item => {
        let kumpulanVoca = [];
        if (semuaLaguDenganVoca) {
            semuaLaguDenganVoca.forEach(lagu => {
                if (lagu.judul.toLowerCase() === item.judul.toLowerCase() && lagu.vocabulary && lagu.vocabulary.length > 0) {
                    kumpulanVoca = kumpulanVoca.concat(lagu.vocabulary);
                }
            });
        }

        const vocaUtama = kumpulanVoca.length > 0 ? kumpulanVoca[0] : null;

        return {
            id: item.id,
            judul: item.judul,
            artis: item.artis,
            lagu: item.file_mp3, 
            detikMulai: item.detik_mulai,
            lirik: item.lirik,
            pilihan: [item.pilihan_a, item.pilihan_b, item.pilihan_c, item.pilihan_d],
            jawabanBenar: item.jawaban_benar,
            voca: vocaUtama ? {
                kata: vocaUtama.kata || '-',
                arti: vocaUtama.arti || '-',
                penjelasan: vocaUtama.penjelasan || 'Tidak ada penjelasan khusus.'
            } : { kata: '-', arti: '-', penjelasan: 'Tidak ada penjelasan khusus.' },
            daftarVoca: kumpulanVoca
        };
    });

    indeksSoal = 0;
    riwayatSoalDimaiankan = [];
    if (bankSoal.length > 0) riwayatSoalDimaiankan.push(bankSoal[0]);

    let soalPertama = bankSoal[0];
    teksPertanyaanInfo.text = '🏆 Pertanyaan 1/' + bankSoal.length;
    teksLirik.text = soalPertama.lirik;
    teksLirik.style.fill = '#2b3a4a';
    laguSoal.src = soalPertama.lagu;
    detikMulai = soalPertama.detikMulai;
    batasBerhenti = detikMulai + 30;
    laguSoal.currentTime = detikMulai;

    if (selectedMode === 'Easy') {
        if (overlayInput) overlayInput.style.display = 'none';
        
        teksJudulPilihan = new PIXI.Text('Pilihan Ganda', { fontFamily: 'Nunito', fontSize: isHp ? 16 : 18, fill: '#2b3a4a', fontWeight: 'bold' });
        teksJudulPilihan.anchor.x = 0.5; teksJudulPilihan.x = gameApp.screen.width / 2; teksJudulPilihan.y = isHp ? 285 : 295; 
        gameApp.stage.addChild(teksJudulPilihan);

        let pilihanAwal = soalPertama.pilihan;

        pilihanAwal.forEach((teks, index) => {
            let posisiX, posisiY, lebarKotak, tinggiKotak;

            if (isHp) {
                lebarKotak = gameApp.screen.width - 40; tinggiKotak = 46;
                posisiX = (gameApp.screen.width - lebarKotak) / 2; posisiY = 315 + (index * 54);
            } else {
                let kolom = index % 2; let baris = Math.floor(index / 2); 
                lebarKotak = 320; tinggiKotak = 60;
                posisiX = 70 + (kolom * 340); posisiY = 335 + (baris * 65);
            }

            let kotakTombol = new PIXI.Graphics();
            function gambarKotak(warnaIsi) {
                kotakTombol.clear(); kotakTombol.beginFill(warnaIsi); kotakTombol.lineStyle(2, 0x2b3a4a, 1);
                kotakTombol.drawRoundedRect(0, 0, lebarKotak, tinggiKotak, 30); kotakTombol.endFill();
            }
            
            gambarKotak(0xFFFFFF); 
            kotakTombol.x = posisiX; kotakTombol.y = posisiY; kotakTombol.interactive = true; kotakTombol.cursor = 'pointer';

            let tombolPilihan = new PIXI.Text(teks, { fontFamily: 'Nunito', fontSize: isHp ? 14 : 18, fill: '#2b3a4a', fontWeight: 'bold' });
            tombolPilihan.anchor.set(0.5); tombolPilihan.x = posisiX + (lebarKotak / 2); tombolPilihan.y = posisiY + (tinggiKotak / 2);

            arrayKotakPilihan.push(kotakTombol); arrayTeksPilihan.push(tombolPilihan);

            kotakTombol.on('pointerdown', () => {
                arrayKotakPilihan.forEach(kotak => kotak.interactive = false);
                let jawabanBetul = bankSoal[indeksSoal].jawabanBenar;
                
                if (tombolPilihan.text === jawabanBetul) {
                    jumlahBenar++; gambarKotak(0x2ECC71);
                    let poinDidapat = 100; if (streakSaatIni >= 3) poinDidapat += 50; skorSaatIni += poinDidapat; streakSaatIni++;
                    if (streakSaatIni > streakTertinggi) streakTertinggi = streakSaatIni;

                    munculkanTeksMelayang(tombolPilihan.x, tombolPilihan.y - 40, `+${poinDidapat}`, '#2ECC71');
                    if (streakSaatIni >= 3) munculkanTeksMelayang(tombolPilihan.x, tombolPilihan.y - 70, `🔥 COMBO!`, '#F4D03F');

                    teksSkorInfo.text = 'Skor: ' + skorSaatIni; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
                    laguSoal.pause(); sedangMain = false; setTimeout(() => { lanjutKeSoalBerikutnya(); }, 500);
                } else {
                    gambarKotak(0xE74C3C); tombolPilihan.style.fill = '#FFFFFF'; streakSaatIni = 0; 
                    teksSkorInfo.text = 'Skor: ' + skorSaatIni; teksStreakInfo.text = '🔥 Streak: ' + streakSaatIni;
                    munculkanTeksMelayang(tombolPilihan.x, tombolPilihan.y - 40, `SALAH!`, '#E74C3C');

                    let getar = 0; 
                    let animasiGetar = setInterval(() => {
                        kotakTombol.x += (getar % 2 === 0 ? 10 : -10); tombolPilihan.x += (getar % 2 === 0 ? 10 : -10); getar++;
                        if (getar > 5) {
                            clearInterval(animasiGetar); kotakTombol.x = posisiX; tombolPilihan.x = posisiX + (lebarKotak / 2);
                            setTimeout(() => {
                                gambarKotak(0xFFFFFF); tombolPilihan.style.fill = '#2b3a4a'; 
                                laguSoal.pause(); sedangMain = false; lanjutKeSoalBerikutnya();
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

    laguSoal.play(); sedangMain = true; ikonPlay.text = '⏸'; mulaiWaktuBermain();
}
// ==========================================
// 5. EVENT LISTENER AUDIO (SINKRON DENGAN KEYBOARD/HARDWARE)
// ==========================================
laguSoal.addEventListener('play', () => { 
    sedangMain = true; 
    if (typeof ikonPlay !== 'undefined' && ikonPlay) {
        ikonPlay.text = '⏸'; 
    }
    // Lapor ke OS kalau musik jalan
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
});

laguSoal.addEventListener('pause', () => { 
    sedangMain = false; 
    if (typeof ikonPlay !== 'undefined' && ikonPlay) {
        ikonPlay.text = '▶'; 
    }
    // Lapor ke OS kalau musik berhenti
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
});

// ✨ PAKSAAN UI: Ubah ikon seketika saat tombol hardware ditekan
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
        laguSoal.play();
        if (typeof ikonPlay !== 'undefined' && ikonPlay) ikonPlay.text = '⏸';
        sedangMain = true;
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        laguSoal.pause();
        if (typeof ikonPlay !== 'undefined' && ikonPlay) ikonPlay.text = '▶';
        sedangMain = false;
    });
}

tombolPlayBulat.on('pointerdown', () => { if (!sedangMain) { laguSoal.play(); } else { laguSoal.pause(); } });
ikonReplay.on('pointerdown', () => { laguSoal.currentTime = detikMulai; laguSoal.play(); });

barAbu.on('pointerdown', (event) => {
    let posisiKlikX = event.data.getLocalPosition(barAbu.parent).x - barAbu.x;
    let persentase = Math.max(0, Math.min(posisiKlikX / barWidth, 1));
    laguSoal.currentTime = detikMulai + (persentase * 30);
    if (!sedangMain) laguSoal.play();
});

laguSoal.addEventListener('timeupdate', () => {
    let waktuBerjalan = Math.max(0, Math.floor(laguSoal.currentTime - detikMulai));
    let sisaWaktu = Math.max(0, 30 - waktuBerjalan);
    teksWaktuBerjalan.text = '0:' + (waktuBerjalan < 10 ? '0' + waktuBerjalan : waktuBerjalan);
    teksSisaWaktu.text = 'Sisa Waktu: 0:' + (sisaWaktu < 10 ? '0' + sisaWaktu : sisaWaktu);
    barKuning.clear(); barKuning.beginFill(0xF4D03F); barKuning.drawRoundedRect(0, 0, barWidth * (waktuBerjalan / 30), 8, 4); barKuning.endFill();
    if (laguSoal.currentTime >= batasBerhenti) { laguSoal.pause(); laguSoal.currentTime = detikMulai; }
});

// ==========================================
// 6. LOGIKA GAMEPLAY & MODE MEDIUM/HARD
// ==========================================
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
        
        let jawabanMentah = bankSoal[indeksSoal].jawabanBenar || bankSoal[indeksSoal].voca.kata || '';
        let jawabanLirik = jawabanMentah.trim().toLowerCase();
        
        jawabanLirik = jawabanLirik.replace(/[^a-z0-9\s]/g, '').replace(/^[a-d]\s/g, ''); 
        tebakanPemain = tebakanPemain.replace(/[^a-z0-9\s]/g, '');

        let melesetLirik = cekTypo(tebakanPemain, jawabanLirik);
        
        if (melesetLirik === 0) {
            kotakKetik.style.borderColor = '#2ECC71'; kotakKetik.style.backgroundColor = '#EAFAF1'; jumlahBenar++;
            if (selectedMode === 'Hard') { totalDetikBermain += 10; updateTampilanTimer(); }
            let poinDidapat = 100; if (streakSaatIni >= 3) poinDidapat += 50; skorSaatIni += poinDidapat; streakSaatIni++;
            
            munculkanTeksMelayang(gameApp.screen.width / 2, 280, `+${poinDidapat}`, '#2ECC71');
            if (streakSaatIni >= 3) munculkanTeksMelayang(gameApp.screen.width / 2, 250, `🔥 COMBO!`, '#F4D03F');

        } else if (melesetLirik <= 2) {
            kotakKetik.style.borderColor = '#F39C12'; kotakKetik.style.backgroundColor = '#FEF9E7'; jumlahHampirBenar++;
            if (selectedMode === 'Hard') { totalDetikBermain += 5; updateTampilanTimer(); }
            let poinDidapat = 50; if (streakSaatIni >= 3) poinDidapat += 25; skorSaatIni += poinDidapat; streakSaatIni++;
            
            munculkanTeksMelayang(gameApp.screen.width / 2, 280, `+${poinDidapat} (Typo Dikit)`, '#F39C12');
            if (streakSaatIni >= 3) munculkanTeksMelayang(gameApp.screen.width / 2, 250, `🔥 COMBO!`, '#F4D03F');

        } else {
            kotakKetik.style.borderColor = '#E74C3C'; kotakKetik.style.backgroundColor = '#FDEDEC'; streakSaatIni = 0;
            if (selectedMode === 'Hard') { totalDetikBermain -= 5; if (totalDetikBermain < 0) totalDetikBermain = 0; updateTampilanTimer(); }
            munculkanTeksMelayang(gameApp.screen.width / 2, 280, `SALAH!`, '#E74C3C');
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

    riwayatSoalDimaiankan.push(bankSoal[indeksSoal]);

    let soalBaru = bankSoal[indeksSoal];
    teksPertanyaanInfo.text = '🏆 Pertanyaan ' + (indeksSoal + 1) + '/' + bankSoal.length; teksLirik.text = soalBaru.lirik;
    laguSoal.src = soalBaru.lagu; detikMulai = soalBaru.detikMulai; batasBerhenti = detikMulai + 30;
    laguSoal.currentTime = detikMulai; laguSoal.play(); sedangMain = true; ikonPlay.text = '⏸';

    if (selectedMode === 'Easy') {
        let lebarKotak = isHp ? (gameApp.screen.width - 40) : 320;
        let tinggiKotak = isHp ? 46 : 60;

        for (let i = 0; i < 4; i++) {
            arrayTeksPilihan[i].text = soalBaru.pilihan[i]; arrayTeksPilihan[i].style.fill = '#2b3a4a'; 
            arrayKotakPilihan[i].interactive = true; arrayKotakPilihan[i].clear();
            arrayKotakPilihan[i].beginFill(0xFFFFFF); arrayKotakPilihan[i].lineStyle(2, 0x2b3a4a, 1); 
            arrayKotakPilihan[i].drawRoundedRect(0, 0, lebarKotak, tinggiKotak, 30); arrayKotakPilihan[i].endFill();
        }
    } else { if (overlayInput) overlayInput.style.display = 'block'; if (kotakKetik) kotakKetik.focus(); }
    mulaiWaktuBermain();
}

function dapatkanTanggalLokal(objDate) {
    const tahun = objDate.getFullYear();
    const bulan = String(objDate.getMonth() + 1).padStart(2, '0');
    const tanggal = String(objDate.getDate()).padStart(2, '0');
    return `${tahun}-${bulan}-${tanggal}`;
}

// ==========================================
// 7. AKHIR PERMAINAN
// ==========================================
async function akhiriPermainan() {
    clearInterval(hitungMundur); 
    
    try {
        if (laguSoal && !laguSoal.paused) {
            laguSoal.pause();
        }
    } catch (err) {
        console.log("Audio dihentikan.");
    }
    
    try {
        const hasil = await simpanSkorKeDatabase(skorSaatIni, streakTertinggi);
        const skorAkhirPlusBonus = skorSaatIni + (hasil.bonus || 0);

        localStorage.setItem('matchSkorAkhir', skorAkhirPlusBonus);
        localStorage.setItem('matchStreak', streakTertinggi);
        localStorage.setItem('matchBenar', jumlahBenar);
        localStorage.setItem('matchHampir', jumlahHampirBenar);
        localStorage.setItem('matchMode', selectedMode);
        localStorage.setItem('matchRiwayatSoal', JSON.stringify(riwayatSoalDimaiankan));

        if (hasil.status === 'aman') {
            window.tampilkanNotif(`Selamat streak mu aman! +${hasil.bonus} poin`, 'success');
            setTimeout(() => { window.location.href = 'statistik.html'; }, 3500);
        } 
        else if (hasil.status === 'hancur') {
            window.tampilkanNotif(`Kamu gagal, streak hancur.`, 'peringatan');
            setTimeout(() => { window.location.href = 'statistik.html'; }, 3500);
        } 
        else if (hasil.status === 'baru') {
            window.tampilkanNotif(`Amankan poin mu hari ini! +${hasil.bonus} poin`, 'success');
            setTimeout(() => { window.location.href = 'statistik.html'; }, 3500);
        } 
        else {
            window.location.href = 'statistik.html';
        }
        
    } catch (error) {
        console.error("Gagal saat akhir permainan:", error);
        window.location.href = 'statistik.html';
    }
}

// ==========================================
// 8. KONTROL PAUSE DAN NAVIGASI KELUAR
// ==========================================
const tombolPauseGlobal = document.getElementById('navPause');
const modalPause = document.getElementById('modalPause');
const btnResumeModal = document.getElementById('btnResumeModal');
const btnMainLagiModal = document.getElementById('btnMainLagiModal');
const btnHomeDariPause = document.getElementById('btnHomePause'); 

function mainLagiOtomatis() { localStorage.setItem('vocaTuneAutoStart', 'yes'); localStorage.setItem('vocaTuneModeTerakhir', selectedMode); window.location.reload(); }
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

document.addEventListener('DOMContentLoaded', inisialisasiGame);