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
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Klien WhatsApp siap!');

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

    // Endpoint API untuk mengirim pesan ke satu nomor dari daftar atau nomor kustom
    app.post('/api/send-message', async (req, res) => {
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

    // app.post('/api/send-message', async (req, res) => {
    //     // Menerima data nama dan gender dari frontend
    //     const { nomor, nama, gender, customNomor, customNama, customGender } = req.body;
        
    //     let targetNomor, targetNama, targetGender;

    //     if (customNomor) {
    //         targetNomor = customNomor;
    //         targetNama = customNama || 'Penerima'; // Menggunakan nama kustom atau default
    //         targetGender = customGender || 'laki';    // Menggunakan gender kustom atau default
    //     } else if (nomor) {
    //         targetNomor = nomor;
    //         targetNama = nama;
    //         targetGender = gender;
    //     } else {
    //         return res.status(400).json({ success: false, message: 'Nomor tidak boleh kosong.' });
    //     }

    //     const sapaan = targetGender.toLowerCase() === 'laki' ? 'mas' : 'mbak';
    //     const pesan = `Halo ${sapaan} ${targetNama}! ini pesan dari Bostang di divisi IFM.`;
    //     const waNumber = `${targetNomor}@c.us`;

    //     try {
    //         const isRegistered = await client.isRegisteredUser(waNumber);
    //         if (isRegistered) {
    //             await client.sendMessage(waNumber, pesan);
    //             console.log(`Pesan berhasil dikirim ke ${targetNama} (${targetNomor}).`);
    //             res.json({ success: true, message: `Pesan berhasil dikirim ke ${targetNama}.` });
    //         } else {
    //             res.status(400).json({ success: false, message: `Nomor ${targetNomor} tidak terdaftar di WhatsApp.` });
    //         }
    //     } catch (error) {
    //         console.error(`Gagal mengirim pesan ke ${targetNama}:`, error.message);
    //         res.status(500).json({ success: false, message: 'Gagal mengirim pesan.', error: error.message });
    //     }
    // });

    // app.post('/api/send-bulk', async (req, res) => {
    //     const selectedContacts = req.body.contacts;
    //     const pesanBerhasil = [];
    //     const pesanGagal = [];

    //     for (const contact of selectedContacts) {
    //         const sapaan = contact.gender.toLowerCase() === 'laki' ? 'mas' : 'mbak';
    //         const pesan = `Halo ${sapaan} ${contact.nama}! ini pesan dari Bostang di divisi IFM.`;
    //         const number = `${contact.nomor}@c.us`;

    //         try {
    //             const isRegistered = await client.isRegisteredUser(number);
    //             if (isRegistered) {
    //                 await client.sendMessage(number, pesan);
    //                 console.log(`Pesan berhasil dikirim ke ${contact.nama} (${contact.nomor}).`);
    //                 pesanBerhasil.push(contact.nama);
    //             } else {
    //                 console.warn(`Nomor ${contact.nomor} tidak terdaftar di WhatsApp. Melewati...`);
    //                 pesanGagal.push(contact.nama);
    //             }
    //         } catch (error) {
    //             console.error(`Gagal mengirim pesan ke ${contact.nama}:`, error.message);
    //             pesanGagal.push(contact.nama);
    //         }

    //         await new Promise(resolve => setTimeout(resolve, 3000));
    //     }

    //     res.json({
    //         success: true,
    //         berhasil: pesanBerhasil,
    //         gagal: pesanGagal,
    //         message: 'Proses pengiriman pesan massal selesai.'
    //     });
    // });

    app.listen(port, () => {
        console.log(`Server backend berjalan di http://localhost:${port}`);
    });
});

client.on('authenticated', () => {
    console.log('✅ Berhasil terautentikasi!');
});

client.on('disconnected', (reason) => {
    console.log('❌ Klien terputus, alasan:', reason);
});

client.initialize();