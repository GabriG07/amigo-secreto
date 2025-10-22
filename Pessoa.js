import { auth, db } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { capitalize } from './utils.js';

export class Pessoa {
    constructor(nome, email = null){
        this.nome = capitalize(nome);
        this.email = email;
    }

    toFirestore() {
        return {
            nome: this.nome,
            email: this.email,
        };
    }

    async salvar(cred){
        await setDoc(doc(db, "usuarios", cred.user.uid), this.toFirestore());
    }
}