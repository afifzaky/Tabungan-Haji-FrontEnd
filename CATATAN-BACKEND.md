# Catatan untuk Backend — Penyelarasan dengan Frontend

Dokumen ini merangkum kontrak API yang **diharapkan frontend** (terutama fitur
admin manajemen nasabah) supaya alurnya tidak aneh. Beberapa kendala yang kamu
temukan memang berasal dari sisi backend — ditandai dengan **⚠️**.

Semua path relatif terhadap `NEXT_PUBLIC_API_URL` (default
`http://localhost:3000/api/v1`). Frontend mengirim header
`Authorization: Bearer <token>` pada endpoint yang butuh login.

---

## 1. Aturan kode status: 401 vs 403 ⚠️ (penting)

Frontend melakukan **auto-logout** setiap kali menerima **401** pada request
yang memakai token (dianggap sesi kedaluwarsa). Maka:

- **401 Unauthorized** → HANYA untuk token tidak ada / tidak valid / kedaluwarsa.
- **403 Forbidden** → untuk "login valid tapi tidak berhak" (mis. role NASABAH
  mengakses endpoint admin, atau admin membuka data yang dibatasi).

> Jika backend mengembalikan 401 untuk kasus "tidak berhak", admin/nasabah akan
> ter-logout tiba-tiba. Gunakan **403** untuk otorisasi.

---

## 2. Login mengembalikan role

`POST /auth/login` → body sukses harus memuat `nasabah.role` (`"NASABAH"` /
`"ADMIN"`). Frontend memakai ini untuk mengarahkan:
- `ADMIN` → `/admin/nasabah`
- `NASABAH` → `/dashboard`

(Sudah sesuai kontrak saat ini — hanya pastikan `role` selalu terisi.)

---

## 3. Format error validasi (per-field)

Untuk menampilkan pesan di bawah input, error validasi sebaiknya:

```jsonc
// 400 / 422
{
  "message": "Validasi gagal",
  "details": {
    "nik": ["NIK harus tepat 16 digit"],
    "email": ["Email sudah terdaftar"]
  }
}
```

Frontend membaca `details[field][0]`. Jika tak ada `details`, ditampilkan pesan
generik dari `message`.

---

## 4. Admin — Manajemen Nasabah

Semua endpoint di bawah butuh **role ADMIN** (kalau bukan admin → **403**).

### 4.1 List nasabah
```
GET /nasabah?limit=10&offset=0
```
Respons:
```jsonc
{ "data": [ /* Nasabah */ ], "total": 124, "limit": 10, "offset": 0 }
```
`Nasabah`: `{ id, nama, email, role, nik, nomorHp, createdAt, updatedAt }`.

### 4.2 Detail nasabah
```
GET /nasabah/:id
```
Idealnya **sertakan rekening** (dan opsional mutasi) agar halaman detail lengkap
dalam satu request:
```jsonc
{
  "id": "...", "nama": "...", "email": "...", "role": "NASABAH",
  "nik": "...", "nomorHp": "...", "createdAt": "...", "updatedAt": "...",
  "tabungan": [ /* TabunganHaji */ ],     // ⚠️ saat ini tampaknya belum disertakan
  "transaksi": [ /* Transaksi (opsional) */ ]
}
```
⚠️ **Kendala yang kamu temukan**: saat membuka detail nasabah yang sudah punya
tabungan, rekeningnya tidak muncul. Penyebabnya `GET /nasabah/:id` belum
mengembalikan `tabungan`. Dua opsi perbaikan (pilih salah satu):
- **Opsi A (disarankan):** sertakan array `tabungan` (dan `transaksi`) di respons
  detail.
- **Opsi B:** sediakan endpoint 4.5 di bawah; frontend sudah otomatis fallback
  ke sana bila `tabungan` tidak ada.

### 4.3 Buat nasabah (oleh admin)
```
POST /nasabah
{ "nik", "nama", "email", "nomorHp", "password", "role" }
```
Harus menerima field `role` (NASABAH/ADMIN). Endpoint register publik boleh
mengabaikan `role` (default NASABAH), tapi versi admin perlu menghormatinya.

### 4.4 Ubah nasabah
```
PUT /nasabah/:id
{ "nama", "email", "nomorHp", "role", "password"? }   // password opsional
```
`password` hanya dikirim bila admin mengisinya (ganti password). NIK tidak ikut
diubah.

### 4.5 Rekening milik seorang nasabah (fallback detail)
```
GET /tabungan-haji?nasabahId=:id
```
Respons: `{ "data": [ /* TabunganHaji */ ] }`. Admin boleh query rekening nasabah
mana pun. Dipakai frontend bila `GET /nasabah/:id` tidak menyertakan `tabungan`.

### 4.6 Mutasi rekening (akses admin)
```
GET /tabungan-haji/:tabunganId/mutasi?limit=5&offset=0
```
Admin perlu boleh membaca mutasi rekening nasabah mana pun (untuk panel "Mutasi
Singkat" di detail). Bila dibatasi, balas **403** (jangan 401).

---

## 5. Hapus nasabah ⚠️ (kendala foreign key)

```
DELETE /nasabah/:id   → 204 No Content (sukses)
```

⚠️ **Kendala yang kamu temukan**: nasabah yang punya tabungan tidak bisa dihapus
karena ada relasi (foreign key) ke `tabungan_haji` / `transaksi`. Tentukan
kebijakan di backend:

- **Opsi A — Cascade:** saat nasabah dihapus, hapus juga rekening & transaksinya
  (atau pakai `ON DELETE CASCADE`). Cocok bila penghapusan memang harus tuntas.
- **Opsi B — Blokir + pesan jelas (disarankan untuk data keuangan):** tolak
  penghapusan dan kembalikan **409 Conflict**:
  ```jsonc
  { "message": "Nasabah masih memiliki rekening tabungan aktif dan tidak dapat dihapus." }
  ```
  Frontend sudah menampilkan `message` ini di dalam dialog konfirmasi.
- **Opsi C — Soft delete:** tandai nonaktif (`deletedAt`) alih-alih menghapus
  baris, sehingga riwayat transaksi tetap utuh.

Apa pun pilihannya, **jangan** mengembalikan 500 mentah; pakai 409 + `message`
agar admin paham langkah berikutnya.

---

## 6. Ringkasan perilaku frontend yang bergantung pada backend

| Perilaku FE | Bergantung pada |
| --- | --- |
| Auto-logout | 401 hanya untuk token invalid |
| Redirect by role | `nasabah.role` di respons login |
| Error per-field di form | `details: { field: [pesan] }` |
| Rekening tampil di detail nasabah | `tabungan` di `GET /nasabah/:id` **atau** `GET /tabungan-haji?nasabahId=` |
| Pesan gagal hapus yang jelas | `409 + message` pada `DELETE /nasabah/:id` |

Sesuaikan path/format di backend, atau ubah pemetaannya di `lib/api.ts`
(fungsi `listNasabah`, `getNasabah`, `createNasabah`, `updateNasabah`,
`deleteNasabah`, `adminGetTabunganByNasabah`, `adminGetMutasi`).
