// ─── Dados estáticos ────────────────────────────────────────────────────────

const PILLARS = [
  { emoji: "🩷", label: "Paixão", desc: "O que você ama" },
  { emoji: "🧭", label: "Talento", desc: "O que faz bem" },
  { emoji: "🌐", label: "Missão", desc: "O que o mundo precisa" },
  { emoji: "💼", label: "Profissão", desc: "Pelo que pode ser pago" },
];

const IKIGAI_CARDS = [
  { emoji: "🩷", title: "O que você ama", desc: "Suas paixões, hobbies, o que te energiza." },
  { emoji: "🧭", title: "O que você faz bem", desc: "Seus talentos naturais e habilidades aprendidas." },
  { emoji: "🌐", title: "O que o mundo precisa", desc: "Problemas e causas que pedem soluções." },
  { emoji: "💼", title: "Pelo que pode ser pago", desc: "Onde há mercado e remuneração viável." },
];

const SETTINGS_NAV = [
  { id: "perfil", icon: "👤", label: "Perfil" },
  { id: "seguranca", icon: "🔒", label: "Segurança" },
  { id: "excluir", icon: "🗑️", label: "Excluir conta" },
  { id: "sobre", icon: "ℹ️", label: "Sobre" },
];

const RECENT_CHATS = [
];

const LOGO_SRC = "/assets/logo.png"; // absoluto: funciona também em rotas aninhadas (/mapas/12)

const MIN_PASSWORD_LENGTH = 8;

const MAP_BRANCH_META = {
  paixao:    { label: "Paixão",              desc: "O que você ama",             color: "#db2777" },
  talento:   { label: "Talento",             desc: "O que você faz bem",         color: "#4f46e5" },
  missao:    { label: "Missão",              desc: "O que o mundo precisa",      color: "#0f766e" },
  profissao: { label: "Profissão",           desc: "Pelo que pode ser pago",     color: "#b45309" },
  carreiras: { label: "Carreiras sugeridas", desc: "Onde tudo isso se encontra", color: "#7c3aed" },
};
const MAP_BRANCH_ORDER = ["paixao", "talento", "missao", "profissao", "carreiras"];