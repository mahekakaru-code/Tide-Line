/* ============================================================
   FIREBASE-CONFIG.JS
   Replace the values below with your own Firebase project's
   config (Project settings > General > Your apps > SDK setup).
   See README.md for step-by-step setup instructions.
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAGP9gzIzH1IybZbHnxqFnlB5umebxgznE",
  authDomain: "tide-line.firebaseapp.com",
  projectId: "tide-line",
  storageBucket: "tide-line.firebasestorage.app",
  messagingSenderId: "1034513924524",
  appId: "1:1034513924524:web:6a8e979ecc2d5035d5fa09",
  measurementId: "G-XF4MRJTCF2"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
