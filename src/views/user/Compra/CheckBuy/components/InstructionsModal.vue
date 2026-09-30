<template>
  <div
    class="w-100 py-2 px-2 rounded-lg d-flex align-center justify-center"
    :class="
      $vuetify.display.xs
        ? 'border-degree'
        : 'alertError justify- text-soft-error'
    "
    style="gap: 15px"
  >
    <VIcon
      :size="$vuetify.display.xs ? 30 : 50"
      :color="$vuetify.display.xs ? 'primary' : 'warning'"
    >
      <svg
        width="24"
        height="26"
        viewBox="0 0 24 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M21.3333 2.58333H15.76C15.2 1.085 13.7333 0 12 0C10.2667 0 8.8 1.085 8.24 2.58333H2.66667C2.48 2.58333 2.30667 2.59625 2.13333 2.635C1.61333 2.73833 1.14667 2.99667 0.786667 3.34542C0.546667 3.57792 0.346667 3.86208 0.213333 4.17208C0.0800001 4.46917 0 4.805 0 5.16667V23.25C0 23.5988 0.0800001 23.9475 0.213333 24.2575C0.346667 24.5675 0.546667 24.8388 0.786667 25.0842C1.14667 25.4329 1.61333 25.6912 2.13333 25.7946C2.30667 25.8204 2.48 25.8333 2.66667 25.8333H21.3333C22.8 25.8333 24 24.6708 24 23.25V5.16667C24 3.74583 22.8 2.58333 21.3333 2.58333ZM10.6667 17.0113L8.78667 18.8454L4 14.2083L8.78667 9.57125L10.6667 11.4054L7.77333 14.2083L10.6667 17.0113ZM12 4.19792C11.4533 4.19792 11 3.75875 11 3.22917C11 2.69958 11.4533 2.26042 12 2.26042C12.5467 2.26042 13 2.69958 13 3.22917C13 3.75875 12.5467 4.19792 12 4.19792ZM15.2133 18.8454L13.3333 17.0113L16.2267 14.2083L13.3333 11.4054L15.2133 9.57125L20 14.2083L15.2133 18.8454Z"
          fill="currentColor"
        />
      </svg>
    </VIcon>
    <div
      class="my-auto font-15"
      :class="$vuetify.display.xs ? 'text-left' : 'text-center'"
    >
      Instrucciones de envio de comprobante
      <span
        class="text-uppercase cursor-pointer text-decoration-underline"
        @click="openModal = true"
      >
        click aqui
      </span>
    </div>
  </div>

  <dialog-global
    footer
    :dialog="openModal"
    @close-dialog="openModal = false"
    classTitle="mx-auto"
    :widthDialog="$vuetify.display.mdAndUp ? '500' : '300'"
  >
    <template #title>
      <VImg
        v-if="bankHaveImage"
        style="filter: grayscale(1)"
        :width="$vuetify.display.mdAndUp ? 400 : 200"
        :height="$vuetify.display.mdAndUp ? 60 : 30"
        :src="getImage()"
      />
    </template>

    <p>
      Cuando haces pagos por
      <span class="text-primary">
        {{ order.relationships?.shipping?.attributes?.name ?? "este metodo de pago" }}
      </span>
      debemos tomar unas medidas de seguridad adicionales.
    </p>
    <ul class="ml-5 my-4">
      <li>Debe ser una fotografia.</li>
      <li>No es valida escaneada.</li>
      <li>No editada.</li>
      <li>Se deben ver las 4 esquinas del recibo.</li>
    </ul>
    <p>
      Debes escribir el siguiente texto a mano y con letra clara en el recibo:
    </p>
    <div class="border-lg my-5 border-dashed text-primary text-center rounded-xl pre-line">{{ textHand }}</div>
    <component
      v-for="(item, index) in examplesRecipe"
      :key="index"
      class="mt-4"
      :is="item.component"
      :text-hand="textHand"
      :bankHaveImage="bankHaveImage"
      :getImage="getImage()"
    />
    <template #actions>
      <div class="text-center w-100">
        <VBtnPrimary @click="openModal = false">Ok</VBtnPrimary>
      </div>
    </template>
  </dialog-global>
</template>

<script setup lang="ts">
import CorresponsalBancario from "@/views/user/Compra/CheckBuy/components/instructionsModal/CorresponsalBancario.vue";
import TransferenciaBancaria from "./instructionsModal/TransferenciaBancaria.vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { getWalletFormated } from "@/helper";
import type { BankAccount } from "@/interfaces/CompanyAccount/BankAccount/BankAccount.model";
import type { Order } from "@/interfaces/Order/Order.model";
import { ref, computed } from "vue";
import CajeroAutomatico from "@/views/user/Compra/CheckBuy/components/instructionsModal/CajeroAutomatico.vue";

const props = defineProps<{
  order: Order;
}>();
const openModal = ref(false);

const examplesRecipe: {
  component:
    | typeof CorresponsalBancario
    | typeof CajeroAutomatico
    | typeof TransferenciaBancaria;
  type: string;
}[] = [
  {
    type: "corresponsal",
    component: CorresponsalBancario,
  },
  {
    component: CajeroAutomatico,
    type: "cajero",
  },
  {
    component: TransferenciaBancaria,
    type: "transferencia",
  },
];

const textHand = computed(() => {
  return `"Compra de Criptomonedas
            Direccion destino: ${getWalletFormated(
              props.order.attributes.address_send ?? ""
            )}
            Pago irreversible"`;
});

const accountDelivery = props.order.relationships?.account_delivery as
  | BankAccount
  | undefined;
const bankHaveImage = computed((): boolean => {
  const images = accountDelivery?.relationships?.bank?.relationships?.images ?? [];
  return images.length > 0;
});
const getImage = () => {
  const images = accountDelivery?.relationships?.bank?.relationships?.images ?? [];
  if (images.length === 0) return "";
  return images[0]?.attributes?.aws_url ?? "";
};
</script>

<style lang="scss" scoped>
@import url("https://fonts.googleapis.com/css2?family=Handjet:wght@700&family=Schoolbell&display=swap");
.font-machine {
  font-family: "Handjet", cursive;
}
.pre-line { white-space: pre-line; }

.font-hand {
  font-family: "Schoolbell", cursive;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  line-height: 15px;
}
.border-voucher-machine {
  border: 2px solid black;
}

.wather-mark {
  flex-wrap: wrap;
  z-index: 9999;
  left: 35%;
  -webkit-pointer-events: none;
  -moz-pointer-events: none;
  -ms-pointer-events: none;
  -o-pointer-events: none;
  pointer-events: none;

  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}
</style>
