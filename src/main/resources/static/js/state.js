// ─── Estado global ──────────────────────────────────────────────────────────

const AppState = {
  view: "register", // register | login | welcome | chat | settings
  previousView: "welcome", // para onde o botão "voltar" das configurações leva
  profile: {
    name: "",
    email: "",
  },
};

const root = () => document.getElementById("root");

const ROUTES = {
  register: "/cadastro",
  login: "/login",
  welcome: "/inicio",
  chat: "/chat",
  settings: "/configuracoes",
};

//Telas que exigem sessao (token)
const PROTECTEC_VIEWS = ["welcome", "chat", "settings"];

function viewFromPath(pathname){
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const entry = Object.entries(ROUTES).find((([,p]) => p === path));
  return entry ? entry[0] : null;
}

//Proteção de rotas no front: sem sessao não entra em telas privadas,
//e com sessao não faz sentido voltar para login/cadastro
function resolveView(view){
  const logado = !!Auth.getToken();
  if(!view) return logado ? "welcome" : "login";
  if(PROTECTEC_VIEWS.includes(view) && !logado) return "login";
  if (!PROTECTED_VIEWS.includes(view) && logado) return "welcome";
  return view;
}


//Troca de tela: cada screen.render() recebe o container e o AppState
//Guarda a tela atual como "anterior" antes de trocar, exceto ao entrar em settings
function setView(view, opts = {}){
  view = resolveView(view);

  if(AppState.view !== "settings"){
    AppState.previousView = AppState.view;
  }
  AppState.view = view;

  const path = ROUTES[view];
  if(path && window.location.pathname !== path){
    const method = opts.replace ? "replaceState" : "pushState";
    window.history[method]({view}, "", path);
  }

  renderCurrentView();
}

//Botões voltar/avançar do navegador
window.addEventListener("popstate", () => {
  const view = resolveView(viewFromPath(window.location.pathname));

  if(AppState.view !== "settings"){
    AppState.previousView = AppState.view;
  }
  AppState.view = view;

  if (ROUTES[view] && window.location.pathname !== ROUTES[view]) {
    window.history.replaceState({ view }, "", ROUTES[view]);
  }
  renderCurrentView();
  
});

function renderCurrentView() {
  const container = root();
  container.innerHTML = "";

  switch (AppState.view) {
    case "register":
      Screens.register.render(container);
      break;
    case "login":
      Screens.login.render(container);
      break;
    case "welcome":
      Screens.welcome.render(container);
      break;
    case "settings":
      Screens.settings.render(container);
      break;
    case "chat":
      Screens.chat.render(container);
      break;
    default:
      Screens.register.render(container);
  }
}
