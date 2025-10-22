import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  databaseURL: "https://amigosecreto-bec0a-default-rtdb.firebaseio.com/",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.firebasestorage.app",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { app, db };
