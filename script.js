//Configuração do Firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc, getDoc } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.firebasestorage.app",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



class Pessoa {
    constructor(nome, email = null){
        this.nome = nome;
        this.email = email;
    }
}

class Sorteio {
    constructor(admin){
        this.id = null;
        this.admin = admin;
        this.participantes = [];
        this.resutado = new Map();
        this.gerarId();
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
}


const participantes = [];
const relacaoSorteados = new Map();

// Criando os participantes e adicionando na lista
const p1 = new Pessoa("Bitela");
const p2 = new Pessoa("Cuse");
const p3 = new Pessoa("Prima");
const p4 = new Pessoa("Vidoca");
const p5 = new Pessoa("Bicha");
participantes.push(p1, p2, p3, p4, p5);
sorteio(participantes);


// Função para embaralhar um array
function shuffle(array) {
  array.sort(() => Math.random() - 0.5);
}

function sorteio(participantes){
    const sorteados = [...participantes];
    shuffle(participantes);
    shuffle(sorteados);
    noRepeat(participantes, sorteados);
    
}

//Embaralha segundo array até ninguém tirar a si mesmo
function noRepeat(participantes, sorteados){
    let contador = 0;
    let valido = false;
    while (!valido){
        shuffle(sorteados);
        valido = true;
        for(let i = 0; i < participantes.length; i++){
            if(participantes[i] === sorteados[i]){
                valido = false;
                break;
            }
        }
        contador++;
    }
    console.log("Iterações necessárias: " + contador);
    fillMap(participantes, sorteados);
}


//Prenche Map com a relação com quem sorteou quem
function fillMap(participantes, sorteados){
    for(let i = 0; i < participantes.length; i++){
        relacaoSorteados.set(participantes[i], sorteados[i]);
    }
    printMapSorteados();
    salvarResultado();
}

function printMapSorteados(){
    relacaoSorteados.forEach((v, k) => console.log(k.id + " -> " + v.id));
}

async function salvarResultado() {
    const pares = {};
    relacaoSorteados.forEach((v, k) => {
        pares[k.nome] = v.nome;
    });

    try {
        await setDoc(doc(db, "sorteio", "resultado"), pares);
        console.log("Resultado salvo no Firestore com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar no Firestore:", e);
    }
}
