<script setup lang="ts">
import { ref, onBeforeUnmount, onBeforeMount, computed } from "vue";
import CardComponent from "@/views/dashboard/Dashboard/CardComponent.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import TransactionView from "../admin/transactions/TransactionView.vue";
import { formatNumber, helperStore } from "@/helper";
import dayjs from "dayjs";
import { WalletStore } from "@/stores/WalletStore";
import { UserStore } from "@/stores/UserStore";
import InputComponentVue from "@/components/InputComponent.vue";
import SelectComponent from "@/components/SelectComponent.vue";

const helper = helperStore();
const userStore = UserStore();
const isUserContext = computed(() => userStore.navigationContext() === "user");
const isAdminContext = computed(() => userStore.navigationContext() === "admin");
const showAdminStatistics = computed(
  () => userStore.hasRole("Admin") || userStore.hasRole("Superadmin"),
);
const availableAdminActions = computed(() => [
  userStore.hasPermission("orders.index")
    ? { title: "Gestionar ordenes", route: "admin-transactions" }
    : null,
  userStore.hasPermission("kyc.index")
    ? { title: "Revisar KYC", route: "admin-kyc" }
    : null,
  userStore.hasPermission("users.index")
    ? { title: "Consultar usuarios", route: "admin-users" }
    : null,
  userStore.hasPermission("support_chat.access")
    ? { title: "Gestionar soporte", route: "admin-support-chat" }
    : null,
].filter((action): action is { title: string; route: string } => action !== null));
helper.pagination.perPage = 3;

onBeforeMount(() => {
  helper.pagination.perPage = 3;
});
onBeforeUnmount(() => {
  helper.pagination.perPage = 15;
});

const currency = ref<number | "">("");

const code = ref("");
const avarageCurrency = ref<AvarageCurrency>();
const avarageBuyCurrency = ref<AvarageCurrency>();
const getDataAvarage = async () => {
  try {
    const url = "order/total/average/sale/currency";
    const params = {
      currency_id: currency.value,
      fec_ini: fec_ini.value,
      fec_end: fec_end.value,
    };
    const res = await helper.http(url, "get", { params });
    avarageCurrency.value = res.data;
    const c = walletStore.currencies.find((c) => c.id == currency.value);
    code.value = c!.attributes.abbreviation;
  } catch (e) {}
};

const getDataBuyAvarage = async () => {
  try {
    const url = "order/total/buy/currency";
    const params = {
      currency_id: currency.value,
      fec_ini: fec_ini.value,
      fec_end: fec_end.value,
    };
    const res = await helper.http(url, "get", { params });
    avarageBuyCurrency.value = res.data;
    const c = walletStore.currencies.find((c) => c.id == currency.value);
    code.value = c!.attributes.abbreviation;
  } catch (e) {}
};

const callFilter = async () => {
  getDataAvarage();
  getDataBuyAvarage();
};

const fec_ini = ref(dayjs().startOf("month").format("YYYY-MM-DD"));
const fec_end = ref(dayjs().endOf("month").format("YYYY-MM-DD"));

const walletStore = WalletStore();
if (showAdminStatistics.value) {
  walletStore.getCurrencies().then(() => {
    const defaultCurrency = walletStore.currencies.find((item) => item.id);
    if (!defaultCurrency) return;
    currency.value = defaultCurrency.id;
    getDataAvarage();
  });
}

const gananciaReal = computed(() => {
  const prom_venta = avarageCurrency.value?.average_currency_local ?? 0;
  const prom_compra = avarageBuyCurrency.value?.average_currency_local ?? 0;
  const cant_vend = avarageCurrency.value?.amount_currency ?? 0;

  const value = (prom_compra - prom_venta) * cant_vend;
  return formatNumber(value, ",", ".", 0);
});

interface AvarageCurrency {
  total_orders: number;
  amount_currency: number;
  amount_local_currency: number;
  amount_referer_currency: number;
  average_currency_local: number;
  average_currency_referer: number;
}
</script>

