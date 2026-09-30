<template>
  <div
    class="font-machine border-voucher-machine mx-auto text-uppercase"
    :style="{
      width: $vuetify.display.xs ? '244px' : '400px',
    }"
  >
    <div
      class="d-flex justify-center wather-mark position-absolute font-proxima text-uppercase"
      style="font-size: 40px; opacity: 0.1"
    >
      <div class="mx-auto">ejemplo</div>
    </div>
    <div
      class="text-center"
      :class="$vuetify.display.xs ? 'font-13' : 'text-18'"
    >
      <div class="">Registro de operacion</div>
      <div class="mx-4">
        <div class="d-flex justify-space-around">
          <div>cajero</div>
          <div>fecha</div>
          <div>hora</div>
          <div>trans</div>
          <div>cajero</div>
        </div>
        <div class="d-flex justify-space-around">
          <div>mf_palat</div>
          <div>06/06/2025</div>
          <div>17:45</div>
          <div>6421</div>
          <div>7278</div>
        </div>
      </div>
      <div
        class="d-flex justify-space-between mx-2"
        v-for="(item, i) in items"
        :key="i"
      >
        <div v-if="item.title == 'br'"><br /></div>
        <div v-if="item.title != 'br'">{{ item.title }}</div>
        <div v-if="item.title != 'br'">{{ item.content }}</div>
      </div>

      <div class="font-hand text-primary pre-line">{{ textHand }}</div>
      <div>
        Bancolombia <br />
        toda transaccion esta sujeta a verificacion y aprobacion
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  textHand: string;
}>();

const items: { title: string; content: string }[] = [
  {
    title: "tipo de operacion",
    content: "consignacion",
  },
  {
    title: "tipo de cuenta destino",
    content: "Ahorros",
  },
  {
    title: "Num. cta. destino",
    content: "**********7854",
  },
  {
    title: "Nombre",
    content: "Mónica Pérez",
  },
  {
    title: "br",
    content: "",
  },
  {
    title: "Valor en Billetes",
    content: "$4,000,000.00",
  },
  {
    title: "valor de consignacion",
    content: "$4,000,000.00",
  },
  {
    title: "valor devolucion",
    content: "$0.00",
  },
];
</script>
<style scoped>.pre-line { white-space: pre-line; }</style>
