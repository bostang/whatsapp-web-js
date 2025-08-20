# Frontend - Aplikasi WhatsApp Web

Aplikasi frontend ini dibuat dengan **React.js** dan `react-bootstrap`. Ia menyediakan antarmuka pengguna (UI) yang interaktif untuk berinteraksi dengan server backend.

## Dependensi

- `react`: Library JavaScript untuk membangun antarmuka pengguna.
- `react-dom`: Titik masuk ke DOM untuk React.
- `react-scripts`: Kumpulan skrip untuk membangun dan menjalankan aplikasi React.
- `react-bootstrap`: Komponen Bootstrap yang dibuat khusus untuk React.
- `bootstrap`: Kerangka kerja CSS untuk desain responsif.
- `axios`: Klien HTTP berbasis *Promise* untuk membuat permintaan ke server backend.

---

## State Management

Aplikasi ini menggunakan React Hooks, khususnya `useState` dan `useEffect`, untuk mengelola state lokal.

- `contacts`: Menyimpan array data kontak yang diambil dari backend.
- `loading`: Boolean untuk mengontrol tampilan *spinner* saat data sedang dimuat.
- `sending`: Objek untuk melacak status pengiriman pesan per kontak (misalnya, `sending: { '628123...': true }`).
- `message`, `messageType`: Mengelola pesan notifikasi (sukses/gagal) dan tipe (misalnya, `success`, `danger`).
- `selectedContacts`: Menyimpan array kontak yang dipilih untuk pengiriman massal.
- `customNomor`, `customNama`, `customGender`: Menyimpan nilai input dari formulir pesan kustom.
- `customMessage`: Menyimpan teks pesan yang diinput pengguna untuk kustomisasi.

---

## Fungsi Asinkron

Aplikasi ini menggunakan `async/await` untuk menangani panggilan API.

- `fetchContacts()`:
  - Membuat permintaan `GET` ke `/api/contacts`.
  - Memperbarui state `contacts` dengan data yang diterima.
  - Menangani error jika gagal mengambil data.

- `sendMessage(contact)`:
  - Menerima objek `contact` sebagai argumen.
  - Membuat permintaan `POST` ke `/api/send-message`.
  - Mengirim objek `contact` dan `customMessage` di *body request*.
  - Memperbarui state `sending` untuk menampilkan *spinner* pada tombol yang relevan.

- `sendCustomMessage()`:
  - Membuat permintaan `POST` ke `/api/send-message`.
  - Mengirim data dari input kustom (`customNomor`, `customNama`, `customGender`, `customMessage`) di *body request*.
  - Menangani validasi format nomor telepon.

- `sendBulkMessages()`:
  - Membuat permintaan `POST` ke `/api/send-bulk`.
  - Mengirim array `selectedContacts` dan `customMessage` di *body request*.
  - Menampilkan pesan status yang merangkum hasil pengiriman (berhasil vs. gagal).

---

## Script yang Tersedia

Di dalam direktori ini, Anda bisa menjalankan:

### `npm start`

Menjalankan aplikasi dalam mode pengembangan. Buka [http://localhost:3000](http://localhost:3000) untuk melihatnya di browser. Halaman akan otomatis diperbarui saat Anda melakukan perubahan.

### `npm test`

Menjalankan *test runner* dalam mode interaktif.

### `npm run build`

Membangun aplikasi untuk produksi ke folder `build`. Aplikasi siap untuk di-deploy.
