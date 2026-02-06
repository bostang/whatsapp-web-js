// src/handlers/commandHandler.js

const axios = require('axios');
const { config, log, resolveAppId } = require('../utils/helpers');

module.exports = async (client, msg) => {
    try {
        // Ambil objek chat untuk pengecekan grup
        const chat = await msg.getChat();
        
        // 1. Identifikasi Otoritas dari config
        const isGroupAuthorized = config.authorizedGroups.includes(chat.id._serialized);
        const isUserAuthorized = config.authorizedUsers.includes(msg.from);

        // Debug log detail (hanya muncul jika debug: true di config.json)
        log(`--- Detail Pesan Baru ---`);
        log(`Chat Name: ${chat.name}`);
        log(`Real Chat ID: ${chat.id._serialized}`);
        log(`From (LID/JID): ${msg.from}`);
        log(`Content: ${msg.body}`);

        // 2. LOGIKA FORWARD OTOMATIS (Bostang Warroom -> MIM Transisi)
        const targetSender = '191719471603921@lid';
        const targetForwardGroup = '120363408634458826@g.us';

        if (msg.from === targetSender && msg.body.startsWith('---WARROOM---')) {
            log(`📢 Terdeteksi pesan WARROOM dari ${msg.from}. Meneruskan...`);
            try {
                await client.sendMessage(targetForwardGroup, msg.body);
                log(`✅ Pesan WARROOM berhasil diteruskan.`);
            } catch (err) {
                log(`❌ Gagal meneruskan pesan:`, err.message);
            }
            // Keluar dari fungsi agar pesan forward tidak diproses sebagai command lain
            return; 
        }

        // 3. FILTER: Hanya proses command jika Grup Terdaftar
        if (!isGroupAuthorized) return;

        const content = msg.body.trim();
        const lowerContent = content.toLowerCase();

        // 4. FILTER: Pengecekan User Authorized untuk semua yang diawali "!"
        if (content.startsWith('!') && !isUserAuthorized) {
            log(`🚫 Akses ditolak untuk: ${msg.from}`);
            // Opsional: msg.reply('❌ Anda tidak memiliki akses.')
            return;
        }

        // --- MULAI LOGIKA COMMAND ---

        /** * COMMAND: !wr <appId> 
         **/
        if (lowerContent.startsWith('!wr ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Masukkan kode atau alias aplikasi. Contoh: !wr wondr');

            const appId = resolveAppId(rawInput);
            
            // Logika Mapping Nomor (LID ke MSISDN)
            const userMapping = { "25688367223015:48": "6289651524904" };
            const rawSenderId = (msg.author || msg.from).split('@')[0];
            const senderNumber = userMapping[rawSenderId] || rawSenderId;

            log(`🚀 Memicu Warroom: ${appId} | Sender: ${senderNumber}`);

            try {
                const payload = {
                    "app_id": appId,
                    "create_mir": false,
                    "create_meeting": true,
                    "create_post": false,
                    "send_email": true,
                    "phone_sender": `+${senderNumber}`
                };
                const response = await axios.post(config.powerAutomateUrl, payload);
                if (response.status === 202 || response.status === 200) {
                    await msg.reply(`✅ Instruksi Warroom untuk *${appId}* telah diteruskan ke Power Automate.\n(Pengirim: +${senderNumber})`);
                }
            } catch (error) {
                log('❌ Gagal hit Power Automate:', error.message);
                await msg.reply('⚠️ Terjadi kesalahan saat menghubungi server Power Automate.');
            }
        }

        /** * COMMAND: !pic <appId> 
         **/
        else if (lowerContent.startsWith('!pic ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Contoh: !pic bifast');

            const appId = resolveAppId(rawInput);
            try {
                const [appRes, picsRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}/people`)
                ]);

                let replyMessage = `📋 *Daftar PIC Aplikasi ${appId} - ${appRes.data.nama_aplikasi}*\n`;
                replyMessage += `_${appRes.data.deskripsi_aplikasi || ''}_\n\n`;
                
                if (picsRes.data.length === 0) {
                    replyMessage += `⚠️ Belum ada PIC yang terdaftar.`;
                } else {
                    picsRes.data.forEach((pic, index) => {
                        replyMessage += `${index + 1}. *${pic.nama}*\n`;
                        replyMessage += `   Divisi: ${pic.division}\n`;
                        replyMessage += `   Phone: ${pic.phone || '-'}\n\n`;
                    });
                }
                await msg.reply(replyMessage);
            } catch (error) {
                msg.reply(error.response?.status === 404 ? `❌ Aplikasi *${appId}* tidak ditemukan.` : '⚠️ Gagal mengambil data.');
            }
        }

        /** * COMMAND: !link <appId> 
         **/
        else if (lowerContent.startsWith('!link ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Contoh: !link bifast');

            const appId = resolveAppId(rawInput);
            try {
                const [linksRes, appRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/links`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}`).catch(() => ({ data: {} }))
                ]);

                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);
                if (!appLink) return msg.reply(`⚠️ Link untuk *${appId}* tidak ditemukan.`);

                let linkMessage = `🔗 *Pranala Aplikasi: ${appId} - ${appLink.nama_aplikasi}*\n`;
                if (appRes.data.deskripsi_aplikasi) linkMessage += `_${appRes.data.deskripsi_aplikasi}_\n`;
                
                linkMessage += `\n📂 *Dokumentasi:* \n${appLink.docs_link || '-'}\n`;
                linkMessage += `🛡️ *Warroom:* \n${appLink.warroom_link || '-'}\n`;
                if (appLink.notes) linkMessage += `\n📝 *Catatan:* \n${appLink.notes}`;

                await msg.reply(linkMessage);
            } catch (error) {
                msg.reply('⚠️ Terjadi kesalahan saat mengambil data link.');
            }
        }

        /** * COMMAND: !mir-info <nama_app>/<isu> 
         **/
        else if (lowerContent.startsWith('!mir-info ')) {
            const fullInput = content.substring(10).trim(); 
            const [rawAppName, ...issueParts] = fullInput.split('/');
            const rawIssue = issueParts.join('/').trim();

            if (!rawAppName || !rawIssue) {
                return msg.reply('❌ Format salah. Gunakan: *!mir-info nama_aplikasi/isu*');
            }

            const appId = resolveAppId(rawAppName.trim());
            try {
                const response = await axios.post(config.mirWebhookUrl, {
                    "nama_aplikasi": appId,
                    "isu": rawIssue
                });
                if (response.status === 202 || response.status === 200) {
                    await msg.reply(`✅ Informasi MIR untuk *${appId}* berhasil dikirim.`);
                }
            } catch (error) {
                await msg.reply('⚠️ Terjadi kesalahan saat mengirim data MIR Info.');
            }
        }

        /** * COMMAND: !docs & !link-wr (Shortcuts)
         * Menampilkan nama aplikasi dan link spesifik
         **/
        else if (lowerContent.startsWith('!docs ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Contoh: !docs wondr');

            const appId = resolveAppId(rawInput);
            try {
                const [linksRes, appRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/links`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}`).catch(() => ({ data: {} }))
                ]);

                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);
                if (!appLink || !appLink.docs_link) return msg.reply(`⚠️ Dokumentasi *${appId}* tidak ditemukan.`);

                let docMsg = `📂 *Dokumentasi: ${appId} - ${appLink.nama_aplikasi}*\n`;
                if (appRes.data.deskripsi_aplikasi) docMsg += `_${appRes.data.deskripsi_aplikasi}_\n`;
                docMsg += `\n🔗 *Link:* ${appLink.docs_link}`;

                await msg.reply(docMsg);
            } catch (e) { 
                msg.reply('⚠️ Gagal mengambil dokumentasi.'); 
            }
        }

        else if (lowerContent.startsWith('!link-wr ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Contoh: !link-wr wondr');

            const appId = resolveAppId(rawInput);
            try {
                const [linksRes, appRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/links`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}`).catch(() => ({ data: {} }))
                ]);

                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);
                if (!appLink || !appLink.warroom_link) return msg.reply(`⚠️ Link Warroom *${appId}* tidak ditemukan.`);

                let wrMsg = `🛡️ *Warroom: ${appId} - ${appLink.nama_aplikasi}*\n`;
                if (appRes.data.deskripsi_aplikasi) wrMsg += `_${appRes.data.deskripsi_aplikasi}_\n`;
                wrMsg += `\n🔗 *Join Warroom:* ${appLink.warroom_link}`;

                await msg.reply(wrMsg);
            } catch (e) { 
                msg.reply('⚠️ Gagal mengambil link warroom.'); 
            }
        }
    } catch (err) {
        console.error('❌ Error processing message in handler:', err.message);
    }
};