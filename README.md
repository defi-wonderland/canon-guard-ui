# 🏦 Canon Guard

This is a web application for managing Canon Guards, built using Vite and React with a focus on web3 technologies. It integrates several powerful libraries and tools to streamline development.

## Features

- [Material-UI (MUI)](https://mui.com/material-ui/getting-started/): A popular React UI framework for building responsive and accessible web applications.
- [Dark/Light Mode](https://mui.com/material-ui/customization/dark-mode/): Easily switch between dark and light themes for better user experience.
- [React Router](https://reactrouter.com/start/library/routing): A library for routing and navigation in web applications.
- [RainbowKit](https://www.rainbowkit.com/es-419/docs/installation): Integrated for wallet connection and management in web3 applications.
- [Wagmi](https://wagmi.sh/react/getting-started): A React Hooks library for web3 applications (EVM chains), making it easier to interact with smart contracts.
- [Viem](https://viem.sh/docs/getting-started): A library for building web3 applications (EVM chains) with a focus on performance and usability.

## Getting Started

To get started with this project, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone git@github.com:defi-wonderland/canon-guard-ui.git
   ```

2. **Navigate into the project directory**:

   ```bash
   cd canon-guard-ui
   ```

3. **Install dependencies** using pnpm:

   ```bash
   pnpm install
   ```

4. **Run the development server**:
   ```bash
   pnpm run dev
   ```
   This will start the application at `http://localhost:3000`.

## Environment Variables

To run the project, you need to create a `.env` file in the root directory with the following variables:

```bash
VITE_PUBLIC_PROJECT_ID=your_project_id # ProjectID from WalletConnect
VITE_PUBLIC_ALCHEMY_KEY=your_alchemy_key # API key from Alchemy
```

## Running Tests

To run the tests for this project, you can use the following commands:

- **Run all tests** (both unit and end-to-end):

  ```bash
  pnpm run test
  ```

- **Run unit tests** using Vitest:

  ```bash
  pnpm run test:unit
  ```

- **Run end-to-end tests** using Playwright:
  ```bash
  pnpm run test:e2e
  ```

### Test Setup

Before running the end-to-end tests, you need to complete the following setup steps:

1. **Configure environment variables**: Add the following testing variables to your `.env` file:

   ```bash
   SEED_PHRASE=your_test_wallet_seed_phrase
   PASSWORD=your_test_wallet_password
   PUBLIC_RPC_URL=your_rpc_url
   IS_PLAYWRIGHT='true'
   ```

2. **Generate test wallet**: Run Synpress to generate the wallet needed for testing:

   ```bash
   npx synpress
   ```

   This command will set up the necessary wallet configuration for your end-to-end tests.

3. **Run the tests**: After completing the setup, you can run the end-to-end tests using:
   ```bash
   pnpm run test:e2e
   ```

## Theme Customization

### Modifying Default Colors

To customize the default palette (error, warning, success, info), uncomment and modify the palette object in `src/config/themes/theme.ts`:

```typescript
const palette = {
   error: {
     main: '#BA6B5D',    // Main error color
     light: '#ECCCC6',   // Light variant
     dark: '#824A41',    // Dark variant
   },
   warning: { ... },
   success: { ... },
   info: { ... },
};
```

### Adding New Theme Variables

To extend the theme with new variables, declare them in `src/types/theme.ts` using the Material-UI module augmentation:

```typescript
declare module "@mui/material/styles" {
  interface Palette {
    // Add new palette property
    myNewColor: {
      primary: string;
    };
  }

  // Add new theme property
  interface Theme {
    myNewProperty: {
      value: string;
    };
  }
}
```

### Using Theme Attributes with Styled Components

You can access theme properties in your styled components using the theme prop. Here are some examples:

```typescript
import { styled } from "@mui/material/styles";

// Using background colors
const StyledContainer = styled("div")(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: "1rem",
}));

// Using border radius
const RoundedBox = styled("div")(({ theme }) => ({
  borderRadius: theme.borderRadius.default,
  border: theme.palette.border,
}));

// Using typography
const StyledText = styled("p")(({ theme }) => ({
  color: theme.palette.text.primary,
  fontFamily: theme.typography.fontFamily,
}));

// Using custom theme properties
const TitleText = styled("h1")(({ theme }) => ({
  color: theme.palette.title.primary,
}));
```

These styled components will automatically adapt to theme changes (light/dark mode).

Created by [Wonderland](https://defi.sucks).
