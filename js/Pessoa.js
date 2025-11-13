import { auth, db } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { getFirestore, setDoc, getDoc, doc, collection, query, where, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

//Rodando localmente:
//import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "firebase/firestore";

export class Pessoa {
    constructor(nome, email, avatar, preferencias = {}) {
        this.nome = nome;
        this.email = email;
        this.avatar = avatar;
        this.preferencias = preferencias; // novo objeto com calça, camisa, etc.
    }

    toFirestore() {
        return {
            nome: this.nome,
            email: this.email,
            avatar: this.avatar,
            preferencias: {...this.preferencias} // insere dinamicamente os novos campos
        };
    }

    toFirestoreSemPreferencias() {
        return {
            nome: this.nome,
            email: this.email,
            avatar: this.avatar,
        };
    }

    async salvar(cred) {
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
        return new Pessoa(data.nome, data.email, data.avatar, data.preferencias);
    }

    async editarAvatar(novoAvatar){
        try{
            const user = auth.currentUser;
            if(!user){
                console.log("Usuário não autenticado!");
                return;
            }

            const ref = doc(db, "usuarios", user.uid);
            await updateDoc(ref, {avatar: novoAvatar});
            this.avatar = novoAvatar;

            //Pega os sorteios que o usuario participa e atualiza o avatar na tabela deles também
            const sorteiosParticipante = await Sorteio.listarPorEmail(this.email);
            sorteiosParticipante.forEach((s) => {
                s.editarAvatar(this.email, novoAvatar);
            });
        }
        catch(e){
            console.log("Erro ao atualizar o avatar: " + e);
        }
    }

    static async buscarUidPeloEmail(email) {
        const q = query(collection(db, "usuarios"), where("email", "==", email));
        const snap = await getDocs(q);

        if (snap.empty) return null;

        return snap.docs[0].id;
    }

    
}
