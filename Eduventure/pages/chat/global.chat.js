import { auth, rtdb } from "/elements/firebase.js";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  ref,
  get,
  push,
  update,
  remove,
  onChildAdded,
  onChildChanged,
  onChildRemoved,
  onValue,
  query,
  limitToLast,
  orderByChild,
  startAfter,
  serverTimestamp,
  set,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* -----------------------------
  Helpers
----------------------------- */
const $ = (id) => document.getElementById(id);

// Generate Random Consistent Color based on User ID
function getAvatarColor(str) {
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e','#334358'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
}

function deriveGroupFromEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (!e.includes("@")) return "Ungrouped";
  const [local, domain] = e.split("@");
  let m = local.match(/\+(?:group|grp|g)([a-z0-9]{1,3})\b/i);
  if (m?.[1]) return `Group ${String(m[1]).toUpperCase()}`;
  m = local.match(/(?:^|[._-])(?:group|grp|g)([a-z0-9]{1,3})(?:$|[._-])/i);
  if (m?.[1]) return `Group ${String(m[1]).toUpperCase()}`;
  m = domain.match(/^(?:group|grp|g)([a-z0-9]{1,3})\./i);
  if (m?.[1]) return `Group ${String(m[1]).toUpperCase()}`;
  return "Ungrouped";
}

function initialsFromName(name, email) {
  const base = String(name || "").trim() || String(email || "S").split("@")[0] || "S";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function formatTime(ms) {
  try {
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function setStatus(ok, text) {
  const dot = $("chatStatusDot");
  const t = $("chatStatusText");
  if (dot) dot.classList.toggle("online", !!ok);
  if (t) t.textContent = text || "";
}

function scrollToBottomIfNearEnd(container) {
  if (!container) return;
  const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 220;
  if (nearBottom) container.scrollTop = container.scrollHeight;
}

/* -----------------------------
  RTDB Paths & State
----------------------------- */
const MESSAGES_PATH = "global_chat/messages";
const TYPING_PATH = "global_chat/typing";

// Network Detection
const NET = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
const IS_SLOW_NET = !!(NET && (NET.saveData || String(NET.effectiveType || "").includes("2g")));
const MESSAGES_LIMIT = IS_SLOW_NET ? 25 : 50;
const TYPING_TIMEOUT = 3000; 

let currentUser = null;
let myProfile = null;
let detachLive = null;
let detachChanged = null;
let detachRemoved = null;
let detachTyping = null;
let booted = false;
let messageToDelete = null;
let typingTimer = null;
let isCurrentlyTyping = false;

/* -----------------------------
  Performance: batched icon refresh + small local cache
----------------------------- */
const CHAT_CACHE_KEY = "global_chat_cache_v1";
let chatCacheItems = null; 

function loadChatCache() {
  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.items)) return [];
    return data.items
      .filter((it) => it && typeof it.key === "string" && it.msg && typeof it.msg === "object")
      .slice(-MESSAGES_LIMIT);
  } catch {
    return [];
  }
}

