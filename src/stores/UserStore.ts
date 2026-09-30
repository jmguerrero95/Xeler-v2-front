import {
  defineStore,
  getActivePinia,
  type Pinia,
  type StoreGeneric,
} from "pinia";
import { computed, ref } from "vue";
import { getUserAuth, helperStore } from "@/helper";
import type { User } from "@/interfaces/User/User.model";
import type { Role } from "@/interfaces/Role/Role.model";
import type { TypeDocument } from "@/interfaces/TypeDocument/TypeDocument.model";
import type { PermissionAttributes } from "@/interfaces/Permission/Permission.model";
import {
  COMMONS_PERMISSIONS,
  type PERMISSION_ENUM,
} from "@/enums/Permissions.enum";
import type { RouteLocationNormalized } from "vue-router";
import type { UserAuth } from "@/interfaces/User/User.auth";
import { apiClient } from "@/services/apiClient";
import {
  beginExplicitLogout,
  endExplicitLogout,
} from "@/services/apiErrors";
import { unsubscribeFromUserNotifications } from "@/services/notificationSubscription";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/services/authToken";

const migrateLegacySessionValue = (key: "user"): string | null => {
  const current = sessionStorage.getItem(key);
  const legacy = localStorage.getItem(key);
  if (!current && legacy) {
    sessionStorage.setItem(key, legacy);
  }
  localStorage.removeItem(key);

  return sessionStorage.getItem(key);
};

