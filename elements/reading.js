import "/elements/UI.js";

import { db } from "/elements/firebase.js";
import { auth } from "/elements/firebase.js";
import { ref, get, update, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
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

const PASS_ID =
  _segs.find(p => /^pass\d+$/i.test(p)) ||
  (window.location.pathname.match(/\/(pass\d+)\b/i)?.[1]) ||
  "pass1";

const DB_PATH = `readings/${TEST_ID}/${PASS_ID}/questions`;
const STORAGE_PREFIX = `reading_${TEST_ID}_${PASS_ID}`;

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

authReady.then(() => { if (auth.currentUser) loadAnswerKey().catch(() => {}); });
authReady.then(() => { if (auth.currentUser) syncReadingToFirebase().catch(() => {}); });

try {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
} catch {}

const MODE = "reading";

function _bridgeKey(suffix) {
  return `bridge_${MODE}_${TEST_ID}_${suffix}`;
}

function _extractPassId(v) {
  const s = String(v || "").toLowerCase();
  const m = s.match(/pass\d+/);
  return m ? m[0] : "";
}

function _normalizePartsList(list) {
  const arr = Array.isArray(list) ? list : [];
  const out = [];
  for (const it of arr) {
    const p = _extractPassId(it);
    if (!p) continue;
    if (!out.includes(p)) out.push(p);
  }
  out.sort((a, b) => (parseInt(a.replace("pass", ""), 10) || 0) - (parseInt(b.replace("pass", ""), 10) || 0));
  return out;
}

function _getPartsFromBridge() {
  try {
    const raw = localStorage.getItem(_bridgeKey("parts"));
    if (raw) {
      const arr = JSON.parse(raw);
      const parts = _normalizePartsList(arr);
      if (parts.length) return parts;
    }
  } catch {}

  return ["pass1", "pass2", "pass3"];
}

const _PARTS_CACHE_KEY = `edu_${MODE}_${TEST_ID}_parts_v1`;

async function _getPartsAuthoritative() {
  try {
    const cached = sessionStorage.getItem(_PARTS_CACHE_KEY);
    if (cached) {
      const arr = JSON.parse(cached);
      const parts = _normalizePartsList(arr);
      if (parts.length) return parts;
    }
  } catch {}

  let dbParts = [];
  try {
    await authReady;
    if (auth.currentUser) {
      const snap = await get(ref(db, `readings/${TEST_ID}`));
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
  else parts = ["pass1", "pass2", "pass3"];

  const cur = _extractPassId(PASS_ID) || "pass1";
  if (cur && !parts.includes(cur)) parts = parts.concat([cur]);

  try { sessionStorage.setItem(_PARTS_CACHE_KEY, JSON.stringify(parts)); } catch {}
  return parts;
}

function _isPartSubmitted(pass) {
  const p = _extractPassId(pass);
  if (!p) return false;
  return localStorage.getItem(`${MODE}_${TEST_ID}_${p}_submitted`) === "true";
}

async function _allPartsDone() {
  const parts = await _getPartsAuthoritative();
  return parts.length > 0 && parts.every(_isPartSubmitted);
}

async function _isLastPart() {
  const parts = await _getPartsAuthoritative();
  const lastFromBridge = _extractPassId(localStorage.getItem(_bridgeKey("last")));
  const last = lastFromBridge || parts[parts.length - 1] || "pass3";
  return _extractPassId(PASS_ID) === _extractPassId(last);
}


function _bridgeUrl() {
  return `/pages/study_materials/bridge.html?mode=${MODE}&test=${TEST_ID}`;
}

function _setEditing(on) {
  try { localStorage.setItem(`${STORAGE_PREFIX}_editing`, on ? "1" : "0"); } catch {}
}

function _isEditing() {
  return localStorage.getItem(`${STORAGE_PREFIX}_editing`) === "1";
}

function enableAnswerInputs() {
  document.querySelectorAll("input, textarea, select").forEach(el => {
    const t = (el.getAttribute("type") || "").toLowerCase();
    if (["button", "submit", "reset", "file"].includes(t)) return;
    el.disabled = false;
    el.style.opacity = "";
    el.style.cursor = "";
  });
  try { if (typeof wordElements !== "undefined") wordElements.forEach(w => (w.style.pointerEvents = "")); } catch {}
}

function clearFeedback() {
  document.querySelectorAll(".feedback").forEach(el => el.remove());
}

function ensureEditButton() {
  if (localStorage.getItem(`${STORAGE_PREFIX}_submitted`) !== "true") return;

  const existing = document.getElementById("editAnswersBtn");
  if (existing) existing.remove();
}

async function ensureEndTestButton() {
  if (localStorage.getItem(`${STORAGE_PREFIX}_submitted`) !== "true") return;

  await authReady;

  const allDone = await _allPartsDone();

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

  let alreadyFinalized = false;
  try {
    const user = auth.currentUser;
    if (user) {
      const snap = await get(ref(db, `students/${user.uid}/results/${MODE}/${TEST_ID}`));
      alreadyFinalized = snap.exists();
    }
  } catch (e) {
    console.warn("Could not check Firebase completion status:", e);
  }

  const goBridge = () => {
    try {
      sessionStorage.removeItem("lock_back_to_bridge");
      sessionStorage.removeItem("bridge_return_url");
    } catch {}
    location.replace(_bridgeUrl());
  };

  if (alreadyFinalized) {
    btn.textContent = "Leave test";
    btn.onclick = goBridge;
  } else if (allDone) {
    btn.textContent = "End the test";
    btn.onclick = async () => {
      try {
        sessionStorage.removeItem("lock_back_to_bridge");
        sessionStorage.removeItem("bridge_return_url");
      } catch {}
      try { await syncReadingToFirebase(); } catch {}
      goBridge();
    };
  } else {
    btn.textContent = "Leave test";
    btn.onclick = goBridge;
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

function normalizeQIdsToNumbers() {
  const qIdRegex = /^q(\d+)$/i;
  const renamedMap = new Map(); 

  document.querySelectorAll("[id]").forEach(el => {
    const oldId = String(el.id || "");
    const match = oldId.match(qIdRegex);
    if (!match) return;

    const numericId = match[1];

    const existing = document.getElementById(numericId);
    if (existing && existing !== el) {
      el.dataset.qid = numericId; 
    } else {
      el.id = numericId;
      renamedMap.set(oldId, numericId);
    }
  });

  const swapToken = (token) => {
    if (!token) return token;
    if (renamedMap.has(token)) return renamedMap.get(token);
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
      const fixed = raw.split(/\s+/).filter(Boolean).map(swapToken).join(" ");
      if (fixed !== raw) el.setAttribute(attr, fixed);
    });
  });
}

const ADMIN_SALT_HEX = "54ce55256fdf06d56c022779d46a713b";
const ADMIN_HASH_HEX = "e56bd3e717886a85c9e3336bf4ed7fb1d564be6b46dfa17d102c930588d65f00";

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
  if (!ok) { alert("❌ Wrong admin password."); return; }
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

const readingText = document.getElementById("readingText");

function wrapWords(element) {
  if (!element) return;
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === 3) { 
      const words = node.textContent.split(/(\s+)/);
      const fragment = document.createDocumentFragment();
      words.forEach(word => {
        if (word.trim().length > 0) {
          const span = document.createElement("span");
          span.className = "word";
          span.textContent = word;
          fragment.appendChild(span);
        } else {
          fragment.appendChild(document.createTextNode(word));
        }
      });
      node.replaceWith(fragment);
    } else if (node.nodeType === 1 && node.tagName !== "INPUT" && !node.classList.contains("controls")) {
      wrapWords(node);
    }
  }
}

