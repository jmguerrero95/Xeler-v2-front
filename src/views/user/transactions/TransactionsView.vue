<template>
  <div
    class="d-flex justify-space-between flex-column flex-sm-row mb-8 text-table"
  >
    <h3 class="font-weight-light">
      {{ $t("views.transactions.title", 2) }}
    </h3>
    <SearchInputComponentVue v-model="search" @onSearch="getSearch" />
  </div>
  <TableComponentVue
    optionsHabilit
    icon-show
    :headers="headers"
    :items="helper.items"
    @show="clickInShow"
  >
    <template #cel-status="{ data }">
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
      <span v-else>
        {{ order(data).relationships?.status?.attributes?.name }}</span
      >
    </template>
    <template #cel-tranx_no="{ data }">
      <span class="text-primary">{{ order(data).attributes.tranx_no }}</span>
    </template>
    <template #cel-transaction="{ data }">
      <span
        :class="
          order(data).attributes.type == OrderTypes.COMPRA
            ? 'text-ok'
            : 'text-erro'
        "
        >{{ order(data).attributes.type }}</span
      >
    </template>
    <template #cel-local_currency="{ data }">
      {{
        formatNumber(
          parseFloat(
            order(data).relationships?.currencyExchangeOrder?.attributes
              ?.total_exchange_local!
          )
        )
      }}
      COP
    </template>
    <template #cel-crypto_currency="{ data }">
      <div class="d-flex justify-center align-center" style="gap: 15px">
        <div>
          <VImg
            v-if="haveCurrencyImage(data)"
            :src="order(data).relationships?.currency?.relationships?.images?.[0]?.attributes?.aws_url ?? undefined"
            width="20px"
            class=""
          >
          </VImg>
        </div>
        <div>
          {{
            formatNumber(
              parseFloat(order(data).attributes.received_amount),
              ",",
              ".",
              8
            )
          }}
          {{
            order(
              data
            ).relationships?.currency?.attributes?.abbreviation?.toLocaleUpperCase?.() ?? ""
          }}
        </div>
      </div>
    </template>
    <template #cel-reference_currency="{ data }">
      {{
        formatNumber(
          parseFloat(
            order(data).relationships?.currencyExchangeOrder?.attributes
              ?.total_exchange_reference!
          )
        )
      }}
      USD
    </template>
    <template #cel-wallet="{ data }">
      {{ getWalletFormated(order(data).attributes.address_send!) }}
    </template>
    <!-- <template #cel-pnl="{ data }">
            <div class="d-inline-block align-center" style="width: 100px">
                <VBtn
                    elevation="0"
                    size="small"
                    :flat="false"
                    style="width: 24px !important; height: 24px"
                    class="rounded"
                    :class="`bg-${colors[coinBand(order(data))]}`"
                    icon
                >
                    <VIcon
                        icon="mdi-arrow-down"
                        :class="`arrow-${
                            colors[coinBand(order(data))]
                        }`"
                        :style="`
                                transform: rotate(${
                                    orientationArrow[
                                        coinBand(order(data))
                                    ]
                                }deg);
                            `"
                    >
                    </VIcon>
                </VBtn>
                <span
                    class="font-weight-light mt-0 pt-0 ml-3 font-15"
                    :class="`text-${colorsText[coinBand(order(data))]}`"
                >
                    {{ coinPercent(order(data)) }} %
                </span>
            </div>
        </template> -->
  </TableComponentVue>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TableComponentVue from "@/components/global/TableComponent.vue";
import { formatNumber, helperStore, getWalletFormated } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { Wallet } from "@/interfaces/Wallet/Wallet.model";
import type { WalletCreate } from "@/interfaces/Wallet/Wallet.dto";
import SearchInputComponentVue from "@/components/global/SearchInputComponent.vue";
import * as validator from "@/validator";
import { WalletStore } from "@/stores/WalletStore";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import type { Order } from "@/interfaces/Order/Order.model";
import { useRouter } from "vue-router";
import ErrorFilledIcon from "@/assets/icons/ErrorFilledIcon.vue";
import CheckFilledIcon from "@/assets/icons/CheckFilledIcon.vue";

const router = useRouter();
const helper = helperStore();
helper.url = "order/my";
// helper.url = 'client/wallet/adress/wallet'
helper.initView();

const order = (item: unknown): Order => item as Order;
helper.index();
const walletStore = WalletStore();
walletStore.getCurrencies();

const { currencies, coins } = storeToRefs(walletStore);
const search = ref<string>("");
const getSearch = () => {
  helper.index({
    tranx_no: search.value,
  });
};

const { t } = useI18n();
const { formCrud } = storeToRefs(helper);

const validateAddress = () => {
  const currency = walletStore.currencies.find(
    (currencyIterable) => currencyIterable.id === formCrud.value.currency_id
  );

  if (!currency) {
    throw new Error("Currency not found");
  }

  return validator.addressValid(
    formCrud.value.address,
    currency.attributes.abbreviation
  );
};
const rows: Row[] = [
  {
    fields: [
      {
        label: t("views.wallets.alias"),
        type: "text",
        valueForm: "alias",
        rules: [validator.required],
      },
      {
        label: t("views.currencies.title"),
        type: "select",
        valueForm: "currency_id",
        rules: [validator.required],
        select: {
          items: currencies,
          itemTitle: "attributes.name",
          itemValue: "id",
        },
      },
    ],
  },
  {
    fields: [
      {
        label: t("views.wallets.address"),
        type: "text",
        valueForm: "address",
        rules: [validateAddress, validator.required],
      },
    ],
  },
];

const headers: Head[] = [
  {
    name: t("general-views.status"),
    value: "status",
  },
  {
    name: t("views.transactions.txn_no"),
    value: "tranx_no",
  },
  {
    name: t("general-views.date"),
    value: "attributes.created_at",
    type: "date",
    format: "YYYY-MM-DD | HH:mm:ss",
    style: "min-width:250px",
  },
  {
    name: t("views.transactions.title"),
    value: "transaction",
  },
  {
    name: t("views.transactions.crypto_currency"),
    value: "crypto_currency",
    style: "min-width:250px",
  },
  {
    name: t("views.transactions.local_currency"),
    value: "local_currency",
    style: "min-width:250px",
  },
  // {
  //     name: "PNL",
  //     value: "pnl",
  //     style: "min-width:250px",
  // },

  {
    name: t("views.transactions.reference_currency"),
    value: "reference_currency",
    style: "min-width:250px",
  },
  {
    name: t("views.transactions.wallet"),
    value: "wallet",
  },
];

const haveCurrencyImage = (item: unknown): boolean => {
  const order = item as Order;
  const images = order.relationships?.currency?.relationships?.images;
  if (images?.length == 0 || !images?.[0]?.attributes?.aws_url) return false;
  return true;
};

const clickInShow = (order: Order) => {
  let name =
    order.attributes.type == OrderTypes.COMPRA
      ? "user-check-buy"
      : "user-check-sell";
  router.push({
    name,
    params: {
      numTransaction: order.attributes.tranx_no,
    },
  });
};

const coinCurrent = (order: Order): Coin => {
  const abbreviation =
    order.relationships?.currency?.attributes?.abbreviation ?? "";
  const coin = coins.value.find((c) => c.abbreviation.includes(abbreviation));
  if (!coin) {
    throw new Error(`Coin with abbreviation ${abbreviation} not found`);
  }
  return coin;
};

const coinBand = (order: Order): BandCoin => {
  const coin = coinCurrent(order);
  const valueCurrent = coin.value;
  const value = parseFloat(
    order.relationships?.currencyExchangeOrder?.attributes?.exchange_local ??
      "0"
  );
  return getBandForCoin(valueCurrent, value);
};
const coinPercent = (order: Order): string => {
  const coin = coinCurrent(order);
  const valueCurrent = coin.value;
  const value = parseFloat(
    order.relationships?.currencyExchangeOrder?.attributes?.exchange_local?.toString() ??
      "0"
  );
  return getporcentForCoin(valueCurrent, value);
};

const getBandForCoin = (valueCurrent: number, value: number): BandCoin => {
  // return 'same'
  if (valueCurrent == value) return "same";
  return value > valueCurrent ? "up" : "down";
};
const getporcentForCoin = (valueCurrent: number, value: number): string => {
  // return '0'
  if (valueCurrent == value) return "0";
  const percent = ((value - valueCurrent) / valueCurrent) * 100;
  if (percent.toFixed(2) == "0.00") return "0.00";
  return percent > 0 ? `+` + percent.toFixed(2) : percent.toFixed(2);
};

interface Coin {
  name: string;
  value: number;
  up: boolean;
  icon: string;
  porcent: string;
  band: BandCoin;
  abbreviation: string;
}
type BandCoin = "same" | "up" | "down";
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;

.border-primary {
  border: 2px solid;
  border-color: $color-primary;
}
.bg-down-2 {
  background-color: #ff707033 !important;
}

.arrow-down-2 {
  color: #ff7070 !important;
}

.bg-same {
  background-color: #d3c9c933 !important;
}

.arrow-same {
  color: #3d3d3c !important;
}

.bg-up {
  background-color: #95ff7033 !important;
}

.arrow-up {
  color: #2b5517 !important;
}
</style>
