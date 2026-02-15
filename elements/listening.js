import "/elements/UI.js";
import { db } from "/elements/firebase.js";
import { ref, get, update, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { auth } from "/elements/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const EDU_ACTIVE_UID_KEY = "eduventure_active_uid_v1";

function purgeEduventureLocalCache() {
  try {
    const prefixes = ["reading_", "listening_", "bridge_"];
    Object.keys(localStorage).forEach((k) => {
      if (prefixes.some((p) => k.startsWith(p))) localStorage.removeItem(k);
    });
  } catch {}
}

let __authReadyResolved = false;

const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    const uid = user?.uid || "anon";
    try {
      const prev = localStorage.getItem(EDU_ACTIVE_UID_KEY);
      if (prev && prev !== uid) purgeEduventureLocalCache();
      localStorage.setItem(EDU_ACTIVE_UID_KEY, uid);
    } catch {}

    if (!__authReadyResolved) {
      __authReadyResolved = true;
      resolve(uid);
    }
  });
});

function _eduSegments() {
  let p = window.location.pathname || "/";
  p = p.replace(/\/+/g, "/"); 
  const seg = p.split("/").filter(Boolean);

  if (seg.length && seg[0].toLowerCase() === "eduventure") seg.shift();

  return seg;
}

const _segs = _eduSegments();

const TEST_ID =
  _segs.find(p => /^test\d+$/i.test(p)) ||
  (window.location.pathname.match(/\/(test\d+)\b/i)?.[1]) ||
  "test1";

const SEC_ID =
  _segs.find(p => /^sec\d+$/i.test(p)) ||
  (window.location.pathname.match(/\/(sec\d+)\b/i)?.[1]) ||
  "sec1";

const DB_PATH = `listening/${TEST_ID}/${SEC_ID}/questions`;
const STORAGE_PREFIX = `listening_${TEST_ID}_${SEC_ID}`;

const ANSWER_CACHE_KEY = `${STORAGE_PREFIX}_answer_key_v1`;

function normalizeAnswerKey(raw) {
  if (!raw) return {};
  if (Array.isArray(raw)) {
    const out = {};
    for (let i = 1; i < raw.length; i++) {
      if (raw[i] == null) continue;
      out[String(i)] = Array.isArray(raw[i]) ? raw[i] : [raw[i]];
    }
    return out;
  }
  return raw;
}

async function loadAnswerKey() {
  try {
    const cached = sessionStorage.getItem(ANSWER_CACHE_KEY);
    if (cached) return normalizeAnswerKey(JSON.parse(cached));
  } catch {}

  await authReady;
  if (!auth.currentUser) return null;
  const snap = await get(ref(db, DB_PATH));
  if (!snap.exists()) return null;
  const raw = snap.val();
  const val = normalizeAnswerKey(raw);

  try { sessionStorage.setItem(ANSWER_CACHE_KEY, JSON.stringify(val)); } catch {}
  return val;
}

function setupSmartBack() {
  try {
    if (sessionStorage.getItem("lock_back_to_bridge") !== "1") return;
    const ret = sessionStorage.getItem("bridge_return_url");
    if (!ret) return;

    history.pushState({ bridgeLock: 1 }, "", window.location.href);

    window.addEventListener("popstate", () => {
      try { sessionStorage.removeItem("lock_back_to_bridge"); } catch {}
      window.location.href = ret;
    }, { once: true });
  } catch {}
}
setupSmartBack();

authReady.then(() => {
  if (auth.currentUser) loadAnswerKey().catch(() => {});
});

try {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
} catch {}

const MODE = "listening";

function _bridgeKey(suffix) {
  return `bridge_${MODE}_${TEST_ID}_${suffix}`;
}

function _extractSecId(v) {
  const m = String(v || "").match(/sec\d+/i);
  return m ? m[0].toLowerCase() : "";
}

function _normalizePartsList(arr) {
  const out = [];
  for (const it of Array.isArray(arr) ? arr : []) {
    const sec = _extractSecId(it);
    if (!sec) continue;
    if (!out.includes(sec)) out.push(sec);
  }
  out.sort((a, b) => Number(a.replace(/\D+/g, "")) - Number(b.replace(/\D+/g, "")));
  return out;
}

function _getPartsFromBridge() {
  try {
    const raw = localStorage.getItem(_bridgeKey("parts"));
    if (raw) {
      const arr = JSON.parse(raw);
      const norm = _normalizePartsList(arr);
      if (norm.length) return norm;
    }
  } catch {}
  return ["sec1", "sec2", "sec3", "sec4"];
}