wrapWords(readingText);
const wordElements = document.querySelectorAll(".word");

function restoreMarkedWords() {
  try {
    document.querySelectorAll(".word.marked").forEach((w) => w.classList.remove("marked"));

    const savedMarks = JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}_markedWords`) || "[]");
    savedMarks.forEach((i) => {
      if (wordElements[i]) wordElements[i].classList.add("marked");
    });
  } catch {}
}


let selectionBar = null;
let lastMarkingAction = { type: null, indices: [] }; 
let tempSelectedIndices = [];

function createSelectionBar() {
  if (selectionBar) return selectionBar;
  
  const bar = document.createElement("div");
  bar.className = "selection-bar";
  bar.innerHTML = `
    <button class="mark-btn" id="markSelectionBtn">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12v2H2zM2 6h12v2H2zM2 10h8v2H2z"/>
      </svg>
      Mark
    </button>
    <button class="unmark-btn" id="unmarkSelectionBtn">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2h12v2H2zM2 6h12v2H2zM2 10h8v2H2z" opacity="0.3"/>
      </svg>
      Unmark
    </button>
    <button class="undo-btn" id="undoMarkBtn" title="Undo">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 2a6 6 0 0 1 6 6h2A8 8 0 0 0 2 8h2a6 6 0 0 1 4-5.66V2z"/>
        <path d="M2 8l3 3 3-3H2z"/>
      </svg>
    </button>
  `;
  document.body.appendChild(bar);
  
  bar.querySelector("#markSelectionBtn").addEventListener("click", () => markSelectedWords(true));
  bar.querySelector("#unmarkSelectionBtn").addEventListener("click", () => markSelectedWords(false));
  bar.querySelector("#undoMarkBtn").addEventListener("click", undoLastMarking);
  
  selectionBar = bar;
  return bar;
}

function saveMarkedWords() {
  const markedIndexes = Array.from(document.querySelectorAll(".word"))
    .map((w, idx) => w.classList.contains("marked") ? idx : null)
    .filter(idx => idx !== null);
  localStorage.setItem(`${STORAGE_PREFIX}_markedWords`, JSON.stringify(markedIndexes));
}

function getSelectedWordIndices() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return [];
  const range = selection.getRangeAt(0);
  const selectedWords = [];
  wordElements.forEach((word, idx) => {
    if (range.intersectsNode(word)) {
      selectedWords.push(idx);
    }
  });
  return selectedWords;
}

function clearTempSelection() {
  tempSelectedIndices.forEach(idx => {
    if(wordElements[idx]) wordElements[idx].classList.remove("temp-selected");
  });
  tempSelectedIndices = [];
}

function markSelectedWords(shouldMark) {
  if (tempSelectedIndices.length === 0) {
    hideSelectionBar();
    return;
  }
  
  lastMarkingAction = {
    type: shouldMark ? 'mark' : 'unmark',
    indices: [...tempSelectedIndices],
    previousStates: tempSelectedIndices.map(i => wordElements[i].classList.contains("marked"))
  };
  
  tempSelectedIndices.forEach((idx, i) => {
    const el = wordElements[idx];
    el.classList.remove("temp-selected");
    
    setTimeout(() => {
      if (shouldMark) {
        el.classList.add("marked");
        el.style.animation = "markPulse 0.3s ease";
      } else {
        el.classList.remove("marked");
        el.style.animation = "unmarkFade 0.3s ease";
      }
      setTimeout(() => { el.style.animation = ""; }, 300);
    }, i * 20);
  });
  
  tempSelectedIndices = [];
  saveMarkedWords();
  hideSelectionBar();
}

function undoLastMarking() {
  if (!lastMarkingAction.type || lastMarkingAction.indices.length === 0) return;
  lastMarkingAction.indices.forEach((idx, i) => {
    const wasMarked = lastMarkingAction.previousStates[i];
    if (wasMarked) wordElements[idx].classList.add("marked");
    else wordElements[idx].classList.remove("marked");
  });
  saveMarkedWords();
  lastMarkingAction = { type: null, indices: [] };
  hideSelectionBar();
}

let lastMouseX = 0;
let lastMouseY = 0;

function showSelectionBar(rect) {
  const bar = createSelectionBar();
  
  bar.style.display = "flex";
  bar.style.position = "fixed"; 
  bar.style.zIndex = "9999";
  
  const barWidth = 240; 
  const barHeight = 50;
  const padding = 15;

  let left = lastMouseX - (barWidth / 2);
  let top = lastMouseY + 20; 
  
  if (left < padding) left = padding;
  if (left + barWidth > window.innerWidth - padding) {
    left = window.innerWidth - barWidth - padding;
  }
  
  if (top + barHeight > window.innerHeight - padding) {
    top = lastMouseY - barHeight - 20; 
  }
  
  bar.style.left = `${left}px`;
  bar.style.top = `${top}px`;
  
  requestAnimationFrame(() => {
    bar.style.opacity = "1";
    bar.style.transform = "translateY(0) scale(1)";
  });
}

function hideSelectionBar() {
  if (selectionBar) {
    selectionBar.style.opacity = "0";
    selectionBar.style.transform = "translateY(10px) scale(0.95)";
    setTimeout(() => { selectionBar.style.display = "none"; }, 200);
  }
}

async function initReadingUserState() {
  await authReady;
  restoreMarkedWords();

  if (!localStorage.getItem(`${STORAGE_PREFIX}_submitted`)) {
  
    document.addEventListener("mousemove", (e) => {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
  
    document.addEventListener("mouseup", (e) => {
      setTimeout(() => {
        const selection = window.getSelection();
        
        if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0) {
          if (tempSelectedIndices.length === 0) hideSelectionBar();
          return;
        }
  
        const range = selection.getRangeAt(0);
        const rects = range.getClientRects();
        
        if (!readingText.contains(range.commonAncestorContainer)) {
          selection.removeAllRanges();
          return;
        }
  
        const rect = rects.length > 0 ? rects[0] : range.getBoundingClientRect();
  
        if (rect.width > 2 && rect.height > 2) {
          const indices = getSelectedWordIndices();
          
          if (indices.length > 0) {
            tempSelectedIndices = indices;
            selection.removeAllRanges();
            indices.forEach(idx => {
              if(wordElements[idx]) wordElements[idx].classList.add("temp-selected");
            });
            showSelectionBar(rect);
          }
        } 
      }, 20); 
    });
  
    wordElements.forEach((word, i) => {
      word.addEventListener("click", (e) => {
        if (tempSelectedIndices.length > 0) return;
        
        const wasMarked = word.classList.contains("marked");
        word.classList.toggle("marked");
        
        lastMarkingAction = {
          type: wasMarked ? 'unmark' : 'mark',
          indices: [i],
          previousStates: [wasMarked]
        };
        
        word.style.animation = wasMarked ? "unmarkFade 0.3s ease" : "markPulse 0.3s ease";
        setTimeout(() => { word.style.animation = ""; }, 300);
        saveMarkedWords();
      });
    });
    
    document.addEventListener("mousedown", (e) => {
      if (selectionBar && selectionBar.contains(e.target)) return;
      if (tempSelectedIndices.length > 0) {
        clearTempSelection();
        hideSelectionBar();
      }
    });
    
    document.addEventListener("scroll", () => {
      if (tempSelectedIndices.length > 0) {
        clearTempSelection();
        hideSelectionBar();
      }
    }, { passive: true });
  
  } else {
    wordElements.forEach(w => (w.style.pointerEvents = "none"));
  }
}

initReadingUserState().catch(() => {});


function createFeedback(el, correct) {
  const old = el.nextElementSibling?.classList.contains("feedback") ? el.nextElementSibling : null;
  if (old) old.remove();
  const fb = document.createElement("span");
  fb.className = "feedback";
  fb.style.cssText = `margin-left:8px; font-weight:bold; color: ${correct ? 'green' : 'red'}`;
  fb.textContent = correct ? "✅ Correct" : "❌ Wrong";
  if (window.innerWidth <= 768) { fb.style.display = "block"; fb.style.marginLeft = "0"; }
  el.insertAdjacentElement("afterend", fb);
}

function disableAnswerInputs() {
  document.querySelectorAll("input").forEach(inp => {
    const t = (inp.getAttribute("type") || "text").toLowerCase();
    if (["button","submit","reset","checkbox","radio","file"].includes(t)) return;
    inp.disabled = true;
    inp.style.opacity = "0.85";
    inp.style.cursor = "not-allowed";
  });
  document.querySelectorAll("textarea").forEach(ta => {
    ta.disabled = true;
    ta.style.opacity = "0.85";
    ta.style.cursor = "not-allowed";
  });
}

function _isoNow() { return new Date().toISOString(); }

function safeKey(s) {
  return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
}

const VOCAB_BUCKET = "readings";
const VOCAB_KEY = safeKey(TEST_ID);

function _prettyTestName() {
  return `Reading ${String(TEST_ID).toUpperCase()}`;
}

function _vocabPath(uid) {
  return `students/${uid}/progress/vocabularies/${VOCAB_BUCKET}/${VOCAB_KEY}`;
}

async function _touchVocabOpened(uid) {
  if (!uid) return;
  const path = _vocabPath(uid);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  await runTransaction(ref(db, path), (cur) => {
    const c = (cur && typeof cur === "object") ? cur : {};
    const openedAtMs = Number(c.openedAtMs || nowMs);
    const openedAt = c.openedAt || nowIso;

    return {
      ...c,
      name: c.name || _prettyTestName(),
      type: c.type || MODE,
      bucket: c.bucket || VOCAB_BUCKET,

      opened: true,
      completed: !!c.completed,

      attempts: Number(c.attempts || 0),

      openedAtMs,
      openedAt,

      updatedAtMs: Number(c.updatedAtMs) || nowMs,
      updatedAt: c.updatedAt || nowIso,
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
      type: c.type || MODE,
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

function _passPrefix(pass) {
  const p = _extractPassId(pass) || "pass1";
  return `reading_${TEST_ID}_${p}`;
}

function _passLocalScore(pass) {
  try {
    const prefix = _passPrefix(pass);
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

async function _aggregateScore(uid, passes) {
  const perPart = {};
  let total = 0, correct = 0, wrong = 0;

  const list = Array.isArray(passes) ? passes : [];
  for (const pass of list) {
    const p = _extractPassId(pass);
    if (!p) continue;
    const s = _passLocalScore(p);
    if (s) {
      perPart[p] = { correct: s.correct, total: s.total, wrong: s.wrong };
      total += s.total;
      correct += s.correct;
      wrong += s.wrong;
    }
  }

  for (const pass of list) {
    const p = _extractPassId(pass);
    if (!p || perPart[p]) continue;
    try {
      const snap = await get(ref(db, `students/${uid}/progress/${MODE}/${TEST_ID}/${p}`));
      if (snap.exists()) {
        const v = snap.val() || {};
        const c = Number(v.correct || 0);
        const t = Number(v.total || 0);
        const w = Number(v.incorrect ?? v.wrong ?? Math.max(0, t - c));
        perPart[p] = { correct: c, total: t, wrong: w };
        total += t;
        correct += c;
        wrong += w;
      }
    } catch {}
  }

  return { total, correct, wrong, perPart };
}

async function _writePassProgress(uid, pass, score) {
  const p = _extractPassId(pass);
  if (!uid || !p || !score) return;

  const progressPath = `students/${uid}/progress/${MODE}/${TEST_ID}/${p}`;
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

  const agg = await _aggregateScore(uid, parts);

  if (Object.keys(agg.perPart).length !== parts.length) {
    return { finalized: false, reason: "missing_scores" };
  }

  try {
    await _updateVocabProgress(uid, { completedNow: true, correct: agg.correct, total: agg.total, wrong: agg.wrong });
  } catch (e) {
    console.warn("Vocab progress sync failed:", e);
  }

  const resultPath = `students/${uid}/results/${MODE}/${TEST_ID}`;
  const resultObj = {
    mode: MODE,
    testId: TEST_ID,
    completedAt: _isoNow(),
    correct: agg.correct,
    wrong: agg.wrong,
    total: agg.total,
    perPart: agg.perPart
  };

  const tx = await runTransaction(ref(db, resultPath), (cur) => {
    if (cur) return; 
    return resultObj;
  }, { applyLocally: false });

  if (!tx.committed) {
    return { finalized: false, reason: "already_finalized" };
  }

  await runTransaction(ref(db, `students/${uid}/stats/readingsCompleted`), (cur) => {
    const n = Number(cur);
    return (Number.isFinite(n) ? n : 0) + 1;
  }, { applyLocally: false });

  return { finalized: true };
}

async function syncReadingToFirebase() {
  await authReady;
  const user = auth.currentUser;
  if (!user) return;

  try { await _touchVocabOpened(user.uid); } catch {}

  const parts = await _getPartsAuthoritative();

  const curPass = _extractPassId(PASS_ID);
  if (curPass && _isPartSubmitted(curPass)) {
    const score = _passLocalScore(curPass);
    if (score) {
      try { await _writePassProgress(user.uid, curPass, score); } catch (e) { console.warn("Pass progress sync failed:", e); }
    }
  }

  try {
    const submittedPasses = parts.filter(_isPartSubmitted);
    if (submittedPasses.length) {
      const agg = await _aggregateScore(user.uid, submittedPasses);
      await _updateVocabProgress(user.uid, { completedNow: false, correct: agg.correct, total: agg.total, wrong: agg.wrong });
    }
  } catch (e) {
    console.warn("Aggregate progress sync failed:", e);
  }

  await _finalizeTestIfComplete(user.uid);
}

window.checkAnswers = async function() {
  await authReady;
  normalizeQIdsToNumbers();
  if (localStorage.getItem(`${STORAGE_PREFIX}_submitted`) === "true") {
    const rb = document.getElementById("resultBox");
    if (rb) {
      rb.textContent = localStorage.getItem(`${STORAGE_PREFIX}_result`) || "✅ Already submitted. You can’t change answers.";
    }
    ensureEndTestButton();
    return;
  }

  localStorage.setItem(`${STORAGE_PREFIX}_attempts`, "1");

  const answers = await loadAnswerKey();
  if (!answers) return alert("Error: Answer key not found in Firebase.");

  wordElements.forEach(w => (w.style.pointerEvents = "none"));

  let correctCount = 0;
  const qids = Object.keys(answers);

  qids.forEach(qid => {
    const cleanId = qid.trim();
    const input = document.getElementById(cleanId) || document.querySelector(`[data-qid="${cleanId}"]`);
    if (!input) return;

    const userVal = input.value.trim();
    localStorage.setItem(`${STORAGE_PREFIX}_${cleanId}`, userVal);

    const isCorrect = answers[qid].some(a => a.toLowerCase() === userVal.toLowerCase());
    createFeedback(input, isCorrect);
    if (isCorrect) correctCount++;
  });

  const resText = `✅ Correct: ${correctCount} / ${qids.length}`;
  document.getElementById("resultBox").textContent = resText;
  localStorage.setItem(`${STORAGE_PREFIX}_result`, resText);

  try {
    localStorage.setItem(`${STORAGE_PREFIX}_correctCount`, String(correctCount));
    localStorage.setItem(`${STORAGE_PREFIX}_totalCount`, String(qids.length));
  } catch {}


  const prevAttempt = +(localStorage.getItem(`${STORAGE_PREFIX}_attempt`) || 0);
  localStorage.setItem(`${STORAGE_PREFIX}_attempt`, String(prevAttempt + 1));
  localStorage.setItem(`${STORAGE_PREFIX}_submittedAt`, new Date().toISOString());

  localStorage.setItem(`${STORAGE_PREFIX}_submitted`, "true");
  try { await syncReadingToFirebase(); } catch {}

  _setEditing(false);
  const downloadBtn = ensureDownloadPdfButton();
  if (downloadBtn) downloadBtn.style.display = "inline-block";
  disableAnswerInputs();
  lockSubmitControls();
  try { wordElements.forEach(w => (w.style.pointerEvents = "none")); } catch {}

  ensureEditButton();
  ensureEndTestButton();
};

function addWatermark(doc, { testId, passId }) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.saveGraphicsState();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(48);
  doc.setTextColor(235, 235, 235);
  doc.text("Edu department", w / 2, h / 2, { align: "center", angle: 25 });
  doc.setFontSize(16);
  doc.text(`${String(testId).toUpperCase()} • ${String(passId).toUpperCase()}`, w / 2, h / 2 + 35, { align: "center", angle: 25 });
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
  addWatermark(doc, { testId: TEST_ID, passId: PASS_ID });

  const answers = await loadAnswerKey();
  if (!answers) return alert("Database error.");

  let y = 50;
  const margin = 50;
  const pageWidth = 595;
  const submittedAt = new Date(localStorage.getItem(`${STORAGE_PREFIX}_submittedAt`) || Date.now()).toLocaleString();
  const attempt = localStorage.getItem(`${STORAGE_PREFIX}_attempt`) || "—";

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  doc.setFont("times", "italic"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text("Official Examination Record", margin, y);
  y += 20;
  doc.setFont("helvetica", "bold"); doc.setFontSize(22);
  doc.text(String(TEST_ID).toUpperCase(), margin, y);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  doc.text(String(PASS_ID).toUpperCase(), pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
  doc.text(`Submitted: ${submittedAt}`, margin, y);
  doc.text(`Attempt: ${attempt}`, pageWidth - margin, y, { align: "right" });
  y += 14;
  doc.setTextColor(0, 0, 0);
  y += 10;
  doc.line(margin, y, pageWidth - margin, y);
  y += 45;

  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text("NO.", margin, y); doc.text("USER SUBMISSION", margin + 45, y); doc.text("CORRECT KEY", margin + 300, y);
  y += 15;

  const qids = Object.keys(answers).sort((a, b) => {
    const na = Number(a), nb = Number(b);
    const aNum = Number.isFinite(na), bNum = Number.isFinite(nb);
    if (aNum && bNum) return na - nb;
    if (aNum) return -1;
    if (bNum) return 1;
    return String(a).localeCompare(String(b));
  });

  qids.forEach((qid, index) => {
    const cleanId = String(qid).trim();
    const userAns = String(localStorage.getItem(`${STORAGE_PREFIX}_${cleanId}`) || "—");

    const arr = Array.isArray(answers[qid]) ? answers[qid] : [answers[qid]];
    const correctAns = String(arr.filter(v => v != null).map(String).join(" / ") || "—");

    doc.setDrawColor(245, 245, 245);
    doc.line(margin, y + 5, pageWidth - margin, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`${(index + 1).toString().padStart(2, "0")}`, margin, y + 20);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(userAns, margin + 45, y + 20);

    doc.setTextColor(0, 128, 0);
    doc.setFont("helvetica", "bold");
    doc.text(correctAns, margin + 300, y + 20);

    y += 28;
    if (y > 750) {
      doc.addPage();
      addWatermark(doc, { testId: TEST_ID, passId: PASS_ID });
      y = 60;
    }
  });

  y += 40;
  const cleanResult = (localStorage.getItem(`${STORAGE_PREFIX}_result`) || "No Result").replace(/[^\x20-\x7E]/g, "");
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.75);
  doc.rect(margin, y, pageWidth - margin * 2, 55);
  doc.setFont("times", "italic"); doc.setFontSize(11); doc.setTextColor(100, 100, 100);
  doc.text("Performance Summary", margin + 20, y + 22);
  doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(0, 0, 0);
  doc.text(String(cleanResult), margin + 20, y + 42);
  addFooterPageNumbers(doc);
  doc.save(`${TEST_ID}_${PASS_ID}_Results.pdf`);
};

window.onload = async () => {
  await authReady;
  normalizeQIdsToNumbers();

  const answers = await loadAnswerKey();
  if (!answers) return;

  Object.keys(answers).forEach(qid => {
    const cleanId = qid.trim();
    const saved = localStorage.getItem(`${STORAGE_PREFIX}_${cleanId}`);
    
    const input = document.getElementById(cleanId) || document.querySelector(`[data-qid="${cleanId}"]`);
    
    if (input && saved !== null) {
      input.value = saved;
      
      if (localStorage.getItem(`${STORAGE_PREFIX}_submitted`) === "true") {
        const isCorrect = answers[qid].some(a => a.toLowerCase() === saved.toLowerCase());
        createFeedback(input, isCorrect);
      }
    }
  });

  const res = localStorage.getItem(`${STORAGE_PREFIX}_result`);
  if (res) {
    const rb = document.getElementById("resultBox");
    if (rb) rb.textContent = res;
  }

  if (localStorage.getItem(`${STORAGE_PREFIX}_submitted`) === "true") {
    const downloadBtn = document.getElementById("downloadPdfBtn");
    if (downloadBtn) downloadBtn.style.display = "inline-block";
    disableAnswerInputs();
    lockSubmitControls();
    
    try { if (typeof wordElements !== "undefined") wordElements.forEach(w => (w.style.pointerEvents = "none")); } catch {}
    
    ensureEditButton();
    ensureEndTestButton();
  }
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
  ) {
    e.preventDefault();
  }

  const adminCombo = (isCmdOrCtrl && e.shiftKey);

  if (adminCombo) {
    const k = String(e.key).toUpperCase();
    
    if (k.length === 1) e.preventDefault();

    if (k.length === 1 && /[A-Z]/.test(k)) {
      adminBuffer += k;
      if (adminBuffer.length > 5) adminBuffer = adminBuffer.slice(-5);

      if (adminBufferTimer) clearTimeout(adminBufferTimer);
      adminBufferTimer = setTimeout(() => { adminBuffer = ""; }, 1200);

      if (adminBuffer === "RESET") {
        adminBuffer = "";
        void adminResetFlow();
      }
    }
  } else {
    adminBuffer = "";
  }
});