// index.js

// 1. Impor library yang diperlukan
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// 2. Buat instance klien WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

// 3. Tangani event 'qr'
client.on('qr', (qr) => {
    // Tampilkan QR code di terminal
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

// 4. Tangani event 'ready'
client.on('ready', () => {
    console.log('Client is ready!');
});

// 5. Tangani event 'message'
client.on('message', message => {
    // Respon otomatis jika menerima pesan
    if(message.body === '!ping') {
        message.reply('pong');
    }
});

// 6. Mulai klien
client.initialize();