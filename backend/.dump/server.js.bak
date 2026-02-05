// backend/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true, // Set ke false jika ingin melihat prosesnya (membantu debug)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        // Menghindari error navigasi pada versi chrome baru
        bypassCSP: true, 
    }
});

client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Klien WhatsApp siap!');
});

app.get('/api/contacts', (req, res) => {
    try {
        const contactsPath = path.resolve(__dirname, 'data/contact.json');
        const contactsData = fs.readFileSync(contactsPath, 'utf8');
        const contacts = JSON.parse(contactsData);
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: 'Gagal membaca file kontak.' });
    }
});

app.get('/api/groups', (req, res) => {
    try {
        const groupsPath = path.resolve(__dirname, 'data/group.json');
        const groupsData = fs.readFileSync(groupsPath, 'utf8');
        const groups = JSON.parse(groupsData);
        res.json(groups);
    } catch (error) {
        console.error('Error membaca file grup:', error.message);
        res.status(500).json({ error: 'Gagal membaca file grup.' });
    }
});
// Tips Pro: Ambil Daftar Kontak Langsung dari WA
app.get('/api/fetch-wa-contacts', async (req, res) => {
    if (!client.info) {
        return res.status(503).json({ success: false, message: 'WhatsApp belum siap.' });
    }

    try {
        const allContacts = await client.getContacts();
        
        // Filter: Hanya ambil kontak yang ada di buku telepon (isMyContact) 
        // dan bukan grup/nomor resmi WA (id.server === 'c.us')
        const filtered = allContacts
            .filter(c => c.isMyContact && c.id.server === 'c.us' && !c.isGroup)
            .map(c => ({
                nomor: c.number,
                nama: c.name || c.pushname || 'Tanpa Nama',
                gender: 'laki' // WA tidak menyediakan data gender, jadi kita beri default
            }));

        res.json(filtered);
    } catch (error) {
        console.error('Gagal fetch kontak WA:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Tips Pro: Ambil Daftar Grup Langsung dari WA
app.get('/api/fetch-wa-groups', async (req, res) => {
    if (!client.info) return res.status(503).json({ message: 'WA belum siap' });
    
    try {
        const chats = await client.getChats();
        const groups = chats
            .filter(chat => chat.isGroup)
            .map(chat => ({
                id: chat.id._serialized,
                nama: chat.name
            }));
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint API untuk mengirim pesan ke satu nomor dari daftar atau nomor kustom
app.post('/api/send-message', async (req, res) => {
    // 1. Cek apakah client sudah terinisialisasi dan siap
    // client.pupPage adalah indikator apakah browser Puppeteer sudah terbuka
    if (!client.pupPage || !client.info) {
        return res.status(503).json({ 
            success: false, 
            message: 'WhatsApp belum siap. Tunggu sampai muncul pesan "Ready" di terminal.' 
        });
    }

    const { nomor, nama, gender, customNomor, customNama, customGender, message } = req.body; // Menerima `message`
    
    let targetNomor, targetNama, targetGender;

    if (customNomor) {
        targetNomor = customNomor;
        targetNama = customNama || 'Penerima';
        targetGender = customGender || 'laki';
    } else if (nomor) {
        targetNomor = nomor;
        targetNama = nama;
        targetGender = gender;
    } else {
        return res.status(400).json({ success: false, message: 'Nomor tidak boleh kosong.' });
    }

    const sapaan = targetGender.toLowerCase() === 'laki' ? 'mas' : 'mbak';
    
    // Gunakan pesan kustom jika ada, jika tidak, gunakan template default
    const pesanFinal = message ? message
        .replace(/{nama}/g, targetNama)
        .replace(/{sapaan}/g, sapaan)
        : `Halo ${sapaan} ${targetNama}! ini pesan dari Bostang di divisi IFM.`;
    
    const waNumber = `${targetNomor}@c.us`;

    try {
        const isRegistered = await client.isRegisteredUser(waNumber);
        if (isRegistered) {
            await client.sendMessage(waNumber, pesanFinal);
            console.log(`Pesan berhasil dikirim ke ${targetNama} (${targetNomor}).`);
            res.json({ success: true, message: `Pesan berhasil dikirim ke ${targetNama}.` });
        } else {
            res.status(400).json({ success: false, message: `Nomor ${targetNomor} tidak terdaftar di WhatsApp.` });
        }
    } catch (error) {
        console.error(`Gagal mengirim pesan ke ${targetNama}:`, error.message);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan.', error: error.message });
    }
});

// Endpoint API untuk mengirim pesan massal
app.post('/api/send-bulk', async (req, res) => {
    const { contacts, message } = req.body; // Menerima `message`
    const pesanBerhasil = [];
    const pesanGagal = [];

    for (const contact of contacts) {
        const sapaan = contact.gender.toLowerCase() === 'laki' ? 'mas' : 'mbak';

        // Gunakan pesan kustom jika ada, jika tidak, gunakan template default
        const pesanFinal = message ? message
            .replace(/{nama}/g, contact.nama)
            .replace(/{sapaan}/g, sapaan)
            : `Halo ${sapaan} ${contact.nama}! ini pesan dari Bostang di divisi IFM.`;

        const number = `${contact.nomor}@c.us`;

        try {
            const isRegistered = await client.isRegisteredUser(number);
            if (isRegistered) {
                await client.sendMessage(number, pesanFinal);
                console.log(`Pesan berhasil dikirim ke ${contact.nama} (${contact.nomor}).`);
                pesanBerhasil.push(contact.nama);
            } else {
                console.warn(`Nomor ${contact.nomor} tidak terdaftar di WhatsApp. Melewati...`);
                pesanGagal.push(contact.nama);
            }
        } catch (error) {
            console.error(`Gagal mengirim pesan ke ${contact.nama}:`, error.message);
            pesanGagal.push(contact.nama);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    res.json({
        success: true,
        berhasil: pesanBerhasil,
        gagal: pesanGagal,
        message: 'Proses pengiriman pesan massal selesai.'
    });
});

// Endpoint API untuk mengirim pesan ke Grup
app.post('/api/send-group', async (req, res) => {
    // Pastikan client sudah ready
    if (!client.info) {
        return res.status(503).json({ success: false, message: 'WhatsApp belum siap.' });
    }

    const { groupId, message } = req.body;

    if (!groupId || !message) {
        return res.status(400).json({ success: false, message: 'ID Grup dan pesan tidak boleh kosong.' });
    }

    try {
        // Langsung kirim ke groupId (pastikan formatnya sudah benar @g.us)
        await client.sendMessage(groupId, message);
        
        console.log(`Pesan grup berhasil dikirim ke ID: ${groupId}`);
        res.json({ success: true, message: 'Pesan grup berhasil dikirim.' });
    } catch (error) {
        console.error('Gagal mengirim pesan ke grup:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan ke grup.', error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server backend berjalan di http://localhost:${port}`);
});

client.on('authenticated', () => {
    console.log('✅ Berhasil terautentikasi!');
});

client.on('disconnected', (reason) => {
    console.log('❌ Klien terputus, alasan:', reason);
});

client.initialize();

// Agar aplikasi tidak langsung mati (crash) saat terjadi error Puppeteer
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // Aplikasi tidak akan exit, hanya log error saja
});