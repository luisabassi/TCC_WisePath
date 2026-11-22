// Barra lateral: lista, busca, renomear e excluir chats (estende Telas.chat)
Object.assign(Telas.chat, {
  async carregarChats(raiz) {
    const estado = this._estado;
    estado.chatsCarregados = true;

    const usuario = Autenticacao.obterUsuario();
    if (!usuario) return;

    try {
      estado.chats = await Api.listarChats(usuario.idUsuario);
    } catch (erro) {
      estado.chats = [];
      estado.erro = erro.message;
      this.renderizar(raiz);
      return;
    }

    if (estado.chats.length > 0 && !estado.idChat) {
      this.abrirChat(raiz, estado.chats[0].idChat);
    } else {
      this.renderizar(raiz);
    }
  },

  // Cada chat tem a sua sessão: uma resposta em andamento em outro chat continua
  // e é guardada no lugar certo.
  async abrirChat(raiz, idChat) {
    const estado = this._estado;

    let sessao = estado.sessoes.get(idChat);
    if (!sessao) {
      sessao = novaSessao(idChat);
      estado.sessoes.set(idChat, sessao);
    }

    estado.sessao = sessao;
    sessao.erro = null;
    sessao.idMensagemEmEdicao = null;
    sessao.carregandoChat = sessao.mensagens.length === 0; // com histórico em memória, mostra e atualiza por baixo
    if (this.ehMobile()) estado.barraLateralAberta = false;
    this.renderizar(raiz);

    if (sessao.digitando) return; // resposta em andamento: não recarrega por cima
    await this.sincronizarChat(raiz, sessao);
  },

  // Atualiza a sessão com o histórico do servidor; só redesenha se ela estiver na tela
  async sincronizarChat(raiz, sessao) {
    const seq = ++sessao.seq;
    let mensagens = null;
    let resultados = null;
    let erro = null;

    try {
      [mensagens, resultados] = await Promise.all([
        Api.listarMensagens(sessao.idChat),
        Api.listarResultados(sessao.idChat),
      ]);
    } catch (e) {
      erro = e;
    }

    if (seq !== sessao.seq) return; // chegou uma sincronização mais nova
    sessao.carregandoChat = false;

    if (erro) {
      if (erro.status === 403 || erro.status === 404) {
        this.descartarSessao(raiz, sessao, erro.message); // a conversa não existe mais ou não é do usuário
        return;
      }
      sessao.erro = erro.message;
      if (this.sessaoVisivel(sessao)) this.renderizar(raiz);
      return;
    }

    // não atropela uma ação do usuário em andamento
    if (sessao.digitando || sessao.idMensagemEmEdicao !== null) {
      if (this.sessaoVisivel(sessao)) this.renderizarMensagens(raiz);
      return;
    }

    const antes = this.assinatura(sessao.mensagens);

    sessao.mensagens = mensagens.map((m) => ({
      id: m.idMensagem,
      autor: m.autor === "USUARIO" ? "usuario" : "chatbot",
      conteudo: m.conteudo,
    }));

    if (resultados.length > 0) {
      sessao.mensagens.push(this.montarMensagemResultado(resultados[0]));
      sessao.etapa = TOTAL_RESPOSTAS;
    } else {
      const respostasDadas = sessao.mensagens.filter((m) => m.autor === "usuario").length;
      sessao.etapa = Math.min(respostasDadas, TOTAL_RESPOSTAS);
    }

    const mudou = antes !== this.assinatura(sessao.mensagens) || !raiz.querySelector(".chat-messages-list");
    if (this.sessaoVisivel(sessao) && mudou) {
      this.renderizarMensagens(raiz);
    }
  },

  assinatura(mensagens) {
    return mensagens.map((m) => `${m.id}:${m.conteudo}`).join("\u0001");
  },

  // A conversa sumiu do servidor (excluída em outra janela, id inválido na URL...)
  descartarSessao(raiz, sessao, mensagem) {
    const estado = this._estado;
    estado.sessoes.delete(sessao.idChat);
    estado.chats = estado.chats.filter((c) => c.idChat !== sessao.idChat);
    CacheMapas.mapas = CacheMapas.mapas.filter((m) => m.idChat !== sessao.idChat);

    if (estado.sessao === sessao) {
      estado.sessao = novaSessao();
      estado.sessao.erro = mensagem;
    }
    if (EstadoApp.tela === "chat") this.renderizar(raiz);
  },

  novoChat(raiz) {
    const estado = this._estado;
    // a sessão anterior, se estiver respondendo, continua viva no mapa de sessões
    estado.sessao = novaSessao();
    if (this.ehMobile()) estado.barraLateralAberta = false;
    this.renderizar(raiz);
  },

  abrirEmNovaJanela(idChat) {
    window.open(`/chat/${idChat}`, "_blank", "noopener");
  },

  iniciarRenomear(raiz, idChat) {
    this._estado.idChatEmEdicao = idChat;
    this.renderizar(raiz);
  },

  cancelarRenomear(raiz) {
    this._estado.idChatEmEdicao = null;
    this.renderizar(raiz);
  },

  async confirmarRenomear(raiz, idChat, novoNome) {
    const estado = this._estado;
    if (estado.idChatEmEdicao !== idChat) return; // evita salvar duas vezes (Enter + blur)
    estado.idChatEmEdicao = null;

    const nome = novoNome.trim();
    const atual = estado.chats.find((c) => c.idChat === idChat);
    if (!nome || !atual || nome === atual.nome) {
      this.renderizar(raiz);
      return;
    }

    try {
      const atualizado = await Api.renomearChat(idChat, nome);
      estado.chats = estado.chats.map((c) => (c.idChat === idChat ? { ...c, nome: atualizado.nome } : c));
      estado.erro = null;
    } catch (erro) {
      estado.erro = erro.message;
    }
    this.renderizar(raiz);
    // o novo nome pode ter deixado de combinar com o termo buscado
    if (estado.termoBusca.trim()) this.executarBusca(raiz);
  },

  async excluirChat(raiz, idChat) {
    const estado = this._estado;
    const chat = estado.chats.find((c) => c.idChat === idChat);
    if (!chat) return;
    if (!confirm(`Excluir a conversa "${chat.nome}"? Essa ação não pode ser desfeita.`)) return;

    try {
      await Api.excluirChat(idChat);
    } catch (erro) {
      estado.erro = erro.message;
      this.renderizar(raiz);
      return;
    }

    estado.chats = estado.chats.filter((c) => c.idChat !== idChat);
    estado.sessoes.delete(idChat);
    // o back-end apaga o resultado e o mapa mental junto com o chat
    CacheMapas.mapas = CacheMapas.mapas.filter((m) => m.idChat !== idChat);
    if (estado.resultadosBusca) {
      estado.resultadosBusca = estado.resultadosBusca.filter((c) => c.idChat !== idChat);
    }
    estado.erro = null;

    if (estado.idChat === idChat) {
      this.novoChat(raiz);
    } else {
      this.renderizar(raiz);
    }
  },

  // ─── Busca de chats ───────────────────────────────────────────────────────
  // Sem termo mostra a lista normal; com termo, o que o servidor devolveu
  chatsVisiveis() {
    const estado = this._estado;
    if (estado.termoBusca.trim() === "") return estado.chats;
    return estado.resultadosBusca || [];
  },

  async executarBusca(raiz) {
    const estado = this._estado;
    const termo = estado.termoBusca.trim();
    const seq = ++estado.buscaSeq;

    if (!termo) {
      estado.resultadosBusca = null;
      estado.buscaCarregando = false;
      estado.erroBusca = null;
      this.atualizarListaChats(raiz);
      return;
    }

    estado.buscaCarregando = true;
    estado.erroBusca = null;
    if (estado.resultadosBusca === null) this.atualizarListaChats(raiz); // mostra "Buscando…"

    let resultados = null;
    let erro = null;
    try {
      resultados = await Api.buscarChats(termo);
    } catch (e) {
      erro = e.message;
    }

    if (seq !== estado.buscaSeq) return; // chegou uma busca mais nova
    estado.buscaCarregando = false;
    estado.resultadosBusca = erro ? [] : resultados;
    estado.erroBusca = erro;
    this.atualizarListaChats(raiz);
  },

  criarCampoBusca() {
    return Modelos.criar("chat/campo-busca", { termo: this._estado.termoBusca });
  },

  criarListaRecentes() {
    const estado = this._estado;
    const buscando = estado.termoBusca.trim() !== "";
    const lista = this.chatsVisiveis();

    const partes = [Modelos.criar("chat/rotulo-recentes", { rotulo: buscando ? "Resultados" : "Recentes" })];

    lista.forEach((chat) => {
      const dados = { idChat: chat.idChat, nome: chat.nome };
      const modelo = chat.idChat === estado.idChatEmEdicao ? "chat/linha-chat-edicao" : "chat/linha-chat";
      const linha = Modelos.criar(modelo, dados);
      if (chat.idChat === estado.idChat) linha.firstElementChild.classList.add("active");
      partes.push(linha);
    });

    let aviso = null;
    if (buscando && estado.resultadosBusca === null) aviso = "Buscando…";
    else if (buscando && estado.erroBusca) aviso = estado.erroBusca;
    else if (buscando && lista.length === 0) aviso = "Nenhum chat encontrado.";
    if (aviso) partes.push(Modelos.criar("chat/aviso-lateral", { mensagem: aviso }));

    return partes;
  },

  // Atualiza só a lista (sem renderizar tudo) para não perder o foco do campo de busca
  // nem fechar a barra lateral no mobile
  atualizarListaChats(raiz) {
    const recentes = raiz.querySelector(".sidebar-recents");
    if (!recentes) return;
    recentes.replaceChildren(...this.criarListaRecentes());
    this.conectarLista(raiz);
  },

  alternarBusca(raiz) {
    const estado = this._estado;
    estado.buscaAberta = !estado.buscaAberta;
    if (!estado.buscaAberta) {
      clearTimeout(estado.buscaTemporizador);
      estado.buscaSeq++; // invalida qualquer busca em andamento
      estado.termoBusca = "";
      estado.resultadosBusca = null;
      estado.buscaCarregando = false;
      estado.erroBusca = null;
    }

    const existente = raiz.querySelector("#chat-campo-busca");
    if (estado.buscaAberta && !existente) {
      raiz.querySelector(".sidebar-actions").append(this.criarCampoBusca());
      this.conectarBusca(raiz);
      raiz.querySelector("#chat-campo-busca").focus();
    } else if (!estado.buscaAberta && existente) {
      existente.remove();
    }
    this.atualizarListaChats(raiz);
  },

  conectarBusca(raiz) {
    const estado = this._estado;
    const campo = raiz.querySelector("#chat-campo-busca");
    if (!campo) return;

    campo.addEventListener("input", () => {
      estado.termoBusca = campo.value;
      clearTimeout(estado.buscaTemporizador);
      if (!campo.value.trim()) {
        this.executarBusca(raiz); // campo vazio: volta à lista normal na hora
        return;
      }
      // na primeira digitação troca a lista cheia por "Buscando…" (não mostra chats sem filtro)
      if (estado.resultadosBusca === null) this.atualizarListaChats(raiz);
      // espera o usuário parar de digitar antes de chamar o back-end
      estado.buscaTemporizador = setTimeout(() => this.executarBusca(raiz), 300);
    });
    campo.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") this.alternarBusca(raiz);
    });
  },

  conectarLista(raiz) {
    raiz.querySelectorAll(".sidebar-chat-item").forEach((botao) => {
      const id = Number(botao.getAttribute("data-id-chat"));
      botao.addEventListener("click", (evento) => {
        // Ctrl/Cmd + clique abre em outra janela, como um link comum
        if (evento.ctrlKey || evento.metaKey) this.abrirEmNovaJanela(id);
        else this.abrirChat(raiz, id);
      });
      botao.addEventListener("auxclick", (evento) => {
        if (evento.button === 1) {
          evento.preventDefault();
          this.abrirEmNovaJanela(id);
        }
      });
    });

    raiz.querySelectorAll(".chat-action-btn").forEach((botao) => {
      botao.addEventListener("click", (evento) => {
        evento.stopPropagation();
        const id = Number(botao.getAttribute("data-id-chat"));
        const acao = botao.getAttribute("data-acao");
        if (acao === "renomear") this.iniciarRenomear(raiz, id);
        else if (acao === "nova-janela") this.abrirEmNovaJanela(id);
        else this.excluirChat(raiz, id);
      });
    });

    const campoEdicao = raiz.querySelector(".sidebar-chat-edit");
    if (campoEdicao) {
      const id = Number(campoEdicao.getAttribute("data-id-chat"));
      campoEdicao.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
          evento.preventDefault();
          this.confirmarRenomear(raiz, id, campoEdicao.value);
        } else if (evento.key === "Escape") {
          this.cancelarRenomear(raiz);
        }
      });
      campoEdicao.addEventListener("blur", () => this.confirmarRenomear(raiz, id, campoEdicao.value));
      campoEdicao.focus();
      campoEdicao.select();
    }
  },
});
