// Lista de mensagens e card do resultado da análise 
Object.assign(Telas.chat, {
  montarMensagemResultado(resultado) {
    const profissoes = (resultado.profissoes || [])
      .map((p, i) =>
        [
          `**${i + 1}. ${p.nome}**`,
          p.descricao || "",
          `**Média salarial:** ${p.mediaSalarial || "não informada"}`,
          `**Empregabilidade:** ${p.empregabilidade || "não informada"}`,
          `**Tendências futuras:** ${p.tendenciasFuturas || "não informadas"}`,
          `**Como começar:** ${p.comoComecar || "não informado"}`,
          `**Cursos superiores relacionados:** ${p.cursosRelacionados || "não informados"}`,
        ]
          .filter(Boolean)
          .join("\n"),
      )
      .join("\n\n");

    return {
      id: `resultado-${resultado.idResultado}`,
      autor: "chatbot",
      conteudo: `${resultado.resumo}\n\n**Profissões sugeridas:**\n\n${profissoes}`,
      idMapa: resultado.mapaMental ? String(resultado.mapaMental.idMapaMental) : null,
    };
  },

  async gerarResultado(raiz, sessao = this._estado.sessao) {
    sessao.digitando = true;
    if (this.sessaoVisivel(sessao)) this.renderizarMensagens(raiz);

    try {
      const resultado = await Api.gerarResultado(sessao.idChat);
      if (resultado.mapaMental) CacheMapas.marcarNovo(resultado.mapaMental.idMapaMental);
      sessao.mensagens.push(this.montarMensagemResultado(resultado));
      sessao.etapa = TOTAL_RESPOSTAS;
    } catch (erro) {
      sessao.mensagens.push({
        id: `chatbot-${Date.now()}`,
        autor: "chatbot",
        conteudo: "Não consegui gerar sua análise agora. Você pode tentar de novo enviando outra mensagem.",
      });
      sessao.erro = erro.message;
    }

    sessao.digitando = false;
    if (this.sessaoVisivel(sessao)) {
      this.renderizarMensagens(raiz);
      this.atualizarBotaoEnvio(raiz);
    }
  },

  criarLinhaMensagem(mensagem) {
    if (mensagem.idMapa) {
      return Modelos.criar("chat/linha-chatbot-mapa", {
        texto: Componentes.formatarMensagem(mensagem.conteudo),
        idMapa: mensagem.idMapa,
      });
    }
    if (mensagem.autor === "usuario") return this.criarLinhaUsuario(mensagem);

    return Modelos.criar("chat/linha-chatbot", { texto: Componentes.formatarMensagem(mensagem.conteudo) });
  },

  renderizarMensagens(raiz, { rolar = true } = {}) {
    const estado = this._estado;
    const area = raiz.querySelector("#chat-mensagens");
    if (!area) return;

    if (estado.carregandoChat) {
      area.replaceChildren(Modelos.criar("chat/carregando-conversa"));
      return;
    }

    if (estado.mensagens.length === 0 && !estado.digitando) {
      area.replaceChildren(Modelos.criar("chat/conversa-vazia"));
      return;
    }

    const linhas = estado.mensagens.map((mensagem) => this.criarLinhaMensagem(mensagem));
    if (estado.digitando) linhas.push(Modelos.criar("chat/linha-digitando"));
    area.replaceChildren(Modelos.criar("chat/lista-mensagens", {}, { linhas }));

    area.querySelectorAll(".map-cta").forEach((botao) =>
      botao.addEventListener("click", () => {
        EstadoApp.idMapaSelecionado = botao.getAttribute("data-id-mapa");
        irParaTela("detalheMapa");
      }),
    );

    this.conectarMensagens(raiz, area);

    if (estado.idMensagemEmEdicao !== null) {
      const campo = area.querySelector(".msg-edit-input");
      if (campo) {
        this.ajustarAltura(campo);
        campo.focus();
        campo.setSelectionRange(campo.value.length, campo.value.length);
      }
    }

    const ancora = area.querySelector("#chat-ancora-final");
    if (rolar && ancora) ancora.scrollIntoView({ behavior: "smooth" });
  },
});
