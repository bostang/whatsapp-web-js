# 🛠️ Backend - WhatsApp Automation Server

Server ini berfungsi sebagai jembatan (bridge) antara antarmuka web dan protokol WhatsApp menggunakan library `whatsapp-web.js`. Server mengelola sesi otentikasi, memproses antrean pesan, dan menyediakan API untuk dikonsumsi oleh frontend.

## 📦 Dependensi Utama

* **`express`**: Framework inti untuk REST API.
* **`whatsapp-web.js`**: Library pembungkus (wrapper) WhatsApp Web melalui Puppeteer.
* **`qrcode-terminal`**: Digunakan untuk me-render QR Code langsung di terminal.
* **`cors`**: Mengizinkan permintaan lintas domain dari frontend React.

---

## 🚀 API Documentation

### 1. GET /api/contacts

Mengambil daftar kontak dari penyimpanan lokal.

* **Method**: `GET`
* **Endpoint**: `/api/contacts`
* **Success Response**: `200 OK` (Array of contact objects).

### 2. GET /api/groups

Mengambil daftar grup WhatsApp yang tersedia dari file `groups.json`.

* **Method**: `GET`
* **Endpoint**: `/api/groups`
* **Success Response**: `200 OK`
* **Body**:

```json
[
  { "nama": "Chit-chat BR", "id": "120363408634458826@g.us" }
]

```

### 3. POST /api/send-message

Mengirim pesan tunggal ke nomor personal atau nomor kustom.

* **Method**: `POST`
* **Body**: Mendukung objek kontak (nama, nomor, gender) dan string pesan.
* **Kustomisasi**: Otomatis mengganti `{nama}` dan `{sapaan}` (Mas/Mbak).

### 4. POST /api/send-bulk

Mengirim pesan ke banyak kontak sekaligus secara berurutan.

* **Method**: `POST`
* **Success Response**: Mengembalikan daftar nama yang `berhasil` dan `gagal`.

### 5. POST /api/send-group (NEW)

Mengirim pesan pengumuman ke grup tertentu.

* **Method**: `POST`
* **Body Request**:

```json
{
  "groupId": "120363408634458826@g.us",
  "message": "Halo semuanya, ini pesan dari dashboard."
}

```

---

## ⚙️ Logika Personalisasi Pesan

Server secara otomatis memproses isi pesan sebelum dikirim dengan aturan:

1. **`{nama}`**: Diganti dengan nama kontak.
2. **`{sapaan}`**:

* Jika gender `laki` -> **Mas**.
* Jika gender `perempuan` -> **Mbak**.

---

## 📂 Struktur Data

* **`server.js`**: Logika utama server dan inisialisasi Client WhatsApp.
* **`./data/contact.json`**: Database kontak personal.
* **`./data/groups.json`**: Database ID grup WhatsApp (untuk mendapatkan ID grup, Anda bisa melihat log terminal saat server berjalan).

## ⚠️ Catatan Penting

* Saat pertama kali menjalankan `node server.js`, Anda wajib memindai QR Code yang muncul di terminal.
* Status `Berhasil terautentikasi!` menandakan server siap menerima perintah dari frontend.
