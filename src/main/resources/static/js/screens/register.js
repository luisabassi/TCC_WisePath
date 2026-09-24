// ─────────────────────────────────────────────────────────────────────────
// Tela: Cadastro
// ─────────────────────────────────────────────────────────────────────────

const Screens = window.Screens || {};

Screens.register = {
  render(container) {
    container.innerHTML = `
      <div class="auth-grid">
        ${authLeftHTML()}
        <div class="auth-right">
          <div class="auth-form-wrap">

            <div class="logo-row logo-row-center">
              <img src="${LOGO_SRC}" alt="WisePath" />
              <span class="logo-text">WisePath</span>
            </div>

            <h2 class="h2 auth-title">Crie sua conta</h2>
            <p class="muted auth-subtitle">Comece sua jornada de descoberta com Ikigai</p>

            <form id="register-form" class="auth-form">
              ${fieldHTML({ id: "reg-name", label: "Nome:", placeholder: "Como podemos te chamar?" })}
              ${fieldHTML({ id: "reg-email", label: "Email:", type: "email", placeholder: "seuemail@gmail.com" })}
              ${fieldHTML({ id: "reg-password", label: "Senha:", placeholder: `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`, withToggle: true })}
              <div id="register-feedback"></div>
              <div class="auth-form-submit">
                <button type="submit" class="btn-primary" id="reg-submit">Criar conta</button>
              </div>
            </form>

            <p class="muted auth-footer-text">
              Já tem conta? <button class="link-btn" id="go-login">Entrar</button>
            </p>

          </div>
        </div>
      </div>
    `;

    wireFieldToggles(container);

    container.querySelector("#go-login").addEventListener("click", () => setView("login"));

    container.querySelector("#register-form").addEventListener("submit", (e) => {
      e.preventDefault();

      const name = container.querySelector("#reg-name").value.trim();
      const email = container.querySelector("#reg-email").value.trim();
      const password = container.querySelector("#reg-password").value;
      const feedback = container.querySelector("#register-feedback");

      if (!name || !email || !password) return;
      if (password.length < MIN_PASSWORD_LENGTH) {
        feedback.innerHTML = `<p class="feedback-err">Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.</p>`;
        return;
      }

      const submitBtn = container.querySelector("#reg-submit");
      submitBtn.disabled = true;
      submitBtn.textContent = "Criando conta...";
      feedback.innerHTML = "";

      // Cadastra no back-end (grava no banco). Em seguida já faz o login
      // automaticamente para conseguir o token e entrar direto no app.
      Api.cadastrar(name, email, password)
        .then(() => Api.login(email, password))
        .then((sessao) => {
          Auth.salvar(sessao);
          AppState.profile.name = sessao.nome;
          AppState.profile.email = sessao.email;
          AppState.profile.photo = null;
          setView("welcome");
        })
        .catch((err) => {
          feedback.innerHTML = `<p class="feedback-err">${escapeHtml(err.message)}</p>`;
          submitBtn.disabled = false;
          submitBtn.textContent = "Criar conta";
        });
    });
  },
};

// Painel esquerdo compartilhado entre as telas de Cadastro e Login
function authLeftHTML() {
  return `
    <div class="auth-left">
      <div class="auth-left-content">
        <h1 class="h1 auth-left-title">Descubra seu propósito</h1>
        <p class="auth-left-desc">
          O WisePath utiliza o Ikigai e a Inteligência Artificial para ajudar jovens a conhecerem
          melhor suas habilidades, interesses e possíveis caminhos profissionais. Conheça a si mesmo
          e encontre a direção para o seu futuro.
        </p>
      </div>
      <div class="pillar-grid">
        ${PILLARS.map(
          ({ emoji, label, desc }) => `
          <div class="pillar-card">
            <span class="pillar-emoji">${emoji}</span>
            <div>
              <div class="pillar-label">${label}</div>
              <div class="pillar-desc">${desc}</div>
            </div>
          </div>
        `
        ).join("")}
      </div>
    </div>
  `;
}