# Proyek WhatsApp Web via JavaScript

Aplikasi web sederhana untuk mengirim pesan WhatsApp secara otomatis dan personal menggunakan JavaScript. Proyek ini terdiri dari dua bagian utama: **frontend** yang dibangun dengan React.js dan **backend** yang menggunakan Node.js dengan library `whatsapp-web.js`.

**Tampilan Frontend**:

![frontend](./img/frontend-showcase.png)

**Tampilan Backend**:

![backend](./img/backend-log.png)

## Fitur Utama

- **Pengiriman Pesan Personal**: Kirim pesan ke satu kontak dari daftar yang telah disediakan.
- **Pengiriman Pesan Massal (Bulk Send)**: Pilih dan kirim pesan ke beberapa kontak sekaligus.
- **Pengiriman Pesan Kustom**: Kirim pesan ke nomor telepon yang diinput secara manual, lengkap dengan kustomisasi nama, gender, dan isi pesan.
- **Template Pesan Dinamis**: Pesan dapat dipersonalisasi menggunakan *placeholder* seperti `{nama}` dan `{sapaan}`.
- **Otentikasi WhatsApp Web**: Menggunakan pemindaian QR code untuk menghubungkan aplikasi dengan akun WhatsApp Anda.

## Prasyarat

Sebelum menjalankan proyek, pastikan Anda telah menginstal:

- Node.js (versi 14 atau lebih tinggi)
- npm (biasanya sudah termasuk dalam instalasi Node.js)

## Cara Menjalankan Proyek

1. **Clone repositori:**

    ```bash
    git clone https://github.com/bostang/whatsapp-web-js
    ```

2. **Masuk ke direktori backend, instal dependensi, dan jalankan server:**

    ```bash
    cd whatsapp-web-js/backend
    npm install
    node server.js
    ```

    - Pindai QR code yang muncul di terminal menggunakan aplikasi WhatsApp di HP Anda.
    - Tunggu hingga muncul pesan `✅ Klien WhatsApp siap!`.

3. **Buka terminal baru, masuk ke direktori frontend, instal dependensi, dan jalankan aplikasi:**

    ```bash
    cd ../frontend
    npm install
    npm start
    ```

    - Aplikasi akan terbuka di browser Anda, biasanya di `http://localhost:3000`.

## Struktur Proyek

- `/backend`: Berisi kode sumber untuk server Node.js.
- `/frontend`: Berisi kode sumber untuk aplikasi web React.js.
- `/data`: Berisi file JSON untuk data kontak.
