import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/views/admin/integrations/crypto/CryptoProvidersView.vue"),
  "utf8",
);
const contracts = readFileSync(
  resolve(process.cwd(), "src/interfaces/Crypto/Crypto.model.ts"),
  "utf8",
);
const labels = readFileSync(
  resolve(process.cwd(), "src/utils/cryptoProviderLabels.ts"),
  "utf8",
);
const template = source.split("<template>")[1] ?? "";

describe("configuracion productiva de proveedores cripto", () => {
  it("cablea URL Express y passphrase sin mostrar previews de secretos", () => {
    expect(source).toContain('express_base_url: account.express_base_url ?? ""');
    expect(source).toContain('wallet_passphrase: ""');
    expect(source).toContain('clear_wallet_passphrase: false');
    expect(source).toContain('state?.has_value ? "Configurada" : "No configurada"');
    expect(source).not.toContain("state.preview");
  });

  it("preserva vacio, reemplaza no vacio y permite clear explicito", () => {
    expect(source).toContain('typeof value === "string" && value.trim() !== ""');
    expect(source).toContain("payload[clearKey] = true");
    expect(contracts).toContain("wallet_passphrase?: string | null");
    expect(contracts).toContain("clear_wallet_passphrase?: boolean");
    expect(contracts).toContain("express_base_url?: string | null");
  });

  it("presenta el panel de Crypto Real completamente en español", () => {
    expect(source).toContain("Entorno de ejecución: Producción");
    expect(source).toContain("Configuración global");
    expect(source).toContain("Configuración por moneda");
    expect(source).toContain("Proveedor:");
    expect(source).toContain("providerBlock.account.label");
    expect(source).toContain("Probar conexión");
    expect(source).not.toContain("Access token");
    expect(source).not.toContain("Webhook secret");
    expect(source).not.toContain("Entorno: Produccion");
    expect(source).not.toContain("El provider");
    expect(source).not.toContain("runtime efectivo");
  });

  it("presenta faltantes con labels seguros y no expone keys internas", () => {
    expect(source).toContain("visibleMissingFieldLabels(missingFields, config)");
    expect(source).toContain("cryptoMissingFieldLabels");
    expect(labels).toContain('"URL pública del webhook"');
    expect(labels).toContain(
      '"Las llamadas externas globales están deshabilitadas."',
    );
    expect(source).not.toContain('missingFields.join(", ")');
    expect(source).not.toContain("CRYPTO_EXTERNAL_CALLS_ENABLED");
    expect(source).not.toContain("{{ providerBlock.account.provider }}");
    expect(template).not.toContain("access_token");
    expect(template).not.toContain("wallet_passphrase");
    expect(template).not.toContain("webhook_secret");
    expect(template).not.toContain("cryptocurrencyapi");
  });
});
