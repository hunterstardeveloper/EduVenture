// online.js
// Dynamic Online Lessons page (admin can add resources, users can view + comment)
//
// Requires: /elements/firebase.js to initialize Firebase app + export auth & db.

import { auth, db } from "/elements/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  ref,
  get,
  onValue,
  push,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


/* -----------------------------
   Helpers
------------------------------ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function safeText(s) {
  return (s ?? "").toString();
}

function bytesToHuman(bytes) {
  const b = Number(bytes || 0);
  if (!isFinite(b) || b <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = b, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function mapToArray(mapObj) {
  if (!mapObj || typeof mapObj !== "object") return [];
  // Stable ordering: by key
  return Object.keys(mapObj).sort().map(k => ({ id: k, ...mapObj[k] }));
}

function parseLines(text) {
  return safeText(text)
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

function isValidUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function youtubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") {
      id = u.pathname.replace("/", "");
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") id = u.searchParams.get("v") || "";
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1] || "";
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/shorts/")[1] || "";
    }
    id = (id || "").split("?")[0].split("&")[0];
    if (!id) return "";
    return `https://www.youtube.com/embed/${id}?rel=0`;
  } catch {
    return "";
  }
}


const DIRECT_FILE_EXTS = new Set([
  "pdf","png","jpg","jpeg","webp","gif","svg",
  "zip","rar","7z",
  "doc","docx","ppt","pptx","xls","xlsx",
  "mp3","wav","m4a","mp4","webm","ogg"
]);

function isDirectFileUrl(url) {
  try {
    const u = new URL(url);
    const path = (u.pathname || "").toLowerCase();
    const last = path.split("/").pop() || "";
    if (!last.includes(".")) return false;
    const ext = last.split(".").pop();
    return DIRECT_FILE_EXTS.has(ext);
  } catch {
    return false;
  }
}

function fileMetaFromUrl(url) {
  let name = "file";
  try {
    const u = new URL(url);
    const last = (u.pathname || "").split("/").filter(Boolean).pop() || "file";
    name = decodeURIComponent(last);
  } catch {
    // keep default
  }

  const ext = (name.split(".").pop() || "").toLowerCase();
  const typeByExt = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    m4a: "audio/mp4",
    mp4: "video/mp4",
    webm: "video/webm",
    ogg: "audio/ogg",
    zip: "application/zip",
    rar: "application/vnd.rar",
    "7z": "application/x-7z-compressed",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };

  return {
    name,
    url,
    contentType: typeByExt[ext] || "",
    size: 0
  };
}

function nowMs() {
  return Date.now();
}

/* -----------------------------
   State
------------------------------ */
const CLUB_ID = document.body?.dataset?.club || "english";
const TEACHER_ID = document.body?.dataset?.teacher || "Abdurahim";

const MODULES_PATH = `online/${CLUB_ID}/${TEACHER_ID}/modules`;
const COMMENTS_PATH = (moduleId) => `online/${CLUB_ID}/${TEACHER_ID}/comments/${moduleId}`;

let currentUser = null;
let isAdmin = false;

let modules = []; // array {id, ...}
let selectedModuleId = null;
let unsubscribeComments = null;

/* -----------------------------
   DOM refs
------------------------------ */
const coursesEl = $("#courses");
const videoSectionEl = $("#videoSection");
const videoPlayerEl = $("#videoPlayer");
const videoIframeEl = $("#videoIframe");
const noVideoMsgEl = $("#noVideoMsg");

const qaEl = $("#qa-container");
const taskEl = $("#task-container");
const docEl = $("#doc-container");
const downloadEl = $("#download-container");

const commentAuthStateEl = $("#commentAuthState");
const commentTextEl = $("#commentText");
const commentSendBtn = $("#commentSendBtn");
const feedbackListEl = $("#feedback-list");

