// ─── Autenticação / sessão ──────────────────────────────────────────────────

const Auth = {
  STORAGE_KEY: "wisepath_sessao",

  // Salva a sessão retornada pelo back-end após login/cadastro.
  salvar(sessao) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessao));
  },

  // Retorna o objeto de sessão salvo (ou null se não houver / estiver corrompido).
  getUsuario() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  },

  // Retorna apenas o token JWT da sessão salva (ou null).
  getToken() {
    const sessao = this.getUsuario();
    return sessao ? sessao.token : null;
  },

  // Remove a sessão salva (usado no logout).
  limpar() {
    localStorage.removeItem(this.STORAGE_KEY);

    if (typeof MapStore !== "undefined") MapStore.limpar();
  },
};