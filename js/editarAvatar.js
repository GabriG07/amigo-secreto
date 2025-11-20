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

    const msgCarregando = document.getElementById("msgCarregando");
    const anim = animacaoCarregando(msgCarregando);

    const dados = await Pessoa.carregar(user.uid);

    // Preenche campos
    document.getElementById("nome").value = dados.nome || "";
    document.getElementById("calca").value = dados.preferencias?.calca || "";
    document.getElementById("camisa").value = dados.preferencias?.camisa || "";
    document.getElementById("calcado").value = dados.preferencias?.calcado || "";
    document.getElementById("heroi").value = dados.preferencias?.heroi || "";
    document.getElementById("harrypotter").value = dados.preferencias?.harrypotter || "";
    document.getElementById("religiosa").value = dados.preferencias?.religiosa || "";
    document.getElementById("preferencias").value = dados.preferencias?.preferencias || "";

    terminaAnimacaoCarregando(anim, msgCarregando);

    document.querySelector(".container").style.display = "block";
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

    const btnSalvarTudo = document.getElementById("btnSalvarTudo");
    btnSalvarTudo.addEventListener("click", async () => {
        const anim = animacaoCarregando(btnSalvarTudo, "Salvando");
        btnSalvarTudo.disabled = true;
        const usuario = await Pessoa.carregar(user.uid);

        const nome = document.getElementById("nome").value.trim();
        const calca = document.getElementById("calca").value.trim();
        const camisa = document.getElementById("camisa").value.trim();
        const calcado = document.getElementById("calcado").value.trim();
        const heroi = document.getElementById("heroi").value.trim();
        const harrypotter = document.getElementById("harrypotter").value.trim();
        const religiosa = document.getElementById("religiosa").value.trim();
        const preferencias = document.getElementById("preferencias").value.trim();

        // Atualiza objeto
        if (selected) {
            usuario.avatar = selected; // avatar escolhido na grid
        }
        usuario.nome = nome || usuario.nome;
        usuario.preferencias = {
            calca,
            camisa,
            calcado,
            heroi,
            harrypotter,
            religiosa,
            preferencias
        };

        await usuario.salvarEdicao(); // Você cria esse método na Pessoa.js
        terminaAnimacaoCarregando(anim, btnSalvarTudo);
        alert("Dados atualizados com sucesso!");
        window.location.href = "./dashboard.html";
    });


    // Voltar ao dashboard
    btnVoltar.onclick = () => {
        window.location.href = "./dashboard.html";
    };

});


