// Carrega os arquivos de /views e monta fragmentos DOM a partir dos <template> deles.
//
// Diretivas reconhecidas nos modelos (todas removidas do DOM depois de aplicadas):
//   data-texto="chave"       textContent = dados[chave]
//   data-valor="chave"       value = dados[chave]
//   data-conteudo="chave"    filhos substituídos pelo Node/fragmento dados[chave]
//   data-attr="a:chave;b:c"  setAttribute(a, dados[chave]); ignora null, undefined e false
//   data-se / data-senao     mantém o elemento só se dados[chave] for verdadeiro / falso
//   data-encaixe="nome"      o elemento é trocado por encaixes[nome] (ou removido se ausente)
//   data-icone="nome"        o elemento é trocado pelo ícone de icones.html (data-icone-cor opcional)
const Modelos = {
  PASTA: "/views",
  ARQUIVOS: [
    "icones",
    "compartilhado",
    "cadastro",
    "login",
    "inicio",
    "configuracoes",
    "chat",
    "mapas",
    "mapa-detalhe",
    "mapa-svg",
  ],

  _registro: new Map(), // "arquivo/id" -> <template>

  async carregar() {
    await Promise.all(this.ARQUIVOS.map((arquivo) => this._carregarArquivo(arquivo)));
  },

  async _carregarArquivo(arquivo) {
    const resposta = await fetch(`${this.PASTA}/${arquivo}.html`);
    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar a view "${arquivo}" (erro ${resposta.status}).`);
    }
    const documento = new DOMParser().parseFromString(await resposta.text(), "text/html");
    documento.querySelectorAll("template[id]").forEach((molde) => {
      this._registro.set(`${arquivo}/${molde.id}`, molde);
    });
  },

  // nome = "arquivo/id-do-template". Devolve um DocumentFragment pronto para inserir.
  criar(nome, dados = {}, encaixes = {}) {
    const molde = this._registro.get(nome);
    if (!molde) throw new Error(`Modelo inexistente: ${nome}`);

    const fragmento = document.importNode(molde.content, true);
    this._aplicarCondicoes(fragmento, dados);
    this._aplicarDados(fragmento, dados);
    this._aplicarEncaixes(fragmento, encaixes);
    this._aplicarIcones(fragmento);
    return fragmento;
  },

  // Peças de SVG vêm embrulhadas em <svg> para nascerem no namespace correto; devolve só o conteúdo.
  criarPecaSvg(nome, dados, encaixes) {
    const envoltorio = this.criar(nome, dados, encaixes).firstElementChild;
    const fragmento = document.createDocumentFragment();
    fragmento.append(...envoltorio.childNodes);
    return fragmento;
  },

  _aplicarCondicoes(raiz, dados) {
    raiz.querySelectorAll("[data-se]").forEach((el) => {
      if (!dados[el.dataset.se]) el.remove();
    });
    raiz.querySelectorAll("[data-senao]").forEach((el) => {
      if (dados[el.dataset.senao]) el.remove();
    });
    raiz.querySelectorAll("[data-se], [data-senao]").forEach((el) => {
      el.removeAttribute("data-se");
      el.removeAttribute("data-senao");
    });
  },

  _aplicarDados(raiz, dados) {
    raiz.querySelectorAll("[data-texto]").forEach((el) => {
      el.textContent = dados[el.dataset.texto] ?? "";
      el.removeAttribute("data-texto");
    });
    raiz.querySelectorAll("[data-valor]").forEach((el) => {
      el.value = dados[el.dataset.valor] ?? "";
      el.removeAttribute("data-valor");
    });
    raiz.querySelectorAll("[data-conteudo]").forEach((el) => {
      const conteudo = dados[el.dataset.conteudo];
      if (conteudo) el.replaceChildren(conteudo);
      el.removeAttribute("data-conteudo");
    });
    raiz.querySelectorAll("[data-attr]").forEach((el) => {
      el.dataset.attr.split(";").forEach((par) => {
        const [atributo, chave] = par.split(":").map((parte) => parte.trim());
        const valor = dados[chave];
        if (valor !== undefined && valor !== null && valor !== false) {
          el.setAttribute(atributo, valor);
        }
      });
      el.removeAttribute("data-attr");
    });
  },

  _aplicarEncaixes(raiz, encaixes) {
    raiz.querySelectorAll("[data-encaixe]").forEach((el) => {
      const conteudo = encaixes[el.dataset.encaixe];
      if (conteudo) el.replaceWith(...[].concat(conteudo));
      else el.remove();
    });
  },

  _aplicarIcones(raiz) {
    raiz.querySelectorAll("[data-icone]").forEach((el) => {
      el.replaceWith(Icones.criar(el.dataset.icone, el.dataset.iconeCor));
    });
  },
};

const Icones = {
  criar(nome, cor) {
    const svg = Modelos.criar(`icones/${nome}`).firstElementChild;
    if (cor) svg.setAttribute("stroke", cor);
    return svg;
  },
};
