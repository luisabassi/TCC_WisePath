// Estado global e roteador do front-end (rotas do SPA)
const Telas = {};

const EstadoApp = {
  tela: "cadastro", // cadastro | login | inicio | chat | configuracoes | mapas | detalheMapa
  telaAnterior: "inicio", // para onde o botão "voltar" das configurações leva
  idMapaSelecionado: null,
  perfil: {
    nome: "",
    email: "",
  },
};

const obterRaiz = () => document.getElementById("root");

const ROTAS = {
  cadastro: "/cadastro",
  login: "/login",
  inicio: "/inicio",
  chat: "/chat",
  configuracoes: "/configuracoes",
  mapas: "/mapas",
};

const CAMINHO_DETALHE_MAPA = /^\/mapas\/(\d+)$/;
const CAMINHO_DETALHE_CHAT = /^\/chat\/(\d+)$/; // cada aba/janela abre a sua conversa

const TELAS_PROTEGIDAS = ["inicio", "chat", "configuracoes", "mapas", "detalheMapa"];

function caminhoDaTela(tela) {
  if (tela === "chat") return Telas.chat.caminhoAtual();
  if (tela === "detalheMapa") {
    return EstadoApp.idMapaSelecionado ? `/mapas/${EstadoApp.idMapaSelecionado}` : ROTAS.mapas;
  }
  return ROTAS[tela];
}

function telaDoCaminho(caminhoCompleto) {
  const caminho = caminhoCompleto.length > 1 ? caminhoCompleto.replace(/\/+$/, "") : caminhoCompleto;

  const chatDetalhe = caminho.match(CAMINHO_DETALHE_CHAT);
  if (chatDetalhe) {
    // sem login o pedido ficaria pendente e seria aberto por outro usuário
    if (Autenticacao.obterToken()) Telas.chat.solicitarAbertura(Number(chatDetalhe[1]));
    return "chat";
  }

  const mapaDetalhe = caminho.match(CAMINHO_DETALHE_MAPA);
  if (mapaDetalhe) {
    EstadoApp.idMapaSelecionado = mapaDetalhe[1];
    return "detalheMapa";
  }

  const entrada = Object.entries(ROTAS).find(([, rota]) => rota === caminho);
  return entrada ? entrada[0] : null;
}

// Proteção de rotas no front: telas internas exigem login e telas de acesso redirecionam quem já entrou
function resolverTela(tela) {
  const logado = !!Autenticacao.obterToken();
  if (!tela) return logado ? "inicio" : "login";
  if (tela === "detalheMapa" && !EstadoApp.idMapaSelecionado) return logado ? "mapas" : "login";
  if (TELAS_PROTEGIDAS.includes(tela) && !logado) return "login";
  if (!TELAS_PROTEGIDAS.includes(tela) && logado) return "inicio";
  return tela;
}

function irParaTela(telaDesejada, opcoes = {}) {
  const tela = resolverTela(telaDesejada);

  if (EstadoApp.tela !== "configuracoes") EstadoApp.telaAnterior = EstadoApp.tela;
  EstadoApp.tela = tela;

  const caminho = caminhoDaTela(tela);
  if (caminho && window.location.pathname !== caminho) {
    const metodo = opcoes.substituir ? "replaceState" : "pushState";
    window.history[metodo]({ tela }, "", caminho);
  }

  renderizarTelaAtual();
}

window.addEventListener("popstate", () => {
  const tela = resolverTela(telaDoCaminho(window.location.pathname));

  if (EstadoApp.tela !== "configuracoes") EstadoApp.telaAnterior = EstadoApp.tela;
  EstadoApp.tela = tela;

  const caminho = caminhoDaTela(tela);
  if (caminho && window.location.pathname !== caminho) {
    window.history.replaceState({ tela }, "", caminho);
  }
  renderizarTelaAtual();
});

function renderizarTelaAtual() {
  const raiz = obterRaiz();
  raiz.replaceChildren();

  const tela = Telas[EstadoApp.tela] || Telas.cadastro;
  tela.renderizar(raiz);
}
