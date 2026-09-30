<template>
  <DialogGlobal
    widthDialog="350"
    :dialog="dialog"
    @close-dialog="emits('closeDialog')"
  >
    <div class="text-center w-100">
      <div class="d-flex justify-center gap-2">
        <div>
          <p
            class="font-weight-light text-warning font-25"
            :class="type == 'send' ? 'text-warning' : 'text-success'"
          >
            -{{ amount }} XCOP
          </p>
          <p>
            {{ date }}
          </p>
        </div>
        <div class="mt-1">
          <share-component :content-share="contentShare"></share-component>
        </div>
      </div>
      <div
        class="mt-7 bg-light mx-auto px-4 py-5 rounded-xl"
        style="max-width: 340px"
      >
        <VRow dense class="text-left">
          <VCol cols="5" class="text-primary font-weight-light">Usuario:</VCol>
          <VCol cols="7" class="">{{ user }}</VCol>

          <VCol cols="5" class="text-primary font-weight-light" v-if="false"
            >Destino:</VCol
          >
          <VCol cols="7" class="" v-if="false">{{ user }}</VCol>

          <VCol cols="5" class="text-primary font-weight-light"
            >Transacción:</VCol
          >
          <VCol cols="7" class="">{{ number_transaction }}</VCol>

          <VCol cols="5" class="text-primary font-weight-light" v-if="false"
            >Tx id:</VCol
          >
          <VCol v-if="false" cols="7" class="">{{ user }}</VCol>

          <VCol cols="5" class="text-primary font-weight-light">Costo:</VCol>
          <VCol cols="7" class="">0 XCOP</VCol>

          <VCol cols="5" class="text-primary font-weight-light">Estado:</VCol>
          <VCol cols="7" class="">Completado</VCol>
        </VRow>
      </div>
    </div>
  </DialogGlobal>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import ShareComponent from "@/components/ShareComponent.vue";
import { computed } from "vue";

// import type {} from '@/interfaces/TransactionXCOP/'

const props = defineProps<Props>();
const emits = defineEmits<Emits>();
const contentShare = computed(
  (): ShareData => ({
    title: "Envío de XCOP - Xeler",
    text: `
        Usuario: ${props.user}<br>
        Transacción: ${props.number_transaction} <br>
        Cantidad: ${props.amount} XCOP <br>
        Fecha: ${props.date} XCOP <br>
        Costo:0 XCOP <br>
        Estado:Completado
    `,
  })
);

type Emits = (e: "closeDialog") => void;
interface Props {
  dialog: boolean;
  type: "send" | "receive";
  external: boolean;
  user: string;
  amount: string | number;
  date: string;
  number_transaction: string;
}
</script>