// Admin modal
const addModalEl = $("#addModal");
const addModalCloseBtn = $("#addModalClose");
const addTitleEl = $("#addTitle");
const addDescEl = $("#addDesc");
const addLinksEl = $("#addLinks");
const addTasksEl = $("#addTasks");
const addDropzoneEl = $("#addDropzone");
const addFilesInput = $("#addFiles");
const addFolderInput = $("#addFolder");
const addPickFilesBtn = $("#addPickFiles");
const addPickFolderBtn = $("#addPickFolder");
const addCommitBtn = $("#addCommit");
const addClearBtn = $("#addClear");
const addPreviewEl = $("#addPreview");
const addStatusEl = $("#addStatus");
const addFileCountEl = $("#addFileCount");

let pendingFiles = [];

/* -----------------------------
   Tabs
------------------------------ */
function initTabs() {
  const tabs = $$(".tab");
  const contents = $$(".content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.dataset.tab;
      const target = document.getElementById(targetId);
      if (target) target.classList.add("active");
    });
  });
}

/* -----------------------------
   Admin modal
------------------------------ */
function showStatus(msg) {
  if (!addStatusEl) return;
  addStatusEl.style.display = msg ? "block" : "none";
  addStatusEl.textContent = msg || "";
}

function openModal() {
  if (!addModalEl) return;
  addModalEl.classList.add("open");
  addModalEl.setAttribute("aria-hidden", "false");
  showStatus("");
  updatePreview();
}

function closeModal() {
  if (!addModalEl) return;
  addModalEl.classList.remove("open");
  addModalEl.setAttribute("aria-hidden", "true");
  showStatus("");
}

function clearModal() {
  if (addTitleEl) addTitleEl.value = "";
  if (addDescEl) addDescEl.value = "";
  if (addLinksEl) addLinksEl.value = "";
  if (addTasksEl) addTasksEl.value = "";
  pendingFiles = [];
  if (addFilesInput) addFilesInput.value = "";
  if (addFolderInput) addFolderInput.value = "";
  updateFileCount();
  updatePreview();
}

function updateFileCount() {
  if (!addFileCountEl) return;
  const total = pendingFiles.reduce((sum, f) => sum + (f?.size || 0), 0);
  addFileCountEl.textContent = `${pendingFiles.length} files • ${bytesToHuman(total)}`;
}

