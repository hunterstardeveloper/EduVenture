// account.page.js (ES module)

import { auth, rtdb } from "/elements/firebase.js";

import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  ref,
  get,
  update,
  runTransaction,
  serverTimestamp,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* -----------------------------
   Helper functions
----------------------------- */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Username -> synthetic email (matches your reg.page.js logic)
function normalizeUsername(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^@+/, "");
}

function isValidUsername(usernameLower) {
  return /^[a-z0-9._]{3,20}$/.test(String(usernameLower || ""));
}

function usernameToEmail(usernameLower) {
  return `${String(usernameLower || "").trim().toLowerCase()}@eduventure.local`;
}


function normalizePhone(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const hasPlus = s.startsWith("+");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return "";
  return (hasPlus ? "+" : "") + digits;
}
function phoneKey(phoneNorm) {
  return String(phoneNorm || "").replace(/[^\d]/g, "");
}
function isValidPhone(phoneNorm) {
  const digits = phoneKey(phoneNorm);
  return digits.length >= 7 && digits.length <= 15;
}

// ✅ FIXED: Simplified group extraction - no auto-derivation from email
function getGroupFromProfile(profile) {
  const g = profile?.group_name ?? profile?.group ?? profile?.groupName;
  return String(g || "").trim() || "Ungrouped";
}

/* -----------------------------
   DOM helpers
----------------------------- */
const $id = (id) => document.getElementById(id);

function safeText(el, value) {
  if (!el) return;
  el.textContent = value ?? "";
}

