/* Lapisan database: inisialisasi Firebase Realtime Database dan ekspor fungsi-fungsinya.
   Semua akses database aplikasi lewat file ini. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getDatabase, ref, push, onValue, set, update, get, remove, query, limitToLast, orderByKey, startAfter, increment, runTransaction, onChildAdded, onChildChanged, onChildRemoved
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db, firebaseConfig, ref, push, onValue, set, update, get, remove, query, limitToLast, orderByKey, startAfter, increment, runTransaction, onChildAdded, onChildChanged, onChildRemoved };
