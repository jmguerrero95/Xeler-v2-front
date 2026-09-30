<template>
  <div
    class="d-flex flex-column flex-sm-row justify-space-between text-primary"
  >
    <h3>{{ $t("views.transactions.title", 2) }}</h3>
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
  </div>
  <TableComponentVue
    optionsHabilit
    :headers="headers"
    :items="helper.items"
    new-buttons
  >
    <template #cel-estado="{ data }">
      <VIcon
        v-if="
          order(data).attributes.is_cancelled
        "
        :icon="ErrorFilledIcon"
        color="warning"
      />
      <VIcon
        v-else-if="
          order(data).attributes.is_completed
        "
        :icon="CheckFilledIcon"
        color="ok-2"
      />
      <span v-else> - </span>
    </template>
    <template #cel-icons="{ data }">
      <div class="d-flex">
        <VIcon v-if="orderTaken(data)" :icon="HandIcon" title="Tomada" />
        <VIcon v-if="isBankType(data)" :icon="BankIcon" title="Banco" />
        <VIcon
          v-if="withVoucher(data)"
          :icon="VoucherIcon"
          title="Comprobantes"
        />
        <VIcon v-if="userWithKyc(data)" :icon="HuellaIcon" title="Kyc" />
        <VIcon
          :class="
            typeOrder(data) != OrderTypes.COMPRA
              ? 'text-warning'
              : 'text-ok giro-180'
          "
          :title="typeOrder(data)"
          :icon="ArrowWithSquareIcon"
        />
      </div>
    </template>
    <template #attributes.created_at="{ data }">
      <th
        class="text-center text-primary text-capitalize"
        style="min-width: 230px"
      >
        Fecha
      </th>
    </template>
    <template #cel-total_exchange_local="{ data }">
      <!-- {{ data }}asd -->
      {{
        formatNumber(
          parseFloat(
            order(data).relationships?.currencyExchangeOrder.attributes
              .total_exchange_local ?? "0"
          )
        )
      }}
    </template>
    <template #cel-total_exchange_crypto="{ data }">
      <div class="d-flex justify-start align-center gap-2">
        <VImg
          width="20"
          height="20"
          inline
          v-if="haveCurrencyImage(order(data).relationships?.currency)"
          :src="(haveCurrencyImage(order(data).relationships?.currency) as string)"
        ></VImg>
        {{
          formatNumber(
            parseFloat(order(data).attributes.amount_currency),
            ".",
            ",",
            6
          )
        }}
        {{
          order(
            data
          ).relationships?.currency.attributes.abbreviation.toLocaleUpperCase()
        }}
      </div>
    </template>
    <template #cel-total_exchange_reference="{ data }">
      {{
        formatNumber(
          parseFloat(
            order(data).relationships!.currencyExchangeOrder.attributes
              .total_exchange_reference
          )
        )
      }}
    </template>
    <template #cel-address="{ data }">
      {{ getWalletFormated(order(data).attributes.address_send!) }}
    </template>
    <template #newButtons="{ data }">
      <v-list-item-title
        class="cursor-pointer"
        @click="
          modalReject = true;
          orderSelect = data;
        "
        v-if="!orderIsCancelOrAproved(data)"
        v-show="canUpdateOrders"
      >
        <VBtn color="transparent" size="x-small" elevation="0" icon>
          <VIcon color="primary" size="24" :icon="BlockedIcon" />
        </VBtn>
        Rechazar
      </v-list-item-title>
      <!-- ------------------------------------- -->
      <v-list-item-title
        class="cursor-pointer"
        @click="
          modalTxid = true;
          orderSelect = data;
          txid = '';
        "
        v-if="
          canUpdateOrders &&
          canExternalDisburse(data) &&
          order(data).attributes.type == OrderTypes.COMPRA
        "
      >
        <VBtn color="transparent" size="x-small" elevation="0" icon>
          <VIcon color="primary" size="24" :icon="ArrozTwoIcon" />
        </VBtn>
        Desembolso Externo
      </v-list-item-title>
      <!-- ------------------------------------- -->
      <v-list-item-title class="cursor-pointer" @click="openDetailOrder(data)">
        <VBtn color="transparent" size="x-small" elevation="0" icon>
          <VIcon color="primary" size="24" :icon="EyeFilledIcon" />
        </VBtn>
        Ver Detalles
      </v-list-item-title>
      <!-- ------------------------------------- -->
      <v-list-item-title
        class="cursor-pointer"
        @click="
          orderSelect = data;
          resumenModal = true;
        "
      >
        <VBtn color="transparent" size="x-small" elevation="0" icon>
          <VIcon color="primary" size="24" :icon="ResumenIcon" />
        </VBtn>
        Resumen
      </v-list-item-title>
    </template>
  </TableComponentVue>

  <DialogGlobalVue
    v-if="modalReject"
    :dialog="modalReject"
    @close-dialog="modalReject = false"
    width-dialog="500"
    class-title="text-center text-primary"
  >
    <template #title>
      Transacción: {{ orderSelect?.attributes.tranx_no }}
    </template>
    <div class="text-center text-table font-weight-bold">
      <QuestionIcon class="text-warning" style="width: 144px; height: 144px" />
      <div class="text-24">¿Realmente deseas rechazar la operación?</div>
    </div>
    <div class="text-center mt-4">
      <VBtnDangerT @click="rejectOrder"> Sí, Rechazar </VBtnDangerT>
    </div>
  </DialogGlobalVue>

  <DialogGlobalVue
    v-if="modalTxid"
    :dialog="modalTxid"
    @close-dialog="modalTxid = false"
    width-dialog="500"
    class-title="text-center text-primary"
  >
    <template #title>
      Transacción: {{ orderSelect?.attributes.tranx_no }}
    </template>
    <div
      class="align-center justify-center text-table font-weight-bold d-flex gap-2"
    >
      <div class="text-24">Ingresa el tx id:</div>
      <div style="width: 250px">
        <input-component
          without-label
          class="my-auto"
          v-model="txid"
          name=""
        ></input-component>
      </div>
    </div>
    <div class="mt-3">
      <input-component v-model="manualReason" name="Motivo del registro manual" />
    </div>
    <div class="text-center mt-4">
      <VBtnPrimary type="button" @click="externalGiveOrder" :disabled="!txid || !manualReason">
        Enviar
      </VBtnPrimary>
    </div>
  </DialogGlobalVue>
  <ResumenModal
    v-if="resumenModal"
    v-model="resumenModal"
    :order="orderSelect!"
  />
