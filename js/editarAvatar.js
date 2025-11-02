import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { animacaoCarregando, terminaAnimacaoCarregando } from './utils.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Avatares
const avatarGrid = document.getElementById('avatarGrid');
const avatars = Array.from({ length: 35 }, (_, i) =>
    `../assets/avatars/avatar${i + 1}.png`
);


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./loginPage.html";
        return;
    }

    const anim = animacaoCarregando(null, "Carregando");
    
    const btnAlterar = document.getElementById("btnAlterar");
    const btnVoltar = document.getElementById("btnVoltar");

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
            btnAlterar.disabled = true;

            const anim = animacaoCarregando(btnAlterar, "Salvando");
            const usuario = await Pessoa.carregar(user.uid);
            btnVoltar.style.display = "none"; //Tira o botão de voltar enquanto espera o novo avatar ser salvo
            await usuario.editarAvatar(selected);
            terminaAnimacaoCarregando(anim, btnAlterar);
            btnAlterar.style.display = "block";
            btnAlterar.textContent = "Avatar atualizado!";
            setTimeout(() => { 
                window.location.href = "./dashboard.html" 
            }, 1000); // Pequeno atraso para garantir consistência
            
        }
        else {
            alert("❌ Selecione um avatar!");
        }
    });

    // Voltar ao dashboard
    btnVoltar.onclick = () => {
        window.location.href = "./dashboard.html";
    };

});


