// ─── Inicialização da aplicação ────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  // Se já existe uma sessão válida salva (login anterior), entra direto
  // na tela inicial em vez de pedir cadastro/login de novo.
  const sessao = Auth.getUsuario();
  if (sessao && sessao.token) {
    AppState.profile.name = sessao.nome;
    AppState.profile.email = sessao.email;
    AppState.view = "welcome";
  }
  renderCurrentView();
});