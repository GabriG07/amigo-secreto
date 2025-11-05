import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { animacaoCarregando, terminaAnimacaoCarregando } from './utils.js';
import { Sorteio } from './Sorteio.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Observa se o usuário está logado
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./loginPage.html";
        return;
    }

    //Animação da mensagem de "carregando"
    const msgCarregando = document.getElementById("msgCarregando");
    const anim = animacaoCarregando(msgCarregando);

    const usuario = await Pessoa.carregar(user.uid);

    terminaAnimacaoCarregando(anim, msgCarregando);

    //Deixando os elementos visíveis após carregar os dados
    document.querySelector(".dashboardTitle").style.display = "block";
    document.querySelector(".card").style.display = "block";

    document.querySelector(".welcome").style.display = "block";
    const nome = usuario.nome || usuario.email;
    document.getElementById("meuNome").textContent = nome;

    const avatarWrapper = document.querySelector(".avatarWrapper");
    avatarWrapper.style.display = "inline-block";
    const avatarImg = document.querySelector(".avatarPerfil");
    const btnAvatarEdit = document.querySelector(".btnEdit");

    avatarImg.src = usuario.avatar;
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    avatarWrapper.addEventListener("click", () =>{
        if(getComputedStyle(btnAvatarEdit).opacity === "1" || isDesktop){
            window.location.href = "./editarAvatar.html";
        }
    });
// Seletores do modal
const btnVerSorteado = document.getElementById("btnVerSorteado");
const modalSorteado = document.getElementById("modalSorteado");
const fecharModalSorteado = document.getElementById("fecharModalSorteado");
const infoSorteado = document.getElementById("infoSorteado");

btnVerSorteado.addEventListener("click", async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert("Você precisa estar logado para ver seu sorteado.");
      return;
    }

    // Busca o documento do usuário atual
    const userRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      alert("Usuário não encontrado.");
      return;
    }

    const userData = userSnap.data();

    // Verifica se o usuário tem alguém sorteado
    if (!userData.sorteios || userData.sorteios.length === 0) {
      alert("Você ainda não realizou o sorteio ou não tirou ninguém.");
      return;
    }

    const idSorteado = userData.sorteios[0]; // assumindo que armazena o UID do sorteado
    const sorteadoRef = doc(db, "usuarios", idSorteado);
    const sorteadoSnap = await getDoc(sorteadoRef);

    if (!sorteadoSnap.exists()) {
      alert("Sorteado não encontrado.");
      return;
    }

    const sorteado = sorteadoSnap.data();

    // Monta o conteúdo do modal
    infoSorteado.innerHTML = `
      <img src="${sorteado.avatar}" alt="Avatar de ${sorteado.nome}">
      <h3>${sorteado.nome}</h3>
      <p><strong>Calça:</strong> ${sorteado.calca || "Não informado"}</p>
      <p><strong>Calçado:</strong> ${sorteado.calcado || "Não informado"}</p>
      <p><strong>Camisa:</strong> ${sorteado.camisa || "Não informado"}</p>
      <p><strong>Herói favorito:</strong> ${sorteado.heroi || "Não informado"}</p>
      <p><strong>Gosta de Harry Potter:</strong> ${sorteado.harrypotter || "Não informado"}</p>
      <p><strong>É religiosa(o):</strong> ${sorteado.religiosa || "Não informado"}</p>
      <p><strong>Outras preferências:</strong> ${sorteado.preferencias || "Não informado"}</p>
    `;

    modalSorteado.style.display = "flex";
  } catch (error) {
    console.error("Erro ao buscar sorteado:", error);
    alert("Erro ao carregar informações do sorteado.");
  }
});

// Fechar o modal
fecharModalSorteado.addEventListener("click", () => {
  modalSorteado.style.display = "none";
});

