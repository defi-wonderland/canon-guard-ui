type ThemeMode = "light" | "dark";

type ThemeTokens = {
  brand: {
    primary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
    secondary: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
    };
  };
  actionStatus: {
    preApproved: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
      surface: string;
    };
    notPreApproved: {
      main: string;
      light: string;
      dark: string;
      contrast: string;
      surface: string;
    };
  };
  surfaces: {
    primary: string;
    secondary: string;
    elevated: string;
  };
  borders: {
    primary: string;
    secondary: string;
    accent: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    muted: string;
  };
};

// Figma design tokens for Canon Guard header
export const canonHeaderTokens = {
  background: {
    layer0: "#111114",
    layer1: "#24242b",
    layer1Variation: "#202026",
  },
  foreground: {
    accent0: "#f9f9fa",
    accent10: "#b5b5b7",
    accent20: "#858589",
    accent30: "#505057",
    accent40: "#37373e",
    accent50: "#111114",
  },
  brand: {
    green: "#15a43e",
    greenLight: "#149b3a",
  },
  status: {
    red: "#da2828",
    greenTransparent10: "rgba(21, 164, 62, 0.1)",
    greenTransparent50: "rgba(21, 164, 62, 0.5)",
    amber: "#e1ab11",
    amberLight: "rgba(225, 171, 17, 0.5)",
  },
  amber: {
    base: "#e1ab11",
    border: "rgba(225, 171, 17, 0.1)",
    text: "rgba(225, 171, 17, 0.5)",
  },
};

export const safeDesignTokens: Record<ThemeMode, ThemeTokens> & {
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  sizes: {
    sidebar: {
      collapsed: string;
      expanded: string;
    };
    card: {
      minHeight: string;
      borderWidth: string;
      borderRadius: string;
    };
    header: {
      height: string;
    };
    button: {
      height: string;
      borderRadius: string;
    };
  };
  breakpoints: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    tablet: number;
    desktop: number;
  };
  components: {
    actionCard: {
      borderRadius: string;
      padding: string;
      boxShadow: string;
      elevation: string;
    };
    sidebar: {
      transition: string;
      borderRadius: string;
      boxShadow: string;
    };
    chip: {
      fontWeight: number;
      borderRadius: string;
      fontSize: string;
    };
  };
  typography: {
    safeAddress: {
      fontFamily: string;
      fontSize: string;
      letterSpacing: string;
      fontWeight: number;
    };
    cardTitle: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    cardBody: {
      fontSize: string;
      lineHeight: number;
      fontWeight: number;
    };
    sectionTitle: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
    pageTitle: {
      fontSize: string;
      fontWeight: number;
      lineHeight: number;
      letterSpacing: string;
    };
  };
  animations: {
    duration: {
      short: string;
      medium: string;
      long: string;
    };
    easing: {
      easeInOut: string;
      easeOut: string;
      easeIn: string;
    };
  };
} = {
  light: {
    brand: {
      primary: {
        main: "#6366f1", // Indigo
        light: "#a5b4fc",
        dark: "#4338ca",
        contrast: "#ffffff",
      },
      secondary: {
        main: "#8b5cf6", // Purple
        light: "#c4b5fd",
        dark: "#7c3aed",
        contrast: "#ffffff",
      },
    },

    actionStatus: {
      preApproved: {
        main: "#10b981", // Emerald
        light: "#d1fae5",
        dark: "#047857",
        contrast: "#ffffff",
        surface: "#ecfdf5",
      },
      notPreApproved: {
        main: "#ef4444", // Red
        light: "#fecaca",
        dark: "#dc2626",
        contrast: "#ffffff",
        surface: "#fef2f2",
      },
    },

    surfaces: {
      primary: "#ffffff",
      secondary: "#f8fafc",
      elevated: "#ffffff",
    },

    borders: {
      primary: "#e5e7eb",
      secondary: "#f3f4f6",
      accent: "#d1d5db",
    },

    text: {
      primary: "#111827",
      secondary: "#6b7280",
      tertiary: "#9ca3af",
      muted: "#d1d5db",
    },
  },

  dark: {
    brand: {
      primary: {
        main: "#15a43e", // Canon Green
        light: "#149b3a",
        dark: "#0d7a2d",
        contrast: "#ffffff",
      },
      secondary: {
        main: "#15a43e", // Canon Green
        light: "#149b3a",
        dark: "#0d7a2d",
        contrast: "#ffffff",
      },
    },

    actionStatus: {
      preApproved: {
        main: "#15a43e", // Canon Green
        light: "#149b3a",
        dark: "#0d7a2d",
        contrast: "#ffffff",
        surface: "#111114",
      },
      notPreApproved: {
        main: "#ef4444", // Red
        light: "#fecaca",
        dark: "#dc2626",
        contrast: "#ffffff",
        surface: "#111114",
      },
    },

    surfaces: {
      primary: "#24242b", // layer-1 (header/cards)
      secondary: "#111114", // layer-0 (page background)
      elevated: "#24242b", // layer-1
    },

    borders: {
      primary: "#505057", // accent-30
      secondary: "#24242b", // layer-1
      accent: "#858589", // accent-20
    },

    text: {
      primary: "#f9f9fa", // accent-0
      secondary: "#b5b5b7", // accent-10
      tertiary: "#858589", // accent-20
      muted: "#505057", // accent-30
    },
  },

  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    xxl: "3rem", // 48px
  },

  sizes: {
    sidebar: {
      collapsed: "64px",
      expanded: "280px",
    },
    card: {
      minHeight: "140px",
      borderWidth: "1px",
      borderRadius: "16px",
    },
    header: {
      height: "72px",
    },
    button: {
      height: "44px",
      borderRadius: "12px",
    },
  },

  breakpoints: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
    tablet: 768,
    desktop: 1024,
  },

  components: {
    actionCard: {
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      elevation: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    sidebar: {
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      borderRadius: "0",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    chip: {
      fontWeight: 500,
      borderRadius: "12px",
      fontSize: "0.875rem",
    },
  },

  typography: {
    safeAddress: {
      fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
      fontSize: "0.875rem",
      letterSpacing: "0.025em",
      fontWeight: 500,
    },
    cardTitle: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: "-0.025em",
    },
    cardBody: {
      fontSize: "0.875rem",
      lineHeight: 1.6,
      fontWeight: 400,
    },
    sectionTitle: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.025em",
    },
    pageTitle: {
      fontSize: "2.25rem",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.025em",
    },
  },

  animations: {
    duration: {
      short: "0.2s",
      medium: "0.3s",
      long: "0.5s",
    },
    easing: {
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      easeOut: "cubic-bezier(0.0, 0, 0.2, 1)",
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    },
  },
} as const;