function formatMonthYear(msOrIso) {
  try {
    const d = typeof msOrIso === "number" ? new Date(msOrIso) : new Date(msOrIso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function deriveNameFromEmail(email) {
  const raw = String(email || "").split("@")[0] || "Student";
  return raw
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

function getInitials(name, fallbackEmail) {
  const base = String(name || "").trim() || deriveNameFromEmail(fallbackEmail);
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

/* -----------------------------
   Toast
----------------------------- */
const Toast = (() => {
  const id = "toast-container-eduventure";
  const ensure = () => {
    let c = document.getElementById(id);
    if (c) return c;

    c = document.createElement("div");
    c.id = id;
    c.style.cssText = `
      position: fixed; top: 18px; right: 18px; z-index: 999999;
      display: grid; gap: 10px; max-width: min(420px, calc(100vw - 36px));
    `;

    const style = document.createElement("style");
    style.textContent = `
      .t{display:grid;grid-template-columns:10px 1fr auto;gap:12px;align-items:start;
        padding:12px 14px;background:#111827;color:#fff;border-radius:12px;
        box-shadow:0 10px 24px rgba(0,0,0,.18)}
      .b{width:10px;height:100%;border-radius:10px}
      .m{font-size:14px;line-height:1.35}
      .x{background:transparent;border:0;color:rgba(255,255,255,.85);cursor:pointer;font-size:14px;padding:0 6px}
      .success .b{background:#10b981}.error .b{background:#ef4444}.info .b{background:#3b82f6}
    `;
    document.head.appendChild(style);
    document.body.appendChild(c);
    return c;
  };

  const show = (msg, type = "info", ttl = 2600) => {
    const c = ensure();
    const el = document.createElement("div");
    el.className = `t ${type}`;
    el.innerHTML = `<div class="b"></div><div class="m"></div><button class="x" aria-label="Close">✕</button>`;
    el.querySelector(".m").textContent = msg;

    const remove = () => el.remove();
    el.querySelector(".x").addEventListener("click", remove);
    c.appendChild(el);
    setTimeout(remove, Math.max(1200, ttl));
  };

  return { show };
})();

/* -----------------------------
   Navigation
----------------------------- */
function setupSectionNavigation() {
  const links = Array.from(document.querySelectorAll(".sidebar-nav .nav-link"));
  const sections = Array.from(document.querySelectorAll(".content-section"));

  const show = (key) => {
    if (!key) key = "overview";

    links.forEach((a) => a.classList.toggle("active", a.dataset.section === key));
    sections.forEach((sec) => sec.classList.toggle("active", sec.id === `${key}-section`));

    try {
      history.replaceState(null, "", `#${key}`);
    } catch {}
  };

  links.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      show(a.dataset.section);
    });
  });

  const initial = (location.hash || "").replace("#", "");
  show(initial || "overview");
}

/* -----------------------------
   RTDB helpers
----------------------------- */
let currentUser = null;
let cachedProfile = null;
let cachedStats = null;
let cachedProgress = null;
let cachedMarksWords = null;

let historyEntries = [];
let historyFilter = "all";
let statsSyncTimer = null;
let unsubscribeFns = [];



/* -----------------------------
   Local cache (fast first paint for slow internet)
----------------------------- */
const CACHE_PREFIX = "eduventure_v1_";
function cacheKey(uid, part) {
  return `${CACHE_PREFIX}${part}_${uid}`;
}
function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
function readCachedStudent(uid) {
  const p = safeJsonParse(localStorage.getItem(cacheKey(uid, "profile")) || "null");
  const s = safeJsonParse(localStorage.getItem(cacheKey(uid, "stats")) || "null");
  if (p && typeof p === "object") cachedProfile = p;
  if (s && typeof s === "object") cachedStats = s;
}
function writeCachedStudent(uid) {
  try {
    if (cachedProfile) localStorage.setItem(cacheKey(uid, "profile"), JSON.stringify(cachedProfile));
    if (cachedStats) localStorage.setItem(cacheKey(uid, "stats"), JSON.stringify(cachedStats));
  } catch {
    // ignore quota / private mode issues
  }
}

function setLoading(on) {
  document.documentElement.style.cursor = on ? "progress" : "";
}

function studentProfileRef(uid) {
  return ref(rtdb, `students/${uid}/profile`);
}
function studentStatsRef(uid) {
  return ref(rtdb, `students/${uid}/stats`);
}

function studentProgressRef(uid) {
  return ref(rtdb, `students/${uid}/progress`);
}

function studentMarksWordsRef(uid) {
  return ref(rtdb, `students/${uid}/marks/words`);
}

function phoneIndexRef(phoneKeyDigits) {
  return ref(rtdb, `phones/${phoneKeyDigits}`);
}

// ✅ idempotent: if already claimed by same uid, keep it
async function claimPhoneOrThrow(phoneKeyDigits, uid) {
  const res = await runTransaction(phoneIndexRef(phoneKeyDigits), (current) => {
    if (current == null) return uid;     // claim new
    if (current === uid) return current; // already ours
    return;                               // abort (taken)
  });

  if (!res.committed) throw new Error("phone_taken");
}

async function releasePhoneIfOwned(phoneKeyDigits, uid) {
  if (!phoneKeyDigits) return;
  try {
    const snap = await get(phoneIndexRef(phoneKeyDigits));
    if (snap.exists() && String(snap.val() || "") === uid) {
      await update(ref(rtdb), { [`phones/${phoneKeyDigits}`]: null });
    }
  } catch {
    // ignore
  }
}

/* -----------------------------
   Username index helpers (unique usernames)
----------------------------- */
function usernameIndexRef(uname) {
  return ref(rtdb, `usernames/${uname}`);
}
function usernameIndexRefStudents(uname) {
  return ref(rtdb, `students/usernames/${uname}`);
}

// idempotent: if already claimed by same uid, keep it
async function claimUsernameOrThrow(uname, uid) {
  const res = await runTransaction(usernameIndexRef(uname), (current) => {
    if (current == null) return uid;
    if (current === uid) return current;
    return; // abort (taken)
  });

  if (!res.committed) throw new Error("username_taken");

  // Mirror to legacy path too (some older pages may still read it)
  await update(ref(rtdb), {
    [`students/usernames/${uname}`]: uid,
  });
}

async function releaseUsernameIfOwned(uname, uid) {
  if (!uname) return;
  try {
    const snap = await get(usernameIndexRef(uname));
    if (snap.exists() && String(snap.val() || "") === uid) {
      await update(ref(rtdb), {
        [`usernames/${uname}`]: null,
        [`students/usernames/${uname}`]: null,
      });
    }
  } catch {
    // ignore
  }
}

function hasPasswordProvider(user) {
  return (
    Array.isArray(user?.providerData) &&
    user.providerData.some((p) => p?.providerId === "password")
  );
}

function promptPasswordModal({ title, message, confirmText = "Confirm", cancelText = "Cancel" } = {}) {
  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 28px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    `;

    modalContent.innerHTML = `
      <h2 style="margin:0 0 8px 0; font-size:22px; color:#111827;">${title || "Confirm"}</h2>
      <p style="margin:0 0 18px 0; color:#6b7280; font-size:14px;">${message || ""}</p>

      <div style="margin-bottom: 18px;">
        <label style="display:block; font-size:14px; font-weight:600; margin-bottom:8px; color:#111827;">Password</label>
        <input type="password" id="confirmPasswordOnly" placeholder="Enter your password"
          style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
      </div>

      <div style="display:flex; gap:10px; justify-content:flex-end;">
        <button id="cancelConfirm" style="padding: 10px 20px; border: 1px solid #e5e7eb; background: white; color: #111827; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ${cancelText}
        </button>
        <button id="confirmConfirm" style="padding: 10px 20px; border: none; background: #1f2937; color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
          ${confirmText}
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const input = modalContent.querySelector("#confirmPasswordOnly");
    const cancelBtn = modalContent.querySelector("#cancelConfirm");
    const confirmBtn = modalContent.querySelector("#confirmConfirm");

    const close = (value) => {
      try { modal.remove(); } catch {}
      resolve(value);
    };

    cancelBtn.addEventListener("click", () => close(null));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close(null);
    });

    confirmBtn.addEventListener("click", () => {
      const v = String(input?.value || "").trim();
      if (!v) {
        Toast.show("Please enter your password.", "error", 3200);
        return;
      }
      close(v);
    });

    setTimeout(() => input?.focus(), 80);
  });
}

