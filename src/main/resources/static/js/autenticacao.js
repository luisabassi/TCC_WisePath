const Autenticacao = {
  CHAVE_ARMAZENAMENTO: "wisepath_sessao",

  salvar(sessao) {
    localStorage.setItem(this.CHAVE_ARMAZENAMENTO, JSON.stringify(sessao));
  },

  obterUsuario() {
    const bruto = localStorage.getItem(this.CHAVE_ARMAZENAMENTO);
    if (!bruto) return null;
    try {
      return JSON.parse(bruto);
    } catch (erro) {
      return null;
    }
  },

  obterToken() {
    const sessao = this.obterUsuario();
    return sessao ? sessao.token : null;
  },

  // Também descarta o que pertence ao usuário que saiu (mapas em cache e conversas abertas)
  limpar() {
    localStorage.removeItem(this.CHAVE_ARMAZENAMENTO);

    if (typeof CacheMapas !== "undefined") CacheMapas.limpar();
    if (typeof Telas !== "undefined" && Telas.chat) Telas.chat.reiniciar();
  },
};
