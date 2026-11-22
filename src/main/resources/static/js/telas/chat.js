const TOTAL_RESPOSTAS = 5;

function novaSessao(idChat = null) {
  return {
    idChat, // null = conversa nova, ainda não criada no servidor
    mensagens: [],
    etapa: 0,
    digitando: false,
    carregandoChat: false,
    erro: null,
    idMensagemEmEdicao: null,
    seq: 0, // identifica a sincronização mais recente 
  };
}

const CAMPOS_DA_SESSAO = ["idChat", "mensagens", "etapa", "digitando", "carregandoChat", "erro", "idMensagemEmEdicao"];

Telas.chat = {
  _estado: {
    sessao: novaSessao(), // a conversa que está na tela
    sessoes: new Map(), // conversas abertas nesta aba, por id do chat
    barraLateralAberta: true,
    chats: [],
    chatsCarregados: false,
    idChatEmEdicao: null,
    buscaAberta: false,
    termoBusca: "",
    resultadosBusca: null, // null = ainda sem resultado do back-end para o termo atual
    buscaCarregando: false,
    erroBusca: null,
    buscaSeq: 0, // identifica a busca mais recente 
    buscaTemporizador: null, // debounce da digitação
    chatParaAbrir: null, // pedido vindo de outra tela 
  },

  ehMobile() {
    return window.innerWidth < 768;
  },

  sessaoVisivel(sessao) {
    return this._estado.sessao === sessao && EstadoApp.tela === "chat";
  },

  // O servidor usa este id para detectar que outra aba/janela alterou o chat
  ultimaMensagemId(sessao) {
    for (let i = sessao.mensagens.length - 1; i >= 0; i--) {
      if (typeof sessao.mensagens[i].id === "number") return sessao.mensagens[i].id;
    }
    return 0;
  },

  // /chat/:id identifica a conversa da aba, então recarregar ou abrir em outra janela funciona
  caminhoAtual() {
    const estado = this._estado;
    const id = estado.chatParaAbrir || estado.sessao.idChat;
    return id ? `/chat/${id}` : ROTAS.chat;
  },

  atualizarUrl() {
    if (EstadoApp.tela !== "chat") return;
    const caminho = this.caminhoAtual();
    if (window.location.pathname !== caminho) {
      window.history.replaceState({ tela: "chat" }, "", caminho);
    }
  },

  // Logout
  reiniciar() {
    const estado = this._estado;
    estado.sessao = novaSessao();
    estado.sessoes.clear();
    estado.chats = [];
    estado.chatsCarregados = false;
    estado.chatParaAbrir = null;
    estado.idChatEmEdicao = null;
    estado.buscaAberta = false;
    estado.termoBusca = "";
    estado.resultadosBusca = null;
  },

  solicitarAbertura(idChat) {
    this._estado.chatParaAbrir = idChat;
  },

  renderizar(raiz) {
    const estado = this._estado;

    // abrirChat() chama renderizar() de novo
    if (estado.chatParaAbrir) {
      const idChat = estado.chatParaAbrir;
      estado.chatParaAbrir = null;
      this.abrirChat(raiz, idChat);
      return;
    }

    this.atualizarUrl();

    if (this.ehMobile()) estado.barraLateralAberta = false;

    if (!estado.chatsCarregados) this.carregarChats(raiz);

    const tela = Modelos.criar(
      "chat/tela",
      { barraLateralAberta: estado.barraLateralAberta, erro: estado.erro },
      { "campo-busca": estado.buscaAberta ? this.criarCampoBusca() : null },
    );
    tela.querySelector("#chat-barra-lateral").classList.add(estado.barraLateralAberta ? "open" : "closed");
    tela.querySelector("#chat-recentes").replaceChildren(...this.criarListaRecentes());
    raiz.replaceChildren(tela);

    this.renderizarMensagens(raiz);
    this.conectarEventos(raiz);
  },

  atualizarBotaoEnvio(raiz) {
    const estado = this._estado;
    const entrada = raiz.querySelector("#chat-entrada");
    const botaoEnviar = raiz.querySelector("#chat-enviar");
    if (!entrada || !botaoEnviar) return;
    const desabilitado = !entrada.value.trim() || estado.digitando || estado.carregandoChat;
    botaoEnviar.disabled = desabilitado;
    botaoEnviar.replaceChildren(Icones.criar("enviar", desabilitado ? "#c0c8d8" : "#0d1b4b"));
  },

  conectarEventos(raiz) {
    const estado = this._estado;

    const fecharBarra = () => {
      estado.barraLateralAberta = false;
      this.renderizar(raiz);
    };
    const abrirBarra = () => {
      estado.barraLateralAberta = true;
      this.renderizar(raiz);
    };

    raiz.querySelector("#chat-fechar-barra").addEventListener("click", fecharBarra);

    const botaoAbrirBarra = raiz.querySelector("#chat-abrir-barra");
    if (botaoAbrirBarra) botaoAbrirBarra.addEventListener("click", abrirBarra);

    const sobreposicao = raiz.querySelector("#chat-sobreposicao");
    if (estado.barraLateralAberta && this.ehMobile()) {
      sobreposicao.classList.add("visible");
      sobreposicao.addEventListener("click", fecharBarra);
    }

    raiz.querySelector("#chat-inicio").addEventListener("click", () => irParaTela("inicio"));
    raiz.querySelector("#chat-mapas").addEventListener("click", () => irParaTela("mapas"));
    raiz.querySelector("#chat-sair").addEventListener("click", () => {
      Autenticacao.limpar();
      irParaTela("login", { substituir: true });
    });

    raiz.querySelector("#chat-novo").addEventListener("click", () => this.novoChat(raiz));
    raiz.querySelector("#chat-buscar").addEventListener("click", () => this.alternarBusca(raiz));
    this.conectarBusca(raiz);
    this.conectarLista(raiz);

    const entrada = raiz.querySelector("#chat-entrada");
    entrada.addEventListener("input", () => this.atualizarBotaoEnvio(raiz));
    entrada.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        this.enviar(raiz);
      }
    });

    raiz.querySelector("#chat-enviar").addEventListener("click", () => this.enviar(raiz));
    this.atualizarBotaoEnvio(raiz);
  },

  async enviar(raiz) {
    const estado = this._estado;
    const sessao = estado.sessao;
    const entrada = raiz.querySelector("#chat-entrada");
    const texto = entrada.value.trim();
    if (!texto || sessao.digitando || sessao.carregandoChat) return;

    sessao.erro = null;
    entrada.value = "";
    sessao.digitando = true;
    this.atualizarBotaoEnvio(raiz);

    const ultimaConhecida = this.ultimaMensagemId(sessao); // antes de entrar a mensagem pendente
    const idTemporario = `pendente-${Date.now()}`;
    sessao.mensagens.push({ id: idTemporario, autor: "usuario", conteudo: texto, pendente: true });
    this.renderizarMensagens(raiz);

    try {
      if (!sessao.idChat) {
        const nome = texto.length > 40 ? texto.slice(0, 40) + "…" : texto;
        const chat = await Api.criarChat(nome);
        sessao.idChat = chat.idChat;
        estado.sessoes.set(chat.idChat, sessao);
        estado.chats = [chat, ...estado.chats];
        if (this.sessaoVisivel(sessao)) {
          this.atualizarUrl();
          this.atualizarListaChats(raiz);
        }
      }

      const [mensagemUsuario, mensagemChatbot] = await Api.enviarMensagem(sessao.idChat, texto, ultimaConhecida);

      const indice = sessao.mensagens.findIndex((m) => m.id === idTemporario);
      if (indice !== -1) {
        sessao.mensagens[indice] = {
          id: mensagemUsuario.idMensagem,
          autor: "usuario",
          conteudo: mensagemUsuario.conteudo,
        };
      }

      sessao.mensagens.push({
        id: mensagemChatbot.idMensagem,
        autor: "chatbot",
        conteudo: mensagemChatbot.conteudo,
      });

      sessao.etapa += 1;
    } catch (erro) {
      sessao.mensagens = sessao.mensagens.filter((m) => m.id !== idTemporario);
      sessao.digitando = false;
      sessao.erro = erro.message;

      if (this.sessaoVisivel(sessao)) {
        this.renderizar(raiz);
        // devolve o texto ao campo para o usuário não perder o que escreveu
        const campo = raiz.querySelector("#chat-entrada");
        if (campo && !campo.value) {
          campo.value = texto;
          this.atualizarBotaoEnvio(raiz);
        }
      }
      // outra janela alterou este chat: recarrega o histórico real do servidor
      if (erro.status === 409 && sessao.idChat) this.sincronizarChat(raiz, sessao);
      return;
    }

    sessao.digitando = false;
    if (this.sessaoVisivel(sessao)) {
      this.renderizarMensagens(raiz);
      this.atualizarBotaoEnvio(raiz);
    }

    if (sessao.etapa >= TOTAL_RESPOSTAS) {
      this.gerarResultado(raiz, sessao);
    }
  },
};

// Expõe os campos da sessão atual diretamente em _estado 
CAMPOS_DA_SESSAO.forEach((campo) => {
  Object.defineProperty(Telas.chat._estado, campo, {
    get() {
      return this.sessao[campo];
    },
    set(valor) {
      this.sessao[campo] = valor;
    },
    enumerable: true,
  });
});

// Ao voltar para a aba, o chat pode ter mudado enquanto ela estava em segundo plano
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || EstadoApp.tela !== "chat") return;
  const sessao = Telas.chat._estado.sessao;
  if (!sessao.idChat || sessao.digitando || sessao.carregandoChat || sessao.idMensagemEmEdicao !== null) return;
  Telas.chat.sincronizarChat(obterRaiz(), sessao);
});
