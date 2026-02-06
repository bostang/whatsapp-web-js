const express = require('express');
const cors = require('cors');
const { config, log } = require('./src/utils/helpers');
const client = require('./src/services/whatsapp');
const commandHandler = require('./src/handlers/commandHandler');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Gabungkan API Routes
app.use('/api', apiRoutes(client));

// Gabungkan Bot Handler
client.on('message_create', async (msg) => {
    // Parameter 'client' harus dikirim agar commandHandler bisa sendMessage
    await commandHandler(client, msg);
});

// Event Tambahan dari kode asli
client.on('authenticated', () => log('✅ Berhasil terautentikasi!'));
client.on('disconnected', (reason) => log('❌ Klien terputus:', reason));

app.listen(config.port, () => {
    log(`🚀 Server backend berjalan di http://localhost:${config.port}`);
    client.initialize();
});

// Pencegah Crash
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});