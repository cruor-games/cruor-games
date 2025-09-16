/*v1.6 2025-08-28T08:26:53.478Z*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZu-da02W-5Q4gd5N7mhwx_UReEu8QSfE",
  authDomain: "seeker-ttrpg.firebaseapp.com",
  databaseURL: "https://seeker-ttrpg-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "seeker-ttrpg",
  storageBucket: "seeker-ttrpg.firebasestorage.app",
  messagingSenderId: "762210490643",
  appId: "1:762210490643:web:a2b3893b9e4cfbdc8862e6",
  measurementId: "G-F3HS8JCNLT"
};

// Inizializza l'app
const app = initializeApp(firebaseConfig);

// Servizi
const auth = getAuth(app);
const firestore = getFirestore(app);
const realtimeDB = getDatabase(app);

// Esporta (se usi moduli)
export { app, auth, firestore, realtimeDB };