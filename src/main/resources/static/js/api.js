const Api = {
  baseUrl: "",

  async _request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = Auth.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(this.baseUrl + path, { ...options, headers });
    } catch (err) {
      throw new Error("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.");
    }

    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      const mensagem = (data && data.mensagem) || `Erro ${response.status} ao comunicar com o servidor.`;
      throw new Error(mensagem);
    }

    return data;
  },


  //usuário
  // POST /users — cria uma nova conta
  cadastrar(nome, email, senha) {
    return this._request("/users", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });
  },

  // POST /users/login — autentica e retorna { idUsuario, nome, email, token }
  login(email, senha) {
    return this._request("/users/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
  },

};