const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { log } = require('../utils/helpers');

const getData = (fileName) => {
    const filePath = path.resolve(__dirname, `../../data/${fileName}`);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

module.exports = (client) => {
    // 1. Get Contacts & Groups dari JSON
    router.get('/contacts', (req, res) => {
        try { res.json(getData('contact.json')); } 
        catch (e) { res.status(500).json({ error: 'Gagal baca kontak' }); }
    });

    router.get('/groups', (req, res) => {
        try { res.json(getData('group.json')); } 
        catch (e) { res.status(500).json({ error: 'Gagal baca grup' }); }
    });

    // 2. Fetch Langsung dari WA
    router.get('/fetch-wa-contacts', async (req, res) => {
        if (!client.info) return res.status(503).json({ message: 'WA belum siap' });
        try {
            const allContacts = await client.getContacts();
            const filtered = allContacts
                .filter(c => c.isMyContact && c.id.server === 'c.us' && !c.isGroup)
                .map(c => ({ nomor: c.number, nama: c.name || c.pushname || 'Tanpa Nama', gender: 'laki' }));
            res.json(filtered);
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    router.get('/fetch-wa-groups', async (req, res) => {
        if (!client.info) return res.status(503).json({ message: 'WA belum siap' });
        try {
            const chats = await client.getChats();
            const groups = chats.filter(c => c.isGroup).map(c => ({ id: c.id._serialized, nama: c.name }));
            res.json(groups);
        } catch (error) { res.status(500).json({ error: error.message }); }
    });

    // 3. Send Message (Single)
    router.post('/send-message', async (req, res) => {
        if (!client.info) return res.status(503).json({ success: false, message: 'WA belum siap' });
        const { nomor, nama, gender, customNomor, customNama, customGender, message } = req.body;
        
        const targetNomor = customNomor || nomor;
        const targetNama = customNama || nama || 'Penerima';
        const targetGender = (customGender || gender || 'laki').toLowerCase();
        const sapaan = targetGender === 'laki' ? 'mas' : 'mbak';

        const pesanFinal = message ? message.replace(/{nama}/g, targetNama).replace(/{sapaan}/g, sapaan)
            : `Halo ${sapaan} ${targetNama}! ini pesan dari Bostang di divisi IFM.`;

        try {
            const waNumber = `${targetNomor}@c.us`;
            const isRegistered = await client.isRegisteredUser(waNumber);
            if (!isRegistered) return res.status(400).json({ success: false, message: 'Nomor tidak terdaftar' });

            await client.sendMessage(waNumber, pesanFinal);
            res.json({ success: true });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    });

    // 4. Send Bulk (Pesan Massal)
    router.post('/send-bulk', async (req, res) => {
        const { contacts, message } = req.body;
        const berhasil = []; const gagal = [];

        for (const contact of contacts) {
            try {
                const sapaan = (contact.gender || 'laki').toLowerCase() === 'laki' ? 'mas' : 'mbak';
                const pesanFinal = message.replace(/{nama}/g, contact.nama).replace(/{sapaan}/g, sapaan);
                const number = `${contact.nomor}@c.us`;
                
                if (await client.isRegisteredUser(number)) {
                    await client.sendMessage(number, pesanFinal);
                    berhasil.push(contact.nama);
                } else { gagal.push(contact.nama); }
                await new Promise(r => setTimeout(r, 3000)); // Delay 3 detik
            } catch (err) { gagal.push(contact.nama); }
        }
        res.json({ success: true, berhasil, gagal });
    });

    // 5. Send Group
    router.post('/send-group', async (req, res) => {
        const { groupId, message } = req.body;
        try {
            await client.sendMessage(groupId, message);
            res.json({ success: true });
        } catch (e) { res.status(500).json({ error: e.message }); }
    });

    return router;
};