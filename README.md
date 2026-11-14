# Berrycert

Berrycert adalah aplikasi sertifikasi belajar berbasis browser. Konten course dan soal dimuat dari Google Sheets melalui Apps Script. Nama peserta dan hasil kelulusan disimpan di `localStorage` pada browser/perangkat peserta.

## Menjalankan

Buka `index.html` di browser modern. Untuk menjalankan lewat server lokal, gunakan misalnya `python3 -m http.server 8000`, lalu buka `http://localhost:8000`.

## Alur peserta

1. Pilih program dan masukkan nama lengkap.
2. Jawab kuis pilihan ganda. Nilai dihitung otomatis dari jawaban benar.
3. Nilai minimal mengikuti `passingScore` pada program. Peserta yang belum lulus dapat mencoba lagi.
4. Peserta yang lulus dapat melihat preview, mengunduh PNG, atau mencetak/menyimpan sebagai PDF.

## Mengubah konten

Struktur data program dan soal ditentukan oleh header pada tab `Courses` dan `Questions`. Di tab `Courses`, gunakan `visible` untuk menampilkan/menyembunyikan tema dan `active` untuk mengaktifkan kuis. `visible=TRUE` + `active=FALSE` menampilkan tema abu-abu dengan detail terbuka, tetapi tanpa akses memulai kuis. `visible=FALSE` menyembunyikan tema. Kolom `banner` menerima URL gambar yang dapat diakses publik. `format-data.js` adalah contoh data lokal dan tidak dipakai oleh UI produksi.

Jangan taruh kunci jawaban atau kredensial rahasia di frontend produksi. Siapa pun dapat melihat berkas JavaScript dan jawaban yang dikirim browser; penyimpanan lokal juga dapat diubah peserta. Model ini cocok untuk sertifikat partisipasi/pembelajaran berisiko rendah, bukan verifikasi sertifikasi berotoritas tinggi.

## Integrasi Google Sheets dan Apps Script

Berrycert UI berjalan dari repo (`index.html`, `app.js`, dan `styles.css`). `config.js` menunjuk ke URL Web App Apps Script. Apps Script hanya menjadi API: `?action=data` mengirim program dan soal tanpa kunci jawaban; `?action=grade` menilai jawaban di server. UI memakai JSONP karena Web App Apps Script tidak menyediakan CORS untuk `fetch` lintas domain.

Salin hanya `gas/Code.gs` ke file `Code.gs` di project Apps Script, yang harus terhubung ke spreadsheet berisi tab `Courses` dan `Questions`. Deploy versi baru sebagai Web app dengan akses yang sesuai untuk peserta. Setelah deploy, membuka URL `/exec` langsung akan menampilkan respons JSON. Berrycert memanggil endpoint yang sama dengan callback JSONP.

Kunci jawaban hanya dibaca fungsi server `gradeQuiz`; `getPublicData` tidak mengirimkannya ke browser. Pemanggilan JSONP mengirim ID soal dan pilihan jawaban melalui parameter URL, tanpa nama peserta; jangan gunakan untuk mengirim data pribadi. Nama dan hasil lulus tetap disimpan pada `localStorage` di domain UI Berrycert, bukan di spreadsheet. UI produksi mengambil course dan soal hanya dari Apps Script.

Catatan: penyimpanan lokal dapat dihapus atau diubah oleh pengguna. Jangan gunakan model ini untuk sertifikat yang membutuhkan verifikasi independen tanpa menambahkan mekanisme validasi.

## Penyimpanan dan sertifikat

Nama tersimpan di `localStorage` dengan kunci `berrycert.profile.v1`; hasil lulus memakai `berrycert.completions.v1`. Catatan dapat diakses kembali dari browser yang sama selama datanya tidak dihapus. Peserta sebaiknya mengunduh file sertifikat untuk arsip. Tombol PDF memakai fitur cetak browser. Preview, PNG, dan PDF dirender dari satu SVG yang sama (`certificate.js`), jadi tampilannya selalu identik. Logo ada di `logo-mark.svg` (header dan favicon) dan `logo.svg`; `apple-touch-icon.png` dan `favicon-32.png` adalah hasil ekspornya.

## Data produksi

Jangan commit data sesi/kuis yang belum disetujui atau data peserta. `format-data.js` berisi data contoh dokumentasi. Atur `.gitignore` untuk file konfigurasi privat jika nanti dipakai; jangan mengandalkan `.env` client sebagai penyimpanan rahasia.
