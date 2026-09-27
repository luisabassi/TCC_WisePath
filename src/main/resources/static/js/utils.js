// ─── Helpers ────────────────────────────────────────────────────────────────

function initials(name) {
  return (
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  );
}

// Transforma um texto comum em uma versão segura p/ ser inserida no HTML
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Converte **negrito** e quebras de linha em HTML seguro
function renderMsg(text) {
  const escaped = escapeHtml(text);
  const withBold = escaped.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return withBold.replace(/\n/g, "<br>");
}

// Gera HTML do avatar (foto ou iniciais)
function avatarHTML(profile, size, extraAttrs){
  size = size || 40;
  extraAttrs = extraAttrs || "";
  const fontSize = Math.round(size * 0.38);
  return `<button class="avatar" style="width:${size}px;height:${size}px;font-size:${fontSize}px" ${extraAttrs}>
    ${initials(profile.name)}
  </button>`;
}

// Cria um campo de formulário (label + input, com toggle de senha opcional)
function fieldHTML({ id, label, type = "text", value = "", placeholder = "", withToggle = false }) {
  const inputType = withToggle ? "password" : type;
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <div class="field-wrap">
        <input id="${id}" type="${inputType}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
        ${withToggle ? `<button type="button" class="eye-btn" data-toggle-for="${id}">${Icons.eye}</button>` : ""}
      </div>
    </div>
  `;
}

// Liga o comportamento de mostrar/ocultar senha em todos os botões "eye-btn" de um container
function wireFieldToggles(container) {
  container.querySelectorAll(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inputId = btn.getAttribute("data-toggle-for");
      const input = container.querySelector(`#${inputId}`);
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.innerHTML = showing ? Icons.eye : Icons.eyeOff;
    });
  });
}

