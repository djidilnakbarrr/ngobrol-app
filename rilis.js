#!/usr/bin/env node
/* Naikkan versi aplikasi (index.html + version.json) sekali jalan.
   Pemakaian:  node rilis.js 1.2.0 "Catatan satu" "Catatan dua" ...
   Setelah itu unggah ulang index.html dan version.json ke hosting. */
const fs = require('fs');
const [ver, ...notes] = process.argv.slice(2);
if (!ver || !/^\d+(\.\d+){1,3}$/.test(ver)) { console.error('Pakai: node rilis.js <versi mis. 1.2.0> "catatan" ...'); process.exit(1); }
let html = fs.readFileSync('index.html', 'utf8');
if (!/const APP_VERSION = '[^']*';/.test(html)) { console.error('APP_VERSION tidak ditemukan di index.html'); process.exit(1); }
html = html.replace(/const APP_VERSION = '[^']*';/, "const APP_VERSION = '" + ver + "';");
fs.writeFileSync('index.html', html);
const d = new Date(), p = n => String(n).padStart(2, '0');
fs.writeFileSync('version.json', JSON.stringify({ version: ver, released: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), notes }, null, 2) + '\n');
console.log('Versi ' + ver + ' siap. Unggah index.html dan version.json.');