async function updateEmailWithReauth(user, oldEmail, newEmail) {
  try {
    await updateEmail(user, newEmail);
  } catch (e) {
    if (e?.code !== "auth/requires-recent-login") throw e;

    const pwd = await promptPasswordModal({
      title: "Confirm username change",
      message: "For security, please enter your password to change your username.",
      confirmText: "Confirm",
    });

    if (!pwd) throw e;

    const credential = EmailAuthProvider.credential(oldEmail, pwd);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);
  }
}


async function ensureStudentDoc(user) {
  const uid = user.uid;

  const [pSnap, sSnap] = await Promise.all([
    get(studentProfileRef(uid)),
    get(studentStatsRef(uid)),
  ]);

  const profile = pSnap.exists() ? (pSnap.val() || {}) : null;
  const stats = sSnap.exists() ? (sSnap.val() || {}) : null;

  const email = user.email || "";
  const creationMs = Date.parse(user?.metadata?.creationTime || "");
  const createdAtValue = Number.isFinite(creationMs) ? creationMs : serverTimestamp();

  const toWrite = {};

  if (!profile) {
    toWrite[`students/${uid}/profile`] = {
      name: user.displayName || deriveNameFromEmail(email),
      email,
      phone: "",
      registration_date: todayISO(),
      createdAt: createdAtValue,
    };
  } else {
    const patch = {};
    if (!profile.name) patch.name = user.displayName || deriveNameFromEmail(email);
    if (!profile.email && email) patch.email = email;
    if (!profile.registration_date) patch.registration_date = todayISO();
    if (profile.createdAt == null) patch.createdAt = createdAtValue;

    if (Object.keys(patch).length) {
      toWrite[`students/${uid}/profile`] = patch;
    }
  }

  if (!stats) {
    toWrite[`students/${uid}/stats`] = {
      readingsCompleted: 0,
      listeningsCompleted: 0,
      wordsLearned: 0,
      lessonsCompleted: 0,
    };
  } else {
    const patch = {};
    const keys = ["readingsCompleted", "listeningsCompleted", "wordsLearned", "lessonsCompleted"];
    for (const k of keys) if (stats[k] == null) patch[k] = 0;
    if (Object.keys(patch).length) toWrite[`students/${uid}/stats`] = patch;
  }

  if (Object.keys(toWrite).length) {
    await update(ref(rtdb), toWrite);
  }
}

async function loadStudentData(uid) {
  const [pSnap, sSnap] = await Promise.all([
    get(studentProfileRef(uid)),
    get(studentStatsRef(uid)),
  ]);

  cachedProfile = pSnap.exists() ? (pSnap.val() || {}) : null;
  cachedStats = sSnap.exists() ? (sSnap.val() || {}) : null;
  writeCachedStudent(uid);
}


async function refreshProgressAndHistory(uid) {
  try {
    const [pSnap, mSnap] = await Promise.all([
      get(studentProgressRef(uid)),
      get(studentMarksWordsRef(uid)),
    ]);

    cachedProgress = pSnap.exists() ? (pSnap.val() || {}) : null;
    cachedMarksWords = mSnap.exists() ? (mSnap.val() || {}) : null;

    historyEntries = buildHistoryEntries(cachedProgress || {});
    renderHistory(historyEntries);

    const derived = deriveStatsFrom(cachedProgress || {}, cachedMarksWords || {}, cachedStats || {});
    // render immediately (even if we don't sync)
    cachedStats = derived;
    writeCachedStudent(uid);
    renderStats(cachedStats);

    // also push to RTDB so other pages can use it
    scheduleStatsSync(uid, derived);

  } catch (e) {
    console.warn(e);
    Toast.show("Could not refresh history (offline?).", "info", 2600);
  }
}

function startRealtimeListeners(uid) {
  // cleanup old
  try { unsubscribeFns.forEach((u) => u()); } catch {}
  unsubscribeFns = [];

  // stats listener
  const statsRef = studentStatsRef(uid);
  const offStats = onValue(statsRef, (snap) => {
    cachedStats = snap.exists() ? (snap.val() || {}) : (cachedStats || {});
    writeCachedStudent(uid);
    renderStats(cachedStats);
  });
  unsubscribeFns.push(() => offStats());

  // progress listener (drives history + derived stats)
  const progRef = studentProgressRef(uid);
  const offProg = onValue(progRef, (snap) => {
    cachedProgress = snap.exists() ? (snap.val() || {}) : null;
    historyEntries = buildHistoryEntries(cachedProgress || {});
    renderHistory(historyEntries);

    const derived = deriveStatsFrom(cachedProgress || {}, cachedMarksWords || {}, cachedStats || {});
    // immediate UI update
    cachedStats = derived;
    writeCachedStudent(uid);
    renderStats(cachedStats);
    scheduleStatsSync(uid, derived);
  });
  unsubscribeFns.push(() => offProg());

  // marks listener (words learned)
  const marksRef = studentMarksWordsRef(uid);
  const offMarks = onValue(marksRef, (snap) => {
    cachedMarksWords = snap.exists() ? (snap.val() || {}) : null;

    const derived = deriveStatsFrom(cachedProgress || {}, cachedMarksWords || {}, cachedStats || {});
    cachedStats = derived;
    writeCachedStudent(uid);
    renderStats(cachedStats);
    scheduleStatsSync(uid, derived);
  });
  unsubscribeFns.push(() => offMarks());
}

