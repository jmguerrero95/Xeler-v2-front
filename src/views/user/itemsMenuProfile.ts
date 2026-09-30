import { shallowRef } from "vue";
import KycView from "./Kyc/KycView.vue";
import WalletView from "./wallet/WalletView.vue";
import BankAccountView from "./Accounts/Bank/BankAccountView.vue";
import OtherAccountView from "./Accounts/Other/OtherAccountView.vue";
import ReferredView from "./Refer/ReferredView.vue";
import PasswordTab from "../admin/profile/PasswordTab.vue";
import PersonalData from "./Profile/PersonalData.vue";

export interface ItemTab {
  name: string;
  value:
    | typeof PersonalData
    | typeof WalletView
    | typeof BankAccountView
    | typeof OtherAccountView
    | typeof ReferredView
    | typeof PasswordTab
    | typeof KycView
    | string;
  nameRoute: string;
  children?: ItemTab[];
}
const tabs = shallowRef<ItemTab[]>([
  {
    name: "Datos Personales",
    value: PersonalData,
    nameRoute: "user-personal-data",
  },

  {
    name: "Billeteras cripto",
    value: WalletView,
    nameRoute: "user-wallets",
  },
  {
    name: "Cuentas de pago",
    value: "cuentas",
    nameRoute: "#",
    children: [
      {
        name: "Bancarias",
        value: BankAccountView,
        nameRoute: "user-bank-accounts",
      },
      // {
      //     name: t("views.company-accounts.efecty.title", 2),
      //     value: EfectyAccountCompanyView,
      // },
      {
        name: "Billeteras de pago / Otras",
        value: OtherAccountView,
        nameRoute: "user-other-accounts",
      },
    ],
  },
  {
    name: "Referidos",
    value: ReferredView,
    nameRoute: "user-referreds",
  },
  {
    name: "Contraseñas",
    value: PasswordTab,
    nameRoute: "user-password",
  },
]);

tabs.value.push(
  {
    name: "Empresas",
    value: "companies",
    nameRoute: "user-companies",
  },
  {
    name: "Llaves Bre-B",
    value: "breb-keys",
    nameRoute: "user-breb-keys",
  },
  {
    name: "KYC",
    value: KycView,
    nameRoute: "user-kyc",
  },
);

export { tabs };
