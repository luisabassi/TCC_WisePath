// ─── Tela: Chat ─────────────────────────────────────────────────────────────
// 1 mensagem de abertura + 4 respostas do roteiro Ikigai 
const TOTAL_RESPOSTAS = 5;

Screens.chat = {
  _local: {
    chatId: null,
    messages: [],
    stage: 0,
    typing: false,
    sidebarOpen: true,
    chats: [],
    chatsLoaded: false,
    loadingChat: false,
    error: null,
    editingChatId: null,
    searchOpen: false,
    searchTerm: "",
    searchResults: null, // null = ainda sem resultado do back-end para o termo atual
    searchLoading: false,
    searchError: null,
    buscaSeq: 0, // identifica a busca mais recente (descarta respostas antigas)
    buscaTimer: null, // debounce da digitação
    chatParaAbrir: null, // pedido vindo de outra tela (ex.: "Ver conversa" no mapa mental)
  },

  isMobile() {
    return window.innerWidth < 768;
  },

  // Chamado por outras telas antes de setView("chat"): o chat abre essa conversa
  // em vez de abrir a mais recente.
  solicitarAbertura(idChat) {
    this._local.chatParaAbrir = idChat;
  },

  async carregarChats(container) {
    const local = this._local;
    local.chatsLoaded = true;

    const usuario = Auth.getUsuario();
    if (!usuario) return;

    try {
      local.chats = await Api.listarChats(usuario.idUsuario);
    } catch (err) {
      local.chats = [];
      local.error = err.message;
      this.render(container);
      return;
    }

    if (local.chats.length > 0 && !local.chatId) {
      this.abrirChat(container, local.chats[0].idChat);
    } else {
      this.render(container);
    }
  },

  async abrirChat(container, idChat) {
    const local = this._local;
    local.chatId = idChat;
    local.error = null;
    local.loadingChat = true;
    if (this.isMobile()) local.sidebarOpen = false;
    this.render(container);

    try {
      const [mensagens, resultados] = await Promise.all([
        Api.listarMensagens(idChat),
        Api.listarResultados(idChat),
      ]);

      local.messages = mensagens.map((m) => ({
        id: m.idMensagem,
        role: m.autor === "USUARIO" ? "user" : "assistant",
        content: m.conteudo,
      }));

      if (resultados.length > 0) {
        local.messages.push(this.montarMensagemResultado(resultados[0]));
        local.stage = TOTAL_RESPOSTAS;
      } else {
        const respostasDadas = local.messages.filter(
          (m) => m.role === "user",
        ).length;
        local.stage = Math.min(respostasDadas, TOTAL_RESPOSTAS);
      }
    } catch (err) {
      local.error = err.message;
      local.messages = [];
    } finally {
      local.loadingChat = false;
      this.render(container);
    }
  },

  novoChat(container) {
    const local = this._local;
    local.chatId = null;
    local.messages = [];
    local.stage = 0;
    local.error = null;
    if (this.isMobile()) local.sidebarOpen = false;
    this.render(container);
  },

  iniciarRenomear(container, idChat) {
    this._local.editingChatId = idChat;
    this.render(container);
  },

  cancelarRenomear(container) {
    this._local.editingChatId = null;
    this.render(container);
  },

  async confirmarRenomear(container, idChat, novoNome) {
    const local = this._local;
    if (local.editingChatId !== idChat) return; // evita salvar 2x 
    local.editingChatId = null;

    const nome = novoNome.trim();
    const atual = local.chats.find((c) => c.idChat === idChat);
    if (!nome || !atual || nome === atual.nome) {
      this.render(container);
      return;
    }

    try {
      const atualizado = await Api.renomearChat(idChat, nome);
      local.chats = local.chats.map((c) =>
        c.idChat === idChat ? { ...c, nome: atualizado.nome } : c,
      );
      local.error = null;
    } catch (err) {
      local.error = err.message;
    }
    this.render(container);
    // o novo nome pode ter deixado de combinar com o termo: consulta o back-end de novo
    if (local.searchTerm.trim()) this.executarBusca(container);
  },

  async excluirChat(container, idChat) {
    const local = this._local;
    const chat = local.chats.find((c) => c.idChat === idChat);
    if (!chat) return;
    if (!confirm(`Excluir a conversa "${chat.nome}"? Essa ação não pode ser desfeita.`)) return;

    try {
      await Api.excluirChat(idChat);
    } catch (err) {
      local.error = err.message;
      this.render(container);
      return;
    }

    local.chats = local.chats.filter((c) => c.idChat !== idChat);
    // o back-end apaga o resultado e o mapa mental junto com o chat
    MapStore.maps = MapStore.maps.filter((m) => m.idChat !== idChat);
    if (local.searchResults)
      local.searchResults = local.searchResults.filter((c) => c.idChat !== idChat);
    local.error = null;

    if (local.chatId === idChat) {
      this.novoChat(container); // estava com esse chat aberto: volta para a tela inicial
    } else {
      this.render(container);
    }
  },

  // ─── Busca de chats 
  // Sem termo: mostra a lista normal. Com termo: mostra o que o servidor devolveu.
  chatsVisiveis() {
    const local = this._local;
    if (local.searchTerm.trim() === "") return local.chats;
    return local.searchResults || [];
  },

  async executarBusca(container) {
    const local = this._local;
    const termo = local.searchTerm.trim();
    const seq = ++local.buscaSeq;

    if (!termo) {
      local.searchResults = null;
      local.searchLoading = false;
      local.searchError = null;
      this.atualizarListaChats(container);
      return;
    }

    local.searchLoading = true;
    local.searchError = null;
    if (local.searchResults === null) this.atualizarListaChats(container); // "Buscando…"

    let resultados = null;
    let erro = null;
    try {
      resultados = await Api.buscarChats(termo);
    } catch (err) {
      erro = err.message;
    }

    if (seq !== local.buscaSeq) return; // chegou uma busca mais nova: ignora esta resposta
    local.searchLoading = false;
    local.searchResults = erro ? [] : resultados;
    local.searchError = erro;
    this.atualizarListaChats(container);
  },

  buscaInputHTML() {
    const valor = escapeHtml(this._local.searchTerm).replace(/"/g, "&quot;");
    return `<input class="sidebar-search-input" id="chat-search-input" type="text"
      placeholder="Buscar por nome…" value="${valor}" autocomplete="off" />`;
  },

  recentsHTML() {
    const local = this._local;
    const buscando = local.searchTerm.trim() !== "";
    const lista = this.chatsVisiveis();

    const label = buscando ? "Resultados" : "Recentes";
    let vazio = "";
    if (buscando && local.searchResults === null) {
      vazio = `<p class="sidebar-empty">Buscando…</p>`;
    } else if (buscando && local.searchError) {
      vazio = `<p class="sidebar-empty">${escapeHtml(local.searchError)}</p>`;
    } else if (buscando && lista.length === 0) {
      vazio = `<p class="sidebar-empty">Nenhum chat encontrado.</p>`;
    }

    const linhas = lista
      .map(
        (c) => `
      <div class="sidebar-chat-row ${c.idChat === local.chatId ? "active" : ""}">
        ${
          c.idChat === local.editingChatId
            ? `<input class="sidebar-chat-edit" data-chat-id="${c.idChat}"
                 value="${escapeHtml(c.nome).replace(/"/g, "&quot;")}" maxlength="100" />`
            : `<button class="sidebar-chat-item" data-chat-id="${c.idChat}">${escapeHtml(c.nome)}</button>
               <div class="sidebar-chat-actions">
                 <button class="chat-action-btn" data-action="rename" data-chat-id="${c.idChat}"
                   title="Renomear" aria-label="Renomear conversa">${Icons.pencil}</button>
                 <button class="chat-action-btn chat-action-danger" data-action="delete" data-chat-id="${c.idChat}"
                   title="Excluir" aria-label="Excluir conversa">${Icons.trash}</button>
               </div>`
        }
      </div>
    `,
      )
      .join("");

    return `<div class="sidebar-recents-label">${label}</div>${linhas}${vazio}`;
  },

  // Atualiza só a lista (sem render() completo), para não perder o foco do campo
  // de busca nem fechar a sidebar no mobile.
  atualizarListaChats(container) {
    const recents = container.querySelector(".sidebar-recents");
    if (!recents) return;
    recents.innerHTML = this.recentsHTML();
    this.wireLista(container);
  },

  toggleBusca(container) {
    const local = this._local;
    local.searchOpen = !local.searchOpen;
    if (!local.searchOpen) {
      clearTimeout(local.buscaTimer);
      local.buscaSeq++; // invalida qualquer busca em andamento
      local.searchTerm = "";
      local.searchResults = null;
      local.searchLoading = false;
      local.searchError = null;
    }

    const existente = container.querySelector("#chat-search-input");
    if (local.searchOpen && !existente) {
      container
        .querySelector(".sidebar-actions")
        .insertAdjacentHTML("beforeend", this.buscaInputHTML());
      this.wireBusca(container);
      container.querySelector("#chat-search-input").focus();
    } else if (!local.searchOpen && existente) {
      existente.remove();
    }
    this.atualizarListaChats(container);
  },

  wireBusca(container) {
    const local = this._local;
    const input = container.querySelector("#chat-search-input");
    if (!input) return;

    input.addEventListener("input", () => {
      local.searchTerm = input.value;
      clearTimeout(local.buscaTimer);
      if (!input.value.trim()) {
        this.executarBusca(container); // campo vazio: volta à lista normal na hora
        return;
      }
      // primeira digitação: já troca a lista cheia por "Buscando…" (não mostra chats sem filtro)
      if (local.searchResults === null) this.atualizarListaChats(container);
      // espera o usuário parar de digitar antes de chamar o back-end
      local.buscaTimer = setTimeout(() => this.executarBusca(container), 300);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.toggleBusca(container);
    });
  },

  montarMensagemResultado(resultado) {
    const brl = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const profissoes = (resultado.profissoes || [])
      .map((p, i) => {
        return [
          `**${i + 1}. ${p.nome}**`,
          p.descricao || "",
          `**Média salarial:** ${p.mediaSalarial || "não informada"}`,
          `**Empregabilidade:** ${p.empregabilidade || "não informada"}`,
          `**Tendências futuras:** ${p.tendenciasFuturas || "não informadas"}`,
          `**Como começar:** ${p.comoComecar || "não informado"}`,
          `**Cursos superiores relacionados:** ${p.cursosRelacionados || "não informados"}`,
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return {
      id: `resultado-${resultado.idResultado}`,
      role: "assistant",
      content: `${resultado.resumo}\n\n**Profissões sugeridas:**\n\n${profissoes}`,
      // o mapa mental nasce junto com o resultado: a mensagem ganha o atalho para ele
      mapId: resultado.mapaMental ? String(resultado.mapaMental.idMapaMental) : null,
    };
  },

  render(container) {
    const local = this._local;

    // Veio de outra tela pedindo uma conversa específica: abrirChat() já chama render() de novo
    if (local.chatParaAbrir) {
      const idChat = local.chatParaAbrir;
      local.chatParaAbrir = null;
      this.abrirChat(container, idChat);
      return;
    }

    if (this.isMobile()) local.sidebarOpen = false;

    if (!local.chatsLoaded) this.carregarChats(container);

    container.innerHTML = `
      <div class="chat-wrap">
        <div class="sidebar-overlay" id="sidebar-overlay"></div>

        <aside class="chat-sidebar ${local.sidebarOpen ? "open" : "closed"}" id="chat-sidebar">
          <div class="sidebar-top">
            <img src="${LOGO_SRC}" alt="WisePath" class="sidebar-logo" />
            <button class="icon-btn" id="sidebar-close-btn">${Icons.sidebarClose}</button>
          </div>
          <div class="sidebar-actions">
            <button class="sidebar-pill-btn sidebar-pill-btn-primary" id="novo-chat-btn">
              <span class="sidebar-pill-icon">${Icons.plus}</span>Novo Chat
            </button>
            <button class="sidebar-pill-btn sidebar-pill-btn-outline" id="buscar-chats-btn">
              <span class="sidebar-pill-icon">${Icons.search}</span>Buscar chats
            </button>
            ${local.searchOpen ? this.buscaInputHTML() : ""}
          </div>
          <div class="sidebar-recents">${this.recentsHTML()}</div>
          <div class="sidebar-bottom">
            <button class="icon-btn" id="chat-home-btn" title="Início">${Icons.home}</button>
            <button class="icon-btn" id="chat-maps-btn" title="Meus mapas mentais">${Icons.mapIcon}</button>
            <button class="icon-btn" id="chat-logout-btn" title="Sair">${Icons.logoutSm}</button>
          </div>
        </aside>

        <div class="chat-main">
          <div class="chat-topbar">
            ${!local.sidebarOpen ? `<button class="icon-btn" id="sidebar-open-btn">${Icons.sidebarOpen}</button>` : ""}
          </div>

          <div class="chat-messages" id="chat-messages"></div>

          <div class="chat-input-bar">
            ${local.error ? `<p class="feedback-err" style="text-align:center;margin-bottom:6px;">${escapeHtml(local.error)}</p>` : ""}
            <div class="chat-input-wrap">
              <input class="chat-input" type="text" id="chat-input" placeholder='Digite "Olá" para começar' autocomplete="off" />
              <button class="send-btn" id="chat-send-btn" disabled>${Icons.send(true)}</button>
            </div>
            <p class="chat-footer">
              O WisePath oferece orientação, não garantias. Seja aberto e honesto para os melhores resultados.
            </p>
          </div>
        </div>
      </div>
    `;

    this.renderMessages(container);
    this.wire(container);
  },

  renderMessages(container) {
    const local = this._local;
    const wrap = container.querySelector("#chat-messages");
    if (!wrap) return;

    if (local.loadingChat) {
      wrap.innerHTML = `<div class="chat-empty"><p class="muted">Carregando conversa…</p></div>`;
      return;
    }

    if (local.messages.length === 0 && !local.typing) {
      wrap.innerHTML = `
        <div class="chat-empty">
          <img src="${LOGO_SRC}" alt="WisePath" class="chat-empty-logo" />
          <h2 class="h1 chat-empty-title">Encontre seu caminho com o ikigai</h2>
          <p class="muted chat-empty-desc">
            Vou te guiar por algumas perguntas para descobrir carreiras onde suas paixões,
            talentos, o que o mundo precisa e o que pode te sustentar se encontram.
          </p>
        </div>
      `;
      return;
    }

    const msgsHTML = local.messages
      .map(
        (msg) => `
      <div class="msg-row msg-row-in ${msg.role === "user" ? "user" : ""}">
        ${msg.role === "assistant" ? `<img src="${LOGO_SRC}" alt="bot" class="msg-avatar" />` : ""}
        ${
          msg.mapId
            ? `<div class="msg-stack">
                <div class="msg-bubble bot">${renderMsg(msg.content)}</div>
                <button class="map-cta" data-map-id="${escapeAttr(msg.mapId)}">
                  <span class="map-cta-icon">${Icons.mapIcon.replace("#9ca3af", "#fff")}</span>
                  <span class="map-cta-text"><strong>Seu mapa mental está pronto</strong><small>Toque para visualizar</small></span>
                  <span class="map-cta-arrow">→</span>
                </button>
              </div>`
            : `<div class="msg-bubble ${msg.role === "user" ? "user" : "bot"}" style="${msg.pending ? "opacity:0.6;" : ""}">${renderMsg(msg.content)}</div>`
        }
      </div>
    `,
      )
      .join("");

    const typingHTML = local.typing
      ? `
      <div class="msg-row msg-row-in">
        <img src="${LOGO_SRC}" alt="bot" class="msg-avatar" />
        <div class="msg-bubble bot">
          <div class="typing-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
        </div>
      </div>
    `
      : "";

    wrap.innerHTML = `<div class="chat-messages-list">${msgsHTML}${typingHTML}<div id="chat-bottom-anchor"></div></div>`;

    wrap.querySelectorAll(".map-cta").forEach((btn) =>
      btn.addEventListener("click", () => {
        AppState.selectedMapId = btn.getAttribute("data-map-id");
        setView("mapDetail");
      }),
    );

    const anchor = wrap.querySelector("#chat-bottom-anchor");
    if (anchor) anchor.scrollIntoView({ behavior: "smooth" });
  },

  atualizarBotaoEnvio(container) {
    const local = this._local;
    const input = container.querySelector("#chat-input");
    const sendBtn = container.querySelector("#chat-send-btn");
    if (!input || !sendBtn) return;
    const disabled = !input.value.trim() || local.typing;
    sendBtn.disabled = disabled;
    sendBtn.innerHTML = Icons.send(disabled);
  },

  wireLista(container) {
    container.querySelectorAll(".sidebar-chat-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-chat-id"));
        this.abrirChat(container, id);
      });
    });

    container.querySelectorAll(".chat-action-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.getAttribute("data-chat-id"));
        if (btn.getAttribute("data-action") === "rename") this.iniciarRenomear(container, id);
        else this.excluirChat(container, id);
      });
    });

    const editInput = container.querySelector(".sidebar-chat-edit");
    if (editInput) {
      const id = Number(editInput.getAttribute("data-chat-id"));
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.confirmarRenomear(container, id, editInput.value);
        } else if (e.key === "Escape") {
          this.cancelarRenomear(container);
        }
      });
      editInput.addEventListener("blur", () =>
        this.confirmarRenomear(container, id, editInput.value),
      );
      editInput.focus();
      editInput.select();
    }
  },

  wire(container) {
    const local = this._local;

    const closeSidebar = () => {
      local.sidebarOpen = false;
      this.render(container);
    };
    const openSidebar = () => {
      local.sidebarOpen = true;
      this.render(container);
    };

    const closeBtn = container.querySelector("#sidebar-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeSidebar);

    const openBtn = container.querySelector("#sidebar-open-btn");
    if (openBtn) openBtn.addEventListener("click", openSidebar);

    const overlay = container.querySelector("#sidebar-overlay");
    if (local.sidebarOpen && this.isMobile()) {
      overlay.classList.add("visible");
      overlay.addEventListener("click", closeSidebar);
    }

    container
      .querySelector("#chat-home-btn")
      .addEventListener("click", () => setView("welcome"));
    container
      .querySelector("#chat-maps-btn")
      .addEventListener("click", () => setView("maps"));
    container
      .querySelector("#chat-logout-btn")
      .addEventListener("click", () => {
        Auth.limpar();
        setView("login", { replace: true });
      });

    const novoChatBtn = container.querySelector("#novo-chat-btn");
    if (novoChatBtn)
      novoChatBtn.addEventListener("click", () => this.novoChat(container));

    const buscarBtn = container.querySelector("#buscar-chats-btn");
    if (buscarBtn)
      buscarBtn.addEventListener("click", () => this.toggleBusca(container));
    this.wireBusca(container);

    this.wireLista(container);

    const input = container.querySelector("#chat-input");
    const sendBtn = container.querySelector("#chat-send-btn");

    input.addEventListener("input", () => this.atualizarBotaoEnvio(container));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send(container);
      }
    });

    sendBtn.addEventListener("click", () => this.send(container));
    this.atualizarBotaoEnvio(container);
  },

  async send(container) {
    const local = this._local;
    const input = container.querySelector("#chat-input");
    const text = input.value.trim();
    if (!text || local.typing) return;

    local.error = null;
    input.value = "";
    local.typing = true;
    this.atualizarBotaoEnvio(container);

    const tempId = `pending-${Date.now()}`;
    local.messages.push({
      id: tempId,
      role: "user",
      content: text,
      pending: true,
    });
    this.renderMessages(container);

    try {
      if (!local.chatId) {
        const nome = text.length > 40 ? text.slice(0, 40) + "…" : text;
        const chat = await Api.criarChat(nome);
        local.chatId = chat.idChat;
        local.chats = [chat, ...local.chats];
      }

      const [mensagemUsuario, mensagemBot] = await Api.enviarMensagem(local.chatId, text);

      const idx = local.messages.findIndex((m) => m.id === tempId);
      if(idx !== -1){
        local.messages[idx] = {
          id :mensagemUsuario.idMensagem, 
          role:"user", 
          content: mensagemUsuario.conteudo,
        };
      }

      local.messages.push({
        id: mensagemBot.idMensagem,
        role: "assistant", 
        content: mensagemBot.conteudo,
      }); 

      local.stage += 1;

    } catch (err) {
      local.messages = local.messages.filter((m) => m.id !== tempId);
      local.typing = false;
      local.error = err.message;
      this.render(container);
      return;
    }

    local.typing = false;
    this.renderMessages(container);
    this.atualizarBotaoEnvio(container);

    if(local.stage >= TOTAL_RESPOSTAS){
      this.gerarResultado(container);
    }
  },

  async gerarResultado(container){
    const local = this._local;
    local.typing = true;
    this.renderMessages(container);

    try{
      const resultado = await Api.gerarResultado(local.chatId);
      if (resultado.mapaMental) MapStore.marcarNovo(resultado.mapaMental.idMapaMental);
      local.messages.push(this.montarMensagemResultado(resultado));
      local.stage = TOTAL_RESPOSTAS;
    }catch(err){
      local.messages.push({
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: "Não consegui gerar sua análise agora. Você pode tentar de novo enviando outra mensagem.",
      });
      local.error = err.message;
    }

    local.typing = false;
    this.renderMessages(container);
    this.atualizarBotaoEnvio(container);
  },
};