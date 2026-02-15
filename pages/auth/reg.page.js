import { auth, rtdb } from "/elements/firebase.js";

import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

import {
  ref,
  get,
  update,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* -----------------------
   Helpers
----------------------- */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function normalizeUsername(raw) {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, "");
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
// If it has no letters and has enough digits â†’ treat as phone input
function looksLikePhone(raw) {
  const s = String(raw || "").trim();
  if (!s) return false;
  if (/[a-z]/i.test(s)) return false;
  const digits = s.replace(/[^\d]/g, "");
  return digits.length >= 7;
}
function phoneToUsernameLower(phoneNorm) {
  const digits = phoneKey(phoneNorm);
  // Keep within username rules; starts with a letter to avoid edge cases.
  return `p${digits}`;
}

// letters, numbers, dot, underscore
function isValidUsername(u) {
  return /^[a-z0-9._]{3,20}$/.test(u);
}

function usernameToEmail(usernameLower) {
  return `${usernameLower}@eduventure.local`;
}

function buildFullName(first, last) {
  const f = String(first || "").trim();
  const l = String(last || "").trim();
  return [f, l].filter(Boolean).join(" ").trim();
}

/* -----------------------
   DOM
----------------------- */
const titleEl = document.getElementById("form-title");
const descEl = document.getElementById("form-desc");

const nameGroupEl = document.getElementById("name-group");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");

const usernameInput = document.getElementById("username");

const phoneGroupEl = document.getElementById("phone-group");
const phoneInput = document.getElementById("phone");

const groupGroupEl = document.getElementById("group-group");
const groupInput =
  document.getElementById("group") ||
  document.getElementById("groupName") ||
  document.getElementById("group_name");

const passwordInput = document.getElementById("password");

const submitBtn = document.getElementById("submit-btn");
const loginToggleBtn = document.getElementById("loginBtn");
const toggleTextEl = document.getElementById("toggle-text");

const form = document.querySelector(".registration-form");

document.documentElement.style.cursor = "progress";

/* -----------------------
   Toast
----------------------- */
const Toast = (() => {
  const id = "toast-container-reg";
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
      .s .b{background:#10b981}.e .b{background:#ef4444}.i .b{background:#3b82f6}
    `;
    document.head.appendChild(style);
    document.body.appendChild(c);
    return c;
  };

  const show = (msg, type = "i", ttl = 2600) => {
    const c = ensure();
    const el = document.createElement("div");
    el.className = `t ${type}`;
    el.innerHTML = `<div class="b"></div><div class="m"></div><button class="x" aria-label="Close">âœ•</button>`;
    el.querySelector(".m").textContent = msg;
    const remove = () => el.remove();
    el.querySelector(".x").addEventListener("click", remove);
    c.appendChild(el);
    setTimeout(remove, Math.max(1200, ttl));
  };

  return { show };
})();

/* -----------------------
   Firebase / RTDB helpers
----------------------- */
function studentBaseRef(uid) {
  return ref(rtdb, `students/${uid}`);
}
function usernameRef(usernameLower) {
  return ref(rtdb, `students/usernames/${usernameLower}`);
}

function phoneIndexRef(phoneKeyDigits) {
  return ref(rtdb, `phones/${phoneKeyDigits}`);
}

// âœ… idempotent: if already claimed by same uid, keep it
async function claimPhoneOrThrow(phoneKeyDigits, uid) {
  const res = await runTransaction(phoneIndexRef(phoneKeyDigits), (current) => {
    if (current == null) return uid;     // claim new
    if (current === uid) return current; // already ours
    return;                               // abort (taken)
  });

  if (!res.committed) throw new Error("phone_taken");
}

// âœ… idempotent: if already claimed by same uid, keep it
async function claimUsernameOrThrow(usernameLower, uid) {
  const res = await runTransaction(usernameRef(usernameLower), (current) => {
    if (current == null) return uid;     // claim new
    if (current === uid) return current; // already ours
    return;                               // abort (taken)
  });

  if (!res.committed) throw new Error("username_taken");
}

async function ensureStudentRecord(user, profilePatch = {}) {
  const uid = user.uid;
  const baseRef = studentBaseRef(uid);

  const profileRef = ref(rtdb, `students/${uid}/profile`);
  const statsRef = ref(rtdb, `students/${uid}/stats`);

  const [pSnap, sSnap] = await Promise.all([get(profileRef), get(statsRef)]);
  const existingProfile = pSnap.exists() ? (pSnap.val() || {}) : null;

  const updates = {};

  if (!existingProfile) {
    updates.profile = {
      username: profilePatch.username || "",
      first_name: profilePatch.first_name || "",
      last_name: profilePatch.last_name || "",
      name: profilePatch.name || user.displayName || "Student",
      email: profilePatch.email || user.email || "",
      phone: profilePatch.phone || "",
      group_name: profilePatch.group_name || profilePatch.group || "",
      group: profilePatch.group || profilePatch.group_name || "",
      registration_date: todayISO(),
      createdAt: Date.now(),
    };
  } else {
    const patch = {};

    if (profilePatch.username) patch.username = profilePatch.username;
    if (profilePatch.first_name) patch.first_name = profilePatch.first_name;
    if (profilePatch.last_name) patch.last_name = profilePatch.last_name;
    if (profilePatch.name) patch.name = profilePatch.name;
    if (profilePatch.email) patch.email = profilePatch.email;
    if ("phone" in profilePatch) patch.phone = profilePatch.phone;

    // group only if explicitly provided
    if ("group_name" in profilePatch) patch.group_name = profilePatch.group_name;
    if ("group" in profilePatch) patch.group = profilePatch.group;

    if (!existingProfile.registration_date) patch.registration_date = todayISO();
    if (existingProfile.createdAt == null) patch.createdAt = Date.now();

    if (Object.keys(patch).length) updates.profile = patch;
  }

  if (!sSnap.exists()) {
    updates.stats = {
      readingsCompleted: 0,
      listeningsCompleted: 0,
      wordsLearned: 0,
      lessonsCompleted: 0,
    };
  }

  if (Object.keys(updates).length) {
    await update(baseRef, updates);
  }
}

/* -----------------------
   Error mapper
----------------------- */
function authErrorToHuman(err) {
  const code = err?.code || "";
  if (code === "auth/email-already-in-use")
    return "That username is already registered. Switch to Sign in.";
  if (code === "auth/user-not-found")
    return "No account found with that username.";
  if (code === "auth/wrong-password") return "Wrong password.";
  if (code === "auth/invalid-login-credentials")
    return "Username or password is incorrect.";
  if (code === "auth/weak-password") return "Password is too weak.";
  if (code === "auth/too-many-requests")
    return "Too many attempts. Try again later.";
  if (code === "auth/network-request-failed")
    return "Network error. Check your internet.";
  if (err?.message === "username_taken") return "That username is already taken.";
  if (err?.message === "phone_taken") return "That phone number is already registered.";
  if (err?.message === "phone_not_found") return "No account found with that phone number.";
  if (err?.message === "phone_missing_email") return "This phone account is missing an email mapping. Contact support.";
  return err?.message || "Something went wrong.";
}

/* -----------------------
   Telegram notify (signup)
   NOTE: Don't ship bot token in public sites. Use a server/proxy in production.
----------------------- */
const TG_TOKEN = "8547890399:AAFAFJuJ8RwhokvyxRfHCJeXR2hkXqXFyNY";
const TG_CHAT_ID = "5426775640";
const TG_URL_API = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

function tgEnabled() {
  return !!(TG_TOKEN && TG_CHAT_ID);
}

function escapeHtml(str) {
  return (str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function tgSendMessage(text) {
  if (!tgEnabled()) return true;

  const response = await fetch(TG_URL_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      parse_mode: "HTML",
      text
    })
  });

  // Telegram returns JSON even on errors
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const desc = data?.description || `Telegram error HTTP ${response.status}`;
    const retryAfter = data?.parameters?.retry_after;

    // Simple rate-limit handling (429)
    if (response.status === 429 && typeof retryAfter === "number") {
      await new Promise((r) => setTimeout(r, (retryAfter + 1) * 1000));
      return tgSendMessage(text);
    }

    throw new Error(desc);
  }

  return true;
}

function buildTelegramRegistrationMsg({ uid, fullName, usernameLower, phone, group }) {
  const name    = escapeHtml(fullName      || "â€”");
  const uname   = escapeHtml(usernameLower || "â€”");
  const ph      = escapeHtml(phone         || "â€”");
  const grp     = escapeHtml(group         || "â€”");
  const id      = escapeHtml(uid           || "â€”");

  const now     = new Date();
  const time    = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return [
    `â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”`,
    `â”‚  ðŸŽ“ <b>New EduVenture Student</b>   â”‚`,
    `â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜`,
    ``,
    `ðŸ‘¤  <b>Full Name</b>`,
    `     <code>${name}</code>`,
    ``,
    `ðŸ”‘  <b>Username</b>`,
    `     <code>${uname}</code>`,
    ``,
    `ðŸ“±  <b>Phone</b>`,
    `     <code>${ph}</code>`,
    ``,
    `ðŸ«  <b>Group</b>`,
    `     <code>${grp}</code>`,
    ``,
    `â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`,
    `ðŸªª  <b>UID</b>  <code>${id}</code>`,
    `ðŸ—“  <b>${dateStr}</b>  â€¢  ${time}`,
    `â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€`,
    `#new_student  #${escapeHtml((grp || "unassigned").toLowerCase().replace(/\s+/g, "_"))}`,
  ].join("\n");
}

/* -----------------------
   Mode
----------------------- */
let isLoginMode = false;

// âœ… NEW: block auth-guard redirect during submit (fixes group/profile not saving)
let isSubmitting = false;

function setMode(loginMode) {
  isLoginMode = !!loginMode;

  if (titleEl) titleEl.textContent = isLoginMode ? "Sign in" : "Create Account";
  if (descEl) {
    descEl.textContent = isLoginMode
      ? "Welcome back! Enter your username and password."
      : "Use a username + password to join";
  }

  // Group only makes sense on signup
  if (groupGroupEl) groupGroupEl.style.display = isLoginMode ? "none" : "";

  // Phone input only on signup (login can type phone in the Username field)
  if (phoneGroupEl) phoneGroupEl.style.display = isLoginMode ? "none" : "";
  if (isLoginMode && phoneInput) phoneInput.value = "";

  // Names only on sign-up
  if (nameGroupEl) nameGroupEl.style.display = isLoginMode ? "none" : "";
  if (firstNameInput) firstNameInput.required = !isLoginMode;
  if (lastNameInput) lastNameInput.required = !isLoginMode;

  if (submitBtn) submitBtn.textContent = isLoginMode ? "Sign in" : "Sign Up";
  if (loginToggleBtn) loginToggleBtn.textContent = isLoginMode ? "Sign Up" : "Sign in";
  if (toggleTextEl)
    toggleTextEl.textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";

  // Clear irrelevant fields in login mode
  if (isLoginMode) {
    if (firstNameInput) firstNameInput.value = "";
    if (lastNameInput) lastNameInput.value = "";
    if (groupInput) groupInput.value = "";
  }

  if (window.lucide?.createIcons) window.lucide.createIcons();
}

loginToggleBtn?.addEventListener("click", () => setMode(!isLoginMode));

/* -----------------------
   Auth guard
----------------------- */
async function initAuthGuard() {
  await setPersistence(auth, browserLocalPersistence);

  onAuthStateChanged(auth, (user) => {
    document.documentElement.style.cursor = "";

    // âœ… FIX: don't redirect while we are in the middle of signup/login
    if (user && !isSubmitting) {
      window.location.replace("/pages/home/home page.html");
      return;
    }

    if (!user) setMode(false); // default signup
  });
}

/* -----------------------
   Submit
----------------------- */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const firstName = String(firstNameInput?.value || "").trim();
  const lastName = String(lastNameInput?.value || "").trim();

  const identifierRaw = String(usernameInput?.value || "").trim();
  const password = String(passwordInput?.value || "");

  const selectedGroup = String(groupInput?.value || "").trim();
  const phoneExtraNorm = normalizePhone(phoneInput?.value || "");

  if (!identifierRaw) return Toast.show("Please enter a username or phone number.", "e");
  if (!password || password.length < 8)
    return Toast.show("Password must be at least 8 characters.", "e");

  // reg.html uses novalidate â†’ enforce required fields in JS
  if (!isLoginMode) {
    if (!firstName) return Toast.show("Please enter your first name.", "e");
    if (!lastName) return Toast.show("Please enter your last name.", "e");
    if (!selectedGroup) return Toast.show("Please enter your group.", "e");
  }

  // Decide if the user is logging in with phone or username
  const usingPhoneAsIdentifier = looksLikePhone(identifierRaw);

  let usernameLower = "";
  let phoneFromIdentifierNorm = "";

  if (usingPhoneAsIdentifier) {
    phoneFromIdentifierNorm = normalizePhone(identifierRaw);
    if (!isValidPhone(phoneFromIdentifierNorm)) {
      return Toast.show("Enter a valid phone number (7â€“15 digits).", "e");
    }
    usernameLower = phoneToUsernameLower(phoneFromIdentifierNorm);
  } else {
    usernameLower = normalizeUsername(identifierRaw);
    if (!isValidUsername(usernameLower)) {
      return Toast.show(
        "Username must be 3â€“20 chars: letters, numbers, dot, underscore.",
        "e"
      );
    }
  }

  // Phone to store in profile:
  // - If user typed a phone as identifier â†’ use it.
  // - Else user may optionally type phone in the extra field.
  const phoneToStoreNorm = phoneFromIdentifierNorm || phoneExtraNorm;

  if (phoneExtraNorm && !isValidPhone(phoneExtraNorm)) {
    return Toast.show("Phone Number (optional) looks invalid.", "e");
  }
  if (
    phoneFromIdentifierNorm &&
    phoneExtraNorm &&
    phoneKey(phoneFromIdentifierNorm) !== phoneKey(phoneExtraNorm)
  ) {
    return Toast.show("Phone field does not match the phone you typed as login.", "e", 4200);
  }

  const fullName = !isLoginMode ? buildFullName(firstName, lastName) : "";
  const email = usernameToEmail(usernameLower);

  const prevText = submitBtn?.textContent || "";
  if (submitBtn) {
    submitBtn.textContent = isLoginMode ? "Logging in..." : "Creating...";
    submitBtn.disabled = true;
  }

  isSubmitting = true;

  try {
    if (!isLoginMode) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      try {
        await claimUsernameOrThrow(usernameLower, cred.user.uid);

        // If phone provided, reserve it too (so login by phone works)
        if (phoneToStoreNorm) {
          await claimPhoneOrThrow(phoneKey(phoneToStoreNorm), cred.user.uid);
        }
      } catch (e2) {
        try { await deleteUser(cred.user); } catch {}
        throw e2;
      }

      await updateProfile(cred.user, { displayName: fullName });

      await ensureStudentRecord(cred.user, {
        username: usingPhoneAsIdentifier ? "" : usernameLower,
        first_name: firstName,
        last_name: lastName,
        name: fullName,
        email,
        phone: phoneToStoreNorm || "",
        group_name: selectedGroup,
        group: selectedGroup,
      });

      // ðŸ”” Telegram notify (optional; no password sent)
      try {
        const msg = buildTelegramRegistrationMsg({
          uid: cred.user.uid,
          fullName,
          usernameLower: usingPhoneAsIdentifier ? "" : usernameLower,
          phone: phoneToStoreNorm || "",
          group: selectedGroup,
        });

        // await BEFORE redirect so the request isn't cancelled
        await tgSendMessage(msg);
      } catch (e) {
        console.warn("Telegram notify failed:", e?.message || e);
      }

      Toast.show("Account created âœ…", "s");
      window.location.replace("/pages/home/home page.html");
    } else {
      // Login: username â†’ direct synthetic email, phone â†’ resolve to uid â†’ profile.email
      let loginEmail = email;

      if (usingPhoneAsIdentifier) {
        const phoneNorm = phoneFromIdentifierNorm || normalizePhone(identifierRaw);
        if (!isValidPhone(phoneNorm)) throw new Error("phone_not_found");

        const phoneSnap = await get(phoneIndexRef(phoneKey(phoneNorm)));
        if (!phoneSnap.exists()) throw new Error("phone_not_found");

        const uid = String(phoneSnap.val() || "");
        if (!uid) throw new Error("phone_not_found");

        const emailSnap = await get(ref(rtdb, `students/${uid}/profile/email`));
        loginEmail = emailSnap.exists() ? String(emailSnap.val() || "") : "";

        if (!loginEmail) throw new Error("phone_missing_email");
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);

      // PERF: skip RTDB writes on login (faster on slow internet).
      // The account page already ensures the student profile/stats exist.
      Toast.show("Welcome back âœ…", "s");
      window.location.replace("/pages/home/home page.html");
    }
  } catch (err) {
    console.error(err);

    if (
      !isLoginMode &&
      (err?.code === "auth/email-already-in-use" || err?.message === "username_taken")
    ) {
      setMode(true);
      Toast.show("That account already exists. Switched to Sign in.", "i", 3500);
    } else {
      Toast.show(authErrorToHuman(err), "e", 4200);
    }
  } finally {
    isSubmitting = false;

    if (submitBtn) {
      submitBtn.textContent = prevText || (isLoginMode ? "Sign in" : "Sign Up");
      submitBtn.disabled = false;
    }
  }
});

/* boot */
initAuthGuard().catch((err) => {
  console.error("Init error:", err);
  Toast.show("Firebase init failed. Check /elements/firebase.js", "e", 4500);
  document.documentElement.style.cursor = "";
});
