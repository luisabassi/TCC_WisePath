// ─────────────────────────────────────────────────────────────────────────
// Tela: Boas-vindas
// ─────────────────────────────────────────────────────────────────────────

Screens.welcome = {
  render(container) {
    const profile = AppState.profile;

    container.innerHTML = `
      <div class="mesh-bg">

       <nav class="welcome-nav">
        <div class="logo-row logo-row-sm">
          <img src="${LOGO_SRC}" alt="WisePath" />
          <span class="logo-text">WisePath</span>
        </div>
        <div class="welcome-nav-right">
          <button class="logout-btn" id="welcome-logout" title="Sair">
            ${Icons.logout}
            <span>Sair</span>
          </button>
          ${avatarHTML(profile, 42, 'id="welcome-avatar" title="Configurações"')}
        </div>
      </nav>
      
        <div class="welcome-hero">
          <h1 class="h1 welcome-title">Bem vindo(a) ao WisePath!</h1>
          <p class="muted welcome-subtitle">
            Descubra carreiras com propósito a partir do método japonês Ikigai,
            onde paixão, vocação, missão e profissão se encontram
          </p>
          <div class="welcome-btns">
            <button class="btn-primary" id="welcome-start">Iniciar conversa</button>
            <button class="btn-outline" id="welcome-history">Ver mapas mentais</button>
          </div>
        </div>

        <div class="welcome-section">
          <h2 class="h2 welcome-section-title">Como o ikigai funciona</h2>
          <p class="muted welcome-section-desc">
            Ikigai (生き甲斐) é um conceito japonês que significa "a razão de viver". Ele nasce da
            interseção de quatro perguntas essenciais sobre você e o mundo.
          </p>
          <div class="welcome-cards">
            ${IKIGAI_CARDS.map(
              ({ emoji, title, desc }) => `
              <div class="welcome-card">
                <span class="welcome-card-emoji">${emoji}</span>
                <div>
                  <div class="welcome-card-title">${title}</div>
                  <div class="welcome-card-desc">${desc}</div>
                </div>
              </div>
            `
            ).join("")}
          </div>
        </div>

      </div>
    `;

    container.querySelector("#welcome-logout").addEventListener("click", () => {
      Auth.limpar();
       setView("login", { replace: true }); // controla o histórico de navegação
    });
    
    container.querySelector("#welcome-avatar").addEventListener("click", () => setView("settings"));
    container.querySelector("#welcome-start").addEventListener("click", () => setView("chat"));
    container.querySelector("#welcome-history").addEventListener("click", () => setView("maps"));
  },
};