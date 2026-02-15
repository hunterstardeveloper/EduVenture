<<<<<<< HEAD
﻿(() => {
  "use strict";

  const FLAG = "__EDUVENTURE_UI_LOADED__";
  if (globalThis[FLAG]) return;
  globalThis[FLAG] = { at: Date.now() };

  const GREEN = "#00FF41";
  const WHITE = "#E9EEF5";
  const DIM = "#8A8F98";
  const mono =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

  const css = {
    banner: `color:${GREEN}; font-weight:800; line-height:1.05; font-family:${mono};`,
    white: `color:${WHITE}; font-family:${mono};`,
    dim: `color:${DIM}; font-family:${mono};`,
    green: `color:${GREEN}; font-weight:800; font-family:${mono};`,
  };

  function lockDocumentTitle(desiredTitle) {
    const head = document.head || document.getElementsByTagName("head")[0];

    const ensureOneTitle = () => {
      const all = head ? head.querySelectorAll("title") : document.querySelectorAll("title");
      let el = all[0];
      if (!el) {
        el = document.createElement("title");
        (head || document.documentElement).appendChild(el);
      }
      for (let i = 1; i < all.length; i++) all[i].remove();
      return el;
    };

    let titleEl = ensureOneTitle();

    titleEl.textContent = desiredTitle;
    document.title = desiredTitle;

    let internal = false;
    const sync = () => {
      if (internal) return;

      if (document.title !== desiredTitle) {
        internal = true;
        document.title = desiredTitle;
        internal = false;
      }
      if (titleEl.textContent !== desiredTitle) {
        internal = true;
        titleEl.textContent = desiredTitle;
        internal = false;
      }
    };

    const titleObserver = new MutationObserver(sync);
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });

    const headObserver = new MutationObserver(() => {
      titleEl = ensureOneTitle();
      sync();
    });
    if (head) headObserver.observe(head, { childList: true, subtree: true });

    return {
      set: (t) => {
        desiredTitle = String(t);
        sync();
      },
      stop: () => {
        titleObserver.disconnect();
        headObserver.disconnect();
      },
    };
  }

  function prettifyFileName(file) {
    return (file || "")
      .replace(/\.html$/i, "")
      .replace(/[._-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getShortPageName() {
    const pathname = decodeURIComponent(location.pathname || "/");
    const qs = new URLSearchParams(location.search || "");

    if (pathname === "/" || pathname.endsWith("/index.html")) return "";

    if (pathname.endsWith("/pages/study_materials/study_materials.html")) return "Study Materials";
    if (pathname.endsWith("/pages/chat/global.chat.html")) return "Global Chat";

    if (pathname.endsWith("/pages/study_materials/bridge.html")) {
      const mode = (qs.get("mode") || "").trim();
      if (!mode) return "Bridge";
      const niceMode = mode[0].toUpperCase() + mode.slice(1);
      return `Bridge — ${niceMode}`;
    }

    {
      const m = pathname.match(/\/reading\/test\d+\/pass(\d+)\/.+\.html$/i);
      if (m) return `Pass ${m[1]}`;
    }

    {
      const m = pathname.match(/\/listenings?\/test\d+\/sec(\d+)\/.+\.html$/i);
      if (m) return `Section ${m[1]}`;
    }

    const fileOnly = (pathname.split("/").filter(Boolean).pop() || "").trim();
    return prettifyFileName(fileOnly) || "Page";
  }

  function buildEduventureTitle() {
    const base = "EDUVENTURE";
    const page = getShortPageName();
    return page ? `${base} | ${page}` : base;
  }

  const titleLock = lockDocumentTitle(buildEduventureTitle());

  function refreshTitle() {
    titleLock.set(buildEduventureTitle());
  }

  window.addEventListener("popstate", refreshTitle);
  window.addEventListener("hashchange", refreshTitle);

  const _pushState = history.pushState;
  const _replaceState = history.replaceState;

  history.pushState = function (...args) {
    const r = _pushState.apply(this, args);
    refreshTitle();
    return r;
  };
  history.replaceState = function (...args) {
    const r = _replaceState.apply(this, args);
    refreshTitle();
    return r;
  };

  refreshTitle();

  console.log("%c[EDUVENTURE UI] v2.0 (NO COMMANDS) LOADED", css.green);

  const art = String.raw`
 ███████╗██████╗ ██╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗██╗   ██╗██████╗ ███████╗
 ██╔════╝██╔══██╗██║   ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██║   ██║██╔══██╗██╔════╝
 █████╗  ██║  ██║██║   ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝█████╗
 ██╔══╝  ██║  ██║██║   ██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗██╔══╝
 ███████╗██████╔╝╚██████╔╝ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║███████╗
 ╚══════╝╚═════╝  ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
  `.trimEnd();

  const makeKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = (n) =>
      Array.from({ length: n }, () => chars[(Math.random() * chars.length) | 0]).join("");
    return `EDU-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
  };

  const LICENSE = {
    status: "VALID",
    edition: "Student Terminal",
    key: makeKey(),
    issuedTo: "Local Session",
  };

  console.log(`%c${art}`, css.banner);

  console.log("%cBooting %cEDUVENTURE%c interface…", css.white, css.green, css.white);
  console.log("%cLicense verification… %cOK", css.dim, css.green);

  const W = 66;
  const top = "┌" + "─".repeat(W) + "┐";
  const bot = "└" + "─".repeat(W) + "┘";
  const line = (t = "") => `│ ${String(t).padEnd(W - 1, " ")}│`;

  const card =
    top +
    "\n" +
    line("EDUVENTURE LICENSE") +
    "\n" +
    line("") +
    "\n" +
    line(`Status: ${LICENSE.status}`) +
    "\n" +
    line(`Edition: ${LICENSE.edition}`) +
    "\n" +
    line(`Key: ${LICENSE.key}`) +
    "\n" +
    line(`Issued To: ${LICENSE.issuedTo}`) +
    "\n" +
    line("") +
    "\n" +
    bot;

  console.log(`%c${card}`, css.dim);
})();
(function registerEduventureServiceWorker() {
  "use strict";

  if (window.__EDUVENTURE_SW_REG_DONE) return;
  window.__EDUVENTURE_SW_REG_DONE = true;

  const LOG = true;
  const CHECK_EVERY_MIN = 10;

  const log = (...a) => LOG && console.log("[SW-REG]", ...a);
  const warn = (...a) => LOG && console.warn("[SW-REG]", ...a);

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (!("serviceWorker" in navigator)) {
    warn("Service workers not supported in this browser.");
    return;
  }

  if (location.protocol !== "https:" && !isLocalhost) {
    warn("SW requires HTTPS (or localhost). Current:", location.protocol);
    return;
  }

  async function findSwUrl() {
    const candidates = [
      "/sw.js",
      "./sw.js",
      "../sw.js",
      "../../sw.js",
      "../../../sw.js",
      "../../../../sw.js",
    ];

    for (const p of candidates) {
      try {
        const url = new URL(p, location.href).toString();
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          return url;
        }
      } catch (_) {}
    }

    return null;
  }

  function computeScopeFromSwUrl(swUrl) {
    try {
      const u = new URL(swUrl);
      const scopePath = u.pathname.replace(/[^/]*$/, "");
      return scopePath || "/";
    } catch {
      return "/";
    }
  }

  async function register() {
    const swUrl = await findSwUrl();
    if (!swUrl) {
      warn(
        "Could not locate sw.js. Make sure sw.js is deployed (ideally at site root: /sw.js)."
      );
      return;
    }

    const scope = computeScopeFromSwUrl(swUrl);

    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope });

      if (reg.waiting) {
        log("Update waiting → telling it to SKIP_WAITING");
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed") {
            if (navigator.serviceWorker.controller) {
              log("New SW installed → SKIP_WAITING");
              sw.postMessage({ type: "SKIP_WAITING" });
            } else {
              log("SW installed for first time.");
            }
          }
        });
      });

      let refreshed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshed) return;
        refreshed = true;
        log("Controller changed → reloading page once.");
        location.reload();
      });

      if (CHECK_EVERY_MIN > 0) {
        setInterval(() => {
          reg.update().catch(() => {});
        }, CHECK_EVERY_MIN * 60 * 1000);
      }
    } catch (err) {
      warn("Registration failed:", err);
      warn(
        "Common causes: sw.js not at the expected path, wrong MIME type, or hosting config blocks it."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
})();

(() => {
  "use strict";

  if (window.__EDUVENTURE_CHECKER_LOADER__) return;
  window.__EDUVENTURE_CHECKER_LOADER__ = true;

  const CHECKER_SRC = "/script-internet-checker.js";

  const already = [...document.scripts].some(s => (s.src || "").includes(CHECKER_SRC));
  if (already) return;

  const s = document.createElement("script");
  s.src = CHECKER_SRC + (CHECKER_SRC.includes("?") ? "&" : "?") + "v=" + Date.now();
  s.defer = true;

  (document.head || document.documentElement).appendChild(s);
})();

(function initEduventureFocusTrap() {
  "use strict";

  if (window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__) return;
  window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__ = true;

  const ENABLE_LOGS = false;

  const CONFIG = {
    enableArrowNavigation: true,
    enableTabTrap: true,
    enableFocusVisuals: true,
    wrapAroundEdges: true,
    smoothScroll: true,
    arrowTolerance: 5,
    focusColor: '#8B9FFF',
    focusColorRGB: '139, 159, 255',
    shortcuts: {
      home: true,
      end: true,
      escape: true,
    }
  };

  const log = (...args) => ENABLE_LOGS && console.log("[FOCUS-TRAP]", ...args);

  function getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
    ].join(',');

    return Array.from(document.querySelectorAll(selector)).filter(el => {
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        getComputedStyle(el).visibility !== 'hidden' &&
        !el.hasAttribute('aria-hidden')
      );
    });
  }

  function handleTabKey(e) {
    if (!CONFIG.enableTabTrap) return;

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
        e.preventDefault();
        lastElement.focus();
        log("Shift+Tab: Wrapped to last element");
      }
    } else {
      if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
        e.preventDefault();
        firstElement.focus();
        log("Tab: Wrapped to first element");
      }
    }
  }

  function handleHomeEndKeys(e) {
    if (e.key === 'Home' && CONFIG.shortcuts.home) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        e.preventDefault();
        focusableElements[0].focus();
        log("Home: Jumped to first element");
        if (CONFIG.smoothScroll) {
          focusableElements[0].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    } else if (e.key === 'End' && CONFIG.shortcuts.end) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        e.preventDefault();
        const lastElement = focusableElements[focusableElements.length - 1];
        lastElement.focus();
        log("End: Jumped to last element");
        if (CONFIG.smoothScroll) {
          lastElement.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }
    }
  }

  function handleArrowKeys(e) {
    if (!CONFIG.enableArrowNavigation) return;

    const key = e.key;

    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const activeType = document.activeElement?.type?.toLowerCase();

    const isTextInput =
      activeTag === 'textarea' ||
      document.activeElement?.isContentEditable ||
      (activeTag === 'input' && ['text', 'email', 'password', 'search', 'url', 'tel'].includes(activeType));

    if (isTextInput) {
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    e.preventDefault();

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const currentElement = document.activeElement;
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex === -1) {
      focusableElements[0].focus();
      log(`${key}: Focused first element (nothing was focused)`);
      return;
    }

    const currentRect = currentElement.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestElement = null;
    let bestScore = Infinity;

    focusableElements.forEach(element => {
      if (element === currentElement) return;

      const rect = element.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      let isInDirection = false;
      let primaryDistance = 0;
      let secondaryDistance = 0;
      const tolerance = CONFIG.arrowTolerance;

      switch (key) {
        case 'ArrowUp':
          isInDirection = dy < -tolerance;
          primaryDistance = Math.abs(dy);
          secondaryDistance = Math.abs(dx);
          break;
        case 'ArrowDown':
          isInDirection = dy > tolerance;
          primaryDistance = Math.abs(dy);
          secondaryDistance = Math.abs(dx);
          break;
        case 'ArrowLeft':
          isInDirection = dx < -tolerance;
          primaryDistance = Math.abs(dx);
          secondaryDistance = Math.abs(dy);
          break;
        case 'ArrowRight':
          isInDirection = dx > tolerance;
          primaryDistance = Math.abs(dx);
          secondaryDistance = Math.abs(dy);
          break;
      }

      if (!isInDirection) return;

      const score = primaryDistance + (secondaryDistance * 0.5);

      if (score < bestScore) {
        bestScore = score;
        bestElement = element;
      }
    });

    if (bestElement) {
      bestElement.focus();
      log(`${key}: Navigated to element at distance ${bestScore.toFixed(1)}px`);

      if (CONFIG.smoothScroll) {
        bestElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    } else if (CONFIG.wrapAroundEdges) {
      let wrapElement = null;

      switch (key) {
        case 'ArrowUp':
          wrapElement = focusableElements.reduce((bottom, el) => {
            const rect = el.getBoundingClientRect();
            const bottomRect = bottom.getBoundingClientRect();
            return rect.top > bottomRect.top ? el : bottom;
          });
          break;
        case 'ArrowDown':
          wrapElement = focusableElements.reduce((top, el) => {
            const rect = el.getBoundingClientRect();
            const topRect = top.getBoundingClientRect();
            return rect.top < topRect.top ? el : top;
          });
          break;
        case 'ArrowLeft':
          wrapElement = focusableElements.reduce((right, el) => {
            const rect = el.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            return rect.left > rightRect.left ? el : right;
          });
          break;
        case 'ArrowRight':
          wrapElement = focusableElements.reduce((left, el) => {
            const rect = el.getBoundingClientRect();
            const leftRect = left.getBoundingClientRect();
            return rect.left < leftRect.left ? el : left;
          });
          break;
      }

      if (wrapElement && wrapElement !== currentElement) {
        wrapElement.focus();
        log(`${key}: Wrapped to opposite edge`);
        if (CONFIG.smoothScroll) {
          wrapElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      } else {
        log(`${key}: No element found in that direction, staying put`);
      }
    } else {
      log(`${key}: No element found in that direction, staying put`);
    }
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && CONFIG.shortcuts.escape && document.activeElement) {
      document.activeElement.blur();
      log("Escape: Blurred active element");
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      handleTabKey(e);
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      handleArrowKeys(e);
    }

    if (['Home', 'End'].includes(e.key)) {
      handleHomeEndKeys(e);
    }

    if (e.key === 'Escape') {
      handleEscapeKey(e);
    }
  }

  function handleFocusOut(e) {
    setTimeout(() => {
      if (!document.hasFocus()) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          log("Focus left document, returned to first element");
        }
      }
    }, 0);
  }

  function init() {
    if (CONFIG.enableFocusVisuals) {
      const style = document.createElement('style');
      style.id = 'eduventure-focus-trap-styles';
      style.textContent = `
        /* EDUVENTURE Focus Trap - Visual Focus Indicators */
        
        /* Enhanced focus ring for keyboard navigation - matches site theme */
        *:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.15) !important;
          transition: outline 0.15s ease, box-shadow 0.15s ease !important;
        }
        
        /* Remove focus ring for mouse clicks (preserve for keyboard only) */
        *:focus:not(:focus-visible) {
          outline: none;
        }
        
        /* Special handling for buttons and interactive elements */
        button:focus-visible, 
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.2) !important;
        }
        
        /* Subtle glow for dark backgrounds */
        .dark *:focus-visible,
        [data-theme="dark"] *:focus-visible,
        header *:focus-visible,
        nav *:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.25), 
                      0 0 12px rgba(${CONFIG.focusColorRGB}, 0.4) !important;
        }
        
        /* Smooth focus transitions */
        * {
          scroll-behavior: ${CONFIG.smoothScroll ? 'smooth' : 'auto'};
        }
        
        /* Ensure body is focusable when needed */
        body[tabindex] {
          outline: none;
        }
      `;

      if (!document.getElementById('eduventure-focus-trap-styles')) {
        (document.head || document.documentElement).appendChild(style);
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    window.addEventListener('blur', handleFocusOut);

    const ensureFocusable = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        document.body.setAttribute('tabindex', '0');
        log("No focusable elements found, made body focusable");
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureFocusable);
    } else {
      ensureFocusable();
    }

    const observer = new MutationObserver(ensureFocusable);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EDUVENTURE_FOCUS_TRAP = {
    disable: () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleFocusOut);
      log("Focus trap disabled");
    },
    enable: () => {
      document.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('blur', handleFocusOut);
      log("Focus trap enabled");
    },
    isActive: () => window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__,

    config: CONFIG,

    focusFirst: () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        log("Manually focused first element");
        return true;
      }
      return false;
    },
    focusLast: () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        const lastElement = focusableElements[focusableElements.length - 1];
        lastElement.focus();
        log("Manually focused last element");
        return true;
      }
      return false;
    },
    getFocusableCount: () => getFocusableElements().length,

    setArrowNavigation: (enabled) => {
      CONFIG.enableArrowNavigation = !!enabled;
      log(`Arrow navigation ${enabled ? 'enabled' : 'disabled'}`);
    },
    setTabTrap: (enabled) => {
      CONFIG.enableTabTrap = !!enabled;
      log(`Tab trap ${enabled ? 'enabled' : 'disabled'}`);
    },
    setFocusVisuals: (enabled) => {
      CONFIG.enableFocusVisuals = !!enabled;
      const styleEl = document.getElementById('eduventure-focus-trap-styles');
      if (styleEl) {
        styleEl.disabled = !enabled;
      }
      log(`Focus visuals ${enabled ? 'enabled' : 'disabled'}`);
    },

    setFocusColor: (hexColor, rgbString) => {
      CONFIG.focusColor = hexColor;
      if (rgbString) {
        CONFIG.focusColorRGB = rgbString;
      } else {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        CONFIG.focusColorRGB = `${r}, ${g}, ${b}`;
      }

      const oldStyle = document.getElementById('eduventure-focus-trap-styles');
      if (oldStyle) {
        oldStyle.remove();
      }

      if (CONFIG.enableFocusVisuals) {
        const style = document.createElement('style');
        style.id = 'eduventure-focus-trap-styles';
        style.textContent = `
          *:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.15) !important;
            transition: outline 0.15s ease, box-shadow 0.15s ease !important;
          }
          *:focus:not(:focus-visible) { outline: none; }
          button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.2) !important;
          }
          .dark *:focus-visible, [data-theme="dark"] *:focus-visible, header *:focus-visible, nav *:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.25), 0 0 12px rgba(${CONFIG.focusColorRGB}, 0.4) !important;
          }
          * { scroll-behavior: ${CONFIG.smoothScroll ? 'smooth' : 'auto'}; }
          body[tabindex] { outline: none; }
        `;
        (document.head || document.documentElement).appendChild(style);
      }

      log(`Focus color changed to ${hexColor}`);
    }
  };

=======
﻿(() => {
  "use strict";

  const FLAG = "__EDUVENTURE_UI_LOADED__";
  if (globalThis[FLAG]) return;
  globalThis[FLAG] = { at: Date.now() };

  const GREEN = "#00FF41";
  const WHITE = "#E9EEF5";
  const DIM = "#8A8F98";
  const mono =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace';

  const css = {
    banner: `color:${GREEN}; font-weight:800; line-height:1.05; font-family:${mono};`,
    white: `color:${WHITE}; font-family:${mono};`,
    dim: `color:${DIM}; font-family:${mono};`,
    green: `color:${GREEN}; font-weight:800; font-family:${mono};`,
  };

  function lockDocumentTitle(desiredTitle) {
    const head = document.head || document.getElementsByTagName("head")[0];

    const ensureOneTitle = () => {
      const all = head ? head.querySelectorAll("title") : document.querySelectorAll("title");
      let el = all[0];
      if (!el) {
        el = document.createElement("title");
        (head || document.documentElement).appendChild(el);
      }
      for (let i = 1; i < all.length; i++) all[i].remove();
      return el;
    };

    let titleEl = ensureOneTitle();

    titleEl.textContent = desiredTitle;
    document.title = desiredTitle;

    let internal = false;
    const sync = () => {
      if (internal) return;

      if (document.title !== desiredTitle) {
        internal = true;
        document.title = desiredTitle;
        internal = false;
      }
      if (titleEl.textContent !== desiredTitle) {
        internal = true;
        titleEl.textContent = desiredTitle;
        internal = false;
      }
    };

    const titleObserver = new MutationObserver(sync);
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });

    const headObserver = new MutationObserver(() => {
      titleEl = ensureOneTitle();
      sync();
    });
    if (head) headObserver.observe(head, { childList: true, subtree: true });

    return {
      set: (t) => {
        desiredTitle = String(t);
        sync();
      },
      stop: () => {
        titleObserver.disconnect();
        headObserver.disconnect();
      },
    };
  }

  function prettifyFileName(file) {
    return (file || "")
      .replace(/\.html$/i, "")
      .replace(/[._-]+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getShortPageName() {
    const pathname = decodeURIComponent(location.pathname || "/");
    const qs = new URLSearchParams(location.search || "");

    if (pathname === "/" || pathname.endsWith("/index.html")) return "";

    if (pathname.endsWith("/pages/study_materials/study_materials.html")) return "Study Materials";
    if (pathname.endsWith("/pages/chat/global.chat.html")) return "Global Chat";

    if (pathname.endsWith("/pages/study_materials/bridge.html")) {
      const mode = (qs.get("mode") || "").trim();
      if (!mode) return "Bridge";
      const niceMode = mode[0].toUpperCase() + mode.slice(1);
      return `Bridge — ${niceMode}`;
    }

    {
      const m = pathname.match(/\/reading\/test\d+\/pass(\d+)\/.+\.html$/i);
      if (m) return `Pass ${m[1]}`;
    }

    {
      const m = pathname.match(/\/listenings?\/test\d+\/sec(\d+)\/.+\.html$/i);
      if (m) return `Section ${m[1]}`;
    }

    const fileOnly = (pathname.split("/").filter(Boolean).pop() || "").trim();
    return prettifyFileName(fileOnly) || "Page";
  }

  function buildEduventureTitle() {
    const base = "EDUVENTURE";
    const page = getShortPageName();
    return page ? `${base} | ${page}` : base;
  }

  const titleLock = lockDocumentTitle(buildEduventureTitle());

  function refreshTitle() {
    titleLock.set(buildEduventureTitle());
  }

  window.addEventListener("popstate", refreshTitle);
  window.addEventListener("hashchange", refreshTitle);

  const _pushState = history.pushState;
  const _replaceState = history.replaceState;

  history.pushState = function (...args) {
    const r = _pushState.apply(this, args);
    refreshTitle();
    return r;
  };
  history.replaceState = function (...args) {
    const r = _replaceState.apply(this, args);
    refreshTitle();
    return r;
  };

  refreshTitle();

  console.log("%c[EDUVENTURE UI] v2.0 (NO COMMANDS) LOADED", css.green);

  const art = String.raw`
 ███████╗██████╗ ██╗   ██╗██╗   ██╗███████╗███╗   ██╗████████╗██╗   ██╗██████╗ ███████╗
 ██╔════╝██╔══██╗██║   ██║██║   ██║██╔════╝████╗  ██║╚══██╔══╝██║   ██║██╔══██╗██╔════╝
 █████╗  ██║  ██║██║   ██║██║   ██║█████╗  ██╔██╗ ██║   ██║   ██║   ██║██████╔╝█████╗
 ██╔══╝  ██║  ██║██║   ██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║   ██║   ██║   ██║██╔══██╗██╔══╝
 ███████╗██████╔╝╚██████╔╝ ╚████╔╝ ███████╗██║ ╚████║   ██║   ╚██████╔╝██║  ██║███████╗
 ╚══════╝╚═════╝  ╚═════╝   ╚═══╝  ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝
  `.trimEnd();

  const makeKey = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = (n) =>
      Array.from({ length: n }, () => chars[(Math.random() * chars.length) | 0]).join("");
    return `EDU-${seg(4)}-${seg(4)}-${seg(4)}-${seg(4)}`;
  };

  const LICENSE = {
    status: "VALID",
    edition: "Student Terminal",
    key: makeKey(),
    issuedTo: "Local Session",
  };

  console.log(`%c${art}`, css.banner);

  console.log("%cBooting %cEDUVENTURE%c interface…", css.white, css.green, css.white);
  console.log("%cLicense verification… %cOK", css.dim, css.green);

  const W = 66;
  const top = "┌" + "─".repeat(W) + "┐";
  const bot = "└" + "─".repeat(W) + "┘";
  const line = (t = "") => `│ ${String(t).padEnd(W - 1, " ")}│`;

  const card =
    top +
    "\n" +
    line("EDUVENTURE LICENSE") +
    "\n" +
    line("") +
    "\n" +
    line(`Status: ${LICENSE.status}`) +
    "\n" +
    line(`Edition: ${LICENSE.edition}`) +
    "\n" +
    line(`Key: ${LICENSE.key}`) +
    "\n" +
    line(`Issued To: ${LICENSE.issuedTo}`) +
    "\n" +
    line("") +
    "\n" +
    bot;

  console.log(`%c${card}`, css.dim);
})();
(function registerEduventureServiceWorker() {
  "use strict";

  if (window.__EDUVENTURE_SW_REG_DONE) return;
  window.__EDUVENTURE_SW_REG_DONE = true;

  const LOG = true;
  const CHECK_EVERY_MIN = 10;

  const log = (...a) => LOG && console.log("[SW-REG]", ...a);
  const warn = (...a) => LOG && console.warn("[SW-REG]", ...a);

  const isLocalhost =
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "[::1]";

  if (!("serviceWorker" in navigator)) {
    warn("Service workers not supported in this browser.");
    return;
  }

  if (location.protocol !== "https:" && !isLocalhost) {
    warn("SW requires HTTPS (or localhost). Current:", location.protocol);
    return;
  }

  async function findSwUrl() {
    const candidates = [
      "/sw.js",
      "./sw.js",
      "../sw.js",
      "../../sw.js",
      "../../../sw.js",
      "../../../../sw.js",
    ];

    for (const p of candidates) {
      try {
        const url = new URL(p, location.href).toString();
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) {
          return url;
        }
      } catch (_) {}
    }

    return null;
  }

  function computeScopeFromSwUrl(swUrl) {
    try {
      const u = new URL(swUrl);
      const scopePath = u.pathname.replace(/[^/]*$/, "");
      return scopePath || "/";
    } catch {
      return "/";
    }
  }

  async function register() {
    const swUrl = await findSwUrl();
    if (!swUrl) {
      warn(
        "Could not locate sw.js. Make sure sw.js is deployed (ideally at site root: /sw.js)."
      );
      return;
    }

    const scope = computeScopeFromSwUrl(swUrl);

    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope });

      if (reg.waiting) {
        log("Update waiting → telling it to SKIP_WAITING");
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed") {
            if (navigator.serviceWorker.controller) {
              log("New SW installed → SKIP_WAITING");
              sw.postMessage({ type: "SKIP_WAITING" });
            } else {
              log("SW installed for first time.");
            }
          }
        });
      });

      let refreshed = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshed) return;
        refreshed = true;
        log("Controller changed → reloading page once.");
        location.reload();
      });

      if (CHECK_EVERY_MIN > 0) {
        setInterval(() => {
          reg.update().catch(() => {});
        }, CHECK_EVERY_MIN * 60 * 1000);
      }
    } catch (err) {
      warn("Registration failed:", err);
      warn(
        "Common causes: sw.js not at the expected path, wrong MIME type, or hosting config blocks it."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", register);
  } else {
    register();
  }
})();

(() => {
  "use strict";

  if (window.__EDUVENTURE_CHECKER_LOADER__) return;
  window.__EDUVENTURE_CHECKER_LOADER__ = true;

  const CHECKER_SRC = "/script-internet-checker.js";

  const already = [...document.scripts].some(s => (s.src || "").includes(CHECKER_SRC));
  if (already) return;

  const s = document.createElement("script");
  s.src = CHECKER_SRC + (CHECKER_SRC.includes("?") ? "&" : "?") + "v=" + Date.now();
  s.defer = true;

  (document.head || document.documentElement).appendChild(s);
})();

(function initEduventureFocusTrap() {
  "use strict";

  if (window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__) return;
  window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__ = true;

  const ENABLE_LOGS = false;

  const CONFIG = {
    enableArrowNavigation: true,
    enableTabTrap: true,
    enableFocusVisuals: true,
    wrapAroundEdges: true,
    smoothScroll: true,
    arrowTolerance: 5,
    focusColor: '#8B9FFF',
    focusColorRGB: '139, 159, 255',
    shortcuts: {
      home: true,
      end: true,
      escape: true,
    }
  };

  const log = (...args) => ENABLE_LOGS && console.log("[FOCUS-TRAP]", ...args);

  function getFocusableElements() {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
    ].join(',');

    return Array.from(document.querySelectorAll(selector)).filter(el => {
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        getComputedStyle(el).visibility !== 'hidden' &&
        !el.hasAttribute('aria-hidden')
      );
    });
  }

  function handleTabKey(e) {
    if (!CONFIG.enableTabTrap) return;

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (e.shiftKey) {
      if (activeElement === firstElement || !focusableElements.includes(activeElement)) {
        e.preventDefault();
        lastElement.focus();
        log("Shift+Tab: Wrapped to last element");
      }
    } else {
      if (activeElement === lastElement || !focusableElements.includes(activeElement)) {
        e.preventDefault();
        firstElement.focus();
        log("Tab: Wrapped to first element");
      }
    }
  }

  function handleHomeEndKeys(e) {
    if (e.key === 'Home' && CONFIG.shortcuts.home) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        e.preventDefault();
        focusableElements[0].focus();
        log("Home: Jumped to first element");
        if (CONFIG.smoothScroll) {
          focusableElements[0].scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    } else if (e.key === 'End' && CONFIG.shortcuts.end) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        e.preventDefault();
        const lastElement = focusableElements[focusableElements.length - 1];
        lastElement.focus();
        log("End: Jumped to last element");
        if (CONFIG.smoothScroll) {
          lastElement.scrollIntoView({
            behavior: 'smooth',
            block: 'end'
          });
        }
      }
    }
  }

  function handleArrowKeys(e) {
    if (!CONFIG.enableArrowNavigation) return;

    const key = e.key;

    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const activeType = document.activeElement?.type?.toLowerCase();

    const isTextInput =
      activeTag === 'textarea' ||
      document.activeElement?.isContentEditable ||
      (activeTag === 'input' && ['text', 'email', 'password', 'search', 'url', 'tel'].includes(activeType));

    if (isTextInput) {
      return;
    }

    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    e.preventDefault();

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const currentElement = document.activeElement;
    const currentIndex = focusableElements.indexOf(currentElement);

    if (currentIndex === -1) {
      focusableElements[0].focus();
      log(`${key}: Focused first element (nothing was focused)`);
      return;
    }

    const currentRect = currentElement.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestElement = null;
    let bestScore = Infinity;

    focusableElements.forEach(element => {
      if (element === currentElement) return;

      const rect = element.getBoundingClientRect();
      const center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;

      let isInDirection = false;
      let primaryDistance = 0;
      let secondaryDistance = 0;
      const tolerance = CONFIG.arrowTolerance;

      switch (key) {
        case 'ArrowUp':
          isInDirection = dy < -tolerance;
          primaryDistance = Math.abs(dy);
          secondaryDistance = Math.abs(dx);
          break;
        case 'ArrowDown':
          isInDirection = dy > tolerance;
          primaryDistance = Math.abs(dy);
          secondaryDistance = Math.abs(dx);
          break;
        case 'ArrowLeft':
          isInDirection = dx < -tolerance;
          primaryDistance = Math.abs(dx);
          secondaryDistance = Math.abs(dy);
          break;
        case 'ArrowRight':
          isInDirection = dx > tolerance;
          primaryDistance = Math.abs(dx);
          secondaryDistance = Math.abs(dy);
          break;
      }

      if (!isInDirection) return;

      const score = primaryDistance + (secondaryDistance * 0.5);

      if (score < bestScore) {
        bestScore = score;
        bestElement = element;
      }
    });

    if (bestElement) {
      bestElement.focus();
      log(`${key}: Navigated to element at distance ${bestScore.toFixed(1)}px`);

      if (CONFIG.smoothScroll) {
        bestElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    } else if (CONFIG.wrapAroundEdges) {
      let wrapElement = null;

      switch (key) {
        case 'ArrowUp':
          wrapElement = focusableElements.reduce((bottom, el) => {
            const rect = el.getBoundingClientRect();
            const bottomRect = bottom.getBoundingClientRect();
            return rect.top > bottomRect.top ? el : bottom;
          });
          break;
        case 'ArrowDown':
          wrapElement = focusableElements.reduce((top, el) => {
            const rect = el.getBoundingClientRect();
            const topRect = top.getBoundingClientRect();
            return rect.top < topRect.top ? el : top;
          });
          break;
        case 'ArrowLeft':
          wrapElement = focusableElements.reduce((right, el) => {
            const rect = el.getBoundingClientRect();
            const rightRect = right.getBoundingClientRect();
            return rect.left > rightRect.left ? el : right;
          });
          break;
        case 'ArrowRight':
          wrapElement = focusableElements.reduce((left, el) => {
            const rect = el.getBoundingClientRect();
            const leftRect = left.getBoundingClientRect();
            return rect.left < leftRect.left ? el : left;
          });
          break;
      }

      if (wrapElement && wrapElement !== currentElement) {
        wrapElement.focus();
        log(`${key}: Wrapped to opposite edge`);
        if (CONFIG.smoothScroll) {
          wrapElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      } else {
        log(`${key}: No element found in that direction, staying put`);
      }
    } else {
      log(`${key}: No element found in that direction, staying put`);
    }
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape' && CONFIG.shortcuts.escape && document.activeElement) {
      document.activeElement.blur();
      log("Escape: Blurred active element");
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      handleTabKey(e);
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      handleArrowKeys(e);
    }

    if (['Home', 'End'].includes(e.key)) {
      handleHomeEndKeys(e);
    }

    if (e.key === 'Escape') {
      handleEscapeKey(e);
    }
  }

  function handleFocusOut(e) {
    setTimeout(() => {
      if (!document.hasFocus()) {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          log("Focus left document, returned to first element");
        }
      }
    }, 0);
  }

  function init() {
    if (CONFIG.enableFocusVisuals) {
      const style = document.createElement('style');
      style.id = 'eduventure-focus-trap-styles';
      style.textContent = `
        /* EDUVENTURE Focus Trap - Visual Focus Indicators */
        
        /* Enhanced focus ring for keyboard navigation - matches site theme */
        *:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.15) !important;
          transition: outline 0.15s ease, box-shadow 0.15s ease !important;
        }
        
        /* Remove focus ring for mouse clicks (preserve for keyboard only) */
        *:focus:not(:focus-visible) {
          outline: none;
        }
        
        /* Special handling for buttons and interactive elements */
        button:focus-visible, 
        a:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.2) !important;
        }
        
        /* Subtle glow for dark backgrounds */
        .dark *:focus-visible,
        [data-theme="dark"] *:focus-visible,
        header *:focus-visible,
        nav *:focus-visible {
          outline: 2px solid ${CONFIG.focusColor} !important;
          box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.25), 
                      0 0 12px rgba(${CONFIG.focusColorRGB}, 0.4) !important;
        }
        
        /* Smooth focus transitions */
        * {
          scroll-behavior: ${CONFIG.smoothScroll ? 'smooth' : 'auto'};
        }
        
        /* Ensure body is focusable when needed */
        body[tabindex] {
          outline: none;
        }
      `;

      if (!document.getElementById('eduventure-focus-trap-styles')) {
        (document.head || document.documentElement).appendChild(style);
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);

    window.addEventListener('blur', handleFocusOut);

    const ensureFocusable = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        document.body.setAttribute('tabindex', '0');
        log("No focusable elements found, made body focusable");
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', ensureFocusable);
    } else {
      ensureFocusable();
    }

    const observer = new MutationObserver(ensureFocusable);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.EDUVENTURE_FOCUS_TRAP = {
    disable: () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleFocusOut);
      log("Focus trap disabled");
    },
    enable: () => {
      document.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('blur', handleFocusOut);
      log("Focus trap enabled");
    },
    isActive: () => window.__EDUVENTURE_FOCUS_TRAP_ACTIVE__,

    config: CONFIG,

    focusFirst: () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        log("Manually focused first element");
        return true;
      }
      return false;
    },
    focusLast: () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        const lastElement = focusableElements[focusableElements.length - 1];
        lastElement.focus();
        log("Manually focused last element");
        return true;
      }
      return false;
    },
    getFocusableCount: () => getFocusableElements().length,

    setArrowNavigation: (enabled) => {
      CONFIG.enableArrowNavigation = !!enabled;
      log(`Arrow navigation ${enabled ? 'enabled' : 'disabled'}`);
    },
    setTabTrap: (enabled) => {
      CONFIG.enableTabTrap = !!enabled;
      log(`Tab trap ${enabled ? 'enabled' : 'disabled'}`);
    },
    setFocusVisuals: (enabled) => {
      CONFIG.enableFocusVisuals = !!enabled;
      const styleEl = document.getElementById('eduventure-focus-trap-styles');
      if (styleEl) {
        styleEl.disabled = !enabled;
      }
      log(`Focus visuals ${enabled ? 'enabled' : 'disabled'}`);
    },

    setFocusColor: (hexColor, rgbString) => {
      CONFIG.focusColor = hexColor;
      if (rgbString) {
        CONFIG.focusColorRGB = rgbString;
      } else {
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        CONFIG.focusColorRGB = `${r}, ${g}, ${b}`;
      }

      const oldStyle = document.getElementById('eduventure-focus-trap-styles');
      if (oldStyle) {
        oldStyle.remove();
      }

      if (CONFIG.enableFocusVisuals) {
        const style = document.createElement('style');
        style.id = 'eduventure-focus-trap-styles';
        style.textContent = `
          *:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.15) !important;
            transition: outline 0.15s ease, box-shadow 0.15s ease !important;
          }
          *:focus:not(:focus-visible) { outline: none; }
          button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.2) !important;
          }
          .dark *:focus-visible, [data-theme="dark"] *:focus-visible, header *:focus-visible, nav *:focus-visible {
            outline: 2px solid ${CONFIG.focusColor} !important;
            box-shadow: 0 0 0 4px rgba(${CONFIG.focusColorRGB}, 0.25), 0 0 12px rgba(${CONFIG.focusColorRGB}, 0.4) !important;
          }
          * { scroll-behavior: ${CONFIG.smoothScroll ? 'smooth' : 'auto'}; }
          body[tabindex] { outline: none; }
        `;
        (document.head || document.documentElement).appendChild(style);
      }

      log(`Focus color changed to ${hexColor}`);
    }
  };

>>>>>>> 5190efbbfc004e7f2b1521b7378bb9023f978c2c
})();