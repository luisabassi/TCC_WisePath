// ─────────────────────────────────────────────────────────────────────────
// Tela: Login
// ─────────────────────────────────────────────────────────────────────────

Screens.login = {
  render(container) {
    container.innerHTML = `
      <div class="auth-grid">
        ${authLeftHTML()}
        <div class="auth-right">
          <div class="auth-form-wrap">

            <div class="logo-stack">
              <img src="${LOGO_SRC}" alt="WisePath" />
              <span class="logo-text">WisePath</span>
            </div>

            <h2 class="h2 auth-title">Bem vindo(a) de volta!</h2>
            <p class="muted auth-subtitle">Entre na sua conta para continuar sua jornada com o ikigai</p>

            <form id="login-form" class="auth-form">
              ${fieldHTML({ id: "login-email", label: "Email:", type: "email", placeholder: "seuemail@gmail.com" })}
              ${fieldHTML({ id: "login-password", label: "Senha:", placeholder: "••••••••", withToggle: true })}
              <div id="login-feedback"></div>
              <div class="auth-form-submit">
                <button type="submit" class="btn-primary" id="login-submit">Entrar</button>
              </div>
            </form>

            <p class="muted auth-footer-text">
              Não tem conta? <button class="link-btn" id="go-register">Cadastre-se</button>
            </p>

          </div>
        </div>
      </div>
    `;

    wireFieldToggles(container);

    container.querySelector("#go-register").addEventListener("click", () => setView("register"));

    container.querySelector("#login-form").addEventListener("submit", (e) => {
      e.preventDefault();

      const email = container.querySelector("#login-email").value.trim();
      const password = container.querySelector("#login-password").value;
      const feedback = container.querySelector("#login-feedback");
      if (!email || !password) return;

      const submitBtn = container.querySelector("#login-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Entrando...";
      feedback.innerHTML = "";

      // Autentica no back-end e guarda o token JWT retornado.
      Api.login(email, password)
        .then((sessao) => {
          Auth.salvar(sessao);
          AppState.profile.name = sessao.nome;
          AppState.profile.email = sessao.email;
          setView("welcome", { replace: true });
        })
        .catch((err) => {
          feedback.innerHTML = `<p class="feedback-err">${escapeHtml(err.message)}</p>`;
          submitBtn.disabled = false;
          submitBtn.textContent = "Entrar";
        });
    });
  },
};