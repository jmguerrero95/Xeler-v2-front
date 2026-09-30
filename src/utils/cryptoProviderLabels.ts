type CryptoFieldLabel = {
  key: string;
  label: string;
};

const PROVIDER_LABELS: Record<string, string> = {
  bitgo: "BitGo",
  cryptocurrencyapi: "CryptocurrencyAPI",
};

const DISABLED_REASON_LABELS: Record<string, string> = {
  issuer_network_deprecated:
    "La red configurada para este activo fue descontinuada por su emisor.",
  external_calls_disabled: "Las llamadas externas están deshabilitadas.",
  global_external_calls_disabled:
    "Las llamadas externas globales están deshabilitadas.",
  payouts_disabled: "Los pagos externos están deshabilitados.",
  missing_required_fields: "Faltan datos obligatorios de configuración.",
  provider_disabled: "El proveedor está deshabilitado.",
  circuit_open:
    "El proveedor está temporalmente bloqueado por protección operativa.",
  bitgo_circuit_open:
    "BitGo está temporalmente bloqueado por protección operativa.",
  bitgo_express_not_configured: "Falta configurar la conexión con BitGo Express.",
  bitgo_express_invalid_url: "La dirección configurada para BitGo Express no es válida.",
  bitgo_express_insecure_transport:
    "La conexión con BitGo Express debe utilizar transporte seguro.",
  provider_health_check_failed: "No fue posible comprobar el estado del proveedor.",
  bitgo_webhook_registration_unverified:
    "El registro remoto de las notificaciones de BitGo no ha sido verificado.",
  bitgo_required_webhooks_missing:
    "Faltan notificaciones obligatorias de BitGo para esta billetera.",
  bitgo_required_webhooks_mismatch:
    "La configuración remota de notificaciones de BitGo requiere revisión.",
};

const FIELD_LABELS: Record<string, string> = {
  access_token: "Token de acceso",
  api_key: "Clave de API",
  wallet_id: "ID de la billetera",
  wallet_passphrase: "Frase secreta de la billetera",
  webhook_secret: "Secreto del webhook",
  express_base_url: "URL de BitGo Express",
  public_webhook_base_url: "URL pública del webhook",
  public_webhook_base_url_https: "URL HTTPS pública del webhook",
  provider_base_url_https: "URL HTTPS del proveedor",
  webhook_url: "URL del webhook",
  webhook_url_https: "URL HTTPS del webhook",
  token_contract: "Contrato del token",
  incoming_verification: "Verificación de depósitos entrantes",
};

export const cryptoProviderLabel = (provider: unknown): string => {
  const key = String(provider ?? "").trim().toLowerCase();
  return PROVIDER_LABELS[key] ?? "Proveedor configurado";
};

export const cryptoDisabledReasonLabel = (reason: unknown): string | null => {
  const key = String(reason ?? "").trim().toLowerCase();
  if (!key) return null;
  return (
    DISABLED_REASON_LABELS[key] ??
    "La integración requiere revisión de su configuración operativa."
  );
};

export const cryptoMissingFieldLabels = (
  fields: unknown,
  schemaFields: CryptoFieldLabel[] = [],
): string[] => {
  if (!Array.isArray(fields)) return [];
  const schemaLabels = new Map(
    schemaFields.map((field) => [field.key, field.label]),
  );

  return [
    ...new Set(
      fields.map((field) => {
        const key = typeof field === "string" ? field : "";
        return schemaLabels.get(key) ?? FIELD_LABELS[key] ?? "Dato obligatorio";
      }),
    ),
  ];
};
