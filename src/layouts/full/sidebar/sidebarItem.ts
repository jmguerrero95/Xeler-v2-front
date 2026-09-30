import type { SidebarItem } from "@/interfaces/SidebarItems.interface";
import adminItems from "./items/AdminItems";
import userItems from "./items/UserItems";
import DashboardIconVue from "@/assets/icons/sidebar/DashboardIcon.vue";
import { SETTINGS } from "@/enums/Permissions.enum";

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboard",
    icon: DashboardIconVue,
    to: "Dashboard",
    permiss_reference: SETTINGS.REFERENCE,
    permiss: [SETTINGS.DASHBOARD],
    contexts: ["admin"],
  },
  ...adminItems.map((item) => ({ ...item, contexts: ["admin"] as Array<"admin" | "user"> })),
  ...userItems.map((item) => ({ ...item, contexts: ["user"] as Array<"admin" | "user"> })),
];

export default sidebarItems;
