// src/handlers/commandHandler.js

const axios = require('axios');
const { config, log, resolveAppId } = require('../utils/helpers');

module.exports = async (client, msg) => {
    try {
        const chat = await msg.getChat();
        const isGroupAuthorized = config.authorizedGroups.includes(chat.id._serialized);
        const isUserAuthorized = config.authorizedUsers.includes(msg.from);

        log(`--- Detail Pesan Baru ---`);
        log(`Chat Name: ${chat.name} | From: ${msg.from} | Content: ${msg.body}`);

        // 1. LOGIKA FORWARD OTOMATIS
        const targetSender = '191719471603921@lid';
        const targetForwardGroup = '120363408634458826@g.us';

        if (msg.from === targetSender && msg.body.startsWith('---WARROOM---')) {
            try {
                await client.sendMessage(targetForwardGroup, msg.body);
                log(`✅ Pesan WARROOM berhasil diteruskan.`);
            } catch (err) { log(`❌ Gagal meneruskan:`, err.message); }
            return; 
        }

        if (!isGroupAuthorized) return;
        const content = msg.body.trim();
        const lowerContent = content.toLowerCase();

        if (content.startsWith('!') && !isUserAuthorized) {
            log(`🚫 Akses ditolak untuk: ${msg.from}`);
            return;
        }

        // --- FUNGSI HELPER UNTUK PIC (AGAR KODE RAPI) ---
        const handlePicCommand = async (appInput, layerFilter = null) => {
            if (!appInput) return msg.reply(`❌ Masukkan kode aplikasi.`);
            
            const appId = resolveAppId(appInput);
            try {
                const [appRes, picsRes, mapRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}/people`),
                    axios.get(`${config.apiBaseUrl}/api/app-people-map`)
                ]);

                const currentAppMap = mapRes.data.filter(m => m.application_id.toUpperCase() === appId.toUpperCase());

                // 1. Gabungkan data PIC dengan Layer & Sertakan Posisi
                let combinedPics = picsRes.data.map(pic => {
                    const mapInfo = currentAppMap.find(m => m.npp === pic.npp);
                    return {
                        ...pic,
                        layer: mapInfo ? mapInfo.layer : 'Lainnya',
                        posisi: pic.posisi || '-' // Menambahkan field posisi
                    };
                });

                // 2. Filter berdasarkan layer jika user memanggil !pic-l1 dsb
                if (layerFilter) {
                    const layerMap = {
                        'l1': 'L1', 'l2': 'L2', 'l3': 'L3',
                        'business': 'Bisnis', 'surroundings': 'Surrounding', 'others': 'Others'
                    };
                    const targetLayer = layerMap[layerFilter.toLowerCase()];
                    combinedPics = combinedPics.filter(p => p.layer === targetLayer);
                }

                // 3. Header Pesan
                let replyMessage = `📋 *Daftar PIC ${layerFilter ? 'Layer: ' + layerFilter.toUpperCase() : 'Semua Layer'}*\n`;
                replyMessage += `*${appId} - ${appRes.data.nama_aplikasi}*\n`;
                replyMessage += `_${appRes.data.deskripsi_aplikasi || ''}_\n\n`;

                if (combinedPics.length === 0) {
                    replyMessage += `⚠️ Tidak ada PIC ditemukan.`;
                } else {
                    // 4. LOGIKA GROUPING
                    const layers = [...new Set(combinedPics.map(p => p.layer))]; // Ambil list layer unik
                    
                    // Urutan layer custom agar rapi
                    const priority = ['L1', 'L2', 'L3', 'Bisnis', 'Surrounding'];
                    layers.sort((a, b) => priority.indexOf(a) - priority.indexOf(b));

                    layers.forEach(layerName => {
                        const group = combinedPics.filter(p => p.layer === layerName);
                        if (group.length > 0) {
                            replyMessage += `--- *Layer: ${layerName}* ---\n`;
                            group.forEach((pic, index) => {
                                replyMessage += `${index + 1}. *${pic.nama}*\n`;
                                replyMessage += `   Posisi: ${pic.posisi}\n`; // Menampilkan posisi
                                replyMessage += `   Divisi: ${pic.division}\n`;
                                replyMessage += `   WA: ${pic.phone || '-'}\n\n`;
                            });
                            replyMessage += `--------------------------\n\n`;
                        }
                    });
                }

                await msg.reply(replyMessage);

            } catch (error) {
                console.error('Error PIC Grouping:', error.message);
                msg.reply('⚠️ Gagal mengambil atau mengelompokkan data PIC.');
            }
        };

        /**
         * FUNGSI HELPER: Mengirim link Warroom ke PIC terkait
         **/
        const handleContactCommand = async (appInput, layerFilter = null) => {
            if (!appInput) return msg.reply(`❌ Masukkan kode aplikasi. Contoh: !contact${layerFilter ? '-' + layerFilter.toLowerCase() : ''} wondr`);

            const appId = resolveAppId(appInput);
            try {
                // 1. Ambil data: Link Warroom, Daftar Orang, dan Mapping Layer
                const [linksRes, picsRes, mapRes] = await Promise.all([
                    axios.get(`${config.apiBaseUrl}/api/links`),
                    axios.get(`${config.apiBaseUrl}/api/apps/${appId}/people`),
                    axios.get(`${config.apiBaseUrl}/api/app-people-map`)
                ]);

                // 2. Cari link warroom aplikasi ini
                const appLink = linksRes.data.find(l => l.application_id.toUpperCase() === appId);
                if (!appLink || !appLink.warroom_link) {
                    return msg.reply(`⚠️ Link Warroom untuk *${appId}* tidak ditemukan di database.`);
                }

                // 3. Gabungkan data PIC dengan Layer (Data Stitching)
                const currentAppMap = mapRes.data.filter(m => m.application_id.toUpperCase() === appId);
                let targetPics = picsRes.data.map(pic => {
                    const mapInfo = currentAppMap.find(m => m.npp === pic.npp);
                    return { ...pic, layer: mapInfo ? mapInfo.layer : 'Others' };
                });

                // 4. Filter berdasarkan layer jika ada parameter (!contact-l1, dsb)
                if (layerFilter) {
                    const layerMap = {
                        'l1': 'L1', 'l2': 'L2', 'l3': 'L3',
                        'business': 'Business', 'surroundings': 'Surroundings', 'others': 'Others'
                    };
                    const targetLayer = layerMap[layerFilter.toLowerCase()];
                    targetPics = targetPics.filter(p => p.layer === targetLayer);
                }

                if (targetPics.length === 0) {
                    return msg.reply(`⚠️ Tidak ada PIC ditemukan untuk filter tersebut.`);
                }

                // 5. Eksekusi Pengiriman Pesan
                let successCount = 0;
                let failedCount = 0;

                const warroomMessage = `🚨 *UNDANGAN WARROOM*\n\n` +
                                    `Aplikasi: *${appId} - ${appLink.nama_aplikasi}*\n` +
                                    `Mohon segera bergabung melalui link berikut:\n\n` +
                                    `${appLink.warroom_link}\n\n` +
                                    `_pesan ini dikirim secara otomatis_`;

                for (const pic of targetPics) {
                    // Pastikan pic.phone ada dan dikonversi ke String
                    const rawPhone = pic.phone ? String(pic.phone).trim() : null;

                    if (rawPhone && rawPhone.length > 5) { // Validasi sederhana panjang nomor
                        try {
                            // Format nomor: hilangkan karakter non-digit dan pastikan berawalan 62
                            let cleanPhone = rawPhone.replace(/\D/g, ''); 
                            
                            if (cleanPhone.startsWith('0')) {
                                cleanPhone = '62' + cleanPhone.substring(1);
                            } else if (!cleanPhone.startsWith('62')) {
                                cleanPhone = '62' + cleanPhone;
                            }

                            const chatId = `${cleanPhone}@c.us`;
                            
                            await client.sendMessage(chatId, warroomMessage);
                            successCount++;
                            log(`✅ Terkirim ke ${pic.nama} (${chatId})`);
                        } catch (err) {
                            console.error(`❌ Gagal kirim ke ${pic.nama}:`, err.message);
                            failedCount++;
                        }
                    } else {
                        log(`⚠️ Skip ${pic.nama}: Nomor telepon tidak valid/kosong.`);
                        failedCount++;
                    }
                }

                // 6. Report balik ke grup
                let report = `✅ Selesai mengirim undangan Warroom *${appId}*.\n\n`;
                report += `📊 Status:\n`;
                report += `- Berhasil: ${successCount} PIC\n`;
                if (failedCount > 0) report += `- Gagal/No Phone: ${failedCount} PIC\n`;
                
                await msg.reply(report);

            } catch (error) {
                console.error('Error Contact Command:', error.message);
                msg.reply('⚠️ Terjadi kesalahan saat memproses perintah kontak.');
            }
        };

        // --- REGISTRASI COMMAND BARU ---
        if (lowerContent.startsWith('!contact')) {
            const parts = content.split(' ');
            const command = parts[0].toLowerCase();
            const appInput = parts[1];

            if (command === '!contact') {
                await handleContactCommand(appInput);
            } else if (command.startsWith('!contact-')) {
                const layerType = command.split('-')[1];
                await handleContactCommand(appInput, layerType);
            }
        }

        // --- LOGIKA COMMAND ---

        // Command PIC Dinamis (!pic, !pic-l1, !pic-business, dll)
        if (lowerContent.startsWith('!pic')) {
            const parts = content.split(' ');
            const command = parts[0].toLowerCase(); // e.g. !pic-l1
            const appInput = parts[1];

            if (command === '!pic') {
                await handlePicCommand(appInput);
            } else if (command.startsWith('!pic-')) {
                const layerType = command.split('-')[1]; // mengambil 'l1', 'business', dll
                await handlePicCommand(appInput, layerType);
            }
        }

        /** * COMMAND: !wr <appId> **/
        else if (lowerContent.startsWith('!wr ')) {
            const rawInput = content.split(' ')[1];
            if (!rawInput) return msg.reply('❌ Contoh: !wr wondr');
            const appId = resolveAppId(rawInput);
            const userMapping = { "25688367223015:48": "6289651524904" };
            const rawSenderId = (msg.author || msg.from).split('@')[0];
            const senderNumber = userMapping[rawSenderId] || rawSenderId;

            try {
                const payload = {
                    "app_id": appId, "create_mir": false, "create_meeting": true,
                    "create_post": false, "send_email": true, "phone_sender": `+${senderNumber}`
                };
                await axios.post(config.powerAutomateUrl, payload);
                await msg.reply(`✅ Instruksi Warroom *${appId}* diteruskan.\n(Pengirim: +${senderNumber})`);
            } catch (error) { msg.reply('⚠️ Gagal menghubungi Power Automate.'); }
        }

        /** * COMMAND: !link <appId> **/
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
                if (!appLink) return msg.reply(`⚠️ Link *${appId}* tidak ditemukan.`);

                let linkMessage = `🔗 *Pranala Aplikasi: ${appId} - ${appLink.nama_aplikasi}*\n`;
                if (appRes.data.deskripsi_aplikasi) linkMessage += `_${appRes.data.deskripsi_aplikasi}_\n`;
                linkMessage += `\n📂 *Docs:* ${appLink.docs_link || '-'}\n🛡️ *Warroom:* ${appLink.warroom_link || '-'}\n`;
                if (appLink.notes) linkMessage += `\n📝 *Notes:* ${appLink.notes}`;
                await msg.reply(linkMessage);
            } catch (error) { msg.reply('⚠️ Gagal mengambil data link.'); }
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