const _PARTS_CACHE_KEY = `edu_listening_parts_${TEST_ID}`;

async function _getPartsAuthoritative() {
  try {
    const cached = sessionStorage.getItem(_PARTS_CACHE_KEY);
    if (cached) {
      const arr = _normalizePartsList(JSON.parse(cached));
      if (arr.length) return arr;
    }
  } catch {}

  let dbParts = [];
  try {
    await authReady;
    if (auth.currentUser) {
      const snap = await get(ref(db, `listening/${TEST_ID}`));
      if (snap.exists()) {
        const v = snap.val() || {};
        dbParts = _normalizePartsList(Object.keys(v || {}));
      }
    }
  } catch {
    dbParts = [];
  }

  const bridgeParts = _getPartsFromBridge();

  let parts = [];
  if (dbParts.length) parts = dbParts;
  else if (bridgeParts.length) parts = bridgeParts;
  else parts = ["sec1", "sec2", "sec3", "sec4"];

  const cur = _extractSecId(SEC_ID) || "sec1";
  if (cur && !parts.includes(cur)) parts = parts.concat([cur]);

  try { sessionStorage.setItem(_PARTS_CACHE_KEY, JSON.stringify(parts)); } catch {}
  return parts;
}

function _isPartSubmitted(sec) {
  const s = _extractSecId(sec);
  if (!s) return false;
  return localStorage.getItem(`${MODE}_${TEST_ID}_${s}_submitted`) === "true";
}

async function _allPartsDone() {
  const parts = await _getPartsAuthoritative();
  return parts.length > 0 && parts.every(_isPartSubmitted);
}

async function _isLastPart() {
  const parts = await _getPartsAuthoritative();
  const lastFromBridge = _extractSecId(localStorage.getItem(_bridgeKey("last")));
  const last = lastFromBridge || parts[parts.length - 1] || "sec4";
  return _extractSecId(SEC_ID) === _extractSecId(last);
}

function _bridgeUrl() {
  return `/pages/study_materials/bridge.html?mode=${MODE}&test=${TEST_ID}`;
}

function _setEditing(on) {
  try { localStorage.setItem(`${STORAGE_PREFIX}_editing`, "0"); } catch {}
}

function _isEditing() {
  return false;
}

function enableAnswerInputs() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    const t = (el.getAttribute("type") || "").toLowerCase();
    if (["button", "submit", "reset", "file"].includes(t)) return;
    el.disabled = false;
    el.style.opacity = "";
    el.style.cursor = "";
  });
}

function clearFeedback() {
  document.querySelectorAll(".feedback").forEach(el => el.remove());
}

function ensureEditButton() {
  const old = document.getElementById("editAnswersBtn");
  if (old) old.remove();
}

async function ensureEndTestButton() {
  if (!isSubmitted()) return;

  const allDone = await _allPartsDone();
  const isLast = await _isLastPart();

  if (document.getElementById("endTestBtn")) return;

  const btn = document.createElement("button");
  btn.id = "endTestBtn";
  btn.type = "button";
  btn.style.position = "fixed";
  btn.style.right = "18px";
  btn.style.bottom = "18px";
  btn.style.zIndex = "9999";
  btn.style.padding = "14px 18px";
  btn.style.borderRadius = "14px";
  btn.style.border = "0";
  btn.style.background = "#111827";
  btn.style.color = "#fff";
  btn.style.fontWeight = "800";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 10px 28px rgba(0,0,0,.25)";

  let alreadyCompleted = false;
  try {
    const user = auth.currentUser;
    if (user) {
      const completedPath = `students/${user.uid}/results/${MODE}/${TEST_ID}`;
      const snap = await get(ref(db, completedPath));
      alreadyCompleted = snap.exists();
    }
  } catch (e) {
    console.warn("Could not check Firebase completion status:", e);
  }

  if (alreadyCompleted) {
    btn.textContent = "Leave test";
    btn.onclick = () => {
      try {
        sessionStorage.removeItem("lock_back_to_bridge");
        sessionStorage.removeItem("bridge_return_url");
      } catch {}
      location.replace(_bridgeUrl());
    };
  } else if (allDone) {
    btn.textContent = "End the test";
    btn.onclick = async () => {
      try {
        await syncListeningToFirebase();
      } catch (e) {
        console.warn("Sync failed on End Test (will retry on next load):", e);
      }
      try {
        sessionStorage.removeItem("lock_back_to_bridge");
        sessionStorage.removeItem("bridge_return_url");
      } catch {}
      location.replace(_bridgeUrl());
    };
  } else {
    btn.textContent = "Leave test";
    btn.onclick = () => {
      try {
        sessionStorage.removeItem("lock_back_to_bridge");
        sessionStorage.removeItem("bridge_return_url");
      } catch {}
      location.replace(_bridgeUrl());
    };
  }

  document.body.appendChild(btn);
}

