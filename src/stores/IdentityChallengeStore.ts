import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type IdentityPurpose =
  | "email_verification"
  | "phone_verification"
  | "password_reset";

export interface IdentityChallengePayload {
  challenge_reference: string;
  purpose?: IdentityPurpose;
  channel?: "email" | "sms" | "whatsapp";
  expires_in: number;
  resend_available_in: number;
  delivery_status: string;
  masked_destination?: string;
}

interface PasswordResetSessionState {
  version: 2;
  reference: string;
  expiresAt: number;
  resendAt: number;
  deliveryStatus: string;
  email: string;
  storedAt: number;
}

const RESET_STORAGE_KEY = "identity.password-reset.challenge";
const RESET_RESTORE_GRACE_MS = 5 * 60 * 1000;

const finiteNonNegativeSeconds = (value: number): number =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

const normalizedRecoveryEmail = (value?: string | null): string | null => {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized.length > 0 ? normalized : null;
};

export const IdentityChallengeStore = defineStore("identityChallenge", () => {
  const reference = ref<string | null>(null);
  const purpose = ref<IdentityPurpose | null>(null);
  const channel = ref<string | null>(null);
  const maskedDestination = ref<string | null>(null);
  const deliveryStatus = ref<string | null>(null);
  const passwordResetEmail = ref<string | null>(null);
  const expiresAt = ref<number | null>(null);
  const resendAt = ref<number | null>(null);
  const now = ref(Date.now());
  let clock: ReturnType<typeof setInterval> | null = null;
  let clockUsers = 0;

  const isExpired = computed(
    () => expiresAt.value !== null && now.value >= expiresAt.value,
  );
  const canResend = computed(
    () => resendAt.value === null || now.value >= resendAt.value,
  );
  const resendRemaining = computed(() =>
    resendAt.value === null
      ? 0
      : Math.max(0, Math.ceil((resendAt.value - now.value) / 1000)),
  );

  const persistPasswordReset = () => {
    if (
      !reference.value ||
      expiresAt.value === null ||
      resendAt.value === null ||
      !deliveryStatus.value ||
      !passwordResetEmail.value
    ) {
      sessionStorage.removeItem(RESET_STORAGE_KEY);
      return;
    }

    const state: PasswordResetSessionState = {
      version: 2,
      reference: reference.value,
      expiresAt: expiresAt.value,
      resendAt: resendAt.value,
      deliveryStatus: deliveryStatus.value,
      email: passwordResetEmail.value,
      storedAt: Date.now(),
    };

    sessionStorage.setItem(RESET_STORAGE_KEY, JSON.stringify(state));
  };

  const begin = (
    payload: IdentityChallengePayload,
    persist = false,
    recoveryEmail?: string,
  ) => {
    const issuedAt = Date.now();
    now.value = issuedAt;
    reference.value = payload.challenge_reference;
    purpose.value = payload.purpose ?? null;
    channel.value = payload.channel ?? null;
    maskedDestination.value = payload.masked_destination ?? null;
    deliveryStatus.value = payload.delivery_status;
    expiresAt.value =
      issuedAt + finiteNonNegativeSeconds(payload.expires_in) * 1000;
    resendAt.value =
      issuedAt + finiteNonNegativeSeconds(payload.resend_available_in) * 1000;

    if (persist) {
      passwordResetEmail.value = normalizedRecoveryEmail(recoveryEmail);
      persistPasswordReset();
    } else if (payload.purpose !== "password_reset") {
      passwordResetEmail.value = null;
    }
  };

  const startClock = () => {
    clockUsers++;
    now.value = Date.now();

    if (!clock) {
      clock = setInterval(() => {
        // Expiration and resend cooldown are independent contracts.
        // The clock must continue after the OTP expires so the resend
        // countdown cannot be reset or enabled early.
        now.value = Date.now();
      }, 1000);
    }

    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      clockUsers = Math.max(0, clockUsers - 1);
      if (clockUsers === 0 && clock) {
        clearInterval(clock);
        clock = null;
      }
    };
  };

  const restorePasswordReset = (): string | null => {
    const value = sessionStorage.getItem(RESET_STORAGE_KEY);
    if (!value) return null;

    try {
      const stored = JSON.parse(value) as Partial<PasswordResetSessionState>;
      const email = normalizedRecoveryEmail(stored.email);
      const expires = Number(stored.expiresAt);
      const resend = Number(stored.resendAt);
      const storedAt = Number(stored.storedAt);
      const latestContractTime = Math.max(expires, resend);

      if (
        stored.version !== 2 ||
        typeof stored.reference !== "string" ||
        stored.reference.length === 0 ||
        !Number.isFinite(expires) ||
        !Number.isFinite(resend) ||
        !Number.isFinite(storedAt) ||
        typeof stored.deliveryStatus !== "string" ||
        stored.deliveryStatus.length === 0 ||
        !email ||
        Date.now() > latestContractTime + RESET_RESTORE_GRACE_MS
      ) {
        clear();
        return null;
      }

      now.value = Date.now();
      reference.value = stored.reference;
      purpose.value = "password_reset";
      channel.value = "email";
      expiresAt.value = expires;
      resendAt.value = resend;
      deliveryStatus.value = stored.deliveryStatus;
      passwordResetEmail.value = email;

      return email;
    } catch {
      clear();
      return null;
    }
  };

  const clear = () => {
    reference.value = null;
    purpose.value = null;
    channel.value = null;
    maskedDestination.value = null;
    deliveryStatus.value = null;
    passwordResetEmail.value = null;
    expiresAt.value = null;
    resendAt.value = null;
    now.value = Date.now();
    sessionStorage.removeItem(RESET_STORAGE_KEY);
  };

  return {
    reference,
    purpose,
    channel,
    maskedDestination,
    deliveryStatus,
    passwordResetEmail,
    expiresAt,
    resendAt,
    resendRemaining,
    isExpired,
    canResend,
    begin,
    startClock,
    restorePasswordReset,
    clear,
  };
});