function updatePreview() {
  if (!addPreviewEl) return;

  const links = parseLines(addLinksEl?.value);
  const validLinks = links.filter(isValidUrl);
  const invalidLinks = links.filter(l => !isValidUrl(l));

  const fileLinks = validLinks.filter(isDirectFileUrl);

  addPreviewEl.innerHTML = "";

  // Links preview
  const linksBox = document.createElement("div");
  linksBox.className = "preview-item";
  linksBox.innerHTML = `<strong>Links</strong><div style="margin-top:8px;"></div>`;
  const linksList = linksBox.querySelector("div");

  if (links.length === 0) {
    linksList.innerHTML = `<small>No links</small>`;
  } else {
    validLinks.filter(u => !isDirectFileUrl(u)).forEach(u => {
      const embed = youtubeEmbedUrl(u);
      const row = document.createElement("div");
      row.style.margin = "8px 0";
      row.innerHTML = `<a href="${u}" target="_blank" rel="noopener">${u}</a>`;
      linksList.appendChild(row);

      if (embed) {
        const wrap = document.createElement("div");
        wrap.style.margin = "8px 0 14px";
        wrap.style.aspectRatio = "16/9";
        wrap.style.borderRadius = "14px";
        wrap.style.overflow = "hidden";
        wrap.style.border = "1px solid var(--border)";
        wrap.innerHTML = `<iframe src="${embed}" title="YouTube preview" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>`;
        linksList.appendChild(wrap);
      }
    });

    if (invalidLinks.length) {
      const warn = document.createElement("div");
      warn.style.marginTop = "10px";
      warn.innerHTML = `<small>Invalid links (won't be saved):<br>${invalidLinks.map(x => safeText(x)).join("<br>")}</small>`;
      linksList.appendChild(warn);
    }
  }

  addPreviewEl.appendChild(linksBox);

  // Files preview (ImageKit / direct file URLs)
  const filesBox = document.createElement("div");
  filesBox.className = "preview-item";
  filesBox.innerHTML = `<strong>Files</strong><div style="margin-top:8px;"></div>`;
  const filesList = filesBox.querySelector("div");

  if (!fileLinks.length) {
    filesList.innerHTML = `<small>No attached file links. Upload files to <a href="https://imagekit.io/dashboard/media-library/L2ZpbGVz" target="_blank" rel="noopener">ImageKit</a> and paste the URL(s) into Links (one per line).</small>`;
  } else {
    fileLinks.slice(0, 12).forEach((u) => {
      const meta = fileMetaFromUrl(u);
      const row = document.createElement("div");
      row.style.margin = "6px 0";
      row.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center;">
        <a href="${meta.url}" target="_blank" rel="noopener">${safeText(meta.name)}</a>
        <small style="color:var(--muted);">${safeText(meta.contentType || "")}</small>
      </div>`;
      filesList.appendChild(row);
    });
    if (fileLinks.length > 12) {
      const more = document.createElement("div");
      more.innerHTML = `<small>+${fileLinks.length - 12} more…</small>`;
      filesList.appendChild(more);
    }
  }

  if (pendingFiles.length) {
    const local = document.createElement("div");
    local.style.marginTop = "10px";
    local.innerHTML = `<small style="color:var(--muted);">Local selected files (not uploaded): ${pendingFiles.length}</small>`;
    filesList.appendChild(local);
  }

  addPreviewEl.appendChild(filesBox);

  // Description preview
  const desc = safeText(addDescEl?.value).trim();
  const descBox = document.createElement("div");
  descBox.className = "preview-item";
  descBox.innerHTML = `<strong>Description</strong><div style="margin-top:8px;"><small>${desc ? desc.replace(/</g,"&lt;") : "—"}</small></div>`;
  addPreviewEl.appendChild(descBox);
}

function bindModalEvents() {
  if (addModalCloseBtn) addModalCloseBtn.addEventListener("click", closeModal);
  if (addModalEl) {
    addModalEl.addEventListener("click", (e) => {
      if (e.target === addModalEl) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && addModalEl.classList.contains("open")) closeModal();
    });
  }

  // Update preview as user types
  [addTitleEl, addDescEl, addLinksEl, addTasksEl].forEach(el => {
    if (!el) return;
    el.addEventListener("input", updatePreview);
  });

  // Pickers
  if (addPickFilesBtn && addFilesInput) {
    addPickFilesBtn.addEventListener("click", () => addFilesInput.click());
  }
  if (addPickFolderBtn && addFolderInput) {
    addPickFolderBtn.addEventListener("click", () => addFolderInput.click());
  }

  // Dropzone click opens file picker
  if (addDropzoneEl && addFilesInput) {
    addDropzoneEl.addEventListener("click", (e) => {
      // Avoid re-trigger when clicking the internal buttons
      const t = e.target;
      if (t && (t.id === "addPickFiles" || t.id === "addPickFolder")) return;
      addFilesInput.click();
    });
  }

  const onPickedFiles = (fileList) => {
    const files = Array.from(fileList || []);
    // De-dup by name+size
    const key = (f) => `${f.name}::${f.size}`;
    const seen = new Set(pendingFiles.map(key));
    files.forEach(f => {
      if (!seen.has(key(f))) {
        pendingFiles.push(f);
        seen.add(key(f));
      }
    });
    updateFileCount();
    updatePreview();
  };

  if (addFilesInput) addFilesInput.addEventListener("change", (e) => onPickedFiles(e.target.files));
  if (addFolderInput) addFolderInput.addEventListener("change", (e) => onPickedFiles(e.target.files));

  // Drag & drop
  if (addDropzoneEl) {
    addDropzoneEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      addDropzoneEl.classList.add("dragover");
    });
    addDropzoneEl.addEventListener("dragleave", () => addDropzoneEl.classList.remove("dragover"));
    addDropzoneEl.addEventListener("drop", (e) => {
      e.preventDefault();
      addDropzoneEl.classList.remove("dragover");
      onPickedFiles(e.dataTransfer?.files);
    });
  }

  if (addClearBtn) addClearBtn.addEventListener("click", clearModal);

  if (addCommitBtn) addCommitBtn.addEventListener("click", async () => {
    if (!isAdmin) {
      alert("Admin emas.");
      return;
    }
    const title = safeText(addTitleEl?.value).trim();
    if (!title) {
      alert("Title yozing.");
      return;
    }

    addCommitBtn.disabled = true;
    showStatus("Saving...");

    const createdAtMs = nowMs();
    const createdByUid = currentUser?.uid || "";
    const description = safeText(addDescEl?.value).trim();

    const allLinkLines = parseLines(addLinksEl?.value);
    const validLinks = allLinkLines.filter(isValidUrl);

    // Store normal links in `links`, and direct file URLs (ImageKit, PDFs, images, zips, etc.) in `files`
    const fileLinks = validLinks.filter(isDirectFileUrl);
    const otherLinks = validLinks.filter((u) => !isDirectFileUrl(u));

    const linksMap = {};
    otherLinks.forEach((u, i) => linksMap[`l${String(i).padStart(3, "0")}`] = { url: u });

    const taskLines = parseLines(addTasksEl?.value);
    const tasksMap = {};
    taskLines.forEach((t, i) => tasksMap[`t${String(i).padStart(3, "0")}`] = { text: t });
    let filesMap = {};
    fileLinks.forEach((u, i) => {
      const meta = fileMetaFromUrl(u);
      filesMap[`f${String(i).padStart(3, "0")}`] = meta;
    });

    if (pendingFiles.length && fileLinks.length === 0) {
      console.warn("Local files selected but not uploaded. Upload to ImageKit and paste URLs into Links.");
    }

    try {
      const modRef = push(ref(db, MODULES_PATH));
      const moduleId = modRef.key;

      const payload = {
        title,
        description: description || "",
        createdAtMs,
        createdByUid,
        links: Object.keys(linksMap).length ? linksMap : null,
        tasks: Object.keys(tasksMap).length ? tasksMap : null,
        files: Object.keys(filesMap).length ? filesMap : null
      };

      // Clean nulls
      Object.keys(payload).forEach(k => payload[k] === null && delete payload[k]);

      await set(modRef, payload);

      showStatus("Saved ✅");
      clearModal();
      closeModal();

      // Auto select the newly created module
      selectedModuleId = moduleId;
      renderCourses();
      selectModule(moduleId);
    } catch (e) {
      console.error(e);
      alert("Saqlashda xatolik: " + (e?.message || e));
      showStatus("Error: " + (e?.message || e));
    } finally {
      addCommitBtn.disabled = false;
    }
  });
}


/* -----------------------------
   Courses + module rendering
------------------------------ */
function renderCourses() {
  if (!coursesEl) return;
  coursesEl.innerHTML = "";

  const makeCard = (mod, index) => {
    const card = document.createElement("div");
    card.className = "course-card";
    card.tabIndex = 0;

    if (selectedModuleId === mod.id) card.classList.add("selected");

    const title = safeText(mod.title) || `Lesson ${index + 1}`;
    const desc = safeText(mod.description || "").trim();

    card.innerHTML = `
      <div class="course-title">${index + 1}. ${title}</div>
      <div class="course-desc">${desc ? desc.slice(0, 110) + (desc.length > 110 ? "..." : "") : "—"}</div>
      <button class="start-btn" type="button">Boshlash</button>
    `;

    card.addEventListener("click", (e) => {
      e.preventDefault();
      selectModule(mod.id, true);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectModule(mod.id, true);
      }
    });

    return card;
  };

  modules.forEach((m, i) => coursesEl.appendChild(makeCard(m, i)));

  // Admin add card
  if (isAdmin) {
    const add = document.createElement("div");
    add.className = "course-card add-card";
    add.tabIndex = 0;
    add.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
        <div style="line-height:1;">+</div>
        <div style="font-size:13px;color:var(--muted);font-weight:600;">Add</div>
      </div>`;
    add.addEventListener("click", openModal);
    add.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal();
      }
    });
    coursesEl.appendChild(add);
  }
}

