import { createTheme } from "@mui/material";
import { CustomMuiTheme } from "~/types";
import { safeDesignTokens } from "./safeTheme";

export const getMuiThemeConfig = (customTheme: CustomMuiTheme) => {
  return createTheme({
    palette: customTheme.light,
    typography: customTheme.typography,
    colorSchemes: {
      light: {
        palette: {
          ...customTheme.light,
        },
      },
      dark: {
        palette: {
          ...customTheme.dark,
        },
      },
    },
    borderRadius: customTheme.borderRadius,
    cssVariables: {
      colorSchemeSelector: "class",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: safeDesignTokens.sizes.button.borderRadius,
            fontWeight: 500,
            textTransform: "none",
            height: safeDesignTokens.sizes.button.height,
          },
        },
        variants: [
          {
            props: { variant: "contained", size: "small" },
            style: ({ theme }) => ({
              marginTop: safeDesignTokens.spacing.sm,
              width: "100%",
              [theme.breakpoints.up("sm")]: {
                width: "auto",
              },
            }),
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: safeDesignTokens.sizes.card.borderRadius,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            ...safeDesignTokens.components.chip,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: safeDesignTokens.sizes.button.borderRadius,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiOutlinedInput-root": {
              borderRadius: safeDesignTokens.sizes.button.borderRadius,
              backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.secondary,
              "& fieldset": {
                borderColor: safeDesignTokens[theme.palette.mode].borders.primary,
              },
              "&:hover fieldset": {
                borderColor: safeDesignTokens[theme.palette.mode].brand.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: safeDesignTokens[theme.palette.mode].brand.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: theme.palette.text.secondary,
              "&.Mui-focused": {
                color: safeDesignTokens[theme.palette.mode].brand.primary.main,
              },
            },
          }),
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: safeDesignTokens.sizes.button.borderRadius,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 0,
            boxSizing: "border-box",
            transition: "width 0.2s",
            backgroundColor: safeDesignTokens[theme.palette.mode].surfaces.primary,
          }),
          paperAnchorLeft: ({ theme }) => ({
            borderRight: `1px solid ${safeDesignTokens[theme.palette.mode].borders.primary}`,
          }),
        },
      },
      MuiModal: {
        styleOverrides: {
          root: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
          },
        },
      },
    },
  });
};
