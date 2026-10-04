// ─────────────────────────────────────────────────────────────────────────
// Tela: Configurações
// Menu lateral com abas: Perfil (nome + email), Segurança (senha),
// Excluir conta e Sobre.
// ─────────────────────────────────────────────────────────────────────────

Screens.settings = {
  // Estado local da tela 
  _local: {
    tab: "perfil",
  },

  goBack() {
    setView(AppState.previousView || "welcome");
  },

  render(container) {
    const local = this._local;

    container.innerHTML = `
      <div class="mesh-bg settings-page">
        <div class="settings-card">

          <aside class="settings-sidebar">
            <div class="settings-sidebar-header">
              <button class="icon-btn" id="settings-back-btn" title="Voltar">${Icons.arrowLeft}</button>
              <div class="settings-sidebar-title">Configurações</div>
            </div>
            <nav class="settings-sidebar-nav">
              ${SETTINGS_NAV.map(
                ({ id, icon, label }) => `
                <button class="settings-nav-item${local.tab === id ? " active" : ""}" data-tab="${id}">
                  <span class="nav-icon">${icon}</span>${label}
                </button>
              `
              ).join("")}
            </nav>
          </aside>

          <div class="settings-content" id="settings-content"></div>

        </div>
      </div>
    `;

    container.querySelector("#settings-back-btn").addEventListener("click", () => this.goBack());

    container.querySelectorAll(".settings-nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        local.tab = btn.getAttribute("data-tab");
        this.render(container);
      });
    });

    this.renderTab(container);
  },

  // Desenha só o conteúdo da aba ativa 
  renderTab(container) {
    const content = container.querySelector("#settings-content");
    const renderers = {
      perfil: () => this.renderPerfil(container, content),
      seguranca: () => this.renderSeguranca(container, content),
      excluir: () => this.renderExcluirConta(container, content),
      sobre: () => this.renderSobre(container, content),
    };
    renderers[this._local.tab]();
  },

  // ── Aba: Perfil (avatar de iniciais + nome + email) ─────────────────
  renderPerfil(container, content) {
    const profile = AppState.profile;

    content.innerHTML = `
      <div class="settings-section-title">Perfil</div>

      <div class="avatar-picker">
        <div class="avatar-picker-wrap">
          ${avatarHTML({ name: profile.name }, 80)}
        </div>
      </div>

      <div class="settings-fields">
        ${fieldHTML({ id: "settings-name", label: "Nome", value: profile.name, placeholder: "Seu nome" })}
        ${fieldHTML({ id: "settings-email", label: "Email", type: "email", value: profile.email, placeholder: "seuemail@gmail.com" })}
      </div>

      <div id="perfil-feedback"></div>
      <div class="settings-btns">
        <button class="btn-secondary" id="perfil-voltar">Voltar</button>
        <button class="btn-primary" id="perfil-save">Salvar</button>
      </div>
    `;

    content.querySelector("#perfil-voltar").addEventListener("click", () => this.goBack());

    content.querySelector("#perfil-save").addEventListener("click", () => {
      const name = content.querySelector("#settings-name").value.trim();
      const email = content.querySelector("#settings-email").value.trim();
      const feedback = content.querySelector("#perfil-feedback");
      const saveBtn = content.querySelector("#perfil-save");

      if (!name) {
        feedback.innerHTML = `<p class="feedback-err">Nome é obrigatório.</p>`;
        return;
      }
      if (!email.includes("@")) {
        feedback.innerHTML = `<p class="feedback-err">Email inválido.</p>`;
        return;
      }

      const sessao = Auth.getUsuario();
      if (!sessao) {
        feedback.innerHTML = `<p class="feedback-err">Sessão expirada. Faça login novamente.</p>`;
        return;
      }

      feedback.innerHTML = "";
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvando...";

      // PUT /users/{id} — atualiza nome e email no back-end
      Api.atualizarPerfil(sessao.idUsuario, { nome: name, email: email })
        .then((usuarioAtualizado) => {
          profile.name = usuarioAtualizado.nome;
          profile.email = usuarioAtualizado.email;

          // Mantém a sessão salva em sincronia com o back-end
          Auth.salvar({ ...sessao, nome: usuarioAtualizado.nome, email: usuarioAtualizado.email });

          const avatarBtn = content.querySelector(".avatar-picker-wrap .avatar");
          if (avatarBtn) avatarBtn.textContent = initials(usuarioAtualizado.nome);

          this.flash(feedback, "Perfil salvo com sucesso!");
        })
        .catch((err) => {
          feedback.innerHTML = `<p class="feedback-err">${escapeHtml(err.message)}</p>`;
        })
        .finally(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = "Salvar";
        });
    });
  },

  // ── Aba: Segurança (somente troca de senha) ─────────────────────────
  renderSeguranca(container, content) {
    content.innerHTML = `
      <div class="settings-section-title">Segurança</div>

      <div class="settings-fields">
        <p class="section-label">Alterar senha</p>
        ${fieldHTML({ id: "sec-new-pw", label: "Nova senha", placeholder: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`, withToggle: true })}
        ${fieldHTML({ id: "sec-confirm-pw", label: "Confirmar nova senha", placeholder: "Repita a nova senha", withToggle: true })}
      </div>

      <div id="seguranca-feedback"></div>
      <div class="settings-btns">
        <button class="btn-secondary" id="seguranca-voltar">Voltar</button>
        <button class="btn-primary" id="seguranca-save">Salvar</button>
      </div>
    `;

    wireFieldToggles(content);

    content.querySelector("#seguranca-voltar").addEventListener("click", () => this.goBack());

    content.querySelector("#seguranca-save").addEventListener("click", () => {
      const newPw = content.querySelector("#sec-new-pw").value;
      const confirmPw = content.querySelector("#sec-confirm-pw").value;
      const feedback = content.querySelector("#seguranca-feedback");
      const saveBtn = content.querySelector("#seguranca-save");

      if (!newPw) {
        feedback.innerHTML = `<p class="feedback-err">Digite a nova senha.</p>`;
        return;
      }
      if (newPw.length < MIN_PASSWORD_LENGTH) {
        feedback.innerHTML = `<p class="feedback-err">Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.</p>`;
        return;
      }
      if (newPw !== confirmPw) {
        feedback.innerHTML = `<p class="feedback-err">As senhas não coincidem.</p>`;
        return;
      }

      const sessao = Auth.getUsuario();
      if (!sessao) {
        feedback.innerHTML = `<p class="feedback-err">Sessão expirada. Faça login novamente.</p>`;
        return;
      }

      feedback.innerHTML = "";
      saveBtn.disabled = true;
      saveBtn.textContent = "Salvando...";

      // PUT /users/{id} — só manda a senha;
      Api.atualizarPerfil(sessao.idUsuario, { senha: newPw })
        .then(() => {
          content.querySelector("#sec-new-pw").value = "";
          content.querySelector("#sec-confirm-pw").value = "";
          this.flash(feedback, "Senha atualizada!");
        })
        .catch((err) => {
          feedback.innerHTML = `<p class="feedback-err">${escapeHtml(err.message)}</p>`;
        })
        .finally(() => {
          saveBtn.disabled = false;
          saveBtn.textContent = "Salvar";
        });
    });
  },

  // ── Aba: Excluir conta ─────────────────────────
  renderExcluirConta(container, content){
    content.innerHTML = `
      <div class="settings-section-title">Excluir conta</div>

      <p class="muted">Essa ação é permanente e não pode ser desfeita. Todos os seus chats,
      mensagens e resultados serão apagados.</p>

      <div class="settings-fields">
        <p class="section-label">Digite sua senha atual para confirmar:</p>
        ${fieldHTML({ id: "del-pw", label: "Senha", placeholder: "Digite a senha", withToggle: true })}
      </div>

      <div id="excluirConta-feedback"></div>
      <div class="settings-btns">
        <button class="btn-secondary" id="excluirConta-voltar">Voltar</button>
        <button class="btn-primary" id="excluirConta-save">Excluir conta</button>
      </div>
    `;

    wireFieldToggles(content);

    content.querySelector("#excluirConta-voltar").addEventListener("click", () => this.goBack());

    content.querySelector("#excluirConta-save").addEventListener("click", () => {
      const pw = content.querySelector("#del-pw").value;
      const feedback = content.querySelector("#excluirConta-feedback");
      const deleteBtn = content.querySelector("#excluirConta-save");

      if (!pw) {
        feedback.innerHTML = `<p class="feedback-err">Digite sua senha.</p>`;
        return;
      }

      const sessao = Auth.getUsuario();
      if (!sessao) {
        feedback.innerHTML = `<p class="feedback-err">Sessão expirada. Faça login novamente.</p>`;
        return;
      }

      const confirmado = confirm("Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.");
      if (!confirmado) return;

      feedback.innerHTML = "";
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Excluindo...";

      Api.login(sessao.email, pw)
        .then(() => Api.excluirConta(sessao.idUsuario))
        .then(() => {
          Auth.limpar();
          AppState.profile = { name: "", email: "" };
          setView("login", { replace: true });
        })
        .catch((err) => {
          feedback.innerHTML = `<p class="feedback-err">${escapeHtml(err.message)}</p>`;
          deleteBtn.disabled = false;
          deleteBtn.textContent = "Excluir conta";
        });
    });
  },

  // ── Aba: Sobre ───────────────────────────────────────────────────────
  renderSobre(container, content) {
    const rows = [
      ["Desenvolvido por", "Equipe WisePath"],
      ["Tecnologia", "Ikigai + IA"],
      ["Público-alvo", "Jovens do ensino médio"],
      ["Última atualização", "Outubro - 2026"],
      ["Suporte", "suporte@wisepath.com.br"],
    ];

    content.innerHTML = `
      <div class="settings-section-title">Sobre</div>

      <div class="about-brand">
        <img src="${LOGO_SRC}" alt="WisePath" class="about-logo" />
        <span class="about-brand-name">WisePath</span>
        <span class="about-brand-version">Versão 1.0.0</span>
      </div>

      <div>
        ${rows
          .map(
            ([k, v]) => `
          <div class="about-row">
            <span class="about-key">${k}</span>
            <span class="about-val">${v}</span>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="about-links">
        <button class="btn-ghost muted underline">Termos de uso</button>
        <button class="btn-ghost muted underline">Política de privacidade</button>
      </div>

      <div class="settings-btns">
        <button class="btn-secondary settings-btn-solo" id="sobre-voltar">Voltar</button>
      </div>
    `;

    content.querySelector("#sobre-voltar").addEventListener("click", () => this.goBack());
  },
  
  flash(feedbackEl, message) {
    feedbackEl.innerHTML = `<p class="feedback-ok">✓ ${message}</p>`;
    setTimeout(() => {
      if (feedbackEl) feedbackEl.innerHTML = "";
    }, 2200);
  },
};