function lockSubmitControls() {
  const selectors = [
    "#submitBtn",
    "#checkBtn",
    "#checkAnswersBtn",
    "#submitAnswersBtn",
    'button[onclick*="checkAnswers"]',
    'input[onclick*="checkAnswers"]',
  ];
  try {
    document.querySelectorAll(selectors.join(",")).forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.style.cursor = "not-allowed";
    });
  } catch {}
}

function ensureDownloadPdfButton() {
  let btn = document.getElementById("downloadPdfBtn");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "downloadPdfBtn";
    btn.type = "button";
    btn.textContent = "Download PDF";
    btn.style.display = "none";
    btn.style.marginLeft = "10px";
    btn.style.padding = "10px 14px";
    btn.style.borderRadius = "12px";
    btn.style.border = "1px solid rgba(0,0,0,.12)";
    btn.style.background = "#fff";
    btn.style.cursor = "pointer";
    const host = document.querySelector(".controls") || document.body;
    host.appendChild(btn);
  }

  btn.onclick = (e) => {
    e.preventDefault();
    if (typeof window.downloadPDF === "function") window.downloadPDF();
  };

  return btn;
}

ensureDownloadPdfButton();

const ADMIN_SALT_HEX = "3527507615c71580539d118c92288945";
const ADMIN_HASH_HEX = "e2fa2be7284ad911ec467fcb3a864320a4e1fdae1a458ff4cdac9ed8fdcd2e8d";

const toHex = bytes => [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");

function hexToBytes(hex) {
  const clean = String(hex).replace(/[^0-9a-f]/gi, "");
  if (clean.length % 2 !== 0) throw new Error("Invalid hex length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(digest));
}

async function verifyAdminPassword(pw) {
  const saltBytes = hexToBytes(ADMIN_SALT_HEX);
  const pwBytes = new TextEncoder().encode(String(pw));
  const combined = new Uint8Array(saltBytes.length + pwBytes.length);
  combined.set(saltBytes, 0);
  combined.set(pwBytes, saltBytes.length);
  const hashHex = await sha256Hex(combined);
  return hashHex.toLowerCase() === String(ADMIN_HASH_HEX).toLowerCase();
}

async function adminResetFlow() {
  const pw = prompt("Admin password:");
  if (!pw) return;

  const ok = await verifyAdminPassword(pw);
  if (!ok) {
    alert("❌ Wrong admin password.");
    return;
  }

  Object.keys(localStorage)
    .filter(k => k.startsWith(STORAGE_PREFIX))
    .forEach(k => localStorage.removeItem(k));

  alert("✅ Reset complete.");
  location.reload();
}

window.makeAdminHash = async function(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pwBytes = new TextEncoder().encode(String(password));
  const combined = new Uint8Array(salt.length + pwBytes.length);
  combined.set(salt, 0);
  combined.set(pwBytes, salt.length);
  const digest = await crypto.subtle.digest("SHA-256", combined);
  console.log("ADMIN_SALT_HEX =", toHex(salt));
  console.log("ADMIN_HASH_HEX =", toHex(new Uint8Array(digest)));
  return { ADMIN_SALT_HEX: toHex(salt), ADMIN_HASH_HEX: toHex(new Uint8Array(digest)) };
};

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function isSubmitted() {
  return localStorage.getItem(`${STORAGE_PREFIX}_submitted`) === "true";
}

function setSubmitted() {
  localStorage.setItem(`${STORAGE_PREFIX}_submitted`, "true");
}

function markCheatAttempt() {
  alert("✅ Already submitted. You can’t change answers.");
}

function normalizeQIdsToNumbers() {
  const qIdRegex = /^q(\d+)$/i;
  const existingIds = new Set();
  document.querySelectorAll("[id]").forEach(el => existingIds.add(el.id));
  const renamed = new Map(); 

  document.querySelectorAll("[id]").forEach(el => {
    const oldId = String(el.id || "");
    const m = oldId.match(qIdRegex);
    if (!m) return;
    const newId = m[1]; 
    if (existingIds.has(newId) && newId !== oldId) {
      el.dataset.qid = newId;
      return;
    }
    el.id = newId;
    renamed.set(oldId, newId);
    existingIds.delete(oldId);
    existingIds.add(newId);
  });

  const swapToken = (token) => {
    if (!token) return token;
    if (renamed.has(token)) return renamed.get(token);
    const m = String(token).match(qIdRegex);
    return m ? m[1] : token;
  };

  document.querySelectorAll("label[for]").forEach(label => {
    const oldFor = label.getAttribute("for");
    const newFor = swapToken(oldFor);
    if (newFor !== oldFor) label.setAttribute("for", newFor);
  });

  document.querySelectorAll('input[type="radio"][name]').forEach(r => {
    const oldName = r.getAttribute("name");
    const newName = swapToken(oldName);
    if (newName !== oldName) r.setAttribute("name", newName);
  });

  ["aria-labelledby", "aria-describedby"].forEach(attr => {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      const raw = el.getAttribute(attr) || "";
      const tokens = raw.split(/\s+/).filter(Boolean);
      const fixed = tokens.map(swapToken);
      const joined = fixed.join(" ");
      if (joined !== raw) el.setAttribute(attr, joined);
    });
  });
}

