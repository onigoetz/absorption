import { defineConfig } from "@rstest/core";

export default defineConfig({
  env: {
    TZ: "Europe/Zurich",
  },
  include: ["__tests__/**/*.js"],
  reporters: [
    'default',
    ['junit', { outputPath: './coverage/TEST-rstest.xml' }]
  ],
  coverage: {
    reporters: [
      "html",
      "lcovonly",
      ["text", { skipFull: true }],
    ],
  },
});
