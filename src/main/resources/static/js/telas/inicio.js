Telas.inicio = {
  renderizar(raiz) {
    const avatar = Componentes.avatar(EstadoApp.perfil, 42, { id: "inicio-avatar", title: "Configurações" });
    raiz.replaceChildren(Modelos.criar("inicio/tela", {}, { avatar }));

    raiz.querySelector("#inicio-sair").addEventListener("click", () => {
      Autenticacao.limpar();
      irParaTela("login", { substituir: true });
    });
    raiz.querySelector("#inicio-avatar").addEventListener("click", () => irParaTela("configuracoes"));
    raiz.querySelector("#inicio-iniciar").addEventListener("click", () => irParaTela("chat"));
    raiz.querySelector("#inicio-mapas").addEventListener("click", () => irParaTela("mapas"));
  },
};
