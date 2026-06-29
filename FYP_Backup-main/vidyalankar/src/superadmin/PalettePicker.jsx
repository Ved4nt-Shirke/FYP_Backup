import React from "react";

// Monochrome-first palettes (primary hue + shades of same hue)
const PRESETS = [
  // Blues
  {
    name: "blue",
    colors: {
      primary: "#2563eb", // blue-600
      primaryLight: "#eff6ff", // blue-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#1d4ed8", // blue-700
    },
  },
  {
    name: "navy",
    colors: {
      primary: "#1e3a8a", // blue-800
      primaryLight: "#dbeafe", // blue-100
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#1e40af", // blue-900
    },
  },
  {
    name: "indigo",
    colors: {
      primary: "#6366f1", // indigo-500
      primaryLight: "#eef2ff", // indigo-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#4f46e5", // indigo-600
    },
  },
  {
    name: "sky",
    colors: {
      primary: "#0ea5e9", // sky-500
      primaryLight: "#f0f9ff", // sky-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#0284c7", // sky-600
    },
  },
  {
    name: "cyan",
    colors: {
      primary: "#06b6d4", // cyan-500
      primaryLight: "#ecfeff", // cyan-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#0891b2", // cyan-600
    },
  },

  // Greens
  {
    name: "emerald",
    colors: {
      primary: "#10b981", // emerald-500
      primaryLight: "#ecfdf3", // emerald-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#059669", // emerald-600
    },
  },
  {
    name: "forest",
    colors: {
      primary: "#166534", // green-700
      primaryLight: "#dcfce7", // green-100
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#4b5563",
      accent: "#15803d", // green-600
    },
  },
  {
    name: "teal",
    colors: {
      primary: "#14b8a6", // teal-500
      primaryLight: "#f0fdfa", // teal-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#0d9488", // teal-600
    },
  },

  // Warm hues (monochrome)
  {
    name: "amber",
    colors: {
      primary: "#f59e0b", // amber-500
      primaryLight: "#fffbeb", // amber-50
      background: "#fffdf7",
      surface: "#ffffff",
      border: "#f3e8ff", // light neutral border
      text: "#1f2937",
      textMuted: "#6b7280",
      accent: "#d97706", // amber-600
    },
  },
  {
    name: "orange",
    colors: {
      primary: "#f97316", // orange-500
      primaryLight: "#fff7ed", // orange-50
      background: "#fffaf5",
      surface: "#ffffff",
      border: "#fed7aa", // subtle orange tint
      text: "#1f2937",
      textMuted: "#6b7280",
      accent: "#ea580c", // orange-600
    },
  },
  {
    name: "red",
    colors: {
      primary: "#ef4444", // red-500
      primaryLight: "#fef2f2", // red-50
      background: "#fff8f8",
      surface: "#ffffff",
      border: "#fee2e2",
      text: "#1f2937",
      textMuted: "#6b7280",
      accent: "#dc2626", // red-600
    },
  },

  // Neutrals / Slate
  {
    name: "slate",
    colors: {
      primary: "#334155", // slate-700
      primaryLight: "#f1f5f9", // slate-50
      background: "#f8fafc",
      surface: "#ffffff",
      border: "#e2e8f0",
      text: "#0f172a",
      textMuted: "#64748b",
      accent: "#1f2937", // slate-800
    },
  },
];

export const DEFAULT_PALETTE = PRESETS[0]; // blue by default

export default function PalettePicker({ value, onChange }) {
  const selected = value?.name || DEFAULT_PALETTE.name;

  return (
    <div style={{ marginBottom: 20 }}>
      <label
        className="form-label"
        style={{ fontSize: "0.95rem", fontWeight: 700 }}
      >
        Select Color Palette
      </label>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 12,
        }}
      >
        {PRESETS.map((p) => (
          <button
            type="button"
            key={p.name}
            onClick={() => {
              if (onChange) onChange(p);
            }}
            style={{
              textAlign: "left",
              border:
                selected === p.name
                  ? `3px solid ${p.colors.primary}`
                  : "2px solid #e5e7eb",
              borderRadius: 10,
              padding: 14,
              background: "#fff",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow:
                selected === p.name
                  ? `0 0 0 4px rgba(45,106,79,0.1)`
                  : "0 2px 4px rgba(0,0,0,0.05)",
            }}
            onMouseEnter={(e) => {
              if (selected !== p.name) {
                e.currentTarget.style.borderColor = p.colors.primary;
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (selected !== p.name) {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
              }
            }}
            aria-pressed={selected === p.name}
            aria-label={`Select ${p.name} palette`}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                color: p.colors.text,
                fontSize: "0.95rem",
              }}
            >
              {p.name.toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {Object.entries(p.colors)
                .slice(0, 6)
                .map(([k, v]) => (
                  <span
                    key={k}
                    title={k}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: 3,
                      background: v,
                      border: "1px solid #ccc",
                    }}
                  />
                ))}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: "0.8rem",
                color: p.colors.textMuted,
              }}
            >
              {p.colors.primary}
            </div>
          </button>
        ))}
      </div>
      <div
        style={{ fontSize: "0.8rem", color: "#6b7280", fontStyle: "italic" }}
      >
        Click to select a palette
      </div>
    </div>
  );
}
