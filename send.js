// send.js

// 1. Impor library
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// 2. Tentukan nomor dan pesan tujuan
const NOMOR_TUJUAN = '6281908186710'; // Ganti dengan nomor tujuan
const PESAN = 'Halo, nama saya Bostang!';

// 3. Buat instance klien WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

// 4. Tangani event 'qr' untuk otentikasi
client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

// 5. Tangani event 'ready' dan kirim pesan
client.on('ready', async () => {
    console.log('Client is ready!');
    
    // Periksa apakah nomor valid
    const isRegistered = await client.isRegisteredUser(NOMOR_TUJUAN);
    if (isRegistered) {
        // Jika nomor terdaftar di WhatsApp, kirim pesan
        const chat = await client.getChatById(NOMOR_TUJUAN + '@c.us');
        chat.sendMessage(PESAN);
        console.log(`Pesan berhasil dikirim ke ${NOMOR_TUJUAN}`);
    } else {
        console.log(`Nomor ${NOMOR_TUJUAN} tidak terdaftar di WhatsApp.`);
    }

    // Keluar dari skrip setelah selesai
    setTimeout(() => {
        client.destroy();
    }, 5000); // Beri waktu 5 detik untuk pesan terkirim
});

// 6. Tangani event 'authenticated' untuk konfirmasi sesi
client.on('authenticated', (session) => {
    console.log('Authenticated!');
});

// 7. Mulai klien
client.initialize();