function getInputBundle(qid) {
  const cleanId = String(qid).trim();
  const radiosA = document.querySelectorAll(`input[type="radio"][name="${CSS.escape(cleanId)}"]`);
  const radiosB = document.querySelectorAll(`input[type="radio"][name="q${CSS.escape(cleanId)}"]`);
  const radios = radiosA.length ? radiosA : radiosB;
  if (radios.length) return { type: "radio", qid: cleanId, radios: Array.from(radios) };
  const elA = document.getElementById(cleanId);
  const elB = document.getElementById(`q${cleanId}`);
  const el = elA || elB;
  if (!el) return null;
  const tag = (el.tagName || "").toUpperCase();
  if (tag === "SELECT") return { type: "select", qid: cleanId, el };
  if (tag === "TEXTAREA") return { type: "textarea", qid: cleanId, el };
  const inputType = (el.getAttribute("type") || "text").toLowerCase();
  if (inputType === "checkbox") return { type: "checkbox", qid: cleanId, el };
  return { type: "text", qid: cleanId, el };
}

function readUserAnswer(bundle) {
  if (!bundle) return "";
  if (bundle.type === "radio") {
    const checked = bundle.radios.find(r => r.checked);
    return checked ? checked.value : "";
  }
  if (bundle.type === "checkbox") {
    return bundle.el.checked ? (bundle.el.value || "true") : "";
  }
  return bundle.el.value ?? "";
}

function writeUserAnswer(bundle, valueRaw) {
  if (!bundle) return;
  if (bundle.type === "radio") {
    bundle.radios.forEach(r => { r.checked = (String(r.value) === String(valueRaw)); });
    return;
  }
  if (bundle.type === "checkbox") {
    bundle.el.checked = !!valueRaw;
    return;
  }
  bundle.el.value = valueRaw;
}

function disableBundle(bundle) {
  if (!bundle) return;
  if (bundle.type === "radio") {
    bundle.radios.forEach(r => {
      r.disabled = true;
      r.style.cursor = "not-allowed";
      r.style.opacity = "0.9";
    });
    return;
  }
  bundle.el.disabled = true;
  bundle.el.style.cursor = "not-allowed";
  bundle.el.style.opacity = "0.9";
}

function createFeedback(anchorEl, correct) {
  if (!anchorEl) return;
  const fb = document.createElement("span");
  fb.className = "feedback";
  fb.style.cssText = `
    margin-left: 10px; 
    font-weight: bold; 
    color: ${correct ? "green" : "red"};
    display: inline-block;
  `;
  fb.textContent = correct ? "✅ Correct" : "❌ Wrong";
  if (window.innerWidth <= 768) {
    fb.style.display = "block";
    fb.style.marginLeft = "0";
    fb.style.marginTop = "5px";
  }
  const nextNode = anchorEl.nextElementSibling;
  if (nextNode && nextNode.classList.contains("feedback")) {
    nextNode.remove();
  }
  anchorEl.insertAdjacentElement('afterend', fb);
}

function _isoNow() {
  return new Date().toISOString();
}

