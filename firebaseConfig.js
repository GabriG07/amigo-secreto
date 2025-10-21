// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.appspot.com",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

// ✅ Inicializa apenas uma vez
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
