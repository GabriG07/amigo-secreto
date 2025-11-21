// ../js/dashboard.js
import { auth, db } from "./firebaseConfig.js";
import { Pessoa } from "./Pessoa.js";
import { animacaoCarregando, terminaAnimacaoCarregando } from "./utils.js";
import { Sorteio } from "./Sorteio.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
  document.querySelector(".container").style.display = "block";


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
    div.style.display = div.style.display === "flex" ? "none" : "flex";
  };

  // entrar em sorteio existente (usa sua classe Sorteio)
  btnEntrar2.onclick = async () => {
    const codigo = document
      .getElementById("codigoEntrada")
      .value.trim()
      .toUpperCase();
    if (codigo.length !== 5) return alert("O código deve ter 5 caracteres!");
    const sorteio = await Sorteio.carregar(codigo);
    if (sorteio.sorteado) return alert("O sorteio já foi realizado!");
    await sorteio.adicionarParticipante(usuario);
  };

  // criar novo sorteio (abre modal)
  const container = document.querySelector(".container");
  btnCriar.onclick = () => {
    //Garantindo que campos do modal iniciem vazios
    document.getElementById("nomeSorteioInput").value = "";
    document.getElementById("valorSorteioInput").value = "";
    document.getElementById("dataSorteioInput").value = "";

    // Define a data mínima como "hoje" ao abrir o modal
    const today = new Date().toISOString().split("T")[0];
    document.getElementById("dataSorteioInput").setAttribute("min", today);

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
    let valor = document.getElementById("valorSorteioInput").value.trim();
    const data = document.getElementById("dataSorteioInput").value;

    const sorteio = new Sorteio(usuario);
    sorteio.nome = nome || null;
    sorteio.valorMaximo = Math.abs(Number(valor)) || null;
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

    sorteios.forEach(async (s) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "sorteio-item";
      itemDiv.setAttribute("data-id", s.id);

      const infoDiv = document.createElement("div");
      infoDiv.className = "sorteio-info";
      const titulo = document.createElement("strong");
      titulo.textContent = s.nome || `Sorteio ${s.id}`;
      const subt = document.createElement("small");

      //Carregando nome do admin
      const admin = await Pessoa.carregarPorEmail(s.admin.email);
      subt.textContent = `Admin: ${admin.nome} • ${s.participantes.length} ${s.participantes.length === 1 ? "participante" : "participantes"}`;

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

      if (navigator.clipboard) {
        copyImg.style.display = "flex";
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
            setTimeout(() => {
              msg.classList.remove("mostrar");
            }, 1400);
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

    const msgCarregandoResultado = document.getElementById("msgCarregandoResultado");
    msgCarregandoResultado.style.display = "block";
    const anim = animacaoCarregando(msgCarregandoResultado, "Carregando Amigo Secreto");
    
    const grid = document.querySelector(".resultado-grid");
    const cardResultado = document.querySelector(".resultado-card");

    // Reset do conteúdo para evitar piscar
    document.getElementById("resultadoAvatar").src = "";
    document.getElementById("resultadoNome").textContent = "";
    document.getElementById("resultadoDetalhes").innerHTML = "";
    document.getElementById("listaParticipantesModal").innerHTML = "";
    document.getElementById("nomeSorteio").innerHTML = "";
    document.getElementById("infoValor").innerHTML = "";
    document.getElementById("infoData").innerHTML = "";
    document.getElementById("infosAmigoSecreto").style.display = "none";

    // Oculta o conteúdo antes de carregar
    grid.style.display = "none";
    grid.style.visibility = "hidden";
    grid.style.opacity = "0";

    // Abre modal somente com loader
    modalResultado.style.display = "flex";
    document.body.style.overflow = "hidden";
    modalResultado.setAttribute("aria-hidden", "false");
    container.classList.add("blur-fundo");


    // Carrega o sorteio (Firestore) usando sua classe
    const sorteio = await Sorteio.carregar(sorteioId);
    if (!sorteio) {
      alert("Erro ao carregar sorteio.");
      return
    }

    // mostra participantes na coluna direita
    const listaPartModal = document.getElementById("listaParticipantesModal");
    listaPartModal.innerHTML = "";

    sorteio.participantes.forEach(async (p) => {
      const participante = await Pessoa.carregarPorEmail(p.email);
      const item = document.createElement("div");
      item.className =
        "participante-item" + (p.email === sorteio.admin.email ? " admin" : "");
      const img = document.createElement("img");
      img.src = participante.avatar || "../assets/avatars/avatar1.png";
      img.alt = participante.nome || "Participante";
      const nomeEl = document.createElement("div");
      nomeEl.className = "p-nome";
      nomeEl.textContent = participante.nome || participante.email;
      item.appendChild(img);
      item.appendChild(nomeEl);
      listaPartModal.appendChild(item);
    });

    //Botão de realizar o sorteio
    const btnSortear = document.getElementById("btnSortear");

    const btnCompartilhar = document.getElementById("btnCompartilhar");

    // link para compartilhar (base do seu sistema + código do sorteio)
    const linkConvite = `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '')}/entrarSorteio.html?codigo=${sorteioId}`;

    btnCompartilhar.onclick = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Convite para Amigo Secreto",
            text: "Entre no meu sorteio!",
            url: linkConvite
          });
        } catch (err) {
          alert("O compartilhamento foi cancelado.");
        }
      } else {
        // fallback copiar
        await navigator.clipboard.writeText(linkConvite);
        alert("📋 Link copiado para a área de transferência!");
      }
    };


    //Mostra as informações do amigo secreto
    document.getElementById("nomeSorteio").textContent = sorteio.nome || `ID: ${sorteio.id}`;
    if (sorteio.valorMaximo) document.getElementById("infoValor").textContent = `💵: R$${Number(sorteio.valorMaximo).toFixed(2)}`;
    if (sorteio.dataEvento) {
      const [ano, mes, dia] = sorteio.dataEvento.split("-");
      const data = new Date(ano, mes - 1, dia);
      const dataFormatada = data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
      document.getElementById("infoData").textContent = `📅: ${dataFormatada}`;
    }
    if (sorteio.valorMaximo || sorteio.dataEvento) document.getElementById("infosAmigoSecreto").style.display = "block";

    if (!sorteio.sorteado) {
      //Se ainda não foi sorteado, então não mostra o card do resultado e mensagem de que está aguardando o sorteio
      cardResultado.style.display = "none";
      document.querySelector("#msgAguardandoSorteio").style.display = "block";

      if (sorteio.admin.email !== user.email) btnSortear.style.display = "none";
      else btnSortear.style.display = "block";
      btnCompartilhar.style.display = "block"; 

      // Função de realizar o sorteio (admin)
      btnSortear.onclick = async () => {
        if (sorteio.participantes.length < 3) {
          alert("É necessário pelo menos 3 participantes para sortear!");
          return;
        }

        const confirmar = confirm("🎲 Deseja realizar o sorteio agora?");
        if (!confirmar) return;

        try {
          btnSortear.disabled = true;
          const anim = animacaoCarregando(btnSortear, "Sorteando");
          await sorteio.sortear();
          terminaAnimacaoCarregando(anim, btnSortear);
          alert("✅ Sorteio realizado com sucesso!");
          location.reload();
        } catch (err) {
          console.error(err);
          alert("Erro ao realizar sorteio: " + err.message);
        }
      };
    } else {
      //já foi sorteado
      const btnSortear = document.getElementById("btnSortear");
      if (btnSortear) btnSortear.style.display = "none";
      if (btnCompartilhar) btnCompartilhar.style.display = "none"; 
      cardResultado.style.display = "block";
    }

    // Se sorteado: busca quem o usuário tirou usando método da classe
    if (!sorteio.sorteado) {
      terminaAnimacaoCarregando(anim, msgCarregandoResultado);
      mostrarModalResultadoAposCarregamento(grid);
      // mostra mensagem na esquerda
      document.getElementById("resultadoAvatar").src =
        "../assets/avatars/avatar1.png";
      document.getElementById("resultadoNome").textContent =
        "Sorteio ainda não realizado";
      const detalhes = document.getElementById("resultadoDetalhes");
      detalhes.innerHTML = `<div class="info-item">O sorteio não foi realizado ainda.</div>`;
      modalResultado.style.display = "flex";
      document.body.style.overflow = "hidden";
      modalResultado.setAttribute("aria-hidden", "false");
      return;
    }

    // pega o amigo sorteado do usuário atual
    const _amigo = sorteio.buscaResultadoPorEmail(user.email);
    if (!_amigo) {
      terminaAnimacaoCarregando(anim, msgCarregandoResultado);
      mostrarModalResultadoAposCarregamento(grid);
      document.getElementById("resultadoAvatar").src =
        "../assets/avatars/avatar1.png";
      document.getElementById("resultadoNome").textContent =
        "Resultado não encontrado para você";
      document.getElementById(
        "resultadoDetalhes"
      ).innerHTML = `<div class="info-item">Você não possui resultado neste sorteio.</div>`;
      modalResultado.style.display = "flex";
      document.body.style.overflow = "hidden";
      modalResultado.setAttribute("aria-hidden", "false");
      return;
    }

    const amigo = await Pessoa.carregarPorEmail(_amigo.email);

    // Preenche a coluna esquerda com os dados do amigo sorteado
    document.getElementById("resultadoAvatar").src =
      amigo.avatar || "../assets/avatars/avatar1.png";
    document.getElementById("resultadoNome").textContent =
      amigo.nome || amigo.email;
    const detalhes = document.getElementById("resultadoDetalhes");
    detalhes.innerHTML = "";

    // Exibe as perguntas / preferências que estão guardadas junto ao sorteio (campo 'participantes' => p.perguntas)
    // Em sua modelagem, perguntas estão no objeto do participante salvo no sorteio; tentamos acessar por amigo.perguntas
    // Caso não existam, tentamos campos comuns (ex: gosta, tamanhoRoupa, tamanhoCalcado, observacoes)
    const perguntasObj = amigo.preferencias || {};
    // Se objeto vazio, tentamos propriedades diretas
    const fallbackFields = {};
    if (amigo.gosta) fallbackFields["Gosta de"] = amigo.gosta;
    if (amigo.tamanhoRoupa)
      fallbackFields["Tamanho da roupa"] = amigo.tamanhoRoupa;
    if (amigo.tamanhoCalcado)
      fallbackFields["Tamanho do calçado"] = amigo.tamanhoCalcado;
    if (amigo.observacoes) fallbackFields["Observações"] = amigo.observacoes;

    // Primeiro mostra perguntasObj (se tiver)
    if (Object.keys(perguntasObj).length > 0) {
      for (const [campo, valor] of Object.entries(perguntasObj)) {
        const div = document.createElement("div");
        div.className = "info-item";
        let labelCampo;
        let valorFormatado; 

        switch(campo){
          case ("camisa"):
            labelCampo = "Tamanho de Camisa";
            valorFormatado = valor;
            break;
          case("preferencias"):
            labelCampo = "Outras preferências";
            valorFormatado = valor;
            break;
          case("religiosa"):
            labelCampo = "Relioso(a)";
            if(valor == "nao") valorFormatado = "Não";
            else if(valor == "sim") valorFormatado = "Sim";
            break;
          case("harrypotter"):
            labelCampo = "Gosta de Harry Potter";
            if(valor == "nao") valorFormatado = "Não";
            else if(valor == "sim") valorFormatado = "Sim";
            break;
          case("calcado"):
            labelCampo = "Tamanho de Calçado";
            valorFormatado = valor;
            break;
          case("calca"):
            labelCampo = "Tamanho de Calça";
            valorFormatado = valor;
            break;
          case("heroi"):
            labelCampo = "Super-Herói Favorito";
            valorFormatado = valor;
            break;
        }

        div.innerHTML = `
          <span class="labelInfos">${labelCampo}:</span>
          <span class="valorInfos">${valorFormatado || "—"}</span>
        `;

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

    terminaAnimacaoCarregando(anim, msgCarregandoResultado);
    mostrarModalResultadoAposCarregamento(grid);

    function mostrarModalResultadoAposCarregamento(grid) {
      grid.style.visibility = "visible";
      grid.style.opacity = "1";
      grid.style.display = "grid";
      document.getElementById("nomeSorteio").style.display = "block";
    }
  }



  function fecharModalResultado() {
    const modalResultado = document.getElementById("modalResultado");
    modalResultado.style.display = "none";
    document.body.style.overflow = "auto";
    modalResultado.setAttribute("aria-hidden", "true");
    container.classList.remove("blur-fundo");
    document.getElementById("nomeSorteio").style.display = "none";
    document.querySelector("#msgAguardandoSorteio").style.display = "none";
  }

  // logout
  btnLogout.onclick = async () => {
    await signOut(auth);
    window.location.href = "loginPage.html";
  };
});
