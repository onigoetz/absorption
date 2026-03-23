import { defineConfig } from "@rstest/core";

export default defineConfig({
  env: {
    TZ: "Europe/Zurich",
  },
  include: ["__tests__/**/*.js"],
  coverage: {
    reporters: [
      "html",
      "lcovonly",
      ["text", { skipFull: true }],
    ],
  },
});
