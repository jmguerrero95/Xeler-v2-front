export type PaymentMethodCode = "bank" | "cash" | "other" | "breb" | "xcop";
type SemanticPaymentMethod = {
  id: number | string;
  attributes?: { code?: string; slug?: string } | null;
};

const normalize = (value: unknown): string => String(value ?? "").trim().toLowerCase();

export const paymentMethodCode = (method?: SemanticPaymentMethod | null): string =>
  normalize(method?.attributes?.code || method?.attributes?.slug);

export const resolvePaymentMethod = (
  methods: SemanticPaymentMethod[],
  code: PaymentMethodCode,
): SemanticPaymentMethod | undefined => methods.find((method) => paymentMethodCode(method) === code);

export const requirePaymentMethod = (
  methods: SemanticPaymentMethod[],
  code: PaymentMethodCode,
  onMissing?: (message: string) => void,
): SemanticPaymentMethod => {
  const method = resolvePaymentMethod(methods, code);
  if (!method) {
    const message = "No se encontró el tipo de pago requerido. Inténtalo nuevamente más tarde.";
    onMissing?.(message);
    throw new Error(message);
  }
  return method;
};
