# 🎨 Frontend - WhatsApp Sender UI (v2.2)

Antarmuka pengguna berbasis **React.js** yang dirancang untuk kecepatan dan kemudahan penggunaan. Versi ini telah dioptimasi secara khusus untuk menangani daftar kontak dalam jumlah besar tanpa mengorbankan responsivitas UI.

## ⚡ Fitur Utama & Optimasi

* **Zero-Lag Input**: Menggunakan kombinasi `useRef` dan `useCallback` untuk memastikan pengetikan pesan utama tidak menyebabkan render ulang pada tabel kontak yang berat.
* **Smart Filtering**: Pencarian kontak dan grup secara *real-time* yang efisien menggunakan `useMemo`.
* **Responsive Design**: Dibangun dengan **React-Bootstrap** untuk tampilan yang bersih dan kompatibel di berbagai ukuran layar.
* **Atomic State Tracking**: Pelacakan status loading (`sending`) per baris tabel, sehingga pengguna tahu persis pesan mana yang sedang diproses.

---

## 🏗️ State Management & Performance Hooks

Aplikasi ini menggunakan React Hooks modern untuk efisiensi maksimal:

* **`useMemo`**: Digunakan untuk memproses `filteredContacts` dan `filteredGroups`. Pencarian hanya dihitung ulang jika kata kunci atau data sumber berubah.
* **`useCallback`**: Menstabilkan referensi fungsi `sendMessage` dan `handleSelect` agar komponen tabel yang di-memo (`React.memo`) tidak render ulang secara sia-sia.
* **`useRef`**: Menyimpan nilai `customMessage` secara persisten untuk diambil oleh fungsi asinkron tanpa harus memicu siklus render pada setiap ketukan keyboard.

---

## 📡 Integrasi API

Komunikasi dengan backend dikelola melalui modul `api.js` menggunakan **Axios**:

* **`fetchContacts` & `fetchGroups**`: Mengambil data awal saat aplikasi dimuat.
* **`sendMessage(contact)`**: Mengirim pesan personal ke kontak tertentu dari tabel.
* **`sendBulkMessages()`**: Mengirim pesan massal ke seluruh `selectedContacts` yang telah dicentang.
* **`sendGroupMessage()`**: Mengirim pesan ke ID grup yang dipilih dari hasil pencarian grup.

---

## 🛠️ Skrip yang Tersedia

### `npm start`

Menjalankan aplikasi dalam mode pengembangan.
Akses: [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)

### `npm run build`

Membuat paket produksi yang dioptimasi di dalam folder `build/`.

---

## 📁 Struktur Komponen

* **`MessageInput.js`**: Area teks utama dengan dukungan placeholder `{nama}`.
* **`ContactTable.js`**: Tabel yang telah di-memo untuk performa tinggi dengan fitur *Select All*.
* **`GroupSender.js`**: Modul khusus untuk pencarian dan pengiriman pesan ke grup.
* **`CustomSender.js`**: Form untuk pengiriman cepat ke nomor manual.
