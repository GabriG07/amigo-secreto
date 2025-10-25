import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Avatares
const avatarGrid = document.getElementById('avatarGrid');
const avatars = Array.from({ length: 10 }, (_, i) =>
    `../assets/avatars/avatar${i + 1}.png`
);


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./loginPage.html";
        return;
    }

    const usuario = await Pessoa.carregar(user.uid);
    const btnAlterar = document.getElementById("btnAlterar");

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

    btnAlterar.addEventListener("click", async () => {
        if(selected !== null){
            console.log(selected);
            await usuario.editarAvatar(selected);
            window.location.href = "./dashboard.html";
        }
        else {
            alert("❌ Selecione um avatar!")
        }
    });

    




});