/* -----------------------------
   Render
----------------------------- */
function renderProfile(user, profile) {
  const name = profile?.name || user?.displayName || deriveNameFromEmail(user?.email);
  const email = profile?.email || user?.email || "";
  const username = profile?.username || "";
  const identity = username ? `@${username}` : email;
  const phone = profile?.phone || "";
  const createdAt = profile?.createdAt ?? user?.metadata?.creationTime ?? null;

  const group = getGroupFromProfile(profile);

  safeText($id("userAvatar"), getInitials(name, email));
  safeText($id("userName"), name);
  safeText($id("userEmail"), identity);

  safeText($id("welcomeName"), (name.split(" ")[0] || name));
  safeText($id("profileName"), name);
  safeText($id("profileEmail"), identity);
  safeText($id("profilePhone"), phone || "Not provided");
  safeText($id("memberSince"), formatMonthYear(createdAt));
  safeText($id("profileGroup"), group);

  const editName = $id("editName");
  const editEmail = $id("editEmail");
  const editPhone = $id("editPhone");
  const editGroup = $id("editGroup");

  if (editName) editName.value = name;
  let editUsername = username;
  if (!editUsername) {
    const em = String(email || "");
    if (em.endsWith("@eduventure.local")) editUsername = normalizeUsername(em.split("@")[0] || "");
  }
  if (editEmail) editEmail.value = editUsername || "";
  if (editPhone) editPhone.value = phone;
  if (editGroup) editGroup.value = group;
}

function renderStats(stats) {
  const s = stats || {};
  safeText($id("readingsCompleted"), s.readingsCompleted ?? 0);
  safeText($id("listeningsCompleted"), s.listeningsCompleted ?? 0);
  safeText($id("wordsLearned"), s.wordsLearned ?? 0);
  safeText($id("lessonsCompleted"), s.lessonsCompleted ?? 0);
}


function prettyTitleFromKey(key) {
  return String(key || "")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}

