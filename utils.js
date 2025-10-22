//Funções utilitárias
export function capitalize(str) {
    if (!str) return "";
    return str
        .toLowerCase()
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}
