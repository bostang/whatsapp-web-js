// backend/server.js

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// --- LOAD KONFIGURASI DARI FILE ---
const configPath = path.resolve(__dirname, 'data/config.json');
const aliasPath = path.resolve(__dirname, 'data/aliases.json');

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const appAliases = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));

// Ekstrak nilai dari config agar bisa digunakan langsung
const { 
    authorizedGroups, 
    authorizedUsers, 
    apiBaseUrl, 
    powerAutomateUrl,
    mirWebhookUrl 
} = config;

// Helper Logger Kustom
const log = (message, ...optionalParams) => {
    if (config.debug) {
        console.log(message, ...optionalParams);
    }
};

// Fungsi Helper untuk Resolving Alias
const resolveAppId = (input) => {
    const lowerInput = input.toLowerCase().trim();
    // Cek apakah ada di kamus, jika tidak ada gunakan input asli
    return appAliases[lowerInput] || input.toUpperCase();
};

const app = express();
const port = config.port;

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

// Menggunakan message_create menangkap pesan masuk DAN pesan yang Anda kirim sendiri
client.on('message_create', async (msg) => {
    try {
        // BARIS PENTING YANG KURANG: Ambil objek chat dulu
        const chat = await msg.getChat();
        
        const isGroupAutorized = authorizedGroups.includes(chat.id._serialized);
        const isUserAuthorized = authorizedUsers.includes(msg.from);
        
        // DEBUG LOG DETAIL (Hanya muncul jika debug: true)
        log(`--- Detail Pesan Baru ---`);
        log(`Chat Name: ${chat.name}`);           // Akan muncul Nama Grup asli
        log(`Real Chat ID: ${chat.id._serialized}`); // Gunakan ID ini untuk targetGroupId
        log(`From (LID/JID): ${msg.from}`);
        log(`Is Group: ${chat.isGroup}`);
        log(`Content: ${msg.body}`);

        
        // --- LOGIKA FORWARD LINK WARROOM DARI BOSTANG WARROOM KE MIM TRANSISI ---
        // Pastikan diletakkan di dalam client.on('message_create')
        const targetSender = '191719471603921@lid';     // bostang warroom
        const targetForwardGroup = '120363408634458826@g.us'; // mim transisi
        
        /*** EVENT LISTENER DARI BOSTANG WARROOM UNTUK DI-FORWARD KE MIM TRANSISI ***/
        if (msg.from === targetSender && msg.body.startsWith('---WARROOM---')) {
            log(`📢 Terdeteksi pesan WARROOM dari ${msg.from}. Meneruskan ke grup...`);
            
            try {
                // Meneruskan pesan asli ke grup tujuan
                await client.sendMessage(targetForwardGroup, msg.body);
                log(`✅ Pesan WARROOM berhasil diteruskan ke ${targetForwardGroup}`);
            } catch (err) {
                log(`❌ Gagal meneruskan pesan WARROOM:`, err.message);
            }
        }
        
        /*** TRIGGERING WARROOM DINAMIS ***/
        const triggerKeyword = '!wr';

        if (isGroupAutorized && msg.body.toLowerCase().startsWith(triggerKeyword)) {
            
            if (!isUserAuthorized) {
                log(`🚫 Akses ditolak untuk: ${msg.from}`);
                return;
            }

            // 1. Ambil input appId
            const parts = msg.body.split(' ');
            const rawInput = parts[1]; 

            if (!rawInput) {
                return msg.reply('❌ Masukkan kode atau alias aplikasi. Contoh: !wr wondr');
            }

            const appId = resolveAppId(rawInput);

            // 2. LOGIKA MAPPING NOMOR (LID ke MSISDN)
            const userMapping = {
                "25688367223015:48": "6289651524904",
                // Anda bisa menambah mapping rekan lain di sini jika diperlukan
                // "ID_LID_LAIN": "NOMOR_HP_LAIN"
            };

            // Ambil ID mentah pengirim (tanpa @lid atau @c.us)
            const rawSenderId = (msg.author || msg.from).split('@')[0];
            
            // Cek apakah ada di mapping, jika tidak gunakan ID asli
            const senderNumber = userMapping[rawSenderId] || rawSenderId;

            log(`🚀 Memicu Warroom untuk App ID: ${appId} | Sender: ${senderNumber}`);

            try {
                const payload = {
                    "app_id": appId,
                    "create_mir": false,
                    "create_meeting": true,
                    "create_post": false,
                    "send_email": true,
                    "phone_sender": `+${senderNumber}` // Format +62...
                };

                const response = await axios.post(powerAutomateUrl, payload);

                log('✅ Response Power Automate:', response.status);

                if (response.status === 202 || response.status === 200) {
                    await msg.reply(`✅ Instruksi Warroom untuk *${appId}* telah diteruskan ke Power Automate.\n(Pengirim: +${senderNumber})`);
                }
            } catch (error) {
                log('❌ Gagal memicu Power Automate:', error.message);
                await msg.reply('⚠️ Terjadi kesalahan saat menghubungi server Power Automate.');
            }
        }

        // Memeriksa apakah pesan dimulai dengan !pic
        if (isGroupAutorized && msg.body.toLowerCase().startsWith('!pic ')) {
            if (!isUserAuthorized) {
                log(`🚫 Akses ditolak untuk: ${msg.from}`);
                return; // Berhenti di sini, tidak memicu Power Automate
            }
            
            const rawInput = msg.body.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Masukkan kode atau alias aplikasi. Contoh: !pic bifast');
            
            const appId = resolveAppId(rawInput);

            if (!appId) return msg.reply('❌ Masukkan kode aplikasi. Contoh: !pic APP01');

            try {
                // Melakukan hit ke dua endpoint sekaligus
                const [appRes, picsRes] = await Promise.all([
                    axios.get(`${apiBaseUrl}/api/apps/${appId}`),
                    axios.get(`${apiBaseUrl}/api/apps/${appId}/people`)
                ]);

                const appData = appRes.data; // Mengambil detail aplikasi
                const pics = picsRes.data;    // Mengambil daftar PIC

                // Membuat header dengan Nama Aplikasi
                let replyMessage = `📋 *Daftar PIC Aplikasi ${appId} - ${appData.nama_aplikasi}*\n`;
                replyMessage += `_${appData.deskripsi_aplikasi || ''}_\n\n`;
                
                if (pics.length === 0) {
                    replyMessage += `⚠️ Belum ada PIC yang terdaftar untuk aplikasi ini.`;
                } else {
                    pics.forEach((pic, index) => {
                        replyMessage += `${index + 1}. *${pic.nama}*\n`;
                        replyMessage += `   Divisi: ${pic.division}\n`;
                        replyMessage += `   Posisi: ${pic.posisi}\n`;
                        replyMessage += `   Phone: ${pic.phone || '-'}\n`;
                        replyMessage += `   Email: ${pic.email || '-'}\n\n`;
                    });
                }

                await msg.reply(replyMessage);

            } catch (error) {
                console.error('❌ Error hit backend:', error.message);
                if (error.response && error.response.status === 404) {
                    msg.reply(`❌ Aplikasi *${appId}* tidak ditemukan di database.`);
                } else {
                    msg.reply('⚠️ Terjadi kesalahan saat mengambil data.');
                }
            }
        }

        if (isGroupAutorized && msg.body.toLowerCase().startsWith('!link ')) {
            if (!isUserAuthorized) {
                log(`🚫 Akses !link ditolak untuk: ${msg.from}`);
                return;
            }

            const rawInput = msg.body.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Masukkan kode atau alias aplikasi. Contoh: !link bifast');
            
            const appId = resolveAppId(rawInput);

            try {
                // 1. Ambil data link dan data detail aplikasi secara paralel
                const [linksRes, appRes] = await Promise.all([
                    axios.get(`${apiBaseUrl}/api/links`),
                    axios.get(`${apiBaseUrl}/api/apps/${appId}`).catch(() => ({ data: {} })) 
                    // catch di atas agar jika app detail tidak ketemu, bot tidak crash dan tetap lanjut
                ]);

                const allLinks = linksRes.data;
                const appDetail = appRes.data;

                // 2. Cari link yang sesuai
                const appLink = allLinks.find(l => l.application_id.toUpperCase() === appId);

                if (!appLink) {
                    return msg.reply(`⚠️ Link untuk aplikasi *${appId}* tidak ditemukan.`);
                }

                // 3. Susun pesan balasan dengan Deskripsi
                let linkMessage = `🔗 *Pranala Aplikasi: ${appId} - ${appLink.nama_aplikasi}*\n`;
                
                // Tambahkan deskripsi jika tersedia
                const deskripsi = appDetail.deskripsi_aplikasi || "";
                if (deskripsi) {
                    linkMessage += `_${deskripsi}_\n`;
                }
                
                linkMessage += `\n📂 *Dokumentasi:* \n${appLink.docs_link || '-'}\n\n`;
                linkMessage += `🛡️ *Warroom:* \n${appLink.warroom_link || '-'}\n\n`;
                
                if (appLink.notes) {
                    linkMessage += `📝 *Catatan:* \n${appLink.notes}`;
                }

                await msg.reply(linkMessage);
                log(`✅ Berhasil mengirim link & deskripsi untuk ${appId}`);

            } catch (error) {
                console.error('❌ Error hit backend links:', error.message);
                msg.reply('⚠️ Terjadi kesalahan saat mengambil data link.');
            }
        }

        if (isGroupAutorized && msg.body.toLowerCase().startsWith('!docs ')) {
            if (!isUserAuthorized) {
                log(`🚫 Akses !docs ditolak untuk: ${msg.from}`);
                return;
            }

            const rawInput = msg.body.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Masukkan kode/alias. Contoh: !docs bifast');
            
            const appId = resolveAppId(rawInput);

            try {
                const [linksRes, appRes] = await Promise.all([
                    axios.get(`${apiBaseUrl}/api/links`),
                    axios.get(`${apiBaseUrl}/api/apps/${appId}`).catch(() => ({ data: {} }))
                ]);

                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);
                if (!appLink || !appLink.docs_link) {
                    return msg.reply(`⚠️ Dokumentasi untuk *${appId}* tidak ditemukan.`);
                }

                let docMessage = `📂 *Dokumentasi Aplikasi: ${appId}*\n`;
                docMessage += `*${appLink.nama_aplikasi}*\n`;
                if (appRes.data.deskripsi_aplikasi) docMessage += `_${appRes.data.deskripsi_aplikasi}_\n`;
                docMessage += `\n🔗 *Link:* \n${appLink.docs_link}`;

                await msg.reply(docMessage);
                log(`✅ Sent docs for ${appId}`);
            } catch (error) {
                msg.reply('⚠️ Terjadi kesalahan saat mengambil data dokumentasi.');
            }
        }

        if (isGroupAutorized && msg.body.toLowerCase().startsWith('!link-wr ')) {
            if (!isUserAuthorized) {
                log(`🚫 Akses !wr_link ditolak untuk: ${msg.from}`);
                return;
            }

            const rawInput = msg.body.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Masukkan kode/alias. Contoh: !wr_link bifast');
            
            const appId = resolveAppId(rawInput);

            try {
                const linksRes = await axios.get(`${apiBaseUrl}/api/links`);
                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);

                if (!appLink || !appLink.warroom_link) {
                    return msg.reply(`⚠️ Link Warroom untuk *${appId}* tidak ditemukan.`);
                }

                let wrMessage = `🛡️ *Link Warroom: ${appId}*\n`;
                wrMessage += `*${appLink.nama_aplikasi}*\n\n`;
                wrMessage += `🔗 *Join Warroom:* \n${appLink.warroom_link}`;
                
                if (appLink.notes) wrMessage += `\n\n📝 *Catatan:* \n${appLink.notes}`;

                await msg.reply(wrMessage);
                log(`✅ Sent Warroom link for ${appId}`);
            } catch (error) {
                msg.reply('⚠️ Terjadi kesalahan saat mengambil data Warroom.');
            }
        }

        /*** COMMAND !mir-info ***/
        if (isGroupAutorized && msg.body.toLowerCase().startsWith('!mir-info ')) {
            if (!isUserAuthorized) {
                log(`🚫 Akses !mir-info ditolak untuk: ${msg.from}`);
                return;
            }

            // Mengambil teks setelah "!mir-info "
            const fullInput = msg.body.substring(10).trim(); 
            
            // Memisahkan berdasarkan karakter "/"
            const [rawAppName, ...issueParts] = fullInput.split('/');
            const rawIssue = issueParts.join('/').trim(); // Jaga-jaga jika di dalam isu ada karakter / lagi

            if (!rawAppName || !rawIssue) {
                return msg.reply('❌ Format salah. Gunakan: *!mir-info nama_aplikasi/isu*\nContoh: `!mir-info core/kendala control M`');
            }

            // Resolving alias untuk nama aplikasi (opsional, agar 'wondr' tetap jadi ID asli)
            const appId = resolveAppId(rawAppName.trim());

            log(`🚀 Mengirim MIR Info untuk ${appId} - Isu: ${rawIssue}`);

            try {
                const payload = {
                    "nama_aplikasi": appId,
                    "isu": rawIssue
                };

                const response = await axios.post(mirWebhookUrl, payload);

                if (response.status === 202 || response.status === 200) {
                    await msg.reply(`✅ Informasi MIR untuk *${appId}* berhasil dikirim ke sistem.`);
                }
            } catch (error) {
                log('❌ Gagal mengirim MIR Info:', error.message);
                await msg.reply('⚠️ Terjadi kesalahan saat mengirim data MIR Info.');
            }
        }

    } catch (err) {
        // Tambahkan try-catch di dalam event agar server tidak crash jika ada pesan aneh
        console.error('❌ Error processing message:', err.message);
    }
});

client.on('qr', (qr) => {
    log('SCAN QR CODE INI MENGGUNAKAN WHATSAPP DI HP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    log('✅ Klien WhatsApp siap!');
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
            log(`Pesan berhasil dikirim ke ${targetNama} (${targetNomor}).`);
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
                log(`Pesan berhasil dikirim ke ${contact.nama} (${contact.nomor}).`);
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
        
        log(`Pesan grup berhasil dikirim ke ID: ${groupId}`);
        res.json({ success: true, message: 'Pesan grup berhasil dikirim.' });
    } catch (error) {
        console.error('Gagal mengirim pesan ke grup:', error.message);
        res.status(500).json({ success: false, message: 'Gagal mengirim pesan ke grup.', error: error.message });
    }
});

app.listen(port, () => {
    log(`Server backend berjalan di http://localhost:${port}`);
});

client.on('authenticated', () => {
    log('✅ Berhasil terautentikasi!');
});

client.on('disconnected', (reason) => {
    log('❌ Klien terputus, alasan:', reason);
});

client.initialize();

// Agar aplikasi tidak langsung mati (crash) saat terjadi error Puppeteer
process.on('unhandledRejection', (reason, p) => {
    log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // Aplikasi tidak akan exit, hanya log error saja
});