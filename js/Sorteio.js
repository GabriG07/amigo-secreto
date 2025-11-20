import { db } from './firebaseConfig.js';
import { Pessoa } from './Pessoa.js';
import { setDoc, getDoc, doc, collection, query, where, getDocs, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

//Rodando Localmente
//import { setDoc, getDoc, doc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";


export class Sorteio {
    constructor(admin){
        this.id = null;
        this.admin = admin;
        this.criadoEm = Date.now();
        this.participantes = [];
        this.resultado = new Map();
        this.sorteado = false;

        this.nome = null;
        this.valorMaximo = null;
        this.dataEvento = null;

    }

    // Função para embaralhar um array
    shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    async sortear(){
        try{
            const sorteados = [...this.participantes];
            this.shuffle(this.participantes);
            this.shuffle(sorteados);
            await this.noRepeat(sorteados);  
            this.sorteado = true;

            //Atualiza no firestore
            const sorteioRef = doc(db, "sorteios", this.id);
            await updateDoc(sorteioRef, { sorteado: true });
        }
        catch(e){
            throw new Error(e.message);
        }
        
    }

    //Embaralha segundo array até ninguém tirar a si mesmo
    async noRepeat(sorteados){
        let contador = 0;
        let valido = false;
        while (!valido){
            this.shuffle(sorteados);
            valido = true;
            for(let i = 0; i < this.participantes.length; i++){
                if(this.participantes[i] === sorteados[i]){
                    valido = false;
                    break;
                }
            }
            contador++;
        }
        console.log("Iterações necessárias: " + contador);
        await this.fillMap(sorteados);
    }

    async fillMap(sorteados){
        for(let i = 0; i < this.participantes.length; i++){
            this.resultado.set(this.participantes[i], sorteados[i]);
        }
        this.printMapSorteados();
        await this.salvarResultado();
    }

    printMapSorteados(){
        this.resultado.forEach((v, k) => console.log(k.nome + " -> " + v.nome));
    }

    async salvarResultado() {
        const pares = {};
        this.resultado.forEach((v, k) => {
            pares[k.email] = v.toFirestoreResultado();
        });

        try {
            await setDoc(doc(db, "resultados", this.id), pares);
            console.log("Resultado salvo no Firestore com sucesso!");
        } catch (e) {
            console.error("Erro ao salvar no Firestore:", e);
            throw new Error(e.message);
        }
    }

    toFirestore() { //Usado apenas para salvar o resultado do sorteio (pelo menos por enquanto)
        return {
            adminEmail: this.admin.email,
            criadoEm: this.criadoEm,
            participantes: null,
            sorteado: this.sorteado
        };
    }

    async gerarId() {
        const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        let id;
        const dbRef = collection(db, "sorteios");

        // Gera ID único
        do {
            id = Array.from({ length: 5 }, () =>
            letras[Math.floor(Math.random() * letras.length)]
            ).join("");
        } while ((await getDoc(doc(db, "sorteios", id))).exists());

        this.id = id;
        console.log("🆔 ID único gerado:", this.id);
        return id;
    }

    // Cria um novo sorteio no banco
    async criar() {
        const id = await this.gerarId();

        // Estrutura do novo sorteio
        const novo = {
            adminEmail: this.admin.email,
            criadoEm: this.criadoEm,
            nome: this.nome,
            valorMaximo: this.valorMaximo,
            dataEvento: this.dataEvento,
            participantes: [{email: this.admin.email}],
            sorteado: this.sorteado
        };

        try {
            await setDoc(doc(db, "sorteios", id), novo);
            console.log(`🎁 Novo sorteio criado: ${id} (${this.admin.nome})`);
           
            return id;
        } catch (e) {
            console.error("❌ Erro ao criar sorteio:", e);
            throw e;
        }
    }


    // Lista todos os sorteios em que um usuário participa
    static async listarPorEmail(email) {
        const q = query(collection(db, "sorteios"));
        const snapshot = await getDocs(q);

        // Armazena IDs de sorteios em que o usuário participa
        const ids = snapshot.docs
            .filter(docSnap => {
                const data = docSnap.data();
                return data.participantes?.some(p => p.email === email);
            })
            .map(docSnap => docSnap.id);

        // Carrega cada sorteio e adiciona no array
        const resultados = [];
        for (const id of ids) {
            const sorteio = await Sorteio.carregar(id);
            if (sorteio) resultados.push(sorteio);
        }

        return resultados;
    }

    async adicionarParticipante(participante) {
        const sorteioRef = doc(db, "sorteios", this.id);
        const snap = await getDoc(sorteioRef);

        try {   
            if (!snap.exists()) {
                alert(`O Amigo Secreto não existe!`);
                return;
            }

            if (!this.participantes.some(p => p.email === participante.email)) {
                this.participantes.push(participante);
            }
            else{
                alert(`Você já está participando do Amigo Secreto ${this.id}`)
                return;
            }

            await updateDoc(sorteioRef, {
                participantes: arrayUnion({
                    email: participante.email,
                })
            });
            alert(`✅ Entrada com sucesso no sorteio ${this.id}!`);
        } catch (error) {
            alert("❌ Erro ao entrar no sorteio: " + error.message);
        }
    }

    async removerParticipante(email) {
        if(email == this.admin.email){ //Admin não pode remover ele mesmo
            alert("Você não pode se remover!")
            return false;
        }

        try {
            this.participantes = this.participantes.filter(p => p.email !== email); //mantém todos os participantes, exceto o que queremos remover

            const participantesFS = this.participantes.map(p => ({
                email: p.email
            }));

            const sorteioRef = doc(db, "sorteios", this.id);
            await setDoc(sorteioRef, { participantes: participantesFS }, { merge: true });

            console.log(`🗑️ Participante com email ${email} removido do sorteio ${this.id}`);
            return true;
        } catch (err) {
            console.error("Erro ao remover participante:", err);
            alert("❌ Erro ao remover participante.");
            return false;
        }
    }


    // Carrega um sorteio do Firestore e recria o objeto Sorteio
    static async carregar(id) {
        const ref = doc(db, "sorteios", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            alert("❌ Sorteio não encontrado: " + id);
            return null;
        }

        const data = snap.data();

        // Reconstrói o admin como Pessoa
        const admin = new Pessoa(null, data.adminEmail);
        const sorteio = new Sorteio(admin);

        // Reatribui o ID e outros campos
        sorteio.id = id;
        sorteio.criadoEm = data.criadoEm;
        sorteio.sorteado = data.sorteado;        
        sorteio.nome = data.nome ?? null;
        sorteio.valorMaximo = data.valorMaximo ?? null;
        sorteio.dataEvento = data.dataEvento ?? null;

        // Reconstrói os participantes (que vieram como objetos simples)
        sorteio.participantes = (data.participantes || []).map(
            p => new Pessoa(null, p.email)
        );

        if(sorteio.sorteado){
            try{
                const resultadoRef = doc(db, "resultados", id);
                const resultadoSnap = await getDoc(resultadoRef);
                if (resultadoSnap.exists()) {
                    const pares = resultadoSnap.data();

                    // pares = { [email]: {email} }
                    for (const [email, v] of Object.entries(pares)) {
                        const k = sorteio.participantes.find(p => p.email === email);
                        const vPessoa = new Pessoa(null, v.email);
                        if (k) sorteio.resultado.set(k, vPessoa);
                    }
                    console.log(`🧩 Resultado reconstruído com ${sorteio.resultado.size} pares.`);
                } else {
                    console.warn("⚠️ Nenhum resultado encontrado para o sorteio:", id);
                }
            } catch (err) {
                console.error("Erro ao carregar resultado:", err);
            }
        }

        console.log(sorteio.resultado);
        console.log(`🎁 Sorteio ${id} carregado com sucesso!`);
        return sorteio;
    }

    // Dado o email de um participante, busca quem ele tirou no amigo secreto
    buscaResultadoPorEmail(email){
        let amigo = null;
        for (const [chave, valor] of this.resultado) {
            if (chave.email === email) {
                amigo = valor;
                break;
            }
        }
        return amigo
    }
}


