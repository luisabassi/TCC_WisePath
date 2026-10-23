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


    //Usuários
    cadastrar(nome, email, senha) {
      return this._request("/users", {
        method: "POST",
        body: JSON.stringify({ nome, email, senha }),
      });
    },

    login(email, senha) {
      return this._request("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
    },

    atualizarPerfil(idUsuario, dados){
      return this._request(`/users/${idUsuario}`, {
        method: "PUT",
        body:JSON.stringify(dados)
      });
    },

    excluirConta(idUsuario){
      return this._request(`/users/${idUsuario}` , {
        method:"DELETE",
      });
    },

    //Chats
    listarChats(idUsuario){
      return this._request(`/chats/usuario/${idUsuario}`);
    },

    criarChat(nome){
      return this._request("/chats", {
        method: "POST", 
        body: JSON.stringify({nome}),
      });
    },

    renomearChat(idChat, nome){
      return this._request(`/chats/${idChat}`, {
        method: "PUT",
        body: JSON.stringify({ nome }),
      });
    },

    excluirChat(idChat){
      return this._request(`/chats/${idChat}`, { method: "DELETE" });
    },

    //encondeURIComponent serve para codificar um componente de uma URI/URL
    //transformando caracteres especiais em formatos seguros para internet
    buscarChats(nome){
      return this._request(`/chats/busca?nome=${encodeURIComponent(nome)}`);
    },

    //Mensagens
    listarMensagens(idChat){
      return this._request(`/chats/${idChat}/mensagens`);
    }, 

    enviarMensagem(idChat, conteudo){
      return this._request(`/chats/${idChat}/mensagens`, {
        method:"POST", 
        body: JSON.stringify({conteudo}),
      });
    }, 

    editarMensagem(idChat, idMensagem, conteudo){
      return this._request(`/chats/${idChat}/mensagens/${idMensagem}`, {
        method:"PUT",
        body: JSON.stringify({conteudo}),
      });
    },

    excluirMensagem(idChat, idMensagem){
      return this._request(`/chats/${idChat}/mensagens/${idMensagem}`, { method:"DELETE" });
    },

    listarResultados(idChat){
      return this._request(`/chats/${idChat}/resultado`);
    }, 

    gerarResultado(idChat){
      return this._request(`/chats/${idChat}/resultado`, {
        method:"POST",
      });
    },

    //Mapas mentais 
    listarMapas(){
      return this._request("/mapamental");
    },
};