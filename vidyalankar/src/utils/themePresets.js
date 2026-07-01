/**
 * Predefined Theme Presets
 * Collection of 12 carefully designed color themes for institutions
 */

export const themePresets = [
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    description: 'Professional blue theme - trustworthy and calm',
    colors: {
      primaryColor: '#2563eb',
      secondaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      headerBgColor: '#1e40af',
      sidebarBgColor: '#eff6ff'
    }
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural green theme - growth and harmony',
    colors: {
      primaryColor: '#059669',
      secondaryColor: '#10b981',
      accentColor: '#34d399',
      headerBgColor: '#047857',
      sidebarBgColor: '#ecfdf5'
    }
  },
  {
    id: 'sunset-orange',
    name: 'Sunset Orange',
    description: 'Warm orange theme - energetic and friendly',
    colors: {
      primaryColor: '#ea580c',
      secondaryColor: '#f97316',
      accentColor: '#fb923c',
      headerBgColor: '#c2410c',
      sidebarBgColor: '#fff7ed'
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Elegant purple theme - creative and sophisticated',
    colors: {
      primaryColor: '#7c3aed',
      secondaryColor: '#8b5cf6',
      accentColor: '#a78bfa',
      headerBgColor: '#6d28d9',
      sidebarBgColor: '#faf5ff'
    }
  },
  {
    id: 'crimson-red',
    name: 'Crimson Red',
    description: 'Bold red theme - passionate and strong',
    colors: {
      primaryColor: '#dc2626',
      secondaryColor: '#ef4444',
      accentColor: '#f87171',
      headerBgColor: '#b91c1c',
      sidebarBgColor: '#fef2f2'
    }
  },
  {
    id: 'teal-aqua',
    name: 'Teal Aqua',
    description: 'Modern teal theme - balanced and refreshing',
    colors: {
      primaryColor: '#0d9488',
      secondaryColor: '#14b8a6',
      accentColor: '#2dd4bf',
      headerBgColor: '#0f766e',
      sidebarBgColor: '#f0fdfa'
    }
  },
  {
    id: 'midnight-indigo',
    name: 'Midnight Indigo',
    description: 'Deep indigo theme - professional and modern',
    colors: {
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#818cf8',
      headerBgColor: '#4338ca',
      sidebarBgColor: '#eef2ff'
    }
  },
  {
    id: 'amber-gold',
    name: 'Amber Gold',
    description: 'Warm amber theme - optimistic and welcoming',
    colors: {
      primaryColor: '#d97706',
      secondaryColor: '#f59e0b',
      accentColor: '#fbbf24',
      headerBgColor: '#b45309',
      sidebarBgColor: '#fffbeb'
    }
  },
  {
    id: 'slate-gray',
    name: 'Slate Gray',
    description: 'Neutral gray theme - clean and minimalist',
    colors: {
      primaryColor: '#475569',
      secondaryColor: '#64748b',
      accentColor: '#94a3b8',
      headerBgColor: '#334155',
      sidebarBgColor: '#f8fafc'
    }
  },
  {
    id: 'rose-pink',
    name: 'Rose Pink',
    description: 'Soft pink theme - approachable and warm',
    colors: {
      primaryColor: '#e11d48',
      secondaryColor: '#f43f5e',
      accentColor: '#fb7185',
      headerBgColor: '#be123c',
      sidebarBgColor: '#fff1f2'
    }
  },
  {
    id: 'emerald-jade',
    name: 'Emerald Jade',
    description: 'Rich emerald theme - prosperity and balance',
    colors: {
      primaryColor: '#047857',
      secondaryColor: '#059669',
      accentColor: '#10b981',
      headerBgColor: '#065f46',
      sidebarBgColor: '#d1fae5'
    }
  },
  {
    id: 'sky-cyan',
    name: 'Sky Cyan',
    description: 'Bright cyan theme - clear and inspiring',
    colors: {
      primaryColor: '#0284c7',
      secondaryColor: '#0ea5e9',
      accentColor: '#38bdf8',
      headerBgColor: '#0369a1',
      sidebarBgColor: '#f0f9ff'
    }
  }
];

/**
 * Get theme preset by ID
 */
export const getThemeById = (id) => {
  return themePresets.find(theme => theme.id === id);
};

/**
 * Get all theme names for dropdown
 */
export const getThemeNames = () => {
  return themePresets.map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description
  }));
};

export default themePresets;
