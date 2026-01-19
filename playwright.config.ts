import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  testDir: './tests',

  // Test execution settings
  fullyParallel: true, // Enable parallel execution (Walletless supports it!)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined, // Increased from 1 (Synpress limitation removed)

  // Reporting
  reporter: process.env.CI ? 'github' : 'html',

  // Test settings
  timeout: 60000, // 60 second timeout per test

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // No need for special browser flags with Walletless
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional: Add more browsers (Walletless supports all of them)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // Start services before running tests
  webServer: [
    // 1. Start Anvil fork of Optimism
    {
      command: 'pnpm test:fork:op',
      url: 'http://127.0.0.1:8545',
      reuseExistingServer: !process.env.CI,
      timeout: 120000, // 2 minutes for fork to initialize
      stdout: 'pipe',
      stderr: 'pipe',
    },
    // 2. Start the application dev server
    {
      command: 'pnpm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        VITE_PUBLIC_IS_PLAYWRIGHT: 'true', // Enable E2E wallet
        RPC_URL_TESTING: 'http://127.0.0.1:8545',
      },
    },
  ],
});