function safeKey(s) {
  return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

const VOCAB_BUCKET = "listenings"; 
const VOCAB_KEY = safeKey(TEST_ID);

function _prettyTestName() {
  return `Listening ${String(TEST_ID || "").toUpperCase()}`;
}

function _vocabPath(uid) {
  return `students/${uid}/progress/vocabularies/${VOCAB_BUCKET}/${VOCAB_KEY}`;
}

async function _touchVocabOpened(uid) {
  if (!uid) return;
  const path = _vocabPath(uid);
  const nowMs = Date.now();
  await runTransaction(ref(db, path), (cur) => {
    const c = (cur && typeof cur === "object") ? cur : null;
    if (c && c.opened) return; 
    const openedAtMs = Number(c?.openedAtMs) || nowMs;
    const openedAt = c?.openedAt || new Date(openedAtMs).toISOString();
    return {
      ...(c || {}),
      name: c?.name || _prettyTestName(),
      type: "listening",
      bucket: VOCAB_BUCKET,
      opened: true,
      openedAtMs,
      openedAt,
      updatedAtMs: Number(c?.updatedAtMs) || openedAtMs,
      updatedAt: c?.updatedAt || openedAt,
    };
  }, { applyLocally: false });
}

async function _updateVocabProgress(uid, { completedNow = false, correct = null, total = null, wrong = null } = {}) {
  if (!uid) return;
  const path = _vocabPath(uid);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const hasScore = Number.isFinite(Number(total)) && Number(total) > 0 && Number.isFinite(Number(correct));
  const percent = hasScore ? Math.round((Number(correct) / Number(total)) * 100) : null;
  await runTransaction(ref(db, path), (cur) => {
    const c = (cur && typeof cur === "object") ? cur : {};
    const prevBest = Number(c.bestPercent || 0);
    const nextBest = (percent != null && percent > prevBest) ? percent : prevBest;
    const wasCompleted = !!c.completed;
    const completed = wasCompleted || !!completedNow;
    return {
      ...c,
      name: c.name || _prettyTestName(),
      type: c.type || "listening",
      bucket: c.bucket || VOCAB_BUCKET,
      opened: true,
      completed,
      attempts: Number(c.attempts || 0) + ((!wasCompleted && completedNow) ? 1 : 0),
      bestPercent: nextBest,
      lastPercent: (percent != null ? percent : (c.lastPercent ?? c.bestPercent ?? null)),
      lastTotal: (hasScore ? Number(total) : (c.lastTotal ?? null)),
      lastCorrect: (hasScore ? Number(correct) : (c.lastCorrect ?? null)),
      lastWrong: (hasScore ? Number(wrong ?? (Number(total) - Number(correct))) : (c.lastWrong ?? null)),
      updatedAtMs: nowMs,
      updatedAt: nowIso,
      lastAttemptAtMs: hasScore ? nowMs : (c.lastAttemptAtMs ?? null),
      lastAttemptAt: hasScore ? nowIso : (c.lastAttemptAt ?? null),
      openedAtMs: Number(c.openedAtMs || nowMs),
      openedAt: c.openedAt || nowIso,
      completedAtMs: (c.completedAtMs ?? null) || (completedNow ? nowMs : null),
      completedAt: (c.completedAt ?? null) || (completedNow ? nowIso : null),
    };
  }, { applyLocally: false });
}
function _secPrefix(sec) {
  return `listening_${TEST_ID}_${sec}`;
}

function _secLocalScore(sec) {
  try {
    const prefix = _secPrefix(sec);
    const cRaw = localStorage.getItem(`${prefix}_correctCount`);
    const tRaw = localStorage.getItem(`${prefix}_totalCount`);
    const c = Number(cRaw);
    const t = Number(tRaw);
    if (Number.isFinite(c) && Number.isFinite(t) && t >= 0) {
      return { correct: c, total: t, wrong: Math.max(0, t - c) };
    }
    const res = localStorage.getItem(`${prefix}_result`) || "";
    const m = res.match(/Correct:\s*(\d+)\s*\/\s*(\d+)/i);
    if (m) {
      const cc = Number(m[1]);
      const tt = Number(m[2]);
      if (Number.isFinite(cc) && Number.isFinite(tt)) {
        return { correct: cc, total: tt, wrong: Math.max(0, tt - cc) };
      }
    }
  } catch {}
  return null;
}

async function _aggregateScore(uid, secs) {
  const perPart = {};
  let total = 0, correct = 0, wrong = 0;
  const list = Array.isArray(secs) ? secs : [];
  for (const sec of list) {
    const s = _secLocalScore(sec);
    if (s) {
      perPart[sec] = { correct: s.correct, total: s.total, wrong: s.wrong };
      total += s.total;
      correct += s.correct;
      wrong += s.wrong;
    }
  }
  for (const sec of list) {
    if (perPart[sec]) continue;
    try {
      const snap = await get(ref(db, `students/${uid}/progress/${MODE}/${TEST_ID}/${sec}`));
      if (snap.exists()) {
        const v = snap.val() || {};
        const c = Number(v.correct || 0);
        const t = Number(v.total || 0);
        const w = Number(v.incorrect ?? v.wrong ?? Math.max(0, t - c));
        perPart[sec] = { correct: c, total: t, wrong: w };
        total += t;
        correct += c;
        wrong += w;
      }
    } catch {}
  }
  return { total, correct, wrong, perPart };
}

async function _writeSectionProgress(uid, sec, score) {
  if (!uid || !sec || !score) return;
  const progressPath = `students/${uid}/progress/${MODE}/${TEST_ID}/${sec}`;
  await update(ref(db, progressPath), {
    correct: score.correct,
    incorrect: score.wrong,
    total: score.total,
    updatedAt: _isoNow()
  });
}

async function _finalizeTestIfComplete(uid) {
  const parts = await _getPartsAuthoritative();
  if (!parts.length) return { finalized: false, reason: "no_parts" };
  const allDone = parts.every(_isPartSubmitted);
  if (!allDone) return { finalized: false, reason: "not_done" };
  const perPart = {};
  let total = 0, correct = 0, wrong = 0;
  for (const sec of parts) {
    const s = _secLocalScore(sec);
    if (s) {
      perPart[sec] = { correct: s.correct, total: s.total, wrong: s.wrong };
      total += s.total; correct += s.correct; wrong += s.wrong;
    }
  }
  for (const sec of parts) {
    if (perPart[sec]) continue;
    try {
      const snap = await get(ref(db, `students/${uid}/progress/${MODE}/${TEST_ID}/${sec}`));
      if (snap.exists()) {
        const v = snap.val() || {};
        const c = Number(v.correct || 0);
        const t = Number(v.total || 0);
        const w = Number(v.incorrect ?? v.wrong ?? Math.max(0, t - c));
        perPart[sec] = { correct: c, total: t, wrong: w };
        total += t; correct += c; wrong += w;
      }
    } catch {}
  }
  if (Object.keys(perPart).length !== parts.length) return { finalized: false, reason: "missing_scores" };
  try { await _updateVocabProgress(uid, { completedNow: true, correct, total, wrong }); } catch (e) { console.warn("Vocab progress sync failed:", e); }
  const resultPath = `students/${uid}/results/${MODE}/${TEST_ID}`;
  const resultObj = {
    mode: MODE,
    testId: TEST_ID,
    completedAt: _isoNow(),
    correct,
    wrong,
    total,
    perPart
  };
  const tx = await runTransaction(ref(db, resultPath), (cur) => {
    if (cur) return; 
    return resultObj;
  }, { applyLocally: false });
  if (!tx.committed) return { finalized: false, reason: "already_finalized" };
  await runTransaction(ref(db, `students/${uid}/stats/listeningsCompleted`), (cur) => {
    const n = Number(cur);
    return (Number.isFinite(n) ? n : 0) + 1;
  }, { applyLocally: false });
  return { finalized: true };
}

async function syncListeningToFirebase() {
  await authReady;
  const user = auth.currentUser;
  if (!user) return;
  try { await _touchVocabOpened(user.uid); } catch {}
  const parts = await _getPartsAuthoritative();
  if (_isPartSubmitted(SEC_ID)) {
    const score = _secLocalScore(_extractSecId(SEC_ID));
    if (score) { try { await _writeSectionProgress(user.uid, _extractSecId(SEC_ID), score); } catch (e) { console.warn("Section progress sync failed:", e); } }
  }
  try {
    const submittedSecs = parts.filter(_isPartSubmitted);
    if (submittedSecs.length) {
      const agg = await _aggregateScore(user.uid, submittedSecs);
      await _updateVocabProgress(user.uid, { completedNow: false, correct: agg.correct, total: agg.total, wrong: agg.wrong });
    }
  } catch (e) { console.warn("Aggregate progress sync failed:", e); }
  await _finalizeTestIfComplete(user.uid);
}

window.checkAnswers = async function() {
  await authReady;
  normalizeQIdsToNumbers();
  if (isSubmitted()) {
    markCheatAttempt();
    return;
  }
  const answers = await loadAnswerKey();
  if (!answers) {
    alert("Error: Answer key not found in Firebase.");
    return;
  } 
  const qids = Object.keys(answers).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    const aNum = Number.isFinite(na), bNum = Number.isFinite(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return String(a).localeCompare(String(b));
  });
  let correctCount = 0;
  for (const qid of qids) {
    const cleanId = String(qid).trim();
    const bundle = getInputBundle(cleanId);
    if (!bundle) continue;
    const userRaw = readUserAnswer(bundle);
    localStorage.setItem(`${STORAGE_PREFIX}_${cleanId}`, userRaw);
    const user = normalize(userRaw);
    const accepted = (answers[qid] || []).map(normalize);
    const isCorrect = accepted.includes(user);
    if (bundle.type === "radio") {
      createFeedback(bundle.radios[0].parentElement || bundle.radios[0], isCorrect);
    } else {
      createFeedback(bundle.el, isCorrect);
    }
    disableBundle(bundle);
    if (isCorrect) correctCount++;
  }
  const resText = `✅ Correct: ${correctCount} / ${qids.length}`;
  const resultBox = document.getElementById("resultBox");
  if (resultBox) resultBox.textContent = resText;
  localStorage.setItem(`${STORAGE_PREFIX}_result`, resText);
  const prevAttempt = +(localStorage.getItem(`${STORAGE_PREFIX}_attempt`) || 0);
  localStorage.setItem(`${STORAGE_PREFIX}_attempt`, String(prevAttempt + 1));
  localStorage.setItem(`${STORAGE_PREFIX}_submittedAt`, new Date().toISOString());
  try {
    localStorage.setItem(`${STORAGE_PREFIX}_correctCount`, String(correctCount));
    localStorage.setItem(`${STORAGE_PREFIX}_totalCount`, String(qids.length));
  } catch {}
  setSubmitted();
  try {
    await syncListeningToFirebase();
  } catch (e) { console.warn("Listening sync failed (will retry on next load):", e); }
  _setEditing(false);
  const downloadBtn = ensureDownloadPdfButton();
  if (downloadBtn) downloadBtn.style.display = "inline-block";
  lockSubmitControls();
  ensureEditButton();
  ensureEndTestButton();
};

