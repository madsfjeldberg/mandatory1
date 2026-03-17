import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: './tests/e2e/results/playwright-report', open: "on-failure" }], // for the developer to manually investigate failures after a run
    ['junit', { outputFile: './tests/e2e/results/junit.xml' }],                              // for CI to parse and display in the build results
    ['list'],                                                                                // like console.log prints results to terminal
  ],
  outputDir: './tests/e2e/results/artifacts', // traces, screenshots, videos

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    //code  },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npx serve .',
      cwd: './frontend',              // tells Playwright which directory to run the command in
      url: 'http://localhost:3000',
      reuseExistingServer: false,     // always start a new server instance, to ensure a clean state for each test run
                          // true would reuse an existing server if found, which can be convenient during development to avoid waiting for the server to start
    },
    {
      command: 'docker compose up',
      cwd: './backend',
      wait: {
        stdout: /api-1  \| fake_info server running on port 3000/i  // wait for this log message to appear in the Docker container's output, indicating that the server is ready to accept requests
      },
      url: 'http://localhost:8080/cpr', // health check endpoint to verify the server is up and running.
                                        // since there are no dedicated health check endpoints in the provided backend, we can use the existing /cpr endpoint as a health check.
      reuseExistingServer: true,        // by setting this to true playwright will check if the server is already running before starting a new one, which can save time during development. In CI, it will always start a new instance to ensure a clean state.
      timeout: 120 * 1000, // wait up to 2 minutes for Docker to be ready
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ]
});
