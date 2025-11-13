// ../js/dashboard.js
import { auth, db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { animacaoCarregando, terminaAnimacaoCarregando } from './utils.js';
import { Sorteio } from './Sorteio.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

/*
  Fluxo:
  - Ao clicar na div do sorteio (item), chama abrirModalResultado(id)
  - abrirModalResultado carrega o sorteio via Sorteio.carregar(id) (usa Firestore)
  - usa sorteio.buscaResultadoPorEmail(user.email) para pegar o amigo (resultado)
  - preenche painel esquerdo (quem você tirou) e painel direito (lista de participantes)
*/

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "./loginPage.html";
        return;
    }

    // animação carregando
    const msgCarregando = document.getElementById("msgCarregando");
    const anim = animacaoCarregando(msgCarregando);

    // carrega dados do usuário (sua classe Pessoa)
    const usuario = await Pessoa.carregar(user.uid);

    terminaAnimacaoCarregando(anim, msgCarregando);

    // mostra elementos
    document.querySelector(".dashboardTitle").style.display = "block";
    document.querySelector(".card").style.display = "block";
    document.querySelector(".welcome").style.display = "block";

    const nome = usuario.nome || usuario.email;
    document.getElementById("meuNome").textContent = nome;

    // avatar do usuário
    const avatarPerfil = document.getElementById("avatarPerfil");
    avatarPerfil.src = usuario.avatar || "../assets/avatars/avatar1.png";
    document.getElementById("avatarWrapper").style.display = "inline-block";

    const btnAvatarEdit = document.getElementById("btnAvatarEdit");
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    document.getElementById("avatarWrapper").addEventListener("click", () => {
        if (getComputedStyle(btnAvatarEdit).opacity === "1" || isDesktop) {
            window.location.href = "./editarAvatar.html";
        }
    });

    // botoes
    const btnEntrar = document.getElementById("btnEntrarSorteio");
    const btnEntrar2 = document.getElementById("btnEntrarSorteio2");
    const btnCriar = document.getElementById("btnCriarSorteio");
    const btnVer = document.getElementById("btnVerSorteios");
    const btnLogout = document.getElementById("logout");

    btnEntrar.onclick = () => {
        const div = document.getElementById("entrarSorteio");
        div.style.display = div.style.display === "block" ? "none" : "block";
    };

    // entrar em sorteio existente (usa sua classe Sorteio)
    btnEntrar2.onclick = async () => {
        const codigo = document.getElementById("codigoEntrada").value.trim().toUpperCase();
        if (codigo.length !== 5) return alert("O código deve ter 5 caracteres!");
        const sorteio = await Sorteio.carregar(codigo);
        if (!sorteio) return alert("Sorteio não encontrado!");
        if (sorteio.sorteado) return alert("O sorteio já foi realizado!");
        await sorteio.adicionarParticipante(usuario);
    };

    // criar novo sorteio (abre modal)
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

    // fechar modal clicar fora
    const modalCriar = document.getElementById("modalCriar");
    modalCriar.addEventListener("click", (e) => {
        if (e.target === modalCriar) {
            modalCriar.style.display = "none";
            document.body.style.overflow = "auto";
            container.classList.remove("blur-fundo");
        }
    });

    // =================================================
    // LISTAR SORTEIOS DO USUÁRIO
    // =================================================
    btnVer.onclick = async () => {
        const lista = document.getElementById("listaSorteios");
        const txtMeusSorteios = document.getElementById("textoMeusSorteios");
        txtMeusSorteios.style.display = "none";
        lista.innerHTML = `<li id="msgCarregandoLista"></li>`;
        const msgCarregandoLista = document.getElementById("msgCarregandoLista");
        msgCarregandoLista.style.display = "block";
        const animLista = animacaoCarregando(msgCarregandoLista);

        const sorteios = await Sorteio.listarPorEmail(usuario.email);

        terminaAnimacaoCarregando(animLista, msgCarregandoLista);
        txtMeusSorteios.style.display = "block";
        lista.innerHTML = "";

        if (sorteios.length === 0) {
            lista.innerHTML = "<li>Nenhum sorteio encontrado 😕</li>";
            return;
        }

        sorteios.forEach((s) => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "sorteio-item";
            itemDiv.setAttribute("data-id", s.id);

            const infoDiv = document.createElement("div");
            infoDiv.className = "sorteio-info";
            const titulo = document.createElement("strong");
            titulo.textContent = s.nome || `Sorteio ${s.id}`;
            const subt = document.createElement("small");
            subt.textContent = `Admin: ${s.admin.nome} • ${s.participantes.length} participantes`;

            infoDiv.appendChild(titulo);
            infoDiv.appendChild(subt);

            // área de ações (copy)
            // área de ações (container do botão de copiar)
            const actions = document.createElement("div");
            actions.className = "actions";
            actions.style.display = "flex";
            actions.style.flexDirection = "column";
            actions.style.alignItems = "flex-end";
            actions.style.justifyContent = "center"; // Centraliza verticalmente
            actions.style.gap = "20px";
            actions.style.padding = "8px"; // Aumenta a área de clique
            actions.style.cursor = "pointer"; // Mostra a mãozinha em tudo

            const copyImg = document.createElement("img");
            copyImg.className = "btnCopy";
            copyImg.style.display = "none";
            copyImg.src = "../assets/img/copy.png";
            copyImg.alt = "Copiar código";
            copyImg.title = "Copiar código do sorteio";
            copyImg.style.pointerEvents = "none"; 

            if(navigator.clipboard){
                btnCopy.style.display = "block";
                actions.addEventListener("click", async (ev) => {
                    ev.stopPropagation();
                    const msg = document.getElementById("mensagemCopiado");
                    try {
                        msg.classList.add("mostrar");
                        await navigator.clipboard.writeText(s.id);
                        setTimeout(() => msg.classList.remove("mostrar"), 1400);
                    } catch (err) {
                        msg.textContent = "❌ Erro ao copiar!";
                        msg.classList.add("mostrar");
                        msg.style.backgroundColor = "#ff0000";
                        setTimeout(() => { msg.classList.remove("mostrar");}, 1400);
                    }
                });
            }

            // adiciona imagem na div e div no item
            actions.appendChild(copyImg);
            itemDiv.appendChild(infoDiv);
            itemDiv.appendChild(actions);

            // clique na div item abre modal (mas o stopPropagation acima protege o botão copy)
            itemDiv.addEventListener("click", () => {
                abrirModalResultado(s.id);
            });

            lista.appendChild(itemDiv);
        });
    };

    // =================================================
    // MODAL DE RESULTADO
    // =================================================
    const modalResultado = document.getElementById("modalResultado");
    const fecharResultadoBtn = document.getElementById("fecharResultado");
    fecharResultadoBtn.addEventListener("click", fecharModalResultado);
    // fechar ao clicar fora
    modalResultado.addEventListener("click", (e) => {
        if (e.target === modalResultado) fecharModalResultado();
    });

    async function abrirModalResultado(sorteioId) {
        // Carrega o sorteio (Firestore) usando sua classe
        const sorteio = await Sorteio.carregar(sorteioId);
        if (!sorteio) return alert("Erro ao carregar sorteio.");

        // mostra participantes na coluna direita
        const listaPartModal = document.getElementById("listaParticipantesModal");
        listaPartModal.innerHTML = "";

        sorteio.participantes.forEach((p) => {
            const item = document.createElement("div");
            item.className = "participante-item" + (p.email === sorteio.admin.email ? " admin" : "");
            const img = document.createElement("img");
            img.src = p.avatar || "../assets/avatars/avatar1.png";
            img.alt = p.nome || "Participante";
            const nomeEl = document.createElement("div");
            nomeEl.className = "p-nome";
            nomeEl.textContent = p.nome || p.email;
            item.appendChild(img);
            item.appendChild(nomeEl);
            listaPartModal.appendChild(item);
        });

        // Se sorteado: busca quem o usuário tirou usando método da classe
        if (!sorteio.sorteado) {
            // mostra mensagem na esquerda
            document.getElementById("resultadoAvatar").src = "../assets/avatars/avatar1.png";
            document.getElementById("resultadoNome").textContent = "Sorteio ainda não realizado";
            const detalhes = document.getElementById("resultadoDetalhes");
            detalhes.innerHTML = `<div class="info-item">O sorteio não foi realizado ainda.</div>`;
            modalResultado.style.display = "flex";
            document.body.style.overflow = "hidden";
            modalResultado.setAttribute('aria-hidden', 'false');
            return;
        }

        // pega o amigo sorteado do usuário atual
        const amigo = sorteio.buscaResultadoPorEmail(user.email);
        if (!amigo) {
            document.getElementById("resultadoAvatar").src = "../assets/avatars/avatar1.png";
            document.getElementById("resultadoNome").textContent = "Resultado não encontrado para você";
            document.getElementById("resultadoDetalhes").innerHTML = `<div class="info-item">Você não possui resultado neste sorteio.</div>`;
            modalResultado.style.display = "flex";
            document.body.style.overflow = "hidden";
            modalResultado.setAttribute('aria-hidden', 'false');
            return;
        }

        // Preenche a coluna esquerda com os dados do amigo sorteado
        document.getElementById("resultadoAvatar").src = amigo.avatar || "../assets/avatars/avatar1.png";
        document.getElementById("resultadoNome").textContent = amigo.nome || amigo.email;
        const detalhes = document.getElementById("resultadoDetalhes");
        detalhes.innerHTML = "";

        // Exibe as perguntas / preferências que estão guardadas junto ao sorteio (campo 'participantes' => p.perguntas)
        // Em sua modelagem, perguntas estão no objeto do participante salvo no sorteio; tentamos acessar por amigo.perguntas
        // Caso não existam, tentamos campos comuns (ex: gosta, tamanhoRoupa, tamanhoCalcado, observacoes)
        const perguntasObj = amigo.perguntas || {};
        // Se objeto vazio, tentamos propriedades diretas
        const fallbackFields = {};
        if (amigo.gosta) fallbackFields["Gosta de"] = amigo.gosta;
        if (amigo.tamanhoRoupa) fallbackFields["Tamanho da roupa"] = amigo.tamanhoRoupa;
        if (amigo.tamanhoCalcado) fallbackFields["Tamanho do calçado"] = amigo.tamanhoCalcado;
        if (amigo.observacoes) fallbackFields["Observações"] = amigo.observacoes;

        // Primeiro mostra perguntasObj (se tiver)
        if (Object.keys(perguntasObj).length > 0) {
            for (const [campo, valor] of Object.entries(perguntasObj)) {
                const div = document.createElement("div");
                div.className = "info-item";
                div.textContent = `${campo}: ${valor || "—"}`;
                detalhes.appendChild(div);
            }
        }

        // Depois fallback fields
        for (const [k, v] of Object.entries(fallbackFields)) {
            const div = document.createElement("div");
            div.className = "info-item";
            div.textContent = `${k}: ${v || "—"}`;
            detalhes.appendChild(div);
        }

        // Se nada encontrado, informa
        if (detalhes.children.length === 0) {
            detalhes.innerHTML = `<div class="info-item">Nenhuma informação disponível.</div>`;
        }

        // Abre modal
        modalResultado.style.display = "flex";
        document.body.style.overflow = "hidden";
        modalResultado.setAttribute('aria-hidden', 'false');
    }

    function fecharModalResultado() {
        const modalResultado = document.getElementById("modalResultado");
        modalResultado.style.display = "none";
        document.body.style.overflow = "auto";
        modalResultado.setAttribute('aria-hidden', 'true');
    }

    // logout
    btnLogout.onclick = async () => {
        await signOut(auth);
        window.location.href = "loginPage.html";
    };
});
