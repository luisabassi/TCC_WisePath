document.addEventListener("DOMContentLoaded", async () => {
  try {
    await Modelos.carregar();
  } catch (erro) {
    obterRaiz().textContent = erro.message;
    return;
  }

  const sessao = Autenticacao.obterUsuario();
  if (sessao && sessao.token) {
    EstadoApp.perfil.nome = sessao.nome;
    EstadoApp.perfil.email = sessao.email;
  }

  // A tela inicial vem da URL; caminho desconhecido cai em /inicio (logado) ou /login
  const tela = resolverTela(telaDoCaminho(window.location.pathname));
  EstadoApp.tela = tela;
  window.history.replaceState({ tela }, "", caminhoDaTela(tela));
  renderizarTelaAtual();
});
