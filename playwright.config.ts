import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
export default defineConfig({
  testDir: './tests', fullyParallel: true, workers: 2, timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4322', viewport: { width: 1440, height: 1000 },
    headless: true, reducedMotion: 'reduce', launchOptions: { executablePath, args: ['--no-sandbox'] },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run preview -- --port 4322 --ignore-lock', url: 'http://127.0.0.1:4322', reuseExistingServer: !process.env.CI, timeout: 30000 },
});
