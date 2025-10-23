import { auth, db } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

export class Pessoa {
    constructor(nome, email, avatar){
        this.nome = nome;
        this.email = email;
        this.avatar = avatar
    }

    toFirestore() {
        return {
            nome: this.nome,
            email: this.email,
            avatar: this.avatar
        };
    }

    async salvar(cred){
        await setDoc(doc(db, "usuarios", cred.user.uid), this.toFirestore());
    }

    static async carregar(uid) {
        const ref = doc(db, "usuarios", uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            console.error("❌ Usuário não encontrado:", uid);
            return null;
        }

        const data = snap.data();
        return new Pessoa(data.nome, data.email, data.avatar);
    }
}