export const UserStore = defineStore("user", () => {
  const helper = helperStore();
  const token = ref<string | null>(getAuthToken());
  const storedUser = migrateLegacySessionValue("user");
  const authUser = ref<UserAuth | null>(
    storedUser
      ? (JSON.parse(storedUser) as UserAuth)
      : null,
  );
  const isLoadingUser = ref(false);
  const logoutLoading = ref(false);
  const isAuthenticated = computed(() => {
    token.value = getAuthToken();
    return Boolean(token.value);
  });
  const userRoles = computed(() => authUser.value?.roles ?? []);
  const normalizePermissions = (permissions: unknown[]): PermissionAttributes[] =>
    permissions.map((permission) => {
      const rawPermission = permission as {
        name?: string;
        guard_name?: string;
        attributes?: PermissionAttributes;
      };

      return rawPermission.attributes ?? (rawPermission as PermissionAttributes);
    });
  const userPermissions = computed<PermissionAttributes[]>(() => {
    return userRoles.value.flatMap((role) =>
      normalizePermissions((role.permissions ?? []) as unknown[]),
    );
  });

  const users = ref<User[]>([]);
  const getUsers = (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await helper.http("users", "get");
        users.value = res.data.response;
        resolve(true);
      } catch (err) {
        console.error("Error fetching users:", err);
        reject(new Error("Failed to fetch users"));
      }
    });
  };

  const roles = ref<Role[]>([]);
  const getRoles = (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await helper.http("roles", "get");
        roles.value = res.data.response;
        resolve(true);
      } catch (err) {
        console.error("Error fetching roles:", err);
        reject(new Error("Failed to fetch roles"));
      }
    });
  };

  const typeDocuments = ref<TypeDocument[]>([]);
  const getTypeDocuments = (): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await helper.http("type/documents", "get");
        typeDocuments.value = res.data.response;
        resolve(true);
      } catch (err) {
        console.error("Error fetching type documents:", err);
        reject(new Error("Failed to fetch type documents"));
      }
    });
  };

  const userAuth = ref<User>();
  const updateUserAuth = (): Promise<void> => {
    return new Promise<void>(async (resolve) => {
      const url = "users/activite/user";
      const res = await helper.http(url, "get", {}, "", true);
      userAuth.value = res.data.response as User;
      resolve();
    });
  };

  const permiss = ref<PermissionAttributes[]>([]);

  const setAuth = (authToken: string, user: UserAuth): void => {
    const normalizedToken = setAuthToken(authToken);

    token.value = normalizedToken;
    authUser.value = user;
    permiss.value = normalizePermissions(
      (user.roles ?? []).flatMap((role) => role.permissions ?? []) as unknown[],
    );
    sessionStorage.setItem("user", JSON.stringify(user));
  };

  const clearAuth = (): void => {
    token.value = null;
    authUser.value = null;
    permiss.value = [];
    clearAuthToken();
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
  };

  const hasPermission = (permission: string): boolean => {
    return userPermissions.value.some((p) => p.name === permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (permissions.length === 0) return true;
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasRole = (role: string): boolean => {
    return userRoles.value.some((userRole) => userRole.name === role);
  };

  const navigationContext = (): "user" | "admin" => {
    const status = (authUser.value as any)?.administrative_status
      ?? (authUser.value as any)?.attributes?.administrative_status
      ?? "active";
    if (hasRole("User")) return "user";
    const administrativeRole = userRoles.value.length > 0;
    return administrativeRole && status === "active" ? "admin" : "user";
  };

  const defaultAuthenticatedRoute = (): string => {
    if (navigationContext() === "user") return "user-buy";
    if (hasRole("Admin") || hasRole("Superadmin")) return "Dashboard";
    if (hasPermission("orders.index")) return "admin-transactions";
    if (hasPermission("kyc.index")) return "admin-kyc";
    if (hasPermission("users.index")) return "admin-users";
    if (navigationContext() === "admin" && hasPermission("support_chat.access")) return "admin-support-chat";
    if (hasPermission("support-tickets.manage")) return "admin-support-tickets";

    return "Forbidden";
  };

  const can = (
    permission: PERMISSION_ENUM | string,
    reference: PERMISSION_ENUM | string
  ): boolean => {
    if (permiss.value.length === 0) {
      uploadPermiss();
    }

    return [...permiss.value, ...userPermissions.value].some((p) => {
      return p.name == reference + "." + permission;
    });
  };

  const canList = (reference: PERMISSION_ENUM | string): boolean => {
    return (
      can(COMMONS_PERMISSIONS.GET, reference as PERMISSION_ENUM) ||
      can(COMMONS_PERMISSIONS.INDEX, reference as PERMISSION_ENUM)
    );
  };
  const uploadPermiss = (): void => {
    let user = authUser.value;
    if (!user && sessionStorage.getItem("user")) {
      user = getUserAuth();
    }
    if (permiss.value.length > 0 || !user) return;
    //@ts-ignore
    permiss.value = normalizePermissions(
      (user.roles ?? []).flatMap((role) => role.permissions ?? []) as unknown[],
    );
  };

  const canAccessRoute = (route: RouteLocationNormalized): boolean => {
    const permissions = (route.meta.permissions as string[] | undefined) ?? [];
    const anyPermissions = (route.meta.anyPermissions as string[] | undefined) ?? [];
    const reference = route.meta.reference as string | undefined;

    if (permissions.length === 0 && anyPermissions.length === 0) return true;

    const canUsePermission = (permission: string): boolean => {
      if (permission.includes(".")) {
        return hasPermission(permission);
      }
      if (reference) {
        return can(permission, reference);
      }

      return canList(permission);
    };

    const canAll = permissions.every(canUsePermission);
    const canAny = anyPermissions.length === 0 || anyPermissions.some(canUsePermission);

    return canAll && canAny;
  };

  const loadCurrentUser = async (): Promise<UserAuth | null> => {
    token.value = getAuthToken();
    if (!token.value) return null;

    try {
      isLoadingUser.value = true;
      const res = await helper.http("user", "get", {}, "", true, {
        silent: true,
      });
      const user = (res.data.response ?? res.data.data ?? res.data) as UserAuth;
      authUser.value = user;
      sessionStorage.setItem("user", JSON.stringify(user));
      permiss.value =
        normalizePermissions(
          (user.roles ?? []).flatMap((role) => role.permissions ?? []) as unknown[],
        ) ??
        permiss.value;
      return user;
    } finally {
      isLoadingUser.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    if (logoutLoading.value) return;
    logoutLoading.value = true;
    beginExplicitLogout();
    try {
      await apiClient.post("logout", undefined, { silent: true });
    } finally {
      unsubscribeFromUserNotifications();
      clearAuth();
      ["2fa", "two_factor_token", "selected_company", "company_id", "quote_id", "order"]
        .forEach((key) => {
          sessionStorage.removeItem(key);
          localStorage.removeItem(key);
      });
      const pinia = getActivePinia();
      const stores = pinia
        ? (pinia as Pinia & { _s: Map<string, StoreGeneric> })._s
        : null;
      stores?.forEach((store, id) => {
        if (id !== "user" && typeof store.$reset === "function") {
          store.$reset();
        }
        if (id !== "user") {
          store.$dispose();
          stores.delete(id);
        }
      });
      endExplicitLogout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      logoutLoading.value = false;
    }
  };

  return {
    token,
    authUser,
    userRoles,
    userPermissions,
    isAuthenticated,
    isLoadingUser,
    logoutLoading,
    setAuth,
    clearAuth,
    logout,
    hasPermission,
    hasAnyPermission,
    hasRole,
    navigationContext,
    defaultAuthenticatedRoute,
    canAccessRoute,
    loadCurrentUser,
    can,
    canList,
    uploadPermiss,
    permiss,
    userAuth,
    updateUserAuth,
    users,
    getUsers,
    roles,
    getRoles,
    typeDocuments,
    getTypeDocuments,
  };
});
