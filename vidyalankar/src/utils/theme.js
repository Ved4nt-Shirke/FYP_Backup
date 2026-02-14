// Theme utilities: apply per-institution palette via CSS variables
import axios from "../utils/axiosConfig";

const VAR_MAP = (palette) => {
  const p = palette?.colors || {};

  // Basic hex -> rgb helpers to derive shades when palette doesn't provide them
  const toRgb = (hex) => {
    try {
      const h = hex.replace("#", "");
      const bigint = parseInt(
        h.length === 3
          ? h
              .split("")
              .map((c) => c + c)
              .join("")
          : h,
        16,
      );
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
      };
    } catch {
      return { r: 16, g: 185, b: 129 };
    }
  };
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const mix = (hex, targetHex, amount) => {
    const a = toRgb(hex),
      b = toRgb(targetHex);
    const t = Math.max(0, Math.min(1, amount));
    const r = clamp(a.r * (1 - t) + b.r * t);
    const g = clamp(a.g * (1 - t) + b.g * t);
    const b2 = clamp(a.b * (1 - t) + b.b * t);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b2).toString(16).slice(1)}`;
  };
  const lighten = (hex, amt = 0.85) => mix(hex, "#ffffff", amt);
  const darken = (hex, amt = 0.2) => mix(hex, "#000000", amt);

  // If primary is missing, use accent or danger as the chosen brand color
  const basePrimary = p.primary || p.accent || p.danger || "#10b981";
  const primaryLight = p.primaryLight || lighten(basePrimary, 0.92);
  const primaryDark = p.primaryDark || darken(basePrimary, 0.2);
  const background = p.background || "#f9fafb";
  const surface = p.surface || "#ffffff";
  const border = p.border || "#e5e7eb";
  const text = p.text || "#111827";
  const textMuted = p.textMuted || "#6b7280";
  const accent = p.accent || basePrimary;

  return {
    "--dash-bg": background,
    "--card-bg": surface,
    "--card-border": border,
    "--text-primary": text,
    "--text-secondary": textMuted,
    "--primary-color": basePrimary,
    "--primary-light": primaryLight,
    "--yellow-accent": accent,
    // Existing app-wide variables used in headers/buttons
    "--app-header-bg": basePrimary,
    "--primary-accent": basePrimary,
    "--primary-accent-dark": primaryDark,
    "--primary-accent-light": primaryLight,
    // AdminSidebar token aliases – map to palette for instant theming
    "--color-primary": basePrimary,
    "--color-primary-hover": primaryDark,
    "--color-primary-active": primaryDark,
    "--color-background": background,
    "--color-surface": surface,
    "--color-text": text,
    "--color-text-secondary": textMuted,
    "--color-border": border,
    // AdminHeader accents
    "--accent-green": basePrimary,
    // Legacy tokens used across Admin CSS
    "--primary": basePrimary,
    "--primary-hover": primaryDark,
    "--primary-light": primaryLight,
    "--bg-color": background,
    "--card-bg": surface,
    "--text-main": text,
    "--text-muted": textMuted,
    "--border-color": border,
    "--danger": accent,
    "--warning": accent,
    "--success": basePrimary,
    "--success-color": basePrimary,
    "--warning-color": accent,
    "--danger-color": accent,
    "--text-color-primary": text,
    "--text-color-secondary": textMuted,
    "--text-color-muted": textMuted,
    "--border-color-light": border,
    "--secondary-accent": text,
    "--color-btn-primary-text": surface,
    "--text-on-primary": "#ffffff",
    "--text-on-accent": "#ffffff",
    "--text-on-surface": text,
    "--text-on-bg": text,
  };
};

export const applyPalette = (palette) => {
  const vars = VAR_MAP(palette);
  console.log("[THEME] Applying palette:", palette?.name || "unknown");
  const targets = [document.documentElement, document.body];
  targets.forEach((el) => {
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
  });
};

export const clearAppliedPalette = () => {
  const root = document.body;
  const keys = [
    "--dash-bg",
    "--card-bg",
    "--card-border",
    "--text-primary",
    "--text-secondary",
    "--primary-color",
    "--primary-light",
    "--yellow-accent",
    "--app-header-bg",
    "--primary-accent",
    "--primary-accent-dark",
  ];
  keys.forEach((k) => root.style.removeProperty(k));
};

// Fetch and apply admin theme; caches by college in localStorage
export const loadAndApplyAdminTheme = async (college) => {
  try {
    const cacheKey = `palette:${college}`;

    console.log("[THEME] Loading admin theme for college:", college);
    // Always fetch fresh first so admins see latest palette after superadmin changes
    const resp = await axios.get("/admin/theme");
    if (resp?.data?.success && resp.data.institution?.palette) {
      const palette = resp.data.institution.palette;
      console.log("[THEME] Fetched palette from API:", palette);
      localStorage.setItem(cacheKey, JSON.stringify(palette));
      applyPalette(palette);
      console.log("[THEME] Applied palette. Check CSS variables in DevTools.");
      _lastAppliedHash = hashPalette(palette);
      return palette;
    }

    // Fallback to cache if API fails
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const palette = JSON.parse(cached);
      console.log("[THEME] Using cached palette:", palette);
      applyPalette(palette);
      _lastAppliedHash = hashPalette(palette);
      return palette;
    }
    console.warn("[THEME] No palette found in API or cache");
  } catch (e) {
    console.error("[THEME] Failed to load admin theme:", e);
  }
  return null;
};

let _autoRefreshAttached = false;
let _lastAppliedHash = "";

const hashPalette = (p) => {
  try {
    const s = JSON.stringify(p || {});
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return String(h);
  } catch {
    return "";
  }
};

export const attachAdminThemeAutoRefresh = (college) => {
  // Allow multiple attachments for different roles
  const refresh = async () => {
    const resp = await axios.get("/admin/theme").catch(() => null);
    const pal = resp?.data?.institution?.palette;
    const h = hashPalette(pal);
    if (h && h !== _lastAppliedHash) {
      _lastAppliedHash = h;
      localStorage.setItem(`palette:${college}`, JSON.stringify(pal));
      applyPalette(pal);
    }
  };

  // Update on tab focus and on a short interval
  window.addEventListener("focus", refresh);
  const id = setInterval(refresh, 60000);
  // Store id if we want to clear later
  window.__ADMIN_THEME_INTERVAL__ = id;
};