<template>
  <div
    v-if="isUserContext"
    class="text-table font-30 font-weight-light"
  >
    Bienvenid@
  </div>
  <VCard v-else-if="isAdminContext && !showAdminStatistics" class="pa-6" variant="outlined">
    <h2 class="text-primary mb-2">Panel administrativo</h2>
    <p class="text-table mb-5">Accede a las funciones autorizadas para tus roles.</p>
    <div v-if="availableAdminActions.length" class="d-flex flex-wrap ga-3">
      <VBtn
        v-for="action in availableAdminActions"
        :key="action.route"
        color="primary"
        :to="{ name: action.route }"
      >
        {{ action.title }}
      </VBtn>
    </div>
    <VAlert v-else type="info" variant="tonal">
      No hay modulos administrativos asignados. Contacta a un Superadmin.
    </VAlert>
  </VCard>
  <div v-if="showAdminStatistics">
    <VRow class="d-flex justify-center">
      <VCol cols="12" md="4" lg="4" class="mx-auto" style="max-width: 321px">
        <CardComponent
          type="currency"
          title="Total Comprado"
          field="pesos"
          icon="moneda"
          url="/order/total/types"
          :withFilter="true"
          :type-order="OrderTypes.COMPRA"
        >
        </CardComponent>
      </VCol>
      <VCol cols="12" md="4" lg="4" class="mx-auto" style="max-width: 321px">
        <CardComponent
          type="currency"
          title="Total Vendido"
          field="pesos"
          icon="moneda"
          url="/order/total/types"
          :withFilter="true"
          :type-order="OrderTypes.VENTA"
        >
        </CardComponent>
      </VCol>
      <VCol cols="12" md="4" lg="4" class="mx-auto" style="max-width: 321px">
        <CardComponent
          url="/users/xcop/total"
          icon="xcop"
          type="currency"
          title="Xcop. Total reward"
          :withFilter="false"
          field="total"
        >
        </CardComponent>
      </VCol>
      <VCol cols="12" md="4" lg="4" class="mx-auto" style="max-width: 321px">
        <CardComponent
          url="/users/total/registers"
          icon="user"
          type="number"
          title="Usuarios Registrados"
          :withFilter="true"
          field="total"
        >
        </CardComponent>
      </VCol>
    </VRow>
    <VRow>
      <VCol cols="12">
        <TransactionView :dashboard="true" />
      </VCol>
    </VRow>
    <VRow dense>
      <VCol class="text-table mx-0 px-0" cols="12" sm="9">
        <!-- <GraficoTorta></GraficoTorta> -->
        <div class="border-degree pt-3 pb-5 text-table pl-3">
          <div class="d-sm-flex d-block gap-2 px-1">
            <div
              :class="{
                'w-100': $vuetify.display.mdAndDown,
                'w-50': $vuetify.display.lg,
                'w-25': $vuetify.display.xlAndUp,
              }"
            >
              <InputComponentVue
                v-model="fec_ini"
                name="Fecha Inicio"
                type="date"
              >
              </InputComponentVue>
            </div>
            <div
              :class="{
                'w-100': $vuetify.display.mdAndDown,
                'w-50': $vuetify.display.lg,
                'w-25': $vuetify.display.xlAndUp,
              }"
            >
              <InputComponentVue v-model="fec_end" name="Fecha Fin" type="date">
              </InputComponentVue>
            </div>
            <div
              :class="{
                'w-100': $vuetify.display.mdAndDown,
                'w-50': $vuetify.display.lg,
                'w-25': $vuetify.display.xlAndUp,
              }"
            >
              <SelectComponent
                style="width: 110px"
                name="Moneda"
                v-model="currency"
                item-value="id"
                item-title="attributes.name"
                :items="walletStore.currencies"
              >
              </SelectComponent>
            </div>
            <div
              :class="{
                'w-100 mt-2': $vuetify.display.mdAndDown,
                'w-50': $vuetify.display.lg,
                'w-25': $vuetify.display.xlAndUp,
              }"
              class="d-flex align-end justify-center"
            >
              <VBtnPrimary
                :style="[
                  $vuetify.display.mdAndDown ? 'min-width: 80px!important' : '',
                ]"
                @click="callFilter"
                >Filtrar</VBtnPrimary
              >
            </div>
          </div>
          <div
            class="d-flex align-center justify-space-between px-4 my-4 w-100"
          >
            <div class="font-weight-bold text-primary" style="width: 155px">
              Ganancia Real:
            </div>
            <div>
              {{ gananciaReal }}
              COP
            </div>
            <div />
          </div>
          <div class="mr-3">
            <div
              style="max-width: 660px"
              class="w-100 px-2 mx-auto pt-1 border border-primary rounded-lg mt-2"
            >
              <div class="text-primary">Compra</div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Total de Ordenes:
                  </div>
                  <div>
                    {{ avarageBuyCurrency?.total_orders }}
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'd-block w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageBuyCurrency?.amount_currency ?? 0,
                        ",",
                        ".",
                        6
                      )
                    }}
                    {{ code }}
                  </div>
                </div>
              </div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad Comprado:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageBuyCurrency?.amount_local_currency ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    COP
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad Comprado:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageBuyCurrency?.amount_referer_currency ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    USD
                  </div>
                </div>
              </div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Promedio Comprado:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageBuyCurrency?.average_currency_local ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    COP
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Promedio Comprado:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageBuyCurrency?.average_currency_referer ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    USD
                  </div>
                </div>
              </div>
            </div>
            <div
              style="max-width: 660px"
              class="w-100 px-2 mx-auto pt-1 border border-primary rounded-lg mt-2"
            >
              <div class="text-primary">Venta</div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Total de Ordenes:
                  </div>
                  <div>
                    {{ avarageCurrency?.total_orders }}
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'd-block w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageCurrency?.amount_currency ?? 0,
                        ",",
                        ".",
                        6
                      )
                    }}
                    {{ code }}
                  </div>
                </div>
              </div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad Vendido:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageCurrency?.amount_local_currency ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    COP
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Cantidad Vendido:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageCurrency?.amount_referer_currency ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    USD
                  </div>
                </div>
              </div>
              <div
                :class="[
                  $vuetify.display.mdAndUp
                    ? 'd-flex justify-space-between gap-4'
                    : '',
                ]"
              >
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Promedio Vendido:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageCurrency?.average_currency_local ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    COP
                  </div>
                </div>
                <div
                  class="d-flex align-center justify-space-between"
                  :class="[$vuetify.display.mdAndUp ? 'w-50' : 'w-100']"
                >
                  <div class="font-weight-bold" style="width: 155px">
                    Promedio Vendido:
                  </div>
                  <div>
                    {{
                      formatNumber(
                        avarageCurrency?.average_currency_referer ?? 0,
                        ",",
                        ".",
                        2
                      )
                    }}
                    USD
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </VCol>
      <VCol> </VCol>
    </VRow>
  </div>
</template>
<style>
.gap-4 {
  gap: 4rem;
}
</style>
