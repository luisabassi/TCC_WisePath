Telas.login = {
  renderizar(raiz) {
    raiz.replaceChildren(Modelos.criar("login/tela", {}, { painel: Componentes.painelAutenticacao() }));

    Componentes.ativarAlternanciaSenha(raiz);
    raiz.querySelector("#ir-para-cadastro").addEventListener("click", () => irParaTela("cadastro"));

    raiz.querySelector("#formulario-login").addEventListener("submit", (evento) => {
      evento.preventDefault();

      const email = raiz.querySelector("#login-email").value.trim();
      const senha = raiz.querySelector("#login-senha").value;
      const feedback = raiz.querySelector("#login-feedback");
      if (!email || !senha) return;

      const botaoEnviar = raiz.querySelector("#login-enviar");
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Entrando...";
      Componentes.limparFeedback(feedback);

      Api.login(email, senha)
        .then((sessao) => {
          Autenticacao.salvar(sessao);
          EstadoApp.perfil.nome = sessao.nome;
          EstadoApp.perfil.email = sessao.email;
          irParaTela("inicio", { substituir: true });
        })
        .catch((erro) => {
          Componentes.mostrarErro(feedback, erro.message);
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = "Entrar";
        });
    });
  },
};
