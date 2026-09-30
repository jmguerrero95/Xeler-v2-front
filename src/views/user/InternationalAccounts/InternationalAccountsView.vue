<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { helperStore } from "@/helper";
import type {
  InternationalAccountClientState,
  InternationalAccountOnboarding,
  InternationalAccountOnboardingState,
} from "@/interfaces/InternationalAccounts/InternationalAccounts.model";
import type { NormalizedApiError } from "@/services/apiErrors";
import {
  addInternationalAccountProducts,
  getInternationalAccountAccess,
  getInternationalAccountOnboarding,
  requestInternationalAccountAccess,
  startInternationalAccountOnboarding,
} from "@/services/internationalAccountsApi";
import {
  internationalProductStatusLabel,
  internationalProviderStatusLabel,
  internationalRequirementLabel,
  internationalTosStatusLabel,
} from "@/utils/internationalAccountsLabels";
import InternationalFiatAccountsPanel from "./components/InternationalFiatAccountsPanel.vue";
import InternationalOutboundPanel from "./components/InternationalOutboundPanel.vue";

const helper = helperStore();
const loading = ref(true);
const submitting = ref(false);
const activating = ref(false);
const addingProduct = ref<"usd" | "eur" | null>(null);
const state = ref<InternationalAccountClientState | null>(null);
const onboardingState = ref<InternationalAccountOnboardingState | null>(null);
const onboarding = ref<InternationalAccountOnboarding | null>(null);
const kycUrl = ref<string | null>(null);
const tosUrl = ref<string | null>(null);
const pollingRequest = ref(false);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
const form = reactive({
  requested_products: [] as Array<"usd" | "eur">,
  use_case: "",
  expected_monthly_volume: "",
  expected_monthly_volume_currency: "usd" as "usd" | "eur",
});

const canSubmit = computed(
  () =>
    state.value?.can_request &&
    form.requested_products.length > 0 &&
    form.use_case.trim().length >= 3 &&
    /^(?:0*[1-9]\d*)(?:\.\d{1,8})?$/.test(form.expected_monthly_volume),
);

const stopPolling = () => {
  if (pollingTimer !== null) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

const startPolling = () => {
  if (
    pollingTimer !== null ||
    document.hidden ||
    !onboardingState.value?.polling_enabled ||
    !onboarding.value ||
    onboarding.value?.is_terminal
  )
    return;

  pollingTimer = setInterval(() => void loadOnboarding(true), 12_000);
};

const loadOnboarding = async (silent = false) => {
  if (pollingRequest.value) return;
  try {
    pollingRequest.value = true;
    const response = await getInternationalAccountOnboarding();
    onboardingState.value = response.data.data;
    onboarding.value = response.data.data.onboarding ?? null;
    if (onboarding.value?.is_terminal) stopPolling();
    else startPolling();
  } catch (caught: unknown) {
    if (!silent) {
      const error = caught as NormalizedApiError;
      helper.showNotify(
        error?.message ?? "No fue posible consultar el estado de activación.",
        { type: "error" },
      );
    }
  } finally {
    pollingRequest.value = false;
  }
};

const load = async (includeOnboarding = true) => {
  try {
    loading.value = true;
    const response = await getInternationalAccountAccess();
    state.value = response.data.data;
    if (state.value.status === "approved" && includeOnboarding)
      await loadOnboarding(true);
    else stopPolling();
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible consultar Cuentas Internacionales.",
      { type: "error" },
    );
  } finally {
    loading.value = false;
  }
};

const startActivation = async () => {
  if (!onboardingState.value?.can_start || activating.value) return;
  try {
    activating.value = true;
    const response = await startInternationalAccountOnboarding();
    onboarding.value = response.data.data.onboarding;
    kycUrl.value = response.data.data.kyc_url ?? null;
    tosUrl.value = response.data.data.tos_url ?? null;
    helper.showNotify("Activación iniciada correctamente.");
    startPolling();
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(
      error?.message ?? "No fue posible iniciar la activación.",
      { type: "error" },
    );
  } finally {
    activating.value = false;
  }
};

const handleVisibility = () => {
  if (document.hidden) {
    stopPolling();
    return;
  }
  if (state.value?.status === "approved") void loadOnboarding(true);
};

const productName = (product: "usd" | "eur"): string =>
  product === "usd" ? "Cuenta USD" : "Cuenta EUR";

const pendingProduct = computed(() => {
  const pending = (onboarding.value?.endorsements ?? []).filter(
    (item) =>
      !["approved", "active", "rejected", "offboarded"].includes(item.status),
  );

  return pending.length === 1 ? pending[0].product : null;
});
const activationLabel = computed(() =>
  pendingProduct.value
    ? `Continuar activación de ${productName(pendingProduct.value)}`
    : onboarding.value
      ? "Continuar activación"
      : "Iniciar activación",
);

const formatDate = (value?: string | null): string =>
  value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "";

