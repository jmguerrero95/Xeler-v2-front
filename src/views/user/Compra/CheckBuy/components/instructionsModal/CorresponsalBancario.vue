<template>
  <div class="font-machine border-voucher-machine mx-auto" style="width: 200px">
    <div
      class="d-flex justify-center wather-mark position-absolute font-proxima text-uppercase"
      style="font-size: 40px; opacity: 0.1"
    >
      <div class="mx-auto">ejemplo</div>
    </div>
    <div class="text-center text-18">
      <div>REDEBAN</div>
      <div>DIC 11 2020 14:21</div>
      <div>
        CORRESPONSAL BANCOLOMBIA<br />
        LERIDA II - TOLIMA<br />
        CALLE 9 6 36 <br />
      </div>
      <div
        class="d-flex justify-space-between text-white px-3"
        style="background-color: black"
      >
        <div>VALOR</div>
        <div>$1,000,000</div>
      </div>
      <div>
        Bancolombia es responsable por los servicos prestados por el
        corresponsal
      </div>
      <div class="font-hand text-primary pre-line">{{ textHand }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  textHand: string;
}>();
</script>
<style scoped>.pre-line { white-space: pre-line; }</style>
