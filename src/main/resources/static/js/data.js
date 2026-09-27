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

const BOT_FLOW = [
  "Olá! 🌟 Que bom ter você aqui. Vou te guiar por algumas perguntas para descobrir carreiras onde suas paixões, talentos, o que o mundo precisa e o que pode te sustentar se encontram.\n\nVamos começar: **o que você ama fazer?** Pode ser um hobby, uma atividade que te faz perder a noção do tempo.",
  "Adorei! 💡 Agora me conta: **no que você é naturalmente bom?** Pense nas habilidades que as pessoas costumam te elogiar.",
  "Incrível! 🙌 Terceira pergunta: **o que você acha que o mundo precisa?** Pode ser uma causa, um problema social, algo que te move.",
  "Quase lá! ✨ Última: **pelo que você poderia ser pago?** Quais habilidades suas têm valor no mercado?",
  "✨ **Seu ikigai está tomando forma!**\n\nBaseado no que você compartilhou, sua jornada une paixão, talento, missão e profissão em um propósito único. Quer explorar carreiras específicas? 🚀",
];

const LOGO_SRC = "assets/logo.png";

const MIN_PASSWORD_LENGTH = 8;