function formatWhen(ms) {
  if (!Number.isFinite(ms)) return "—";
  const d = new Date(ms);
  // short but readable
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function bucketToCategory(bucket) {
  const b = String(bucket || "").toLowerCase();
  if (b.includes("listen")) return "listenings";
  if (b.includes("read")) return "readings";
  if (b.includes("lesson")) return "lessons";
  if (b.includes("vocab") || b.includes("word")) return "vocab";
  return "other";
}

function bucketToIcon(bucket) {
  const b = String(bucket || "").toLowerCase();
  if (b.includes("listen")) return "headphones";
  if (b.includes("read")) return "book-open";
  if (b.includes("lesson")) return "presentation";
  return "sparkles";
}

function buildHistoryEntries(progress) {
  const out = [];
  const vocab = progress?.vocabularies || {};
  for (const bucket of Object.keys(vocab || {})) {
    const items = vocab[bucket] || {};
    for (const name of Object.keys(items || {})) {
      const v = items?.[name] || {};
      const when =
        Number(v.updatedAtMs) ||
        Number(v.lastAttemptAtMs) ||
        Number(v.completedAtMs) ||
        Number(v.openedAtMs) ||
        0;

      out.push({
        id: `${bucket}/${name}`,
        bucket,
        category: bucketToCategory(bucket),
        name: prettyTitleFromKey(v.name || name),
        completed: !!v.completed,
        opened: !!v.opened,
        attempts: Number(v.attempts) || 0,
        percent: Number(v.lastPercent ?? v.bestPercent),
        correct: Number(v.lastCorrect),
        total: Number(v.lastTotal),
        difficulty: String(v.lastDifficulty || "").trim(),
        whenMs: when,
      });
    }
  }

  out.sort((a, b) => (b.whenMs || 0) - (a.whenMs || 0));
  return out.slice(0, 30);
}

function renderHistory(entries) {
  const list = $id("historyList");
  const empty = $id("historyEmpty");
  if (!list || !empty) return;

  const filtered = (entries || []).filter((e) => {
    if (historyFilter === "all") return true;
    return e.category === historyFilter;
  });

  list.innerHTML = "";

  if (!filtered.length) {
    empty.style.display = "block";
    if (window.lucide?.createIcons) window.lucide.createIcons();
    return;
  }

  empty.style.display = "none";

  for (const e of filtered) {
    const row = document.createElement("div");
    row.className = "history-row";

    const iconWrap = document.createElement("div");
    iconWrap.className = "history-icon";
    const icon = document.createElement("i");
    icon.setAttribute("data-lucide", bucketToIcon(e.bucket));
    icon.setAttribute("size", "20");
    iconWrap.appendChild(icon);

    const main = document.createElement("div");
    main.className = "history-main";

    const title = document.createElement("p");
    title.className = "history-name";
    title.textContent = e.name || "Untitled";

    const meta = document.createElement("div");
    meta.className = "history-meta";

    const status = document.createElement("span");
    status.className = "history-pill";
    status.textContent = e.completed ? "Completed" : (e.opened ? "Opened" : "Started");

    const bucketPill = document.createElement("span");
    bucketPill.className = "history-pill";
    bucketPill.textContent = prettyTitleFromKey(e.bucket);

    meta.appendChild(status);
    meta.appendChild(bucketPill);

    if (e.difficulty) {
      const diff = document.createElement("span");
      diff.className = "history-pill";
      diff.textContent = prettyTitleFromKey(e.difficulty);
      meta.appendChild(diff);
    }

    if (e.attempts) {
      const a = document.createElement("span");
      a.className = "history-pill";
      a.textContent = `${e.attempts} attempt${e.attempts === 1 ? "" : "s"}`;
      meta.appendChild(a);
    }

    main.appendChild(title);
    main.appendChild(meta);

    const right = document.createElement("div");
    right.className = "history-right";

    const score = document.createElement("div");
    score.className = "history-score";

    const hasPercent = Number.isFinite(e.percent);
    const hasCT = Number.isFinite(e.correct) && Number.isFinite(e.total) && e.total > 0;

    if (hasPercent) score.textContent = `${Math.round(e.percent)}%`;
    else if (hasCT) score.textContent = `${e.correct}/${e.total}`;
    else score.textContent = "—";

    const time = document.createElement("div");
    time.className = "history-time";
    time.textContent = formatWhen(e.whenMs);

    right.appendChild(score);
    right.appendChild(time);

    row.appendChild(iconWrap);
    row.appendChild(main);
    row.appendChild(right);

    list.appendChild(row);
  }

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

function deriveStatsFrom(progress, marksWords, currentStats) {
  const s = { ...(currentStats || {}) };

  const vocab = progress?.vocabularies || {};
  let listenings = 0;
  let readings = 0;
  let lessons = 0;

  for (const bucket of Object.keys(vocab || {})) {
    const items = vocab[bucket] || {};
    for (const k of Object.keys(items || {})) {
      const v = items?.[k];
      if (!v || !v.completed) continue;
      const cat = bucketToCategory(bucket);
      if (cat === "listenings") listenings += 1;
      else if (cat === "readings") readings += 1;
      else if (cat === "lessons") lessons += 1;
      // other buckets don't affect these counters
    }
  }

  let wordsLearned = 0;
  if (marksWords && typeof marksWords === "object") {
    for (const key of Object.keys(marksWords)) {
      if (marksWords?.[key]?.completed) wordsLearned += 1;
    }
  }

  // default to 0 if missing
  s.listeningsCompleted = Number.isFinite(listenings) ? listenings : (s.listeningsCompleted ?? 0);
  s.readingsCompleted = Number.isFinite(readings) ? readings : (s.readingsCompleted ?? 0);
  s.lessonsCompleted = Number.isFinite(lessons) ? lessons : (s.lessonsCompleted ?? 0);
  s.wordsLearned = Number.isFinite(wordsLearned) ? wordsLearned : (s.wordsLearned ?? 0);

  return s;
}

function scheduleStatsSync(uid, derivedStats) {
  if (!uid || !derivedStats) return;

  if (statsSyncTimer) clearTimeout(statsSyncTimer);
  statsSyncTimer = setTimeout(async () => {
    if (!currentUser || currentUser.uid !== uid) return;

    const base = cachedStats || {};
    const patch = {};
    const keys = ["readingsCompleted", "listeningsCompleted", "lessonsCompleted", "wordsLearned"];
    for (const k of keys) {
      const v = Number(derivedStats[k] ?? 0);
      const cur = Number(base[k] ?? 0);
      if (Number.isFinite(v) && v !== cur) patch[k] = v;
    }

    if (!Object.keys(patch).length) return;

    try {
      const updatePayload = {};
      for (const k of Object.keys(patch)) updatePayload[`students/${uid}/stats/${k}`] = patch[k];
      await update(ref(rtdb), updatePayload);
      // cachedStats will update via onValue listener, but keep local fallback:
      cachedStats = { ...base, ...patch };
      writeCachedStudent(uid);
      renderStats(cachedStats);
    } catch (e) {
      console.warn("Stats sync failed (non-fatal):", e);
    }
  }, 220);
}

/* -----------------------------
   Profile editing
----------------------------- */
function setupProfileEditing() {
  const editBtn = $id("editProfileBtn");
  const saveBtn = $id("saveProfileBtn");
  const cancelBtn = $id("cancelEditBtn");

  const profileView = $id("profileView");
  const profileEditForm = $id("profileEditForm");

  if (!editBtn || !saveBtn || !cancelBtn || !profileView || !profileEditForm) return;

  editBtn.addEventListener("click", () => {
    if (!currentUser) return;
    renderProfile(currentUser, cachedProfile);
    profileView.style.display = "none";
    profileEditForm.style.display = "block";
  });

  cancelBtn.addEventListener("click", () => {
    profileView.style.display = "grid";
    profileEditForm.style.display = "none";
  });

  saveBtn.addEventListener("click", async () => {
    if (!currentUser) return;

    const uid = currentUser.uid;

    const nameEl = $id("editName");
    const emailEl = $id("editEmail");
    const phoneEl = $id("editPhone");
    const groupEl = $id("editGroup");

    const newName = String(nameEl?.value || "").trim();
    // UI label might say "Email", but in your app this input is the USERNAME
    const newUsernameRaw = String(emailEl?.value || "").trim();
    const newPhone = String(phoneEl?.value || "").trim();
    const newGroup = String(groupEl?.value || "").trim();


    const oldPhoneNorm = normalizePhone(cachedProfile?.phone || "");
    const oldPhoneKey = phoneKey(oldPhoneNorm);

    const newPhoneNorm = normalizePhone(newPhone);
    const newPhoneKey = newPhone ? phoneKey(newPhoneNorm) : "";

    if (newPhone && !isValidPhone(newPhoneNorm)) {
      return Toast.show("Enter a valid phone number (7–15 digits).", "error", 4200);
    }

    if (!newName) return Toast.show("Enter your full name.", "error");
    if (!newUsernameRaw) return Toast.show("Enter a username.", "error");

    const newUsername = normalizeUsername(newUsernameRaw);
    if (!isValidUsername(newUsername)) {
      return Toast.show("Username must be 3–20 chars: letters, numbers, dot, underscore.", "error", 4200);
    }
    if (!newGroup) return Toast.show("Enter your group.", "error");

    const prevText = saveBtn.textContent;
    saveBtn.textContent = "Saving...";
    saveBtn.disabled = true;

    let usernameClaimed = false;
    let claimedUsername = "";
    let phoneClaimed = false;
    let profileCommitted = false;

    try {
      const oldAuthEmail = String(currentUser.email || "").trim();
      const oldName = String(currentUser.displayName || "").trim();

      const oldUsername =
        normalizeUsername(cachedProfile?.username || "") ||
        (oldAuthEmail && oldAuthEmail.endsWith("@eduventure.local")
          ? normalizeUsername(oldAuthEmail.split("@")[0] || "")
          : "");

      const desiredAuthEmail = usernameToEmail(newUsername);
      const isUsernameChange = newUsername !== oldUsername;

      // 1) Reserve username (prevents duplicates)
      if (isUsernameChange) {
        await claimUsernameOrThrow(newUsername, uid);
        usernameClaimed = true;
        claimedUsername = newUsername;
      }

      // 2) Phone index (login by phone). Claim new number if changed.
      if (newPhoneKey && newPhoneKey !== oldPhoneKey) {
        await claimPhoneOrThrow(newPhoneKey, uid);
        phoneClaimed = true;
      }

      // 3) Save group/name even if auth email (login username) change fails
      let nameErr = null;
      let emailErr = null;
      let emailChanged = false;

      if (newName !== oldName) {
        try {
          await updateProfile(currentUser, { displayName: newName });
        } catch (e) {
          nameErr = e;
        }
      }

      // Only change Auth email when this is an email+password account that uses the synthetic email scheme.
      const shouldChangeAuthEmail =
        isUsernameChange &&
        hasPasswordProvider(currentUser) &&
        oldAuthEmail &&
        oldAuthEmail.endsWith("@eduventure.local");

      if (shouldChangeAuthEmail && desiredAuthEmail !== oldAuthEmail) {
        try {
          await updateEmailWithReauth(currentUser, oldAuthEmail, desiredAuthEmail);
          emailChanged = true;
        } catch (e) {
          emailErr = e;
        }
      }

      // If auth email change failed, rollback reserved username (so we don't lock it)
      if (emailErr && usernameClaimed) {
        await releaseUsernameIfOwned(claimedUsername, uid);
        usernameClaimed = false;
        claimedUsername = "";
      }

      const usernameToStore = emailErr ? oldUsername : newUsername;
      const emailToStore = emailChanged
        ? desiredAuthEmail
        : String(cachedProfile?.email || oldAuthEmail || "");

      await update(studentProfileRef(uid), {
        name: newName,
        username: usernameToStore,
        email: emailToStore,
        phone: newPhone ? newPhoneNorm : "",
        group_name: newGroup,
        group: newGroup,
      });
      profileCommitted = true;

      // Release old username mapping only after successful commit
      if (!emailErr && isUsernameChange) {
        await releaseUsernameIfOwned(oldUsername, uid);
      }

      await loadStudentData(uid);
      renderProfile(currentUser, cachedProfile);

      profileView.style.display = "grid";
      // Clean up old phone mapping (only if we owned it)
      if (oldPhoneKey && oldPhoneKey !== newPhoneKey) {
        await releasePhoneIfOwned(oldPhoneKey, uid);
      }

      profileEditForm.style.display = "none";

      if (emailErr?.code === "auth/requires-recent-login") {
        Toast.show(
          "Saved ✅ (group included). To change username for login, sign out & sign in again.",
          "info",
          4600
        );
      } else if (emailErr) {
        console.error("Username(auth email) change failed:", emailErr);
        if (emailErr.code === "auth/email-already-in-use") {
          Toast.show("That username is already taken.", "error", 4200);
        } else if (emailErr.code === "auth/invalid-email") {
          Toast.show("That username produced an invalid login email.", "error", 4200);
        } else {
          Toast.show("Saved ✅, but username change failed. Check console.", "info", 4200);
        }
      } else if (nameErr) {
        console.error("Display name update failed:", nameErr);
        Toast.show("Saved ✅, but display name update failed. Check console.", "info", 4200);
      } else if (!shouldChangeAuthEmail && isUsernameChange) {
        // Phone/Google users: username is only for profile display
        Toast.show("Username saved ✅ (login method unchanged).", "success", 3600);
      } else {
        Toast.show("Saved ✅", "success");
      }
    } catch (err) {
      console.error(err);

      // Best-effort rollback if we failed before committing the profile update
      try {
        if (!profileCommitted) {
          if (usernameClaimed && claimedUsername) {
            await releaseUsernameIfOwned(claimedUsername, uid);
          }
          if (phoneClaimed && newPhoneKey && newPhoneKey !== oldPhoneKey) {
            await releasePhoneIfOwned(newPhoneKey, uid);
          }
        }
      } catch {}
      if (err?.message === "phone_taken") {
        Toast.show("That phone number is already registered.", "error", 4200);
      } else if (err?.message === "username_taken") {
        Toast.show("That username is already taken.", "error", 4200);
      } else {
        Toast.show("Could not save. Check console.", "error", 4000);
      }
    } finally {
      saveBtn.textContent = prevText;
      saveBtn.disabled = false;
    }
  });
}

/* -----------------------------
   Password Change
----------------------------- */
function setupPasswordChange() {
  const changePasswordBtn =
    document.getElementById("changePasswordBtn") ||
    document.querySelector('[data-action="change-password"]');

  // If the account page HTML does not include the button, just skip.
  if (!changePasswordBtn) return;

  changePasswordBtn.addEventListener("click", async () => {
    if (!currentUser) {
      Toast.show("Please sign in first.", "error");
      return;
    }

    const hasPasswordProvider =
      Array.isArray(currentUser.providerData) &&
      currentUser.providerData.some((p) => p?.providerId === "password");

    // Google/Phone accounts do not have a password to change (unless you link email+password).
    if (!hasPasswordProvider) {
      Toast.show(
        "This account doesn’t use a password sign-in (Google/Phone). To change it, sign in with email+password or link a password first.",
        "info",
        5200
      );
      return;
    }

    if (!currentUser.email) {
      Toast.show("No email on this account, so password change can’t run.", "error", 5200);
      return;
    }


    // Create modal for password change
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement("div");
    modalContent.style.cssText = `
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 450px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    `;

    modalContent.innerHTML = `
      <h2 style="margin: 0 0 8px 0; font-size: 24px; color: #111827;">Change Password</h2>
      <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">Enter your current password and a new password</p>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #111827;">Current Password</label>
        <input type="password" id="currentPassword" placeholder="Enter current password" 
          style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #111827;">New Password</label>
        <input type="password" id="newPassword" placeholder="Enter new password (min 6 characters)" 
          style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
      </div>
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #111827;">Confirm New Password</label>
        <input type="password" id="confirmPassword" placeholder="Confirm new password" 
          style="width: 100%; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 16px; box-sizing: border-box;">
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancelPasswordChange" style="padding: 10px 20px; border: 1px solid #e5e7eb; background: white; color: #111827; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Cancel
        </button>
        <button id="confirmPasswordChange" style="padding: 10px 20px; border: none; background: #1f2937; color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">
          Change Password
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    const currentPasswordInput = modalContent.querySelector("#currentPassword");
    const newPasswordInput = modalContent.querySelector("#newPassword");
    const confirmPasswordInput = modalContent.querySelector("#confirmPassword");
    const cancelBtn = modalContent.querySelector("#cancelPasswordChange");
    const confirmBtn = modalContent.querySelector("#confirmPasswordChange");

    const closeModal = () => modal.remove();

    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    confirmBtn.addEventListener("click", async () => {
      const currentPassword = currentPasswordInput.value.trim();
      const newPassword = newPasswordInput.value.trim();
      const confirmPassword = confirmPasswordInput.value.trim();

      if (!currentPassword) {
        Toast.show("Please enter your current password.", "error");
        return;
      }

      if (!newPassword) {
        Toast.show("Please enter a new password.", "error");
        return;
      }

      if (newPassword.length < 6) {
        Toast.show("New password must be at least 6 characters.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        Toast.show("Passwords do not match.", "error");
        return;
      }

      if (currentPassword === newPassword) {
        Toast.show("New password must be different from current password.", "error");
        return;
      }

      const originalText = confirmBtn.textContent;
      confirmBtn.textContent = "Changing...";
      confirmBtn.disabled = true;

      try {
        // Reauthenticate user with current password
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          currentPassword
        );
        
        await reauthenticateWithCredential(currentUser, credential);
        
        // Update password
        await updatePassword(currentUser, newPassword);
        
        Toast.show("Password changed successfully! ✅", "success");
        closeModal();
      } catch (error) {
        console.error("Password change error:", error);
        
        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential" || error.code === "auth/invalid-login-credentials") {
          Toast.show("Current password is incorrect.", "error", 4000);
        } else if (error.code === "auth/weak-password") {
          Toast.show("Password is too weak. Use at least 6 characters.", "error", 4000);
        } else if (error.code === "auth/requires-recent-login") {
          Toast.show("Please sign out and sign in again before changing password.", "error", 4500);
        } else {
          Toast.show("Failed to change password. Check console for details.", "error", 4000);
        }
      } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
      }
    });

    // Focus on first input
    setTimeout(() => currentPasswordInput.focus(), 100);
  });
}

/* -----------------------------
   Logout
----------------------------- */
window.handleLogout = async function handleLogout() {
  try {
    const ok = window.confirm("Are you sure you want to sign out?");
    if (!ok) return;
    await signOut(auth);
    {
  const ret = location.href;
  try { sessionStorage.setItem("edu_return_url", ret); } catch (e) {}
  try { localStorage.setItem("edu_return_url", ret); } catch (e) {}
  location.replace(`/pages/auth/reg.html?return=${encodeURIComponent(ret)}`);
  return;
}
} catch (e) {
    console.error(e);
    Toast.show("Logout failed.", "error");
  }
};

/* -----------------------------
   Boot
----------------------------- */
async function bootForUser(user) {
  // Fast first paint for slow connections:
  // 1) render from local cache immediately
  // 2) sync with RTDB in the background
  setLoading(true);

  try {
    readCachedStudent(user.uid);
    renderProfile(user, cachedProfile);
    renderStats(cachedStats);
    if (window.lucide?.createIcons) window.lucide.createIcons();
  } finally {
    // stop blocking the UI even if the network is slow
    setLoading(false);
  }

  try {
    await ensureStudentDoc(user);
    await loadStudentData(user.uid);

    renderProfile(user, cachedProfile);
    renderStats(cachedStats);
    if (window.lucide?.createIcons) window.lucide.createIcons();
      startRealtimeListeners(user.uid);
    await refreshProgressAndHistory(user.uid);
} catch (err) {
    console.error(err);
    // keep the cached UI; user can still use the page
    Toast.show("Slow connection: showing cached profile/stats.", "info", 3200);
  }
}




function setupHistoryUI() {
  const sel = $id("historyFilter");
  const refresh = $id("historyRefreshBtn");

  if (sel) {
    sel.addEventListener("change", () => {
      historyFilter = String(sel.value || "all");
      renderHistory(historyEntries);
    });
  }

  if (refresh) {
    refresh.addEventListener("click", async () => {
      if (!currentUser) return;
      await refreshProgressAndHistory(currentUser.uid);
    });
  }
}


async function init() {
  setupSectionNavigation();
  setupProfileEditing();
  setupPasswordChange();
  setupHistoryUI();

  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      {
  const ret = location.href;
  try { sessionStorage.setItem("edu_return_url", ret); } catch (e) {}
  try { localStorage.setItem("edu_return_url", ret); } catch (e) {}
  location.replace(`/pages/auth/reg.html?return=${encodeURIComponent(ret)}`);
  return;
}
}
    currentUser = user;
    await bootForUser(user);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => {
    console.error("Account init error:", err);
    Toast.show("Account page init failed. Open console (F12) to see error.", "error", 4500);
    document.documentElement.style.cursor = "";
  });
});