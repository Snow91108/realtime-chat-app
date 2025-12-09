import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // you can add plugins here
    },
  },
});
