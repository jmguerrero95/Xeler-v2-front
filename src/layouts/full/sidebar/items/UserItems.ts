import type { SidebarItem } from "@/interfaces/SidebarItems.interface";
import BuyIcon from "@/assets/icons/sidebar/user/BuyIcon.vue";
import SellIcon from "@/assets/icons/sidebar/user/SellIcon.vue";
import TransactionIcon from "@/assets/icons/sidebar/user/TransactionIcon.vue";
import ReferredIcon from "@/assets/icons/sidebar/user/ReferredIcon.vue";
import WalletIconVue from "@/assets/icons/WalletIcon.vue";
import { BREB_KEYS, INTERNATIONAL_ACCOUNTS, ORDERS, USERS, WALLET_XCOP } from "@/enums/Permissions.enum";

const items: SidebarItem[] = [
  { title: "Comprar", icon: BuyIcon, permiss_reference: ORDERS.REFERENCE, permiss: [ORDERS.BUY], to: "user-buy" },
  { title: "Vender", icon: SellIcon, permiss_reference: ORDERS.REFERENCE, permiss: [ORDERS.SELL], to: "user-sell" },
  { title: "Wallet XCOP", icon: WalletIconVue, permiss_reference: WALLET_XCOP.REFERENCE, permiss: [WALLET_XCOP.RECEIVED], to: "wallet-xcop" },
  { title: "Cuentas Internacionales", icon: "mdi-earth", permiss: [INTERNATIONAL_ACCOUNTS.VIEW_OWN], to: "user-international-accounts" },
  { title: "Transacciones", icon: TransactionIcon, permiss_reference: ORDERS.REFERENCE, permiss: [ORDERS.ONLY_USER], to: "user-transactions" },
  { title: "Llaves Bre-B", icon: "mdi-key-variant", permiss: [BREB_KEYS.VIEW_OWN], to: "user-breb-keys" },
  { title: "Mi perfil", icon: "mdi-account-circle", permiss_reference: USERS.REFERENCE, permiss: [USERS.PERSONAL_DATA], to: "user-profile" },
  { title: "Referidos", icon: ReferredIcon, permiss_reference: USERS.REFERENCE, permiss: [USERS.REFERREDS], to: "user-referred-list" },
];

export default items;
