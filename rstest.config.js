import { defineConfig } from "@rstest/core";
import { SonarReporter } from "rstest-sonar-reporter";

export default defineConfig({
  env: {
    TZ: "Europe/Zurich",
  },
  include: ["__tests__/**/*.js"],
  reporters: [
    'default',
    new SonarReporter({ outputFile: './coverage/sonar-report.xml'}),
  ],
  coverage: {
    reporters: [
      "html",
      "lcovonly",
      ["text", { skipFull: true }],
    ],
  },
});
