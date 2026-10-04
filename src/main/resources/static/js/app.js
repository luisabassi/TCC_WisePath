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


  //A tela inicial vem da URL
  //Caminho desconhecido ou "/" cai em /inicio (logado) ou /login(deslogado)
  const view = resolveView(viewFromPath(window.location.pathname));
  AppState.view = view;
  window.history.replaceState({view}, "", ROUTES[view]);
  renderCurrentView();
});