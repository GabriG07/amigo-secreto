//Configuração do Firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.firebasestorage.app",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


