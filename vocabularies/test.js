<<<<<<< HEAD
﻿(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pretty = (s) => String(s || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const safeKey = (s) => String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);


  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const providerUrl = () =>
    `/vocabularies/provider.html?type=${encodeURIComponent(state.type)}&name=${encodeURIComponent(state.name)}`;

  const parseParams = () => {
    const u = new URL(location.href);
    return {
      type: u.searchParams.get("type") || "",
      name: u.searchParams.get("name") || "",
      mode: u.searchParams.get("mode") || "",
      room: u.searchParams.get("room") || "",
    };
  };

  const saveContextToLS = (type, name) => {
    try {
      localStorage.setItem("eduventure_vocab_context", JSON.stringify({ type, name }));
    } catch {}
  };

  const loadContextFromLS = () => {
    try {
      const raw = localStorage.getItem("eduventure_vocab_context");
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (v && typeof v === "object" && v.type && v.name) return v;
    } catch {}
    return null;
  };


  const I = (name, cls = "ev-ico") => `<i data-lucide="${name}" class="${cls}"></i>`;

  const refreshIcons = () => {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch {}
  };


  const injectStyles = () => {
    if ($("#eduventure-vocab-style")) return;
    const st = document.createElement("style");
    st.id = "eduventure-vocab-style";
    st.textContent = `
      .ev-toprow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
      .ev-pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.20);border:1px solid rgba(255,255,255,.35);color:#fff;font-weight:500;}
      .ev-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .ev-col{display:flex;flex-direction:column;gap:10px}
      .ev-card{width:min(680px,100%);margin:0 auto;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);border-radius:18px;padding:20px;backdrop-filter: blur(10px);-webkit-backdrop-filter: blur(10px);}
      .ev-h{margin:0 0 6px 0;font-size:20px;opacity:.98;color:#fff;font-weight:700;}
      .ev-sub{margin:0 0 14px 0;font-size:13px;opacity:.85;color:#fff;}
      .ev-select, .ev-input{padding:11px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.30);background:rgba(255,255,255,.15);color:#fff;outline:none;font-size:14px;}
      .ev-select option{background:#1a1a2e;color:#fff;}
      .ev-input::placeholder{color:rgba(255,255,255,.6);}
      .ev-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:13px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.30);background:rgba(255,255,255,.16);color:#fff;font-weight:700;cursor:pointer;transition:.2s transform,.2s opacity,.2s background;font-size:14px;}
      .ev-card .lucide{width:18px;height:18px;}
      .ev-pill .lucide{width:14px;height:14px;}
      .ev-btn:hover{transform:translateY(-2px);background:rgba(255,255,255,.24);}
      .ev-btn:active{transform:translateY(0px);}
      .ev-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}
      .ev-answers{display:grid;grid-template-columns:1fr;gap:12px;margin-top:16px;}
      @media(min-width:640px){.ev-answers{grid-template-columns:1fr 1fr;}}
      @media(max-width:639px){.ev-card{padding:16px;}}
      .ev-answer{padding:14px 16px;border-radius:14px;border:2px solid rgba(255,255,255,.28);background:rgba(40,40,60,.75);cursor:pointer;text-align:left;color:#fff;font-weight:600;font-size:15px;transition:.2s all;}
      .ev-answer:hover{background:rgba(60,60,90,.85);border-color:rgba(255,255,255,.4);transform:translateY(-2px);}
      .ev-answer:active{transform:translateY(0);}
      .ev-answer.good{border-color:rgba(34,197,94,.9);background:rgba(34,197,94,.25);box-shadow:0 0 0 3px rgba(34,197,94,.2) inset;color:#4ade80;}
      .ev-answer.bad{border-color:rgba(239,68,68,.9);background:rgba(239,68,68,.25);box-shadow:0 0 0 3px rgba(239,68,68,.2) inset;color:#f87171;}
      .ev-answer:disabled{cursor:not-allowed;opacity:.85;}
      .ev-progress{height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.20)}
      .ev-progress > div{height:100%;width:0%;background:linear-gradient(90deg, rgba(59,130,246,.85), rgba(147,51,234,.85));transition:width .3s ease}
      .ev-word{font-size:24px;font-weight:800;letter-spacing:.4px;margin:8px 0 4px 0;line-height:1.3;user-select:none;color:#fff;}
      .ev-word.masked{filter: blur(10px); opacity:.65; }
      .ev-word.masked::after{content:"  (tap to reveal)";font-size:13px;font-weight:600;opacity:.9;color:rgba(255,255,255,.8);}
      .ev-word.blink{animation: evBlink .55s steps(2,end) infinite;}
      @keyframes evBlink{50%{opacity:.1}}
      .ev-word.glitch{position:relative;}
      .ev-word.glitch::before,.ev-word.glitch::after{
        content: attr(data-text);
        position:absolute;left:0;top:0;width:100%;
        mix-blend-mode: screen; opacity:.7;
      }
      .ev-word.glitch::before{transform:translate(2px,-1px);filter:blur(0.5px);color:#f0f;}
      .ev-word.glitch::after{transform:translate(-2px,1px);filter:blur(0.5px);color:#0ff;}
      .ev-timer{font-variant-numeric: tabular-nums;color:#fff;}
      .ev-note{font-size:13px;opacity:.85;margin-top:8px;color:#fff;}
      .ev-kbd{font-size:11px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);color:#fff;font-weight:600;}
      @media(max-width:500px){
        .ev-word{font-size:20px;}
        .ev-answer{padding:12px;font-size:14px;}
        .ev-toprow{gap:8px;}
      }

      /* Rooms / Group Arena */
      .ev-roomhub{margin-top:10px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.20);background:rgba(255,255,255,.06);}
      .ev-roomhub-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
      .ev-roomlist{display:grid;gap:10px}
      .ev-roomcard{padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg, rgba(30,41,59,.55), rgba(88,28,135,.35));}
      .ev-roomcard-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
      .ev-roommeta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .ev-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);font-size:12px;color:#fff;font-weight:600}
      .ev-code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;letter-spacing:.6px}
      .ev-split{display:grid;gap:12px}
      @media(min-width:900px){.ev-split{grid-template-columns:1.35fr .65fr}}
      .ev-panel{padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.28)}
      .ev-list{display:flex;flex-direction:column;gap:8px}
      .ev-mini{font-size:12px;opacity:.9;color:#fff}
      .ev-muted{opacity:.75}
    `;
    document.head.appendChild(st);
  };

  /* -----------------------
     2) Firebase lazy imports
  ------------------------ */
  let fb = null; // {auth, db, ref, get, set, update, push, runTransaction}
  let onAuthStateChanged = null;

  async function loadFirebase() {
    if (fb) return fb;
    const mod = await import("/elements/firebase.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
    const dbMod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js");
    fb = {
      auth: mod.auth,
      db: mod.db,
      ref: mod.ref,
      get: mod.get,
      set: mod.set,
      update: mod.update,
      push: mod.push,
      runTransaction: mod.runTransaction,

      // realtime helpers (needed for live rooms)
      onValue: dbMod.onValue,
      off: dbMod.off,
      remove: dbMod.remove,
      onDisconnect: dbMod.onDisconnect,
      serverTimestamp: dbMod.serverTimestamp,
    };
    onAuthStateChanged = authMod.onAuthStateChanged;
    return fb;
  }

  /* -----------------------
     3) App state
  ------------------------ */
  const app = document.getElementById("app");
  const sndCorrect = document.getElementById("correctSnd");
  const sndWrong = document.getElementById("wrongSnd");
  const sndClick = document.getElementById("clickSnd");
  const lofi = document.getElementById("lofiMusic");

  const state = {
    user: null,
    uid: null,

    type: "",  // unitwords | listeningwords
    name: "",  // unit1 | building_bridge
    vocab: [], // [{id, eng, uzb, rus}]

    settings: {
      difficulty: "normal", // easy|normal|hard|nightmare
      direction: "eng->uzb", // eng->uzb | eng->rus | uzb->eng | rus->eng | mixed
      count: 15,
      options: 4,
    },

    session: null, // solo session stats
    group: null,   // group session
  };

  const DIFF = {
    easy:      { seconds: 0,  effects: { blink: 0.00, glitch: 0.00, mask: 0.00 }, revealMs: 0 },
    normal:    { seconds: 12, effects: { blink: 0.10, glitch: 0.05, mask: 0.05 }, revealMs: 900 },
    hard:      { seconds: 9,  effects: { blink: 0.22, glitch: 0.18, mask: 0.22 }, revealMs: 800 },
    nightmare: { seconds: 7,  effects: { blink: 0.30, glitch: 0.25, mask: 0.35 }, revealMs: 700 },
  };

  /* -----------------------
     3.5) Deterministic helpers for GROUP mode (seeded)
     - Required: identical difficulty/effects across clients
  ------------------------ */

  function makeSeed() {
    // 32-bit seed
    return ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
  }

  function hash32(str) {
    // FNV-1a 32-bit
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rngFrom(seed, salt) {
    return mulberry32(hash32(`${seed}:${salt}`));
  }

  function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalizeDifficultySetting(input) {
    const raw = (input && typeof input === "object") ? input : { level: input };
    const level0 = String(raw.level || raw.name || raw.key || raw.difficulty || "normal").toLowerCase();
    const level = DIFF[level0] ? level0 : "normal";
    const base = DIFF[level] || DIFF.normal;

    // speedMultiplier: >1 => faster (less time)
    const fallbackSpeed =
      level === "easy" ? 0.85 :
      level === "hard" ? 1.20 :
      level === "nightmare" ? 1.35 :
      1.00;

    const speedMultiplier = clamp(Number(raw.speedMultiplier || fallbackSpeed), 0.5, 3);

    const effRaw = (raw.effects && typeof raw.effects === "object") ? raw.effects : {};
    
    // CRITICAL FIX: Firebase rules require BOOLEANS, not numbers!
    // Convert numeric probabilities (0-1) to boolean on/off states
    const effects = {
      blink: typeof effRaw.blink === "boolean" 
        ? effRaw.blink 
        : (typeof effRaw.blink === "number" 
            ? effRaw.blink > 0.5 
            : (base.effects?.blink || 0) > 0.5),
      
      glitch: typeof effRaw.glitch === "boolean" 
        ? effRaw.glitch 
        : (typeof effRaw.glitch === "number" 
            ? effRaw.glitch > 0.5 
            : (base.effects?.glitch || 0) > 0.5),
      
      blur: typeof effRaw.blur === "boolean" 
        ? effRaw.blur 
        : (typeof effRaw.blur === "number" 
            ? effRaw.blur > 0.5 
            : (typeof effRaw.mask === "number" 
                ? effRaw.mask > 0.5 
                : (base.effects?.mask || 0) > 0.5)),
    };

    const seconds = (typeof raw.seconds === "number") ? Math.max(0, Math.round(raw.seconds)) : (base.seconds || 0);
    const revealMs = (typeof raw.revealMs === "number") ? Math.max(0, Math.round(raw.revealMs)) : (base.revealMs || 0);

    const seed = Number.isFinite(Number(raw.seed)) ? (Number(raw.seed) >>> 0) : makeSeed();

    return {
      level,
      speedMultiplier,
      effects,
      seconds,
      revealMs,
      seed,
    };
  }


  function prettyDifficulty(d) {
    const obj = normalizeDifficultySetting(d);
    return pretty(obj.level);
  }

  function effectiveSeconds(difficultyObj) {
    const d = normalizeDifficultySetting(difficultyObj);
    if (!d.seconds) return 0;
    // Faster => less time per question
    const eff = Math.max(2, Math.round(d.seconds / (d.speedMultiplier || 1)));
    return eff;
  }

  function chooseEffectSeeded(difficultyObj, wordId, idx) {
    const d = normalizeDifficultySetting(difficultyObj);
    const r = rngFrom(d.seed, `fx:${wordId}:${idx}`);
    
    // FIX: Effects are now booleans, convert to probabilities for random checks
    // true = 100% chance (1.0), false = 0% chance (0)
    const blinkProb = d.effects?.blink ? 1.0 : 0;
    const glitchProb = d.effects?.glitch ? 1.0 : 0;
    const blurProb = d.effects?.blur ? 1.0 : 0;
    
    return {
      blink: r() < blinkProb,
      glitch: r() < glitchProb,
      blur: r() < blurProb,
    };
  }

  function pickOptionsSeeded(correctText, aLang, pool, optionsCount, seed, wordId, idx) {
    const rng1 = rngFrom(seed, `pool:${wordId}:${idx}`);
    const stablePool = pool.slice().sort((a,b)=>String(a.id||"").localeCompare(String(b.id||"")));
    const shuffledPool = seededShuffle(stablePool, rng1);

    const wrongs = [];
    const seen = new Set([String(correctText || "").toLowerCase()]);

    for (const w of shuffledPool) {
      const cand = String(w[aLang] || "").trim();
      if (!cand) continue;
      const key = cand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      wrongs.push(cand);
      if (wrongs.length >= optionsCount - 1) break;
    }

    while (wrongs.length < optionsCount - 1 && wrongs.length < pool.length) {
      wrongs.push("---");
    }

    const rng2 = rngFrom(seed, `opts:${wordId}:${idx}`);
    return seededShuffle([correctText, ...wrongs], rng2).slice(0, optionsCount);
  }



  /* -----------------------
     4) Audio helpers
  ------------------------ */
  const play = async (el) => {
    try {
      if (!el) return;
      el.currentTime = 0;
      await el.play();
    } catch {}
  };

  window.toggleLofi = async function toggleLofi() {
    if (!lofi) return;
    if (lofi.paused) {
      await play(lofi);
    } else {
      lofi.pause();
    }
  };

  /* -----------------------
     5) Data loading
  ------------------------ */
  function resolveContextOrRedirect() {
    const p = parseParams();
    let { type, name } = p;

    if (!type || !name) {
      const ls = loadContextFromLS();
      if (ls) ({ type, name } = ls);
    }

    // Normalize
    type = String(type || "").trim().toLowerCase();
    name = String(name || "").trim();

    const okType = type === "unitwords" || type === "listeningwords";
    if (!okType || !name) {
      // fallback to units menu
      location.href = "/vocabularies/units-menu.html";
      return null;
    }

    saveContextToLS(type, name);
    state.type = type;
    state.name = name;
    return { type, name };
  }

  async function loadVocabFromFirebase(type, name) {
    const { db, ref, get } = fb;
    const snap = await get(ref(db, `vocabularies/${type}/${name}`));
    if (!snap.exists()) return [];

    const raw = snap.val() || {};
    const items = Object.entries(raw)
      .map(([id, v]) => ({
        id: String(id),
        eng: (v && v.eng) ? String(v.eng) : "",
        uzb: (v && v.uzb) ? String(v.uzb) : "",
        rus: (v && v.rus) ? String(v.rus) : "",
      }))
      .filter((x) => x.eng || x.uzb || x.rus);

    // stable sort by numeric id if possible
    items.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return items;
  }

  /* -----------------------
     6) UI screens
  ------------------------ */
  function renderHomeScreen() {
    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    app.innerHTML = `
      <div class="top-bar">
        <div class="menu-container">
          <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-haspopup="menu" aria-expanded="false">${I("menu")}<span>Menu</span></button>
          <div class="menu-dropdown" id="menuDropdown">
            <div class="menu-item" onclick="location.href='/pages/study_materials/study_materials.html'">${I("home")}Home</div>
            <div class="menu-divider"></div>
            <div class="menu-item" onclick="showHelp()">${I("help-circle")}Help</div>
          </div>
        </div>
      </div>

      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">${I("book-open")} ${state.vocab.length} words</div>
        </div>

        <h2 style="margin:8px 0 0 0;color:#fff;">Vocabulary Trainer</h2>
        <p class="ev-sub">Solo mode saves your progress. Group mode is online: create/join a room with students in the same module.</p>

        <div class="ev-roomhub">
          <div class="ev-roomhub-head">
            <div class="ev-pill">${I("swords")} Live rooms</div>
            <button class="ev-btn" type="button" id="arenaBtn" style="padding:10px 12px;opacity:.95;font-size:13px;">${I("users")} Open Arena</button>
          </div>
          <div id="roomsList" class="ev-roomlist">
            <div class="ev-mini ev-muted">${I("loader")} Loading rooms…</div>
          </div>
          <div class="ev-mini ev-muted" style="margin-top:8px">${I("info")} Only rooms for <b>${pretty(state.name)}</b> show here.</div>
        </div>

        <div class="ev-col">
          <div class="ev-row" style="width:100%;">
            <label class="ev-pill" style="flex:1;min-width:140px;">Difficulty
              <select id="diffSel" class="ev-select" style="margin-top:4px;width:100%;">
                <option value="easy">Easy ⭐</option>
                <option value="normal" selected>Normal ⭐⭐</option>
                <option value="hard">Hard ⭐⭐⭐</option>
                <option value="nightmare">Nightmare 💀</option>
              </select>
            </label>

            <label class="ev-pill" style="flex:1;min-width:140px;">Direction
              <select id="dirSel" class="ev-select" style="margin-top:4px;width:100%;">
                <option value="eng->uzb" selected>ENG → UZB</option>
                <option value="eng->rus">ENG → RUS</option>
                <option value="uzb->eng">UZB → ENG</option>
                <option value="rus->eng">RUS → ENG</option>
                <option value="mixed">Mixed 🔀</option>
              </select>
            </label>

            <label class="ev-pill" style="flex:1;min-width:100px;">Questions
              <select id="countSel" class="ev-select" style="margin-top:4px;width:100%;">
                ${[10,15,20,30,50].map((n) => `<option value="${n}" ${n===15?"selected":""}>${n}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="ev-row" style="width:100%;">
            <button class="ev-btn" type="button" id="soloBtn" style="flex:1;">${I("user")} Solo Mode</button>
            <button class="ev-btn" type="button" id="groupBtn" style="flex:1;">${I("users")} Group Mode</button>
          </div>
          
          <button class="ev-btn" type="button" id="backBtn" style="opacity:.9;width:100%;">${I("arrow-left")} Back to Units</button>

          <div class="ev-note" style="margin-top:8px;">
            ${I("lightbulb")} <b>Pro tip:</b> In Hard/Nightmare modes, words can blink/glitch/blur. Tap the word to reveal it briefly!
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    const diffSel = $("#diffSel");
    const dirSel = $("#dirSel");
    const countSel = $("#countSel");

    diffSel.value = state.settings.difficulty;
    dirSel.value = state.settings.direction;
    countSel.value = String(state.settings.count);

    diffSel.addEventListener("change", () => (state.settings.difficulty = diffSel.value));
    dirSel.addEventListener("change", () => (state.settings.direction = dirSel.value));
    countSel.addEventListener("change", () => (state.settings.count = clamp(Number(countSel.value) || 15, 5, 200)));

    $("#soloBtn").addEventListener("click", async () => {
      await play(sndClick);
      startSoloFlow();
    });

    $("#groupBtn").addEventListener("click", async () => {
      await play(sndClick);
      openGroupArena();
    });

    const arenaBtn = $("#arenaBtn");
    if (arenaBtn) {
      arenaBtn.addEventListener("click", async () => {
        await play(sndClick);
        openGroupArena();
      });
    }

    $("#backBtn").addEventListener("click", () => {
      location.href = state.type === "unitwords" ? "/vocabularies/units-menu.html" : "/vocabularies/listenings-menu.html";
    });

    // Live rooms preview (top of page)
    startRoomsTicker({ mountId: "roomsList", limit: 3 });
  }

  function renderLoading(msg = "Loading…") {
    app.innerHTML = `
      <div class="top-bar">
        
      </div>
      <div class="ev-card">
        <h3 class="ev-h">${msg}</h3>
        <p class="ev-sub">Please wait…</p>
      </div>
    `;

    refreshIcons();
  }

  function renderError(msg) {
    app.innerHTML = `
      <div class="top-bar">
        
      </div>
      <div class="ev-card">
        <h3 class="ev-h">${I("alert-triangle")} Oops.</h3>
        <p class="ev-sub">${msg}</p>
        <div class="ev-row">
          <button class="ev-btn" type="button" onclick="location.href='/vocabularies/units-menu.html'">${I("arrow-left")} Go to Units</button>
        </div>
      </div>
    `;

    refreshIcons();
  }

  /* -----------------------
     7) SOLO MODE
  ------------------------ */
  function getDirection() {
    const d = state.settings.direction;
    if (d !== "mixed") return d;
    const picks = ["eng->uzb", "eng->rus", "uzb->eng", "rus->eng"];
    return picks[Math.floor(Math.random() * picks.length)];
  }

  function buildQuestion(word, direction) {
    const [qLang, aLang] = direction.split("->");
    const qText = String(word[qLang] || "").trim();
    const aText = String(word[aLang] || "").trim();
    return { qLang, aLang, qText, aText };
  }

  function pickOptions(correctText, aLang, pool, optionsCount = 4) {
    const wrongs = [];
    const seen = new Set([correctText.toLowerCase()]);
    
    // Improved: Shuffle pool first for better randomization
    const shuffledPool = shuffle(pool);
    
    for (const w of shuffledPool) {
      const cand = String(w[aLang] || "").trim();
      if (!cand) continue;
      const key = cand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      wrongs.push(cand);
      if (wrongs.length >= optionsCount - 1) break;
    }
    
    // Improved: If we don't have enough options, add placeholders only as last resort
    while (wrongs.length < optionsCount - 1 && wrongs.length < pool.length) {
      wrongs.push("---");
    }
    
    const opts = shuffle([correctText, ...wrongs]).slice(0, optionsCount);
    return opts;
  }

  function chooseEffect(difficulty) {
    const e = DIFF[difficulty]?.effects || DIFF.normal.effects;
    const r = Math.random();
    const roll = (p) => Math.random() < p;

    return {
      blink: roll(e.blink),
      glitch: roll(e.glitch),
      mask: roll(e.mask),
    };
  }

  async function startSoloFlow() {
    const diff = state.settings.difficulty;
    const cfg = DIFF[diff] || DIFF.normal;

    const words = shuffle(state.vocab);
    const total = clamp(state.settings.count, 5, words.length || 5);
    const deck = words.slice(0, total);

    state.session = {
      mode: "solo",
      type: state.type,
      name: state.name,
      difficulty: diff,
      startedAtMs: Date.now(),
      total,
      index: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      timesMs: [],
      correctWordIds: new Set(),
    };

    await runSoloQuestion(deck, cfg);
  }

  async function runSoloQuestion(deck, cfg) {
    const s = state.session;
    if (!s) return;

    if (s.index >= s.total) {
      await finishSolo();
      return;
    }

    const word = deck[s.index];
    const direction = getDirection();
    const q = buildQuestion(word, direction);

    // If we can't build a valid question, skip
    if (!q.qText || !q.aText) {
      s.index++;
      await runSoloQuestion(deck, cfg);
      return;
    }

    const opts = pickOptions(q.aText, q.aLang, state.vocab, state.settings.options);
    if (opts.length < 2) {
      s.index++;
      await runSoloQuestion(deck, cfg);
      return;
    }

    injectStyles();

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const progressPct = Math.round((s.index / s.total) * 100);

    app.innerHTML = `
      <div class="top-bar">
        
        <div class="menu-container">
          <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-haspopup="menu" aria-expanded="false">${I("menu")}<span>Menu</span></button>
          <div class="menu-dropdown" id="menuDropdown">
            <div class="menu-item" onclick="if(confirm('Quit current game?')) renderHomeScreen()">${I("home")}Home</div>
            <div class="menu-divider"></div>
            <div class="menu-item" onclick="showHelp()">${I("help-circle")}Help</div>
          </div>
        </div>
      </div>

      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${pretty(s.difficulty)}</span>
          </div>
          <button class="ev-btn" type="button" id="quitBtn" style="padding:10px 12px;opacity:.9;font-size:13px;">${I("x")} Quit</button>
        </div>

        <div class="ev-row" style="justify-content:space-between">
          <div class="ev-pill">${I("list-ordered")} ${s.index + 1} / ${s.total}</div>
          <div class="ev-pill ev-timer" id="timerPill">${I("clock")} <span id="timerVal"></span></div>
        </div>

        <div class="ev-progress" aria-label="Progress">
          <div id="bar" style="width:${progressPct}%"></div>
        </div>

        <div class="ev-word" id="questionWord"></div>
        <div class="ev-note"><span class="ev-kbd">${pretty(q.qLang)}</span> → choose <span class="ev-kbd">${pretty(q.aLang)}</span></div>

        <div class="ev-answers" id="answers"></div>

        <div class="ev-row" style="justify-content:space-between;margin-top:12px">
          <div class="ev-pill">${I("check-circle")} ${s.correct}</div>
          <div class="ev-pill">${I("x-circle")} ${s.wrong}</div>
          <div class="ev-pill">${I("flame")} Streak ${s.streak}</div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#quitBtn").addEventListener("click", () => renderHomeScreen());

    const qEl = $("#questionWord");
    qEl.textContent = q.qText;
    qEl.dataset.text = q.qText;

    // Apply difficulty effects
    const fx = chooseEffect(s.difficulty);
    let revealTimeout = null;

    const applyMask = () => {
      if (!fx.mask) return;
      qEl.classList.add("masked");
      const reveal = async () => {
        qEl.classList.remove("masked");
        clearTimeout(revealTimeout);
        revealTimeout = setTimeout(() => qEl.classList.add("masked"), cfg.revealMs || 800);
      };
      qEl.addEventListener("click", reveal, { once: false });
      // first reveal after 250ms is off; user must tap to reveal.
    };

    if (fx.blink) qEl.classList.add("blink");
    if (fx.glitch) qEl.classList.add("glitch");
    applyMask();

    // Timer
    let remaining = cfg.seconds || 0;
    let timerId = null;
    const timerPill = $("#timerPill");
    const timerVal = $("#timerVal");
    const startPerf = performance.now();

    const updateTimerUI = () => {
      if (!timerVal) return;
      timerVal.textContent = (!remaining) ? "∞" : `${remaining}s`;
    };
    updateTimerUI();

    let locked = false;
    const lock = () => (locked = true);

    const timeUp = async () => {
      if (locked) return;
      lock();
      await play(sndWrong);
      await showAnswer(null, q.aText, opts, /*correctIdx*/ -1, /*chosen*/ null, /*timeUp*/ true);
      s.wrong++;
      s.streak = 0;
      s.timesMs.push(Math.round(performance.now() - startPerf));
      s.index++;
      await sleep(650);
      await runSoloQuestion(deck, cfg);
    };

    if (remaining > 0) {
      timerId = setInterval(() => {
        remaining--;
        updateTimerUI();
        if (remaining <= 0) {
          clearInterval(timerId);
          timeUp();
        }
      }, 1000);
    } else {
      if (timerVal) timerVal.textContent = "∞";
    }

    // Answers
    const answersEl = $("#answers");
    const correctIdx = opts.findIndex((t) => t === q.aText);

    for (const opt of opts) {
      const btn = document.createElement("button");
      btn.className = "ev-answer";
      btn.textContent = opt;
      btn.addEventListener("click", async () => {
        if (locked) return;
        lock();
        if (timerId) clearInterval(timerId);

        const ms = Math.round(performance.now() - startPerf);
        s.timesMs.push(ms);

        const isCorrect = opt === q.aText;
        if (isCorrect) {
          await play(sndCorrect);
          s.correct++;
          s.streak++;
          s.bestStreak = Math.max(s.bestStreak, s.streak);
          s.correctWordIds.add(word.id);
        } else {
          await play(sndWrong);
          s.wrong++;
          s.streak = 0;
        }

        await showAnswer(opt, q.aText, opts, correctIdx, opt, false);

        await sleep(650);
        s.index++;
        await runSoloQuestion(deck, cfg);
      });
      answersEl.appendChild(btn);
    }
  }

  async function showAnswer(opt, correct, opts, correctIdx, chosen, timeUp) {
    const buttons = $$(".ev-answer", app);

    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("good");
      if (!timeUp && chosen && b.textContent === chosen && chosen !== correct) b.classList.add("bad");
    });
  }

  async function finishSolo() {
    const s = state.session;
    if (!s) return;

    const endedAtMs = Date.now();
    const total = s.total || 1;
    const percent = Math.round((s.correct / total) * 100);
    const avgMs = s.timesMs.length ? Math.round(s.timesMs.reduce((a, b) => a + b, 0) / s.timesMs.length) : 0;


    // If this is a listening module and the student completed it, unlock access.
    // (hasaccess is never downgraded once true)
    if (state.type === "listeningwords") {
      await ensureListeningAccessNode();
      if (percent >= COMPLETE_THRESHOLD) {
        await setListeningAccessTrue({ endedAtMs, percent });
      }
    }

    // Write stats & marks (best-effort; don’t block UX on failure)
    try {
      await saveSoloStats({
        percent,
        avgMs,
        endedAtMs,
      });
    } catch (e) {
      console.warn("Stats save failed:", e);
    }

    try {
      await updateVocabProgress({
        percent,
        avgMs,
        endedAtMs,
      });
    } catch (e) {
      console.warn("Progress save failed:", e);
    }

    try {
      await markCorrectWords();
    } catch (e) {
      console.warn("Mark words failed:", e);
    }

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const backLabel = state.type === "unitwords"
      ? `Back to Unit: ${pretty(state.name)}`
      : `Back to Listening: ${pretty(state.name)}`;

    app.innerHTML = `
      <div class="top-bar">
        <button class="lofi-toggle" type="button" id="finishCornerBtn">${I("arrow-left")} ${backLabel}</button>
      </div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">Difficulty: ${pretty(s.difficulty)}</div>
        </div>

        <h3 class="ev-h">Results</h3>
        <p class="ev-sub">Test finished. Press the button below to go back.</p>

        <div class="ev-row" style="justify-content:space-between">
          <div class="ev-pill">${I("check-circle")} Correct: <b>${s.correct}</b></div>
          <div class="ev-pill">${I("x-circle")} Wrong: <b>${s.wrong}</b></div>
          <div class="ev-pill">${I("target")} Score: <b>${percent}%</b></div>
        </div>

        <div class="ev-row" style="justify-content:space-between;margin-top:10px">
          <div class="ev-pill">${I("zap")} Avg time: <b>${avgMs}ms</b></div>
          <div class="ev-pill">${I("flame")} Best streak: <b>${s.bestStreak}</b></div>
        </div>

        <div class="ev-row" style="margin-top:14px">
          <button class="ev-btn" type="button" id="finishBtn" style="width:100%">${I("arrow-left")} ${backLabel}</button>
        </div>
      </div>
    `;

    refreshIcons();

    const goBack = () => {
      location.href = providerUrl();
    };
    $("#finishBtn").addEventListener("click", goBack);
    $("#finishCornerBtn").addEventListener("click", goBack);
  }

  async function saveSoloStats(extra) {
    const s = state.session;
    if (!s || !state.uid) return;

    const { db, ref, set, push, runTransaction } = fb;

    const endedAtMs = extra.endedAtMs || Date.now();
    const total = s.total || 1;
    const percent = Number(extra.percent) || Math.round((s.correct / total) * 100);

    const base = `students/${state.uid}/stats/vocabTests/${state.type}/${safeKey(state.name)}`;

    // 1) history (append)
    const histRef = push(ref(db, `${base}/history`));
    await set(histRef, {
      mode: "solo",
      difficulty: s.difficulty,
      startedAtMs: s.startedAtMs,
      endedAtMs,
      total: s.total,
      correct: s.correct,
      wrong: s.wrong,
      percent,
      avgMs: Number(extra.avgMs) || 0,
      bestStreak: s.bestStreak,
    });

    // 2) summary (transaction)
    await runTransaction(ref(db, `${base}/summary`), (curr) => {
      const c = curr && typeof curr === "object" ? curr : {};
      const attempts = Number(c.attempts || 0) + 1;
      const totalCorrect = Number(c.totalCorrect || 0) + Number(s.correct || 0);
      const totalWrong = Number(c.totalWrong || 0) + Number(s.wrong || 0);
      return {
        attempts,
        totalCorrect,
        totalWrong,
        lastAttemptAtMs: endedAtMs,
        lastPercent: percent,
        lastDifficulty: s.difficulty,
      };
    });

    // 3) best (transaction)
    await runTransaction(ref(db, `${base}/best`), (curr) => {
      const c = curr && typeof curr === "object" ? curr : null;
      const bestPercent = Number(c?.bestPercent || 0);
      if (percent > bestPercent) {
        return {
          bestPercent: percent,
          bestCorrect: s.correct,
          bestTotal: s.total,
          bestAtMs: endedAtMs,
          bestDifficulty: s.difficulty,
        };
      }
      return c || {
        bestPercent,
      };
    });
  }

  
  const COMPLETE_THRESHOLD = 80;

  async function ensureListeningAccessNode() {
    try {
      if (!state.uid) return;
      if (state.type !== "listeningwords") return;

      const { db, ref, runTransaction } = fb;
      const moduleKey = safeKey(state.name);
      const path = `students/${state.uid}/vocabularies/listeningwords/${moduleKey}`;
      const now = Date.now();

      await runTransaction(ref(db, path), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const hasaccess = c.hasaccess === true; // never downgrade true -> false
        return {
          ...c,
          name: c.name || state.name,
          hasaccess,
          firstOpenedAtMs: Number(c.firstOpenedAtMs || now),
          lastOpenedAtMs: now,
        };
      });
    } catch (e) {
      console.warn("ensureListeningAccessNode failed:", e);
    }
  }

  async function setListeningAccessTrue({ endedAtMs, percent }) {
    try {
      if (!state.uid) return;
      if (state.type !== "listeningwords") return;

      const { db, ref, runTransaction } = fb;
      const moduleKey = safeKey(state.name);
      const path = `students/${state.uid}/vocabularies/listeningwords/${moduleKey}`;

      await runTransaction(ref(db, path), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const wasTrue = c.hasaccess === true;

        return {
          ...c,
          name: c.name || state.name,
          hasaccess: true,
          unlockedAtMs: Number(c.unlockedAtMs || endedAtMs),
          lastAttemptAtMs: endedAtMs,
          lastPercent: Number(percent || 0),
          completedAtMs: wasTrue ? Number(c.completedAtMs || endedAtMs) : endedAtMs,
        };
      });
    } catch (e) {
      console.warn("setListeningAccessTrue failed:", e);
    }
  }

  async function updateVocabProgress(extra) {
    const s = state.session;
    if (!s || !state.uid) return;

    const { db, ref, runTransaction } = fb;

    const endedAtMs = Number(extra?.endedAtMs || 0) || Date.now();
    const total = s.total || 1;
    const percent = Number(extra?.percent || 0) || Math.round((s.correct / total) * 100);
    const avgMs = Number(extra?.avgMs || 0) || 0;

    // We keep LEGACY bucket names for backwards compatibility (your export already has them),
    // but ALSO write to clean bucket names so new UIs can read them.
    // - legacy:  unitswords / listeningswords
    // - clean:   unitwords / listeningwords
    const bucketClean = state.type; // unitwords | listeningwords
    const bucketLegacy = state.type === "unitwords" ? "unitswords" : "listeningswords";
    const buckets = Array.from(new Set([bucketClean, bucketLegacy]));

    const moduleKey = safeKey(state.name);

    async function writeProgressTo(bucketName, trackLegacyCompletion) {
      const progPath = `students/${state.uid}/progress/vocabularies/${bucketName}/${moduleKey}`;

      let becameCompleted = false;

      const txRes = await runTransaction(ref(db, progPath), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const attempts = Number(c.attempts || 0) + 1;

        const prevBest = Number(c.bestPercent || 0);
        const bestPercent = percent > prevBest ? percent : prevBest;

        const completedNow = percent >= COMPLETE_THRESHOLD;
        const wasCompleted = !!c.completed;
        const completed = wasCompleted || completedNow;

        if (trackLegacyCompletion && !wasCompleted && completedNow) becameCompleted = true;

        const firstAttemptAtMs = Number(c.firstAttemptAtMs || s.startedAtMs || endedAtMs);

        return {
          name: state.name,
          type: state.type,
          bucket: bucketName,
          completed,
          attempts,
          bestPercent,
          lastPercent: percent,
          lastDifficulty: s.difficulty,

          // last run details
          lastTotal: s.total,
          lastCorrect: s.correct,
          lastWrong: s.wrong,
          lastAvgMs: avgMs,

          // timestamps
          firstAttemptAtMs,
          firstAttemptAt: c.firstAttemptAt || new Date(firstAttemptAtMs).toISOString(),
          lastAttemptAtMs: endedAtMs,
          lastAttemptAt: new Date(endedAtMs).toISOString(),

          completedAtMs: (c.completedAtMs ?? null) || (completedNow ? endedAtMs : null),
          completedAt: (c.completedAt ?? null) || (completedNow ? new Date(endedAtMs).toISOString() : null),
        };
      });

      return { txRes, becameCompleted };
    }

    // Write progress to both buckets
    let legacyRes = null;
    for (const b of buckets) {
      const isLegacy = b === bucketLegacy;
      const res = await writeProgressTo(b, isLegacy);
      if (isLegacy) legacyRes = res;
    }

    // Increment your "+1 vocabularies" counter ONLY when a module becomes completed
    // for the first time in the LEGACY bucket (so it doesn't double-count).
    if (legacyRes?.becameCompleted && legacyRes?.txRes?.committed) {
      const countsBase = `students/${state.uid}/stats/vocabCounts`;
      await Promise.allSettled([
        runTransaction(ref(db, `${countsBase}/totalCompleted`), (n) => Number(n || 0) + 1),
        runTransaction(ref(db, `${countsBase}/${bucketLegacy}/completed`), (n) => Number(n || 0) + 1),
      ]);
    }
  }


async function markCorrectWords() {
    const s = state.session;
    if (!s || !state.uid) return;
    if (!s.correctWordIds || s.correctWordIds.size === 0) return;

    const { db, ref, update } = fb;

    const now = Date.now();
    const batch = {};
    for (const id of s.correctWordIds) {
      const w = state.vocab.find((x) => String(x.id) === String(id));
      if (!w || !w.eng) continue;

      // Must satisfy your validate rule: {text, unit, completed, timestamp}
      const wordKey = safeKey(`${state.type}_${state.name}_${id}`);
      batch[wordKey] = {
        text: String(w.eng).slice(0, 80),
        unit: String(`${state.type}/${state.name}`).slice(0, 40),
        completed: true,
        timestamp: now,
      };
    }

    if (Object.keys(batch).length) {
      await update(ref(db, `students/${state.uid}/marks/words`), batch);
    }
  }

  /* -----------------------
     8) GROUP MODE (online rooms) — RULES-COMPLIANT
     Rooms live at:
       vocabularies/{type}/{name}/pendingRooms/{roomId}

     ✅ This implementation matches your RTDB rules:
       - Room root is written ONLY by host.
       - Room root schema on create includes: createdAtMs, createdBy, hostUid, status, capacityOfPlayers, slots.s0
       - Join/leave happens ONLY via slots/s1..s5 (each player can only write their own slot while status=waiting)
       - status values are ONLY: waiting | started | finished | cancelled
       - results/$uid is written ONCE per player, only when status is started/finished, and matches validate.
  ------------------------ */

  const ROOM_TTL_MS = 20 * 60 * 1000; // hide very old waiting rooms (client-side)

  state.myProfile = null;   // {name, username}
  state._roomsUnsub = null; // live list unsub
  state._roomUnsub = null;  // active room unsub
  state.currentRoomId = null;
  state.currentRoom = null; // latest snapshot of the room
  state.roomGame = null;    // local match state

  // Visual names without changing rules:
  // Rules allow reading students/usernames (username -> uid). We reverse it to uid -> username for display.
  state.uidToUsername = null; // { [uid]: username }
  state._uidToUsernamePromise = null;

  function roomsBasePath() {
    return `vocabularies/${state.type}/${state.name}/pendingRooms`;
  }

  const shortUid = (uid) => {
    const s = String(uid || "");
    if (s.length <= 10) return s;
    return `${s.slice(0, 6)}…${s.slice(-4)}`;
  };

  async function ensureUidToUsername() {
    if (state.uidToUsername) return state.uidToUsername;
    if (state._uidToUsernamePromise) return state._uidToUsernamePromise;

    const { db, ref, get } = fb;
    state._uidToUsernamePromise = (async () => {
      try {
        const snapA = await get(ref(db, "students/usernames"));
        const snapB = await get(ref(db, "usernames"));
        const mapA = snapA.exists() ? snapA.val() : {};
        const mapB = snapB.exists() ? snapB.val() : {};
        // Merge username->uid maps (prefer students/usernames if duplicates)
        const rev = {};
        const addMap = (m) => {
          if (!m || typeof m !== "object") return;
          for (const [uname, uid] of Object.entries(m)) {
            if (typeof uid === "string" && uid && typeof uname === "string" && uname) {
              // Don't overwrite an existing username for the uid unless it's empty
              if (!rev[uid]) rev[uid] = uname;
            }
          }
        };
        addMap(mapA);
        addMap(mapB);
        state.uidToUsername = rev;
      } catch {
        state.uidToUsername = {};
      } finally {
        state._uidToUsernamePromise = null;
      }

      // Re-render current screen with nicknames (purely visual)
      try {
        if (state.currentRoomId && state.currentRoom) {
          const st = String(state.currentRoom.status || "waiting");
          if (st === "waiting") renderRoomLobby(state.currentRoomId, state.currentRoom);
          else if (st === "finished") renderRoomResults(state.currentRoomId, state.currentRoom);
          else if (st === "started" && state.roomGame) renderRoomGameScreen();
        }
      } catch {}

      return state.uidToUsername;
    })();

    return state._uidToUsernamePromise;
  }

  function displayUser(uid) {
    if (!uid) return "";
    if (uid === state.uid) return "You";
    const uname = state.uidToUsername && state.uidToUsername[uid];
    if (uname) return `@${uname}`;
    return "Guest";
  }

  function getSlots(room) {
    const slots = room?.slots;
    if (!slots || typeof slots !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(slots)) {
      if (typeof v === "string" && v) out[k] = String(v);
    }
    return out;
  }

  function slotsInCapacity(cap) {
    const keys = [];
    for (let i = 0; i < cap; i++) keys.push(`s${i}`);
    return keys;
  }

  function countFromSlots(slots) {
    return Object.values(slots || {}).filter(Boolean).length;
  }

  function findMySlotKey(room) {
    const slots = getSlots(room);
    for (const [k, v] of Object.entries(slots)) {
      if (v === state.uid) return k;
    }
    return null;
  }

  function stopRoomsTicker() {
    try { if (typeof state._roomsUnsub === "function") state._roomsUnsub(); } catch {}
    state._roomsUnsub = null;
  }

  function stopRoomWatcher() {
    try { if (typeof state._roomUnsub === "function") state._roomUnsub(); } catch {}
    state._roomUnsub = null;

    // Stop presence/edge-case timers for group mode
    stopPresence();
    try { if (state._opponentLeftTimer) clearTimeout(state._opponentLeftTimer); } catch {}
    state._opponentLeftTimer = null;

    state.currentRoomId = null;
    state.currentRoom = null;
    state.roomGame = null;
  }


  async function ensureMyProfileLoaded() {
    if (state.myProfile) return state.myProfile;
    const { db, ref, get } = fb;
    try {
      const snap = await get(ref(db, `students/${state.uid}/profile`));
      const p = snap.exists() ? snap.val() : {};
      const name =
        (p && (p.username || p.name || [p.first_name, p.last_name].filter(Boolean).join(" "))) ||
        state.user?.displayName ||
        (state.user?.email ? state.user.email.split("@")[0] : "Player");
      state.myProfile = {
        name: String(name || "Player").slice(0, 40),
        username: p?.username ? String(p.username).slice(0, 30) : "",
      };
    } catch {
      state.myProfile = { name: "Player", username: "" };
    }
    return state.myProfile;
  }

  function inviteLink(roomId) {
    const u = new URL(location.href);
    u.searchParams.set("type", state.type);
    u.searchParams.set("name", state.name);
    u.searchParams.set("mode", "group");
    u.searchParams.set("room", roomId);
    return u.toString();
  }

  function normalizeRooms(raw) {
    const out = [];
    const now = Date.now();
    if (!raw || typeof raw !== "object") return out;

    for (const [roomId, r] of Object.entries(raw)) {
      if (!r || typeof r !== "object") continue;

      const status = String(r.status || "waiting");
      if (status !== "waiting") continue;

      const createdAtMs = Number(r.createdAtMs || 0) || 0;
      if (createdAtMs && now - createdAtMs > ROOM_TTL_MS) continue;

      const cap = clamp(Number(r.capacityOfPlayers || 2) || 2, 2, 6);
      const slots = getSlots(r);
      const currentCount = countFromSlots(slots);
      const available = Math.max(0, cap - currentCount);

      out.push({
        roomId,
        hostUid: String(r.hostUid || ""),
        hostName: String(r.hostName || ""),
        createdAtMs,
        cap,
        currentCount,
        available,
        settings: r.settings || {},
        raw: r,
      });
    }

    // newest first
    out.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return out;
  }

  function renderRoomsInto(mountId, rooms, { limit = 6 } = {}) {
    const el = document.getElementById(mountId);
    if (!el) return;

    if (!rooms.length) {
      el.innerHTML = `<div class="ev-mini ev-muted">${I("sparkles")} No live rooms yet. Create one and invite your classmates.</div>`;
      refreshIcons();
      return;
    }

    const slice = rooms.slice(0, limit);
    el.innerHTML = slice
      .map((r) => {
        const mine = r.hostUid === state.uid;
        const canJoin = r.available > 0 && !mine;
        const s = r.settings || {};
        return `
          <div class="ev-roomcard">
            <div class="ev-roomcard-top">
              <div class="ev-roommeta">
                <span class="ev-badge">${I("crown")} ${mine ? "Your room" : (r.hostName || "Host")}</span>
                <span class="ev-badge">${I("users")} ${r.currentCount}/${r.cap}</span>
                <span class="ev-badge">${I("activity")} ${pretty(s.difficulty || state.settings.difficulty)}</span>
              </div>
              <div class="ev-roommeta">
                <span class="ev-badge ev-code">${r.roomId}</span>
                <button class="ev-btn" type="button" data-join="${r.roomId}" ${canJoin ? "" : "disabled"} style="padding:10px 12px;font-size:13px;">
                  ${I(canJoin ? "log-in" : "lock")} ${canJoin ? "Join" : "Full"}
                </button>
              </div>
            </div>
            <div class="ev-mini ev-muted" style="margin-top:8px">
              ${I("arrow-right-left")} ${pretty(s.direction || state.settings.direction)} ·
              ${I("list-ordered")} ${Number(s.count || state.settings.count)} Q ·
              ${I("layers")} ${Number(s.options || state.settings.options)} choices
            </div>
          </div>
        `;
      })
      .join("");

    refreshIcons();

    $$("button[data-join]", el).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const roomId = btn.getAttribute("data-join");
        if (!roomId) return;
        await play(sndClick);
        openRoom(roomId, { autoJoin: true });
      });
    });
  }

  /* -----------------------
     7.5) GROUP room helpers: presence + finish lock (race-safe)
  ------------------------ */

  function myPresencePath(roomId) {
    return `${roomsBasePath()}/${roomId}/presence/${state.uid}`;
  }

  async function startPresence(roomId) {
    if (!fb || !roomId) return;
    // Already running for this room
    if (state._presenceRoomId === roomId && state._presenceInterval) return;

    stopPresence();

    state._presenceRoomId = roomId;

    const { db, ref, set, onDisconnect } = fb;
    const pRef = ref(db, myPresencePath(roomId));

    // initial write
    try {
      await set(pRef, { connected: true, lastSeenAtMs: Date.now() });
      try {
        onDisconnect(pRef).set({
          connected: false,
          lastSeenAtMs: Date.now(),
          disconnectedAt: fb.serverTimestamp(),
        });
      } catch {}
    } catch (e) {
      console.warn("presence write failed:", e);
    }

    state._presenceInterval = setInterval(async () => {
      try {
        await set(pRef, { connected: true, lastSeenAtMs: Date.now() });
      } catch {}
    }, 6000);
  }

  function stopPresence() {
    try { if (state._presenceInterval) clearInterval(state._presenceInterval); } catch {}
    state._presenceInterval = null;
    state._presenceRoomId = null;
  }

  function getRoomUids(room) {
    const cap = clamp(Number(room?.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room || {});
    return slotsInCapacity(cap).map((k) => slots[k]).filter(Boolean);
  }

  function getFinishInfo(room) {
    const g = room?.game || {};
    const finish = (g && typeof g === "object" && g.finish && typeof g.finish === "object") ? g.finish : null;
    if (finish && (finish.winnerUid || finish.finishedAtMs)) return finish;
    // compatibility: legacy root fields
    if (room?.winnerUid || room?.finishedAtMs) {
      return {
        winnerUid: room?.winnerUid || "",
        finishedAtMs: Number(room?.finishedAtMs || 0) || 0,
        reason: "legacy",
      };
    }
    return null;
  }

    async function attemptFinishLock(roomId, { triggerUid, winnerUid, reason } = {}) {
    // ✅ Atomic, race-safe lock on rooms/{roomId}/game
    // IMPORTANT:
    // - When someone completes ALL questions, we end the match (stop everyone),
    //   BUT the winner is decided by who found more (correct/score), not "first submit".
    const { db, ref, runTransaction, update } = fb;

    const now = Date.now();
    const tUid = String(triggerUid || state.uid || "");
    const wUid = String(winnerUid || ""); // only set for hard outcomes (forfeit / opponent_left etc.)
    const r = String(reason || (wUid ? "forfeit" : "completed_all"));

    const gameRef = ref(db, `${roomsBasePath()}/${roomId}/game`);

    const tx = await runTransaction(gameRef, (g) => {
      const curr = (g && typeof g === "object") ? g : {};
      const st = String(curr.status || "playing");

      // Abort if already finished
      if (st === "finished" || (curr.finish && curr.finish.finishedAtMs)) return;

      // Only allow transition from "playing"
      if (st !== "playing") return curr;

      const finish = {
        finishedAtMs: now,
        reason: r,
        triggerUid: tUid,
      };

      // Only include winnerUid when it's truly known immediately (e.g., forfeit)
      if (wUid) finish.winnerUid = wUid;

      return {
        ...curr,
        status: "finished",
        finish,
      };
    });

    // Best-effort legacy/root updates (not relied on for correctness)
    try {
      const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
      const patch = {
        status: "finished",
        updatedAtMs: now,
        finishedAtMs: now,
      };
      // Only set root winnerUid when it's truly known immediately
      if (wUid) patch.winnerUid = wUid;
      await update(roomRef, patch);
    } catch {}

    return !!tx?.committed;
  }

  function updateOpponentLeftTimer(roomId, room) {
    // Policy (B): auto-finish after timeout when <2 connected players remain
    if (!roomId || !room) return;
    const status = String(room.status || "");
    const gStatus = String(room?.game?.status || "");
    if (status !== "started" || gStatus !== "playing") {
      // no countdown outside active game
      if (state._opponentLeftTimer) {
        clearTimeout(state._opponentLeftTimer);
        state._opponentLeftTimer = null;
      }
      return;
    }

    const uids = getRoomUids(room);
    const presence = (room.presence && typeof room.presence === "object") ? room.presence : {};
    const now = Date.now();

    const connected = uids.filter((uid) => {
      const p = presence[uid];
      if (!p || typeof p !== "object") return false;
      if (p.connected !== true) return false;
      const t = Number(p.lastSeenAtMs || 0);
      if (!t) return false;
      return (now - t) <= 15000; // heartbeat window
    });

    if (connected.length >= 2) {
      if (state._opponentLeftTimer) {
        clearTimeout(state._opponentLeftTimer);
        state._opponentLeftTimer = null;
      }
      return;
    }

    if (state._opponentLeftTimer) return; // already counting

    state._opponentLeftTimer = setTimeout(async () => {
      state._opponentLeftTimer = null;

      const latest = state.currentRoom;
      if (!latest) return;

      const status2 = String(latest.status || "");
      const gStatus2 = String(latest?.game?.status || "");
      if (status2 === "finished" || gStatus2 === "finished") return;

      const uids2 = getRoomUids(latest);
      const pres2 = (latest.presence && typeof latest.presence === "object") ? latest.presence : {};
      const now2 = Date.now();
      const connected2 = uids2.filter((uid) => {
        const p = pres2[uid];
        if (!p || typeof p !== "object") return false;
        if (p.connected !== true) return false;
        const t = Number(p.lastSeenAtMs || 0);
        return t && (now2 - t) <= 15000;
      });

      if (connected2.length < 2) {
        try {
          await attemptFinishLock(roomId, { winnerUid: state.uid, reason: "opponent_left" });
        } catch (e) {
          console.warn("opponent_left finish failed:", e);
        }
      }
    }, 15000);
  }



  function startRoomsTicker({ mountId = "roomsList", limit = 3 } = {}) {
    if (!fb || !state.type || !state.name) return;

    stopRoomsTicker();

    const { db, ref, onValue } = fb;
    const base = ref(db, roomsBasePath());
    state._roomsUnsub = onValue(
      base,
      (snap) => {
        const rooms = normalizeRooms(snap.val());
        renderRoomsInto(mountId, rooms, { limit });
      },
      (err) => {
        console.error("rooms ticker:", err);
        const el = document.getElementById(mountId);
        if (el) el.innerHTML = `<div class="ev-mini ev-muted">${I("alert-triangle")} Could not load rooms.</div>`;
        refreshIcons();
      }
    );
  }

  async function createRoom(capacityOfPlayers) {
    const { db, ref, push, set } = fb;
    
    try {
      const profile = await ensureMyProfileLoaded();
      const cap = clamp(Number(capacityOfPlayers || 2) || 2, 2, 6);
      const now = Date.now();

      const baseRef = ref(db, roomsBasePath());
      const roomRef = push(baseRef);
      const roomId = roomRef.key;

      // Difficulty for GROUP must be an object (synced + deterministic)
      const diffObj = normalizeDifficultySetting(state.settings.difficulty);
      diffObj.seed = makeSeed(); // fresh seed per room by default

      // ✅ Must match Firebase validation rules:
      // createdAtMs, createdBy, hostUid, status, capacityOfPlayers, slots.s0
      const room = {
        createdAtMs: now,
        createdBy: state.uid,
        hostUid: state.uid,
        status: "waiting",
        capacityOfPlayers: cap,
        slots: { s0: state.uid },

        // extras allowed:
        updatedAtMs: now,
        hostName: profile.username || profile.name,
        settings: {
          difficulty: diffObj,  // Now has BOOLEAN effects!
          direction: state.settings.direction,
          count: clamp(Number(state.settings.count || 15), 5, 50),
          options: clamp(Number(state.settings.options || 4), 2, 6),
        },
      };

      // Debug: Log the data structure being sent
      if (console && console.log) {
        console.log("Creating room with data:", {
          roomId,
          effects: room.settings.difficulty.effects,  // Check if booleans
          fullRoom: room
        });
      }

      await set(roomRef, room);
      return roomId;
      
    } catch (error) {
      console.error("Room creation failed:", error);
      
      // Provide helpful error messages
      if (error.code === "PERMISSION_DENIED") {
        throw new Error(
          "⚠️ Could not create room: Database permission denied.\n\n" +
          "Possible causes:\n" +
          "• You're not logged in properly\n" +
          "• Your session has expired\n" +
          "• Database validation rules failed\n\n" +
          "Try refreshing the page or logging in again."
        );
      }
      
      throw error;
    }
  }



  async function joinRoom(roomId) {
    const { db, ref, get, set, onDisconnect, remove } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) throw new Error("Room not found.");

    const room = snap.val();
    if (String(room.status || "waiting") !== "waiting") throw new Error("Room already started.");

    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    // Already inside?
    for (const [k, v] of Object.entries(slots)) {
      if (v === state.uid) return { slotKey: k, already: true };
    }

    // Try claim a free slot s1..s{cap-1}
    for (let i = 1; i < cap; i++) {
      const key = `s${i}`;
      const slotRef = ref(db, `${roomsBasePath()}/${roomId}/slots/${key}`);
      try {
        await set(slotRef, state.uid);
        // auto-clean while waiting (if match starts, rules will block removal — that’s okay)
        try { onDisconnect(slotRef).remove(); } catch {}
        return { slotKey: key, already: false };
      } catch (e) {
        // denied or taken -> try next
      }
    }

    throw new Error("Room is full.");
  }

  async function leaveRoom(roomId) {
    const { db, ref, get, remove, set } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;

    const room = snap.val();
    const status = String(room.status || "waiting");

    // If host leaves while waiting -> delete the room (allowed by your rules)
    if (room.hostUid === state.uid && status === "waiting") {
      await set(roomRef, null);
      return;
    }

    // Non-host can only leave while waiting (slot rules enforce this)
    const mySlot = findMySlotKey(room);
    if (!mySlot || mySlot === "s0") return;

    await remove(ref(db, `${roomsBasePath()}/${roomId}/slots/${mySlot}`));
  }

  async function startMatch(roomId) {
    const { db, ref, get, update } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const roomSnap = await get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found.");
    const room = roomSnap.val();

    if (room.hostUid !== state.uid) throw new Error("Only host can start.");
    if (String(room.status || "waiting") !== "waiting") throw new Error("Room already started.");

    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    // Your validate requires s1 exists when status becomes "started"
    if (!slots.s1) throw new Error("Need at least 2 players to start.");

    const settings = room.settings || state.settings;
    const total = clamp(Number(settings.count || 15), 5, 50);

    // Snapshot and LOCK difficulty settings for the match.
    // Source of truth: rooms/{roomId}/settings/difficulty (object). (We also store a copy in game.)
    const diffObj = normalizeDifficultySetting(settings.difficulty || state.settings.difficulty);

    const deck = shuffle(state.vocab)
      .slice(0, Math.min(state.vocab.length, total))
      .map((w) => String(w.id));

    const now = Date.now();

    await update(roomRef, {
      status: "started",
      updatedAtMs: now,
      // lock settings at start (clients hide controls when status !== waiting)
      "settings/difficulty": diffObj,
      game: {
        startedAtMs: now,
        wordIds: deck,
        difficulty: diffObj,                 // object (synced)
        direction: settings.direction || state.settings.direction,
        count: total,
        options: clamp(Number(settings.options || 4), 2, 6),
        status: "playing",                  // "playing" | "finished"
        finish: null,                       // {winnerUid, finishedAtMs, reason}
      },
      // reset legacy finish fields (kept for compatibility with existing UI)
      winnerUid: null,
      finishedAtMs: null,
      ranked: null,
      results: null,
      // presence is transient; don't reset to avoid permission issues
    });
  }


  function openGroupArena() {
    injectStyles();
    // Load uid->username map (visual only)
    ensureUidToUsername().catch(() => {});
    stopRoomWatcher(); // if you were inside a room
    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <button class="ev-btn" type="button" id="backHomeBtn" style="padding:8px 10px;opacity:.9">${I("arrow-left")} Back</button>
        </div>

        <h3 class="ev-h">${I("users")} Group Arena</h3>
        <p class="ev-sub">Create a room or join someone in <b>${pretty(state.name)}</b>.</p>

        <div class="ev-split">
          <div class="ev-panel">
            <div class="ev-row" style="justify-content:space-between;align-items:center">
              <div class="ev-pill">${I("plus-circle")} Create room</div>
              <span class="ev-mini ev-muted">${I("shield")} Same-module only</span>
            </div>

            <div class="ev-row" style="margin-top:10px">
              <label class="ev-pill">${I("users")} Capacity
                <select id="capSel" class="ev-select">
                  ${[2,3,4,5,6].map((n)=>`<option value="${n}" ${n===2?"selected":""}>${n}</option>`).join("")}
                </select>
              </label>
              <button class="ev-btn" type="button" id="createRoomBtn">${I("sparkles")} Create</button>
            </div>

            <div class="ev-row" style="margin-top:10px">
              <input id="joinCode" class="ev-input" placeholder="Room code (example: -Nxyz...)" style="flex:1;min-width:220px" />
              <button class="ev-btn" type="button" id="joinByCodeBtn">${I("log-in")} Join</button>
            </div>

            <div class="ev-mini ev-muted" style="margin-top:10px">
              ${I("settings")} Uses your current settings: <b>${pretty(state.settings.difficulty)}</b>,
              <b>${pretty(state.settings.direction)}</b>, <b>${state.settings.count} Q</b>, <b>${state.settings.options} choices</b>.
            </div>
          </div>

          <div class="ev-panel">
            <div class="ev-row" style="justify-content:space-between;align-items:center">
              <div class="ev-pill">${I("radio")} Live rooms</div>
              <button class="ev-btn" type="button" id="refreshRoomsBtn" style="padding:10px 12px;font-size:13px;">${I("refresh-cw")} Refresh</button>
            </div>
            <div id="arenaRoomsList" class="ev-roomlist" style="margin-top:10px">
              <div class="ev-mini ev-muted">${I("loader")} Loading rooms…</div>
            </div>
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#backHomeBtn").addEventListener("click", () => renderHomeScreen());

    $("#refreshRoomsBtn").addEventListener("click", async () => {
      await play(sndClick);
      startRoomsTicker({ mountId: "arenaRoomsList", limit: 8 });
    });

    $("#createRoomBtn").addEventListener("click", async () => {
      await play(sndClick);
      const cap = Number($("#capSel").value) || 2;
      try {
        renderLoading("Creating room…");
        const roomId = await createRoom(cap);
        openRoom(roomId, { autoJoin: false });
      } catch (e) {
        console.error(e);
        renderError("Could not create the room. Check your rules/permissions.");
      }
    });

    $("#joinByCodeBtn").addEventListener("click", async () => {
      await play(sndClick);
      const code = String($("#joinCode").value || "").trim();
      if (!code) return;
      openRoom(code, { autoJoin: true });
    });

    startRoomsTicker({ mountId: "arenaRoomsList", limit: 8 });
  }

  async function openRoom(roomId, { autoJoin = true } = {}) {
    injectStyles();
    // Load uid->username map (visual only)
    ensureUidToUsername().catch(() => {});
    stopRoomsTicker();
    stopRoomWatcher();

    const { db, ref, onValue } = fb;
    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);

    // auto join (claim a slot)
    if (autoJoin) {
      try {
        await joinRoom(roomId);
      } catch (e) {
        console.warn("join:", e);
      }
    }

    state.currentRoomId = roomId;

    state._roomUnsub = onValue(
      roomRef,
      async (snap) => {
        const room = snap.exists() ? snap.val() : null;
        state.currentRoom = room;

        if (!room) {
          renderError("This room no longer exists.");
          return;
        }

        const status = String(room.status || "waiting");

        // Presence: start only if I'm actually in slots
        const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
        const slots = getSlots(room);
        const inRoom = slotsInCapacity(cap).some((k) => slots[k] === state.uid);

        if ((status === "waiting" || status === "started") && inRoom) {
          startPresence(roomId).catch(() => {});
        } else {
          stopPresence();
        }

        if (status === "waiting") {
          // no opponent-left timer while waiting
          if (state._opponentLeftTimer) {
            clearTimeout(state._opponentLeftTimer);
            state._opponentLeftTimer = null;
          }
          renderRoomLobby(roomId, room);
          return;
        }

        if (status === "started") {
          // If I'm not in slots, don't let me play
          if (!inRoom) {
            renderError("You are not in this room (or you joined too late).");
            return;
          }

          // If game already finished (even if root status is still started), jump to results.
          const gStatus = String(room?.game?.status || "");
          if (gStatus === "finished" || getFinishInfo(room)) {
            // Ensure I record my final result once (partial if needed)
            if (state.roomGame && !state.roomGame.submitted) {
              await finishRoomGame({ cause: "room_finished", skipLock: true });
            }
            state.roomGame = null;
            try { if (room.hostUid === state.uid) tryFinalizeRoom(roomId).catch(() => {}); } catch {}
            renderRoomResults(roomId, room);
            return;
          }

          // Disconnect policy (B): auto-finish after timeout when opponent leaves
          updateOpponentLeftTimer(roomId, room);

          if (!state.roomGame) {
            await beginRoomGame(roomId, room);
          } else {
            renderRoomGameScreen();
          }
          return;
        }

        if (status === "finished") {
          // stop timers and presence
          stopPresence();
          if (state._opponentLeftTimer) {
            clearTimeout(state._opponentLeftTimer);
            state._opponentLeftTimer = null;
          }

          // Ensure my result exists (idempotent)
          if (state.roomGame && !state.roomGame.submitted) {
            await finishRoomGame({ cause: "room_finished", skipLock: true });
          }

          state.roomGame = null;
          try { if (room.hostUid === state.uid) tryFinalizeRoom(roomId).catch(() => {}); } catch {}
          renderRoomResults(roomId, room);
          return;
        }

        // cancelled or unknown
        renderError("This room was cancelled.");
      },
      (err) => {
        console.error("room watcher:", err);
        renderError("Could not watch this room.");
      }
    );
  }



  function renderRoomLobby(roomId, room) {
    state.roomGame = null;

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const host = room.hostUid === state.uid;
    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    const joinUrl = inviteLink(roomId);
    const keys = slotsInCapacity(cap);

    const playersCount = keys.map((k) => slots[k]).filter(Boolean).length;

    const diffObj = normalizeDifficultySetting(room.settings?.difficulty || state.settings.difficulty);
    const diffLabel = prettyDifficulty(diffObj);
    const dirLabel = pretty(room.settings?.direction || state.settings.direction);

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${I("swords")} Room</span>
            <span class="ev-pill ev-code">${roomId}</span>
          </div>
          <button class="ev-btn" type="button" id="backArenaBtn" style="padding:8px 10px;opacity:.9">${I("arrow-left")} Arena</button>
        </div>

        <h3 class="ev-h">${host ? "You are the host" : "Waiting for host"}</h3>
        <p class="ev-sub">${I("users")} Players: <b>${playersCount}/${cap}</b> · ${I("settings")} ${diffLabel} · ${dirLabel}</p>

        <div class="ev-panel">
          <div class="ev-list">
            ${keys
              .map((k, idx) => {
                const uid = slots[k] || "";
                const isHost = k === "s0";
                const who = uid ? displayUser(uid) : "Empty";
                return `
                  <div class="ev-row" style="justify-content:space-between">
                    <div class="ev-pill">${I(uid ? "user" : "circle")} <b>Seat ${idx + 1}:</b> ${who}</div>
                    ${isHost ? `<span class="ev-badge">${I("crown")} Host</span>` : (uid ? `<span class="ev-badge">${I("circle")} Joined</span>` : `<span class="ev-badge">${I("minus")} Free</span>`)}
                  </div>
                `;
              })
              .join("")}
          </div>

          ${host ? `
            <div class="ev-row" style="margin-top:14px;gap:10px;flex-wrap:wrap;align-items:center">
              <span class="ev-pill">${I("activity")} Difficulty</span>
              <select id="roomDiffSelect" class="ev-select" style="min-width:160px">
                ${["easy","normal","hard","nightmare"].map((lvl) => `<option value="${lvl}" ${diffObj.level===lvl?"selected":""}>${pretty(lvl)}</option>`).join("")}
              </select>
              <span class="ev-mini ev-muted">${I("info")} Synced to all players · Locks on start</span>
            </div>
          ` : `
            <div class="ev-mini ev-muted" style="margin-top:14px">${I("info")} Host chooses difficulty before starting.</div>
          `}

          <div class="ev-row" style="margin-top:12px;justify-content:space-between;flex-wrap:wrap">
            <button class="ev-btn" type="button" id="copyInviteBtn" style="padding:10px 12px;font-size:13px;">${I("copy")} Copy invite</button>
            <button class="ev-btn" type="button" id="leaveBtn" style="padding:10px 12px;font-size:13px;">${I("log-out")} Leave</button>
            <button class="ev-btn" type="button" id="startBtn" ${host && playersCount >= 2 ? "" : "disabled"} style="padding:10px 12px;font-size:13px;">
              ${I(host ? "play" : "hourglass")} ${host ? "Start match" : "Waiting…"}
            </button>
          </div>

          <div class="ev-mini ev-muted" style="margin-top:10px">
            ${I("info")} Share the link or the room code. When ready, host starts the match.
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#backArenaBtn").addEventListener("click", () => openGroupArena());

    $("#copyInviteBtn").addEventListener("click", async () => {
      await play(sndClick);
      try {
        await navigator.clipboard.writeText(joinUrl);
        $("#copyInviteBtn").textContent = "Copied!";
        setTimeout(() => ($("#copyInviteBtn").innerHTML = `${I("copy")} Copy invite`, refreshIcons()), 900);
      } catch {
        alert(joinUrl);
      }
    });

    $("#leaveBtn").addEventListener("click", async () => {
      await play(sndClick);
      try {
        renderLoading("Leaving…");
        await leaveRoom(roomId);
      } catch (e) {
        console.error(e);
      } finally {
        stopRoomWatcher();
        openGroupArena();
      }
    });

    if (host) {
      const sel = $("#roomDiffSelect");
      if (sel) {
        sel.addEventListener("change", async () => {
          try {
            await play(sndClick);
            const lvl = String(sel.value || "normal").toLowerCase();
            const newDiff = normalizeDifficultySetting({ level: lvl, seed: makeSeed() });

            const { db, ref, update } = fb;
            const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
            await update(roomRef, {
              "settings/difficulty": newDiff,
              updatedAtMs: Date.now(),
            });
          } catch (e) {
            console.error(e);
          }
        });
      }
    }

    $("#startBtn").addEventListener("click", async () => {
      if (!host) return;
      await play(sndClick);
      try {
        renderLoading("Starting…");
        await startMatch(roomId);
      } catch (e) {
        console.error(e);
        renderError(e.message || "Could not start match.");
      }
    });
  }


  async function beginRoomGame(roomId, room) {
    const g = room.game;
    if (!g || !Array.isArray(g.wordIds) || !g.wordIds.length) {
      renderError("Game data missing. Host should start again.");
      return;
    }

    // Difficulty object is synced for GROUP mode
    const diffObj = normalizeDifficultySetting(g.difficulty || room.settings?.difficulty || state.settings.difficulty);
    const cfg = {
      seconds: effectiveSeconds(diffObj),
      revealMs: diffObj.revealMs || 800,
      effects: {
        blink: diffObj.effects?.blink || 0,
        glitch: diffObj.effects?.glitch || 0,
        mask: diffObj.effects?.blur || 0,
      },
      seed: diffObj.seed,
    };

    state.roomGame = {
      roomId,
      startedAtMs: Number(g.startedAtMs || Date.now()),
      idx: 0,
      correct: 0,
      wrong: 0,
      score: 0,
      direction: g.direction || "eng->uzb",
      difficultyObj: diffObj,
      difficulty: diffObj.level,
      cfg,
      options: clamp(Number(g.options || 4), 2, 6),
      wordIds: g.wordIds.map((x) => String(x)),
      byId: new Map(state.vocab.map((w) => [String(w.id), w])),
      submitted: false,
      forfeited: false,
      ended: false,
      endCause: "",
      correctWordIds: new Set(),

      // per-question timer handles
      _timerId: null,
    };

    // keep presence alive
    startPresence(roomId).catch(() => {});

    renderRoomGameScreen();
  }


  function renderScoreboard(room) {
    const cap = clamp(Number(room?.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);
    const results = (room?.results && typeof room.results === "object") ? room.results : {};
    const keys = slotsInCapacity(cap);

    const rows = keys
      .map((k, idx) => {
        const uid = slots[k];
        if (!uid) return null;
        const r = results[uid] || null;
        const me = uid === state.uid;
        const label = k === "s0" ? `Host` : `Seat ${idx + 1}`;
        return {
          me,
          uid,
          label,
          score: r ? Number(r.score || 0) : null,
          correct: r ? Number(r.correct || 0) : null,
          wrong: r ? Number(r.wrong || 0) : null,
          finishedAtMs: r ? Number(r.finishedAtMs || 0) : 0,
          forfeited: r ? !!r.forfeited : false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        // finished players first by score
        const af = a.score !== null;
        const bf = b.score !== null;
        if (af !== bf) return bf - af;
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        if ((b.correct || 0) !== (a.correct || 0)) return (b.correct || 0) - (a.correct || 0);
        return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
      });

    return `
      <div class="ev-panel">
        <div class="ev-row" style="justify-content:space-between;align-items:center">
          <div class="ev-pill">${I("trophy")} Scoreboard</div>
          <span class="ev-mini ev-muted">${I("info")} updates on finish</span>
        </div>
        <div class="ev-list" style="margin-top:10px">
          ${rows
            .map((r) => {
              const who = displayUser(r.uid);
              const status = r.score === null ? `<span class="ev-badge">${I("loader")} Playing…</span>` : `<span class="ev-badge">${I("trophy")} ${r.score}</span>`;
              const detail = r.score === null
                ? `<div class="ev-mini ev-muted" style="margin:-2px 0 8px 0">${I("clock")} in progress</div>`
                : `<div class="ev-mini ev-muted" style="margin:-2px 0 8px 0">${I("check-circle")} ${r.correct} · ${I("x-circle")} ${r.wrong}${r.forfeited ? ` · ${I("flag")} forfeited` : ""}</div>`;
              return `
                <div class="ev-row" style="justify-content:space-between">
                  <div class="ev-pill">${I(r.me ? "sparkles" : "user")} <b>${who}</b> <span class="ev-muted">(${r.label})</span></div>
                  ${status}
                </div>
                ${detail}
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderRoomGameScreen() {
    const rg = state.roomGame;
    const room = state.currentRoom;
    if (!rg || !room) return;

    // Stop any running per-question timer before re-render
    try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
    rg._timerId = null;

    // If room/game already finished, stop interaction and jump to results phase.
    const finish = getFinishInfo(room);
    const rootStatus = String(room.status || "");
    const gStatus = String(room?.game?.status || "");

    if (rootStatus === "finished" || gStatus === "finished" || finish) {
      rg.ended = true;
      // Ensure my result exists (idempotent). Skip lock because room is already finished.
      if (!rg.submitted) {
        finishRoomGame({ cause: "room_finished", skipLock: true }).catch(() => {});
      }
      renderLoading("Calculating results…");
      return;
    }

    const total = clamp(Number(room?.game?.count || rg.wordIds.length || 0), 1, 200);
    if (rg.idx >= total) {
      finishRoomGame({ cause: "completed" }).catch(() => {});
      return;
    }

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const progressPct = Math.round((rg.idx / total) * 100);

    const currentId = String(rg.wordIds[rg.idx]);
    const word = rg.byId.get(currentId);

    if (!word) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    const q = buildQuestion(word, rg.direction);
    if (!q.qText || !q.aText) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    // ✅ Deterministic options + effects (shared seed)
    const seed = rg.cfg?.seed ?? rg.difficultyObj?.seed ?? 0;
    const opts = pickOptionsSeeded(q.aText, q.aLang, state.vocab, rg.options, seed, currentId, rg.idx);
    if (opts.length < 2) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    const fx = chooseEffectSeeded(rg.difficultyObj, currentId, rg.idx);

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row" style="flex-wrap:wrap">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${I("swords")} Group</span>
            <span class="ev-pill">${I("activity")} ${prettyDifficulty(rg.difficultyObj)}</span>
            <span class="ev-pill">${I("shuffle")} ${pretty(rg.direction || "eng->uzb")}</span>
            <span class="ev-pill" id="roomTimerPill">${I("timer")} <b id="roomTimerVal"></b></span>
          </div>
          <button class="ev-btn" type="button" id="forfeitBtn" style="padding:8px 10px;opacity:.9">${I("x")} Forfeit</button>
        </div>

        <div class="ev-row" style="justify-content:space-between;align-items:center;margin-top:6px">
          <div class="ev-mini ev-muted">${I("bar-chart-2")} Progress: <b>${rg.idx + 1}/${total}</b> · ${progressPct}%</div>
          <div class="ev-mini ev-muted">${I("check-circle")} ${rg.correct} · ${I("x-circle")} ${rg.wrong} · ${I("zap")} ${rg.score} pts</div>
        </div>

        <div class="ev-panel" style="margin-top:10px">
          <div class="ev-q" id="question">${escapeHtml(q.qText)}</div>
          <div class="ev-answers" id="answers"></div>
          <div class="ev-mini ev-muted" style="margin-top:10px">${I("info")} First finisher ends the match for everyone.</div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#forfeitBtn").addEventListener("click", async () => {
      await play(sndClick);
      await forfeitRoom(rg.roomId);
    });

    const qEl = $("#question");

    // Effects (blink/glitch/mask) — mask reveals on click
    const applyMask = () => {
      if (!fx.mask) return;
      qEl.classList.add("masked");
      qEl.addEventListener("click", () => {
        qEl.classList.remove("masked");
        // Re-mask after reveal delay (solo-like behavior)
        setTimeout(() => qEl.classList.add("masked"), rg.cfg?.revealMs || 800);
      });
    };

    if (fx.blink) qEl.classList.add("blink");
    if (fx.glitch) qEl.classList.add("glitch");
    applyMask();

    // Timer (solo-like): time per word depends on difficulty
    let remaining = Number(rg.cfg?.seconds || 0) || 0;
    const timerVal = $("#roomTimerVal");

    const updateTimerUI = () => {
      if (!timerVal) return;
      timerVal.textContent = (!remaining) ? "∞" : `${remaining}s`;
    };
    updateTimerUI();

    let locked = false;
    const lock = () => (locked = true);

    const endQuestion = () => {
      try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
      rg._timerId = null;
    };

    const timeUp = async () => {
      if (locked) return;
      lock();
      endQuestion();

      await play(sndWrong);
      rg.wrong++;

      $$(".ev-answer", app).forEach((b) => {
        b.disabled = true;
        if (b.textContent === q.aText) b.classList.add("good");
      });

      rg.idx++;

      // If this was the last word, finishing should instantly end the match for everyone
      if (rg.idx >= total) {
        await sleep(150);
        await finishRoomGame({ cause: "completed" });
      } else {
        await sleep(450);
        renderRoomGameScreen();
      }
    };

    if (remaining) {
      rg._timerId = setInterval(() => {
        if (locked) return;
        remaining = Math.max(0, remaining - 1);
        updateTimerUI();
        if (remaining <= 0) {
          timeUp().catch(() => {});
        }
      }, 1000);
    }

    const answersEl = $("#answers");

    for (const opt of opts) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ev-answer";
      btn.textContent = opt;

      btn.addEventListener("click", async () => {
        if (locked) return;
        lock();
        endQuestion();

        const isCorrect = opt === q.aText;

        if (isCorrect) {
          await play(sndCorrect);
          rg.correct++;
          rg.correctWordIds.add(String(currentId));
          // scoring: keep your previous logic
          const lvl = String(rg.difficultyObj?.level || rg.difficulty || "normal");
          rg.score += lvl === "hard" ? 2 : (lvl === "nightmare" ? 3 : 1);
        } else {
          await play(sndWrong);
          rg.wrong++;
        }

        $$(".ev-answer", app).forEach((b) => {
          b.disabled = true;
          if (b.textContent === q.aText) b.classList.add("good");
          if (b.textContent === opt && opt !== q.aText) b.classList.add("bad");
        });

        rg.idx++;

        // ✅ Critical: if user just locked the FINAL answer, attempt finish lock immediately.
        if (rg.idx >= total) {
          await sleep(150);
          await finishRoomGame({ cause: "completed" });
        } else {
          await sleep(450);
          renderRoomGameScreen();
        }
      });

      answersEl.appendChild(btn);
    }
  }



  async function submitMyResultOnce(roomId, payload) {
    // ✅ Idempotent result write (safe on reconnect)
    const { db, ref, runTransaction } = fb;
    const rRef = ref(db, `${roomsBasePath()}/${roomId}/results/${state.uid}`);

    const data = {
      uid: state.uid,
      correct: Number(payload?.correct || 0) || 0,
      wrong: Number(payload?.wrong || 0) || 0,
      score: Number(payload?.score || 0) || 0,
      timeMs: Number(payload?.timeMs || 0) || 0,
      finishedAtMs: Number(payload?.finishedAtMs || Date.now()) || Date.now(),
      finishedRank: payload?.finishedRank ?? null, // 1 if you triggered the end (completed all), 2 otherwise
      endedBy: String(payload?.endedBy || ""),
      difficulty: String(payload?.difficulty || ""),
      direction: String(payload?.direction || ""),
      forfeited: !!payload?.forfeited,
    };

    const tx = await runTransaction(rRef, (curr) => {
      if (curr && typeof curr === "object") return; // abort if already written
      return data;
    });

    return !!tx?.committed;
  }



  async function finishRoomGame({ cause = "completed", skipLock = false } = {}) {
    const rg = state.roomGame;
    if (!rg || rg.submitted) return;

    // stop timers/inputs immediately
    try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
    rg._timerId = null;

    rg.ended = true;
    rg.endCause = String(cause || "");

    const roomId = rg.roomId;
    const room = state.currentRoom;

    // ✅ Race-safe finish lock: the first player to complete ALL questions ends the match for everyone.
    let lockCommitted = false;
    if (!skipLock) {
      try {
        if (cause === "completed") {
          lockCommitted = await attemptFinishLock(roomId, { triggerUid: state.uid, reason: "completed_all" });
        } else if (cause === "forfeit") {
          // Forfeit ends match immediately; other player wins if present
          const uids = getRoomUids(room || {});
          const other = uids.find((u) => u && u !== state.uid) || state.uid;
          lockCommitted = await attemptFinishLock(roomId, { triggerUid: state.uid, winnerUid: other, reason: "forfeit" });
        }
      } catch (e) {
        // If already finished, we just proceed to results
        console.warn("finish lock:", e);
      }
    }

    // Determine local rank (purely informational for stats/analytics)
    // The match ENDS when someone completes all questions, but the WINNER is decided by score/correct.
    const fin = getFinishInfo(state.currentRoom) || getFinishInfo(room) || null;
    let finishedRank = null;
    if (cause === "completed") finishedRank = lockCommitted ? 1 : 2;

    const finishedAtMs = Date.now();
    const timeMs = Math.max(0, finishedAtMs - Number(rg.startedAtMs || finishedAtMs));

    // ✅ Idempotent result write (safe on reconnect)
    await submitMyResultOnce(roomId, {
      score: rg.score,
      correct: rg.correct,
      wrong: rg.wrong,
      timeMs,
      finishedAtMs,
      finishedRank,
      endedBy: String(fin?.reason || cause || ""),
      difficulty: rg.difficulty,
      direction: rg.direction,
      forfeited: !!rg.forfeited,
    });

    rg.submitted = true;

    // Mark correct words for your marks/words (reuse solo helper safely)
    const prevSession = state.session;
    try {
      state.session = { correctWordIds: rg.correctWordIds };
      await markCorrectWords();
    } catch (e) {
      console.warn("markCorrectWords:", e);
    } finally {
      state.session = prevSession;
    }

    // UI: jump to results phase (watcher will render actual scoreboard)
    renderLoading("Calculating results…");
  }



  async function forfeitRoom(roomId) {
    const rg = state.roomGame;
    if (rg && rg.roomId === roomId && !rg.submitted) {
      rg.forfeited = true;
      rg.idx = rg.wordIds.length; // end now locally
      await finishRoomGame({ cause: "forfeit" });
      return;
    }

    // not in-game
    stopRoomWatcher();
    openGroupArena();
  }




  async function tryFinalizeRoom(roomId) {
    // Host-only finalization
    if (state.currentRoom?.hostUid !== state.uid) return;

    const { db, ref, runTransaction } = fb;
    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);

    const GRACE_MS = 8000;

    await runTransaction(roomRef, (curr) => {
      if (!curr || typeof curr !== "object") return curr;

      const g = (curr.game && typeof curr.game === "object") ? curr.game : {};
      const gStatus = String(g.status || "");
      const fin = (g.finish && typeof g.finish === "object") ? g.finish : null;

      const rootStatus = String(curr.status || "");
      const isFinished = rootStatus === "finished" || gStatus === "finished" || !!fin?.finishedAtMs;
      if (!isFinished) return curr;

      const cap = clamp(Number(curr.capacityOfPlayers || 2) || 2, 2, 6);
      const slots = getSlots(curr);
      const uids = slotsInCapacity(cap).map((k) => slots[k]).filter(Boolean);

      // Need at least 2 players for a meaningful winner
      if (uids.length < 2) return curr;

      const results = (curr.results && typeof curr.results === "object") ? curr.results : {};
      const now = Date.now();
      const finishedAt = Number(fin?.finishedAtMs || curr.finishedAtMs || 0) || 0;

      const hasCount = uids.filter((uid) => results[uid] && typeof results[uid] === "object").length;
      const allHaveResults = hasCount === uids.length;
      const gracePassed = finishedAt ? (now - finishedAt) >= GRACE_MS : false;

      // Wait for everyone to submit OR grace timeout (disconnect-safe)
      if (!allHaveResults && !gracePassed) return curr;

      const ranked = uids
        .map((uid) => {
          const r = results[uid] && typeof results[uid] === "object" ? results[uid] : null;
          return {
            uid,
            has: !!r,
            score: Number(r?.score || 0) || 0,
            correct: Number(r?.correct || 0) || 0,
            wrong: Number(r?.wrong || 0) || 0,
            timeMs: Number(r?.timeMs || 0) || 0,
            finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
            forfeited: !!r?.forfeited,
          };
        })
        .sort((a, b) => {
          // forfeited last
          if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
          // missing results last
          if (a.has !== b.has) return a.has ? -1 : 1;
          // ✅ primary: who found more (correct)
          if (b.correct !== a.correct) return b.correct - a.correct;
          // secondary: score
          if (b.score !== a.score) return b.score - a.score;
          // time asc (faster wins on tie)
          if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
          return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
        });

      const winnerObj =
        ranked.find((p) => p.has && !p.forfeited) ||
        ranked.find((p) => p.has) ||
        ranked[0];

      const winnerUid = String(winnerObj?.uid || "");
      if (!winnerUid) return curr;

      // Rules require winnerUid to be one of slots
      if (!uids.includes(winnerUid)) return curr;

      const cleanedRanked = ranked.map((p) => ({
        uid: p.uid,
        score: p.score,
        correct: p.correct,
        wrong: p.wrong,
        timeMs: p.timeMs,
        finishedAtMs: p.finishedAtMs,
        forfeited: p.forfeited,
      }));

      const newGame = {
        ...g,
        status: "finished",
        finish: {
          ...(fin || {}),
          finishedAtMs: finishedAt || now,
          winnerUid,
        },
      };

      return {
        ...curr,
        status: "finished",
        updatedAtMs: now,
        finishedAtMs: curr.finishedAtMs || finishedAt || now,
        winnerUid,
        ranked: cleanedRanked,
        game: newGame,
      };
    });
  }

  async function recordOutcomeForMe(roomId, room) {
    // record just once per room
    if (state.lastRecordedRoomId === roomId) return;
    state.lastRecordedRoomId = roomId;

    const fin = getFinishInfo(room) || {};

    const uids = getRoomUids(room);
    const resultsObj = (room.results && typeof room.results === "object") ? room.results : {};
    const allIn = uids.length ? uids.every((uid) => resultsObj[uid] && typeof resultsObj[uid] === "object") : false;

    const rows = uids.map((uid) => {
      const r = resultsObj[uid] && typeof resultsObj[uid] === "object" ? resultsObj[uid] : null;
      return {
        uid,
        has: !!r,
        correct: Number(r?.correct || 0) || 0,
        score: Number(r?.score || 0) || 0,
        timeMs: Number(r?.timeMs || 0) || 0,
        finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
        forfeited: !!r?.forfeited,
      };
    }).sort((a,b)=>{
      if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
      if (a.has !== b.has) return a.has ? -1 : 1;
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (b.score !== a.score) return b.score - a.score;
      if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      return (a.finishedAtMs||0)-(b.finishedAtMs||0);
    });

    const computedWinnerUid = allIn ? String((rows.find((p)=>p.has && !p.forfeited) || rows.find((p)=>p.has) || rows[0] || {}).uid || "") : "";
    const winnerUid = String(room.winnerUid || computedWinnerUid || fin.winnerUid || "");
    if (!winnerUid) return;

const isWinner = winnerUid === state.uid;
    const k = isWinner ? "wins" : "losses";

    const statsRef = fb.ref(fb.db, `students/${state.uid}/stats/${k}/${state.type}/${safeKey(state.name)}`);
    try {
      const snap = await fb.get(statsRef);
      const prev = snap.exists() ? Number(snap.val() || 0) : 0;
      await fb.set(statsRef, prev + 1);
    } catch {}
  }



  function renderRoomResults(roomId, room) {
    injectStyles();
    stopRoomsTicker();

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const backLabel = state.type === "unitwords"
      ? `Back to Unit: ${pretty(state.name)}`
      : `Back to Listening: ${pretty(state.name)}`;

    const finish = getFinishInfo(room) || {};
    const reason = String(finish.reason || "");
    const reasonText =
      reason === "opponent_left" ? "Opponent left — auto-finished." :
      reason === "forfeit" ? "A player forfeited." :
      (reason === "completed_all" || reason === "first_finish") ? "Match ended because someone completed all questions." :
      "";
const uids = getRoomUids(room);
    const resultsObj = (room.results && typeof room.results === "object") ? room.results : {};

    const rows = uids.map((uid) => {
      const r = resultsObj[uid] && typeof resultsObj[uid] === "object" ? resultsObj[uid] : null;
      return {
        uid,
        has: !!r,
        score: Number(r?.score || 0) || 0,
        correct: Number(r?.correct || 0) || 0,
        wrong: Number(r?.wrong || 0) || 0,
        timeMs: Number(r?.timeMs || 0) || 0,
        forfeited: !!r?.forfeited,
        finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
      };
    });

    const ranked = rows.slice().sort((a, b) => {
      // forfeited last
      if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
      // missing results last
      if (a.has !== b.has) return a.has ? -1 : 1;
      // ✅ primary: who found more (correct)
      if (b.correct !== a.correct) return b.correct - a.correct;
      // secondary: score
      if (b.score !== a.score) return b.score - a.score;
      // time asc (faster better) when available
      if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      // finishedAt asc
      return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
    });

    const allIn = ranked.every((p) => p.has);

    const computedWinnerUid = allIn
      ? String((ranked.find((p) => p.has && !p.forfeited) || ranked.find((p) => p.has) || ranked[0] || {}).uid || "")
      : "";

    // Prefer finalized winnerUid on the room. Only fall back to finish.winnerUid for hard outcomes (e.g., forfeit).
    let winnerUid = String(room.winnerUid || computedWinnerUid || "");
    if (!winnerUid && finish.winnerUid && reason !== "completed_all" && reason !== "first_finish") {
      winnerUid = String(finish.winnerUid || "");
    }

    app.innerHTML = `
      <div class="top-bar">
        <button class="lofi-toggle" type="button" id="finishCornerBtn">${I("arrow-left")} ${backLabel}</button>
      </div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">${I("swords")} Room</div>
          <div class="ev-pill ev-code">${roomId}</div>
        </div>

        <h3 class="ev-h">${I("trophy")} Match results</h3>
        <p class="ev-sub">
          ${winnerUid
            ? (winnerUid === state.uid ? "You won 🏆" : "Winner decided.")
            : (allIn ? "Finished." : "Finished — waiting for other results…")}
          ${reasonText ? ` · ${reasonText}` : ""}
        </p>

        ${allIn ? "" : `<div class="ev-mini ev-muted" style="margin-top:6px">${I("info")} Waiting for missing results (reconnect-safe). You can leave anytime.</div>`}

        <div class="ev-col" style="gap:8px;margin-top:10px">
          ${ranked.map((p, i) => {
            const isMe = p.uid === state.uid;
            const name = displayUser(p.uid);
            const medal = (p.uid === winnerUid) ? I("crown") : I("medal");
            const status = !p.has ? `${I("wifi-off")} no result` : (p.forfeited ? `${I("x")} forfeited` : `${I("check-circle")} submitted`);
            const timeStr = p.timeMs ? `${Math.round(p.timeMs/1000)}s` : "—";
            return `
              <div class="ev-row" style="justify-content:space-between;gap:10px;flex-wrap:wrap">
                <div class="ev-pill">${medal} #${i + 1} <b>${name}</b> ${isMe ? "<span class='ev-mini'>(you)</span>" : ""}</div>
                <div class="ev-pill">${I("trophy")} ${p.score} pts</div>
                <div class="ev-pill">${I("check-circle")} ${p.correct} / ${I("x-circle")} ${p.wrong}</div>
                <div class="ev-pill">${I("timer")} ${timeStr}</div>
                <div class="ev-pill">${status}</div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="ev-row" style="margin-top:14px">
          <button class="ev-btn" type="button" id="finishBtn" style="width:100%">${I("arrow-left")} ${backLabel}</button>
        </div>
      </div>
    `;

    refreshIcons();

    const goBack = () => {
      stopRoomWatcher();
      location.href = providerUrl();
    };

    $("#finishBtn").addEventListener("click", goBack);
    $("#finishCornerBtn").addEventListener("click", goBack);

    recordOutcomeForMe(roomId, room).catch((e) => console.error("outcome:", e));
  }



/* -----------------------
     9) Public functions (required by test.html inline onclick)
  ------------------------ */
  window.startSolo = function startSolo() {
    // keep compatibility with old buttons; now just starts using current settings
    startSoloFlow();
  };

  window.startGroup = function startGroup() {
    openGroupArena();
  };

  /* -----------------------
     10) Bootstrap
  ------------------------ */
  async function boot() {
    injectStyles();
    renderLoading("Signing in…");

    await loadFirebase();

    onAuthStateChanged(fb.auth, async (user) => {
      if (!user) {
        location.href = "/pages/auth/reg.html";
        return;
      }

      state.user = user;
      state.uid = user.uid;

      const ctx = resolveContextOrRedirect();
      if (!ctx) return;

      // Create/update listening access node (hasaccess stays false until completion)
      await ensureListeningAccessNode();

      try {
        renderLoading("Loading vocabulary…");
        state.vocab = await loadVocabFromFirebase(ctx.type, ctx.name);

        if (!state.vocab.length) {
          renderError(`No vocabulary found for ${ctx.type}/${ctx.name}.`);
          return;
        }

        renderHomeScreen();

        // Auto-open group mode if requested via URL
        const p = parseParams();
        if (p.mode === "group") {
          openGroupArena();
          if (p.room) {
            openRoom(p.room, { autoJoin: true });
          }
        }

      } catch (e) {
        console.error(e);
        renderError("Could not load vocabularies from Firebase.");
      }
    });
  }
  let roomWatchers = new Map();

  function watchRoomWithCleanup(roomId, callback) {
    // Clean up any existing watcher for this room
    if (roomWatchers.has(roomId)) {
      const unsubscribe = roomWatchers.get(roomId);
      unsubscribe();
      roomWatchers.delete(roomId);
    }

    const roomRef = fb.ref(fb.db, `${roomsBasePath()}/${roomId}`);
    const unsubscribe = fb.onValue(roomRef, callback);
    
    roomWatchers.set(roomId, unsubscribe);
    return unsubscribe;
  }

  function stopAllRoomWatchers() {
    roomWatchers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn("Failed to unsubscribe room watcher:", e);
      }
    });
    roomWatchers.clear();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', stopAllRoomWatchers);
  window.addEventListener('pagehide', stopAllRoomWatchers);

  // Global error handler for better debugging
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason?.code === 'PERMISSION_DENIED') {
      // Show user-friendly error instead of generic message
      const app = document.getElementById('app');
      if (app) {
        renderError(
          "⚠️ Database Permission Error\n\n" +
          "The database rejected your request. This usually means:\n" +
          "• You're not logged in\n" +
          "• Your session expired\n" +
          "• Database rules validation failed\n\n" +
          "Try refreshing the page or logging in again."
        );
      }
    }
  });


  boot();
=======
﻿(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const pretty = (s) => String(s || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const safeKey = (s) => String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);


  const escapeHtml = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const providerUrl = () =>
    `/vocabularies/provider.html?type=${encodeURIComponent(state.type)}&name=${encodeURIComponent(state.name)}`;

  const parseParams = () => {
    const u = new URL(location.href);
    return {
      type: u.searchParams.get("type") || "",
      name: u.searchParams.get("name") || "",
      mode: u.searchParams.get("mode") || "",
      room: u.searchParams.get("room") || "",
    };
  };

  const saveContextToLS = (type, name) => {
    try {
      localStorage.setItem("eduventure_vocab_context", JSON.stringify({ type, name }));
    } catch {}
  };

  const loadContextFromLS = () => {
    try {
      const raw = localStorage.getItem("eduventure_vocab_context");
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (v && typeof v === "object" && v.type && v.name) return v;
    } catch {}
    return null;
  };


  const I = (name, cls = "ev-ico") => `<i data-lucide="${name}" class="${cls}"></i>`;

  const refreshIcons = () => {
    try {
      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    } catch {}
  };


  const injectStyles = () => {
    if ($("#eduventure-vocab-style")) return;
    const st = document.createElement("style");
    st.id = "eduventure-vocab-style";
    st.textContent = `
      .ev-toprow{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
      .ev-pill{display:inline-flex;align-items:center;gap:8px;font-size:12px;padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.20);border:1px solid rgba(255,255,255,.35);color:#fff;font-weight:500;}
      .ev-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
      .ev-col{display:flex;flex-direction:column;gap:10px}
      .ev-card{width:min(680px,100%);margin:0 auto;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);border-radius:18px;padding:20px;backdrop-filter: blur(10px);-webkit-backdrop-filter: blur(10px);}
      .ev-h{margin:0 0 6px 0;font-size:20px;opacity:.98;color:#fff;font-weight:700;}
      .ev-sub{margin:0 0 14px 0;font-size:13px;opacity:.85;color:#fff;}
      .ev-select, .ev-input{padding:11px 13px;border-radius:12px;border:1px solid rgba(255,255,255,.30);background:rgba(255,255,255,.15);color:#fff;outline:none;font-size:14px;}
      .ev-select option{background:#1a1a2e;color:#fff;}
      .ev-input::placeholder{color:rgba(255,255,255,.6);}
      .ev-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:13px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.30);background:rgba(255,255,255,.16);color:#fff;font-weight:700;cursor:pointer;transition:.2s transform,.2s opacity,.2s background;font-size:14px;}
      .ev-card .lucide{width:18px;height:18px;}
      .ev-pill .lucide{width:14px;height:14px;}
      .ev-btn:hover{transform:translateY(-2px);background:rgba(255,255,255,.24);}
      .ev-btn:active{transform:translateY(0px);}
      .ev-btn:disabled{opacity:.45;cursor:not-allowed;transform:none;}
      .ev-answers{display:grid;grid-template-columns:1fr;gap:12px;margin-top:16px;}
      @media(min-width:640px){.ev-answers{grid-template-columns:1fr 1fr;}}
      @media(max-width:639px){.ev-card{padding:16px;}}
      .ev-answer{padding:14px 16px;border-radius:14px;border:2px solid rgba(255,255,255,.28);background:rgba(40,40,60,.75);cursor:pointer;text-align:left;color:#fff;font-weight:600;font-size:15px;transition:.2s all;}
      .ev-answer:hover{background:rgba(60,60,90,.85);border-color:rgba(255,255,255,.4);transform:translateY(-2px);}
      .ev-answer:active{transform:translateY(0);}
      .ev-answer.good{border-color:rgba(34,197,94,.9);background:rgba(34,197,94,.25);box-shadow:0 0 0 3px rgba(34,197,94,.2) inset;color:#4ade80;}
      .ev-answer.bad{border-color:rgba(239,68,68,.9);background:rgba(239,68,68,.25);box-shadow:0 0 0 3px rgba(239,68,68,.2) inset;color:#f87171;}
      .ev-answer:disabled{cursor:not-allowed;opacity:.85;}
      .ev-progress{height:12px;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden;border:1px solid rgba(255,255,255,.20)}
      .ev-progress > div{height:100%;width:0%;background:linear-gradient(90deg, rgba(59,130,246,.85), rgba(147,51,234,.85));transition:width .3s ease}
      .ev-word{font-size:24px;font-weight:800;letter-spacing:.4px;margin:8px 0 4px 0;line-height:1.3;user-select:none;color:#fff;}
      .ev-word.masked{filter: blur(10px); opacity:.65; }
      .ev-word.masked::after{content:"  (tap to reveal)";font-size:13px;font-weight:600;opacity:.9;color:rgba(255,255,255,.8);}
      .ev-word.blink{animation: evBlink .55s steps(2,end) infinite;}
      @keyframes evBlink{50%{opacity:.1}}
      .ev-word.glitch{position:relative;}
      .ev-word.glitch::before,.ev-word.glitch::after{
        content: attr(data-text);
        position:absolute;left:0;top:0;width:100%;
        mix-blend-mode: screen; opacity:.7;
      }
      .ev-word.glitch::before{transform:translate(2px,-1px);filter:blur(0.5px);color:#f0f;}
      .ev-word.glitch::after{transform:translate(-2px,1px);filter:blur(0.5px);color:#0ff;}
      .ev-timer{font-variant-numeric: tabular-nums;color:#fff;}
      .ev-note{font-size:13px;opacity:.85;margin-top:8px;color:#fff;}
      .ev-kbd{font-size:11px;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);color:#fff;font-weight:600;}
      @media(max-width:500px){
        .ev-word{font-size:20px;}
        .ev-answer{padding:12px;font-size:14px;}
        .ev-toprow{gap:8px;}
      }

      /* Rooms / Group Arena */
      .ev-roomhub{margin-top:10px;padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.20);background:rgba(255,255,255,.06);}
      .ev-roomhub-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
      .ev-roomlist{display:grid;gap:10px}
      .ev-roomcard{padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:linear-gradient(135deg, rgba(30,41,59,.55), rgba(88,28,135,.35));}
      .ev-roomcard-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
      .ev-roommeta{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .ev-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);font-size:12px;color:#fff;font-weight:600}
      .ev-code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,'Liberation Mono','Courier New',monospace;letter-spacing:.6px}
      .ev-split{display:grid;gap:12px}
      @media(min-width:900px){.ev-split{grid-template-columns:1.35fr .65fr}}
      .ev-panel{padding:12px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.28)}
      .ev-list{display:flex;flex-direction:column;gap:8px}
      .ev-mini{font-size:12px;opacity:.9;color:#fff}
      .ev-muted{opacity:.75}
    `;
    document.head.appendChild(st);
  };

  /* -----------------------
     2) Firebase lazy imports
  ------------------------ */
  let fb = null; // {auth, db, ref, get, set, update, push, runTransaction}
  let onAuthStateChanged = null;

  async function loadFirebase() {
    if (fb) return fb;
    const mod = await import("/elements/firebase.js");
    const authMod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js");
    const dbMod = await import("https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js");
    fb = {
      auth: mod.auth,
      db: mod.db,
      ref: mod.ref,
      get: mod.get,
      set: mod.set,
      update: mod.update,
      push: mod.push,
      runTransaction: mod.runTransaction,

      // realtime helpers (needed for live rooms)
      onValue: dbMod.onValue,
      off: dbMod.off,
      remove: dbMod.remove,
      onDisconnect: dbMod.onDisconnect,
      serverTimestamp: dbMod.serverTimestamp,
    };
    onAuthStateChanged = authMod.onAuthStateChanged;
    return fb;
  }

  /* -----------------------
     3) App state
  ------------------------ */
  const app = document.getElementById("app");
  const sndCorrect = document.getElementById("correctSnd");
  const sndWrong = document.getElementById("wrongSnd");
  const sndClick = document.getElementById("clickSnd");
  const lofi = document.getElementById("lofiMusic");

  const state = {
    user: null,
    uid: null,

    type: "",  // unitwords | listeningwords
    name: "",  // unit1 | building_bridge
    vocab: [], // [{id, eng, uzb, rus}]

    settings: {
      difficulty: "normal", // easy|normal|hard|nightmare
      direction: "eng->uzb", // eng->uzb | eng->rus | uzb->eng | rus->eng | mixed
      count: 15,
      options: 4,
    },

    session: null, // solo session stats
    group: null,   // group session
  };

  const DIFF = {
    easy:      { seconds: 0,  effects: { blink: 0.00, glitch: 0.00, mask: 0.00 }, revealMs: 0 },
    normal:    { seconds: 12, effects: { blink: 0.10, glitch: 0.05, mask: 0.05 }, revealMs: 900 },
    hard:      { seconds: 9,  effects: { blink: 0.22, glitch: 0.18, mask: 0.22 }, revealMs: 800 },
    nightmare: { seconds: 7,  effects: { blink: 0.30, glitch: 0.25, mask: 0.35 }, revealMs: 700 },
  };

  /* -----------------------
     3.5) Deterministic helpers for GROUP mode (seeded)
     - Required: identical difficulty/effects across clients
  ------------------------ */

  function makeSeed() {
    // 32-bit seed
    return ((Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0);
  }

  function hash32(str) {
    // FNV-1a 32-bit
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rngFrom(seed, salt) {
    return mulberry32(hash32(`${seed}:${salt}`));
  }

  function seededShuffle(arr, rng) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function normalizeDifficultySetting(input) {
    const raw = (input && typeof input === "object") ? input : { level: input };
    const level0 = String(raw.level || raw.name || raw.key || raw.difficulty || "normal").toLowerCase();
    const level = DIFF[level0] ? level0 : "normal";
    const base = DIFF[level] || DIFF.normal;

    // speedMultiplier: >1 => faster (less time)
    const fallbackSpeed =
      level === "easy" ? 0.85 :
      level === "hard" ? 1.20 :
      level === "nightmare" ? 1.35 :
      1.00;

    const speedMultiplier = clamp(Number(raw.speedMultiplier || fallbackSpeed), 0.5, 3);

    const effRaw = (raw.effects && typeof raw.effects === "object") ? raw.effects : {};
    
    // CRITICAL FIX: Firebase rules require BOOLEANS, not numbers!
    // Convert numeric probabilities (0-1) to boolean on/off states
    const effects = {
      blink: typeof effRaw.blink === "boolean" 
        ? effRaw.blink 
        : (typeof effRaw.blink === "number" 
            ? effRaw.blink > 0.5 
            : (base.effects?.blink || 0) > 0.5),
      
      glitch: typeof effRaw.glitch === "boolean" 
        ? effRaw.glitch 
        : (typeof effRaw.glitch === "number" 
            ? effRaw.glitch > 0.5 
            : (base.effects?.glitch || 0) > 0.5),
      
      blur: typeof effRaw.blur === "boolean" 
        ? effRaw.blur 
        : (typeof effRaw.blur === "number" 
            ? effRaw.blur > 0.5 
            : (typeof effRaw.mask === "number" 
                ? effRaw.mask > 0.5 
                : (base.effects?.mask || 0) > 0.5)),
    };

    const seconds = (typeof raw.seconds === "number") ? Math.max(0, Math.round(raw.seconds)) : (base.seconds || 0);
    const revealMs = (typeof raw.revealMs === "number") ? Math.max(0, Math.round(raw.revealMs)) : (base.revealMs || 0);

    const seed = Number.isFinite(Number(raw.seed)) ? (Number(raw.seed) >>> 0) : makeSeed();

    return {
      level,
      speedMultiplier,
      effects,
      seconds,
      revealMs,
      seed,
    };
  }


  function prettyDifficulty(d) {
    const obj = normalizeDifficultySetting(d);
    return pretty(obj.level);
  }

  function effectiveSeconds(difficultyObj) {
    const d = normalizeDifficultySetting(difficultyObj);
    if (!d.seconds) return 0;
    // Faster => less time per question
    const eff = Math.max(2, Math.round(d.seconds / (d.speedMultiplier || 1)));
    return eff;
  }

  function chooseEffectSeeded(difficultyObj, wordId, idx) {
    const d = normalizeDifficultySetting(difficultyObj);
    const r = rngFrom(d.seed, `fx:${wordId}:${idx}`);
    
    // FIX: Effects are now booleans, convert to probabilities for random checks
    // true = 100% chance (1.0), false = 0% chance (0)
    const blinkProb = d.effects?.blink ? 1.0 : 0;
    const glitchProb = d.effects?.glitch ? 1.0 : 0;
    const blurProb = d.effects?.blur ? 1.0 : 0;
    
    return {
      blink: r() < blinkProb,
      glitch: r() < glitchProb,
      blur: r() < blurProb,
    };
  }

  function pickOptionsSeeded(correctText, aLang, pool, optionsCount, seed, wordId, idx) {
    const rng1 = rngFrom(seed, `pool:${wordId}:${idx}`);
    const stablePool = pool.slice().sort((a,b)=>String(a.id||"").localeCompare(String(b.id||"")));
    const shuffledPool = seededShuffle(stablePool, rng1);

    const wrongs = [];
    const seen = new Set([String(correctText || "").toLowerCase()]);

    for (const w of shuffledPool) {
      const cand = String(w[aLang] || "").trim();
      if (!cand) continue;
      const key = cand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      wrongs.push(cand);
      if (wrongs.length >= optionsCount - 1) break;
    }

    while (wrongs.length < optionsCount - 1 && wrongs.length < pool.length) {
      wrongs.push("---");
    }

    const rng2 = rngFrom(seed, `opts:${wordId}:${idx}`);
    return seededShuffle([correctText, ...wrongs], rng2).slice(0, optionsCount);
  }



  /* -----------------------
     4) Audio helpers
  ------------------------ */
  const play = async (el) => {
    try {
      if (!el) return;
      el.currentTime = 0;
      await el.play();
    } catch {}
  };

  window.toggleLofi = async function toggleLofi() {
    if (!lofi) return;
    if (lofi.paused) {
      await play(lofi);
    } else {
      lofi.pause();
    }
  };

  /* -----------------------
     5) Data loading
  ------------------------ */
  function resolveContextOrRedirect() {
    const p = parseParams();
    let { type, name } = p;

    if (!type || !name) {
      const ls = loadContextFromLS();
      if (ls) ({ type, name } = ls);
    }

    // Normalize
    type = String(type || "").trim().toLowerCase();
    name = String(name || "").trim();

    const okType = type === "unitwords" || type === "listeningwords";
    if (!okType || !name) {
      // fallback to units menu
      location.href = "/vocabularies/units-menu.html";
      return null;
    }

    saveContextToLS(type, name);
    state.type = type;
    state.name = name;
    return { type, name };
  }

  async function loadVocabFromFirebase(type, name) {
    const { db, ref, get } = fb;
    const snap = await get(ref(db, `vocabularies/${type}/${name}`));
    if (!snap.exists()) return [];

    const raw = snap.val() || {};
    const items = Object.entries(raw)
      .map(([id, v]) => ({
        id: String(id),
        eng: (v && v.eng) ? String(v.eng) : "",
        uzb: (v && v.uzb) ? String(v.uzb) : "",
        rus: (v && v.rus) ? String(v.rus) : "",
      }))
      .filter((x) => x.eng || x.uzb || x.rus);

    // stable sort by numeric id if possible
    items.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
    return items;
  }

  /* -----------------------
     6) UI screens
  ------------------------ */
  function renderHomeScreen() {
    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    app.innerHTML = `
      <div class="top-bar">
        <div class="menu-container">
          <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-haspopup="menu" aria-expanded="false">${I("menu")}<span>Menu</span></button>
          <div class="menu-dropdown" id="menuDropdown">
            <div class="menu-item" onclick="location.href='/pages/study_materials/study_materials.html'">${I("home")}Home</div>
            <div class="menu-divider"></div>
            <div class="menu-item" onclick="showHelp()">${I("help-circle")}Help</div>
          </div>
        </div>
      </div>

      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">${I("book-open")} ${state.vocab.length} words</div>
        </div>

        <h2 style="margin:8px 0 0 0;color:#fff;">Vocabulary Trainer</h2>
        <p class="ev-sub">Solo mode saves your progress. Group mode is online: create/join a room with students in the same module.</p>

        <div class="ev-roomhub">
          <div class="ev-roomhub-head">
            <div class="ev-pill">${I("swords")} Live rooms</div>
            <button class="ev-btn" type="button" id="arenaBtn" style="padding:10px 12px;opacity:.95;font-size:13px;">${I("users")} Open Arena</button>
          </div>
          <div id="roomsList" class="ev-roomlist">
            <div class="ev-mini ev-muted">${I("loader")} Loading rooms…</div>
          </div>
          <div class="ev-mini ev-muted" style="margin-top:8px">${I("info")} Only rooms for <b>${pretty(state.name)}</b> show here.</div>
        </div>

        <div class="ev-col">
          <div class="ev-row" style="width:100%;">
            <label class="ev-pill" style="flex:1;min-width:140px;">Difficulty
              <select id="diffSel" class="ev-select" style="margin-top:4px;width:100%;">
                <option value="easy">Easy ⭐</option>
                <option value="normal" selected>Normal ⭐⭐</option>
                <option value="hard">Hard ⭐⭐⭐</option>
                <option value="nightmare">Nightmare 💀</option>
              </select>
            </label>

            <label class="ev-pill" style="flex:1;min-width:140px;">Direction
              <select id="dirSel" class="ev-select" style="margin-top:4px;width:100%;">
                <option value="eng->uzb" selected>ENG → UZB</option>
                <option value="eng->rus">ENG → RUS</option>
                <option value="uzb->eng">UZB → ENG</option>
                <option value="rus->eng">RUS → ENG</option>
                <option value="mixed">Mixed 🔀</option>
              </select>
            </label>

            <label class="ev-pill" style="flex:1;min-width:100px;">Questions
              <select id="countSel" class="ev-select" style="margin-top:4px;width:100%;">
                ${[10,15,20,30,50].map((n) => `<option value="${n}" ${n===15?"selected":""}>${n}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="ev-row" style="width:100%;">
            <button class="ev-btn" type="button" id="soloBtn" style="flex:1;">${I("user")} Solo Mode</button>
            <button class="ev-btn" type="button" id="groupBtn" style="flex:1;">${I("users")} Group Mode</button>
          </div>
          
          <button class="ev-btn" type="button" id="backBtn" style="opacity:.9;width:100%;">${I("arrow-left")} Back to Units</button>

          <div class="ev-note" style="margin-top:8px;">
            ${I("lightbulb")} <b>Pro tip:</b> In Hard/Nightmare modes, words can blink/glitch/blur. Tap the word to reveal it briefly!
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    const diffSel = $("#diffSel");
    const dirSel = $("#dirSel");
    const countSel = $("#countSel");

    diffSel.value = state.settings.difficulty;
    dirSel.value = state.settings.direction;
    countSel.value = String(state.settings.count);

    diffSel.addEventListener("change", () => (state.settings.difficulty = diffSel.value));
    dirSel.addEventListener("change", () => (state.settings.direction = dirSel.value));
    countSel.addEventListener("change", () => (state.settings.count = clamp(Number(countSel.value) || 15, 5, 200)));

    $("#soloBtn").addEventListener("click", async () => {
      await play(sndClick);
      startSoloFlow();
    });

    $("#groupBtn").addEventListener("click", async () => {
      await play(sndClick);
      openGroupArena();
    });

    const arenaBtn = $("#arenaBtn");
    if (arenaBtn) {
      arenaBtn.addEventListener("click", async () => {
        await play(sndClick);
        openGroupArena();
      });
    }

    $("#backBtn").addEventListener("click", () => {
      location.href = state.type === "unitwords" ? "/vocabularies/units-menu.html" : "/vocabularies/listenings-menu.html";
    });

    // Live rooms preview (top of page)
    startRoomsTicker({ mountId: "roomsList", limit: 3 });
  }

  function renderLoading(msg = "Loading…") {
    app.innerHTML = `
      <div class="top-bar">
        
      </div>
      <div class="ev-card">
        <h3 class="ev-h">${msg}</h3>
        <p class="ev-sub">Please wait…</p>
      </div>
    `;

    refreshIcons();
  }

  function renderError(msg) {
    app.innerHTML = `
      <div class="top-bar">
        
      </div>
      <div class="ev-card">
        <h3 class="ev-h">${I("alert-triangle")} Oops.</h3>
        <p class="ev-sub">${msg}</p>
        <div class="ev-row">
          <button class="ev-btn" type="button" onclick="location.href='/vocabularies/units-menu.html'">${I("arrow-left")} Go to Units</button>
        </div>
      </div>
    `;

    refreshIcons();
  }

  /* -----------------------
     7) SOLO MODE
  ------------------------ */
  function getDirection() {
    const d = state.settings.direction;
    if (d !== "mixed") return d;
    const picks = ["eng->uzb", "eng->rus", "uzb->eng", "rus->eng"];
    return picks[Math.floor(Math.random() * picks.length)];
  }

  function buildQuestion(word, direction) {
    const [qLang, aLang] = direction.split("->");
    const qText = String(word[qLang] || "").trim();
    const aText = String(word[aLang] || "").trim();
    return { qLang, aLang, qText, aText };
  }

  function pickOptions(correctText, aLang, pool, optionsCount = 4) {
    const wrongs = [];
    const seen = new Set([correctText.toLowerCase()]);
    
    // Improved: Shuffle pool first for better randomization
    const shuffledPool = shuffle(pool);
    
    for (const w of shuffledPool) {
      const cand = String(w[aLang] || "").trim();
      if (!cand) continue;
      const key = cand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      wrongs.push(cand);
      if (wrongs.length >= optionsCount - 1) break;
    }
    
    // Improved: If we don't have enough options, add placeholders only as last resort
    while (wrongs.length < optionsCount - 1 && wrongs.length < pool.length) {
      wrongs.push("---");
    }
    
    const opts = shuffle([correctText, ...wrongs]).slice(0, optionsCount);
    return opts;
  }

  function chooseEffect(difficulty) {
    const e = DIFF[difficulty]?.effects || DIFF.normal.effects;
    const r = Math.random();
    const roll = (p) => Math.random() < p;

    return {
      blink: roll(e.blink),
      glitch: roll(e.glitch),
      mask: roll(e.mask),
    };
  }

  async function startSoloFlow() {
    const diff = state.settings.difficulty;
    const cfg = DIFF[diff] || DIFF.normal;

    const words = shuffle(state.vocab);
    const total = clamp(state.settings.count, 5, words.length || 5);
    const deck = words.slice(0, total);

    state.session = {
      mode: "solo",
      type: state.type,
      name: state.name,
      difficulty: diff,
      startedAtMs: Date.now(),
      total,
      index: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      timesMs: [],
      correctWordIds: new Set(),
    };

    await runSoloQuestion(deck, cfg);
  }

  async function runSoloQuestion(deck, cfg) {
    const s = state.session;
    if (!s) return;

    if (s.index >= s.total) {
      await finishSolo();
      return;
    }

    const word = deck[s.index];
    const direction = getDirection();
    const q = buildQuestion(word, direction);

    // If we can't build a valid question, skip
    if (!q.qText || !q.aText) {
      s.index++;
      await runSoloQuestion(deck, cfg);
      return;
    }

    const opts = pickOptions(q.aText, q.aLang, state.vocab, state.settings.options);
    if (opts.length < 2) {
      s.index++;
      await runSoloQuestion(deck, cfg);
      return;
    }

    injectStyles();

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const progressPct = Math.round((s.index / s.total) * 100);

    app.innerHTML = `
      <div class="top-bar">
        
        <div class="menu-container">
          <button class="menu-toggle" type="button" onclick="toggleMenu()" aria-haspopup="menu" aria-expanded="false">${I("menu")}<span>Menu</span></button>
          <div class="menu-dropdown" id="menuDropdown">
            <div class="menu-item" onclick="if(confirm('Quit current game?')) renderHomeScreen()">${I("home")}Home</div>
            <div class="menu-divider"></div>
            <div class="menu-item" onclick="showHelp()">${I("help-circle")}Help</div>
          </div>
        </div>
      </div>

      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${pretty(s.difficulty)}</span>
          </div>
          <button class="ev-btn" type="button" id="quitBtn" style="padding:10px 12px;opacity:.9;font-size:13px;">${I("x")} Quit</button>
        </div>

        <div class="ev-row" style="justify-content:space-between">
          <div class="ev-pill">${I("list-ordered")} ${s.index + 1} / ${s.total}</div>
          <div class="ev-pill ev-timer" id="timerPill">${I("clock")} <span id="timerVal"></span></div>
        </div>

        <div class="ev-progress" aria-label="Progress">
          <div id="bar" style="width:${progressPct}%"></div>
        </div>

        <div class="ev-word" id="questionWord"></div>
        <div class="ev-note"><span class="ev-kbd">${pretty(q.qLang)}</span> → choose <span class="ev-kbd">${pretty(q.aLang)}</span></div>

        <div class="ev-answers" id="answers"></div>

        <div class="ev-row" style="justify-content:space-between;margin-top:12px">
          <div class="ev-pill">${I("check-circle")} ${s.correct}</div>
          <div class="ev-pill">${I("x-circle")} ${s.wrong}</div>
          <div class="ev-pill">${I("flame")} Streak ${s.streak}</div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#quitBtn").addEventListener("click", () => renderHomeScreen());

    const qEl = $("#questionWord");
    qEl.textContent = q.qText;
    qEl.dataset.text = q.qText;

    // Apply difficulty effects
    const fx = chooseEffect(s.difficulty);
    let revealTimeout = null;

    const applyMask = () => {
      if (!fx.mask) return;
      qEl.classList.add("masked");
      const reveal = async () => {
        qEl.classList.remove("masked");
        clearTimeout(revealTimeout);
        revealTimeout = setTimeout(() => qEl.classList.add("masked"), cfg.revealMs || 800);
      };
      qEl.addEventListener("click", reveal, { once: false });
      // first reveal after 250ms is off; user must tap to reveal.
    };

    if (fx.blink) qEl.classList.add("blink");
    if (fx.glitch) qEl.classList.add("glitch");
    applyMask();

    // Timer
    let remaining = cfg.seconds || 0;
    let timerId = null;
    const timerPill = $("#timerPill");
    const timerVal = $("#timerVal");
    const startPerf = performance.now();

    const updateTimerUI = () => {
      if (!timerVal) return;
      timerVal.textContent = (!remaining) ? "∞" : `${remaining}s`;
    };
    updateTimerUI();

    let locked = false;
    const lock = () => (locked = true);

    const timeUp = async () => {
      if (locked) return;
      lock();
      await play(sndWrong);
      await showAnswer(null, q.aText, opts, /*correctIdx*/ -1, /*chosen*/ null, /*timeUp*/ true);
      s.wrong++;
      s.streak = 0;
      s.timesMs.push(Math.round(performance.now() - startPerf));
      s.index++;
      await sleep(650);
      await runSoloQuestion(deck, cfg);
    };

    if (remaining > 0) {
      timerId = setInterval(() => {
        remaining--;
        updateTimerUI();
        if (remaining <= 0) {
          clearInterval(timerId);
          timeUp();
        }
      }, 1000);
    } else {
      if (timerVal) timerVal.textContent = "∞";
    }

    // Answers
    const answersEl = $("#answers");
    const correctIdx = opts.findIndex((t) => t === q.aText);

    for (const opt of opts) {
      const btn = document.createElement("button");
      btn.className = "ev-answer";
      btn.textContent = opt;
      btn.addEventListener("click", async () => {
        if (locked) return;
        lock();
        if (timerId) clearInterval(timerId);

        const ms = Math.round(performance.now() - startPerf);
        s.timesMs.push(ms);

        const isCorrect = opt === q.aText;
        if (isCorrect) {
          await play(sndCorrect);
          s.correct++;
          s.streak++;
          s.bestStreak = Math.max(s.bestStreak, s.streak);
          s.correctWordIds.add(word.id);
        } else {
          await play(sndWrong);
          s.wrong++;
          s.streak = 0;
        }

        await showAnswer(opt, q.aText, opts, correctIdx, opt, false);

        await sleep(650);
        s.index++;
        await runSoloQuestion(deck, cfg);
      });
      answersEl.appendChild(btn);
    }
  }

  async function showAnswer(opt, correct, opts, correctIdx, chosen, timeUp) {
    const buttons = $$(".ev-answer", app);

    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === correct) b.classList.add("good");
      if (!timeUp && chosen && b.textContent === chosen && chosen !== correct) b.classList.add("bad");
    });
  }

  async function finishSolo() {
    const s = state.session;
    if (!s) return;

    const endedAtMs = Date.now();
    const total = s.total || 1;
    const percent = Math.round((s.correct / total) * 100);
    const avgMs = s.timesMs.length ? Math.round(s.timesMs.reduce((a, b) => a + b, 0) / s.timesMs.length) : 0;


    // If this is a listening module and the student completed it, unlock access.
    // (hasaccess is never downgraded once true)
    if (state.type === "listeningwords") {
      await ensureListeningAccessNode();
      if (percent >= COMPLETE_THRESHOLD) {
        await setListeningAccessTrue({ endedAtMs, percent });
      }
    }

    // Write stats & marks (best-effort; don’t block UX on failure)
    try {
      await saveSoloStats({
        percent,
        avgMs,
        endedAtMs,
      });
    } catch (e) {
      console.warn("Stats save failed:", e);
    }

    try {
      await updateVocabProgress({
        percent,
        avgMs,
        endedAtMs,
      });
    } catch (e) {
      console.warn("Progress save failed:", e);
    }

    try {
      await markCorrectWords();
    } catch (e) {
      console.warn("Mark words failed:", e);
    }

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const backLabel = state.type === "unitwords"
      ? `Back to Unit: ${pretty(state.name)}`
      : `Back to Listening: ${pretty(state.name)}`;

    app.innerHTML = `
      <div class="top-bar">
        <button class="lofi-toggle" type="button" id="finishCornerBtn">${I("arrow-left")} ${backLabel}</button>
      </div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">Difficulty: ${pretty(s.difficulty)}</div>
        </div>

        <h3 class="ev-h">Results</h3>
        <p class="ev-sub">Test finished. Press the button below to go back.</p>

        <div class="ev-row" style="justify-content:space-between">
          <div class="ev-pill">${I("check-circle")} Correct: <b>${s.correct}</b></div>
          <div class="ev-pill">${I("x-circle")} Wrong: <b>${s.wrong}</b></div>
          <div class="ev-pill">${I("target")} Score: <b>${percent}%</b></div>
        </div>

        <div class="ev-row" style="justify-content:space-between;margin-top:10px">
          <div class="ev-pill">${I("zap")} Avg time: <b>${avgMs}ms</b></div>
          <div class="ev-pill">${I("flame")} Best streak: <b>${s.bestStreak}</b></div>
        </div>

        <div class="ev-row" style="margin-top:14px">
          <button class="ev-btn" type="button" id="finishBtn" style="width:100%">${I("arrow-left")} ${backLabel}</button>
        </div>
      </div>
    `;

    refreshIcons();

    const goBack = () => {
      location.href = providerUrl();
    };
    $("#finishBtn").addEventListener("click", goBack);
    $("#finishCornerBtn").addEventListener("click", goBack);
  }

  async function saveSoloStats(extra) {
    const s = state.session;
    if (!s || !state.uid) return;

    const { db, ref, set, push, runTransaction } = fb;

    const endedAtMs = extra.endedAtMs || Date.now();
    const total = s.total || 1;
    const percent = Number(extra.percent) || Math.round((s.correct / total) * 100);

    const base = `students/${state.uid}/stats/vocabTests/${state.type}/${safeKey(state.name)}`;

    // 1) history (append)
    const histRef = push(ref(db, `${base}/history`));
    await set(histRef, {
      mode: "solo",
      difficulty: s.difficulty,
      startedAtMs: s.startedAtMs,
      endedAtMs,
      total: s.total,
      correct: s.correct,
      wrong: s.wrong,
      percent,
      avgMs: Number(extra.avgMs) || 0,
      bestStreak: s.bestStreak,
    });

    // 2) summary (transaction)
    await runTransaction(ref(db, `${base}/summary`), (curr) => {
      const c = curr && typeof curr === "object" ? curr : {};
      const attempts = Number(c.attempts || 0) + 1;
      const totalCorrect = Number(c.totalCorrect || 0) + Number(s.correct || 0);
      const totalWrong = Number(c.totalWrong || 0) + Number(s.wrong || 0);
      return {
        attempts,
        totalCorrect,
        totalWrong,
        lastAttemptAtMs: endedAtMs,
        lastPercent: percent,
        lastDifficulty: s.difficulty,
      };
    });

    // 3) best (transaction)
    await runTransaction(ref(db, `${base}/best`), (curr) => {
      const c = curr && typeof curr === "object" ? curr : null;
      const bestPercent = Number(c?.bestPercent || 0);
      if (percent > bestPercent) {
        return {
          bestPercent: percent,
          bestCorrect: s.correct,
          bestTotal: s.total,
          bestAtMs: endedAtMs,
          bestDifficulty: s.difficulty,
        };
      }
      return c || {
        bestPercent,
      };
    });
  }

  
  const COMPLETE_THRESHOLD = 80;

  async function ensureListeningAccessNode() {
    try {
      if (!state.uid) return;
      if (state.type !== "listeningwords") return;

      const { db, ref, runTransaction } = fb;
      const moduleKey = safeKey(state.name);
      const path = `students/${state.uid}/vocabularies/listeningwords/${moduleKey}`;
      const now = Date.now();

      await runTransaction(ref(db, path), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const hasaccess = c.hasaccess === true; // never downgrade true -> false
        return {
          ...c,
          name: c.name || state.name,
          hasaccess,
          firstOpenedAtMs: Number(c.firstOpenedAtMs || now),
          lastOpenedAtMs: now,
        };
      });
    } catch (e) {
      console.warn("ensureListeningAccessNode failed:", e);
    }
  }

  async function setListeningAccessTrue({ endedAtMs, percent }) {
    try {
      if (!state.uid) return;
      if (state.type !== "listeningwords") return;

      const { db, ref, runTransaction } = fb;
      const moduleKey = safeKey(state.name);
      const path = `students/${state.uid}/vocabularies/listeningwords/${moduleKey}`;

      await runTransaction(ref(db, path), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const wasTrue = c.hasaccess === true;

        return {
          ...c,
          name: c.name || state.name,
          hasaccess: true,
          unlockedAtMs: Number(c.unlockedAtMs || endedAtMs),
          lastAttemptAtMs: endedAtMs,
          lastPercent: Number(percent || 0),
          completedAtMs: wasTrue ? Number(c.completedAtMs || endedAtMs) : endedAtMs,
        };
      });
    } catch (e) {
      console.warn("setListeningAccessTrue failed:", e);
    }
  }

  async function updateVocabProgress(extra) {
    const s = state.session;
    if (!s || !state.uid) return;

    const { db, ref, runTransaction } = fb;

    const endedAtMs = Number(extra?.endedAtMs || 0) || Date.now();
    const total = s.total || 1;
    const percent = Number(extra?.percent || 0) || Math.round((s.correct / total) * 100);
    const avgMs = Number(extra?.avgMs || 0) || 0;

    // We keep LEGACY bucket names for backwards compatibility (your export already has them),
    // but ALSO write to clean bucket names so new UIs can read them.
    // - legacy:  unitswords / listeningswords
    // - clean:   unitwords / listeningwords
    const bucketClean = state.type; // unitwords | listeningwords
    const bucketLegacy = state.type === "unitwords" ? "unitswords" : "listeningswords";
    const buckets = Array.from(new Set([bucketClean, bucketLegacy]));

    const moduleKey = safeKey(state.name);

    async function writeProgressTo(bucketName, trackLegacyCompletion) {
      const progPath = `students/${state.uid}/progress/vocabularies/${bucketName}/${moduleKey}`;

      let becameCompleted = false;

      const txRes = await runTransaction(ref(db, progPath), (curr) => {
        const c = curr && typeof curr === "object" ? curr : {};
        const attempts = Number(c.attempts || 0) + 1;

        const prevBest = Number(c.bestPercent || 0);
        const bestPercent = percent > prevBest ? percent : prevBest;

        const completedNow = percent >= COMPLETE_THRESHOLD;
        const wasCompleted = !!c.completed;
        const completed = wasCompleted || completedNow;

        if (trackLegacyCompletion && !wasCompleted && completedNow) becameCompleted = true;

        const firstAttemptAtMs = Number(c.firstAttemptAtMs || s.startedAtMs || endedAtMs);

        return {
          name: state.name,
          type: state.type,
          bucket: bucketName,
          completed,
          attempts,
          bestPercent,
          lastPercent: percent,
          lastDifficulty: s.difficulty,

          // last run details
          lastTotal: s.total,
          lastCorrect: s.correct,
          lastWrong: s.wrong,
          lastAvgMs: avgMs,

          // timestamps
          firstAttemptAtMs,
          firstAttemptAt: c.firstAttemptAt || new Date(firstAttemptAtMs).toISOString(),
          lastAttemptAtMs: endedAtMs,
          lastAttemptAt: new Date(endedAtMs).toISOString(),

          completedAtMs: (c.completedAtMs ?? null) || (completedNow ? endedAtMs : null),
          completedAt: (c.completedAt ?? null) || (completedNow ? new Date(endedAtMs).toISOString() : null),
        };
      });

      return { txRes, becameCompleted };
    }

    // Write progress to both buckets
    let legacyRes = null;
    for (const b of buckets) {
      const isLegacy = b === bucketLegacy;
      const res = await writeProgressTo(b, isLegacy);
      if (isLegacy) legacyRes = res;
    }

    // Increment your "+1 vocabularies" counter ONLY when a module becomes completed
    // for the first time in the LEGACY bucket (so it doesn't double-count).
    if (legacyRes?.becameCompleted && legacyRes?.txRes?.committed) {
      const countsBase = `students/${state.uid}/stats/vocabCounts`;
      await Promise.allSettled([
        runTransaction(ref(db, `${countsBase}/totalCompleted`), (n) => Number(n || 0) + 1),
        runTransaction(ref(db, `${countsBase}/${bucketLegacy}/completed`), (n) => Number(n || 0) + 1),
      ]);
    }
  }


async function markCorrectWords() {
    const s = state.session;
    if (!s || !state.uid) return;
    if (!s.correctWordIds || s.correctWordIds.size === 0) return;

    const { db, ref, update } = fb;

    const now = Date.now();
    const batch = {};
    for (const id of s.correctWordIds) {
      const w = state.vocab.find((x) => String(x.id) === String(id));
      if (!w || !w.eng) continue;

      // Must satisfy your validate rule: {text, unit, completed, timestamp}
      const wordKey = safeKey(`${state.type}_${state.name}_${id}`);
      batch[wordKey] = {
        text: String(w.eng).slice(0, 80),
        unit: String(`${state.type}/${state.name}`).slice(0, 40),
        completed: true,
        timestamp: now,
      };
    }

    if (Object.keys(batch).length) {
      await update(ref(db, `students/${state.uid}/marks/words`), batch);
    }
  }

  /* -----------------------
     8) GROUP MODE (online rooms) — RULES-COMPLIANT
     Rooms live at:
       vocabularies/{type}/{name}/pendingRooms/{roomId}

     ✅ This implementation matches your RTDB rules:
       - Room root is written ONLY by host.
       - Room root schema on create includes: createdAtMs, createdBy, hostUid, status, capacityOfPlayers, slots.s0
       - Join/leave happens ONLY via slots/s1..s5 (each player can only write their own slot while status=waiting)
       - status values are ONLY: waiting | started | finished | cancelled
       - results/$uid is written ONCE per player, only when status is started/finished, and matches validate.
  ------------------------ */

  const ROOM_TTL_MS = 20 * 60 * 1000; // hide very old waiting rooms (client-side)

  state.myProfile = null;   // {name, username}
  state._roomsUnsub = null; // live list unsub
  state._roomUnsub = null;  // active room unsub
  state.currentRoomId = null;
  state.currentRoom = null; // latest snapshot of the room
  state.roomGame = null;    // local match state

  // Visual names without changing rules:
  // Rules allow reading students/usernames (username -> uid). We reverse it to uid -> username for display.
  state.uidToUsername = null; // { [uid]: username }
  state._uidToUsernamePromise = null;

  function roomsBasePath() {
    return `vocabularies/${state.type}/${state.name}/pendingRooms`;
  }

  const shortUid = (uid) => {
    const s = String(uid || "");
    if (s.length <= 10) return s;
    return `${s.slice(0, 6)}…${s.slice(-4)}`;
  };

  async function ensureUidToUsername() {
    if (state.uidToUsername) return state.uidToUsername;
    if (state._uidToUsernamePromise) return state._uidToUsernamePromise;

    const { db, ref, get } = fb;
    state._uidToUsernamePromise = (async () => {
      try {
        const snapA = await get(ref(db, "students/usernames"));
        const snapB = await get(ref(db, "usernames"));
        const mapA = snapA.exists() ? snapA.val() : {};
        const mapB = snapB.exists() ? snapB.val() : {};
        // Merge username->uid maps (prefer students/usernames if duplicates)
        const rev = {};
        const addMap = (m) => {
          if (!m || typeof m !== "object") return;
          for (const [uname, uid] of Object.entries(m)) {
            if (typeof uid === "string" && uid && typeof uname === "string" && uname) {
              // Don't overwrite an existing username for the uid unless it's empty
              if (!rev[uid]) rev[uid] = uname;
            }
          }
        };
        addMap(mapA);
        addMap(mapB);
        state.uidToUsername = rev;
      } catch {
        state.uidToUsername = {};
      } finally {
        state._uidToUsernamePromise = null;
      }

      // Re-render current screen with nicknames (purely visual)
      try {
        if (state.currentRoomId && state.currentRoom) {
          const st = String(state.currentRoom.status || "waiting");
          if (st === "waiting") renderRoomLobby(state.currentRoomId, state.currentRoom);
          else if (st === "finished") renderRoomResults(state.currentRoomId, state.currentRoom);
          else if (st === "started" && state.roomGame) renderRoomGameScreen();
        }
      } catch {}

      return state.uidToUsername;
    })();

    return state._uidToUsernamePromise;
  }

  function displayUser(uid) {
    if (!uid) return "";
    if (uid === state.uid) return "You";
    const uname = state.uidToUsername && state.uidToUsername[uid];
    if (uname) return `@${uname}`;
    return "Guest";
  }

  function getSlots(room) {
    const slots = room?.slots;
    if (!slots || typeof slots !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(slots)) {
      if (typeof v === "string" && v) out[k] = String(v);
    }
    return out;
  }

  function slotsInCapacity(cap) {
    const keys = [];
    for (let i = 0; i < cap; i++) keys.push(`s${i}`);
    return keys;
  }

  function countFromSlots(slots) {
    return Object.values(slots || {}).filter(Boolean).length;
  }

  function findMySlotKey(room) {
    const slots = getSlots(room);
    for (const [k, v] of Object.entries(slots)) {
      if (v === state.uid) return k;
    }
    return null;
  }

  function stopRoomsTicker() {
    try { if (typeof state._roomsUnsub === "function") state._roomsUnsub(); } catch {}
    state._roomsUnsub = null;
  }

  function stopRoomWatcher() {
    try { if (typeof state._roomUnsub === "function") state._roomUnsub(); } catch {}
    state._roomUnsub = null;

    // Stop presence/edge-case timers for group mode
    stopPresence();
    try { if (state._opponentLeftTimer) clearTimeout(state._opponentLeftTimer); } catch {}
    state._opponentLeftTimer = null;

    state.currentRoomId = null;
    state.currentRoom = null;
    state.roomGame = null;
  }


  async function ensureMyProfileLoaded() {
    if (state.myProfile) return state.myProfile;
    const { db, ref, get } = fb;
    try {
      const snap = await get(ref(db, `students/${state.uid}/profile`));
      const p = snap.exists() ? snap.val() : {};
      const name =
        (p && (p.username || p.name || [p.first_name, p.last_name].filter(Boolean).join(" "))) ||
        state.user?.displayName ||
        (state.user?.email ? state.user.email.split("@")[0] : "Player");
      state.myProfile = {
        name: String(name || "Player").slice(0, 40),
        username: p?.username ? String(p.username).slice(0, 30) : "",
      };
    } catch {
      state.myProfile = { name: "Player", username: "" };
    }
    return state.myProfile;
  }

  function inviteLink(roomId) {
    const u = new URL(location.href);
    u.searchParams.set("type", state.type);
    u.searchParams.set("name", state.name);
    u.searchParams.set("mode", "group");
    u.searchParams.set("room", roomId);
    return u.toString();
  }

  function normalizeRooms(raw) {
    const out = [];
    const now = Date.now();
    if (!raw || typeof raw !== "object") return out;

    for (const [roomId, r] of Object.entries(raw)) {
      if (!r || typeof r !== "object") continue;

      const status = String(r.status || "waiting");
      if (status !== "waiting") continue;

      const createdAtMs = Number(r.createdAtMs || 0) || 0;
      if (createdAtMs && now - createdAtMs > ROOM_TTL_MS) continue;

      const cap = clamp(Number(r.capacityOfPlayers || 2) || 2, 2, 6);
      const slots = getSlots(r);
      const currentCount = countFromSlots(slots);
      const available = Math.max(0, cap - currentCount);

      out.push({
        roomId,
        hostUid: String(r.hostUid || ""),
        hostName: String(r.hostName || ""),
        createdAtMs,
        cap,
        currentCount,
        available,
        settings: r.settings || {},
        raw: r,
      });
    }

    // newest first
    out.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return out;
  }

  function renderRoomsInto(mountId, rooms, { limit = 6 } = {}) {
    const el = document.getElementById(mountId);
    if (!el) return;

    if (!rooms.length) {
      el.innerHTML = `<div class="ev-mini ev-muted">${I("sparkles")} No live rooms yet. Create one and invite your classmates.</div>`;
      refreshIcons();
      return;
    }

    const slice = rooms.slice(0, limit);
    el.innerHTML = slice
      .map((r) => {
        const mine = r.hostUid === state.uid;
        const canJoin = r.available > 0 && !mine;
        const s = r.settings || {};
        return `
          <div class="ev-roomcard">
            <div class="ev-roomcard-top">
              <div class="ev-roommeta">
                <span class="ev-badge">${I("crown")} ${mine ? "Your room" : (r.hostName || "Host")}</span>
                <span class="ev-badge">${I("users")} ${r.currentCount}/${r.cap}</span>
                <span class="ev-badge">${I("activity")} ${pretty(s.difficulty || state.settings.difficulty)}</span>
              </div>
              <div class="ev-roommeta">
                <span class="ev-badge ev-code">${r.roomId}</span>
                <button class="ev-btn" type="button" data-join="${r.roomId}" ${canJoin ? "" : "disabled"} style="padding:10px 12px;font-size:13px;">
                  ${I(canJoin ? "log-in" : "lock")} ${canJoin ? "Join" : "Full"}
                </button>
              </div>
            </div>
            <div class="ev-mini ev-muted" style="margin-top:8px">
              ${I("arrow-right-left")} ${pretty(s.direction || state.settings.direction)} ·
              ${I("list-ordered")} ${Number(s.count || state.settings.count)} Q ·
              ${I("layers")} ${Number(s.options || state.settings.options)} choices
            </div>
          </div>
        `;
      })
      .join("");

    refreshIcons();

    $$("button[data-join]", el).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const roomId = btn.getAttribute("data-join");
        if (!roomId) return;
        await play(sndClick);
        openRoom(roomId, { autoJoin: true });
      });
    });
  }

  /* -----------------------
     7.5) GROUP room helpers: presence + finish lock (race-safe)
  ------------------------ */

  function myPresencePath(roomId) {
    return `${roomsBasePath()}/${roomId}/presence/${state.uid}`;
  }

  async function startPresence(roomId) {
    if (!fb || !roomId) return;
    // Already running for this room
    if (state._presenceRoomId === roomId && state._presenceInterval) return;

    stopPresence();

    state._presenceRoomId = roomId;

    const { db, ref, set, onDisconnect } = fb;
    const pRef = ref(db, myPresencePath(roomId));

    // initial write
    try {
      await set(pRef, { connected: true, lastSeenAtMs: Date.now() });
      try {
        onDisconnect(pRef).set({
          connected: false,
          lastSeenAtMs: Date.now(),
          disconnectedAt: fb.serverTimestamp(),
        });
      } catch {}
    } catch (e) {
      console.warn("presence write failed:", e);
    }

    state._presenceInterval = setInterval(async () => {
      try {
        await set(pRef, { connected: true, lastSeenAtMs: Date.now() });
      } catch {}
    }, 6000);
  }

  function stopPresence() {
    try { if (state._presenceInterval) clearInterval(state._presenceInterval); } catch {}
    state._presenceInterval = null;
    state._presenceRoomId = null;
  }

  function getRoomUids(room) {
    const cap = clamp(Number(room?.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room || {});
    return slotsInCapacity(cap).map((k) => slots[k]).filter(Boolean);
  }

  function getFinishInfo(room) {
    const g = room?.game || {};
    const finish = (g && typeof g === "object" && g.finish && typeof g.finish === "object") ? g.finish : null;
    if (finish && (finish.winnerUid || finish.finishedAtMs)) return finish;
    // compatibility: legacy root fields
    if (room?.winnerUid || room?.finishedAtMs) {
      return {
        winnerUid: room?.winnerUid || "",
        finishedAtMs: Number(room?.finishedAtMs || 0) || 0,
        reason: "legacy",
      };
    }
    return null;
  }

    async function attemptFinishLock(roomId, { triggerUid, winnerUid, reason } = {}) {
    // ✅ Atomic, race-safe lock on rooms/{roomId}/game
    // IMPORTANT:
    // - When someone completes ALL questions, we end the match (stop everyone),
    //   BUT the winner is decided by who found more (correct/score), not "first submit".
    const { db, ref, runTransaction, update } = fb;

    const now = Date.now();
    const tUid = String(triggerUid || state.uid || "");
    const wUid = String(winnerUid || ""); // only set for hard outcomes (forfeit / opponent_left etc.)
    const r = String(reason || (wUid ? "forfeit" : "completed_all"));

    const gameRef = ref(db, `${roomsBasePath()}/${roomId}/game`);

    const tx = await runTransaction(gameRef, (g) => {
      const curr = (g && typeof g === "object") ? g : {};
      const st = String(curr.status || "playing");

      // Abort if already finished
      if (st === "finished" || (curr.finish && curr.finish.finishedAtMs)) return;

      // Only allow transition from "playing"
      if (st !== "playing") return curr;

      const finish = {
        finishedAtMs: now,
        reason: r,
        triggerUid: tUid,
      };

      // Only include winnerUid when it's truly known immediately (e.g., forfeit)
      if (wUid) finish.winnerUid = wUid;

      return {
        ...curr,
        status: "finished",
        finish,
      };
    });

    // Best-effort legacy/root updates (not relied on for correctness)
    try {
      const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
      const patch = {
        status: "finished",
        updatedAtMs: now,
        finishedAtMs: now,
      };
      // Only set root winnerUid when it's truly known immediately
      if (wUid) patch.winnerUid = wUid;
      await update(roomRef, patch);
    } catch {}

    return !!tx?.committed;
  }

  function updateOpponentLeftTimer(roomId, room) {
    // Policy (B): auto-finish after timeout when <2 connected players remain
    if (!roomId || !room) return;
    const status = String(room.status || "");
    const gStatus = String(room?.game?.status || "");
    if (status !== "started" || gStatus !== "playing") {
      // no countdown outside active game
      if (state._opponentLeftTimer) {
        clearTimeout(state._opponentLeftTimer);
        state._opponentLeftTimer = null;
      }
      return;
    }

    const uids = getRoomUids(room);
    const presence = (room.presence && typeof room.presence === "object") ? room.presence : {};
    const now = Date.now();

    const connected = uids.filter((uid) => {
      const p = presence[uid];
      if (!p || typeof p !== "object") return false;
      if (p.connected !== true) return false;
      const t = Number(p.lastSeenAtMs || 0);
      if (!t) return false;
      return (now - t) <= 15000; // heartbeat window
    });

    if (connected.length >= 2) {
      if (state._opponentLeftTimer) {
        clearTimeout(state._opponentLeftTimer);
        state._opponentLeftTimer = null;
      }
      return;
    }

    if (state._opponentLeftTimer) return; // already counting

    state._opponentLeftTimer = setTimeout(async () => {
      state._opponentLeftTimer = null;

      const latest = state.currentRoom;
      if (!latest) return;

      const status2 = String(latest.status || "");
      const gStatus2 = String(latest?.game?.status || "");
      if (status2 === "finished" || gStatus2 === "finished") return;

      const uids2 = getRoomUids(latest);
      const pres2 = (latest.presence && typeof latest.presence === "object") ? latest.presence : {};
      const now2 = Date.now();
      const connected2 = uids2.filter((uid) => {
        const p = pres2[uid];
        if (!p || typeof p !== "object") return false;
        if (p.connected !== true) return false;
        const t = Number(p.lastSeenAtMs || 0);
        return t && (now2 - t) <= 15000;
      });

      if (connected2.length < 2) {
        try {
          await attemptFinishLock(roomId, { winnerUid: state.uid, reason: "opponent_left" });
        } catch (e) {
          console.warn("opponent_left finish failed:", e);
        }
      }
    }, 15000);
  }



  function startRoomsTicker({ mountId = "roomsList", limit = 3 } = {}) {
    if (!fb || !state.type || !state.name) return;

    stopRoomsTicker();

    const { db, ref, onValue } = fb;
    const base = ref(db, roomsBasePath());
    state._roomsUnsub = onValue(
      base,
      (snap) => {
        const rooms = normalizeRooms(snap.val());
        renderRoomsInto(mountId, rooms, { limit });
      },
      (err) => {
        console.error("rooms ticker:", err);
        const el = document.getElementById(mountId);
        if (el) el.innerHTML = `<div class="ev-mini ev-muted">${I("alert-triangle")} Could not load rooms.</div>`;
        refreshIcons();
      }
    );
  }

  async function createRoom(capacityOfPlayers) {
    const { db, ref, push, set } = fb;
    
    try {
      const profile = await ensureMyProfileLoaded();
      const cap = clamp(Number(capacityOfPlayers || 2) || 2, 2, 6);
      const now = Date.now();

      const baseRef = ref(db, roomsBasePath());
      const roomRef = push(baseRef);
      const roomId = roomRef.key;

      // Difficulty for GROUP must be an object (synced + deterministic)
      const diffObj = normalizeDifficultySetting(state.settings.difficulty);
      diffObj.seed = makeSeed(); // fresh seed per room by default

      // ✅ Must match Firebase validation rules:
      // createdAtMs, createdBy, hostUid, status, capacityOfPlayers, slots.s0
      const room = {
        createdAtMs: now,
        createdBy: state.uid,
        hostUid: state.uid,
        status: "waiting",
        capacityOfPlayers: cap,
        slots: { s0: state.uid },

        // extras allowed:
        updatedAtMs: now,
        hostName: profile.username || profile.name,
        settings: {
          difficulty: diffObj,  // Now has BOOLEAN effects!
          direction: state.settings.direction,
          count: clamp(Number(state.settings.count || 15), 5, 50),
          options: clamp(Number(state.settings.options || 4), 2, 6),
        },
      };

      // Debug: Log the data structure being sent
      if (console && console.log) {
        console.log("Creating room with data:", {
          roomId,
          effects: room.settings.difficulty.effects,  // Check if booleans
          fullRoom: room
        });
      }

      await set(roomRef, room);
      return roomId;
      
    } catch (error) {
      console.error("Room creation failed:", error);
      
      // Provide helpful error messages
      if (error.code === "PERMISSION_DENIED") {
        throw new Error(
          "⚠️ Could not create room: Database permission denied.\n\n" +
          "Possible causes:\n" +
          "• You're not logged in properly\n" +
          "• Your session has expired\n" +
          "• Database validation rules failed\n\n" +
          "Try refreshing the page or logging in again."
        );
      }
      
      throw error;
    }
  }



  async function joinRoom(roomId) {
    const { db, ref, get, set, onDisconnect, remove } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) throw new Error("Room not found.");

    const room = snap.val();
    if (String(room.status || "waiting") !== "waiting") throw new Error("Room already started.");

    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    // Already inside?
    for (const [k, v] of Object.entries(slots)) {
      if (v === state.uid) return { slotKey: k, already: true };
    }

    // Try claim a free slot s1..s{cap-1}
    for (let i = 1; i < cap; i++) {
      const key = `s${i}`;
      const slotRef = ref(db, `${roomsBasePath()}/${roomId}/slots/${key}`);
      try {
        await set(slotRef, state.uid);
        // auto-clean while waiting (if match starts, rules will block removal — that’s okay)
        try { onDisconnect(slotRef).remove(); } catch {}
        return { slotKey: key, already: false };
      } catch (e) {
        // denied or taken -> try next
      }
    }

    throw new Error("Room is full.");
  }

  async function leaveRoom(roomId) {
    const { db, ref, get, remove, set } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const snap = await get(roomRef);
    if (!snap.exists()) return;

    const room = snap.val();
    const status = String(room.status || "waiting");

    // If host leaves while waiting -> delete the room (allowed by your rules)
    if (room.hostUid === state.uid && status === "waiting") {
      await set(roomRef, null);
      return;
    }

    // Non-host can only leave while waiting (slot rules enforce this)
    const mySlot = findMySlotKey(room);
    if (!mySlot || mySlot === "s0") return;

    await remove(ref(db, `${roomsBasePath()}/${roomId}/slots/${mySlot}`));
  }

  async function startMatch(roomId) {
    const { db, ref, get, update } = fb;

    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
    const roomSnap = await get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found.");
    const room = roomSnap.val();

    if (room.hostUid !== state.uid) throw new Error("Only host can start.");
    if (String(room.status || "waiting") !== "waiting") throw new Error("Room already started.");

    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    // Your validate requires s1 exists when status becomes "started"
    if (!slots.s1) throw new Error("Need at least 2 players to start.");

    const settings = room.settings || state.settings;
    const total = clamp(Number(settings.count || 15), 5, 50);

    // Snapshot and LOCK difficulty settings for the match.
    // Source of truth: rooms/{roomId}/settings/difficulty (object). (We also store a copy in game.)
    const diffObj = normalizeDifficultySetting(settings.difficulty || state.settings.difficulty);

    const deck = shuffle(state.vocab)
      .slice(0, Math.min(state.vocab.length, total))
      .map((w) => String(w.id));

    const now = Date.now();

    await update(roomRef, {
      status: "started",
      updatedAtMs: now,
      // lock settings at start (clients hide controls when status !== waiting)
      "settings/difficulty": diffObj,
      game: {
        startedAtMs: now,
        wordIds: deck,
        difficulty: diffObj,                 // object (synced)
        direction: settings.direction || state.settings.direction,
        count: total,
        options: clamp(Number(settings.options || 4), 2, 6),
        status: "playing",                  // "playing" | "finished"
        finish: null,                       // {winnerUid, finishedAtMs, reason}
      },
      // reset legacy finish fields (kept for compatibility with existing UI)
      winnerUid: null,
      finishedAtMs: null,
      ranked: null,
      results: null,
      // presence is transient; don't reset to avoid permission issues
    });
  }


  function openGroupArena() {
    injectStyles();
    // Load uid->username map (visual only)
    ensureUidToUsername().catch(() => {});
    stopRoomWatcher(); // if you were inside a room
    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <button class="ev-btn" type="button" id="backHomeBtn" style="padding:8px 10px;opacity:.9">${I("arrow-left")} Back</button>
        </div>

        <h3 class="ev-h">${I("users")} Group Arena</h3>
        <p class="ev-sub">Create a room or join someone in <b>${pretty(state.name)}</b>.</p>

        <div class="ev-split">
          <div class="ev-panel">
            <div class="ev-row" style="justify-content:space-between;align-items:center">
              <div class="ev-pill">${I("plus-circle")} Create room</div>
              <span class="ev-mini ev-muted">${I("shield")} Same-module only</span>
            </div>

            <div class="ev-row" style="margin-top:10px">
              <label class="ev-pill">${I("users")} Capacity
                <select id="capSel" class="ev-select">
                  ${[2,3,4,5,6].map((n)=>`<option value="${n}" ${n===2?"selected":""}>${n}</option>`).join("")}
                </select>
              </label>
              <button class="ev-btn" type="button" id="createRoomBtn">${I("sparkles")} Create</button>
            </div>

            <div class="ev-row" style="margin-top:10px">
              <input id="joinCode" class="ev-input" placeholder="Room code (example: -Nxyz...)" style="flex:1;min-width:220px" />
              <button class="ev-btn" type="button" id="joinByCodeBtn">${I("log-in")} Join</button>
            </div>

            <div class="ev-mini ev-muted" style="margin-top:10px">
              ${I("settings")} Uses your current settings: <b>${pretty(state.settings.difficulty)}</b>,
              <b>${pretty(state.settings.direction)}</b>, <b>${state.settings.count} Q</b>, <b>${state.settings.options} choices</b>.
            </div>
          </div>

          <div class="ev-panel">
            <div class="ev-row" style="justify-content:space-between;align-items:center">
              <div class="ev-pill">${I("radio")} Live rooms</div>
              <button class="ev-btn" type="button" id="refreshRoomsBtn" style="padding:10px 12px;font-size:13px;">${I("refresh-cw")} Refresh</button>
            </div>
            <div id="arenaRoomsList" class="ev-roomlist" style="margin-top:10px">
              <div class="ev-mini ev-muted">${I("loader")} Loading rooms…</div>
            </div>
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#backHomeBtn").addEventListener("click", () => renderHomeScreen());

    $("#refreshRoomsBtn").addEventListener("click", async () => {
      await play(sndClick);
      startRoomsTicker({ mountId: "arenaRoomsList", limit: 8 });
    });

    $("#createRoomBtn").addEventListener("click", async () => {
      await play(sndClick);
      const cap = Number($("#capSel").value) || 2;
      try {
        renderLoading("Creating room…");
        const roomId = await createRoom(cap);
        openRoom(roomId, { autoJoin: false });
      } catch (e) {
        console.error(e);
        renderError("Could not create the room. Check your rules/permissions.");
      }
    });

    $("#joinByCodeBtn").addEventListener("click", async () => {
      await play(sndClick);
      const code = String($("#joinCode").value || "").trim();
      if (!code) return;
      openRoom(code, { autoJoin: true });
    });

    startRoomsTicker({ mountId: "arenaRoomsList", limit: 8 });
  }

  async function openRoom(roomId, { autoJoin = true } = {}) {
    injectStyles();
    // Load uid->username map (visual only)
    ensureUidToUsername().catch(() => {});
    stopRoomsTicker();
    stopRoomWatcher();

    const { db, ref, onValue } = fb;
    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);

    // auto join (claim a slot)
    if (autoJoin) {
      try {
        await joinRoom(roomId);
      } catch (e) {
        console.warn("join:", e);
      }
    }

    state.currentRoomId = roomId;

    state._roomUnsub = onValue(
      roomRef,
      async (snap) => {
        const room = snap.exists() ? snap.val() : null;
        state.currentRoom = room;

        if (!room) {
          renderError("This room no longer exists.");
          return;
        }

        const status = String(room.status || "waiting");

        // Presence: start only if I'm actually in slots
        const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
        const slots = getSlots(room);
        const inRoom = slotsInCapacity(cap).some((k) => slots[k] === state.uid);

        if ((status === "waiting" || status === "started") && inRoom) {
          startPresence(roomId).catch(() => {});
        } else {
          stopPresence();
        }

        if (status === "waiting") {
          // no opponent-left timer while waiting
          if (state._opponentLeftTimer) {
            clearTimeout(state._opponentLeftTimer);
            state._opponentLeftTimer = null;
          }
          renderRoomLobby(roomId, room);
          return;
        }

        if (status === "started") {
          // If I'm not in slots, don't let me play
          if (!inRoom) {
            renderError("You are not in this room (or you joined too late).");
            return;
          }

          // If game already finished (even if root status is still started), jump to results.
          const gStatus = String(room?.game?.status || "");
          if (gStatus === "finished" || getFinishInfo(room)) {
            // Ensure I record my final result once (partial if needed)
            if (state.roomGame && !state.roomGame.submitted) {
              await finishRoomGame({ cause: "room_finished", skipLock: true });
            }
            state.roomGame = null;
            try { if (room.hostUid === state.uid) tryFinalizeRoom(roomId).catch(() => {}); } catch {}
            renderRoomResults(roomId, room);
            return;
          }

          // Disconnect policy (B): auto-finish after timeout when opponent leaves
          updateOpponentLeftTimer(roomId, room);

          if (!state.roomGame) {
            await beginRoomGame(roomId, room);
          } else {
            renderRoomGameScreen();
          }
          return;
        }

        if (status === "finished") {
          // stop timers and presence
          stopPresence();
          if (state._opponentLeftTimer) {
            clearTimeout(state._opponentLeftTimer);
            state._opponentLeftTimer = null;
          }

          // Ensure my result exists (idempotent)
          if (state.roomGame && !state.roomGame.submitted) {
            await finishRoomGame({ cause: "room_finished", skipLock: true });
          }

          state.roomGame = null;
          try { if (room.hostUid === state.uid) tryFinalizeRoom(roomId).catch(() => {}); } catch {}
          renderRoomResults(roomId, room);
          return;
        }

        // cancelled or unknown
        renderError("This room was cancelled.");
      },
      (err) => {
        console.error("room watcher:", err);
        renderError("Could not watch this room.");
      }
    );
  }



  function renderRoomLobby(roomId, room) {
    state.roomGame = null;

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const host = room.hostUid === state.uid;
    const cap = clamp(Number(room.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);

    const joinUrl = inviteLink(roomId);
    const keys = slotsInCapacity(cap);

    const playersCount = keys.map((k) => slots[k]).filter(Boolean).length;

    const diffObj = normalizeDifficultySetting(room.settings?.difficulty || state.settings.difficulty);
    const diffLabel = prettyDifficulty(diffObj);
    const dirLabel = pretty(room.settings?.direction || state.settings.direction);

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${I("swords")} Room</span>
            <span class="ev-pill ev-code">${roomId}</span>
          </div>
          <button class="ev-btn" type="button" id="backArenaBtn" style="padding:8px 10px;opacity:.9">${I("arrow-left")} Arena</button>
        </div>

        <h3 class="ev-h">${host ? "You are the host" : "Waiting for host"}</h3>
        <p class="ev-sub">${I("users")} Players: <b>${playersCount}/${cap}</b> · ${I("settings")} ${diffLabel} · ${dirLabel}</p>

        <div class="ev-panel">
          <div class="ev-list">
            ${keys
              .map((k, idx) => {
                const uid = slots[k] || "";
                const isHost = k === "s0";
                const who = uid ? displayUser(uid) : "Empty";
                return `
                  <div class="ev-row" style="justify-content:space-between">
                    <div class="ev-pill">${I(uid ? "user" : "circle")} <b>Seat ${idx + 1}:</b> ${who}</div>
                    ${isHost ? `<span class="ev-badge">${I("crown")} Host</span>` : (uid ? `<span class="ev-badge">${I("circle")} Joined</span>` : `<span class="ev-badge">${I("minus")} Free</span>`)}
                  </div>
                `;
              })
              .join("")}
          </div>

          ${host ? `
            <div class="ev-row" style="margin-top:14px;gap:10px;flex-wrap:wrap;align-items:center">
              <span class="ev-pill">${I("activity")} Difficulty</span>
              <select id="roomDiffSelect" class="ev-select" style="min-width:160px">
                ${["easy","normal","hard","nightmare"].map((lvl) => `<option value="${lvl}" ${diffObj.level===lvl?"selected":""}>${pretty(lvl)}</option>`).join("")}
              </select>
              <span class="ev-mini ev-muted">${I("info")} Synced to all players · Locks on start</span>
            </div>
          ` : `
            <div class="ev-mini ev-muted" style="margin-top:14px">${I("info")} Host chooses difficulty before starting.</div>
          `}

          <div class="ev-row" style="margin-top:12px;justify-content:space-between;flex-wrap:wrap">
            <button class="ev-btn" type="button" id="copyInviteBtn" style="padding:10px 12px;font-size:13px;">${I("copy")} Copy invite</button>
            <button class="ev-btn" type="button" id="leaveBtn" style="padding:10px 12px;font-size:13px;">${I("log-out")} Leave</button>
            <button class="ev-btn" type="button" id="startBtn" ${host && playersCount >= 2 ? "" : "disabled"} style="padding:10px 12px;font-size:13px;">
              ${I(host ? "play" : "hourglass")} ${host ? "Start match" : "Waiting…"}
            </button>
          </div>

          <div class="ev-mini ev-muted" style="margin-top:10px">
            ${I("info")} Share the link or the room code. When ready, host starts the match.
          </div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#backArenaBtn").addEventListener("click", () => openGroupArena());

    $("#copyInviteBtn").addEventListener("click", async () => {
      await play(sndClick);
      try {
        await navigator.clipboard.writeText(joinUrl);
        $("#copyInviteBtn").textContent = "Copied!";
        setTimeout(() => ($("#copyInviteBtn").innerHTML = `${I("copy")} Copy invite`, refreshIcons()), 900);
      } catch {
        alert(joinUrl);
      }
    });

    $("#leaveBtn").addEventListener("click", async () => {
      await play(sndClick);
      try {
        renderLoading("Leaving…");
        await leaveRoom(roomId);
      } catch (e) {
        console.error(e);
      } finally {
        stopRoomWatcher();
        openGroupArena();
      }
    });

    if (host) {
      const sel = $("#roomDiffSelect");
      if (sel) {
        sel.addEventListener("change", async () => {
          try {
            await play(sndClick);
            const lvl = String(sel.value || "normal").toLowerCase();
            const newDiff = normalizeDifficultySetting({ level: lvl, seed: makeSeed() });

            const { db, ref, update } = fb;
            const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);
            await update(roomRef, {
              "settings/difficulty": newDiff,
              updatedAtMs: Date.now(),
            });
          } catch (e) {
            console.error(e);
          }
        });
      }
    }

    $("#startBtn").addEventListener("click", async () => {
      if (!host) return;
      await play(sndClick);
      try {
        renderLoading("Starting…");
        await startMatch(roomId);
      } catch (e) {
        console.error(e);
        renderError(e.message || "Could not start match.");
      }
    });
  }


  async function beginRoomGame(roomId, room) {
    const g = room.game;
    if (!g || !Array.isArray(g.wordIds) || !g.wordIds.length) {
      renderError("Game data missing. Host should start again.");
      return;
    }

    // Difficulty object is synced for GROUP mode
    const diffObj = normalizeDifficultySetting(g.difficulty || room.settings?.difficulty || state.settings.difficulty);
    const cfg = {
      seconds: effectiveSeconds(diffObj),
      revealMs: diffObj.revealMs || 800,
      effects: {
        blink: diffObj.effects?.blink || 0,
        glitch: diffObj.effects?.glitch || 0,
        mask: diffObj.effects?.blur || 0,
      },
      seed: diffObj.seed,
    };

    state.roomGame = {
      roomId,
      startedAtMs: Number(g.startedAtMs || Date.now()),
      idx: 0,
      correct: 0,
      wrong: 0,
      score: 0,
      direction: g.direction || "eng->uzb",
      difficultyObj: diffObj,
      difficulty: diffObj.level,
      cfg,
      options: clamp(Number(g.options || 4), 2, 6),
      wordIds: g.wordIds.map((x) => String(x)),
      byId: new Map(state.vocab.map((w) => [String(w.id), w])),
      submitted: false,
      forfeited: false,
      ended: false,
      endCause: "",
      correctWordIds: new Set(),

      // per-question timer handles
      _timerId: null,
    };

    // keep presence alive
    startPresence(roomId).catch(() => {});

    renderRoomGameScreen();
  }


  function renderScoreboard(room) {
    const cap = clamp(Number(room?.capacityOfPlayers || 2) || 2, 2, 6);
    const slots = getSlots(room);
    const results = (room?.results && typeof room.results === "object") ? room.results : {};
    const keys = slotsInCapacity(cap);

    const rows = keys
      .map((k, idx) => {
        const uid = slots[k];
        if (!uid) return null;
        const r = results[uid] || null;
        const me = uid === state.uid;
        const label = k === "s0" ? `Host` : `Seat ${idx + 1}`;
        return {
          me,
          uid,
          label,
          score: r ? Number(r.score || 0) : null,
          correct: r ? Number(r.correct || 0) : null,
          wrong: r ? Number(r.wrong || 0) : null,
          finishedAtMs: r ? Number(r.finishedAtMs || 0) : 0,
          forfeited: r ? !!r.forfeited : false,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        // finished players first by score
        const af = a.score !== null;
        const bf = b.score !== null;
        if (af !== bf) return bf - af;
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        if ((b.correct || 0) !== (a.correct || 0)) return (b.correct || 0) - (a.correct || 0);
        return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
      });

    return `
      <div class="ev-panel">
        <div class="ev-row" style="justify-content:space-between;align-items:center">
          <div class="ev-pill">${I("trophy")} Scoreboard</div>
          <span class="ev-mini ev-muted">${I("info")} updates on finish</span>
        </div>
        <div class="ev-list" style="margin-top:10px">
          ${rows
            .map((r) => {
              const who = displayUser(r.uid);
              const status = r.score === null ? `<span class="ev-badge">${I("loader")} Playing…</span>` : `<span class="ev-badge">${I("trophy")} ${r.score}</span>`;
              const detail = r.score === null
                ? `<div class="ev-mini ev-muted" style="margin:-2px 0 8px 0">${I("clock")} in progress</div>`
                : `<div class="ev-mini ev-muted" style="margin:-2px 0 8px 0">${I("check-circle")} ${r.correct} · ${I("x-circle")} ${r.wrong}${r.forfeited ? ` · ${I("flag")} forfeited` : ""}</div>`;
              return `
                <div class="ev-row" style="justify-content:space-between">
                  <div class="ev-pill">${I(r.me ? "sparkles" : "user")} <b>${who}</b> <span class="ev-muted">(${r.label})</span></div>
                  ${status}
                </div>
                ${detail}
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function renderRoomGameScreen() {
    const rg = state.roomGame;
    const room = state.currentRoom;
    if (!rg || !room) return;

    // Stop any running per-question timer before re-render
    try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
    rg._timerId = null;

    // If room/game already finished, stop interaction and jump to results phase.
    const finish = getFinishInfo(room);
    const rootStatus = String(room.status || "");
    const gStatus = String(room?.game?.status || "");

    if (rootStatus === "finished" || gStatus === "finished" || finish) {
      rg.ended = true;
      // Ensure my result exists (idempotent). Skip lock because room is already finished.
      if (!rg.submitted) {
        finishRoomGame({ cause: "room_finished", skipLock: true }).catch(() => {});
      }
      renderLoading("Calculating results…");
      return;
    }

    const total = clamp(Number(room?.game?.count || rg.wordIds.length || 0), 1, 200);
    if (rg.idx >= total) {
      finishRoomGame({ cause: "completed" }).catch(() => {});
      return;
    }

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const progressPct = Math.round((rg.idx / total) * 100);

    const currentId = String(rg.wordIds[rg.idx]);
    const word = rg.byId.get(currentId);

    if (!word) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    const q = buildQuestion(word, rg.direction);
    if (!q.qText || !q.aText) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    // ✅ Deterministic options + effects (shared seed)
    const seed = rg.cfg?.seed ?? rg.difficultyObj?.seed ?? 0;
    const opts = pickOptionsSeeded(q.aText, q.aLang, state.vocab, rg.options, seed, currentId, rg.idx);
    if (opts.length < 2) {
      rg.idx++;
      renderRoomGameScreen();
      return;
    }

    const fx = chooseEffectSeeded(rg.difficultyObj, currentId, rg.idx);

    app.innerHTML = `
      <div class="top-bar"></div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-row" style="flex-wrap:wrap">
            <span class="ev-pill">${moduleLabel}</span>
            <span class="ev-pill">${I("swords")} Group</span>
            <span class="ev-pill">${I("activity")} ${prettyDifficulty(rg.difficultyObj)}</span>
            <span class="ev-pill">${I("shuffle")} ${pretty(rg.direction || "eng->uzb")}</span>
            <span class="ev-pill" id="roomTimerPill">${I("timer")} <b id="roomTimerVal"></b></span>
          </div>
          <button class="ev-btn" type="button" id="forfeitBtn" style="padding:8px 10px;opacity:.9">${I("x")} Forfeit</button>
        </div>

        <div class="ev-row" style="justify-content:space-between;align-items:center;margin-top:6px">
          <div class="ev-mini ev-muted">${I("bar-chart-2")} Progress: <b>${rg.idx + 1}/${total}</b> · ${progressPct}%</div>
          <div class="ev-mini ev-muted">${I("check-circle")} ${rg.correct} · ${I("x-circle")} ${rg.wrong} · ${I("zap")} ${rg.score} pts</div>
        </div>

        <div class="ev-panel" style="margin-top:10px">
          <div class="ev-q" id="question">${escapeHtml(q.qText)}</div>
          <div class="ev-answers" id="answers"></div>
          <div class="ev-mini ev-muted" style="margin-top:10px">${I("info")} First finisher ends the match for everyone.</div>
        </div>
      </div>
    `;

    refreshIcons();

    $("#forfeitBtn").addEventListener("click", async () => {
      await play(sndClick);
      await forfeitRoom(rg.roomId);
    });

    const qEl = $("#question");

    // Effects (blink/glitch/mask) — mask reveals on click
    const applyMask = () => {
      if (!fx.mask) return;
      qEl.classList.add("masked");
      qEl.addEventListener("click", () => {
        qEl.classList.remove("masked");
        // Re-mask after reveal delay (solo-like behavior)
        setTimeout(() => qEl.classList.add("masked"), rg.cfg?.revealMs || 800);
      });
    };

    if (fx.blink) qEl.classList.add("blink");
    if (fx.glitch) qEl.classList.add("glitch");
    applyMask();

    // Timer (solo-like): time per word depends on difficulty
    let remaining = Number(rg.cfg?.seconds || 0) || 0;
    const timerVal = $("#roomTimerVal");

    const updateTimerUI = () => {
      if (!timerVal) return;
      timerVal.textContent = (!remaining) ? "∞" : `${remaining}s`;
    };
    updateTimerUI();

    let locked = false;
    const lock = () => (locked = true);

    const endQuestion = () => {
      try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
      rg._timerId = null;
    };

    const timeUp = async () => {
      if (locked) return;
      lock();
      endQuestion();

      await play(sndWrong);
      rg.wrong++;

      $$(".ev-answer", app).forEach((b) => {
        b.disabled = true;
        if (b.textContent === q.aText) b.classList.add("good");
      });

      rg.idx++;

      // If this was the last word, finishing should instantly end the match for everyone
      if (rg.idx >= total) {
        await sleep(150);
        await finishRoomGame({ cause: "completed" });
      } else {
        await sleep(450);
        renderRoomGameScreen();
      }
    };

    if (remaining) {
      rg._timerId = setInterval(() => {
        if (locked) return;
        remaining = Math.max(0, remaining - 1);
        updateTimerUI();
        if (remaining <= 0) {
          timeUp().catch(() => {});
        }
      }, 1000);
    }

    const answersEl = $("#answers");

    for (const opt of opts) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ev-answer";
      btn.textContent = opt;

      btn.addEventListener("click", async () => {
        if (locked) return;
        lock();
        endQuestion();

        const isCorrect = opt === q.aText;

        if (isCorrect) {
          await play(sndCorrect);
          rg.correct++;
          rg.correctWordIds.add(String(currentId));
          // scoring: keep your previous logic
          const lvl = String(rg.difficultyObj?.level || rg.difficulty || "normal");
          rg.score += lvl === "hard" ? 2 : (lvl === "nightmare" ? 3 : 1);
        } else {
          await play(sndWrong);
          rg.wrong++;
        }

        $$(".ev-answer", app).forEach((b) => {
          b.disabled = true;
          if (b.textContent === q.aText) b.classList.add("good");
          if (b.textContent === opt && opt !== q.aText) b.classList.add("bad");
        });

        rg.idx++;

        // ✅ Critical: if user just locked the FINAL answer, attempt finish lock immediately.
        if (rg.idx >= total) {
          await sleep(150);
          await finishRoomGame({ cause: "completed" });
        } else {
          await sleep(450);
          renderRoomGameScreen();
        }
      });

      answersEl.appendChild(btn);
    }
  }



  async function submitMyResultOnce(roomId, payload) {
    // ✅ Idempotent result write (safe on reconnect)
    const { db, ref, runTransaction } = fb;
    const rRef = ref(db, `${roomsBasePath()}/${roomId}/results/${state.uid}`);

    const data = {
      uid: state.uid,
      correct: Number(payload?.correct || 0) || 0,
      wrong: Number(payload?.wrong || 0) || 0,
      score: Number(payload?.score || 0) || 0,
      timeMs: Number(payload?.timeMs || 0) || 0,
      finishedAtMs: Number(payload?.finishedAtMs || Date.now()) || Date.now(),
      finishedRank: payload?.finishedRank ?? null, // 1 if you triggered the end (completed all), 2 otherwise
      endedBy: String(payload?.endedBy || ""),
      difficulty: String(payload?.difficulty || ""),
      direction: String(payload?.direction || ""),
      forfeited: !!payload?.forfeited,
    };

    const tx = await runTransaction(rRef, (curr) => {
      if (curr && typeof curr === "object") return; // abort if already written
      return data;
    });

    return !!tx?.committed;
  }



  async function finishRoomGame({ cause = "completed", skipLock = false } = {}) {
    const rg = state.roomGame;
    if (!rg || rg.submitted) return;

    // stop timers/inputs immediately
    try { if (rg._timerId) clearInterval(rg._timerId); } catch {}
    rg._timerId = null;

    rg.ended = true;
    rg.endCause = String(cause || "");

    const roomId = rg.roomId;
    const room = state.currentRoom;

    // ✅ Race-safe finish lock: the first player to complete ALL questions ends the match for everyone.
    let lockCommitted = false;
    if (!skipLock) {
      try {
        if (cause === "completed") {
          lockCommitted = await attemptFinishLock(roomId, { triggerUid: state.uid, reason: "completed_all" });
        } else if (cause === "forfeit") {
          // Forfeit ends match immediately; other player wins if present
          const uids = getRoomUids(room || {});
          const other = uids.find((u) => u && u !== state.uid) || state.uid;
          lockCommitted = await attemptFinishLock(roomId, { triggerUid: state.uid, winnerUid: other, reason: "forfeit" });
        }
      } catch (e) {
        // If already finished, we just proceed to results
        console.warn("finish lock:", e);
      }
    }

    // Determine local rank (purely informational for stats/analytics)
    // The match ENDS when someone completes all questions, but the WINNER is decided by score/correct.
    const fin = getFinishInfo(state.currentRoom) || getFinishInfo(room) || null;
    let finishedRank = null;
    if (cause === "completed") finishedRank = lockCommitted ? 1 : 2;

    const finishedAtMs = Date.now();
    const timeMs = Math.max(0, finishedAtMs - Number(rg.startedAtMs || finishedAtMs));

    // ✅ Idempotent result write (safe on reconnect)
    await submitMyResultOnce(roomId, {
      score: rg.score,
      correct: rg.correct,
      wrong: rg.wrong,
      timeMs,
      finishedAtMs,
      finishedRank,
      endedBy: String(fin?.reason || cause || ""),
      difficulty: rg.difficulty,
      direction: rg.direction,
      forfeited: !!rg.forfeited,
    });

    rg.submitted = true;

    // Mark correct words for your marks/words (reuse solo helper safely)
    const prevSession = state.session;
    try {
      state.session = { correctWordIds: rg.correctWordIds };
      await markCorrectWords();
    } catch (e) {
      console.warn("markCorrectWords:", e);
    } finally {
      state.session = prevSession;
    }

    // UI: jump to results phase (watcher will render actual scoreboard)
    renderLoading("Calculating results…");
  }



  async function forfeitRoom(roomId) {
    const rg = state.roomGame;
    if (rg && rg.roomId === roomId && !rg.submitted) {
      rg.forfeited = true;
      rg.idx = rg.wordIds.length; // end now locally
      await finishRoomGame({ cause: "forfeit" });
      return;
    }

    // not in-game
    stopRoomWatcher();
    openGroupArena();
  }




  async function tryFinalizeRoom(roomId) {
    // Host-only finalization
    if (state.currentRoom?.hostUid !== state.uid) return;

    const { db, ref, runTransaction } = fb;
    const roomRef = ref(db, `${roomsBasePath()}/${roomId}`);

    const GRACE_MS = 8000;

    await runTransaction(roomRef, (curr) => {
      if (!curr || typeof curr !== "object") return curr;

      const g = (curr.game && typeof curr.game === "object") ? curr.game : {};
      const gStatus = String(g.status || "");
      const fin = (g.finish && typeof g.finish === "object") ? g.finish : null;

      const rootStatus = String(curr.status || "");
      const isFinished = rootStatus === "finished" || gStatus === "finished" || !!fin?.finishedAtMs;
      if (!isFinished) return curr;

      const cap = clamp(Number(curr.capacityOfPlayers || 2) || 2, 2, 6);
      const slots = getSlots(curr);
      const uids = slotsInCapacity(cap).map((k) => slots[k]).filter(Boolean);

      // Need at least 2 players for a meaningful winner
      if (uids.length < 2) return curr;

      const results = (curr.results && typeof curr.results === "object") ? curr.results : {};
      const now = Date.now();
      const finishedAt = Number(fin?.finishedAtMs || curr.finishedAtMs || 0) || 0;

      const hasCount = uids.filter((uid) => results[uid] && typeof results[uid] === "object").length;
      const allHaveResults = hasCount === uids.length;
      const gracePassed = finishedAt ? (now - finishedAt) >= GRACE_MS : false;

      // Wait for everyone to submit OR grace timeout (disconnect-safe)
      if (!allHaveResults && !gracePassed) return curr;

      const ranked = uids
        .map((uid) => {
          const r = results[uid] && typeof results[uid] === "object" ? results[uid] : null;
          return {
            uid,
            has: !!r,
            score: Number(r?.score || 0) || 0,
            correct: Number(r?.correct || 0) || 0,
            wrong: Number(r?.wrong || 0) || 0,
            timeMs: Number(r?.timeMs || 0) || 0,
            finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
            forfeited: !!r?.forfeited,
          };
        })
        .sort((a, b) => {
          // forfeited last
          if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
          // missing results last
          if (a.has !== b.has) return a.has ? -1 : 1;
          // ✅ primary: who found more (correct)
          if (b.correct !== a.correct) return b.correct - a.correct;
          // secondary: score
          if (b.score !== a.score) return b.score - a.score;
          // time asc (faster wins on tie)
          if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
          return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
        });

      const winnerObj =
        ranked.find((p) => p.has && !p.forfeited) ||
        ranked.find((p) => p.has) ||
        ranked[0];

      const winnerUid = String(winnerObj?.uid || "");
      if (!winnerUid) return curr;

      // Rules require winnerUid to be one of slots
      if (!uids.includes(winnerUid)) return curr;

      const cleanedRanked = ranked.map((p) => ({
        uid: p.uid,
        score: p.score,
        correct: p.correct,
        wrong: p.wrong,
        timeMs: p.timeMs,
        finishedAtMs: p.finishedAtMs,
        forfeited: p.forfeited,
      }));

      const newGame = {
        ...g,
        status: "finished",
        finish: {
          ...(fin || {}),
          finishedAtMs: finishedAt || now,
          winnerUid,
        },
      };

      return {
        ...curr,
        status: "finished",
        updatedAtMs: now,
        finishedAtMs: curr.finishedAtMs || finishedAt || now,
        winnerUid,
        ranked: cleanedRanked,
        game: newGame,
      };
    });
  }

  async function recordOutcomeForMe(roomId, room) {
    // record just once per room
    if (state.lastRecordedRoomId === roomId) return;
    state.lastRecordedRoomId = roomId;

    const fin = getFinishInfo(room) || {};

    const uids = getRoomUids(room);
    const resultsObj = (room.results && typeof room.results === "object") ? room.results : {};
    const allIn = uids.length ? uids.every((uid) => resultsObj[uid] && typeof resultsObj[uid] === "object") : false;

    const rows = uids.map((uid) => {
      const r = resultsObj[uid] && typeof resultsObj[uid] === "object" ? resultsObj[uid] : null;
      return {
        uid,
        has: !!r,
        correct: Number(r?.correct || 0) || 0,
        score: Number(r?.score || 0) || 0,
        timeMs: Number(r?.timeMs || 0) || 0,
        finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
        forfeited: !!r?.forfeited,
      };
    }).sort((a,b)=>{
      if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
      if (a.has !== b.has) return a.has ? -1 : 1;
      if (b.correct !== a.correct) return b.correct - a.correct;
      if (b.score !== a.score) return b.score - a.score;
      if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      return (a.finishedAtMs||0)-(b.finishedAtMs||0);
    });

    const computedWinnerUid = allIn ? String((rows.find((p)=>p.has && !p.forfeited) || rows.find((p)=>p.has) || rows[0] || {}).uid || "") : "";
    const winnerUid = String(room.winnerUid || computedWinnerUid || fin.winnerUid || "");
    if (!winnerUid) return;

const isWinner = winnerUid === state.uid;
    const k = isWinner ? "wins" : "losses";

    const statsRef = fb.ref(fb.db, `students/${state.uid}/stats/${k}/${state.type}/${safeKey(state.name)}`);
    try {
      const snap = await fb.get(statsRef);
      const prev = snap.exists() ? Number(snap.val() || 0) : 0;
      await fb.set(statsRef, prev + 1);
    } catch {}
  }



  function renderRoomResults(roomId, room) {
    injectStyles();
    stopRoomsTicker();

    const moduleLabel = `${state.type === "unitwords" ? "Unit" : "Listening"}: ${pretty(state.name)}`;
    const backLabel = state.type === "unitwords"
      ? `Back to Unit: ${pretty(state.name)}`
      : `Back to Listening: ${pretty(state.name)}`;

    const finish = getFinishInfo(room) || {};
    const reason = String(finish.reason || "");
    const reasonText =
      reason === "opponent_left" ? "Opponent left — auto-finished." :
      reason === "forfeit" ? "A player forfeited." :
      (reason === "completed_all" || reason === "first_finish") ? "Match ended because someone completed all questions." :
      "";
const uids = getRoomUids(room);
    const resultsObj = (room.results && typeof room.results === "object") ? room.results : {};

    const rows = uids.map((uid) => {
      const r = resultsObj[uid] && typeof resultsObj[uid] === "object" ? resultsObj[uid] : null;
      return {
        uid,
        has: !!r,
        score: Number(r?.score || 0) || 0,
        correct: Number(r?.correct || 0) || 0,
        wrong: Number(r?.wrong || 0) || 0,
        timeMs: Number(r?.timeMs || 0) || 0,
        forfeited: !!r?.forfeited,
        finishedAtMs: Number(r?.finishedAtMs || 0) || 0,
      };
    });

    const ranked = rows.slice().sort((a, b) => {
      // forfeited last
      if (a.forfeited !== b.forfeited) return a.forfeited ? 1 : -1;
      // missing results last
      if (a.has !== b.has) return a.has ? -1 : 1;
      // ✅ primary: who found more (correct)
      if (b.correct !== a.correct) return b.correct - a.correct;
      // secondary: score
      if (b.score !== a.score) return b.score - a.score;
      // time asc (faster better) when available
      if (a.timeMs && b.timeMs && a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
      // finishedAt asc
      return (a.finishedAtMs || 0) - (b.finishedAtMs || 0);
    });

    const allIn = ranked.every((p) => p.has);

    const computedWinnerUid = allIn
      ? String((ranked.find((p) => p.has && !p.forfeited) || ranked.find((p) => p.has) || ranked[0] || {}).uid || "")
      : "";

    // Prefer finalized winnerUid on the room. Only fall back to finish.winnerUid for hard outcomes (e.g., forfeit).
    let winnerUid = String(room.winnerUid || computedWinnerUid || "");
    if (!winnerUid && finish.winnerUid && reason !== "completed_all" && reason !== "first_finish") {
      winnerUid = String(finish.winnerUid || "");
    }

    app.innerHTML = `
      <div class="top-bar">
        <button class="lofi-toggle" type="button" id="finishCornerBtn">${I("arrow-left")} ${backLabel}</button>
      </div>
      <div class="ev-card">
        <div class="ev-toprow">
          <div class="ev-pill">${moduleLabel}</div>
          <div class="ev-pill">${I("swords")} Room</div>
          <div class="ev-pill ev-code">${roomId}</div>
        </div>

        <h3 class="ev-h">${I("trophy")} Match results</h3>
        <p class="ev-sub">
          ${winnerUid
            ? (winnerUid === state.uid ? "You won 🏆" : "Winner decided.")
            : (allIn ? "Finished." : "Finished — waiting for other results…")}
          ${reasonText ? ` · ${reasonText}` : ""}
        </p>

        ${allIn ? "" : `<div class="ev-mini ev-muted" style="margin-top:6px">${I("info")} Waiting for missing results (reconnect-safe). You can leave anytime.</div>`}

        <div class="ev-col" style="gap:8px;margin-top:10px">
          ${ranked.map((p, i) => {
            const isMe = p.uid === state.uid;
            const name = displayUser(p.uid);
            const medal = (p.uid === winnerUid) ? I("crown") : I("medal");
            const status = !p.has ? `${I("wifi-off")} no result` : (p.forfeited ? `${I("x")} forfeited` : `${I("check-circle")} submitted`);
            const timeStr = p.timeMs ? `${Math.round(p.timeMs/1000)}s` : "—";
            return `
              <div class="ev-row" style="justify-content:space-between;gap:10px;flex-wrap:wrap">
                <div class="ev-pill">${medal} #${i + 1} <b>${name}</b> ${isMe ? "<span class='ev-mini'>(you)</span>" : ""}</div>
                <div class="ev-pill">${I("trophy")} ${p.score} pts</div>
                <div class="ev-pill">${I("check-circle")} ${p.correct} / ${I("x-circle")} ${p.wrong}</div>
                <div class="ev-pill">${I("timer")} ${timeStr}</div>
                <div class="ev-pill">${status}</div>
              </div>
            `;
          }).join("")}
        </div>

        <div class="ev-row" style="margin-top:14px">
          <button class="ev-btn" type="button" id="finishBtn" style="width:100%">${I("arrow-left")} ${backLabel}</button>
        </div>
      </div>
    `;

    refreshIcons();

    const goBack = () => {
      stopRoomWatcher();
      location.href = providerUrl();
    };

    $("#finishBtn").addEventListener("click", goBack);
    $("#finishCornerBtn").addEventListener("click", goBack);

    recordOutcomeForMe(roomId, room).catch((e) => console.error("outcome:", e));
  }



/* -----------------------
     9) Public functions (required by test.html inline onclick)
  ------------------------ */
  window.startSolo = function startSolo() {
    // keep compatibility with old buttons; now just starts using current settings
    startSoloFlow();
  };

  window.startGroup = function startGroup() {
    openGroupArena();
  };

  /* -----------------------
     10) Bootstrap
  ------------------------ */
  async function boot() {
    injectStyles();
    renderLoading("Signing in…");

    await loadFirebase();

    onAuthStateChanged(fb.auth, async (user) => {
      if (!user) {
        location.href = "/pages/auth/reg.html";
        return;
      }

      state.user = user;
      state.uid = user.uid;

      const ctx = resolveContextOrRedirect();
      if (!ctx) return;

      // Create/update listening access node (hasaccess stays false until completion)
      await ensureListeningAccessNode();

      try {
        renderLoading("Loading vocabulary…");
        state.vocab = await loadVocabFromFirebase(ctx.type, ctx.name);

        if (!state.vocab.length) {
          renderError(`No vocabulary found for ${ctx.type}/${ctx.name}.`);
          return;
        }

        renderHomeScreen();

        // Auto-open group mode if requested via URL
        const p = parseParams();
        if (p.mode === "group") {
          openGroupArena();
          if (p.room) {
            openRoom(p.room, { autoJoin: true });
          }
        }

      } catch (e) {
        console.error(e);
        renderError("Could not load vocabularies from Firebase.");
      }
    });
  }
  let roomWatchers = new Map();

  function watchRoomWithCleanup(roomId, callback) {
    // Clean up any existing watcher for this room
    if (roomWatchers.has(roomId)) {
      const unsubscribe = roomWatchers.get(roomId);
      unsubscribe();
      roomWatchers.delete(roomId);
    }

    const roomRef = fb.ref(fb.db, `${roomsBasePath()}/${roomId}`);
    const unsubscribe = fb.onValue(roomRef, callback);
    
    roomWatchers.set(roomId, unsubscribe);
    return unsubscribe;
  }

  function stopAllRoomWatchers() {
    roomWatchers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn("Failed to unsubscribe room watcher:", e);
      }
    });
    roomWatchers.clear();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', stopAllRoomWatchers);
  window.addEventListener('pagehide', stopAllRoomWatchers);

  // Global error handler for better debugging
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    if (event.reason?.code === 'PERMISSION_DENIED') {
      // Show user-friendly error instead of generic message
      const app = document.getElementById('app');
      if (app) {
        renderError(
          "⚠️ Database Permission Error\n\n" +
          "The database rejected your request. This usually means:\n" +
          "• You're not logged in\n" +
          "• Your session expired\n" +
          "• Database rules validation failed\n\n" +
          "Try refreshing the page or logging in again."
        );
      }
    }
  });


  boot();
>>>>>>> 5190efbbfc004e7f2b1521b7378bb9023f978c2c
})();