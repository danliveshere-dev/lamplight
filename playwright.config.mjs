import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/browser',
  outputDir: './test-results/playwright',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: 'line',
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{projectName}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4317',
    locale: 'en-AU',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node scripts/gate4/static-server.mjs',
    url: 'http://127.0.0.1:4317/test/browser/fixture.html',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', grepInvert: /@local-chrome/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', grepInvert: /@local-chrome/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', grepInvert: /@local-chrome/, use: { ...devices['Desktop Safari'] } },
    { name: 'local-chrome', grep: /@local-chrome/, use: { channel: 'chrome' } },
  ],
});
