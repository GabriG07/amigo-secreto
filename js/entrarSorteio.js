import { auth, db } from "./firebaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { Pessoa } from "./Pessoa.js";
import { Sorteio } from "./Sorteio.js";
import { animacaoCarregando, terminaAnimacaoCarregando } from "./utils.js";

// pegar o código da URL
const urlParams = new URLSearchParams(window.location.search);
const codigo = urlParams.get("codigo");

if (!codigo) {
  alert("Código inválido.");
  window.location.href = "./index.html";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // salva o código temporariamente
    localStorage.setItem("codigoConvite", codigo);
    window.location.href = "./loginPage.html";
    return;
  }

  // usuário está logado
  try {
    const msgCarregando = document.getElementById("msgCarregando");
    const anim = animacaoCarregando(msgCarregando, "Entrando no sorteio")

    const usuario = await Pessoa.carregar(user.uid);
    const sorteio = await Sorteio.carregar(codigo);
    if (sorteio.sorteado){
        alert("O sorteio já foi realizado!");
        window.location.href = "./dashboard.html";
        return;
    } 
    await sorteio.adicionarParticipante(usuario);
    terminaAnimacaoCarregando(anim, msgCarregando);
    window.location.href = "./dashboard.html";

  } catch (err) {
    console.error(err);
    alert("Erro ao entrar no sorteio.");
  }
});
