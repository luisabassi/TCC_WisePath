// ─── Autenticação / sessão ──────────────────────────────────────────────────

const Auth = {
  STORAGE_KEY: "wisepath_sessao",

  salvar(sessao) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessao));
  },

  getUsuario() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  },

  getToken() {
    const sessao = this.getUsuario();
    return sessao ? sessao.token : null;
  },

  limpar() {
    localStorage.removeItem(this.STORAGE_KEY);
  },
};