</template>

<script setup lang="ts">
import InputComponent from "@/components/InputComponent.vue";
import CheckFilledIcon from "@/assets/icons/CheckFilledIcon.vue";
import ErrorFilledIcon from "@/assets/icons/ErrorFilledIcon.vue";
import BlockedIcon from "@/assets/icons/BlockedIcon.vue";
import ArrozTwoIcon from "@/assets/icons/ArrozTwoIcon.vue";
import EyeFilledIcon from "@/assets/icons/EyeFilledIcon.vue";
import QuestionIcon from "@/assets/icons/QuestionIcon.vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import ResumenIcon from "@/assets/icons/ResumenIcon.vue";
import ResumenModal from "@/views/admin/transactions/TransactionView/ResumenModal.vue";
import { formatNumber, helperStore, getWalletFormated } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Order, TypeOrderFilter } from "@/interfaces/Order/Order.model";
import type { Head } from "@/interfaces/TableComponent.helper";
import { UserStore } from "@/stores/UserStore";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { haveCurrencyImage } from "@/stores/CurrencyStore";
import { paymentMethodCode } from "@/utils/paymentMethodSemantics";
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import HandIcon from "@/assets/icons/HandIcon.vue";
import BankIcon from "@/assets/icons/BankIcon.vue";
import VoucherIcon from "@/assets/icons/VoucherIcon.vue";
import HuellaIcon from "@/assets/icons/HuellaIcon.vue";
import ArrowWithSquareIcon from "@/assets/icons/ArrowWithSquareIcon.vue";
import { useRouter } from "vue-router";
import DialogGlobalVue from "@/components/global/DialogGlobal.vue";
import { useRoute } from "vue-router";
import { watch } from "vue";
import type { User } from "@/interfaces/User/User.model";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";

const props = defineProps<{
  user?: User;
  dashboard?: Boolean;
  inModal?: boolean;
}>();
const helper = helperStore();
const twoFactor = TwoFactorAuthStore();
helper.url = "order";
const route = useRoute();
const { type: type1 } = route.query;
helper.defaultParams = {
  types: type1,
  user_id: props.user?.id,
};
watch(
  () => route.query,
  (nuevo, viejo) => {
    if (route.name != "admin-transactions") return;
    const { type } = route.query;
    helper.initView();

    helper.defaultParams = {
      types: type,
    };
    // if(!props.dashboard){
    helper.index();
    // }
  }
);
helper.index();

const search = ref<string>("");
const getSearch = () => {
  helper.index({
    tranx_no: search.value,
  });
};
const router = useRouter();
const userStore = UserStore();
const canUpdateOrders = userStore.hasPermission("orders.updated");
if (userStore.hasPermission("users.index")) {
  void userStore.getUsers();
}
if (userStore.hasPermission("roles.index")) {
  void userStore.getRoles();
}
if (userStore.hasPermission("type_documents.index")) {
  void userStore.getTypeDocuments();
}

