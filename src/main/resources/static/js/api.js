const Api = {
  urlBase: "",

  async _requisicao(caminho, opcoes = {}) {
    const cabecalhos = { "Content-Type": "application/json", ...(opcoes.headers || {}) };
    const token = Autenticacao.obterToken();
    if (token) cabecalhos["Authorization"] = `Bearer ${token}`;

    let resposta;
    try {
      resposta = await fetch(this.urlBase + caminho, { ...opcoes, headers: cabecalhos });
    } catch (erro) {
      throw new Error("Não foi possível conectar ao servidor. Verifique se o back-end está rodando.");
    }

    const ehJson = (resposta.headers.get("content-type") || "").includes("application/json");
    const dados = ehJson ? await resposta.json().catch(() => null) : null;

    if (!resposta.ok) {
      const mensagem = (dados && dados.mensagem) || `Erro ${resposta.status} ao comunicar com o servidor.`;
      const erro = new Error(mensagem);
      erro.status = resposta.status; // o front distingue 404/409 (chat removido ou alterado em outra janela)
      throw erro;
    }

    return dados;
  },

  // Usuários
  cadastrar(nome, email, senha) {
    return this._requisicao("/usuarios", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });
  },

  login(email, senha) {
    return this._requisicao("/usuarios/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
  },

  atualizarPerfil(idUsuario, dados) {
    return this._requisicao(`/usuarios/${idUsuario}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    });
  },

  excluirConta(idUsuario) {
    return this._requisicao(`/usuarios/${idUsuario}`, { method: "DELETE" });
  },

  // Chats
  listarChats(idUsuario) {
    return this._requisicao(`/chats/usuario/${idUsuario}`);
  },

  criarChat(nome) {
    return this._requisicao("/chats", {
      method: "POST",
      body: JSON.stringify({ nome }),
    });
  },

  renomearChat(idChat, nome) {
    return this._requisicao(`/chats/${idChat}`, {
      method: "PUT",
      body: JSON.stringify({ nome }),
    });
  },

  excluirChat(idChat) {
    return this._requisicao(`/chats/${idChat}`, { method: "DELETE" });
  },

  buscarChats(nome) {
    return this._requisicao(`/chats/busca?nome=${encodeURIComponent(nome)}`);
  },

  // Mensagens
  listarMensagens(idChat) {
    return this._requisicao(`/chats/${idChat}/mensagens`);
  },

  // ultimaMensagemId = última mensagem que esta tela conhece (0 = chat vazio).
  // Se o chat mudou em outra janela, o servidor recusa com 409 em vez de misturar históricos.
  enviarMensagem(idChat, conteudo, ultimaMensagemId) {
    return this._requisicao(`/chats/${idChat}/mensagens`, {
      method: "POST",
      body: JSON.stringify({ conteudo, ultimaMensagemId }),
    });
  },

  // Devolve [mensagem editada, nova resposta do chatbot]
  editarMensagem(idChat, idMensagem, conteudo) {
    return this._requisicao(`/chats/${idChat}/mensagens/${idMensagem}`, {
      method: "PUT",
      body: JSON.stringify({ conteudo }),
    });
  },

  // Apaga a mensagem e todas as posteriores
  excluirMensagem(idChat, idMensagem) {
    return this._requisicao(`/chats/${idChat}/mensagens/${idMensagem}`, { method: "DELETE" });
  },

  // Resultados
  listarResultados(idChat) {
    return this._requisicao(`/chats/${idChat}/resultado`);
  },

  gerarResultado(idChat) {
    return this._requisicao(`/chats/${idChat}/resultado`, { method: "POST" });
  },

  // Mapas mentais
  listarMapas() {
    return this._requisicao("/mapamental");
  },
};
