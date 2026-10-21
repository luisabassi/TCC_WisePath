// ─────────────────────────────────────────────────────────────────────────
// Telas: "Seus mapas mentais" (galeria, /mapas) e "Mapa mental" (detalhe, /mapas/:id)
// ─────────────────────────────────────────────────────────────────────────

// Cabeçalho 
function mapsHeaderHTML({ title, subtitle, actions }) {
  return `
    <header class="maps-header">
      <button class="back-btn" id="maps-back" title="Voltar" aria-label="Voltar">${Icons.arrowLeft.replace('stroke="#0d1b4b"', 'stroke="#fff"')}</button>
      <div class="maps-header-text">
        <h1 class="h1 maps-title">${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="maps-subtitle">${subtitle}</p>` : ""}
      </div>
      <div class="maps-header-right">
        ${actions || ""}
        <div class="logo-row logo-row-sm">
          <img src="${LOGO_SRC}" alt="" />
          <span class="logo-text">WisePath</span>
        </div>
        ${avatarHTML(AppState.profile, 42, 'id="maps-avatar" title="Configurações"')}
      </div>
    </header>
  `;
}

// ═════════════════════════ Tela 1: galeria ═════════════════════════════════
Screens.maps = {
  _local: { query: "", error: null, loading: false },

  render(container) {
    container.innerHTML = `
      <div class="mesh-bg maps-page maps-gallery">
        ${mapsHeaderHTML({ title: "Seus mapas mentais" })}
        <div class="maps-toolbar">
          <div class="maps-search">
            <span class="maps-search-icon">${Icons.search}</span>
            <input type="search" id="maps-search" placeholder="Buscar por nome do chat" value="${escapeAttr(this._local.query)}" autocomplete="off" />
          </div>
          <span class="maps-count" id="maps-count"></span>
        </div>
        <main class="maps-grid" id="maps-grid"></main>
      </div>
    `;

    container.querySelector("#maps-back").addEventListener("click", () => setView("welcome"));
    container.querySelector("#maps-avatar").addEventListener("click", () => setView("settings"));
    container.querySelector("#maps-search").addEventListener("input", (e) => {
      this._local.query = e.target.value;
      this.renderGrid(container);
    });

    this.renderGrid(container);
    this.carregar(container);
  },

  // Sempre consulta o back-end ao abrir a galeria (pode ter nascido um mapa novo no chat).
  // Se já houver cache, ele aparece na hora e é atualizado quando a resposta chegar.
  async carregar(container) {
    const local = this._local;
    local.loading = !MapStore.loaded;
    local.error = null;
    if (local.loading) this.renderGrid(container);

    try {
      await MapStore.load();
    } catch (err) {
      local.error = err.message;
    }
    local.loading = false;

    // o usuário pode ter saído da tela enquanto esperava a resposta
    if (AppState.view !== "maps" || !container.querySelector("#maps-grid")) return;
    this.renderGrid(container);
  },

  renderGrid(container) {
    const local = this._local;
    const grid = container.querySelector("#maps-grid");
    const count = container.querySelector("#maps-count");
    if (!grid) return;

    if (local.loading) {
      count.textContent = "";
      grid.innerHTML = `<div class="maps-empty"><p class="muted">Carregando seus mapas…</p></div>`;
      return;
    }

    if (local.error && !MapStore.loaded) {
      count.textContent = "";
      grid.innerHTML = `
        <div class="maps-empty">
          <h2 class="h2">Não foi possível carregar seus mapas</h2>
          <p class="muted">${escapeHtml(local.error)}</p>
          <button class="btn-primary maps-empty-btn" id="maps-retry">Tentar de novo</button>
        </div>`;
      grid.querySelector("#maps-retry").addEventListener("click", () => this.carregar(container));
      return;
    }

    const q = local.query.trim().toLowerCase();
    const all = [...MapStore.maps].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const list = all.filter((m) => m.chatTitle.toLowerCase().includes(q));
    count.textContent = `${list.length} ${list.length === 1 ? "mapa" : "mapas"}`;

    if (all.length === 0) {
      grid.innerHTML = `
        <div class="maps-empty">
          <img src="${LOGO_SRC}" alt="" class="maps-empty-logo" />
          <h2 class="h2">Você ainda não tem mapas mentais</h2>
          <p class="muted">Ao terminar as perguntas do chat, o WisePath monta um mapa com tudo o que você compartilhou.</p>
          <button class="btn-primary maps-empty-btn" id="maps-start">Iniciar conversa</button>
        </div>`;
      grid.querySelector("#maps-start").addEventListener("click", () => setView("chat"));
      return;
    }

    if (list.length === 0) {
      grid.innerHTML = `<div class="maps-empty"><h2 class="h2">Nenhum resultado</h2><p class="muted">Nenhum mapa com “${escapeHtml(local.query)}”.</p></div>`;
      return;
    }

    grid.innerHTML = list
      .map(
        (m) => `
        <button class="map-card" data-id="${escapeAttr(m.id)}">
          ${MapStore.novos.has(m.id) ? '<span class="map-card-badge">Novo</span>' : ""}
          <div class="map-card-preview">${MindMap.thumbnail(m)}</div>
          <div class="map-card-footer">
            <span class="map-card-name">${escapeHtml(m.chatTitle)}</span>
            <span class="map-card-meta">${MindMap.formatDate(m.createdAt)} · ${MindMap.countTopics(m)} tópicos</span>
          </div>
        </button>`
      )
      .join("");

    grid.querySelectorAll(".map-card").forEach((card) =>
      card.addEventListener("click", () => {
        AppState.selectedMapId = card.getAttribute("data-id");
        setView("mapDetail");
      })
    );
  },
};

// ═════════════════════════ Tela 2: detalhe do mapa ═════════════════════════
Screens.mapDetail = {
  _local: { collapsed: new Set(), selectedId: null, view: { x: 0, y: 0, k: 1 }, mapId: null },

  render(container) {
    const id = AppState.selectedMapId;
    const map = MapStore.get(id);

    // Mapa ainda fora do cache (acabou de ser gerado no chat ou link direto): busca no back-end
    if (!map) {
      this.renderShell(container, "Carregando mapa…");
      MapStore.ensure(id)
        .then((m) => {
          if (AppState.view !== "mapDetail" || AppState.selectedMapId !== id) return;
          if (m) this.render(container);
          else this.renderShell(container, "Não encontramos este mapa mental.", true);
        })
        .catch((err) => {
          if (AppState.view !== "mapDetail" || AppState.selectedMapId !== id) return;
          this.renderShell(container, err.message, true);
        });
      return;
    }

    const local = this._local;

    // Mapa diferente do último aberto → zera seleção, ramos recolhidos e zoom
    if (local.mapId !== map.id) {
      local.mapId = map.id;
      local.collapsed = new Set();
      local.selectedId = null;
      local.fitOnRender = true;
    }
    MapStore.novos.delete(map.id); // já foi visto: some o selo "Novo"

    const actions = `
      <button class="btn-outline maps-action" id="map-open-chat">${Icons.chatBubble}<span>Ver conversa</span></button>
      <button class="btn-primary maps-action" id="map-export">${Icons.download}<span>Baixar PNG</span></button>`;

    container.innerHTML = `
      <div class="mesh-bg maps-page">
        ${mapsHeaderHTML({
          title: map.chatTitle,
          subtitle: `Conversa de ${MindMap.formatDate(map.createdAt)} · ${MindMap.countTopics(map)} tópicos`,
          actions,
        })}
        <div class="mapview">
          <section class="mapview-canvas" id="map-canvas" aria-label="Mapa mental interativo">
            <svg id="map-svg" width="100%" height="100%"><g id="map-viewport"></g></svg>
            <div class="map-controls">
              <button class="map-ctrl" id="zoom-in" title="Aproximar" aria-label="Aproximar">${Icons.zoomIn}</button>
              <button class="map-ctrl" id="zoom-out" title="Afastar" aria-label="Afastar">${Icons.zoomOut}</button>
              <button class="map-ctrl" id="zoom-fit" title="Ajustar à tela" aria-label="Ajustar à tela">${Icons.fit}</button>
            </div>
            <p class="map-hint">Arraste para mover · role para dar zoom · clique em um ramo para ver detalhes</p>
          </section>
          <aside class="mapview-panel" id="map-panel"></aside>
        </div>
      </div>
    `;

    container.querySelector("#maps-back").addEventListener("click", () => setView("maps"));
    container.querySelector("#maps-avatar").addEventListener("click", () => setView("settings"));
    container.querySelector("#map-open-chat").addEventListener("click", () => {
      Screens.chat.solicitarAbertura(map.idChat); // abre justamente a conversa que originou este mapa
      setView("chat");
    });
    container.querySelector("#map-export").addEventListener("click", () => {
      const slug = map.chatTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      MindMap.exportPNG(map, `mapa-mental-${slug || "wisepath"}.png`);
    });

    this.wireCanvas(container, map);
    this.drawMap(container, map);
    this.renderPanel(container, map);
    requestAnimationFrame(() => {
      if (local.fitOnRender) { this.fit(container, map); local.fitOnRender = false; }
      else this.applyView(container);
    });
  },

  renderShell(container, mensagem, comErro) {
    container.innerHTML = `
      <div class="mesh-bg maps-page">
        ${mapsHeaderHTML({ title: "Mapa mental" })}
        <div class="maps-empty">
          <p class="${comErro ? "feedback-err" : "muted"}" style="font-size:14px">${escapeHtml(mensagem)}</p>
        </div>
      </div>`;
    container.querySelector("#maps-back").addEventListener("click", () => setView("maps"));
    container.querySelector("#maps-avatar").addEventListener("click", () => setView("settings"));
  },

  // ── Desenho ───────────────────────────────────────────────────────────
  drawMap(container, map) {
    const local = this._local;
    this._layout = MindMap.layout(map, local.collapsed);
    container.querySelector("#map-viewport").innerHTML = MindMap.content(this._layout, { interactive: true, selectedId: local.selectedId });
    this.applyView(container);
  },

  applyView(container) {
    const v = this._local.view;
    const g = container.querySelector("#map-viewport");
    if (g) g.setAttribute("transform", `translate(${v.x},${v.y}) scale(${v.k})`);
  },

  fit(container, map) {
    const svg = container.querySelector("#map-svg");
    if (!svg) return;
    const { width, height } = svg.getBoundingClientRect();
    const b = MindMap.layout(map, this._local.collapsed).bbox;
    const pad = 40;
    const k = Math.min((width - pad * 2) / b.w, (height - pad * 2) / b.h, 1.4);
    this._local.view = { k, x: width / 2 - (b.x + b.w / 2) * k, y: height / 2 - (b.y + b.h / 2) * k };
    this.applyView(container);
  },

  zoomAt(container, factor, cx, cy) {
    const svg = container.querySelector("#map-svg");
    const r = svg.getBoundingClientRect();
    const v = this._local.view;
    if (cx === undefined) { cx = r.width / 2; cy = r.height / 2; }
    const k = Math.max(0.25, Math.min(2.5, v.k * factor));
    const f = k / v.k;
    v.x = cx - (cx - v.x) * f;
    v.y = cy - (cy - v.y) * f;
    v.k = k;
    this.applyView(container);
  },

  // Interação: arrastar, zoom, clique nos nós, recolher ramos ─────────
  wireCanvas(container, map) {
    const local = this._local;
    const svg = container.querySelector("#map-svg");

    container.querySelector("#zoom-in").addEventListener("click", () => this.zoomAt(container, 1.25));
    container.querySelector("#zoom-out").addEventListener("click", () => this.zoomAt(container, 1 / 1.25));
    container.querySelector("#zoom-fit").addEventListener("click", () => this.fit(container, map));

    svg.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      this.zoomAt(container, e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // Arrastar (mouse e toque)
    let drag = null;
    svg.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, y: e.clientY, vx: local.view.x, vy: local.view.y, moved: false };
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) {
        drag.moved = true;
        svg.setPointerCapture(e.pointerId);
        svg.classList.add("dragging");
      }
      if (drag.moved) {
        local.view.x = drag.vx + dx;
        local.view.y = drag.vy + dy;
        this.applyView(container);
      }
    });
    const end = (e) => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      svg.classList.remove("dragging");
      if (moved) return;
      const toggle = e.target.closest && e.target.closest("[data-toggle]");
      const node = e.target.closest && e.target.closest("[data-node]");
      if (toggle) this.toggleBranch(container, map, toggle.getAttribute("data-toggle"));
      else if (node) this.select(container, map, node.getAttribute("data-node"));
      else this.select(container, map, null);
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", () => { drag = null; svg.classList.remove("dragging"); });

    svg.addEventListener("keydown", (e) => {
      const node = e.target.closest && e.target.closest("[data-node]");
      if (node && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        this.select(container, map, node.getAttribute("data-node"));
      }
    });
  },

  select(container, map, id) {
    this._local.selectedId = id;
    this.drawMap(container, map);
    this.renderPanel(container, map);
  },

  toggleBranch(container, map, key) {
    const c = this._local.collapsed;
    c.has(key) ? c.delete(key) : c.add(key);
    this.drawMap(container, map);
    this.renderPanel(container, map);
  },

  // ── Painel lateral
  renderPanel(container, map) {
    const panel = container.querySelector("#map-panel");
    const node = this._layout.nodes.find((n) => n.id === this._local.selectedId);

    if (node && node.kind !== "center") {
      const meta = MAP_BRANCH_META[node.branch];
      const items = map.branches[node.branch];
      const isLeaf = node.kind === "leaf";
      // Folha de "Carreiras sugeridas"
      const info = isLeaf && node.branch === "carreiras" ? map.careerInfo[node.text] : null;
      panel.innerHTML = `
        <span class="panel-tag" style="background:${meta.color}">${meta.label}</span>
        <h2 class="panel-title">${escapeHtml(isLeaf ? node.text : meta.desc)}</h2>
        <p class="muted">${isLeaf
          ? `Faz parte de <strong>${meta.desc.toLowerCase()}</strong>.`
          : `${items.length} ${items.length === 1 ? "tópico" : "tópicos"} neste ramo.`}</p>
        ${!isLeaf ? `<ul class="panel-list">${items.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>` : ""}
        ${info ? `
          <div class="panel-career">
            ${info.descricao ? `<p>${escapeHtml(info.descricao)}</p>` : ""}
            ${info.mediaSalarial ? `<p><strong>Média salarial:</strong> ${escapeHtml(info.mediaSalarial)}</p>` : ""}
            ${info.empregabilidade ? `<p><strong>Empregabilidade:</strong> ${escapeHtml(info.empregabilidade)}</p>` : ""}
          </div>` : ""}
        <button class="btn-ghost muted underline" id="panel-clear">← Voltar ao resumo</button>`;
      panel.querySelector("#panel-clear").addEventListener("click", () => this.select(container, map, null));
      return;
    }

    const keys = MindMap.activeBranches(map);
    panel.innerHTML = `
      <p class="section-label">Resumo</p>
      <h2 class="panel-title">${MindMap.countTopics(map)} tópicos em ${keys.length} ${keys.length === 1 ? "ramo" : "ramos"}</h2>
      ${map.resumo ? `<p class="muted panel-summary">${escapeHtml(map.resumo)}</p>` : ""}
      <ul class="legend">
        ${keys.map((k) => {
          const m = MAP_BRANCH_META[k];
          return `<li><button class="legend-item" data-branch="${k}">
            <span class="legend-dot" style="background:${m.color}"></span>
            <span class="legend-text"><strong>${m.label}</strong><small>${m.desc}</small></span>
            <span class="legend-count">${map.branches[k].length}</span>
          </button></li>`;
        }).join("")}
      </ul>
      ${keys.length === 0 ? `<p class="muted panel-note">Não foi possível montar os ramos deste mapa.</p>` : ""}`;

    panel.querySelectorAll(".legend-item").forEach((btn) =>
      btn.addEventListener("click", () => this.select(container, map, "b:" + btn.getAttribute("data-branch")))
    );
  },
};