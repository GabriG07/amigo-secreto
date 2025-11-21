//Funções utilitárias
export function capitalize(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function animacaoCarregando(elemento, textoBase = "Carregando"){
    //Animação da mensagem de "carregando"
    let pontos = 0;
    const msg = elemento;
    const animacao = setInterval(() => {
        pontos = (pontos + 1) % 4; // alterna entre 0, 1, 2, 3
        msg.textContent = textoBase + ".".repeat(pontos);
    }, 400);

    return animacao;
}

export function terminaAnimacaoCarregando(animacao, elemento){
    clearInterval(animacao);
    elemento.style.display = "none";
}

export function traduzErroFirebase(error) {
  const codigo = error.code;

  switch (codigo) {
    case "auth/email-already-in-use":
      return "Este email já está cadastrado. Tente fazer login.";
    case "auth/invalid-email":
      return "O email informado é inválido. Verifique e tente novamente.";
    case "auth/weak-password":
        return "A senha deve ter pelo menos 6 caracteres.";
    case "auth/invalid-credential":
      return "E-mail ou senha inválidos.";
    case "auth/user-not-found":
      return "Nenhuma conta encontrada com esse email.";
    case "auth/wrong-password":
      return "Senha incorreta. Tente novamente.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns segundos e tente novamente.";
    default:
      return error.code;
  }
}

export function toastError(msg) { //Para exibição de mensagens de erro
  const box = document.createElement("div");
  box.className = "toast-error-msg";
  box.textContent = msg;
  document.body.appendChild(box);

  setTimeout(() => box.remove(), 5000);
}

export function toastSuccess(msg) { //Para exibição de mensagens de sucesso
  const box = document.createElement("div");
  box.className = "toast-success-msg";
  box.textContent = msg;
  document.body.appendChild(box);

  setTimeout(() => box.remove(), 5000);
}

