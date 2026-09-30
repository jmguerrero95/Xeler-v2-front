<template>
  <div class="w-100 text-center mt-5">
    <InputComponentVue
      name="Cantidad a Recibir"
      v-model="amount"
      :events="eventsXcop"
      appendText="XCOP"
    >
    </InputComponentVue>
  </div>
  <div class="my-3">
    <VAlert
      class="border-primary-alert px-2 cursor-pointer"
      color="primary"
      variant="outlined"
      density="compact"
      rounded="lg"
      @click="showQr = !showQr"
    >
      <div class="d-flex gap-2">
        <div class="my-auto">
          <VIcon icon="mdi-qrcode" color="table" />
        </div>
        <div class="font-16 text-center w-100 text-table">
          {{ showQr ? "Ocultar" : "Mostrar" }} QR
        </div>
      </div>
    </VAlert>
    <div class="text-center mt-2" v-if="showQr">
      <QrcodeVue
        v-if="receiveCode"
        class="order-1 order-lg-0"
        foreground="#5043E8"
        :value="getDataForQr"
        render-as="svg"
        :size="$vuetify.display.mdAndDown ? 217 : 130"
      >
      </QrcodeVue>
      <div v-else class="text-table">Preparando referencia segura...</div>
      <br />
      <span class="text-table">Por favor Scanee el código desde Xeler</span>
    </div>
  </div>
  <div class="mt-3 font-weight-regular">
    <div class="mt-2 text-table text-13 text-center line-height-15">
      Cualquier envio erroneo es responsabilidad del usuario, verifica todos los
      datos con precaucion.
    </div>
  </div>
</template>

<script setup lang="ts">
import InputComponentVue from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import type { EventComponent } from "@/interfaces/Components.helper";
import { ref, computed, onBeforeUnmount, onMounted, watch } from "vue";
import QrcodeVue from "qrcode.vue";
import { XcopStore } from "@/stores/XcopStore";
import { normalizeUnsignedDecimalInput } from "@/utils/decimal";

const amount = ref("");
const helper = helperStore();
const xcop = XcopStore();
interface ReceiveCode {
  schema: "xeler-xcop";
  version: 1;
  recipient_reference: string;
  display_name: string;
  amount: string | null;
  currency: "XCOP";
}
const receiveCode = ref<ReceiveCode | null>(null);
const getDataForQr = computed(() => JSON.stringify(receiveCode.value ?? {}));

const loadReceiveCode = async () => {
  const suggestedAmount = normalizeUnsignedDecimalInput(
    amount.value,
    xcop.summary?.decimals ?? 18,
  );
  const params = suggestedAmount && suggestedAmount !== "0"
    ? { amount: suggestedAmount }
    : {};
  const response = await helper.http("xcop/receive-code", "get", { params }, "", true);
  receiveCode.value = response.data as ReceiveCode;
};

const showQr = ref(false);
onMounted(async () => {
  if (!xcop.summary) await xcop.refresh();
  await loadReceiveCode();
});
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
watch(amount, () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(loadReceiveCode, 300);
});
onBeforeUnmount(() => {
  if (refreshTimer) clearTimeout(refreshTimer);
});

const eventsXcop: EventComponent = {
  keypress: (event: KeyboardEvent) => {
    if (!/^\d$/.test(event.key)
      && !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", ".", ","].includes(event.key)) {
      event.preventDefault();
    }
  },
  keyup: () => {
    amount.value = normalizeUnsignedDecimalInput(
      amount.value,
      xcop.summary?.decimals ?? 18,
    );
  },
};
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;

.border-primary-alert {
  border: 1px solid $color-primary;
}
</style>
