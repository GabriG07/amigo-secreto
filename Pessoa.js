export class Pessoa {
    constructor(nome, email = null){
        this.nome = nome;
        this.email = email;
    }

    toObject() {
        return {
        nome: this.nome,
        email: this.email,
        };
    }
}