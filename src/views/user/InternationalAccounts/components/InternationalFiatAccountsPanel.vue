<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { helperStore } from "@/helper";
import type {
  InternationalAccountActivity,
  InternationalAccountFiatAccount,
  InternationalAccountFiatAccountDetail,
  InternationalAccountOnboarding,
  InternationalAccountProduct,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
import {
  activateInternationalFiatAccount,
  getInternationalFiatAccount,
  getInternationalFiatAccountActivity,
  getInternationalFiatAccounts,
} from "@/services/internationalAccountsApi";

const props = defineProps<{
  onboarding: InternationalAccountOnboarding | null;
  requestedProducts?: InternationalAccountProduct[];
}>();

const helper = helperStore();
const { runWithTwoFactor } = useTwoFactorGuard();
const loading = ref(false);
const activating = ref<InternationalAccountProduct | null>(null);
const accounts = ref<InternationalAccountFiatAccount[]>([]);
const detailOpen = ref(false);
const detailLoading = ref(false);
const selected = ref<InternationalAccountFiatAccountDetail | null>(null);
const activity = ref<InternationalAccountActivity[]>([]);
const products: InternationalAccountProduct[] = ["usd", "eur"];

const approvedProducts = computed(
  () =>
    new Set(
      (props.onboarding?.endorsements ?? [])
        .filter((item) => ["approved", "active"].includes(item.status))
        .map((item) => item.product),
    ),
);
const requestedProductSet = computed(
  () => new Set([
    ...(props.requestedProducts ?? []),
    ...(props.onboarding?.endorsements ?? []).map((item) => item.product),
  ]),
);
const depositsRestricted = computed(() =>
  [props.onboarding?.provider_status, props.onboarding?.kyc_status].includes(
    "deposits_restricted",
  ),
);

const productLabel = (product: InternationalAccountProduct): string =>
  product === "usd" ? "Cuenta USD" : "Cuenta EUR";

const accountFor = (
  product: InternationalAccountProduct,
): InternationalAccountFiatAccount | undefined =>
  accounts.value.find((account) => account.product === product);

const accountStatusLabels: Record<string, string> = {
  activated: "Activa",
  deactivated: "Desactivada",
};
const accountStatusLabel = (status?: string | null): string =>
  accountStatusLabels[status ?? ""] ?? "Estado no disponible";

const paymentRailLabels: Record<string, string> = {
  ach_push: "ACH",
  wire: "Transferencia bancaria",
  fednow: "FedNow",
  sepa: "SEPA",
};
const paymentRailLabel = (rail: string): string =>
  paymentRailLabels[rail] ?? "Otro medio disponible";

const selectedPaymentRails = computed(() => {
  const labels = (selected.value?.payment_rails ?? []).map(paymentRailLabel);

  return [...new Set(labels)].join(", ") || "No informados";
});

const errorMessage = (caught: unknown, fallback: string): string =>
  (caught as NormalizedApiError)?.message ?? fallback;

const loadAccounts = async () => {
  try {
    loading.value = true;
    const response = await getInternationalFiatAccounts();
    accounts.value = response.data.data;
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible consultar tus cuentas."),
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};

const activate = async (product: InternationalAccountProduct) => {
  if (
    depositsRestricted.value ||
    !approvedProducts.value.has(product) ||
    activating.value
  )
    return;
  try {
    activating.value = product;
    await runWithTwoFactor(async () => {
      await activateInternationalFiatAccount(product);
      helper.showNotify(`${productLabel(product)} activada correctamente.`);
      await loadAccounts();
    }, "finance.international_accounts");
  } catch (caught: unknown) {
    helper.showNotify(
      errorMessage(caught, "No fue posible activar la cuenta."),
      { type: "error" },
    );
  } finally {
    activating.value = null;
  }
};

const openDetail = async (account: InternationalAccountFiatAccount) => {
  try {
    detailOpen.value = true;
    detailLoading.value = true;
    selected.value = null;
    activity.value = [];
    const [detailResponse, activityResponse] = await Promise.all([
      getInternationalFiatAccount(account.id),
      getInternationalFiatAccountActivity(account.id, { per_page: 50 }),
    ]);
    selected.value = detailResponse.data.data;
    activity.value = activityResponse.data.data;
  } catch (caught: unknown) {
    detailOpen.value = false;
    helper.showNotify(
      errorMessage(caught, "No fue posible consultar la cuenta."),
      { type: "error" },
    );
  } finally {
    detailLoading.value = false;
  }
};

const formatDate = (value?: string | null): string =>
  value ? new Date(value).toLocaleString() : "Pendiente";

onMounted(loadAccounts);
</script>

<template>
  <section class="mt-6">
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-3">
      <div>
        <h2 class="text-h6 font-weight-bold">Cuentas para recibir fondos</h2>
        <p class="text-body-2 text-medium-emphasis mb-0">
          La activaci&oacute;n est&aacute; disponible por producto
          despu&eacute;s de la aprobaci&oacute;n del proveedor.
        </p>
      </div>
      <VBtn variant="text" :loading="loading" @click="loadAccounts"
        >Actualizar</VBtn
      >
    </div>

    <VAlert
      v-if="depositsRestricted"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Los nuevos dep&oacute;sitos est&aacute;n restringidos temporalmente por el
      proveedor.
    </VAlert>

    <VRow>
      <VCol v-for="product in products" :key="product" cols="12" md="6">
        <VCard variant="outlined" rounded="lg" height="100%">
          <VCardTitle class="d-flex align-center justify-space-between">
            {{ productLabel(product) }}
            <VChip
              size="small"
              :color="accountFor(product)?.can_receive ? 'success' : 'default'"
            >
              {{
                accountFor(product)
                  ? accountStatusLabel(accountFor(product)?.status)
                  : approvedProducts.has(product)
                    ? "Disponible"
                    : requestedProductSet.has(product)
                      ? "Pendiente"
                      : "No solicitada"
              }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <template v-if="accountFor(product)">
              <div class="text-caption text-medium-emphasis">
                Saldo disponible
              </div>
              <div class="text-h5 font-weight-bold mb-3">
                {{ accountFor(product)?.available_balance }}
                {{ accountFor(product)?.settlement_currency }}
              </div>
              <VAlert
                v-if="accountFor(product)?.deposits_restricted"
                type="warning"
                variant="tonal"
                class="mb-3"
              >
                El proveedor restringi&oacute; temporalmente la recepci&oacute;n
                de dep&oacute;sitos.
              </VAlert>
              <VBtn
                variant="tonal"
                :disabled="!accountFor(product)?.can_receive"
                @click="openDetail(accountFor(product)!)"
              >
                Ver datos para recibir
              </VBtn>
              <VBtn
                class="ml-2"
                variant="text"
                @click="openDetail(accountFor(product)!)"
              >
                Ver movimientos
              </VBtn>
            </template>
            <template v-else>
              <p class="text-body-2 mb-4">
                {{
                  approvedProducts.has(product)
                    ? depositsRestricted
                      ? "La activaci\u00f3n est\u00e1 restringida temporalmente por el proveedor."
                      : "El producto est\u00e1 aprobado y listo para activarse."
                    : requestedProductSet.has(product)
                      ? "El producto requiere aprobaci\u00f3n del proveedor."
                      : "Este producto todav\u00eda no ha sido solicitado."
                }}
              </p>
              <VBtn
                color="primary"
                :loading="activating === product"
                :disabled="
                  depositsRestricted ||
                  !approvedProducts.has(product) ||
                  activating !== null
                "
                @click="activate(product)"
              >
                Activar cuenta
              </VBtn>
            </template>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="detailOpen" max-width="820">
      <VCard rounded="lg">
        <VCardTitle class="d-flex justify-space-between align-center">
          {{
            selected ? productLabel(selected.product) : "Cuenta internacional"
          }}
          <VBtn icon="mdi-close" variant="text" @click="detailOpen = false" />
        </VCardTitle>
        <VProgressLinear v-if="detailLoading" indeterminate />
        <VCardText v-else-if="selected">
          <VAlert
            v-if="selected.deposits_restricted"
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            La recepci&oacute;n de fondos est&aacute; restringida temporalmente.
          </VAlert>
          <VAlert type="info" variant="tonal" class="mb-4">
            {{ selected.settlement_notice }}
          </VAlert>
          <VRow v-if="selected.can_receive">
            <VCol cols="12" sm="6">
              <VList density="compact">
                <VListItem
                  v-if="selected.deposit_instructions.bank_name"
                  title="Banco"
                  :subtitle="selected.deposit_instructions.bank_name"
                />
                <VListItem
                  v-if="selected.deposit_instructions.bank_address"
                  title="Direcci&oacute;n del banco"
                  :subtitle="selected.deposit_instructions.bank_address"
                />
                <VListItem
                  v-if="selected.deposit_instructions.beneficiary_name"
                  title="Beneficiario"
                  :subtitle="selected.deposit_instructions.beneficiary_name"
                />
                <VListItem
                  v-if="selected.deposit_instructions.beneficiary_address"
                  title="Direcci&oacute;n del beneficiario"
                  :subtitle="selected.deposit_instructions.beneficiary_address"
                />
                <VListItem
                  v-if="selected.deposit_instructions.account_number"
                  title="N&uacute;mero de cuenta"
                  :subtitle="selected.deposit_instructions.account_number"
                />
                <VListItem
                  v-if="selected.deposit_instructions.routing_number"
                  title="N&uacute;mero de ruta bancaria"
                  :subtitle="selected.deposit_instructions.routing_number"
                />
                <VListItem
                  v-if="selected.deposit_instructions.iban"
                  title="IBAN"
                  :subtitle="selected.deposit_instructions.iban"
                />
                <VListItem
                  v-if="selected.deposit_instructions.bic"
                  title="BIC / SWIFT"
                  :subtitle="selected.deposit_instructions.bic"
                />
              </VList>
            </VCol>
            <VCol cols="12" sm="6">
              <div class="text-caption text-medium-emphasis">
                Saldo disponible
              </div>
              <div class="text-h5 font-weight-bold mb-3">
                {{ selected.available_balance }}
                {{ selected.settlement_currency }}
              </div>
              <div v-if="selected.payment_rails.length" class="text-body-2">
                Medios habilitados: {{ selectedPaymentRails }}
              </div>
              <div class="text-caption text-medium-emphasis mt-4">
                {{ selected.provider_notice }}
              </div>
            </VCol>
          </VRow>
          <VAlert v-else type="warning" variant="tonal">
            Los datos para recibir fondos no est&aacute;n disponibles mientras
            la cuenta permanezca restringida o desactivada.
          </VAlert>

          <VDivider class="my-5" />
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Movimientos</h3>
          <VTable density="compact">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="activity.length === 0">
                <td colspan="3" class="text-center text-medium-emphasis py-5">
                  Sin movimientos.
                </td>
              </tr>
              <tr v-for="event in activity" :key="event.id">
                <td>{{ event.label }}</td>
                <td>{{ event.amount }} {{ event.currency }}</td>
                <td>{{ formatDate(event.created_at) }}</td>
              </tr>
            </tbody>
          </VTable>
        </VCardText>
      </VCard>
    </VDialog>
  </section>
</template>
