import { auth } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { Pessoa } from './Pessoa.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Captura o ID do sorteio da URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

document.getElementById("idSorteio").textContent = id;

// Quando o usuário estiver autenticado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./loginPage.html";
    return;
  }

  // Carrega o sorteio do Firestore
  const sorteio = await Sorteio.carregar(id);
  if (!sorteio) {
    alert("❌ Sorteio não encontrado!");
    window.location.href = "./dashboard.html";
    return;
  }

  document.getElementById("adminNome").textContent = sorteio.admin.nome;

  const lista = document.getElementById("listaParticipantes");
  lista.innerHTML = "";

  // Se o usuário for admin, mostra botão de sortear
  const acoesAdmin = document.getElementById("acoesAdmin");
  if (sorteio.admin.email === user.email) {
    acoesAdmin.style.display = "block";
  }

  // Exibe participantes
  sorteio.participantes.forEach((p) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";

    const spanNome = document.createElement("div");
    spanNome.style.display = "flex";
    spanNome.style.alignItems = "center";
    spanNome.style.gap = "10px";

    // Cria o avatar (imagem)
    const img = document.createElement("img");
    img.src = p.avatar || "../assets/avatars/avatar1.png"; 
    img.alt = p.nome;
    img.style.width = "38px";
    img.style.height = "38px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";
    img.style.border = "2px solid rgba(255,255,255,0.15)";

    // Cria o texto do nome
    const nome = document.createElement("span");
    nome.textContent = p.nome;
    nome.style.fontWeight = "500";
    nome.style.color = "#fff";

    if(sorteio.sorteado){
      const amigo = sorteio.buscaResultadoPorEmail(user.email);
      if(amigo && p.email === amigo.email){
        li.style.backgroundColor = "#07d950be";
      }
    }
    

    spanNome.appendChild(img);
    spanNome.appendChild(nome);
    li.appendChild(spanNome);


    // Se for admin, pode remover (caso ainda não tenha sorteado)
    if (!sorteio.sorteado && sorteio.admin.email === user.email) {
      const btnExcluir = document.createElement("button");
      btnExcluir.textContent = "❌";
      btnExcluir.style.background = "none";
      btnExcluir.style.border = "none";
      btnExcluir.style.cursor = "pointer";
      btnExcluir.style.color = "red";
      btnExcluir.title = "Remover participante";

      btnExcluir.onclick = async () => {
        if (confirm(`Deseja remover ${p.nome}?`)) {
          const sucesso = await sorteio.removerParticipante(p.email);
          if (sucesso) {
            alert("Participante removido!");
            li.remove();
          }
        }
      };

      li.appendChild(btnExcluir);
    }

    lista.appendChild(li);
  });


  if (!sorteio.sorteado){
      // Função de realizar o sorteio (admin)
      document.getElementById("btnSortear").onclick = async () => {
        if (sorteio.admin.email !== user.email) return alert("Apenas o admin pode sortear!");

        if (sorteio.participantes.length < 3) {
            alert("É necessário pelo menos 3 participantes para sortear!");
            return;
        }

        const confirmar = confirm("🎲 Deseja realizar o sorteio agora?");
        if (!confirmar) return;

        try {
            await sorteio.sortear();
            alert("✅ Sorteio realizado com sucesso!");
            location.reload();
        } catch (err) {
            console.error(err);
            alert("Erro ao realizar sorteio: " + err.message);
        }
    };
  }
  else { //já foi sorteado
    const botao = document.getElementById("btnSortear");
    if (botao) botao.style.display = "none";
  }



});

// Voltar ao dashboard
document.getElementById("btnVoltar").onclick = () => {
  window.location.href = "dashboard.html";
};
