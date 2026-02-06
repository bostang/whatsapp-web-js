const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { log } = require('../utils/helpers');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    log('SCAN QR CODE:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => log('✅ WhatsApp Client Ready'));

module.exports = client;