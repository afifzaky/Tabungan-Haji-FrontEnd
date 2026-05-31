# BSI Tabungan Haji — Frontend

Aplikasi web (Next.js 16 + React 19 + Tailwind CSS v4) untuk membuka dan
memantau rekening Tabungan Haji: dashboard saldo, mutasi, estimasi
keberangkatan, serta halaman **Kesehatan Sistem** (`/health`).

## Prasyarat

- **Node.js 20+** dan **npm** (cek dengan `node -v` dan `npm -v`).
- Backend `tabungan-haji-api` berjalan (default di `http://localhost:3000`).

## Menjalankan dari hasil clone

```bash
# 1. Clone & masuk ke folder
git clone <url-repo> Tabungan-Haji-FrontEnd
cd Tabungan-Haji-FrontEnd

# 2. Pasang dependensi (otomatis baca package-lock.json)
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka **http://localhost:3001** di browser. Frontend berjalan di **port 3001**
(sudah dikonfigurasi di `package.json`, sengaja berbeda dari backend di 3000).

## Konfigurasi backend (opsional)

Frontend memanggil backend melalui variabel `NEXT_PUBLIC_API_URL`. Bila tidak
diset, default-nya `http://localhost:3000/api/v1`. Untuk mengubahnya, buat file
`.env.local` di root proyek:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

> Catatan: file `.env*` diabaikan git (lihat `.gitignore`), jadi aman menyimpan
> konfigurasi lokal di sini.

## Halaman tersedia

| Rute         | Keterangan                                         |
| ------------ | -------------------------------------------------- |
| `/`          | Pengalih: ke `/dashboard` bila sudah login, lainnya ke `/login` |
| `/login`     | Masuk                                              |
| `/register`  | Pendaftaran nasabah baru                           |
| `/dashboard` | Ringkasan rekening & estimasi (login, role NASABAH) |
| `/mutasi`    | Riwayat transaksi + filter & pagination (login)    |
| `/estimasi`  | Estimasi keberangkatan & analisis tabungan (login) |
| `/admin/nasabah` | Manajemen nasabah — list/cari/hapus (login, role ADMIN) |
| `/admin/nasabah/baru` | Form tambah nasabah (role ADMIN)          |
| `/admin/nasabah/[id]` | Detail nasabah & rekening (role ADMIN)    |
| `/admin/nasabah/[id]/edit` | Form edit nasabah (role ADMIN)       |
| `/health`    | Kesehatan sistem — status real-time API (publik)   |

Saat login, **role ADMIN** diarahkan ke `/admin/nasabah`, **role NASABAH** ke
`/dashboard`. Area `/admin/*` dijaga `AdminGuard` (butuh token + role ADMIN).

> **Catatan backend (admin nasabah):** halaman admin memakai endpoint REST
> standar yang diasumsikan: `GET /nasabah` (list), `GET /nasabah/:id` (detail,
> opsional menyertakan `tabungan`/`transaksi`), `POST /nasabah` (buat),
> `PUT /nasabah/:id` (ubah), `DELETE /nasabah/:id` (hapus). Bila kontrak backend
> berbeda, sesuaikan path di `lib/api.ts` (fungsi `listNasabah`, `getNasabah`,
> `createNasabah`, `updateNasabah`, `deleteNasabah`).

Halaman `/health` mem-probe endpoint `/health` backend secara langsung dari
browser, menampilkan status tiap komponen beserta latensi respons. Tombol
**Cek Ulang** menjalankan ulang pemeriksaan.

## Perintah lain

```bash
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # cek ESLint
```

## Troubleshooting

- **Port 3001 sudah dipakai** → hentikan proses yang memakai port itu, atau ubah
  `-p 3001` pada skrip `dev` di `package.json`.
- **Status di `/health` "Tidak Tersedia"** → pastikan backend menyala dan
  `NEXT_PUBLIC_API_URL` menunjuk ke alamat yang benar.