function setVideo(links) {
  if (!videoPlayerEl || !videoIframeEl || !noVideoMsgEl) return;

  const firstYoutube = links.map(l => youtubeEmbedUrl(l.url)).find(Boolean);

  if (firstYoutube) {
    videoPlayerEl.style.display = "block";
    videoIframeEl.src = firstYoutube;
    noVideoMsgEl.style.display = "none";
  } else {
    videoPlayerEl.style.display = "none";
    videoIframeEl.src = "";
    noVideoMsgEl.style.display = "block";
  }
}

function renderList(container, items, emptyText) {
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = `<p style="color: var(--muted); font-size: 13px;">${emptyText}</p>`;
    return;
  }
  items.forEach(it => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.style.padding = "10px 12px";
    div.style.border = "1px solid var(--border)";
    div.style.borderRadius = "14px";
    div.style.background = "rgba(255,255,255,0.03)";
    div.style.margin = "10px 0";
    div.innerHTML = it;
    container.appendChild(div);
  });
}

function selectModule(moduleId, shouldScroll = false) {
  selectedModuleId = moduleId;

  const mod = modules.find(m => m.id === moduleId);
  if (!mod) return;

  // Show detail section (expand + scroll if needed)
if (videoSectionEl) {
  videoSectionEl.classList.add("open");
  videoSectionEl.style.display = "block";
  if (shouldScroll) {
    try { videoSectionEl.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
  }
}

// Render content
  const links = mapToArray(mod.links).map(x => ({ url: x.url }));
  setVideo(links);

  if (qaEl) {
    qaEl.innerHTML = "";
    const title = document.createElement("h3");
    title.textContent = safeText(mod.title);
    title.style.margin = "0 0 10px";
    const p = document.createElement("p");
    p.textContent = safeText(mod.description || "—");
    p.style.color = "var(--muted)";
    p.style.lineHeight = "1.6";
    qaEl.appendChild(title);
    qaEl.appendChild(p);
  }

  const tasks = mapToArray(mod.tasks).map(t => safeText(t.text)).filter(Boolean);
  renderList(taskEl, tasks.map(t => `<div>✅ ${t}</div>`), "Vazifa yo‘q.");

  const nonYoutubeLinks = links
    .map(l => l.url)
    .filter(u => !youtubeEmbedUrl(u))
    .map(u => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  renderList(docEl, nonYoutubeLinks, "Link yo‘q.");

  const files = mapToArray(mod.files).map(f => {
    const url = safeText(f.url);
    const name = safeText(f.name || "file");
    const size = bytesToHuman(f.size || 0);
    return `<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
        <a href="${url}" target="_blank" rel="noopener">${name}</a>
        <small style="color:var(--muted);">${size}</small>
      </div>`;
  });
  renderList(downloadEl, files, "Yuklab olish yo‘q.");

  // Comments
  subscribeToComments(moduleId);

  // Re-render course list highlighting selection
  renderCourses();
}

/* -----------------------------
   Comments
------------------------------ */
function renderComments(comments) {
  if (!feedbackListEl) return;
  feedbackListEl.innerHTML = "";

  if (!comments.length) {
    feedbackListEl.innerHTML = `<p style="color: var(--muted); font-size: 13px;">Hali izoh yo‘q.</p>`;
    return;
  }

  comments
    .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
    .forEach(c => {
      const card = document.createElement("div");
      card.className = "feedback-card";
      const name = safeText(c.name || "User");
      const group = safeText(c.group_name || "");
      const time = c.createdAtMs ? new Date(c.createdAtMs).toLocaleString() : "";
      const badge = c.isAdmin ? `<span style="margin-left:8px;font-size:11px;padding:2px 8px;border:1px solid var(--border);border-radius:999px;color:var(--primary);">admin</span>` : "";

      card.innerHTML = `
        <div class="feedback-header">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <div class="feedback-name">${name}${badge}</div>
            ${group ? `<div class="feedback-group">(${group})</div>` : ""}
          </div>
          <div class="feedback-time">${time}</div>
        </div>
        <div class="feedback-message">${safeText(c.text || "").replace(/</g, "&lt;")}</div>
      `;

      // Allow delete own comment
      if (currentUser && c.uid === currentUser.uid) {
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.className = "start-btn report-btn";
        del.style.marginTop = "10px";
        del.style.padding = "8px 12px";
        del.addEventListener("click", async () => {
          if (!confirm("Delete comment?")) return;
          try {
            await remove(ref(db, `${COMMENTS_PATH(selectedModuleId)}/${c.id}`));
          } catch (e) {
            alert("Delete error: " + (e?.message || e));
          }
        });
        card.appendChild(del);
      }

      feedbackListEl.appendChild(card);
    });
}

function subscribeToComments(moduleId) {
  // Unsubscribe previous
  if (typeof unsubscribeComments === "function") unsubscribeComments();

  const r = ref(db, COMMENTS_PATH(moduleId));
  unsubscribeComments = onValue(r, (snap) => {
    const val = snap.val() || {};
    const arr = Object.keys(val).map(id => ({ id, ...val[id] }));
    renderComments(arr);
  }, (err) => {
    console.warn("Comments read error:", err);
    renderComments([]);
  });
}

async function loadMyProfile() {
  if (!currentUser) return {};
  try {
    const s = await get(ref(db, `students/${currentUser.uid}/profile`));
    return s.exists() ? (s.val() || {}) : {};
  } catch {
    return {};
  }
}

async function sendComment() {
  if (!currentUser) {
    {
  const ret = location.href;
  try { sessionStorage.setItem("edu_return_url", ret); } catch (e) {}
  try { localStorage.setItem("edu_return_url", ret); } catch (e) {}
  location.replace(`/pages/auth/reg.html?return=${encodeURIComponent(ret)}`);
  return;
}
}
  if (!selectedModuleId) {
    alert("Avval darsni tanlang.");
    return;
  }

  const text = safeText(commentTextEl?.value).trim();
  if (!text) return;

  commentSendBtn.disabled = true;

  try {
    const profile = await loadMyProfile();
    const name =
      safeText(profile.fullName || profile.name || profile.firstName || currentUser.displayName || currentUser.email?.split("@")[0] || "User").slice(0, 60);
    const group_name = safeText(profile.group_name || profile.group || profile.class || "").slice(0, 24);
    const email = safeText(currentUser.email || "").slice(0, 80);

    const commentRef = push(ref(db, COMMENTS_PATH(selectedModuleId)));
    const payload = {
      uid: currentUser.uid,
      name,
      email,
      group_name,
      text,
      createdAtMs: nowMs(),
      isAdmin: !!isAdmin
    };

    await set(commentRef, payload);
    commentTextEl.value = "";
  } catch (e) {
    console.error(e);
    alert("Izoh yuborilmadi: " + (e?.message || e));
  } finally {
    commentSendBtn.disabled = false;
  }
}


/* -----------------------------
   Certificates Slider (Refactored)
------------------------------ */
function initCertificateScroller() {
  const viewport = document.getElementById("certViewport");
  const track = document.getElementById("certTrack");
  const bgImg = document.getElementById("heroBgImg");
  const prevBtn = document.getElementById("certPrev");
  const nextBtn = document.getElementById("certNext");
  const dotsEl = document.getElementById("certDots");
  
  // Remove toggle btn ref if not used in simpler design, or keep for potential reuse
  // const toggleBtn = document.getElementById("certToggle"); 

  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".cert-slide"));
  if (!slides.length) return;

  const isVideoUrl = (src) => !!src && /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(src);
  const slideVideos = new Map();
  const slideBadges = new Map();

  // 1. Setup Videos
  const ensureVideoForSlide = (slide) => {
    const img = slide.querySelector("img.cert-img, img");
    if (!img) return null;
    const src = img.getAttribute("src") || img.currentSrc;
    if (!isVideoUrl(src)) return null;

    img.style.display = "none"; // Hide fallback img

    let v = slide.querySelector("video.cert-video");
    if (!v) {
      v = document.createElement("video");
      v.className = "cert-video cert-media";
      v.src = src;
      v.muted = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      // Critical for iOS/Safari inline playback
      v.setAttribute("playsinline", ""); 
      v.setAttribute("webkit-playsinline", "");
      v.setAttribute("muted", "");
      
      // We do NOT add 'controls' yet. We want a clean look until user interacts.
      slide.insertBefore(v, slide.firstChild);
    }

    // Badge
    let badge = slide.querySelector(".sound-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "sound-badge";
      badge.textContent = "Click to unmute";
      slide.appendChild(badge);
    }

    slideVideos.set(slide, v);
    slideBadges.set(slide, badge);
    
    // Attempt autoplay muted
    v.play().catch(() => {});
    return v;
  };

  slides.forEach(ensureVideoForSlide);

  // 2. State
  let index = 0;
  let autoScrollTimer = null;
  let isFocused = false; // If true, auto-scroll is OFF and a video is likely playing

  const getSlideIndex = (slide) => slides.indexOf(slide);

  const scrollToIndex = (i) => {
    index = (i + slides.length) % slides.length;
    const target = slides[index];
    
    // Smooth scroll to center the target slide
    const trackPadding = parseInt(window.getComputedStyle(track).paddingLeft) || 0;
    const scrollPos = target.offsetLeft - (viewport.clientWidth - target.clientWidth) / 2;
    
    viewport.scrollTo({
      left: scrollPos,
      behavior: "smooth"
    });

    updateDots();
    updateBackground(target);
    resetOthers(index);
  };

  const updateDots = () => {
    if (!dotsEl) return;
    if (!dotsEl.children.length) {
        // Init dots
        slides.forEach((_, i) => {
            const btn = document.createElement("button");
            btn.ariaLabel = `Go to slide ${i+1}`;
            btn.onclick = () => {
                stopAutoScroll();
                scrollToIndex(i);
            };
            dotsEl.appendChild(btn);
        });
    }
    Array.from(dotsEl.children).forEach((btn, i) => {
        btn.setAttribute("aria-current", i === index ? "true" : "false");
    });
  };

  const updateBackground = (slide) => {
    if (!bgImg) return;
    const v = slideVideos.get(slide);
    const img = slide.querySelector("img");
    let src = "";
    if (v) src = v.src;
    else if (img) src = img.src;
    
    // Only update if src exists (video src might be blob or remote)
    if(src && bgImg.src !== src) {
        // Simple fade effect could go here, but swapping src is standard
        // We use the blurred BG for atmosphere
    }
  };

  // Stop all other videos, mute them, reset styling
  const resetOthers = (activeIndex) => {
    slides.forEach((s, i) => {
        const v = slideVideos.get(s);
        const b = slideBadges.get(s);
        
        s.classList.remove("is-focused");
        
        if (v) {
            if (i !== activeIndex) {
                // Background slides: mute, loop, hide controls
                v.muted = true;
                v.controls = false;
                v.currentTime = 0; // Optional: reset loop
                v.play().catch(()=>{}); // Keep moving background
                if (b) {
                    b.style.opacity = "0"; // Hide badge on side slides
                    b.textContent = "Click to unmute";
                }
            } else {
                // Active slide but NOT focused yet (just scrolled to)
                if (!isFocused) {
                    v.muted = true;
                    v.controls = false;
                    v.play().catch(()=>{});
                    if (b) {
                        b.style.opacity = "1";
                        b.textContent = "Click to unmute";
                    }
                }
            }
        }
    });
  };

  // 3. Auto Scroll
  const startAutoScroll = () => {
    stopAutoScroll();
    autoScrollTimer = setInterval(() => {
        if (!isFocused) {
            scrollToIndex(index + 1);
        }
    }, 4000);
  };

  const stopAutoScroll = () => {
    if (autoScrollTimer) clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  };

  // 4. Interactions
  
  // Click on slide
  const onSlideClick = (e) => {
    const slide = e.target.closest(".cert-slide");
    if (!slide) return;
    
    const clickedIndex = getSlideIndex(slide);
    if (clickedIndex === -1) return;

    // If clicking a side slide, just scroll to it
    if (clickedIndex !== index) {
        stopAutoScroll();
        scrollToIndex(clickedIndex);
        return;
    }

    // If clicking the active slide
    const v = slideVideos.get(slide);
    if (v) {
        // Toggle Focus / Unmute
        if (!isFocused) {
            // ENTER FOCUS MODE
            stopAutoScroll();
            isFocused = true;
            slide.classList.add("is-focused");
            
            // Unmute and enable controls
            v.muted = false;
            v.volume = 1;
            v.controls = true; // Native controls allow user to scrub/fullscreen
            v.play().catch(err => console.log("Play failed", err));
            
            const b = slideBadges.get(slide);
            if (b) b.textContent = ""; // Hide text when playing with controls
        } 
        // Note: We don't easily "exit" focus on click because clicking the video usually pauses it via native controls.
        // User can scroll away to exit focus.
    }
  };

  track.addEventListener("click", onSlideClick);

  // Scroll/Drag detection to exit focus
  viewport.addEventListener("scroll", () => {
    // Determine the center slide
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let closestIndex = -1;
    let minDist = Infinity;

    slides.forEach((s, i) => {
        const sCenter = s.offsetLeft + s.clientWidth / 2;
        const dist = Math.abs(sCenter - center);
        if (dist < minDist) {
            minDist = dist;
            closestIndex = i;
        }
    });

    if (closestIndex !== -1 && closestIndex !== index) {
        // Changed slide manually
        index = closestIndex;
        isFocused = false; // Break focus
        updateDots();
        resetOthers(index);
        // Restart auto scroll after a delay? 
        // Let's rely on mouseleave/interaction to restart
    }
  });

  // Resume auto scroll on mouse leave if not focused
  viewport.addEventListener("mouseenter", stopAutoScroll);
  viewport.addEventListener("mouseleave", () => {
      if (!isFocused) startAutoScroll();
  });

  // Buttons
  prevBtn?.addEventListener("click", () => {
      stopAutoScroll();
      scrollToIndex(index - 1);
  });
  nextBtn?.addEventListener("click", () => {
      stopAutoScroll();
      scrollToIndex(index + 1);
  });

  // Init
  scrollToIndex(0);
  startAutoScroll();
}

