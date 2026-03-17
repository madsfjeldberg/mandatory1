import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // We disable this rule because eslint is angy about fetch, document and setTimeout, which are all used in the frontend code. 
    // We could have split the config into two, but this is easier.
    rules: {
      "no-undef": "off",
    },
  },
);
