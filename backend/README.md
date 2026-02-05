# 🛠️ WhatsApp Automation & Warroom Bridge Server

Server ini bertindak sebagai jembatan (bridge) antara sistem internal, Power Automate, dan protokol WhatsApp. Selain menyediakan REST API untuk Dashboard, server ini dilengkapi dengan **Command Listener** untuk memicu alur kerja operasional secara otomatis.

## 📦 Dependensi Utama

* **`whatsapp-web.js`**: Menjalankan engine WhatsApp Web via Puppeteer.
* **`express` & `axios**`: Framework API dan HTTP Client untuk integrasi eksternal (Power Automate).
* **`qrcode-terminal`**: Render QR Code untuk autentikasi sesi.
* **`LocalAuth`**: Menyimpan sesi secara lokal agar tidak perlu scan ulang setiap restart.

---

## 🚀 Fitur Cerdas (Command Listener)

Bot memantau pesan masuk di grup terautorisasi dan merespons perintah berikut:

### 1. Warroom Trigger (`!wr <app_id/alias>`)

Memicu alur kerja di Power Automate untuk pembuatan meeting, notifikasi email, dan pembuatan post.

* **Dinamis**: Mendukung alias (contoh: `!wr wondr` otomatis dikonversi ke ID aplikasi asli).
* **LID Mapping**: Otomatis menerjemahkan identitas WhatsApp LID ke nomor telepon MSISDN (+62...) sebelum dikirim ke payload.

### 2. Informasi Aplikasi

* **`!pic <app_id>`**: Menampilkan daftar personil (PIC) dari database backend, termasuk divisi, jabatan, dan kontak.
* **`!docs <app_id>`**: Memberikan tautan langsung ke dokumentasi teknis aplikasi.
* **`!link-wr <app_id>`**: Memberikan tautan join meeting warroom aktif untuk aplikasi tersebut.

### 3. Auto-Forwarding (Bostang Listener)

Bot secara otomatis mendeteksi pesan dengan prefix `---WARROOM---` dari pengirim tertentu (`bostang warroom`) dan meneruskannya ke grup transisi yang ditentukan.

---

## 📂 Manajemen Data & Konfigurasi

Bot menggunakan tiga file JSON utama di folder `./data/` untuk mengatur perilakunya:

1. **`config.json`**:
* `authorizedGroups`: Daftar ID Grup yang diizinkan menjalankan perintah.
* `authorizedUsers`: Daftar ID Pengirim yang memiliki hak akses eksekusi.
* `apiBaseUrl`: Endpoint backend data aplikasi & PIC.
* `powerAutomateUrl`: Webhook trigger untuk integrasi Microsoft Power Platform.


2. **`aliases.json`**: Kamus pemetaan kata kunci (alias) ke ID aplikasi resmi (misal: `"wondr": "AFONFO0265"`).
3. **`contact.json` & `group.json**`: Database lokal untuk kebutuhan fitur broadcast via Dashboard.

---

## ⚙️ API Documentation (untuk Frontend)

### 1. Broadcast Engine

* **`POST /api/send-message`**: Kirim pesan personal dengan template `{sapaan}` & `{nama}`.
* **`POST /api/send-bulk`**: Kirim pesan massal ke daftar kontak dengan delay keamanan 3 detik.
* **`POST /api/send-group`**: Mengirim pesan pengumuman langsung ke ID Grup tertentu.

### 2. WhatsApp Utilities

* **`GET /api/fetch-wa-contacts`**: Menarik daftar kontak asli dari buku telepon WhatsApp.
* **`GET /api/fetch-wa-groups`**: Menarik daftar grup yang diikuti bot beserta JID (`@g.us`).

---

## ⚠️ Penanganan Identitas LID

Karena kebijakan privasi WhatsApp terbaru, pengirim mungkin muncul sebagai ID unik (`25688... @lid`).

* Bot telah dilengkapi dengan `userMapping` di dalam `server.js` untuk mengonversi ID LID ini kembali menjadi nomor telepon asli demi kebutuhan integrasi sistem pihak ketiga.

## 🛠️ Cara Menjalankan

1. Pastikan Node.js terinstal.
2. Jalankan `npm install`.
3. Jalankan `node server.js`.
4. Scan QR Code yang muncul di terminal.
5. Pastikan log menunjukkan `✅ Klien WhatsApp siap!`.

