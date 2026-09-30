// ─── Tela: Chat ─────────────────────────────────────────────────────────────
// 1 mensagem de abertura + 4 respostas do roteiro Ikigai (ver GeminiService.PERGUNTAS_IKIGAI)
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
  },

  isMobile() {
    return window.innerWidth < 768;
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

  montarMensagemResultado(resultado) {
    const brl = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const profissoes = (resultado.profissoes || [])
      .map((p, i) => {
        const salario =
          typeof p.mediaSalarial === "number"
            ? `${brl.format(p.mediaSalarial)} / mês`
            : "não informada";
        return [
          `**${i + 1}. ${p.nome}**`,
          p.descricao || "",
          `**Média salarial:** ${salario}`,
          `**Empregabilidade:** ${p.empregabilidade || "não informada"}`,
          `**Tendências futuras:** ${p.tendenciasFuturas || "não informadas"}`, 
        ]
          .filter(Boolean)
          .join("\n");
      })
      .join("\n\n");

    return {
      id: `resultado-${resultado.idResultado}`,
      role: "assistant",
      content: `${resultado.resumo}\n\n**Profissões sugeridas:**\n\n${profissoes}`,
    };
  },

  render(container) {
    const local = this._local;
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
          </div>
          <div class="sidebar-recents">
            <div class="sidebar-recents-label">Recentes</div>
            ${local.chats
              .map(
                (c) => `
              <button class="sidebar-chat-item ${c.idChat === local.chatId ? "active" : ""}" data-chat-id="${c.idChat}">
                ${escapeHtml(c.nome)}
              </button>
            `,
              )
              .join("")}
          </div>
          <div class="sidebar-bottom">
            <button class="icon-btn" id="chat-home-btn" title="Início">${Icons.home}</button>
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
        <div class="msg-bubble ${msg.role === "user" ? "user" : "bot"}" style="${msg.pending ? "opacity:0.6;" : ""}">${renderMsg(msg.content)}</div>
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
      .querySelector("#chat-logout-btn")
      .addEventListener("click", () => {
        Auth.limpar();
        setView("login");
      });

    const novoChatBtn = container.querySelector("#novo-chat-btn");
    if (novoChatBtn)
      novoChatBtn.addEventListener("click", () => this.novoChat(container));

    container.querySelectorAll(".sidebar-chat-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.getAttribute("data-chat-id"));
        this.abrirChat(container, id);
      });
    });

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