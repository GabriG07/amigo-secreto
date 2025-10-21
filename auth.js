//Tratamento do login e firebase
import { auth, db } from './firebaseconfig.js';
import { Pessoa } from './pessoa.js';
import { Sorteio } from './sorteio.js';
import { getFirestore, setDoc, getDoc, doc, collection, query, where } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// -------------------------
// 🔧 Configuração do Firebase
// -------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDqdHnNCq_5ce2WaASz0-BriGO8ampNLvE",
  authDomain: "amigosecreto-bec0a.firebaseapp.com",
  projectId: "amigosecreto-bec0a",
  storageBucket: "amigosecreto-bec0a.appspot.com",
  messagingSenderId: "153625267113",
  appId: "1:153625267113:web:4c891417a0c7ad560652b8"
};

const provider = new GoogleAuthProvider();

// -------------------------
// 🔑 Login e Cadastro
// -------------------------
document.getElementById('loginEmail').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();
  try {
    
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    alert("Erro no login: " + error.message);
  }
});

document.getElementById('cadastroEmail').addEventListener('click', async () => {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value.trim();

  if (!nome || !email || !senha) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    await updateProfile(cred.user, { displayName: nome });

    const pessoa = new Pessoa(nome, email);
    await setDoc(doc(db, "usuarios", cred.user.uid), pessoa.toObject());

    document.getElementById('meuNome').textContent = nome;
    alert(`Conta criada com sucesso! Bem-vindo, ${nome}! 🎉`);
  } catch (error) {
    alert("Erro ao criar conta: " + error.message);
  }
});

// -------------------------
// 🔐 Login com Google
// -------------------------
document.getElementById('loginGoogle').addEventListener('click', async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    alert("Erro ao logar com Google: " + error.message);
  }
});


