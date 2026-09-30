import type { FinancialStepUpScope } from "@/services/securityStepUp";
import { ref, reactive } from "vue";
import type { AxiosRequestConfig, AxiosResponse, Method } from "axios";
import { defineStore } from "pinia";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { type ToastOptions, toast } from "vue3-toastify";
import { apiClient, type ApiClientOptions } from "./services/apiClient";
import type { NormalizedApiError } from "./services/apiErrors";
import type { CheckedOrBlockedType, StatusOperationVerified } from "./db";
import db from "./db";
import type { UserAuth } from "./interfaces/User/User.auth";
import type { ROLES } from "./interfaces/Role/Role.enum";
import type { User } from "./interfaces/User/User.model";
import type { Image } from "./interfaces/Image.model";
import { clearOperationKey, createOperationKey } from "./services/idempotency";
import { normalizeDecimalStrict } from "./utils/decimal";
import { UserStore } from "./stores/UserStore";
import {
  buildActionPermission,
  getPermissionReferenceFromUrl,
  type CrudAction,
} from "./utils/permissionActions";
import { getAuthToken } from "./services/authToken";

export const helperStore = defineStore("helper", <T>() => {
  const { t } = useI18n();

  const baseUrl = ref(import.meta.env.VITE_API_URL);
  const loading = ref(false);

  const items = ref();
  const item = ref();

  const router = useRouter();
  const form = ref();
  const paginated = ref({
    currentPage: 1,
    perPage: 6,
  });

  const isAutenticated = () => {
    return getAuthToken() || false;
  };

  const http = (
    url: string,
    method: Method = "get",
    options: AxiosRequestConfig = {},
    notification = "",
    disabledLoading = false,
    apiOptions: ApiClientOptions = {}
  ) => {
    return new Promise<AxiosResponse>(async (resolve, reject) => {
      try {
        if (!disabledLoading) {
          loading.value = true;
        }

        const config: ApiClientOptions = {
          ...options,
          ...apiOptions,
          baseURL: options.baseURL ?? apiOptions.baseURL ?? baseUrl.value,
          headers: {
            ...(options.headers as Record<string, string> | undefined),
            ...(apiOptions.headers ?? {}),
          },
        };
        const response: AxiosResponse = await apiClient.request(method, url, config);
        if (notification) {
          showNotify(notification);
        }
        resolve(response);
      } catch (error: unknown) {
        const normalized = error as NormalizedApiError;

        if (!apiOptions.silent) {
          normalized.messages?.forEach((message) => {
            showNotify(message, { type: "error" });
          });
        }

        if (normalized.status === 401) {
          router.push("/login");
        }
        reject(error);
      } finally {
        if (!disabledLoading) {
          loading.value = false;
        }
      }
    });
  };

  const getErrors = (errors: any) => {
    const error: string[] = [];
    const op: ToastOptions = {
      type: "error",
    };
    if (errors) {
      for (const err in errors) {
        error.push(errors[err]);
      }
    }
    error.forEach((er) => showNotify(er, op));
  };

  const showNotify = (
    msg: string,
    options: ToastOptions | "success" | "error" | "info" | "warning" = {
      type: "success",
    }
  ) => {
    const normalizedOptions: ToastOptions =
      typeof options === "string" ? { type: options } : options;

    toast(msg, {
      theme: "colored",
      ...normalizedOptions,
    }); // ToastOptions
  };

  const url = ref("");

  const canAction = (action: CrudAction, reference?: string): boolean => {
    const permissionReference = reference ?? getPermissionReferenceFromUrl(url.value);
    const permission = buildActionPermission(action, permissionReference);
    if (!permission) return true;

    return UserStore().hasPermission(permission);
  };

  const pagination = reactive({
    perPage: 15,
    currentPage: 1,
    to: 1,
    total: 0,
  });

  const perPage = [5, 10, 15];

  const defaultParams = ref<any>({});
  const index = async (params: any = {}) => {
    items.value = [];
    const response: any = await http(url.value, "get", {
      params: {
        ...params,
        perPage: pagination.perPage,
        page: pagination.currentPage,
        pag: pagination.perPage,
        ...defaultParams.value,
      },
    });
    items.value =
      response.data.response?.data ?? response.data.response ?? response.data.data;
    pagination.to = response.data.response?.to ?? response.data.meta?.current_page;
    pagination.total =
      response.data.response?.last_page ?? response.data.meta?.last_page;
  };

  const show = (id: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await http(url.value + "/" + id, "get");

        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  const normalizeWithdrawalPayload = (payload: any) => {
    if (url.value !== "withdrawal/xcop") return payload;

    return {
      ...payload,
      ...(payload.amount !== undefined
        ? { amount: normalizeDecimalStrict(payload.amount) }
        : {}),
      ...(payload.fee !== undefined
        ? { fee: normalizeDecimalStrict(payload.fee) }
        : {}),
    };
  };

  const put = (id: any, data: any, notification = true, requestedScope?: FinancialStepUpScope) => {
    return new Promise(async (resolve, reject) => {
      try {
        const message = notification
          ? t("general-messages.editedSuccessfully")
          : "";
        const scope = url.value === "withdrawal/xcop"
          ? `withdrawal-update-${id}`
          : "";
        const payload = normalizeWithdrawalPayload({
          ...data,
          ...defaultParamsByCrud.value,
        });
        const response = await http(
          url.value + "/" + id,
          "put",
          {
            data: payload,
          },
          message,
          false,
          requestedScope ? { financialScope: requestedScope, idempotent: true } : url.value === "withdrawal/xcop"
            ? {
                idempotent: true,
                idempotencyKey: createOperationKey(scope, payload),
                financialScope: "finance.xcop",
              }
            : ["roles", "permissions"].includes(url.value)
              ? { idempotent: true, financialScope: "admin.security" as const }
              : ["company/account", "company/wallet", "client/account", "client/wallet"].includes(url.value)
                ? { financialScope: "finance.financial_destination" as const }
                : {}
        );
        if (scope) clearOperationKey(scope);

        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  const defaultParamsByCrud = ref<any>({});
  const create = (data: any, notificacion = true, requestedScope?: FinancialStepUpScope) => {
    return new Promise(async (resolve, reject) => {
      try {
        const message = notificacion
          ? t("general-messages.createdSuccessfully")
          : "";
        const scope = url.value === "withdrawal/xcop" ? "withdrawal-create" : "";
        const payload = normalizeWithdrawalPayload({
          ...data,
          ...defaultParamsByCrud.value,
        });
        const response = await http(
          url.value,
          "post",
          {
            data: payload,
          },
          message,
          false,
          requestedScope ? { financialScope: requestedScope, idempotent: true } : url.value === "withdrawal/xcop"
            ? {
                idempotent: true,
                idempotencyKey: createOperationKey(scope, payload),
                financialScope: "finance.xcop",
              }
            : ["roles", "permissions"].includes(url.value)
              ? { idempotent: true, financialScope: "admin.security" as const }
              : ["company/account", "company/wallet", "client/account", "client/wallet"].includes(url.value)
                ? { financialScope: "finance.financial_destination" as const }
                : {}
        );
        if (scope) clearOperationKey(scope);

        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  const deleted = (id: any, notificacion = true, requestedScope?: FinancialStepUpScope) => {
    return new Promise(async (resolve, reject) => {
      try {
        let message = "";
        if (notificacion) {
          message = isDeleted(id)
            ? t("general-messages.restoredSuccessfully")
            : t("general-messages.deletedSuccessfully");
        }
        let response;
        if (isDeleted(id)) {
          const scope =
            url.value === "withdrawal/xcop" ? `withdrawal-restore-${id}` : "";
          response = await http(
            url.value + "/" + id + "/restore",
            "post",
            {},
            message,
            false,
          requestedScope ? { financialScope: requestedScope, idempotent: true } :   url.value === "withdrawal/xcop"
              ? {
                  idempotent: true,
                  idempotencyKey: createOperationKey(scope, {
                    withdrawal_id: id,
                  }),
                  financialScope: "finance.xcop",
                }
              : ["company/account", "company/wallet", "client/account", "client/wallet"].includes(url.value)
                ? { financialScope: "finance.financial_destination" as const }
                : {}
          );
          if (scope) clearOperationKey(scope);
        } else {
          response = await http(
            url.value + "/" + id,
            "delete",
            {},
            message,
            false,
          requestedScope ? { financialScope: requestedScope, idempotent: true } :   ["roles", "permissions"].includes(url.value)
              ? { idempotent: true, financialScope: "admin.security" as const }
              : ["company/account", "company/wallet", "client/account", "client/wallet"].includes(url.value)
                ? { financialScope: "finance.financial_destination" as const }
                : {}
          );
        }
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  const isDeleted = (id: any) => {
    let bool = false;

    const element = items.value.find((item: any) => item.id === id);

    if (element.attributes.deletedAt || element.attributes.deleted_at) {
      bool = true;
    }
    return bool;
  };

  const upsert = (data: any, notify = true): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        let res;
        if (item.value) {
          res = put(item.value.id, data, notify);
        } else {
          res = create(data, notify);
        }
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  };

  const clickIn = ref<"Show" | "Edit" | "Create" | "">("");
  const formCrud = ref<any>({});
  const formRef = ref<any>();
  const errorsInput = ref<
    {
      id: string;
      errorMessages: string[];
    }[]
  >([]);
  const getErrorInput = (id: string) => {
    if (errorsInput.value.length === 0) return "";
    return errorsInput.value.find((e) => e.id === id)?.errorMessages[0] ?? "";
  };
  const openModalCrud = ref<boolean>(false);
  const methodVerificatedStatus = ref<StatusOperationVerified>();
  const checkedOrBlocked = (
    baseUrl: string,
    type: CheckedOrBlockedType,
    message: string
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!item.value) resolve(true);
        const method = db.methodVerificatedStatus[
          methodVerificatedStatus.value!
        ] as Method;
        const options = { baseURL: baseUrl };
        const response = await http(
          `${url.value}/${item.value.id}/${type}`,
          method,
          options,
          message
        ).then(() => {
          index();
        });
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  };

  const initView = (
    defaultParamsView = {},
    defaultParamsByCrudView = {}
  ): void => {
    pagination.currentPage = 1;
    openModalCrud.value = false;
    clickIn.value = "";
    defaultParams.value = {};
    defaultParamsByCrud.value = {};
  };

  return {
    initView,
    checkedOrBlocked,
    methodVerificatedStatus,
    errorsInput,
    getErrorInput,
    pagination,
    isAutenticated,
    items,
    item,
    http,
    paginated,
    form,
    showNotify,
    getErrors,
    index,
    show,
    put,
    create,
    deleted,
    canAction,
    url,
    perPage,
    isDeleted,
    baseUrl,
    loading,
    upsert,
    clickIn,
    formCrud,
    formRef,
    openModalCrud,
    defaultParams,
    defaultParamsByCrud,
  };
});

export const isAutenticated = () => {
  return getAuthToken() || false;
};

export const formatNumber = (
  number: number | string,
  decimalSeparator = ",",
  thousandSeparator = ".",
  decimals = 3
): string => {
  const numericValue = typeof number === "number" ? number : Number(number);
  if (!Number.isFinite(numericValue)) return "0";

  const partInt = Math.trunc(numericValue);
  let roundedNumber: number;

  if (numericValue - partInt > 0) {
    roundedNumber =
      decimals > 0
        ? parseFloat(numericValue.toPrecision(decimals))
        : parseFloat(numericValue.toFixed(decimals));
  } else {
    roundedNumber = partInt;
    decimals = 0;
  }

  const [integerPart, decimalPart] = roundedNumber.toFixed(decimals).split(".");
  const formattedIntegerPart = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    thousandSeparator
  );

  const formattedDecimalPart = decimalPart
    ? `${decimalSeparator}${decimalPart}`
    : `${decimalSeparator}00`;

  if (decimals === 0) {
    return `${formattedIntegerPart}`;
  }
  return `${formattedIntegerPart}${formattedDecimalPart}`;
};

export const formatNumberStringToNumber = (
  number: string,
  decimalSeparator = ",",
  thousandSeparator = "."
): number => {
  return parseFloat(
    number.split(thousandSeparator).join("").replace(decimalSeparator, ".")
  );
};

export const getFloatPartOfNumber = (value: number): number => {
  const partInt = Math.trunc(value);
  const partFloat = value - partInt;
  return partFloat;
};

export const getUserAuth = (): UserAuth => {
  return JSON.parse(sessionStorage.getItem("user") ?? "null") as UserAuth;
};

export const isRole = (role: ROLES): boolean => {
  return getUserAuth()?.roles?.some((userRole) => userRole.name === role) ?? false;
};

export const getWalletFormated = (
  wallet: string | null | undefined,
  start = 6,
  finish = 5
): string => {
  if (!wallet) return "-";

  const init = wallet.slice(0, start);
  const length = wallet.length - 1;
  const end = wallet.slice(length - finish, length);
  return `${init}...${end}`;
};

export const copyToClipboard = (value: string | number) => {
  navigator.clipboard.writeText(value.toString());
};

export const getDns = (): string => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
};

export const getFullName = (user: User): string => {
  const name =
    user.attributes.first_name + " " + (user.attributes.second_name ?? "");
  const lastname =
    user.attributes.last_name + " " + (user.attributes.second_last_name ?? "");
  return `${name} ${lastname}`;
};

export const itemHaveImages = (images?: Image[]): false | string => {
  if (!images || images?.length == 0) return false;
  return images[0].attributes.aws_url ?? false;
};

export const formatCrypoAmount = (value: string) => {
  const fixed = parseFloat(value).toFixed(6);
  return formatNumber(parseFloat(fixed), ".", ",", 6);
};

export const verifyCompatibilityShareInNav = (): boolean => {
  if (!("share" in navigator)) return false;
  return true;
};
export const shareInNav = async (content: ShareData): Promise<boolean> => {
  const helper = helperStore();
  if (!verifyCompatibilityShareInNav()) return false;

  try {
    await navigator.share(content);
    return true;
  } catch (err) {
    helper.showNotify("Ha ocurrido un error", { type: "error" });
    return false;
  }
};
