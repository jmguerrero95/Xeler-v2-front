<template>
  <div
    class="text-table rounded-lg pa-4"
    style="background-color: rgba(239, 93, 168, 0.08)"
    data-test="buy-fee-breakdown"
  >
    <h5 class="text-primary mb-3">Desglose de la compra</h5>
    <div data-test="fiat-input">Monto ingresado: {{ safeValue(quote.fiat_input_amount) }} COP</div>
    <div data-test="rate">Tasa aplicada: {{ safeValue(quote.rate) }} COP</div>
    <div data-test="administrative-fee">Comisión administrativa: {{ safeValue(quote.administrative_fee_local) }} COP</div>

    <div v-if="quote.fees" data-test="payment-method-fee">Fee del metodo: {{ safeValue(quote.fees.payment_method_fee) }} COP</div>
    <div v-if="quote.fees" data-test="total-fees">Total fees: {{ safeValue(quote.fees.total_fees) }} COP</div>

    <div v-if="quote.fees?.network_fee_exemption_applied" data-test="network-fee-assumed">
      Comisión de red asumida por Xeler
    </div>
    <template v-else-if="isLocalFee">
      <div data-test="network-fee">
        Costo operativo TRON/TRC20 {{ estimateLabel }}: COP {{ safeValue(quote.network_fee_local) }}
      </div>
    </template>
    <template v-else>
      <div data-test="network-fee">
        Costo de red {{ estimateLabel }}: {{ safeValue(quote.network_fee_crypto) }} {{ safeValue(quote.fee_asset) }}
      </div>
      <div data-test="network-fee-local">
        Equivalente aproximado: COP {{ safeValue(quote.network_fee_local) }}
      </div>
    </template>

    <div data-test="net-fiat">Monto neto utilizado: {{ safeValue(quote.net_fiat_amount) }} COP</div>
    <div data-test="gross-crypto">Crypto bruto: {{ safeValue(quote.gross_crypto_amount) }} {{ safeValue(quote.currency) }}</div>
    <div data-test="final-crypto">Crypto final a recibir: {{ safeValue(quote.final_crypto_received_amount) }} {{ safeValue(quote.currency) }}</div>
    <div data-test="payment-method">Método de pago: {{ safeValue(quote.payment_method_code) }}</div>
    <div data-test="currency-network">Moneda / red: {{ safeValue(quote.currency) }} / {{ safeValue(quote.network) }}</div>
    <div data-test="fee-source">Fuente del fee: {{ sourceLabel }}</div>
    <div data-test="fee-policy" v-if="quote.fee_policy === 'company_absorbed'">
      Este costo operativo es asumido por Xeler y no se descuenta nuevamente de tu compra.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OrderQuoteAttributes } from "@/interfaces/Order/OrderQuote.model";
import { computed } from "vue";

const props = defineProps<{ quote: OrderQuoteAttributes }>();

const isLocalFee = computed(() => props.quote.fee_asset === "COP");
const estimateLabel = computed(() => props.quote.fee_is_estimated ? "estimado" : "");
const sourceLabel = computed(() => {
  if (props.quote.fee_source === "configured_local_fallback") return "estimación operativa configurada en COP";
  if (props.quote.fee_source === "configured_fallback") return "estimación operativa configurada por Xeler";
  if (props.quote.fee_source === "provider_estimate") return "estimación del proveedor";
  return safeValue(props.quote.fee_source);
});

const safeValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "No disponible";
  const rendered = String(value);
  return rendered === "NaN" ? "No disponible" : rendered;
};
</script>
