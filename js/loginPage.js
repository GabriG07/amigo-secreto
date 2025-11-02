//Tratamento do login e firebase
import { auth, db } from './firebaseConfig.js';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  sendPasswordResetEmail, 
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// -------------------------
// 🔧 Configuração do Firebase
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.appspot.com",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

const provider = new GoogleAuthProvider();

// -------------------------
// 🔑 Login e Cadastro
// -------------------------
const btnLogin = document.getElementById('loginEmail');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha'); 

async function fazerLogin(){
  const email = inputEmail.value.trim();
  const senha = inputSenha.value.trim();

  if (!email || !senha) {
    alert("Preencha email e senha!");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    alert("Erro no login: " + error.message);
  }
}

btnLogin.addEventListener("click", fazerLogin);
[inputEmail, inputSenha].forEach(input => { // Pressionar Enter (somente quando o foco estiver nos inputs)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // evita bug de envio duplo
      fazerLogin();
    }
  });
});


//Esqueceu Senha
const btnEsqueci = document.getElementById("btnEsqueciSenha");
btnEsqueci.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    return alert("Digite seu email primeiro!");
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("✅ Enviamos um link para redefinir sua senha!\nVerifique sua caixa de entrada  e spam.");
  } catch (error) {
    alert("⚠️ Erro ao enviar email: " + error.message);
  }
});



// -------------------------
// 🔐 Login com Google
// -------------------------
/*document.getElementById('loginGoogle').addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Erro ao logar com Google: " + error.message);
  }
});
*/


//Redirecionar para o cadastro
document.getElementById('cadastroEmail').addEventListener('click', async () => {
    window.location.href = 'cadastro.html';
});


// -------------------------
// 👀 Observa se está logado
// -------------------------
onAuthStateChanged(auth, async (user) => {
    if (user) {
        window.location.href = './dashboard.html';
    } 
});