function addWatermark(doc, { testId, secId }) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.setTextColor(235, 235, 235);
  doc.text("Edu department", w / 2, h / 2, { align: "center", angle: 25 });
  doc.setFontSize(16);
  doc.text(`${String(testId).toUpperCase()} • ${String(secId).toUpperCase()}`, w / 2, h / 2 + 35, { align: "center", angle: 25 });
  doc.restoreGraphicsState();
}

function addFooterPageNumbers(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${pageCount}`, w - 50, h - 25, { align: "right" });
  }
}

async function ensureJsPdfCtor() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  if (window.__edu_jspdf_loading) return window.__edu_jspdf_loading;
  window.__edu_jspdf_loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    s.async = true;
    s.onload = () => resolve((window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
  return window.__edu_jspdf_loading;
}

window.downloadPDF = async function() {
  const jsPDF = await ensureJsPdfCtor();
  if (!jsPDF) {
    alert(`PDF export needs jsPDF. Add it to the page or allow the auto-loader.`);
    return;
  }
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  addWatermark(doc, { testId: TEST_ID, secId: SEC_ID });
  const answers = await loadAnswerKey();
  if (!answers) return alert("Database error.");
  let y = 50;
  const margin = 50;
  const pageWidth = 595;
  const submittedAtIso = localStorage.getItem(`${STORAGE_PREFIX}_submittedAt`);
  const submittedAt = new Date(submittedAtIso || Date.now()).toLocaleString();
  const attempt = localStorage.getItem(`${STORAGE_PREFIX}_attempt`) || "—";
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;
  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Official Examination Record", margin, y);
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(String(TEST_ID).toUpperCase(), margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(String(SEC_ID).toUpperCase(), pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Submitted: ${submittedAt}`, margin, y);
  doc.text(`Attempt: ${attempt}`, pageWidth - margin, y, { align: "right" });
  y += 14;
  doc.setTextColor(0, 0, 0);
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 45;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("NO.", margin, y);
  doc.text("USER SUBMISSION", margin + 45, y);
  doc.text("CORRECT KEY", margin + 300, y);
  y += 15;
  const keys = Object.keys(answers).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    const aNum = Number.isFinite(na), bNum = Number.isFinite(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return String(a).localeCompare(String(b));
  });
  keys.forEach((qid, index) => {
    const cleanId = String(qid).trim();
    const userAns = String(localStorage.getItem(`${STORAGE_PREFIX}_${cleanId}`) || "—");
    const correctAns = String((answers[qid] || []).join(" / "));
    doc.setDrawColor(245, 245, 245);
    doc.line(margin, y + 5, pageWidth - margin, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`${(index + 1).toString().padStart(2, "0")}`, margin, y + 20);
    doc.setFont("helvetica", "normal");
    doc.text(userAns, margin + 45, y + 20);
    doc.setTextColor(0, 128, 0);
    doc.setFont("helvetica", "bold");
    doc.text(correctAns, margin + 300, y + 20);
    y += 28;
    if (y > 750) {
      doc.addPage();
      addWatermark(doc, { testId: TEST_ID, secId: SEC_ID });
      y = 60;
    }
  });
  y += 40;
  const cleanResult = (localStorage.getItem(`${STORAGE_PREFIX}_result`) || "No Result")
    .replace(/[^\x20-\x7E]/g, "");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.75);
  doc.rect(margin, y, pageWidth - margin * 2, 55);
  doc.setFont("times", "italic");
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text("Performance Summary", margin + 20, y + 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(String(cleanResult), margin + 20, y + 42);
  addFooterPageNumbers(doc);
  doc.save(`${TEST_ID}_${SEC_ID}_Results.pdf`);
};