// Fechar clicando fora
window.addEventListener("click", (event) => {
  if (event.target === modalSorteado) {
    modalSorteado.style.display = "none";
  }
});


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

        const sorteio = await Sorteio.carregar(codigo.toUpperCase());
        if(!sorteio){ //Sorteio não encontrado
            return;
        }

        if(sorteio.sorteado){
            alert("O sorteio do amigo secreto já foi realizado!")
            return;
        }
        
        await sorteio.adicionarParticipante(usuario);
    };

    // Criar novo sorteio
    const container = document.querySelector(".container");
    btnCriar.onclick = () => {
        document.getElementById("modalCriar").style.display = "flex";
        document.body.style.overflow = "hidden"; 
        container.classList.add("blur-fundo");
    };

    document.getElementById("cancelarCriar").onclick = () => {
        document.getElementById("modalCriar").style.display = "none";
        document.body.style.overflow = "auto"; 
        container.classList.remove("blur-fundo");
    };

    document.getElementById("confirmarCriar").onclick = async () => {
        const nome = document.getElementById("nomeSorteioInput").value.trim();
        const valor = document.getElementById("valorSorteioInput").value.trim();
        const data = document.getElementById("dataSorteioInput").value;

        const sorteio = new Sorteio(usuario);
        sorteio.nome = nome || null;
        sorteio.valorMaximo = Number(valor) || null;
        sorteio.dataEvento = data || null;

        const id = await sorteio.criar();
        document.getElementById("modalCriar").style.display = "none";
        document.body.style.overflow = "auto"; 
        container.classList.remove("blur-fundo");
        alert(`✅ Amigo Secreto criado! Código: ${id}`);
    };

    //Modal
    const modal = document.getElementById("modalCriar");
    modal.addEventListener("click", (e) => { // Se clicar fora do modal, fecha ele 
        if (e.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; 
            container.classList.remove("blur-fundo");
        }
    });


    // Ver sorteios do usuário
    btnVer.onclick = async () => {
        const lista = document.getElementById("listaSorteios");
        const divLista = document.getElementById("sorteiosUsuario");
        const txtMeusSorteios = document.getElementById("textoMeusSorteios");
        divLista.style.display = "block";
        txtMeusSorteios.style.display = "none";
        lista.innerHTML = `<li id="msgCarregandoLista"></li>`; //Necessário fazer assim para garantir que a lista será "Limpa" toda vez que o botão for clicado, evitando empilhar diversos amigos secretos repetidos
        
        
        
        const msgCarregandoLista = document.getElementById("msgCarregandoLista");
        msgCarregandoLista.style.display = "block";
        const anim = animacaoCarregando(msgCarregandoLista);
        
        const sorteios = await Sorteio.listarPorEmail(usuario.email);
        
        terminaAnimacaoCarregando(anim, msgCarregandoLista);
        txtMeusSorteios.style.display="block";
        lista.innerHTML = "";

        if (sorteios.length === 0) {
            lista.innerHTML = "<li>Nenhum sorteio encontrado 😕</li>";
            return;
        }

        sorteios.forEach((s) => {
            const divItemLista = document.createElement("div");
            const li = document.createElement("li");
            divItemLista.className = "itemLista";
            li.textContent = `🎁 ${s.id} — Admin: ${s.admin.nome} (${s.participantes.length} participantes)`;

            const btnCopy = document.createElement("img");
            btnCopy.className = "btnCopy";
            btnCopy.src = "../assets/img/copy.png";
            btnCopy.style.display = "none";

            divItemLista.addEventListener("click", async () => {
                window.location.href = `sorteio.html?id=${s.id}`;
            });

            if(navigator.clipboard){
                btnCopy.style.display = "block";
                
                btnCopy.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const msg = document.getElementById("mensagemCopiado");
                    try{
                        msg.classList.add("mostrar");
                        await navigator.clipboard.writeText(s.id);
                        setTimeout(() => msg.classList.remove("mostrar"), 1500);                
                    }
                    catch (e){
                        msg.textContent = "❌ Erro ao copiar!";
                        msg.classList.add("mostrar");
                        msg.style.backgroundColor = "#ff0000";
                        setTimeout(() => msg.classList.remove("mostrar"), 1500);
                    }       
                });
            }
            lista.appendChild(divItemLista)
            divItemLista.appendChild(li);
            divItemLista.appendChild(btnCopy);
        });
    };

   
    // Logout
    btnLogout.onclick = async () => {
        await signOut(auth);
        window.location.href = "loginPage.html";
    };
});
