# **WhatsApp Web JS: Pengirim Pesan Otomatis**

Proyek ini adalah skrip Node.js sederhana untuk mengirim pesan WhatsApp secara otomatis ke daftar kontak yang ditentukan dalam format JSON. Skrip ini memanfaatkan library `whatsapp-web.js` untuk berinteraksi dengan WhatsApp Web secara tersembunyi (*headless*).

![bukti-berhasil](./img/bukti-berhasil.png)
![tampilan-log](./img/tampilan-log-behasil.png)

**Fitur Utama:**

* **Pengiriman Otomatis:** Mengirim pesan ke banyak kontak secara efisien.
* **Personalisasi Pesan:** Menyesuaikan sapaan pesan (`mas`/`mbak`) berdasarkan gender yang terdaftar di data kontak.
* **Penanganan Sesi Otomatis:** Tidak perlu memindai QR *code* setiap kali skrip dijalankan setelah otentikasi pertama.
* **Pencegahan Spam:** Terdapat jeda waktu antara setiap pengiriman pesan untuk mengurangi risiko akun terdeteksi sebagai spam.

-----

## **Cara Menjalankan**

### **Persiapan Awal**

1. Pastikan Anda telah menginstal **Node.js** dan **npm** di sistem Anda.
2. Instal dependensi proyek dengan menjalankan perintah berikut di terminal:

    ```bash
    npm install whatsapp-web.js qrcode-terminal
    ```

### **Konfigurasi Kontak**

1. Buat folder bernama `data` di direktori proyek.
2. Di dalam folder `data`, buat file `contact.json` dengan format berikut. Pastikan nomor telepon ditulis tanpa awalan `+` atau spasi.

    ```json
    [
      {
        "nomor": "6281234567890",
        "gender": "laki",
        "nama": "bostang"
      },
      ...
    ]
    ```

### **Pengiriman Pesan**

Jalankan skrip dengan perintah berikut:

```bash
node send_to_all.js
```

Saat pertama kali dijalankan, sebuah QR *code* akan muncul di terminal. Pindai QR *code* tersebut menggunakan aplikasi WhatsApp di ponsel Anda (**Pengaturan \> Perangkat Tertaut \> Tautkan Perangkat**).

Setelah berhasil terhubung, skrip akan mulai mengirim pesan satu per satu ke setiap kontak.

-----

### **Peringatan**

**Mohon diperhatikan:** Penggunaan *library* ini **tidak didukung secara resmi** oleh WhatsApp dan **melanggar Ketentuan Layanan** mereka. Penggunaan skrip ini untuk tujuan komersial atau pengiriman pesan massal berisiko tinggi menyebabkan akun WhatsApp Anda diblokir. Proyek ini direkomendasikan hanya untuk tujuan edukasi, eksperimen, atau penggunaan pribadi yang sangat terbatas.
