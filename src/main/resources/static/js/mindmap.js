// ─────────────────────────────────────────────────────────────────────────
// Mapa mental
// ─────────────────────────────────────────────────────────────────────────

const MindMap = {
  CENTER: { w: 150, h: 70 },
  BRANCH: { w: 184, h: 46 },
  LEAF: { w: 210, h: 48 },
  GAP_X: 80, // espaço horizontal entre colunas
  GAP_Y: 14, // espaço vertical entre folhas
  GROUP_GAP: 30, // espaço vertical entre ramos

  MAX_ITEMS_PER_BRANCH: 6,
  MAX_ITEM_CHARS: 200,

  parseJsonMapa(raw) {
    if (raw && typeof raw === "object") return raw;
    if (typeof raw !== "string") return null;
    const txt = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return JSON.parse(txt);
    } catch (e) {
      const i = txt.indexOf("{");
      const j = txt.lastIndexOf("}");
      if (i !== -1 && j > i) {
        try {
          return JSON.parse(txt.slice(i, j + 1));
        } catch (e2) {
          /* cai no return null */
        }
      }
      return null;
    }
  },

  //para comparar nomes de dimensão
  _norm(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  },

  _clean(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, this.MAX_ITEM_CHARS);
  },

  DIMENSION_ALIASES: {
    paixao: "paixao",
    talento: "talento",
    missao: "missao",
    vocacao: "profissao",
    profissao: "profissao",
  },

  // MapaMentalResumoDTO 
  fromResumo(dto) {
    const branches = { paixao: [], talento: [], missao: [], profissao: [], carreiras: [] };
    const careerInfo = {};

    // 1) Ramos do Ikigai: vêm do JSON que a IA montou a partir das respostas do chat
    const parsed = this.parseJsonMapa(dto.jsonMapa);
    const ramos = parsed && Array.isArray(parsed.ramos) ? parsed.ramos : [];
    ramos.forEach((ramo, i) => {
      if (!ramo || typeof ramo !== "object") return;
      // Reconhece pelo nome; se a IA usar um nome inesperado, cai na posição (0..3)
      const key = this.DIMENSION_ALIASES[this._norm(ramo.dimensao)] || MAP_BRANCH_ORDER[i];
      if (!key || key === "carreiras" || !branches[key]) return;
      const itens = Array.isArray(ramo.itens) ? ramo.itens : [];
      itens.map((t) => this._clean(t)).filter(Boolean).forEach((t) => branches[key].push(t));
      branches[key] = branches[key].slice(0, this.MAX_ITEMS_PER_BRANCH);
    });

    // 2) Carreiras sugeridas: vêm das profissões do resultado
    (dto.profissoes || []).forEach((p) => {
      const nome = this._clean(p && p.nome);
      if (!nome) return;
      branches.carreiras.push(nome);
      careerInfo[nome] = {
        descricao: p.descricao || "",
        mediaSalarial: p.mediaSalarial || "",
        empregabilidade: p.empregabilidade || "",
      };
    });

    return {
      id: String(dto.idMapaMental),
      idChat: dto.idChat,
      chatTitle: dto.nomeChat || "Conversa",
      createdAt: dto.dataCriacao,
      resumo: dto.resumo || "",
      branches,
      careerInfo,
    };
  },

  //Layout

  // Quebra o texto em até 2 linhas, com reticências se passar do limite
  wrap(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [""];
    words.forEach((w) => {
      const cur = lines[lines.length - 1];
      if ((cur + " " + w).trim().length <= maxChars || !cur) {
        lines[lines.length - 1] = (cur + " " + w).trim();
      } else if (lines.length < 2) {
        lines.push(w);
      } else {
        lines[1] = (lines[1] + " " + w).trim();
      }
    });
    return lines.slice(0, 2).map((l, i, arr) => {
      const isLast = i === arr.length - 1;
      return l.length > maxChars && isLast ? l.slice(0, maxChars - 1).trimEnd() + "…" : l.length > maxChars ? l.slice(0, maxChars) : l;
    });
  },

  // Ramos visíveis 
  activeBranches(map) {
    return MAP_BRANCH_ORDER.filter((k) => (map.branches[k] || []).length > 0);
  },

  countTopics(map) {
    return this.activeBranches(map).reduce((n, k) => n + map.branches[k].length, 0);
  },

  // Calcula nós e arestas. `collapsed` é um Set com as chaves dos ramos recolhidos.
  layout(map, collapsed) {
    collapsed = collapsed || new Set();
    const { CENTER, BRANCH, LEAF, GAP_X, GAP_Y, GROUP_GAP } = this;
    const keys = this.activeBranches(map);
    const rightKeys = keys.slice(0, Math.ceil(keys.length / 2));
    const leftKeys = keys.slice(Math.ceil(keys.length / 2));

    const nodes = [{ id: "center", kind: "center", x: 0, y: 0, w: CENTER.w, h: CENTER.h, text: "Seu ikigai", color: "#0d1b4b" }];
    const edges = [];

    const place = (sideKeys, side) => {
      const dir = side === "right" ? 1 : -1;
      const groups = sideKeys.map((k) => {
        const items = collapsed.has(k) ? [] : map.branches[k];
        const h = Math.max(1, items.length) * (LEAF.h + GAP_Y) - GAP_Y;
        return { k, items, h };
      });
      const total = groups.reduce((s, g) => s + g.h, 0) + GROUP_GAP * Math.max(0, groups.length - 1);
      let top = -total / 2;
      const branchX = dir * (CENTER.w / 2 + GAP_X + BRANCH.w / 2);
      const leafX = dir * (CENTER.w / 2 + GAP_X + BRANCH.w + GAP_X + LEAF.w / 2);

      groups.forEach(({ k, items, h }) => {
        const meta = MAP_BRANCH_META[k];
        const by = top + h / 2;
        nodes.push({
          id: "b:" + k, kind: "branch", branch: k, side, x: branchX, y: by,
          w: BRANCH.w, h: BRANCH.h, text: meta.label, color: meta.color,
          collapsed: collapsed.has(k), count: map.branches[k].length,
        });
        edges.push({ from: "center", to: "b:" + k, color: meta.color, width: 3 });
        items.forEach((text, i) => {
          const ly = top + i * (LEAF.h + GAP_Y) + LEAF.h / 2;
          const id = `l:${k}:${i}`;
          nodes.push({ id, kind: "leaf", branch: k, side, x: leafX, y: ly, w: LEAF.w, h: LEAF.h, text, color: meta.color });
          edges.push({ from: "b:" + k, to: id, color: meta.color, width: 2 });
        });
        top += h + GROUP_GAP;
      });
    };

    place(rightKeys, "right");
    place(leftKeys, "left");

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    edges.forEach((e) => {
      const a = byId[e.from], b = byId[e.to];
      const dir = b.x >= a.x ? 1 : -1;
      const x1 = a.x + dir * (a.w / 2), y1 = a.y;
      const x2 = b.x - dir * (b.w / 2), y2 = b.y;
      const mx = (x1 + x2) / 2;
      e.d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    });

    const xs = nodes.flatMap((n) => [n.x - n.w / 2, n.x + n.w / 2]);
    const ys = nodes.flatMap((n) => [n.y - n.h / 2, n.y + n.h / 2]);
    const bbox = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    return { nodes, edges, bbox };
  },

  // ═══════════════════════════════ SVG ══════════════════════════════════════

  // Conteúdo SVG (arestas + nós). `opts.interactive` adiciona data-attributes,
  // botão de recolher e estado de seleção. `opts.detail:false` → miniatura sem texto.
  content(layout, opts) {
    opts = opts || {};
    const sel = opts.selectedId;
    const font = "font-family=\"'Plus Jakarta Sans', system-ui, sans-serif\"";

    const edges = layout.edges
      .map((e) => `<path d="${e.d}" fill="none" stroke="${e.color}" stroke-width="${e.width}" stroke-linecap="round" opacity="0.55"/>`)
      .join("");

    const nodes = layout.nodes
      .map((n) => {
        const x = n.x - n.w / 2, y = n.y - n.h / 2;
        const data = opts.interactive ? `data-node="${n.id}" tabindex="0" role="button" aria-label="${escapeAttr(n.text)}" style="cursor:pointer;outline:none"` : "";
        const isSel = sel === n.id;
        let shape, label = "";

        if (n.kind === "center" || n.kind === "branch") {
          shape = `<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="${n.kind === "center" ? 22 : 23}" fill="${n.color}" ${isSel ? 'stroke="#0d1b4b" stroke-width="3"' : ""}/>`;
        } else {
          shape = `<rect x="${x}" y="${y}" width="${n.w}" height="${n.h}" rx="14" fill="${isSel ? "#faf5ff" : "#fff"}" stroke="${n.color}" stroke-width="${isSel ? 3 : 2}"/>`;
        }

        if (opts.detail !== false) {
          const size = n.kind === "center" ? 17 : n.kind === "branch" ? 14 : 13.5;
          const weight = n.kind === "leaf" ? 600 : 800;
          const fill = n.kind === "leaf" ? "#0d1b4b" : "#fff";
          const lines = n.kind === "leaf" ? this.wrap(n.text, 27) : [n.text];
          const lh = size + 3;
          const startY = n.y - ((lines.length - 1) * lh) / 2;
          label = lines
            .map((l, i) => `<text x="${n.x}" y="${startY + i * lh}" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="${weight}" fill="${fill}" ${font}>${escapeHtml(l)}</text>`)
            .join("");
        }

        // botão de recolher/expandir (somente na tela interativa)
        let toggle = "";
        if (opts.interactive && n.kind === "branch") {
          const cx = n.x + (n.side === "right" ? 1 : -1) * (n.w / 2 + 14);
          toggle = `<g data-toggle="${n.branch}" style="cursor:pointer">
            <circle cx="${cx}" cy="${n.y}" r="11" fill="#fff" stroke="${n.color}" stroke-width="2"/>
            <text x="${cx}" y="${n.y + 0.5}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="800" fill="${n.color}" ${font}>${n.collapsed ? n.count : "−"}</text>
          </g>`;
        }
        return `<g ${data}>${shape}${label}</g>${toggle}`;
      })
      .join("");

    return edges + nodes;
  },

  // Miniatura para os cards da galeria (sem texto, só a "forma" do mapa)
  thumbnail(map) {
    const l = this.layout(map);
    const pad = 24;
    const b = l.bbox;
    return `<svg viewBox="${b.x - pad} ${b.y - pad} ${b.w + pad * 2} ${b.h + pad * 2}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${this.content(l, { detail: false })}</svg>`;
  },

  // Exporta o mapa como PNG (fundo branco, 2x)
  exportPNG(map, filename) {
    const l = this.layout(map); // sempre completo, mesmo com ramos recolhidos na tela
    const pad = 40;
    const b = l.bbox;
    const w = Math.ceil(b.w + pad * 2), h = Math.ceil(b.h + pad * 2);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${b.x - pad} ${b.y - pad} ${w} ${h}">
      <rect x="${b.x - pad}" y="${b.y - pad}" width="${w}" height="${h}" fill="#ffffff"/>${this.content(l)}</svg>`;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, "image/png");
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  },

  formatDate(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "—";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
  },
};

// ═══════════════════════════ Cache dos mapas ═════════════════════════════════
const MapStore = {
  maps: [], // mapas já convertidos (MindMap.fromResumo), do mais novo para o mais antigo
  loaded: false,
  novos: new Set(), // ids gerados nesta sessão → badge "Novo" na galeria
  _geracao: 0, // sobe a cada limpar(); respostas de antes do logout são descartadas

  // Busca no back-end (GET /mapamental). Lança erro se a requisição falhar.
  async load() {
    const geracao = this._geracao;
    const lista = await Api.listarMapas();
    // Se houve logout enquanto a resposta vinha, ela é de outro usuário/sessão: não grava no cache
    if (geracao !== this._geracao) return this.maps;
    this.maps = (lista || []).map((dto) => MindMap.fromResumo(dto));
    this.loaded = true;
    return this.maps;
  },

  get(id) {
    return this.maps.find((m) => m.id === String(id)) || null;
  },

  // Devolve o mapa do cache; se ainda não estiver lá (ex.: acabou de ser gerado
  // no chat, ou a página foi aberta direto em /mapas/12), recarrega a lista.
  async ensure(id) {
    return this.get(id) || (await this.load(), this.get(id));
  },

  marcarNovo(id) {
    this.novos.add(String(id));
  },

  limpar() {
    this._geracao++;
    this.maps = [];
    this.loaded = false;
    this.novos.clear();
  },
};