// -------------------------
// 👀 Observa se está logado
// -------------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Aguarda ligeiramente para garantir que o displayName foi atualizado
    await new Promise(res => setTimeout(res, 800));

    // Busca nome no Firestore
    let nomeUsuario = user.displayName || user.email || user.phoneNumber;

    try {
      const dadosUsuario = await buscarUsuarioPorEmail(user.email);

      if (dadosUsuario && dadosUsuario.nome) {
        nomeUsuario = dadosUsuario.nome;
      } else {
        console.warn("⚠️ Usuário não encontrado na coleção 'usuarios' com esse e-mail.");
      }
    } catch (e) {
      console.error("❌ Erro ao buscar usuário por e-mail:", e);
    }

    // Atualiza tela
    document.getElementById('login').style.display = 'none';
    document.getElementById('resultado').style.display = 'block';
    document.getElementById('meuNome').textContent = nomeUsuario;

    // Busca sorteio
    const docSorteio = doc(db, "sorteio", "resultado");
    const snapSorteio = await getDoc(docSorteio);

    if (snapSorteio.exists()) {
      const pares = snapSorteio.data();
      const amigo = pares[nomeUsuario];
      document.getElementById('amigoNome').textContent = amigo || "Você não está na lista 😕";
    } else {
      document.getElementById('amigoNome').textContent = "Sorteio não encontrado";
    }

    // Exibe botões
    const btnCriar = document.getElementById('btnCriarSorteio');
    const btnVer = document.getElementById('btnVerSorteios');
    const btnEntrar= document.getElementById('btnEntrarSorteio');
    const btnEntrar2 = document.getElementById('btnEntrarSorteio2');

    btnCriar.onclick = async () => {
      const nome = document.getElementById('meuNome').textContent;
      const id = await Sorteio.criar(user.email, nome);
      alert(`🎁 Novo amigo secreto criado com ID: ${id}`);
    };

    btnVer.onclick = async () => {
      const lista = document.getElementById("listaSorteios");
      lista.innerHTML = "<li>Carregando...</li>";

      const sorteios = await Sorteio.listarPorEmail(user.email);
      lista.innerHTML = "";

      if (sorteios.length === 0) {
        lista.innerHTML = "<li>Nenhum amigo secreto encontrado 😕</li>";
      } else {
        sorteios.forEach(s => {
          const li = document.createElement("li");
          li.textContent = `🎁 ${s.id} — Admin: ${s.adminNome} (${s.participantes.length} participantes)`;

          li.addEventListener("mouseenter", () => li.style.cursor = "pointer");

          li.addEventListener("click", async () => {
            console.log(`Sorteio clicado: ${s.id}`);

            // Cria ou seleciona área para exibir os participantes
            let divParticipantes = document.getElementById("participantesSorteio");
            if (!divParticipantes) {
              divParticipantes = document.createElement("div");
              divParticipantes.id = "participantesSorteio";
              divParticipantes.style.marginTop = "15px";
              lista.parentElement.appendChild(divParticipantes);
            }

            // Verifica se há participantes
            if (s.participantes && s.participantes.length > 0) {
              const ul = document.createElement("ul");
              ul.innerHTML = "";

              s.participantes.forEach((p, i) => {
                const item = document.createElement("li");
                item.style.display = "flex";
                item.style.justifyContent = "space-between";
                item.style.alignItems = "center";

                const nome = document.createElement("span");
                nome.textContent = `👤 ${p.nome || p}`;
                item.appendChild(nome);

                // Se o usuário for o admin do sorteio, adiciona botão de excluir
                if (s.adminEmail === user.email) {
                  const btnExcluir = document.createElement("button");
                  btnExcluir.textContent = "❌";
                  btnExcluir.style.marginLeft = "10px";
                  btnExcluir.style.background = "none";
                  btnExcluir.style.border = "none";
                  btnExcluir.style.cursor = "pointer";
                  btnExcluir.style.color = "red";
                  btnExcluir.title = "Remover participante";

                  btnExcluir.addEventListener("click", async (e) => {
                    e.stopPropagation(); // impede clique no li principal
                    if (confirm(`Deseja remover ${p.nome || p} deste sorteio?`)) {
                      try {
                        // Remove o participante localmente
                        s.participantes.splice(i, 1);

                        // Atualiza no Firestore
                        const sorteioRef = doc(db, "sorteios", s.id);
                        await setDoc(sorteioRef, { participantes: s.participantes }, { merge: true });

                        alert("Participante removido com sucesso!");
                        item.remove(); // remove visualmente da lista
                      } catch (err) {
                        console.error("Erro ao remover participante:", err);
                        alert("❌ Erro ao remover participante.");
                      }
                    }
                  });

                  item.appendChild(btnExcluir);
                }

                ul.appendChild(item);
            });

            divParticipantes.innerHTML = `
              <h4>Participantes do sorteio <strong>${s.id}</strong>:</h4>
            `;
            divParticipantes.appendChild(ul);
          } else {
            divParticipantes.innerHTML = `
              <p>Este sorteio ainda não tem participantes cadastrados 😕</p>
            `;
          }
        });


          lista.appendChild(li);
        });
      }

      document.getElementById("sorteiosUsuario").style.display = "block";
    };

    btnEntrar.onclick = async () => {
      const div = document.getElementById("entrarSorteio");
      // Se estiver visível, esconde. Se estiver invisível, mostra.
      if (div.style.display === "block") {
        div.style.display = "none";
      } else {
        div.style.display = "block";
      }
    }

    btnEntrar2.onclick = async () => {
      const codigo = document.getElementById("codigoEntrada").value.trim();
      alert(codigo)

       if (codigo.length !== 5) {
        alert("O código deve ter 5 caracteres!");
        return;
      }

      await Sorteio.adicionarParticipante(codigo, nomeUsuario, user.email)
    }



  } else {
    document.getElementById('login').style.display = 'block';
    document.getElementById('resultado').style.display = 'none';
  }
});

// -------------------------
// 🚪 Logout
// -------------------------
document.getElementById('logout').addEventListener('click', async () => {
  await signOut(auth);
});



// Buscar um usuario pelo seu email
async function buscarUsuarioPorEmail(email) {
  const usuariosRef = collection(db, "usuarios");
  const q = query(usuariosRef, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log("Usuário não encontrado");
    return null;
  }

  // Se houver mais de um, pega o primeiro
  const docUser = snapshot.docs[0];
  console.log("Usuário encontrado:", docUser.id, docUser.data());
  return { id: docUser.id, ...docUser.data() };
}