/* -----------------------------
   Boot
------------------------------ */
async function checkAdmin(uid) {
  try {
    const s = await get(ref(db, `admins/${uid}`));
    return s.exists() && s.val() === true;
  } catch (e) {
    // If your rules deny reading /admins, you won't be able to show the admin UI.
    return false;
  }
}

function bindCommentUI() {
  if (commentSendBtn) commentSendBtn.addEventListener("click", sendComment);
  if (commentTextEl) {
    commentTextEl.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") sendComment();
    });
  }
}

function setAuthHint() {
  if (!commentAuthStateEl) return;
  if (!currentUser) {
    commentAuthStateEl.innerHTML = `Komment yozish uchun akkauntga kiring: <a href="/pages/auth/reg.html">Login / Register</a>`;
    return;
  }
  const label = isAdmin ? "admin" : "user";
  commentAuthStateEl.textContent = `Siz kirdingiz (${label}). CTRL+ENTER bilan ham yuborishingiz mumkin.`;
}

function startRealtimeModules() {
  const r = ref(db, MODULES_PATH);
  onValue(r, (snap) => {
    const val = snap.val() || {};
    const arr = Object.keys(val).map(id => ({ id, ...val[id] }));
    // Sort by createdAtMs asc
    arr.sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0));
    modules = arr;

    renderCourses();

    // Auto-select first module if none selected
    if (!selectedModuleId && modules.length) {
      selectModule(modules[0].id);
    }
  }, (err) => {
    console.error("Modules read error:", err);
    if (coursesEl) {
      coursesEl.innerHTML = `<p style="color: var(--muted);">Load error: ${safeText(err?.message || err)}</p>`;
    }
  });
}

function init() {
  initCertificateScroller();
  initTabs();
  bindCommentUI();
  bindModalEvents();
  updateFileCount();
  updatePreview();
  setAuthHint();
  startRealtimeModules();
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!currentUser) {
    setAuthHint();
    {
  const ret = location.href;
  try { sessionStorage.setItem("edu_return_url", ret); } catch (e) {}
  try { localStorage.setItem("edu_return_url", ret); } catch (e) {}
  location.replace(`/pages/auth/reg.html?return=${encodeURIComponent(ret)}`);
  return;
}
}

  isAdmin = await checkAdmin(currentUser.uid);
  setAuthHint();
  init();
});