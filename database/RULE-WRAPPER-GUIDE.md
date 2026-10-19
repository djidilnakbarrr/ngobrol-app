# Cara menghubungkan sakelar lisensi ke data sungguhan

`database.rules.license.json` di folder ini hanya menambah path baru
(`config/licenseSwitch`) — ini AMAN digabung ke rules production kamu tanpa
risiko konflik, karena tidak menyentuh path lain.

Tapi path baru itu sendiri baru mengunci **tampilan** aplikasi (lewat
`js/license-gate.js`). Supaya **data** (chat, grup, kontak, token notifikasi,
dsb.) juga benar-benar ditolak oleh server saat lisensi off — bukan cuma
disembunyikan di layar — setiap aturan `.read` dan `.write` pada path data asli
di rules production kamu (yang tidak ikut ter-export di paket ini) perlu
dibungkus begini:

```json
"chats": {
  "$cid": {
    ".read":  "root.child('config/licenseSwitch/enabled').val() !== false && ( ATURAN_READ_ASLI_KAMU )",
    ".write": "root.child('config/licenseSwitch/enabled').val() !== false && ( ATURAN_WRITE_ASLI_KAMU )"
  }
}
```

Ganti `ATURAN_READ_ASLI_KAMU` / `ATURAN_WRITE_ASLI_KAMU` dengan ekspresi yang
SUDAH ada di rules kamu sekarang — jangan hapus, cukup tambahkan syarat baru
di depannya dengan `&&`. Lakukan ini untuk tiap top-level path yang menyimpan
data nyata: setidaknya `chats`, `groupChats`, `groups`, `contacts`, `blocked`,
`fcmTokens`, `usernames`, `ids`, `credentials`.

Kenapa Claude tidak langsung menuliskan rules lengkapnya untukmu: paket yang
diunggah hanya berisi potongan rules untuk fitur YouTube/Gemini/ids/usernames,
bukan rules lengkap untuk `chats`/`groupChats`/dll. Menebak lalu menimpa rules
itu berisiko mengunci pengguna sah atau membuka celah keamanan baru yang tidak
sengaja. Tempel potongan di atas ke SETIAP blok yang relevan di konsol
Firebase > Realtime Database > Rules milikmu, lalu terbitkan (Publish).

## Yang berubah setelah ini terpasang

- Kamu bisa mematikan SEMUA salinan aplikasi (yang memakai proyek Firebase
  ini) kapan saja, cukup set `config/licenseSwitch/enabled = false` — tidak
  perlu redeploy kode. Ini berlaku walau pembeli mengedit atau menghapus
  seluruh file JS/HTML di hosting mereka, karena keputusan "boleh akses atau
  tidak" sekarang ada di server Firebase, bukan di file yang mereka pegang.

## Yang TETAP tidak bisa dicegah (batas keras, bukan soal usaha)

- Siapa pun yang memindahkan aplikasi ke proyek Firebase MEREKA SENDIRI (ganti
  `js/firebase-config.js` ke project lain) lolos sepenuhnya dari sakelar ini,
  karena mereka tidak lagi memakai database kamu. Tidak ada kode sisi klien,
  sekuat apa pun, yang bisa mencegah seseorang mengganti konfigurasi backend
  di salinan yang mereka kuasai penuh.
- Siapa pun dengan akun `role:'admin'` di database kamu bisa mengubah sakelar
  ini sendiri — jaga agar hanya akun yang kamu percaya diberi role tsb.
