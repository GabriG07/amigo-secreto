import { db } from './firebaseConfig.js';
import { Pessoa } from './pessoa.js';
import { 
  setDoc, getDoc, doc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


export class Sorteio {
    constructor(admin){
        this.id = null;
        this.admin = admin;
        this.participantes = [];
        this.resultado = new Map();
    }

    async gerarId() {
        const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        let id, existe = true;

        while (existe) {
            id = Array.from({ length: 5 }, () =>
                letras[Math.floor(Math.random() * letras.length)]
            ).join("");

            const ref = doc(db, "sorteios", id);
            const snapshot = await getDoc(ref);
            existe = snapshot.exists();
        }
        this.id = id;
        console.log("🆔 ID único gerado:", this.id);
    }

    // Função para embaralhar um array
    shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    sortear(){
        const sorteados = [...this.participantes];
        this.shuffle(this.participantes);
        this.shuffle(sorteados);
        this.noRepeat(sorteados);  
    }

    //Embaralha segundo array até ninguém tirar a si mesmo
    noRepeat(sorteados){
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
        this.fillMap(sorteados);
    }

    fillMap(sorteados){
        for(let i = 0; i < this.participantes.length; i++){
            this.resultado.set(this.participantes[i], sorteados[i]);
        }
        this.printMapSorteados();
        this.salvarResultado();
    }

    printMapSorteados(){
        this.resultado.forEach((v, k) => console.log(k.nome + " -> " + v.nome));
    }

    async salvarResultado() {
        const pares = {};
        this.resultado.forEach((v, k) => {
            pares[k.email] = v.toObject();
        });

        try {
            await setDoc(doc(db, "sorteio", "resultado"), pares);
            console.log("Resultado salvo no Firestore com sucesso!");
        } catch (e) {
            console.error("Erro ao salvar no Firestore:", e);
        }
    }

    // Cria um novo sorteio no banco
    static async criar(adminEmail, adminNome) {
        const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        let id;
        const dbRef = collection(db, "sorteios");

        // Gera ID único
        do {
            id = Array.from({ length: 5 }, () =>
            letras[Math.floor(Math.random() * letras.length)]
            ).join("");
        } while ((await getDoc(doc(db, "sorteios", id))).exists());

        // Estrutura do novo sorteio
        const novo = {
            adminEmail: adminEmail,
            adminNome: adminNome,
            participantes: [{ nome: adminNome, email: adminEmail }],
            criadoEm: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, "sorteios", id), novo);
            console.log(`🎁 Novo sorteio criado: ${id} (${adminNome})`);
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

        const resultados = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.participantes?.some(p => p.email === email)) {
            resultados.push({ id: docSnap.id, ...data });
            }
        });

        return resultados;
    }

}


/*
const p1 = new Pessoa("Bitela","bitela@gmail.com");
const p2 = new Pessoa("Papita","papita@gmail.com");
const p3 = new Pessoa("Vidoca","vidoca@gmail.com");
const p4 = new Pessoa("Prima","prima@gmail.com");
const p5 = new Pessoa("Cuse","cuse@gmail.com");
const sorteio = new Sorteio(p1);
sorteio.participantes.push(p1);
sorteio.participantes.push(p2);
sorteio.participantes.push(p3);
sorteio.participantes.push(p4);
sorteio.participantes.push(p5);

sorteio.sortear();
*/
