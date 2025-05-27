// @ts-check

import { defineConfig } from "@ilyasemenov/eslint-config";
import { SemicolonPreference } from "typescript";
export default defineConfig({
  settings: {
    SemicolonPreference: SemicolonPreference.Remove,
  },
});
