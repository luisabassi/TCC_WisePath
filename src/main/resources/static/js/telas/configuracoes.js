// Menu lateral com abas: Perfil, Segurança, Excluir conta e Sobre
Telas.configuracoes = {
  _estado: {
    aba: "perfil",
  },

  voltar() {
    irParaTela(EstadoApp.telaAnterior || "inicio");
  },

  renderizar(raiz) {
    const estado = this._estado;
    raiz.replaceChildren(Modelos.criar("configuracoes/tela"));

    raiz.querySelector("#configuracoes-voltar").addEventListener("click", () => this.voltar());

    raiz.querySelectorAll(".settings-nav-item").forEach((botao) => {
      botao.classList.toggle("active", botao.getAttribute("data-aba") === estado.aba);
      botao.addEventListener("click", () => {
        estado.aba = botao.getAttribute("data-aba");
        this.renderizar(raiz);
      });
    });

    this.renderizarAba(raiz);
  },

  renderizarAba(raiz) {
    const conteudo = raiz.querySelector("#configuracoes-conteudo");
    const renderizadores = {
      perfil: () => this.renderizarPerfil(conteudo),
      seguranca: () => this.renderizarSeguranca(conteudo),
      "excluir-conta": () => this.renderizarExcluirConta(conteudo),
      sobre: () => this.renderizarSobre(conteudo),
    };
    renderizadores[this._estado.aba]();
  },

  renderizarPerfil(conteudo) {
    const perfil = EstadoApp.perfil;

    conteudo.replaceChildren(
      Modelos.criar(
        "configuracoes/aba-perfil",
        { nome: perfil.nome, email: perfil.email },
        { avatar: Componentes.avatar({ nome: perfil.nome }, 80) },
      ),
    );

    conteudo.querySelector("#perfil-voltar").addEventListener("click", () => this.voltar());

    conteudo.querySelector("#perfil-salvar").addEventListener("click", () => {
      const nome = conteudo.querySelector("#perfil-nome").value.trim();
      const email = conteudo.querySelector("#perfil-email").value.trim();
      const feedback = conteudo.querySelector("#perfil-feedback");
      const botaoSalvar = conteudo.querySelector("#perfil-salvar");

      if (!nome) {
        Componentes.mostrarErro(feedback, "Nome é obrigatório.");
        return;
      }
      if (!email.includes("@")) {
        Componentes.mostrarErro(feedback, "Email inválido.");
        return;
      }

      const sessao = Autenticacao.obterUsuario();
      if (!sessao) {
        Componentes.mostrarErro(feedback, "Sessão expirada. Faça login novamente.");
        return;
      }

      Componentes.limparFeedback(feedback);
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";

      Api.atualizarPerfil(sessao.idUsuario, { nome, email })
        .then((usuarioAtualizado) => {
          perfil.nome = usuarioAtualizado.nome;
          perfil.email = usuarioAtualizado.email;
          Autenticacao.salvar({ ...sessao, nome: usuarioAtualizado.nome, email: usuarioAtualizado.email });

          const avatar = conteudo.querySelector(".avatar-picker-wrap .avatar");
          if (avatar) avatar.textContent = Componentes.iniciais(usuarioAtualizado.nome);

          Componentes.mostrarSucesso(feedback, "Perfil salvo com sucesso!");
        })
        .catch((erro) => Componentes.mostrarErro(feedback, erro.message))
        .finally(() => {
          botaoSalvar.disabled = false;
          botaoSalvar.textContent = "Salvar";
        });
    });
  },

  renderizarSeguranca(conteudo) {
    conteudo.replaceChildren(
      Modelos.criar("configuracoes/aba-seguranca", { dicaSenha: `Mínimo ${TAMANHO_MINIMO_SENHA} caracteres` }),
    );

    Componentes.ativarAlternanciaSenha(conteudo);
    conteudo.querySelector("#seguranca-voltar").addEventListener("click", () => this.voltar());

    conteudo.querySelector("#seguranca-salvar").addEventListener("click", () => {
      const novaSenha = conteudo.querySelector("#seguranca-nova-senha").value;
      const confirmacao = conteudo.querySelector("#seguranca-confirmar-senha").value;
      const feedback = conteudo.querySelector("#seguranca-feedback");
      const botaoSalvar = conteudo.querySelector("#seguranca-salvar");

      if (!novaSenha) {
        Componentes.mostrarErro(feedback, "Digite a nova senha.");
        return;
      }
      if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
        Componentes.mostrarErro(feedback, `Senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
        return;
      }
      if (novaSenha !== confirmacao) {
        Componentes.mostrarErro(feedback, "As senhas não coincidem.");
        return;
      }

      const sessao = Autenticacao.obterUsuario();
      if (!sessao) {
        Componentes.mostrarErro(feedback, "Sessão expirada. Faça login novamente.");
        return;
      }

      Componentes.limparFeedback(feedback);
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";

      Api.atualizarPerfil(sessao.idUsuario, { senha: novaSenha })
        .then(() => {
          conteudo.querySelector("#seguranca-nova-senha").value = "";
          conteudo.querySelector("#seguranca-confirmar-senha").value = "";
          Componentes.mostrarSucesso(feedback, "Senha atualizada!");
        })
        .catch((erro) => Componentes.mostrarErro(feedback, erro.message))
        .finally(() => {
          botaoSalvar.disabled = false;
          botaoSalvar.textContent = "Salvar";
        });
    });
  },

  renderizarExcluirConta(conteudo) {
    conteudo.replaceChildren(Modelos.criar("configuracoes/aba-excluir-conta"));

    Componentes.ativarAlternanciaSenha(conteudo);
    conteudo.querySelector("#excluir-conta-voltar").addEventListener("click", () => this.voltar());

    conteudo.querySelector("#excluir-conta-confirmar").addEventListener("click", () => {
      const senha = conteudo.querySelector("#excluir-conta-senha").value;
      const feedback = conteudo.querySelector("#excluir-conta-feedback");
      const botaoExcluir = conteudo.querySelector("#excluir-conta-confirmar");

      if (!senha) {
        Componentes.mostrarErro(feedback, "Digite sua senha.");
        return;
      }

      const sessao = Autenticacao.obterUsuario();
      if (!sessao) {
        Componentes.mostrarErro(feedback, "Sessão expirada. Faça login novamente.");
        return;
      }

      if (!confirm("Tem certeza que deseja excluir sua conta? Essa ação não pode ser desfeita.")) return;

      Componentes.limparFeedback(feedback);
      botaoExcluir.disabled = true;
      botaoExcluir.textContent = "Excluindo...";

      // O login confirma a senha antes de apagar a conta
      Api.login(sessao.email, senha)
        .then(() => Api.excluirConta(sessao.idUsuario))
        .then(() => {
          Autenticacao.limpar();
          EstadoApp.perfil = { nome: "", email: "" };
          irParaTela("login", { substituir: true });
        })
        .catch((erro) => {
          Componentes.mostrarErro(feedback, erro.message);
          botaoExcluir.disabled = false;
          botaoExcluir.textContent = "Excluir conta";
        });
    });
  },

  renderizarSobre(conteudo) {
    conteudo.replaceChildren(Modelos.criar("configuracoes/aba-sobre"));
    conteudo.querySelector("#sobre-voltar").addEventListener("click", () => this.voltar());
  },
};
