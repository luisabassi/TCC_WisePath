// Montagem de peças compartilhadas entre as telas. O HTML fica em views/compartilhado.html.
const Componentes = {
  iniciais(nome) {
    return (nome || "")
      .split(" ")
      .filter(Boolean)
      .map((palavra) => palavra[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  },

  painelAutenticacao() {
    return Modelos.criar("compartilhado/painel-autenticacao");
  },

  // `atributos` = atributos extras do botão (ex.: { id: "inicio-avatar", title: "Configurações" })
  avatar(perfil, tamanho = 40, atributos = {}) {
    const botao = Modelos.criar("compartilhado/avatar", { iniciais: this.iniciais(perfil.nome) }).firstElementChild;
    botao.style.width = `${tamanho}px`;
    botao.style.height = `${tamanho}px`;
    botao.style.fontSize = `${Math.round(tamanho * 0.38)}px`;
    Object.entries(atributos).forEach(([nome, valor]) => botao.setAttribute(nome, valor));
    return botao;
  },

  cabecalhoMapas({ titulo, subtitulo, acoes }) {
    return Modelos.criar(
      "compartilhado/cabecalho-mapas",
      { titulo, subtitulo },
      { acoes, avatar: this.avatar(EstadoApp.perfil, 42, { id: "mapas-avatar", title: "Configurações" }) },
    );
  },

  mostrarErro(elemento, mensagem) {
    elemento.replaceChildren(Modelos.criar("compartilhado/feedback-erro", { mensagem }));
  },

  mostrarSucesso(elemento, mensagem) {
    elemento.replaceChildren(Modelos.criar("compartilhado/feedback-sucesso", { mensagem }));
    setTimeout(() => elemento.replaceChildren(), 2200);
  },

  limparFeedback(elemento) {
    elemento.replaceChildren();
  },

  // Botões .eye-btn mostram/ocultam o campo apontado por data-alternar-para
  ativarAlternanciaSenha(raiz) {
    raiz.querySelectorAll(".eye-btn").forEach((botao) => {
      botao.addEventListener("click", () => {
        const campo = raiz.querySelector(`#${botao.getAttribute("data-alternar-para")}`);
        const visivel = campo.type === "text";
        campo.type = visivel ? "password" : "text";
        botao.replaceChildren(Icones.criar(visivel ? "olho" : "olho-cortado"));
      });
    });
  },

  // Converte **negrito** e quebras de linha em nós DOM; o texto nunca é interpretado como HTML
  formatarMensagem(texto) {
    const fragmento = document.createDocumentFragment();

    const adicionarTexto = (pai, trecho) => {
      trecho.split("\n").forEach((linha, indice) => {
        if (indice > 0) pai.append(document.createElement("br"));
        if (linha) pai.append(linha);
      });
    };

    const negrito = /\*\*([^*]+)\*\*/g;
    let fim = 0;
    let achado;
    while ((achado = negrito.exec(texto)) !== null) {
      adicionarTexto(fragmento, texto.slice(fim, achado.index));
      const forte = document.createElement("strong");
      adicionarTexto(forte, achado[1]);
      fragmento.append(forte);
      fim = negrito.lastIndex;
    }
    adicionarTexto(fragmento, texto.slice(fim));

    return fragmento;
  },
};
