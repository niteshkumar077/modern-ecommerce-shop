const firebaseConfig = {
  apiKey: "AIzaSyAfgnyfq2C4vMGR9jzuUItDux02YXtUjkQ",
  authDomain: "modern-ecommerce-shop.firebaseapp.com",
  projectId: "modern-ecommerce-shop",
  storageBucket: "modern-ecommerce-shop.firebasestorage.app",
  messagingSenderId: "240909326136",
  appId: "1:240909326136:web:6caca6250e258ffbe8d3cd",
  measurementId: "G-2YY1LW7DD3"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };