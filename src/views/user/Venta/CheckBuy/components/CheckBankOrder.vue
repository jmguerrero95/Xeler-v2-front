<template>
  <VRow>
    <VCol cols="12">
      <h3>Seguimiento de venta #{{ order.attributes.tranx_no }}</h3>
    </VCol>
    <VCol cols="12">
      <div
        class="w-100 alertError py-2 px-1 rounded-lg text-soft-error d-flex"
        style="gap: 15px"
      >
        <div class="text-center align-self-center">
          <VIcon size="50">
            <svg
              width="24"
              height="26"
              viewBox="0 0 24 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.3333 2.58333H15.76C15.2 1.085 13.7333 0 12 0C10.2667 0 8.8 1.085 8.24 2.58333H2.66667C2.48 2.58333 2.30667 2.59625 2.13333 2.635C1.61333 2.73833 1.14667 2.99667 0.786667 3.34542C0.546667 3.57792 0.346667 3.86208 0.213333 4.17208C0.0800001 4.46917 0 4.805 0 5.16667V23.25C0 23.5988 0.0800001 23.9475 0.213333 24.2575C0.346667 24.5675 0.546667 24.8388 0.786667 25.0842C1.14667 25.4329 1.61333 25.6912 2.13333 25.7946C2.30667 25.8204 2.48 25.8333 2.66667 25.8333H21.3333C22.8 25.8333 24 24.6708 24 23.25V5.16667C24 3.74583 22.8 2.58333 21.3333 2.58333ZM10.6667 17.0113L8.78667 18.8454L4 14.2083L8.78667 9.57125L10.6667 11.4054L7.77333 14.2083L10.6667 17.0113ZM12 4.19792C11.4533 4.19792 11 3.75875 11 3.22917C11 2.69958 11.4533 2.26042 12 2.26042C12.5467 2.26042 13 2.69958 13 3.22917C13 3.75875 12.5467 4.19792 12 4.19792ZM15.2133 18.8454L13.3333 17.0113L16.2267 14.2083L13.3333 11.4054L15.2133 9.57125L20 14.2083L15.2133 18.8454Z"
                fill="#EF5DA8"
              />
            </svg>
          </VIcon>
        </div>
        <div class="my-auto">
          Esta venta no requiere que subas comprobantes. Cuando el depósito
          cripto se confirme, procesaremos el pago al destino que elegiste.
        </div>
      </div>
    </VCol>
    <VCol cols="12">
      <div
        class="w-100 alertError py-2 px-1 rounded-lg text-soft-error d-flex"
        style="gap: 15px"
      >
        <div class="text-center align-self-center">
          <VIcon size="50">
            <svg
              width="53"
              height="53"
              viewBox="0 0 53 53"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clip-path="url(#clip0_157_6393)">
                <path
                  d="M24.2917 33.1248H28.7084V37.5415H24.2917V33.1248ZM24.2917 15.4582H28.7084V28.7082H24.2917V15.4582ZM26.4779 4.4165C14.2879 4.4165 4.41669 14.3098 4.41669 26.4998C4.41669 38.6898 14.2879 48.5832 26.4779 48.5832C38.69 48.5832 48.5834 38.6898 48.5834 26.4998C48.5834 14.3098 38.69 4.4165 26.4779 4.4165ZM26.5 44.1665C16.7392 44.1665 8.83335 36.2607 8.83335 26.4998C8.83335 16.739 16.7392 8.83317 26.5 8.83317C36.2609 8.83317 44.1667 16.739 44.1667 26.4998C44.1667 36.2607 36.2609 44.1665 26.5 44.1665Z"
                  fill="#EF5DA8"
                />
              </g>
              <defs>
                <clipPath id="clip0_157_6393">
                  <rect width="53" height="53" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </VIcon>
        </div>
        <div class="my-auto">
          Puedes revisar aquí mismo el estado del depósito, la cuenta o punto de
          entrega seleccionado y el avance del pago fiat.
        </div>
      </div>
    </VCol>
  </VRow>

  <VRow v-if="order.attributes.can_cancel_order">
    <div class="text-table mt-7">
      La venta permanecerá activa mientras se confirma la recepción cripto o
      hasta que decidas cancelarla, si el estado todavía lo permite.
    </div>
  </VRow>

  <div v-if="order.attributes.can_cancel_order" class="text-center w-100 mt-10">
    <cancel-order :order="order"></cancel-order>
  </div>

  <dialog-global :dialog="openModal" @close-dialog="openModal = false">
    <template #title>
      <span class="text-primary">Seguimiento de pago fiat</span>
    </template>

    <p>
      Nuestro equipo te notificará cuando el pago fiat haya sido procesado en
      la cuenta o punto seleccionado para esta venta.
    </p>
  </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { ref } from "vue";
import type { Order } from "@/interfaces/Order/Order.model";
import CancelOrder from "@/views/user/Compra/CheckBuy/components/CancelOrder.vue";

defineProps<{
  order: Order;
}>();

const openModal = ref(false);
</script>
