// Edição inline e exclusão de mensagens do usuário 
Object.assign(Telas.chat, {
  // Só mensagens do usuário já salvas no servidor têm os ícones de editar/excluir
  podeAlterarMensagem(mensagem) {
    return mensagem.autor === "usuario" && typeof mensagem.id === "number" && !mensagem.pendente;
  },

  criarLinhaUsuario(mensagem) {
    const estado = this._estado;

    if (mensagem.id === estado.idMensagemEmEdicao) {
      return Modelos.criar("chat/linha-usuario-edicao", {
        idMensagem: mensagem.id,
        conteudo: mensagem.conteudo,
      });
    }

    const linha = Modelos.criar("chat/linha-usuario", {
      podeAlterar: this.podeAlterarMensagem(mensagem) && !estado.digitando,
      idMensagem: mensagem.id,
      texto: Componentes.formatarMensagem(mensagem.conteudo),
    });
    if (mensagem.pendente) linha.querySelector(".msg-bubble").style.opacity = "0.6";
    return linha;
  },

  ajustarAltura(campo) {
    campo.style.height = "auto";
    campo.style.height = campo.scrollHeight + "px";
  },

  conectarMensagens(raiz, area) {
    area.querySelectorAll(".msg-action-btn").forEach((botao) =>
      botao.addEventListener("click", () => {
        const id = Number(botao.getAttribute("data-id-mensagem"));
        if (botao.getAttribute("data-acao-mensagem") === "editar") this.iniciarEdicaoMensagem(raiz, id);
        else this.excluirMensagem(raiz, id);
      }),
    );

    const edicao = area.querySelector(".msg-edit");
    if (!edicao) return;

    const id = Number(edicao.getAttribute("data-id-mensagem"));
    const campo = edicao.querySelector(".msg-edit-input");

    campo.addEventListener("input", () => this.ajustarAltura(campo));
    campo.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" && !evento.shiftKey) {
        evento.preventDefault();
        this.salvarEdicaoMensagem(raiz, id, campo.value);
      } else if (evento.key === "Escape") {
        this.cancelarEdicaoMensagem(raiz);
      }
    });
    edicao
      .querySelector('[data-acao-edicao="cancelar"]')
      .addEventListener("click", () => this.cancelarEdicaoMensagem(raiz));
    edicao
      .querySelector('[data-acao-edicao="salvar"]')
      .addEventListener("click", () => this.salvarEdicaoMensagem(raiz, id, campo.value));
  },

  iniciarEdicaoMensagem(raiz, id) {
    const estado = this._estado;
    if (estado.digitando) return;
    estado.idMensagemEmEdicao = id;
    this.renderizarMensagens(raiz, { rolar: false });
  },

  cancelarEdicaoMensagem(raiz) {
    this._estado.idMensagemEmEdicao = null;
    this.renderizarMensagens(raiz, { rolar: false });
  },

  recalcularEtapa(sessao) {
    const respostas = sessao.mensagens.filter((m) => m.autor === "usuario").length;
    sessao.etapa = Math.min(respostas, TOTAL_RESPOSTAS);
  },

  // O back-end apaga o resultado (e o mapa mental) quando o histórico é cortado
  descartarResultadoLocal(sessao) {
    CacheMapas.mapas = CacheMapas.mapas.filter((m) => m.idChat !== sessao.idChat);
  },

  async salvarEdicaoMensagem(raiz, id, novoTexto) {
    const sessao = this._estado.sessao; // a edição pertence a esta conversa, mesmo que o usuário troque de chat
    if (sessao.idMensagemEmEdicao !== id || sessao.digitando) return; // evita salvar duas vezes

    const indice = sessao.mensagens.findIndex((m) => m.id === id);
    if (indice === -1) return;

    const texto = novoTexto.trim();
    if (!texto) return;
    if (texto === sessao.mensagens[indice].conteudo) {
      this.cancelarEdicaoMensagem(raiz);
      return;
    }

    const anteriores = sessao.mensagens; // para desfazer se o servidor recusar
    sessao.idMensagemEmEdicao = null;
    sessao.erro = null;
    sessao.digitando = true;
    // mostra já a nova versão e esconde as mensagens posteriores
    sessao.mensagens = [...anteriores.slice(0, indice), { ...anteriores[indice], conteudo: texto, pendente: true }];
    this.renderizarMensagens(raiz);
    this.atualizarBotaoEnvio(raiz);

    try {
      const [mensagemUsuario, mensagemChatbot] = await Api.editarMensagem(sessao.idChat, id, texto);

      sessao.mensagens = [
        ...anteriores.slice(0, indice),
        { id: mensagemUsuario.idMensagem, autor: "usuario", conteudo: mensagemUsuario.conteudo },
        { id: mensagemChatbot.idMensagem, autor: "chatbot", conteudo: mensagemChatbot.conteudo },
      ];
      this.descartarResultadoLocal(sessao);
      this.recalcularEtapa(sessao);
    } catch (erro) {
      // o back-end só grava depois que a IA responde
      sessao.mensagens = anteriores;
      sessao.digitando = false;
      sessao.erro = erro.message;
      if (this.sessaoVisivel(sessao)) this.renderizar(raiz);
      // mensagem apagada em outra janela: recarrega o histórico real
      if (erro.status === 404 || erro.status === 409) this.sincronizarChat(raiz, sessao);
      return;
    }

    sessao.digitando = false;
    if (this.sessaoVisivel(sessao)) {
      this.renderizarMensagens(raiz);
      this.atualizarBotaoEnvio(raiz);
    }

    // a mensagem editada era a última pergunta do roteiro: gera a análise de novo
    if (sessao.etapa >= TOTAL_RESPOSTAS) {
      this.gerarResultado(raiz, sessao);
    }
  },

  async excluirMensagem(raiz, id) {
    const sessao = this._estado.sessao;
    if (sessao.digitando) return;

    const indice = sessao.mensagens.findIndex((m) => m.id === id);
    if (indice === -1) return;

    const posteriores = sessao.mensagens.length - indice - 1;
    const aviso =
      posteriores > 0
        ? "Excluir esta mensagem? Ela e todas as mensagens seguintes serão removidas. Essa ação não pode ser desfeita."
        : "Excluir esta mensagem? Essa ação não pode ser desfeita.";
    if (!confirm(aviso)) return;

    try {
      await Api.excluirMensagem(sessao.idChat, id);
    } catch (erro) {
      sessao.erro = erro.message;
      if (this.sessaoVisivel(sessao)) this.renderizar(raiz);
      if (erro.status === 404) this.sincronizarChat(raiz, sessao); // já apagada em outra janela
      return;
    }

    // recalcula a posição: a lista pode ter mudado enquanto o servidor respondia
    const posicao = sessao.mensagens.findIndex((m) => m.id === id);
    if (posicao !== -1) sessao.mensagens = sessao.mensagens.slice(0, posicao);
    sessao.idMensagemEmEdicao = null;
    sessao.erro = null;
    this.descartarResultadoLocal(sessao);
    this.recalcularEtapa(sessao);
    if (this.sessaoVisivel(sessao)) this.renderizar(raiz);
  },
});
