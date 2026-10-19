#!/usr/bin/env node
/* Naikkan versi aplikasi (js/updater.js + version.json) sekali jalan.
   Pemakaian:  node rilis.js 1.2.0 "Catatan satu" "Catatan dua" ...
   Setelah itu unggah ulang js/updater.js dan version.json ke hosting. */
const fs = require('fs');
const [ver, ...notes] = process.argv.slice(2);
if (!ver || !/^\d+(\.\d+){1,3}$/.test(ver)) { console.error('Pakai: node rilis.js <versi mis. 1.2.0> "catatan" ...'); process.exit(1); }
let html = fs.readFileSync('js/updater.js', 'utf8');
if (!/const APP_VERSION = '[^']*';/.test(html)) { console.error('APP_VERSION tidak ditemukan di js/updater.js'); process.exit(1); }
html = html.replace(/const APP_VERSION = '[^']*';/, "const APP_VERSION = '" + ver + "';");
fs.writeFileSync('js/updater.js', html);
// Semua aset lokal harus menggunakan cache-busting versi yang sama.
let index = fs.readFileSync('index.html', 'utf8');
index = index.replace(/(\?v=)\d+\.\d+\.\d+(?:\.\d+)?/g, '$1' + ver);
fs.writeFileSync('index.html', index);
const d = new Date(), p = n => String(n).padStart(2, '0');
fs.writeFileSync('version.json', JSON.stringify({ version: ver, released: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), notes }, null, 2) + '\n');
console.log('Versi ' + ver + ' siap. Deploy seluruh folder aplikasi (termasuk index.html).');
