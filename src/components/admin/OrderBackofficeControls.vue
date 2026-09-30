<template>
  <section class="backoffice-controls" aria-label="Administracion de la orden">
    <VAlert v-if="actions.read_only_by_assignment" type="info" variant="tonal">
      La orden esta asignada a otro administrador. Modo lectura.
    </VAlert>
    <div class="d-flex flex-wrap ga-2">
      <VBtn v-if="actions.can_take" data-test="take" @click="run('take')"
        >Tomar</VBtn
      >
      <VBtn
        v-if="actions.can_release"
        data-test="release"
        variant="outlined"
        @click="open('release')"
        >Liberar</VBtn
      >
      <VBtn
        v-if="actions.can_transfer"
        data-test="transfer"
        variant="outlined"
        @click="open('transfer')"
        >Ceder</VBtn
      >
      <VBtn
        v-if="actions.can_reassign"
        data-test="reassign"
        variant="outlined"
        @click="open('reassign')"
        >Reasignar</VBtn
      >
    </div>
    <VDialog v-model="dialog" max-width="480">
      <VCard title="Confirmar accion administrativa">
        <VCardText>
          <VTextField
            v-if="selected === 'transfer' || selected === 'reassign'"
            v-model.number="targetAdminId"
            label="ID administrador destino"
            type="number"
          />
          <VTextarea
            v-model="reason"
            label="Motivo obligatorio"
            counter="1000"
          />
          <VAlert v-if="error" type="error" variant="tonal">{{ error }}</VAlert>
        </VCardText>
        <VCardActions>
          <VBtn variant="text" @click="dialog = false">Cancelar</VBtn>
          <VBtn
            data-test="confirm"
            :disabled="!canConfirm || loading"
            @click="confirm"
            >Confirmar</VBtn
          >
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { computed, ref } from "vue";
import {
  runOrderAssignmentAction,
  type AssignmentAction,
} from "@/services/orderBackofficeApi";

interface Actions {
  can_take?: boolean;
  can_release?: boolean;
  can_transfer?: boolean;
  can_reassign?: boolean;
  read_only_by_assignment?: boolean;
}

const props = defineProps<{ orderId: number; actions?: Actions }>();
const emit = defineEmits<{ refreshed: [] }>();
const actions = computed(() => props.actions ?? {});
const dialog = ref(false);
const selected = ref<AssignmentAction>("release");
const reason = ref("");
const targetAdminId = ref<number>();
const loading = ref(false);
const error = ref("");
const canConfirm = computed(
  () =>
    reason.value.trim().length >= 3 &&
    (!["transfer", "reassign"].includes(selected.value) ||
      Boolean(targetAdminId.value)),
);

const open = (action: AssignmentAction) => {
  selected.value = action;
  reason.value = "";
  targetAdminId.value = undefined;
  error.value = "";
  dialog.value = true;
};

const run = async (action: AssignmentAction) => {
  loading.value = true;
  error.value = "";
  try {
    await authorizeWithTwoFactor(runOrderAssignmentAction.bind(undefined, props.orderId, action, {}), "finance.order_admin");
    emit("refreshed");
  } catch {
    error.value = "No fue posible completar la accion.";
  } finally {
    loading.value = false;
  }
};

const confirm = async () => {
  if (!canConfirm.value) return;
  loading.value = true;
  error.value = "";
  try {
    await authorizeWithTwoFactor(runOrderAssignmentAction.bind(undefined, props.orderId, selected.value, {
      reason: reason.value.trim(),
      target_admin_id: targetAdminId.value,
    }), "finance.order_admin");
    dialog.value = false;
    emit("refreshed");
  } catch {
    error.value = "No fue posible completar la accion.";
  } finally {
    loading.value = false;
  }
};
</script>
