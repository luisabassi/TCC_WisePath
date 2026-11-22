Telas.cadastro = {
  renderizar(raiz) {
    raiz.replaceChildren(
      Modelos.criar(
        "cadastro/tela",
        { dicaSenha: `Mínimo ${TAMANHO_MINIMO_SENHA} caracteres` },
        { painel: Componentes.painelAutenticacao() },
      ),
    );

    Componentes.ativarAlternanciaSenha(raiz);
    raiz.querySelector("#ir-para-login").addEventListener("click", () => irParaTela("login"));

    raiz.querySelector("#formulario-cadastro").addEventListener("submit", (evento) => {
      evento.preventDefault();

      const nome = raiz.querySelector("#cadastro-nome").value.trim();
      const email = raiz.querySelector("#cadastro-email").value.trim();
      const senha = raiz.querySelector("#cadastro-senha").value;
      const feedback = raiz.querySelector("#cadastro-feedback");

      if (!nome || !email || !senha) return;
      if (senha.length < TAMANHO_MINIMO_SENHA) {
        Componentes.mostrarErro(feedback, `Senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
        return;
      }

      const botaoEnviar = raiz.querySelector("#cadastro-enviar");
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Criando conta...";
      Componentes.limparFeedback(feedback);

      // Depois de cadastrar, faz o login para obter o token e entrar direto no app
      Api.cadastrar(nome, email, senha)
        .then(() => Api.login(email, senha))
        .then((sessao) => {
          Autenticacao.salvar(sessao);
          EstadoApp.perfil.nome = sessao.nome;
          EstadoApp.perfil.email = sessao.email;
          irParaTela("inicio", { substituir: true });
        })
        .catch((erro) => {
          Componentes.mostrarErro(feedback, erro.message);
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = "Criar conta";
        });
    });
  },
};
