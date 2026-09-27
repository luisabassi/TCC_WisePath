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

// Troca de tela: cada screen.render() recebe o container e o AppState.
// Guarda a tela atual como "anterior" antes de trocar, exceto ao entrar em
// "settings" — assim o botão de voltar sempre leva pra onde a pessoa estava
// antes de abrir as configurações (welcome ou chat), nunca para "settings".
function setView(view) {
  if (AppState.view !== "settings") {
    AppState.previousView = AppState.view;
  }
  AppState.view = view;
  renderCurrentView();
}

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
