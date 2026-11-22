// Detalhe do mapa mental (/mapas/:id): canvas SVG com zoom, arraste e painel lateral
Telas.detalheMapa = {
  _estado: { recolhidos: new Set(), idSelecionado: null, visao: { x: 0, y: 0, k: 1 }, idMapa: null },

  renderizar(raiz) {
    const id = EstadoApp.idMapaSelecionado;
    const mapa = CacheMapas.obter(id);

    // Mapa fora do cache (recém-gerado ou link direto): busca no back-end
    if (!mapa) {
      this.renderizarCasca(raiz, "Carregando mapa…");
      CacheMapas.garantir(id)
        .then((encontrado) => {
          if (EstadoApp.tela !== "detalheMapa" || EstadoApp.idMapaSelecionado !== id) return;
          if (encontrado) this.renderizar(raiz);
          else this.renderizarCasca(raiz, "Não encontramos este mapa mental.", true);
        })
        .catch((erro) => {
          if (EstadoApp.tela !== "detalheMapa" || EstadoApp.idMapaSelecionado !== id) return;
          this.renderizarCasca(raiz, erro.message, true);
        });
      return;
    }

    const estado = this._estado;

    // Mapa diferente do último aberto: zera seleção, ramos recolhidos e zoom
    if (estado.idMapa !== mapa.id) {
      estado.idMapa = mapa.id;
      estado.recolhidos = new Set();
      estado.idSelecionado = null;
      estado.ajustarAoRenderizar = true;
    }
    CacheMapas.novos.delete(mapa.id); // já foi visto: some o selo "Novo"

    raiz.replaceChildren(
      Modelos.criar(
        "mapa-detalhe/tela",
        {},
        {
          cabecalho: Componentes.cabecalhoMapas({
            titulo: mapa.tituloChat,
            subtitulo: `Conversa de ${MapaMental.formatarData(mapa.criadoEm)} · ${MapaMental.contarTopicos(mapa)} tópicos`,
            acoes: Modelos.criar("mapa-detalhe/acoes"),
          }),
        },
      ),
    );

    raiz.querySelector("#mapas-voltar").addEventListener("click", () => irParaTela("mapas"));
    raiz.querySelector("#mapas-avatar").addEventListener("click", () => irParaTela("configuracoes"));
    raiz.querySelector("#mapa-ver-conversa").addEventListener("click", () => {
      Telas.chat.solicitarAbertura(mapa.idChat); // abre a conversa que originou este mapa
      irParaTela("chat");
    });
    raiz.querySelector("#mapa-baixar-png").addEventListener("click", () => {
      const apelido = mapa.tituloChat
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      MapaMental.exportarPng(mapa, `mapa-mental-${apelido || "wisepath"}.png`);
    });

    this.conectarCanvas(raiz, mapa);
    this.desenharMapa(raiz, mapa);
    this.renderizarPainel(raiz, mapa);
    requestAnimationFrame(() => {
      if (estado.ajustarAoRenderizar) {
        this.ajustar(raiz, mapa);
        estado.ajustarAoRenderizar = false;
      } else {
        this.aplicarVisao(raiz);
      }
    });
  },

  renderizarCasca(raiz, mensagem, comErro) {
    raiz.replaceChildren(
      Modelos.criar(
        "mapa-detalhe/casca",
        { mensagem, classe: comErro ? "feedback-err" : "muted" },
        { cabecalho: Componentes.cabecalhoMapas({ titulo: "Mapa mental" }) },
      ),
    );
    raiz.querySelector("#mapas-voltar").addEventListener("click", () => irParaTela("mapas"));
    raiz.querySelector("#mapas-avatar").addEventListener("click", () => irParaTela("configuracoes"));
  },

  // ─── Desenho ──────────────────────────────────────────────────────────────
  desenharMapa(raiz, mapa) {
    const estado = this._estado;
    this._disposicao = MapaMental.calcularDisposicao(mapa, estado.recolhidos);
    raiz.querySelector("#mapa-viewport").replaceChildren(
      MapaMental.construirConteudo(this._disposicao, { interativo: true, idSelecionado: estado.idSelecionado }),
    );
    this.aplicarVisao(raiz);
  },

  aplicarVisao(raiz) {
    const v = this._estado.visao;
    const grupo = raiz.querySelector("#mapa-viewport");
    if (grupo) grupo.setAttribute("transform", `translate(${v.x},${v.y}) scale(${v.k})`);
  },

  ajustar(raiz, mapa) {
    const svg = raiz.querySelector("#mapa-svg");
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const limites = MapaMental.calcularDisposicao(mapa, this._estado.recolhidos).limites;
    const margem = 40;
    const k = Math.min((width - margem * 2) / limites.largura, (height - margem * 2) / limites.altura, 1.4);
    this._estado.visao = {
      k,
      x: width / 2 - (limites.x + limites.largura / 2) * k,
      y: height / 2 - (limites.y + limites.altura / 2) * k,
    };
    this.aplicarVisao(raiz);
  },

  aproximarEm(raiz, fator, cx, cy) {
    const svg = raiz.querySelector("#mapa-svg");
    const retangulo = svg.getBoundingClientRect();
    const v = this._estado.visao;
    if (cx === undefined) {
      cx = retangulo.width / 2;
      cy = retangulo.height / 2;
    }
    const k = Math.max(0.25, Math.min(2.5, v.k * fator));
    const proporcao = k / v.k;
    v.x = cx - (cx - v.x) * proporcao;
    v.y = cy - (cy - v.y) * proporcao;
    v.k = k;
    this.aplicarVisao(raiz);
  },

  // ─── Interação: arrastar, zoom, clique nos nós e recolher ramos ──────────
  conectarCanvas(raiz, mapa) {
    const estado = this._estado;
    const svg = raiz.querySelector("#mapa-svg");

    raiz.querySelector("#zoom-aproximar").addEventListener("click", () => this.aproximarEm(raiz, 1.25));
    raiz.querySelector("#zoom-afastar").addEventListener("click", () => this.aproximarEm(raiz, 1 / 1.25));
    raiz.querySelector("#zoom-ajustar").addEventListener("click", () => this.ajustar(raiz, mapa));

    svg.addEventListener(
      "wheel",
      (evento) => {
        evento.preventDefault();
        const retangulo = svg.getBoundingClientRect();
        this.aproximarEm(raiz, evento.deltaY < 0 ? 1.1 : 1 / 1.1, evento.clientX - retangulo.left, evento.clientY - retangulo.top);
      },
      { passive: false },
    );

    // Arrastar (mouse e toque); movimento menor que 4px conta como clique
    let arraste = null;
    svg.addEventListener("pointerdown", (evento) => {
      arraste = { x: evento.clientX, y: evento.clientY, vx: estado.visao.x, vy: estado.visao.y, moveu: false };
    });
    svg.addEventListener("pointermove", (evento) => {
      if (!arraste) return;
      const dx = evento.clientX - arraste.x;
      const dy = evento.clientY - arraste.y;
      if (!arraste.moveu && Math.hypot(dx, dy) > 4) {
        arraste.moveu = true;
        svg.setPointerCapture(evento.pointerId);
        svg.classList.add("dragging");
      }
      if (arraste.moveu) {
        estado.visao.x = arraste.vx + dx;
        estado.visao.y = arraste.vy + dy;
        this.aplicarVisao(raiz);
      }
    });
    const terminar = (evento) => {
      if (!arraste) return;
      const moveu = arraste.moveu;
      arraste = null;
      svg.classList.remove("dragging");
      if (moveu) return;
      const botaoRecolher = evento.target.closest && evento.target.closest("[data-recolher]");
      const no = evento.target.closest && evento.target.closest("[data-no]");
      if (botaoRecolher) this.alternarRamo(raiz, mapa, botaoRecolher.getAttribute("data-recolher"));
      else if (no) this.selecionar(raiz, mapa, no.getAttribute("data-no"));
      else this.selecionar(raiz, mapa, null);
    };
    svg.addEventListener("pointerup", terminar);
    svg.addEventListener("pointercancel", () => {
      arraste = null;
      svg.classList.remove("dragging");
    });

    svg.addEventListener("keydown", (evento) => {
      const no = evento.target.closest && evento.target.closest("[data-no]");
      if (no && (evento.key === "Enter" || evento.key === " ")) {
        evento.preventDefault();
        this.selecionar(raiz, mapa, no.getAttribute("data-no"));
      }
    });
  },

  selecionar(raiz, mapa, id) {
    this._estado.idSelecionado = id;
    this.desenharMapa(raiz, mapa);
    this.renderizarPainel(raiz, mapa);
  },

  alternarRamo(raiz, mapa, chave) {
    const recolhidos = this._estado.recolhidos;
    if (recolhidos.has(chave)) recolhidos.delete(chave);
    else recolhidos.add(chave);
    this.desenharMapa(raiz, mapa);
    this.renderizarPainel(raiz, mapa);
  },

  // ─── Painel lateral ───────────────────────────────────────────────────────
  renderizarPainel(raiz, mapa) {
    const painel = raiz.querySelector("#mapa-painel");
    const no = this._disposicao.nos.find((n) => n.id === this._estado.idSelecionado);

    if (no && no.tipo !== "centro") {
      this.renderizarPainelNo(painel, raiz, mapa, no);
      return;
    }

    const chaves = MapaMental.ramosAtivos(mapa);
    const itens = chaves.map((chave) => {
      const meta = META_RAMOS_MAPA[chave];
      return Modelos.criar("mapa-detalhe/item-legenda", {
        ramo: chave,
        estiloPonto: `background:${meta.cor}`,
        rotulo: meta.rotulo,
        descricao: meta.descricao !== meta.rotulo ? meta.descricao : null,
        quantidade: mapa.ramos[chave].length,
      });
    });

    painel.replaceChildren(
      Modelos.criar(
        "mapa-detalhe/painel-resumo",
        {
          titulo: `${MapaMental.contarTopicos(mapa)} tópicos em ${chaves.length} ${chaves.length === 1 ? "ramo" : "ramos"}`,
          resumo: mapa.resumo,
          semRamos: chaves.length === 0,
        },
        { itens },
      ),
    );

    painel.querySelectorAll(".legend-item").forEach((botao) =>
      botao.addEventListener("click", () => this.selecionar(raiz, mapa, "b:" + botao.getAttribute("data-ramo"))),
    );
  },

  renderizarPainelNo(painel, raiz, mapa, no) {
    const meta = META_RAMOS_MAPA[no.ramo];
    const topicos = mapa.ramos[no.ramo];
    const ehFolha = no.tipo === "folha";
    // Só as folhas de "Carreiras sugeridas" têm detalhes da profissão
    const info = ehFolha && no.ramo === "carreiras" ? mapa.infoCarreiras[no.texto] : null;

    painel.replaceChildren(
      Modelos.criar(
        "mapa-detalhe/painel-no",
        {
          estiloEtiqueta: `background:${meta.cor}`,
          rotulo: meta.rotulo,
          titulo: ehFolha || meta.descricao !== meta.rotulo ? (ehFolha ? no.texto : meta.descricao) : null,
          ehFolha,
          descricaoRamo: meta.descricao.toLowerCase(),
          contagem: `${topicos.length} ${topicos.length === 1 ? "tópico" : "tópicos"} neste ramo.`,
          carreira: !!info,
          descricao: info && info.descricao,
          mediaSalarial: info && info.mediaSalarial,
          empregabilidade: info && info.empregabilidade,
        },
        { itens: topicos.map((texto) => Modelos.criar("mapa-detalhe/item-lista", { texto })) },
      ),
    );

    painel.querySelector("#painel-voltar-resumo").addEventListener("click", () => this.selecionar(raiz, mapa, null));
  },
};
