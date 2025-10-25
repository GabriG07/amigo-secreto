import { auth, db } from './firebaseConfig.js';
import { Sorteio } from './Sorteio.js';
import { getFirestore, setDoc, getDoc, doc, collection, query, where, updateDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

//Rodando localmente:
//import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "firebase/firestore";

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
        }
        catch(e){
            console.log("Erro ao atualizar o avatar: " + e);
        }
    }

    static async carregarPorEmail(email) {
        try {
            const q = query(collection(db, "usuarios"), where("email", "==", email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.warn("⚠️ Nenhum usuário encontrado com o email:", email);
                return null;
            }

            // Como email é único, pega o primeiro resultado
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            return new Pessoa(data.nome, data.email, data.avatar);
        } catch (e) {
            console.error("❌ Erro ao buscar usuário por email:", e);
            return null;
        }
    }
}