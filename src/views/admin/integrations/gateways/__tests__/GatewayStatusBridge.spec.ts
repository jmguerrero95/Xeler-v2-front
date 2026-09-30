// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  gatewayActionLabel,
  gatewayCircuitLabel,
  gatewayDriverLabel,
  gatewayOperationalLabel,
  gatewayProviderLabel,
} from "@/utils/internationalAccountsLabels";
import gatewaySource from "@/views/admin/integrations/gateways/GatewayStatusView.vue?raw";

describe("Estado Gateway Bridge", () => {
  it("distinguishes disabled, unconfigured and available states in Spanish", () => {
    expect(gatewayOperationalLabel("disabled")).toBe("Deshabilitado");
    expect(gatewayOperationalLabel("not_configured")).toBe("No configurado");
    expect(gatewayOperationalLabel("available")).toBe("Sin fallos detectados");
    expect(gatewayOperationalLabel("simulated")).toBe("Proveedor simulado");
  });

  it("translates provider actions, driver and circuit states", () => {
    expect(gatewayProviderLabel("bridge")).toBe("Bridge");
    expect(gatewayActionLabel("customer_create")).toBe("Crear cliente Bridge");
    expect(gatewayCircuitLabel("half_open")).toBe(
      "Prueba de recuperaci\u00f3n",
    );
    expect(gatewayDriverLabel("bridge")).toBe("Bridge - producci\u00f3n");
    expect(gatewayDriverLabel(null)).toBe("No aplica");
    expect(gatewaySource).toMatch(/No confirma\s+disponibilidad remota/);
    expect(gatewaySource).toContain("Integraci&oacute;n");
    expect(gatewaySource).not.toContain("Gateway Status");
    expect(gatewaySource).not.toContain("Healthy");
  });
});
