//Funções utilitárias
export function capitalize(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
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