const submit = async () => {
  if (!canSubmit.value) return;
  try {
    submitting.value = true;
    await requestInternationalAccountAccess({
      requested_products: [...new Set(form.requested_products)],
      use_case: form.use_case.trim(),
      expected_monthly_volume: form.expected_monthly_volume,
      expected_monthly_volume_currency: form.expected_monthly_volume_currency,
    });
    helper.showNotify("Solicitud enviada para revisión.");
    await load();
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(error?.message ?? "No fue posible enviar la solicitud.", {
      type: "error",
    });
  } finally {
    submitting.value = false;
  }
};

const addProduct = async (product: "usd" | "eur") => {
  if (!state.value?.can_add_products || addingProduct.value) return;
  try {
    addingProduct.value = product;
    await addInternationalAccountProducts([product]);
    helper.showNotify(
      `${productName(product)} agregada a tu proceso de activación.`,
    );
    await load(false);
    await loadOnboarding(true);
  } catch (caught: unknown) {
    const error = caught as NormalizedApiError;
    helper.showNotify(error?.message ?? "No fue posible agregar la cuenta.", {
      type: "error",
    });
  } finally {
    addingProduct.value = null;
  }
};

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibility);
  void load();
});
onUnmounted(() => {
  stopPolling();
  document.removeEventListener("visibilitychange", handleVisibility);
});
</script>

