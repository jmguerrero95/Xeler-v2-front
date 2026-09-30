import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("flujo seguro de cambio de correo", () => {
  for (const relative of [
    "src/views/user/Profile/ValidationEmail/ValidationEmail.vue",
    "src/views/admin/profile/ValidationEmail/ValidationEmail.vue",
  ]) {
    it(`${relative} usa identidad pendiente y confirmación`, () => {
      const source = readFileSync(resolve(process.cwd(), relative), "utf8");
      expect(source).toContain('identity/email/change"');
      expect(source).toContain('identity/email/change/confirm"');
      expect(source).toContain("current_password");
      expect(source).not.toContain('const url = "users/update/profile"');
    });
  }
});
