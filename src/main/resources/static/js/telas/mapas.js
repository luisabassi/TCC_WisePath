// Galeria "Seus mapas mentais" (/mapas)
Telas.mapas = {
  _estado: { consulta: "", erro: null, carregando: false },

  renderizar(raiz) {
    raiz.replaceChildren(
      Modelos.criar(
        "mapas/tela",
        { consulta: this._estado.consulta },
        { cabecalho: Componentes.cabecalhoMapas({ titulo: "Seus mapas mentais" }) },
      ),
    );

    raiz.querySelector("#mapas-voltar").addEventListener("click", () => irParaTela("inicio"));
    raiz.querySelector("#mapas-avatar").addEventListener("click", () => irParaTela("configuracoes"));
    raiz.querySelector("#mapas-busca").addEventListener("input", (evento) => {
      this._estado.consulta = evento.target.value;
      this.renderizarGrade(raiz);
    });

    this.renderizarGrade(raiz);
    this.carregar(raiz);
  },

  // Consulta o back-end a cada abertura 
  // Com cache, ele aparece na hora e é atualizado quando a resposta chega.
  async carregar(raiz) {
    const estado = this._estado;
    estado.carregando = !CacheMapas.carregado;
    estado.erro = null;
    if (estado.carregando) this.renderizarGrade(raiz);

    try {
      await CacheMapas.carregar();
    } catch (erro) {
      estado.erro = erro.message;
    }
    estado.carregando = false;

    // o usuário pode ter saído da tela enquanto esperava
    if (EstadoApp.tela !== "mapas" || !raiz.querySelector("#mapas-grade")) return;
    this.renderizarGrade(raiz);
  },

  renderizarGrade(raiz) {
    const estado = this._estado;
    const grade = raiz.querySelector("#mapas-grade");
    const contagem = raiz.querySelector("#mapas-contagem");
    if (!grade) return;

    if (estado.carregando) {
      contagem.textContent = "";
      grade.replaceChildren(Modelos.criar("mapas/carregando"));
      return;
    }

    if (estado.erro && !CacheMapas.carregado) {
      contagem.textContent = "";
      grade.replaceChildren(Modelos.criar("mapas/erro", { mensagem: estado.erro }));
      grade.querySelector("#mapas-tentar-novamente").addEventListener("click", () => this.carregar(raiz));
      return;
    }

    const consulta = estado.consulta.trim().toLowerCase();
    const todos = [...CacheMapas.mapas].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const lista = todos.filter((mapa) => mapa.tituloChat.toLowerCase().includes(consulta));
    contagem.textContent = `${lista.length} ${lista.length === 1 ? "mapa" : "mapas"}`;

    if (todos.length === 0) {
      grade.replaceChildren(Modelos.criar("mapas/vazio"));
      grade.querySelector("#mapas-iniciar").addEventListener("click", () => irParaTela("chat"));
      return;
    }

    if (lista.length === 0) {
      grade.replaceChildren(Modelos.criar("mapas/sem-resultado", { consulta: estado.consulta }));
      return;
    }

    grade.replaceChildren(
      ...lista.map((mapa) =>
        Modelos.criar("mapas/cartao-mapa", {
          id: mapa.id,
          novo: CacheMapas.novos.has(mapa.id),
          miniatura: MapaMental.miniatura(mapa),
          nome: mapa.tituloChat,
          meta: `${MapaMental.formatarData(mapa.criadoEm)} · ${MapaMental.contarTopicos(mapa)} tópicos`,
        }),
      ),
    );

    grade.querySelectorAll(".map-card").forEach((cartao) =>
      cartao.addEventListener("click", () => {
        EstadoApp.idMapaSelecionado = cartao.getAttribute("data-id");
        irParaTela("detalheMapa");
      }),
    );
  },
};
