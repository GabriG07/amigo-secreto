//Tratamento do login e firebase
import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { capitalize } from './utils.js';
import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
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
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Avatares
const avatarGrid = document.getElementById('avatarGrid');
const avatars = Array.from({ length: 10 }, (_, i) =>
    `../assets/avatars/avatar${i + 1}.png`
);

let selected = null;
avatars.forEach(src => {
    const el = document.createElement('div');
    el.className = 'avatar-option';
    el.innerHTML = `<img src="${src}" alt="avatar">`;
    el.onclick = () => {
        document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
        el.classList.add('selected');
        selected = src;
    };
    avatarGrid.appendChild(el);
});

// Cadastrar no Firestore
document.getElementById('btnCadastrar').addEventListener('click', async () => {
    const nome = capitalize(document.getElementById('nome').value.trim());
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    if (!nome || !email || !senha || !selected) {
        alert('Preencha nome, email, senha e escolha um avatar');
        return;
    }

    try {
        const cred = await createUserWithEmailAndPassword(auth, email, senha);
        await updateProfile(cred.user, { displayName: nome });

        const pessoa = new Pessoa(nome, email, selected);
        await pessoa.salvar(cred);

        window.location.href = 'index.html';
        alert(`Conta criada com sucesso! Bem-vindo, ${nome}! 🎉`);
    } catch (error) {
        alert("Erro ao criar conta: " + error.message);
    }
});
