import pluginVue from "eslint-plugin-vue";
import prettier from "@vue/eslint-config-prettier";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  prettier,
  {
    rules: {
      "prettier/prettier": ["error", { endOfLine: "auto" }],
    },
  }
);