function saveChatCache(items) {
  try {
    const payload = { v: 1, savedAtMs: Date.now(), items: items.slice(-MESSAGES_LIMIT) };
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function getChatCacheItems() {
  if (!chatCacheItems) chatCacheItems = loadChatCache();
  return chatCacheItems;
}

function cacheUpsert(key, msg) {
  const items = getChatCacheItems();
  const idx = items.findIndex((x) => x.key === key);
  const entry = { key, msg };
  if (idx >= 0) items[idx] = entry;
  else items.push(entry);
  if (items.length > MESSAGES_LIMIT) items.splice(0, items.length - MESSAGES_LIMIT);
  saveChatCache(items);
}

function cacheRemove(key) {
  const items = getChatCacheItems();
  const idx = items.findIndex((x) => x.key === key);
  if (idx >= 0) {
    items.splice(idx, 1);
    saveChatCache(items);
  }
}

let lucideRefreshPending = false;
function refreshIconsSoon() {
  if (!window.lucide?.createIcons) return;
  if (lucideRefreshPending) return;
  lucideRefreshPending = true;
  requestAnimationFrame(() => {
    lucideRefreshPending = false;
    try {
      window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
    } catch {
      // ignore
    }
  });
}

async function loadMyProfile(uid) {
  const profileRef = ref(rtdb, `students/${uid}/profile`);
  const snap = await get(profileRef);
  return snap.exists() ? (snap.val() || {}) : {};
}

/* -----------------------------
  Typing Indicator Functions
----------------------------- */
async function setTyping(isTyping) {
  if (!currentUser) return;
  
  const typingRef = ref(rtdb, `${TYPING_PATH}/${currentUser.uid}`);
  
  if (isTyping) {
    await set(typingRef, {
      name: myProfile?.name || currentUser.displayName || "Someone",
      timestamp: Date.now()
    });
    isCurrentlyTyping = true;
  } else {
    await remove(typingRef);
    isCurrentlyTyping = false;
  }
}

function updateTypingIndicator(typingUsers) {
  const indicator = $("typingIndicator");
  if (!indicator) return;
  
  const now = Date.now();
  const activeTypers = Object.entries(typingUsers || {})
    .filter(([uid, data]) => {
      if (uid === currentUser?.uid) return false;
      if (!data?.timestamp) return false;
      return (now - data.timestamp) < 5000;
    })
    .map(([_, data]) => data.name);
  
  if (activeTypers.length > 0) {
    indicator.classList.add("active");
    const typingText = indicator.querySelector(".typing-text");
    if (typingText) {
      if (activeTypers.length === 1) {
        typingText.textContent = `${activeTypers[0]} is typing...`;
      } else if (activeTypers.length === 2) {
        typingText.textContent = `${activeTypers[0]} and ${activeTypers[1]} are typing...`;
      } else {
        typingText.textContent = `${activeTypers[0]} and ${activeTypers.length - 1} others are typing...`;
      }
    }
  } else {
    indicator.classList.remove("active");
  }
}

function listenToTyping() {
  if (detachTyping) return;
  
  const typingRef = ref(rtdb, TYPING_PATH);
  detachTyping = onValue(typingRef, (snapshot) => {
    const typingUsers = snapshot.val() || {};
    updateTypingIndicator(typingUsers);
  });
}

/* -----------------------------
  Edit & Delete Functions (OPTIMIZED)
----------------------------- */
async function editMessage(msgKey, newText) {
  if (!currentUser) throw new Error("Not logged in.");
  const text = String(newText || "").trim();
  if (!text) throw new Error("Message cannot be empty.");

  // OPTIMIZATION: Removed the 'get()' check. 
  // We send the update directly. Firebase Rules must handle ownership security.
  const msgRef = ref(rtdb, `${MESSAGES_PATH}/${msgKey}`);
  
  await update(msgRef, {
    text: text,
    editedAtMs: Date.now(),
    edited: true
  });
}

async function deleteMessage(msgKey) {
  if (!currentUser) throw new Error("Not logged in.");

  // OPTIMIZATION: Removed the 'get()' check.
  // Direct delete request.
  const msgRef = ref(rtdb, `${MESSAGES_PATH}/${msgKey}`);
  await remove(msgRef);
}

/* -----------------------------
  Render Logic
----------------------------- */
function renderMessageNode(msg, msgKey) {
  const wrap = document.createElement("div");
  wrap.setAttribute("data-msg-key", msgKey);
  
  const isMe = (currentUser && currentUser.uid === msg.uid);
  wrap.className = `msg ${isMe ? "is-me" : "is-other"}${msg.edited ? " edited" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = initialsFromName(msg.name, msg.email);
  avatar.style.background = getAvatarColor(msg.uid || "default");
  avatar.style.boxShadow = `0 2px 4px ${getAvatarColor(msg.uid)}40`;

  const main = document.createElement("div");
  main.className = "msg-main";

  const head = document.createElement("div");
  head.className = "msg-head";

  const left = document.createElement("div");
  left.style.display = "flex";
  left.style.alignItems = "baseline";
  left.style.gap = "8px";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = msg.name || "Student";

  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = msg.group_name || "Ungrouped";

  left.appendChild(name);
  left.appendChild(pill);

  const time = document.createElement("div");
  time.className = "time";
  time.textContent = msg.createdAtMs ? formatTime(msg.createdAtMs) : "";

  head.appendChild(left);
  head.appendChild(time);

  const text = document.createElement("div");
  text.className = "text";
  text.textContent = msg.text || "";

  const editForm = document.createElement("div");
  editForm.className = "msg-edit-form";
  
  const editInput = document.createElement("textarea");
  editInput.className = "msg-edit-input";
  editInput.value = msg.text || "";
  editInput.maxLength = 500;
  
  const editActions = document.createElement("div");
  editActions.className = "msg-edit-actions";
  
  const saveBtn = document.createElement("button");
  saveBtn.className = "msg-edit-btn save";
  saveBtn.textContent = "Save";
  saveBtn.type = "button";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.className = "msg-edit-btn cancel";
  cancelBtn.textContent = "Cancel";
  cancelBtn.type = "button";
  
  editActions.appendChild(cancelBtn);
  editActions.appendChild(saveBtn);
  editForm.appendChild(editInput);
  editForm.appendChild(editActions);

  main.appendChild(head);
  main.appendChild(text);
  main.appendChild(editForm);

  if (isMe) {
    const actions = document.createElement("div");
    actions.className = "msg-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "msg-action-btn edit";
    editBtn.innerHTML = '<i data-lucide="pencil" size="12"></i><span>Edit</span>';
    editBtn.title = "Edit message";
    editBtn.type = "button";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "msg-action-btn delete";
    deleteBtn.innerHTML = '<i data-lucide="trash-2" size="12"></i><span>Delete</span>';
    deleteBtn.title = "Delete message";
    deleteBtn.type = "button";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    main.appendChild(actions);

    editBtn.addEventListener("click", () => {
      wrap.classList.add("editing");
      editInput.focus();
      editInput.setSelectionRange(editInput.value.length, editInput.value.length);
    });

    cancelBtn.addEventListener("click", () => {
      wrap.classList.remove("editing");
      editInput.value = msg.text || "";
    });

    saveBtn.addEventListener("click", async () => {
      const newText = editInput.value.trim();
      if (!newText) {
        alert("Message cannot be empty");
        return;
      }
      
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
      
      try {
        await editMessage(msgKey, newText);
        wrap.classList.remove("editing");
      } catch (err) {
        console.error("Edit failed:", err);
        alert("Action blocked: " + (err?.message || "Failed to edit"));
        editInput.value = msg.text || "";
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save";
      }
    });

    deleteBtn.addEventListener("click", () => {
      messageToDelete = msgKey;
      const overlay = $("deleteOverlay");
      if (overlay) overlay.classList.add("show");
    });
  }

  wrap.appendChild(avatar);
  wrap.appendChild(main);
  return wrap;
}

function updateMessageNode(msgKey, msg) {
  const wrap = document.querySelector(`[data-msg-key="${msgKey}"]`);
  if (!wrap) return;

  const textEl = wrap.querySelector(".text");
  const editInput = wrap.querySelector(".msg-edit-input");
  
  if (textEl) textEl.textContent = msg.text || "";
  if (editInput && !wrap.classList.contains("editing")) {
    editInput.value = msg.text || "";
  }
  
  if (msg.edited) {
    wrap.classList.add("edited");
  }

  cacheUpsert(msgKey, msg);
}

function removeMessageNode(msgKey) {
  cacheRemove(msgKey);
  const wrap = document.querySelector(`[data-msg-key="${msgKey}"]`);
  if (wrap) {
    wrap.style.animation = "fadeOut 0.3s forwards";
    setTimeout(() => wrap.remove(), 300);
  }
}

function normalizeMessage(v) {
  return {
    text: String(v?.text || ""),
    uid: String(v?.uid || ""),
    name: String(v?.name || "Student"),
    email: String(v?.email || ""),
    group_name: String(v?.group_name || "Ungrouped"),
    createdAtMs: typeof v?.createdAtMs === "number" ? v.createdAtMs : null,
    edited: !!v?.edited,
    editedAtMs: typeof v?.editedAtMs === "number" ? v.editedAtMs : null,
  };
}

/* -----------------------------
  Listening Logic
----------------------------- */
async function startListening() {
  if (detachLive) return;

  const list = $("chatList");
  if (!list) return;

  // 1. FAST RENDER: Cache
  const cached = loadChatCache();
  if (cached.length) {
    list.innerHTML = "";
    const cachedFrag = document.createDocumentFragment();
    for (const it of cached) {
      cachedFrag.appendChild(renderMessageNode(it.msg, it.key));
    }
    list.appendChild(cachedFrag);
    list.scrollTop = list.scrollHeight;
    refreshIconsSoon();
    setStatus(false, "Syncing…");
  } else {
    setStatus(false, "Loading…");
  }

  // 2. NETWORK FETCH
  // Ensure '.indexOn': ['createdAtMs'] exists in Firebase Rules!
  const baseQ = query(
    ref(rtdb, MESSAGES_PATH),
    orderByChild("createdAtMs"),
    limitToLast(MESSAGES_LIMIT)
  );

  try {
    const snap = await get(baseQ);
    const frag = document.createDocumentFragment();
    const itemsForCache = [];
    let lastCreatedAt = null;
    let lastKey = null;

    snap.forEach((child) => {
      lastKey = child.key;
      const v = child.val() || {};
      const msg = normalizeMessage(v);
      frag.appendChild(renderMessageNode(msg, child.key));
      itemsForCache.push({ key: child.key, msg });
      if (typeof msg.createdAtMs === "number") lastCreatedAt = msg.createdAtMs;
    });

    // Replace cache with fresh authoritative data
    list.innerHTML = "";
    list.appendChild(frag);
    list.scrollTop = list.scrollHeight;
    refreshIconsSoon();
    saveChatCache(itemsForCache);

    setStatus(true, "Live");

    // 3. LISTEN FOR NEW
    const liveQ = typeof lastCreatedAt === "number"
        ? query(ref(rtdb, MESSAGES_PATH), orderByChild("createdAtMs"), startAfter(lastCreatedAt))
        : query(ref(rtdb, MESSAGES_PATH), orderByChild("createdAtMs"));

    detachLive = onChildAdded(liveQ, (child) => {
      if (child.key && child.key === lastKey) return;
      const v = child.val() || {};
      const msg = normalizeMessage(v);
      list.appendChild(renderMessageNode(msg, child.key));
      refreshIconsSoon();
      cacheUpsert(child.key, msg);
      scrollToBottomIfNearEnd(list);
    });

    // Listen for edits
    detachChanged = onChildChanged(ref(rtdb, MESSAGES_PATH), (child) => {
      const v = child.val() || {};
      const msg = normalizeMessage(v);
      updateMessageNode(child.key, msg);
    });

    // Listen for deletes
    detachRemoved = onChildRemoved(ref(rtdb, MESSAGES_PATH), (child) => {
      removeMessageNode(child.key);
    });
    
    listenToTyping();

  } catch (err) {
    console.error("Chat sync error:", err);
    setStatus(false, "Connection Error");
  }
}

async function sendMessage(raw) {
  if (!currentUser) throw new Error("Not logged in.");
  const text = String(raw || "").trim();
  if (!text) return;

  const name = String(myProfile?.name || "").trim() || String(currentUser.displayName || "").trim() || "Student";
  const email = String(currentUser.email || "").trim();
  const group_name = String(myProfile?.group_name || "").trim() || deriveGroupFromEmail(email);

  const payload = {
    text,
    uid: currentUser.uid,
    name,
    email,
    group_name,
    createdAtMs: Date.now(),
  };

  await push(ref(rtdb, MESSAGES_PATH), payload);
}

function bindUI() {
  const form = $("chatForm");
  const input = $("chatInput");
  const btn = $("sendBtn");

  if (!form || !input || !btn) return;

  input.addEventListener("input", () => {
    if (!currentUser) return;
    if (typingTimer) clearTimeout(typingTimer);
    if (!isCurrentlyTyping && input.value.trim()) setTyping(true);
    typingTimer = setTimeout(() => { setTyping(false); }, TYPING_TIMEOUT);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    btn.disabled = true;
    
    if (typingTimer) {
      clearTimeout(typingTimer);
      typingTimer = null;
    }
    await setTyping(false);
    
    try {
      await sendMessage(input.value);
      input.value = "";
      input.focus();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to send.");
    } finally {
      btn.disabled = false;
    }
  });

  const deleteOverlay = $("deleteOverlay");
  const deleteConfirm = $("deleteConfirm");
  const deleteCancel = $("deleteCancel");

  if (deleteCancel) {
    deleteCancel.addEventListener("click", () => {
      if (deleteOverlay) deleteOverlay.classList.remove("show");
      messageToDelete = null;
    });
  }

  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", async () => {
      if (!messageToDelete) return;
      
      deleteConfirm.disabled = true;
      deleteConfirm.textContent = "Deleting...";
      
      try {
        await deleteMessage(messageToDelete);
        if (deleteOverlay) deleteOverlay.classList.remove("show");
        messageToDelete = null;
      } catch (err) {
        console.error("Delete failed:", err);
        alert("Action blocked: " + (err?.message || "Failed to delete"));
      } finally {
        deleteConfirm.disabled = false;
        deleteConfirm.textContent = "Delete";
      }
    });
  }

  if (deleteOverlay) {
    deleteOverlay.addEventListener("click", (e) => {
      if (e.target === deleteOverlay) {
        deleteOverlay.classList.remove("show");
        messageToDelete = null;
      }
    });
  }
}

async function boot() {
  if (booted) return;
  booted = true;
  bindUI();
  setStatus(false, "Connecting…");
  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.replace("/pages/auth/reg.html");
      return;
    }
    currentUser = user;
    try { myProfile = await loadMyProfile(user.uid); } catch (e) { myProfile = {}; }
    
    const badge = $("chatUserBadge");
    if (badge) {
      const n = myProfile?.name || user.displayName || "Student";
      const g = myProfile?.group_name || deriveGroupFromEmail(user.email);
      badge.style.display = "";
      badge.textContent = `${n} • ${g}`;
    }
    await startListening();
  });

  window.addEventListener("beforeunload", async () => {
    await setTyping(false);
    if (typeof detachLive === "function") detachLive();
    if (typeof detachChanged === "function") detachChanged();
    if (typeof detachRemoved === "function") detachRemoved();
    if (typeof detachTyping === "function") detachTyping();
  });
}

const style = document.createElement("style");
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);

boot().catch((err) => {
  console.error("Chat boot failed:", err);
  setStatus(false, "Init failed");
});