window.addEventListener("load", async () => {
  await authReady;
  normalizeQIdsToNumbers();
  const answers = await loadAnswerKey();
  if (!answers) return;
  Object.keys(answers).forEach(qid => {
    const cleanId = String(qid).trim();
    const saved = localStorage.getItem(`${STORAGE_PREFIX}_${cleanId}`);
    const bundle = getInputBundle(cleanId);
    if (!bundle) return;
    if (saved !== null) {
      writeUserAnswer(bundle, saved);
      if (isSubmitted()) {
        const accepted = (answers[qid] || []).map(normalize);
        const ok = accepted.includes(normalize(saved));
        if (bundle.type === "radio") { createFeedback(bundle.radios[0].parentElement || bundle.radios[0], ok); }
        else { createFeedback(bundle.el, ok); }
        if (!_isEditing()) disableBundle(bundle);
      }
    } else {
      if (isSubmitted() && !_isEditing()) disableBundle(bundle);
    }
  });
  const res = localStorage.getItem(`${STORAGE_PREFIX}_result`);
  const resultBox = document.getElementById("resultBox");
  if (res && resultBox) resultBox.textContent = res;
  if (isSubmitted()) {
    const downloadBtn = ensureDownloadPdfButton();
    if (downloadBtn) downloadBtn.style.display = "inline-block";
    lockSubmitControls();
    ensureEditButton();
    if (!_isEditing()) {
      document.querySelectorAll("input, textarea, select").forEach(el => {
        const t = (el.getAttribute("type") || "").toLowerCase();
        if (["button", "submit", "reset", "file"].includes(t)) return;
        el.disabled = true;
      });
    } else {
      enableAnswerInputs();
    }
    try { await syncListeningToFirebase(); } catch (e) { console.warn("Listening sync failed on load:", e); }
    await ensureEndTestButton();
  }
});

