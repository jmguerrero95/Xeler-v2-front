<template>
  <VRow class="d-flex justify-md-space-between justify-center">
    <VCol
      class="d-flex align-center justify-center justify-md-start"
      cols="12"
      lg="5"
      style="max-width: 357px"
    >
      <VIcon class="mr-2">
        <svg
          width="25"
          height="25"
          viewBox="0 0 25 25"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.987 0C5.811 0 0 5.6 0 12.5C0 19.4 5.811 25 12.987 25C20.176 25 26 19.4 26 12.5C26 5.6 20.176 0 12.987 0ZM18.499 20L13 16.8125L7.501 20L8.957 13.9875L4.108 9.95L10.504 9.425L13 3.75L15.496 9.4125L21.892 9.9375L17.043 13.975L18.499 20Z"
            fill="#20ABE6"
          />
        </svg>
      </VIcon>
      <div class="text-primary text-h5 font-weight-bold">
        {{ formatNumber(userStore.userAuth?.attributes.xcop!) }} XCOP
      </div>
    </VCol>

    <VCol cols="12" lg="7" style="max-width: 357px">
      <div
        class="v-text-field__slot py-1 d-flex align-center justify-space-between px-3"
      >
        <div></div>
        <div class="text-table">
          {{ getRouteReffer() }}
        </div>
        <CopyComponent :value="getRouteReffer()" />
        <!-- <div
            class="cursor-pointer"
            @click="copyToClipboard(getRouteReffer())"
        >
            <VIcon :icon="CopyIcon" size="20" />
        </div> -->
      </div>
    </VCol>
  </VRow>
  <div class="text-table mt-6">
    <span class="text-primary">XCOP</span> son los puntos de fidelizacion de
    XELER que pueden ser canjeados en nuestra tienda, tambien se pueden usar
    para pagar comisiones de envio o pagar ciertos envios prioritarios.
  </div>

  <div class="mx-auto">
    <div class="border-primary rounded-xl text-table my-5">
      <div
        v-for="(item, i) in items"
        :key="i"
        :class="{
          'bg-odd': !(i % 2),
          'rounded-t-xl': i == 0,
          'rounded-b-xl': i == items.length - 1,
        }"
        class="d-flex justify-space-between px-3 py-2"
      >
        <div>
          {{ item.title }}
        </div>
        <div class="text-right ml-5">
          {{ item.value }} <span class="text-primary">XCOP</span>
        </div>
      </div>
    </div>
  </div>

  <div class="text-table">
    <p>
      Cuando tienes un referido y se registra, tus
      <span class="text-primary">XCOP</span> seran abonados en el momento que el
      usuario haga su primer transaccion.
    </p>
    <p class="mt-4">
      La operacion de puntos se calcula asi: si la transaccion es por ejemplo de
      $1,000,000 recibes el 0.1% equivalente a 1000
      <span class="text-primary">XCOP</span>.
    </p>
  </div>
</template>

<script setup lang="ts">
import CopyIcon from "@/assets/icons/CopyIcon.vue";
import CopyComponent from "@/components/CopyComponent.vue";
import { copyToClipboard, formatNumber, getUserAuth, getDns } from "@/helper";
import { UserStore } from "@/stores/UserStore";
import { useRouter } from "vue-router";

const userStore = UserStore();
const user = getUserAuth();

const router = useRouter();
const getRouteReffer = (): string => {
  const route = router.resolve({
    name: "Register",
    query: { ref: user.affiliate_id },
  }).href;
  return getDns() + route;
};

const items: Item[] = [
  {
    title: "Referir un usuario",
    value: "3000",
  },
  {
    title: "Comprar por banco",
    value: "0.1% del total en",
  },
  {
    title: "Vender por banco",
    value: "0.1% del total en",
  },
  {
    title: "Comprar en efectivo",
    value: "0.2% del total en",
  },
  {
    title: "Vender en efectivo",
    value: "0.2% del total en",
  },
  {
    title: "Verificar KYC",
    value: "1000",
  },
  {
    title: "Operaciones de tus referidos",
    value: "0.1% del total en",
  },
];

interface Item {
  title: string;
  value: string;
}
</script>

<style scoped>
.bg-odd {
  background-color: #a5a6f666;
}
</style>
