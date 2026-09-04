import { createScene } from "./scene.js";
import {
  analyzeBuild,
  composeGoalMarkdown,
  composeSettingsFragment,
  composerSystemPrompt,
  isPlateReplacement,
} from "./compose.js";

const NPM_SEARCH = "https://registry.npmjs.org/-/v1/search";
const STORE = "pigo.v04";

const state = {
  catalog: null,
  presets: [],
  selected: [],
  extras: {},
  cat: "all",
  query: "",
  source: "curated",
  marketHits: [],
  marketStatus: "",
  pendingReplace: null,
  detailId: null,
};

const $ = (id) => document.getElementById(id);
const canvas = $("stage");
const scene = createScene(canvas);
scene.onPick((id) => toggle(id));

async function boot() {
  const [catalog, presets] = await Promise.all([
    fetch("./data/bricks.json").then((r) => r.json()),
    fetch("./data/presets.json")
      .then((r) => r.json())
      .catch(() => ({ presets: [] })),
  ]);
  state.catalog = catalog;
  state.presets = presets.presets || [];
  restore();
  paintCats();
  paintCrate();
  paintTray();
  paintPresets();
}

function restore() {
  const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
  const fromHash = (hash.get("b") || "").split(",").filter(Boolean);
  const intentHash = hash.get("i");
  if (fromHash.length) {
    state.selected = fromHash;
    if (intentHash) $("intent").value = intentHash;
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved?.selected) state.selected = saved.selected;
    if (saved?.intent) $("intent").value = saved.intent;
  } catch {
    /* ignore */
  }
}

function persist() {
  const intent = $("intent").value;
  localStorage.setItem(STORE, JSON.stringify({ selected: state.selected, intent }));
  const params = new URLSearchParams();
  if (state.selected.length) params.set("b", state.selected.join(","));
  if (intent.trim()) params.set("i", intent.trim());
  const next = params.toString();
  history.replaceState(null, "", next ? `#${next}` : location.pathname);
}

function paintCats() {
  const wrap = $("cats");
  wrap.innerHTML = "";
  if (state.source !== "curated") return;
  const cats = [{ id: "all", label: "All", color: "#f5c400" }, ...state.catalog.categories];
  for (const c of cats) {
    const b = document.createElement("button");
    b.className = "chip" + (state.cat === c.id ? " on" : "");
    b.textContent = c.labelZh || c.label;
    b.onclick = () => {
      state.cat = c.id;
      paintCats();
      paintCrate();
    };
    wrap.appendChild(b);
  }
}

function visibleBricks() {
  if (state.source === "market") return state.marketHits;
  const q = state.query.trim().toLowerCase();
  return state.catalog.bricks.filter((b) => {
    const catOk = state.cat === "all" || b.category === c.category;
    const text = `${b.name} ${b.nameZh || ""} ${b.summary} ${b.install}`.toLowerCase();
    return catOk && (!q || text.includes(q));
  });
}

function paintCrate() {
  const list = $("crate-list");
  list.innerHTML = "";
  const colors = Object.fromEntries(state.catalog.categories.map((c) => [c.id, c.color]));

  const core = document.createElement("button");
  core.className = "brick-card locked on";
  core.innerHTML = `<span class="swatch" style="background:#111"></span><span><b>Pi Core</b><small>locked plate · read/write/edit/bash</small></span><span class="meta">BASE</span>`;
  list.appendChild(core);

  if (state.source === "market" && state.marketStatus) {
    const note = document.createElement("p");
    note.className = "hint";
    note.textContent = state.marketStatus;
    list.appendChild(note);
  }

  for (const brick of visibleBricks()) {
    brick.color = brick.color || colors[brick.category] || "#7B5CFF";
    const on = state.selected.includes(brick.id);
    const el = document.createElement("button");
    el.className = "brick-card" + (on ? " on" : "") + (brick.source === "marketplace-live" ? " market" : "");
    const badge = brick.source === "omp-split" ? "OMP" : brick.source === "marketplace-live" ? "NPM" : "MKT";
    el.innerHTML = `<span class="swatch" style="background:${brick.color}"></span><span><b>${brick.nameZh || brick.name}</b><small>${brick.name} · ${brick.maturity} · slot ${brick.slot}</small></span><span class="meta">${badge}</span>`;
    el.onclick = () => {
      state.detailId = brick.id;
      toggle(brick);
    };
    list.appendChild(el);
  }
}
