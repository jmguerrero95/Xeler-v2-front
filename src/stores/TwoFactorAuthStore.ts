import { helperStore } from "@/helper";
import type { Method } from "axios";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { UserStore } from "./UserStore";
import type { NormalizedApiError } from "@/services/apiErrors";
import type { UserAuth } from "@/interfaces/User/User.auth";
import { apiClient } from "@/services/apiClient";
import { clearFinancialStepUp, storeFinancialStepUp, type FinancialStepUpScope } from "@/services/securityStepUp";

export const TwoFactorAuthStore = defineStore("TwoFactorAuth", () => {
  const helper = helperStore();
  const userStore = UserStore();
  const router = useRouter();
  const modal = ref(false);
  const code = ref("");
  const password = ref("");
  const requirePasswordAndTotp = ref(false);
  const passwordOnly = ref(false);
  const cancelAction = ref<(() => void) | null>(null);
  const financialFlow = ref(true);
  const requestedScope = ref<FinancialStepUpScope>("finance.order_admin");
  const url = ref("");
  const form = ref<object>();
  const method = ref<Method>("get");
  const callback = ref<{ fn: () => unknown | Promise<unknown> }>({
    fn: () => {},
  });
  const loginChallengeToken = ref<string | null>(null);
  let loginChallengeExpiryTimer: ReturnType<typeof setTimeout> | null = null;

  const beginLoginChallenge = (
    challengeToken: string,
    expiresIn = 300,
  ): void => {
    clearLoginChallenge();
    loginChallengeToken.value = challengeToken;
    code.value = "";
    modal.value = true;
    newFlow.value = false;
    url.value = "login/f2a";
    method.value = "post";
    loginChallengeExpiryTimer = setTimeout(() => {
      clearLoginChallenge();
      modal.value = false;
    }, expiresIn * 1000);
  };

  const clearLoginChallenge = (): void => {
    if (loginChallengeExpiryTimer) {
      clearTimeout(loginChallengeExpiryTimer);
      loginChallengeExpiryTimer = null;
    }
    loginChallengeToken.value = null;
    code.value = "";
  };

  const ejectFunction = (): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      try {
        const data = loginChallengeToken.value
          ? {
              challenge_token: loginChallengeToken.value,
              code: code.value,
            }
          : {
              ...form.value,
              google2fa_secret: code.value,
            };
        const res = await helper.http(url.value, method.value, { data });
        setAllLogin(res.data);
        if (loginChallengeToken.value) {
          localStorage.setItem("2fa", "1");
          clearLoginChallenge();
        }
        modal.value = false;
        code.value = "";
        password.value = "";

        resolve(true);
      } catch (err) {
        const terminalCodes = [
          "TWO_FACTOR_CHALLENGE_INVALID",
          "TWO_FACTOR_CHALLENGE_EXPIRED",
          "TWO_FACTOR_CHALLENGE_CONSUMED",
          "TWO_FACTOR_TOO_MANY_ATTEMPTS",
        ];
        if (terminalCodes.includes((err as NormalizedApiError).code ?? "")) {
          clearLoginChallenge();
          modal.value = false;
        }
        code.value = "";

        reject(err);
      }
    });
  };

  const ejectFunction2 = (): Promise<boolean> => {
    return new Promise<boolean>(async (resolve, reject) => {
      const currentCallback = callback.value;
      try {
        if (financialFlow.value) {
          const credential = code.value;
          const data = localStorage.getItem("2fa")
            ? { scope: requestedScope.value, two_factor_code: credential }
            : { scope: requestedScope.value, password: credential };
          const response = await apiClient.post<{ data?: { grant?: string }; grant?: string }>("security/step-up", data);
          const issued = response.data?.data?.grant ?? response.data?.grant;
          if (!issued) throw new Error("No se pudo autorizar la operación sensible.");
          storeFinancialStepUp(requestedScope.value, issued);
        }

        modal.value = false;
        cancelAction.value = null;
        const result = await currentCallback.fn();
        if (result === false) {
          clearFinancialStepUp();
          code.value = "";
          password.value = "";
          resolve(false);
          return;
        }
        if (callback.value === currentCallback) {
          code.value = "";
          password.value = "";
          financialFlow.value = true;
          passwordOnly.value = false;
        }
        resolve(true);
      } catch (err) {
        clearFinancialStepUp();
        // Keep dialog open so user must provide a valid code/password.
        code.value = "";
        reject(err);
      }
    });
  };
  const setAllLogin = (data: { user: UserAuth; token: string }) => {
    const { user, token } = data;
    userStore.setAuth(token, user);

    router.push({ name: userStore.defaultAuthenticatedRoute() });
  };

  const newFlow = ref(false);
  return {
    newFlow,
    modal,
    ejectFunction,
    code,
    password,
    requirePasswordAndTotp,
    passwordOnly,
    cancelAction,
    financialFlow,
    requestedScope,
    url,
    form,
    callback,
    method,
    ejectFunction2,
    loginChallengeToken,
    beginLoginChallenge,
    clearLoginChallenge,
  };
});