<template>
  <div class="pa-4 international-accounts-view">
    <VCard max-width="880" class="mx-auto" rounded="lg">
      <VCardTitle class="text-h5 font-weight-bold pa-6 pb-2"
        >Cuentas Internacionales</VCardTitle
      >
      <VCardSubtitle class="px-6 pb-4"
        >Cuenta USD y Cuenta EUR para clientes elegibles de
        Xeler.</VCardSubtitle
      >
      <VProgressLinear v-if="loading" indeterminate />
      <VCardText v-else class="pa-6 pt-2">
        <VAlert
          v-if="!state?.feature_enabled"
          type="info"
          variant="tonal"
          class="mb-5"
        >
          {{
            state?.public_message ||
            "Este servicio no está disponible temporalmente."
          }}
        </VAlert>

        <template v-else-if="state?.status === 'not_eligible'">
          <VAlert type="info" variant="tonal">
            Este servicio está disponible para clientes elegibles de Xeler. Si
            necesitas una cuenta internacional, puedes contactar a soporte para
            solicitar una evaluación.
          </VAlert>
        </template>

        <template v-else-if="state?.status === 'eligible'">
          <VAlert type="success" variant="tonal" class="mb-5">
            Has sido habilitado para solicitar Cuentas Internacionales.
          </VAlert>
          <VRow>
            <VCol cols="12">
              <div class="text-subtitle-2 mb-2">Productos solicitados</div>
              <VCheckbox
                v-if="state.available_products.includes('usd')"
                v-model="form.requested_products"
                label="Cuenta USD"
                value="usd"
                hide-details
              />
              <VCheckbox
                v-if="state.available_products.includes('eur')"
                v-model="form.requested_products"
                label="Cuenta EUR"
                value="eur"
                hide-details
              />
            </VCol>
            <VCol cols="12"
              ><VTextarea
                v-model="form.use_case"
                label="Uso previsto"
                maxlength="500"
                counter
                rows="3"
            /></VCol>
            <VCol cols="12" md="8"
              ><VTextField
                v-model="form.expected_monthly_volume"
                label="Volumen mensual estimado"
                inputmode="decimal"
            /></VCol>
            <VCol cols="12" md="4">
              <VSelect
                v-model="form.expected_monthly_volume_currency"
                label="Moneda"
                :items="[
                  { title: 'USD', value: 'usd' },
                  { title: 'EUR', value: 'eur' },
                ]"
              />
            </VCol>
          </VRow>
          <div class="d-flex justify-end">
            <VBtn
              color="primary"
              :loading="submitting"
              :disabled="!canSubmit"
              @click="submit"
              >Solicitar acceso</VBtn
            >
          </div>
        </template>

        <VAlert
          v-else-if="
            ['requested', 'under_review'].includes(state?.status || '')
          "
          type="info"
          variant="tonal"
        >
          Tu solicitud está en revisión.
        </VAlert>
        <template v-else-if="state?.status === 'approved'">
          <VAlert type="success" variant="tonal" class="mb-5">
            Tu solicitud fue aprobada por Xeler. Ahora puedes continuar con la
            verificación independiente del proveedor.
          </VAlert>

          <VCard
            v-if="state.can_add_products"
            variant="outlined"
            rounded="lg"
            class="mb-5"
          >
            <VCardTitle>Agregar otra cuenta</VCardTitle>
            <VCardText>
              <div
                v-for="product in state.missing_products"
                :key="product"
                class="d-flex flex-wrap align-center justify-space-between ga-3"
              >
                <div>
                  <div class="font-weight-bold">{{ productName(product) }}</div>
                  <div class="text-body-2 text-medium-emphasis">
                    Solicita la habilitación de {{ productName(product) }} sin
                    afectar tu
                    {{ product === "eur" ? "Cuenta USD" : "Cuenta EUR" }}.
                  </div>
                </div>
                <VBtn
                  color="primary"
                  variant="tonal"
                  :loading="addingProduct === product"
                  :disabled="addingProduct !== null"
                  @click="addProduct(product)"
                >
                  Solicitar {{ productName(product) }}
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <VCard variant="outlined" rounded="lg">
            <VCardTitle>Activación de Cuentas Internacionales</VCardTitle>
            <VCardText>
              <p class="mb-4">
                Bridge debe verificar tu identidad y aprobar por separado cada
                producto solicitado. La aprobación de Xeler no reemplaza este
                proceso.
              </p>

              <VBtn
                v-if="onboardingState?.can_start && !onboarding?.is_terminal"
                color="primary"
                :loading="activating"
                class="mb-5"
                @click="startActivation"
              >
                {{ activationLabel }}
              </VBtn>

              <div v-if="kycUrl || tosUrl" class="d-flex flex-wrap ga-3 mb-5">
                <VBtn
                  v-if="tosUrl"
                  :href="tosUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="tonal"
                >
                  Aceptar términos de Bridge
                </VBtn>
                <VBtn
                  v-if="kycUrl"
                  :href="kycUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="tonal"
                >
                  Completar verificación de identidad
                </VBtn>
              </div>

              <template v-if="onboarding">
                <VAlert
                  v-if="onboarding.provider_status === 'rejected'"
                  type="warning"
                  variant="tonal"
                  class="mb-4"
                >
                  La verificación no fue aprobada por el proveedor. Si necesitas
                  más información, contacta a soporte.
                </VAlert>
                <VAlert
                  v-else-if="onboarding.provider_status === 'paused'"
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  La activación está temporalmente en revisión por parte del
                  proveedor.
                </VAlert>
                <VAlert
                  v-else-if="onboarding.provider_status === 'offboarded'"
                  type="warning"
                  variant="tonal"
                  class="mb-4"
                >
                  El proveedor ha cerrado el acceso a este servicio. Contacta a
                  soporte si necesitas información adicional.
                </VAlert>

                <VList density="compact" class="mb-4">
                  <VListItem
                    title="Estado general"
                    :subtitle="
                      internationalProviderStatusLabel(
                        onboarding.provider_status,
                      )
                    "
                  />
                  <VListItem
                    title="Verificación de identidad"
                    :subtitle="
                      internationalProviderStatusLabel(onboarding.kyc_status)
                    "
                  />
                  <VListItem
                    title="Términos de servicio"
                    :subtitle="
                      internationalTosStatusLabel(onboarding.tos_status)
                    "
                  />
                </VList>

                <VRow>
                  <VCol
                    v-for="product in onboarding.endorsements"
                    :key="product.product"
                    cols="12"
                    md="6"
                  >
                    <VCard variant="tonal" height="100%">
                      <VCardTitle>{{
                        productName(product.product)
                      }}</VCardTitle>
                      <VCardText>
                        <div class="mb-2">
                          Estado de habilitación:
                          <strong>{{
                            internationalProductStatusLabel(product.status)
                          }}</strong>
                        </div>
                        <ul
                          v-if="product.requirement_codes.length"
                          class="pl-5 mb-2"
                        >
                          <li
                            v-for="code in product.requirement_codes"
                            :key="code"
                          >
                            {{ internationalRequirementLabel(code) }}
                          </li>
                        </ul>
                        <div
                          v-if="product.future_requirements_effective_at"
                          class="text-body-2 text-medium-emphasis"
                        >
                          Se requerirá información adicional antes del
                          {{
                            formatDate(
                              product.future_requirements_effective_at,
                            )
                          }}.
                        </div>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </template>
            </VCardText>
          </VCard>
          <InternationalFiatAccountsPanel
            :onboarding="onboarding"
            :requested-products="state.requested_products"
          />
          <InternationalOutboundPanel />
        </template>
        <VAlert
          v-else-if="state?.status === 'rejected'"
          type="warning"
          variant="tonal"
        >
          La solicitud no fue aprobada. Contacta a soporte si necesitas más
          información.
        </VAlert>
        <VAlert
          v-else-if="state?.status === 'suspended'"
          type="warning"
          variant="tonal"
        >
          El acceso a Cuentas Internacionales está suspendido. Contacta a
          soporte si necesitas información.
        </VAlert>

        <VDivider class="my-6" />
        <p class="text-caption text-medium-emphasis mb-0">
          Este servicio utiliza infraestructura financiera proporcionada por
          Bridge y proveedores asociados. La activación final está sujeta a los
          procesos de verificación y aprobación aplicables.
        </p>
      </VCardText>
    </VCard>
  </div>
</template>
