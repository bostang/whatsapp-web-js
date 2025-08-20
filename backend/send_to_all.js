// send-to-all.js

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Client is ready! Mulai mengirim pesan...');

    try {
        const contactsPath = path.resolve(__dirname, 'data/contact.json');
        const contactsData = fs.readFileSync(contactsPath, 'utf8');
        const contacts = JSON.parse(contactsData);

        for (const contact of contacts) {
            const sapaan = contact.gender.toLowerCase() === 'laki' ? 'mas' : 'mbak';
            const pesan = `Halo ${sapaan} ${contact.nama}! ini pesan dari Bostang di divisi IFM.`;
            const number = `${contact.nomor}@c.us`;

            try {
                const isRegistered = await client.isRegisteredUser(number);
                if (isRegistered) {
                    await client.sendMessage(number, pesan);
                    console.log(`✅ Pesan berhasil dikirim ke ${contact.nama} (${contact.nomor}).`);
                } else {
                    console.warn(`⚠️ Nomor ${contact.nomor} tidak terdaftar di WhatsApp. Melewati...`);
                }
            } catch (error) {
                console.error(`❌ Gagal mengirim pesan ke ${contact.nama}:`, error.message);
            }

            // Jeda 3 detik untuk menghindari deteksi spam
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('✅ Selesai mengirim pesan ke semua kontak!');

    } catch (error) {
        console.error('Terjadi kesalahan saat membaca file atau memproses:', error.message);
    } finally {
        // Keluar dari skrip setelah selesai
        client.destroy();
    }
});

client.on('authenticated', () => {
    console.log('✅ Berhasil terautentikasi!');
});

client.on('disconnected', (reason) => {
    console.log('❌ Klien terputus, alasan:', reason);
});

client.initialize();