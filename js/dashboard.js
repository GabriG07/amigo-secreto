import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { Sorteio } from './Sorteio.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Observa se o usuário está logado
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./loginPage.html";
        return;
    }

    const nome = user.displayName || user.email;
    document.getElementById("meuNome").textContent = nome;

    // Botões
    const btnEntrar = document.getElementById("btnEntrarSorteio");
    const btnEntrar2 = document.getElementById("btnEntrarSorteio2");
    const btnCriar = document.getElementById("btnCriarSorteio");
    const btnVer = document.getElementById("btnVerSorteios");
    const btnLogout = document.getElementById("logout");

    btnEntrar.onclick = async () => {
        const div = document.getElementById("entrarSorteio");

        // Se estiver visível, esconde. Se estiver invisível, mostra.
        if (div.style.display === "block") {
            div.style.display = "none";
        } else {
            div.style.display = "block";
        }
    }

    // Entrar em sorteio existente
    btnEntrar2.onclick = async () => {
        const codigo = document.getElementById("codigoEntrada").value.trim();
        if (codigo.length !== 5) {
            alert("O código deve ter 5 caracteres!");
            return;
        }

        const sorteio = await Sorteio.carregar(codigo);

        if(sorteio.sorteado){
            alert("O sorteio do amigo secreto já foi realizado!")
            return;
        }

        const usuario = await Pessoa.carregar(user.uid)

        
        await sorteio.adicionarParticipante(usuario);
    };

    // Criar novo sorteio
    btnCriar.onclick = async () => {
        const confirmar = confirm("🎁 Deseja criar um novo Amigo Secreto?");
        if (!confirmar) return;

        const usuario = await Pessoa.carregar(user.uid)

        const sorteio = new Sorteio(usuario);
        const id = await sorteio.criar();
        alert(`Novo Amigo Secreto criado com sucesso! Código: ${id}`);
    };

    // Ver sorteios do usuário
    btnVer.onclick = async () => {
        const lista = document.getElementById("listaSorteios");
        const divLista = document.getElementById("sorteiosUsuario");

        lista.innerHTML = "<li>Carregando...</li>";
        divLista.style.display = "block";

        const sorteios = await Sorteio.listarPorEmail(user.email);
        lista.innerHTML = "";

        if (sorteios.length === 0) {
            lista.innerHTML = "<li>Nenhum sorteio encontrado 😕</li>";
            return;
        }

        sorteios.forEach((s) => {
            const li = document.createElement("li");
            li.textContent = `🎁 ${s.id} — Admin: ${s.admin.nome} (${s.participantes.length} participantes)`;
            li.style.cursor = "pointer";

            li.addEventListener("click", async () => {
                window.location.href = `sorteio.html?id=${s.id}`;
            });

            lista.appendChild(li);
        });
    };
    

    // Logout
    btnLogout.onclick = async () => {
        await signOut(auth);
        window.location.href = "loginPage.html";
    };
});
