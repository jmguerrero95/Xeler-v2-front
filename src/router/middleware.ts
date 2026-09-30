import { getUserAuth } from "@/helper";
import type { RouteLocationNormalized, NavigationGuardNext } from "vue-router";
import type { UserAuth } from "@/interfaces/User/User.auth";
import { UserStore } from "@/stores/UserStore";
import { VERIFICATEDS } from "@/interfaces/User/User.enum";
import {
  COMMONS_PERMISSIONS,
  type PERMISSION_ENUM,
} from "@/enums/Permissions.enum";

const phoneVerificationRequired =
  String(import.meta.env.VITE_IDENTITY_PHONE_VERIFICATION_REQUIRED ?? "true").toLowerCase() !== "false";

const safeGetUserAuth = (): UserAuth | null => {
  if (!sessionStorage.getItem("user")) return null;

  try {
    return getUserAuth();
  } catch {
    return null;
  }
};

export function checkedRole(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const rolesPermited: string[] = to.meta.roles as string[];
  const userRoles = safeGetUserAuth()?.roles ?? [];

  if (userRoles.some((role) => rolesPermited.includes(role.name))) {
    return next();
  }
  return next({ name: "Forbidden" });
}

export function checkedPermission(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const permissionsPermited: PERMISSION_ENUM[] =
    (to.meta.permissions as PERMISSION_ENUM[] | undefined) ?? [];
  const anyPermissionsPermited: PERMISSION_ENUM[] =
    (to.meta.anyPermissions as PERMISSION_ENUM[] | undefined) ?? [];
  if (permissionsPermited.length === 0 && anyPermissionsPermited.length === 0) return next();
  const reference: PERMISSION_ENUM | undefined =
    (to.meta.reference as PERMISSION_ENUM) ?? undefined;
  const userStore = UserStore();
  userStore.uploadPermiss();
  const canUsePermission = (p: PERMISSION_ENUM): boolean => {
    if (String(p).includes(".")) {
      return userStore.hasPermission(String(p));
    }
    if (reference) {
      return userStore.can(p, reference);
    }
    return userStore.canList(p);
  };
  const userCan: boolean = permissionsPermited
    .map(canUsePermission)
    .every((p) => p === true);
  const userCanAny: boolean =
    anyPermissionsPermited.length === 0 ||
    anyPermissionsPermited.some(canUsePermission);

  if (
    // permissionsPermited.some(permissionPermited => permissionsUser.includes(permissionPermited))
    userCan && userCanAny
  ) {
    return next();
  }
  return next({ name: "Forbidden" });
}

export function checkedRoleOrPermission(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const rolesPermited: string[] = to.meta.roles as string[];
  const userRoles = safeGetUserAuth()?.roles ?? [];
  const isRolePermitted = userRoles.some((role) => rolesPermited.includes(role.name));

  const permissionsPermited: PERMISSION_ENUM[] =
    (to.meta.permissions as PERMISSION_ENUM[] | undefined) ?? [];
  const anyPermissionsPermited: PERMISSION_ENUM[] =
    (to.meta.anyPermissions as PERMISSION_ENUM[] | undefined) ?? [];
  const userStore = UserStore();
  userStore.uploadPermiss();
  const canUsePermission = (permission: PERMISSION_ENUM): boolean => {
    const value = String(permission);
    return value.includes(".")
      ? userStore.hasPermission(value)
      : userStore.canList(value);
  };
  const hasAllPermissions = permissionsPermited.every(canUsePermission);
  const hasAnyPermission =
    anyPermissionsPermited.length === 0 || anyPermissionsPermited.some(canUsePermission);
  const userCan = permissionsPermited.length > 0 || anyPermissionsPermited.length > 0
    ? hasAllPermissions && hasAnyPermission
    : false;

  if (isRolePermitted || userCan) {
    return next();
  }
  return next({ name: "Forbidden" });
}

export function checkedVerificationsUser(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const user = safeGetUserAuth();
  if (!user) return next({ name: "Login" });

  const verificateds: string[] = (to.meta.verificateds as string[]) ?? [];
  const effectiveVerificateds = phoneVerificationRequired
    ? verificateds
    : verificateds.filter((verification) => verification !== VERIFICATEDS.PHONE);

  if (effectiveVerificateds.length === 0) return next();

  const allVerificateds = effectiveVerificateds
    .map((v) => user[v as keyof UserAuth])
    .every((v) => v);

  if (allVerificateds) {
    return next();
  }
  return next({ name: "user-profile" });
}
