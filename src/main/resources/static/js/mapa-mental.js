// Modelo, disposicao e desenho SVG do mapa mental. O markup SVG fica em views/mapa-svg.html.
const MapaMental = {
  CENTRO: { largura: 150, altura: 70 },
  RAMO: { largura: 184, altura: 46 },
  FOLHA: { largura: 210, altura: 48 },
  ESPACO_X: 80, // espaço horizontal entre colunas
  ESPACO_Y: 14, // espaço vertical entre folhas
  ESPACO_GRUPO: 30, // espaço vertical entre ramos

  MAX_ITENS_POR_RAMO: 6,
  MAX_CARACTERES_ITEM: 200,

  // A IA pode devolver o JSON puro, dentro de cercas ``` ou com texto ao redor
  interpretarJsonMapa(bruto) {
    if (bruto && typeof bruto === "object") return bruto;
    if (typeof bruto !== "string") return null;
    const texto = bruto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return JSON.parse(texto);
    } catch (erro) {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");
      if (inicio !== -1 && fim > inicio) {
        try {
          return JSON.parse(texto.slice(inicio, fim + 1));
        } catch (erroInterno) {
          return null;
        }
      }
      return null;
    }
  },

  _normalizar(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  },

  _limpar(texto) {
    return String(texto == null ? "" : texto)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, this.MAX_CARACTERES_ITEM);
  },

  ALIAS_DIMENSOES: {
    paixao: "paixao",
    talento: "talento",
    missao: "missao",
    vocacao: "profissao",
    profissao: "profissao",
  },

  // Converte o MapaMentalResumoDTO do back-end no formato usado pelas telas
  deResumo(dto) {
    const ramos = { paixao: [], talento: [], missao: [], profissao: [], carreiras: [] };
    const infoCarreiras = {};

    // Ramos do Ikigai: JSON montado pela IA a partir das respostas do chat
    const interpretado = this.interpretarJsonMapa(dto.jsonMapa);
    const ramosBrutos = interpretado && Array.isArray(interpretado.ramos) ? interpretado.ramos : [];
    ramosBrutos.forEach((ramo, indice) => {
      if (!ramo || typeof ramo !== "object") return;
      // Se a IA usar um nome inesperado, a posição (0..3) decide o ramo
      const chave = this.ALIAS_DIMENSOES[this._normalizar(ramo.dimensao)] || ORDEM_RAMOS_MAPA[indice];
      if (!chave || chave === "carreiras" || !ramos[chave]) return;
      const itens = Array.isArray(ramo.itens) ? ramo.itens : [];
      itens
        .map((item) => this._limpar(item))
        .filter(Boolean)
        .forEach((item) => ramos[chave].push(item));
      ramos[chave] = ramos[chave].slice(0, this.MAX_ITENS_POR_RAMO);
    });

    // Carreiras sugeridas: vêm das profissões do resultado
    (dto.profissoes || []).forEach((profissao) => {
      const nome = this._limpar(profissao && profissao.nome);
      if (!nome) return;
      ramos.carreiras.push(nome);
      infoCarreiras[nome] = {
        descricao: profissao.descricao || "",
        mediaSalarial: profissao.mediaSalarial || "",
        empregabilidade: profissao.empregabilidade || "",
      };
    });

    return {
      id: String(dto.idMapaMental),
      idChat: dto.idChat,
      tituloChat: dto.nomeChat || "Conversa",
      criadoEm: dto.dataCriacao,
      resumo: dto.resumo || "",
      ramos,
      infoCarreiras,
    };
  },

  // Quebra o texto em até 2 linhas, com reticências se passar do limite
  quebrarTexto(texto, maxCaracteres) {
    const palavras = String(texto).split(/\s+/).filter(Boolean);
    const linhas = [""];
    palavras.forEach((palavra) => {
      const atual = linhas[linhas.length - 1];
      if ((atual + " " + palavra).trim().length <= maxCaracteres || !atual) {
        linhas[linhas.length - 1] = (atual + " " + palavra).trim();
      } else if (linhas.length < 2) {
        linhas.push(palavra);
      } else {
        linhas[1] = (linhas[1] + " " + palavra).trim();
      }
    });
    return linhas.slice(0, 2).map((linha, i, todas) => {
      const ehUltima = i === todas.length - 1;
      if (linha.length > maxCaracteres && ehUltima) return linha.slice(0, maxCaracteres - 1).trimEnd() + "…";
      return linha.length > maxCaracteres ? linha.slice(0, maxCaracteres) : linha;
    });
  },

  ramosAtivos(mapa) {
    return ORDEM_RAMOS_MAPA.filter((chave) => (mapa.ramos[chave] || []).length > 0);
  },

  contarTopicos(mapa) {
    return this.ramosAtivos(mapa).reduce((total, chave) => total + mapa.ramos[chave].length, 0);
  },

  // Calcula nós e arestas. `recolhidos` é um Set com as chaves dos ramos recolhidos.
  calcularDisposicao(mapa, recolhidos = new Set()) {
    const { CENTRO, RAMO, FOLHA, ESPACO_X, ESPACO_Y, ESPACO_GRUPO } = this;
    const chaves = this.ramosAtivos(mapa);
    const chavesDireita = chaves.slice(0, Math.ceil(chaves.length / 2));
    const chavesEsquerda = chaves.slice(Math.ceil(chaves.length / 2));

    const nos = [
      { id: "centro", tipo: "centro", x: 0, y: 0, largura: CENTRO.largura, altura: CENTRO.altura, texto: "Seu ikigai", cor: "#0d1b4b" },
    ];
    const arestas = [];

    const posicionar = (chavesDoLado, lado) => {
      const direcao = lado === "direita" ? 1 : -1;
      const grupos = chavesDoLado.map((chave) => {
        const itens = recolhidos.has(chave) ? [] : mapa.ramos[chave];
        const altura = Math.max(1, itens.length) * (FOLHA.altura + ESPACO_Y) - ESPACO_Y;
        return { chave, itens, altura };
      });
      const total = grupos.reduce((soma, g) => soma + g.altura, 0) + ESPACO_GRUPO * Math.max(0, grupos.length - 1);
      let topo = -total / 2;
      const xRamo = direcao * (CENTRO.largura / 2 + ESPACO_X + RAMO.largura / 2);
      const xFolha = direcao * (CENTRO.largura / 2 + ESPACO_X + RAMO.largura + ESPACO_X + FOLHA.largura / 2);

      grupos.forEach(({ chave, itens, altura }) => {
        const meta = META_RAMOS_MAPA[chave];
        const yRamo = topo + altura / 2;
        nos.push({
          id: "b:" + chave, tipo: "ramo", ramo: chave, lado, x: xRamo, y: yRamo,
          largura: RAMO.largura, altura: RAMO.altura, texto: meta.rotulo, cor: meta.cor,
          recolhido: recolhidos.has(chave), quantidade: mapa.ramos[chave].length,
        });
        arestas.push({ de: "centro", para: "b:" + chave, cor: meta.cor, espessura: 3 });
        itens.forEach((texto, i) => {
          const yFolha = topo + i * (FOLHA.altura + ESPACO_Y) + FOLHA.altura / 2;
          const id = `l:${chave}:${i}`;
          nos.push({ id, tipo: "folha", ramo: chave, lado, x: xFolha, y: yFolha, largura: FOLHA.largura, altura: FOLHA.altura, texto, cor: meta.cor });
          arestas.push({ de: "b:" + chave, para: id, cor: meta.cor, espessura: 2 });
        });
        topo += altura + ESPACO_GRUPO;
      });
    };

    posicionar(chavesDireita, "direita");
    posicionar(chavesEsquerda, "esquerda");

    const porId = Object.fromEntries(nos.map((no) => [no.id, no]));
    arestas.forEach((aresta) => {
      const origem = porId[aresta.de];
      const destino = porId[aresta.para];
      const direcao = destino.x >= origem.x ? 1 : -1;
      const x1 = origem.x + direcao * (origem.largura / 2), y1 = origem.y;
      const x2 = destino.x - direcao * (destino.largura / 2), y2 = destino.y;
      const meio = (x1 + x2) / 2;
      aresta.caminho = `M${x1},${y1} C${meio},${y1} ${meio},${y2} ${x2},${y2}`;
    });

    const xs = nos.flatMap((no) => [no.x - no.largura / 2, no.x + no.largura / 2]);
    const ys = nos.flatMap((no) => [no.y - no.altura / 2, no.y + no.altura / 2]);
    const limites = {
      x: Math.min(...xs),
      y: Math.min(...ys),
      largura: Math.max(...xs) - Math.min(...xs),
      altura: Math.max(...ys) - Math.min(...ys),
    };
    return { nos, arestas, limites };
  },

  // ─── SVG ──────────────────────────────────────────────────────────────────

  // opcoes.interativo: atributos de interação e botão de recolher; opcoes.idSelecionado: nó em destaque;
  // opcoes.detalhe === false: miniatura sem texto
  construirConteudo(disposicao, opcoes = {}) {
    const fragmento = document.createDocumentFragment();

    disposicao.arestas.forEach((aresta) => {
      fragmento.append(
        Modelos.criarPecaSvg("mapa-svg/aresta", {
          caminho: aresta.caminho,
          cor: aresta.cor,
          espessura: aresta.espessura,
        }),
      );
    });
    disposicao.nos.forEach((no) => fragmento.append(this._criarNo(no, opcoes)));

    return fragmento;
  },

  _criarNo(no, opcoes) {
    const interativo = !!opcoes.interativo;
    const selecionado = opcoes.idSelecionado === no.id;
    const ehFolha = no.tipo === "folha";

    const dados = {
      idNo: interativo ? no.id : null,
      tabindex: interativo ? "0" : null,
      papel: interativo ? "button" : null,
      rotulo: interativo ? no.texto : null,
      estilo: interativo ? "cursor:pointer;outline:none" : null,
      x: no.x - no.largura / 2,
      y: no.y - no.altura / 2,
      largura: no.largura,
      altura: no.altura,
      raio: ehFolha ? 14 : no.tipo === "centro" ? 22 : 23,
    };

    if (ehFolha) {
      dados.cor = selecionado ? "#faf5ff" : "#fff";
      dados.contorno = no.cor;
      dados.larguraContorno = selecionado ? 3 : 2;
    } else {
      dados.cor = no.cor;
      dados.contorno = selecionado ? "#0d1b4b" : null;
      dados.larguraContorno = selecionado ? 3 : null;
    }

    const linhas = opcoes.detalhe === false ? null : this._criarLinhasTexto(no);
    const fragmento = document.createDocumentFragment();
    fragmento.append(Modelos.criarPecaSvg(ehFolha ? "mapa-svg/no-folha" : "mapa-svg/no-preenchido", dados, { linhas }));

    if (interativo && no.tipo === "ramo") {
      const cx = no.x + (no.lado === "direita" ? 1 : -1) * (no.largura / 2 + 14);
      fragmento.append(
        Modelos.criarPecaSvg("mapa-svg/botao-recolher", {
          ramo: no.ramo,
          cx,
          cy: no.y,
          cyTexto: no.y + 0.5,
          cor: no.cor,
          rotulo: no.recolhido ? no.quantidade : "−",
        }),
      );
    }
    return fragmento;
  },

  _criarLinhasTexto(no) {
    const tamanho = no.tipo === "centro" ? 17 : no.tipo === "ramo" ? 14 : 13.5;
    const peso = no.tipo === "folha" ? 600 : 800;
    const cor = no.tipo === "folha" ? "#0d1b4b" : "#fff";
    const linhas =
      no.tipo === "folha" ? this.quebrarTexto(no.texto, 27) : no.tipo === "ramo" ? this.quebrarTexto(no.texto, 21) : [no.texto];
    const alturaLinha = tamanho + 3;
    const yInicial = no.y - ((linhas.length - 1) * alturaLinha) / 2;

    return linhas.map((texto, i) =>
      Modelos.criarPecaSvg("mapa-svg/linha-texto", { x: no.x, y: yInicial + i * alturaLinha, tamanho, peso, cor, texto }),
    );
  },

  // Miniatura dos cards da galeria: só a forma do mapa, sem texto
  miniatura(mapa) {
    const disposicao = this.calcularDisposicao(mapa);
    const margem = 24;
    const l = disposicao.limites;
    return Modelos.criar(
      "mapa-svg/miniatura",
      { viewBox: `${l.x - margem} ${l.y - margem} ${l.largura + margem * 2} ${l.altura + margem * 2}` },
      { conteudo: this.construirConteudo(disposicao, { detalhe: false }) },
    ).firstElementChild;
  },

  // Exporta o mapa completo (mesmo com ramos recolhidos na tela) como PNG 2x com fundo branco
  exportarPng(mapa, nomeArquivo) {
    const disposicao = this.calcularDisposicao(mapa);
    const margem = 40;
    const l = disposicao.limites;
    const largura = Math.ceil(l.largura + margem * 2);
    const altura = Math.ceil(l.altura + margem * 2);

    const svg = Modelos.criar(
      "mapa-svg/exportacao",
      { largura, altura, viewBox: `${l.x - margem} ${l.y - margem} ${largura} ${altura}`, x: l.x - margem, y: l.y - margem },
      { conteudo: this.construirConteudo(disposicao) },
    ).firstElementChild;

    const imagem = new Image();
    imagem.onload = () => {
      const tela = document.createElement("canvas");
      tela.width = largura * 2;
      tela.height = altura * 2;
      const contexto = tela.getContext("2d");
      contexto.scale(2, 2);
      contexto.drawImage(imagem, 0, 0, largura, altura);
      tela.toBlob((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, "image/png");
    };
    imagem.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  },

  formatarData(iso) {
    const data = new Date(iso);
    if (!iso || isNaN(data)) return "—";
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
  },
};

const CacheMapas = {
  mapas: [], // já convertidos por MapaMental.deResumo, do mais novo para o mais antigo
  carregado: false,
  novos: new Set(), // ids gerados nesta sessão: ganham o selo "Novo" na galeria
  _geracao: 0, // sobe a cada limpar(); respostas anteriores ao logout são descartadas

  async carregar() {
    const geracao = this._geracao;
    const lista = await Api.listarMapas();
    // houve logout enquanto a resposta vinha: ela é de outra sessão e não pode entrar no cache
    if (geracao !== this._geracao) return this.mapas;
    this.mapas = (lista || []).map((dto) => MapaMental.deResumo(dto));
    this.carregado = true;
    return this.mapas;
  },

  obter(id) {
    return this.mapas.find((m) => m.id === String(id)) || null;
  },

  // Se o mapa ainda não está no cache (recém-gerado ou aberto direto por /mapas/12), recarrega a lista
  async garantir(id) {
    return this.obter(id) || (await this.carregar(), this.obter(id));
  },

  marcarNovo(id) {
    this.novos.add(String(id));
  },

  limpar() {
    this._geracao++;
    this.mapas = [];
    this.carregado = false;
    this.novos.clear();
  },
};
