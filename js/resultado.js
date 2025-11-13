import { auth } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// Captura o ID do sorteio da URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const resultadoContainer = document.getElementById("resultadoContainer");

// Garante que o usuário está autenticado
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "./loginPage.html";
    return;
  }

  if (!id) {
    resultadoContainer.innerHTML = "<p>❌ ID do sorteio não encontrado.</p>";
    return;
  }

  resultadoContainer.innerHTML = "<p>Carregando resultado...</p>";

  // Carrega o sorteio a partir da classe Sorteio (usa o Firestore internamente)
  const sorteio = await Sorteio.carregar(id);

  if (!sorteio) {
    resultadoContainer.innerHTML = "<p>❌ Sorteio não encontrado.</p>";
    return;
  }

  if (!sorteio.sorteado) {
    resultadoContainer.innerHTML = "<p>⚠ O sorteio ainda não foi realizado.</p>";
    return;
  }

  // Busca quem o usuário atual tirou
  const amigo = sorteio.buscaResultadoPorEmail(user.email);

  if (!amigo) {
    resultadoContainer.innerHTML = "<p>⚠ Você não está vinculado a nenhum resultado neste sorteio.</p>";
    return;
  }

  // Monta o cartão de resultado com os dados do amigo sorteado
  resultadoContainer.innerHTML = `
    <div class="resultado-card">
      <h2>🎉 Você tirou:</h2>
      <img src="${amigo.avatar || '../assets/avatars/avatar1.png'}" alt="Avatar do amigo" class="avatar-resultado">
      <h3>${amigo.nome}</h3>
      <p><strong>O que gosta:</strong> ${amigo.gosta || "Não informado"}</p>
      <p><strong>Tamanho da roupa:</strong> ${amigo.tamanhoRoupa || "Não informado"}</p>
      <p><strong>Tamanho do calçado:</strong> ${amigo.tamanhoCalcado || "Não informado"}</p>
      <p><strong>Observações:</strong> ${amigo.observacoes || "Nenhuma observação"}</p>
    </div>
  `;
});

// Botão para voltar
document.getElementById("voltarDashboard").onclick = () => {
  window.location.href = "./dashboard.html";
};