// const openModal = async () => {
//   itemH.value = {};
//   formCrud.value = {};
//   clickIn.value = "Create";
//   openModalCrud.value = true;
// };
const openDetailOrder = (order: Order) => {
  router.push({
    name: "admin-transaction-show",
    params: {
      numTransaction: order.attributes.tranx_no,
    },
  });
  if (props.inModal) {
    window.location.reload();
  }
};
const { t } = useI18n();
const {
  formCrud,
  openModalCrud,
  item: itemH,
  clickIn,
  formRef,
} = storeToRefs(helper);

const headers: Head[] = [
  {
    name: "Estado",
    value: "estado",
  },
  {
    name: t("views.transactions.txn_no"),
    value: "attributes.tranx_no",
  },
  {
    name: "",
    value: "icons",
  },
  {
    name: t("general-views.date"),
    value: "attributes.created_at",
    type: "date",
    format: "YYYY-MM-DD | HH:mm:ss",
  },
  {
    name: t("views.users.username"),
    value: "relationships.user.attributes.username",
  },
  {
    name: t("views.transactions.local_currency"),
    value: "total_exchange_local",
  },
  {
    name: t("views.transactions.crypto_currency"),
    value: "total_exchange_crypto",
    style: "min-width:200px",
  },
  {
    name: t("views.transactions.reference_currency"),
    value: "total_exchange_reference",
  },
  {
    name: t("views.transactions.wallet"),
    value: "address",
  },
];

const orderSelect = ref<Order>();
const order = (item: unknown): Order => {
  return item as Order;
};

const orderIsCancelOrAproved = (item: unknown): boolean => {
  const orderIsCancel = Boolean(order(item).attributes.is_cancelled);
  const orderIsAproved = Boolean(order(item).attributes.is_completed);
  return orderIsAproved || orderIsCancel;
};

const canExternalDisburse = (item: unknown): boolean => {
  return Boolean(order(item).attributes.can_register_manual_txid);
};

const orderTaken = (item: unknown): boolean => {
  return order(item).attributes.processed_by ? true : false;
};

const isBankType = (item: unknown): boolean => {
  return paymentMethodCode(order(item).relationships?.payment) === "bank";
};

const withVoucher = (item: unknown): boolean => {
  const images = order(item).relationships?.images;
  if (!images || images.length == 0) return false;
  return true;
};

const userWithKyc = (item: unknown): boolean => {
  return (
    order(item).relationships?.user.relationships?.kyc?.attributes.status ==
    KYC_STATUS.ACCEPT
  );
};

const typeOrder = (item: unknown): OrderTypes => {
  return order(item).attributes.type;
};

const modalReject = ref(false);

const rejectOrder = async () => {
  try {
    const url = "order/" + orderSelect.value?.id + "/cancel";
    const scope = `order-cancel-${orderSelect.value?.id}`;
    await helper.http(url, "post", {}, "", false, {
      idempotent: true,
      idempotencyKey: createOperationKey(scope, {
        order_id: orderSelect.value?.id,
      }),
      financialAction: true,
    });
    clearOperationKey(scope);
    modalReject.value = false;
    helper.index();
  } catch (e) {}
};

const modalTxid = ref(false);
const txid = ref("");
const manualReason = ref("");
const externalGiveOrder = async () => {
  if (!orderSelect.value?.attributes.can_register_manual_txid || !txid.value || !manualReason.value) {
    helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
    modalTxid.value = false;
    return;
  }

  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.requestedScope = "finance.order_admin";
  twoFactor.callback = {
    fn: executeExternalGiveOrder,
  };
};

const executeExternalGiveOrder = async () => {
  try {
    if (!orderSelect.value?.attributes.can_register_manual_txid) {
      helper.showNotify("La orden no esta aprobada o ya tiene un desembolso activo", { type: "error" });
      modalTxid.value = false;
      return;
    }
    const url = "order/external/accept/deposit";
    const data = {
      order_id: orderSelect.value?.id,
      txid: txid.value,
      reason: manualReason.value,
      ...(localStorage.getItem("2fa") ? { two_factor_code: twoFactor.code } : {}),
    };
    const scope = `order-external-deposit-${orderSelect.value?.id}`;
    const idempotencyPayload = {
      order_id: orderSelect.value?.id,
      txid: txid.value,
      reason: manualReason.value,
    };
    await helper.http(url, "post", { data }, "", false, {
      idempotent: true,
      idempotencyKey: createOperationKey(scope, idempotencyPayload),
      financialAction: true,
    });
    clearOperationKey(scope);
    modalTxid.value = false;
    helper.index();
  } catch (e) {}
};

const resumenModal = ref(false);
</script>

<style scoped>
.giro-180 {
  transform: rotate(180deg);
}
</style>
