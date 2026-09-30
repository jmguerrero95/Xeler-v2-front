<template>
  <div
    class="font-machine border-voucher-machine mx-auto"
    style="color: #6280ea"
    :style="{
      width: $vuetify.display.mdAndUp ? '450px' : '200px',
    }"
  >
    <div
      class="d-flex justify-center wather-mark position-absolute font-proxima text-uppercase"
      style="font-size: 40px; opacity: 0.1"
    >
      <div class="mx-auto">ejemplo</div>
    </div>
    <div
      class="text-center ml-2"
      :style="$vuetify.display.xs ? 'font-size:9px' : 'font-size:18px'"
    >
      <header class="d-flex justify-end mr-1">
        <div>
          <img
            v-if="bankHaveImage"
            :src="getImage"
            alt="Bank"
            style="filter: grayscale(100%) sepia(100%) hue-rotate(150deg)"
            :width="$vuetify.display.mdAndUp ? 400 : 200"
            :height="$vuetify.display.mdAndUp ? 60 : 30"
          />
        </div>
      </header>
      <div class="text-left">
        Registro de Operacion: 777777<br />
        Deposito a CUENTA DE AHORROS /Bancolombia<br />
        Sucursal: 281 - PARELo108<br />
        Ciudad: BOGOTA D.C<br />
        Fecha: 02/10/2025 . Hora: 21:00:50<br />
        Secuencia: 132 Codigo Usuario : 011 <br />
        Medio de Pago: EFECTIVO <br />
        Costo Transaccion: $0,00 ****<br />
        Id depositante / Pagador : 80277172<br />
        Valor Efectivo: $2,825,000<br />
        Valor Cheque: $0.00<br />
        Valor Total: $2,825,000<br />
      </div>
      <div>
        LA INFORMACION CONTENIDA EN EL PRESENTE DOCUMENTO CORRESPONDE A LA
        OPERACION ORDENADA AL BANCO.<br />
      </div>
      <div class="font-hand text-primary pre-line">{{ textHand }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  textHand: string;
  bankHaveImage: boolean;
  getImage: string;
}>();
</script>
<style scoped>.pre-line { white-space: pre-line; }</style>