const audio = document.getElementById("audio");
window.playClipTimer = null;
window.playClip = function(startSec, endSec) {
  if (!audio) return;
  try {
    if (window.playClipTimer) { clearInterval(window.playClipTimer); window.playClipTimer = null; }
    if (typeof startSec === "number" && !isNaN(startSec)) { audio.currentTime = Math.max(0, startSec); }
    audio.play().catch(() => { alert("Click play on the audio controls to allow playback (browser autoplay policy)."); });
    if (typeof endSec === "number" && !isNaN(endSec) && endSec > 0) {
      window.playClipTimer = setInterval(() => {
        if (audio.currentTime >= (endSec - 0.15)) { audio.pause(); clearInterval(window.playClipTimer); window.playClipTimer = null; }
      }, 300);
    }
  } catch (err) { console.error("playClip error", err); }
};

document.addEventListener("contextmenu", e => e.preventDefault());
let adminBuffer = "";
let adminBufferTimer = null;
document.addEventListener("keydown", (e) => {
  const isCmdOrCtrl = e.ctrlKey || e.metaKey;
  if (
    e.key === "F12" ||
    (isCmdOrCtrl && e.shiftKey && ["I", "J"].includes(e.key.toUpperCase())) ||
    (isCmdOrCtrl && ["U", "S"].includes(e.key.toUpperCase()))
  ) { e.preventDefault(); }
  const adminCombo = (isCmdOrCtrl && e.shiftKey);
  if (adminCombo) {
    const k = String(e.key).toUpperCase();
    if (k.length === 1) e.preventDefault();
    if (k.length === 1 && /[A-Z]/.test(k)) {
      adminBuffer += k;
      if (adminBuffer.length > 5) adminBuffer = adminBuffer.slice(-5);
      if (adminBufferTimer) clearTimeout(adminBufferTimer);
      adminBufferTimer = setTimeout(() => { adminBuffer = ""; }, 1200);
      if (adminBuffer === "RESET") { adminBuffer = ""; void adminResetFlow(); }
    }
  } else { adminBuffer = ""; }
});