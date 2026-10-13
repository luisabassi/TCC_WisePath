// ─── Estado global ──────────────────────────────────────────────────────────

const AppState = {
  view: "register", // register | login | welcome | chat | settings | maps | mapDetail
  previousView: "welcome", // para onde o botão "voltar" das configurações leva
  selectedMapId: null, // mapa aberto na tela de detalhe (/mapas/:id)
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
  maps: "/mapas",
};

const MAP_DETAIL_PATH = /^\/mapas\/(\d+)$/;


const PROTECTED_VIEWS = ["welcome", "chat", "settings", "maps", "mapDetail"];

// URL de cada tela 
function pathFor(view){
  if(view === "mapDetail"){
    return AppState.selectedMapId ? `/mapas/${AppState.selectedMapId}` : ROUTES.maps;
  }
  return ROUTES[view];
}


function viewFromPath(pathname){
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const detalhe = path.match(MAP_DETAIL_PATH);
  if(detalhe){
    AppState.selectedMapId = detalhe[1];
    return "mapDetail";
  }
  const entry = Object.entries(ROUTES).find((([,p]) => p === path));
  return entry ? entry[0] : null;
}

//Proteção de rotas no front
function resolveView(view){
  const logado = !!Auth.getToken();
  if(!view) return logado ? "welcome" : "login";
  if(view === "mapDetail" && !AppState.selectedMapId) return logado ? "maps" : "login";
  if(PROTECTED_VIEWS.includes(view) && !logado) return "login";
  if (!PROTECTED_VIEWS.includes(view) && logado) return "welcome";
  return view;
}


//Troca de tela
function setView(view, opts = {}){
  view = resolveView(view);

  if(AppState.view !== "settings"){
    AppState.previousView = AppState.view;
  }
  AppState.view = view;

  const path = pathFor(view);
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

  const path = pathFor(view);
  if (path && window.location.pathname !== path) {
    window.history.replaceState({ view }, "", path);
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
    case "maps":
      Screens.maps.render(container);
      break;
    case "mapDetail":
      Screens.mapDetail.render(container);
      break;
    default:
      Screens.register.render(container);
  }
}