<template>
  <div class="mt-3 text-center">
    <VBtn variant="outlined" rounded="xl" @click="showCamera = !showCamera">
      Escanear QR
    </VBtn>
    <div v-if="showCamera" class="center stream">
      <QrcodeStream @detect="qrDecode" class="my-3">
        <div class="frame"></div>
      </QrcodeStream>
    </div>
  </div>

  <div class="w-100 mt-5">
    <VMenu v-model="openUsers">
      <template #activator="{ props }">
        <VLabel class="pl-3 text-table">Usuario o nombre</VLabel>
        <VTextField
          v-model="searchUser"
          v-bind="props"
          rounded="xl"
          density="compact"
          hide-details
          @keyup.enter="getUser"
        >
          <template #append-inner>
            <VIcon
              class="cursor-pointer"
              icon="mdi-account-search"
              color="primary"
              @click="getUser"
            />
          </template>
        </VTextField>
      </template>
      <VCard min-width="250" elevation="10" class="rounded-xl">
        <VList v-if="users.length">
          <VListItem
            v-for="user in users"
            :key="user.recipient_reference"
            :title="user.username"
            :subtitle="user.display_name"
            @click="selectRecipient(user)"
          />
        </VList>
      </VCard>
    </VMenu>

    <VAlert v-if="selectedRecipient" class="my-3" density="compact" variant="tonal">
      {{ selectedRecipient.display_name }} · {{ shortReference }}
    </VAlert>

    <InputComponentVue
      name="Cantidad a enviar"
      v-model="form.amount"
      :events="eventsXcop"
      appendText="XCOP"
    />
    <VTextField
      v-model="form.note"
      class="mt-3"
      label="Nota opcional"
      maxlength="140"
      rounded="xl"
      hide-details
    />
  </div>

  <div class="text-center mt-6">
    <VBtnPrimary :disabled="!canSend" @click="requestTwoFactor">Enviar</VBtnPrimary>
  </div>
</template>

<script setup lang="ts">
import InputComponentVue from "@/components/InputComponent.vue";
import { helperStore } from "@/helper";
import type { EventComponent } from "@/interfaces/Components.helper";
import { computed, reactive, ref } from "vue";
import dayjs from "dayjs";
import { QrcodeStream } from "vue-qrcode-reader";
import { TwoFactorAuthStore } from "@/stores/TwoFactorAuthStore";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { normalizeDecimalStrict, normalizeUnsignedDecimalInput } from "@/utils/decimal";
import { XcopStore } from "@/stores/XcopStore";

interface XcopRecipient {
  recipient_reference: string;
  username: string;
  display_name: string;
}

interface XcopQr {
  schema: "xeler-xcop";
  version: 1;
  recipient_reference: string;
  amount?: string | null;
  currency: "XCOP";
}

const emit = defineEmits<{
  (e: "send", value: {
    user: string;
    amount: string;
    date: string;
    number_transaction: string;
  }): void;
  (e: "changed"): void;
}>();
const helper = helperStore();
const twoFactor = TwoFactorAuthStore();
const xcop = XcopStore();
const showCamera = ref(false);
const openUsers = ref(false);
const searchUser = ref("");
const users = ref<XcopRecipient[]>([]);
const selectedRecipient = ref<XcopRecipient | null>(null);
const form = reactive({ recipient_reference: "", amount: "", note: "" });

const shortReference = computed(() => {
  const value = selectedRecipient.value?.recipient_reference ?? "";
  return value ? `${value.slice(0, 8)}...${value.slice(-4)}` : "";
});
const canSend = computed(() => Boolean(
  xcop.summary?.transfers_enabled && form.recipient_reference && form.amount
));

const eventsXcop: EventComponent = {
  keypress: (event: KeyboardEvent) => {
    if (!/^\d$/.test(event.key)
      && !["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", ".", ","].includes(event.key)) {
      event.preventDefault();
    }
  },
  keyup: () => {
    form.amount = normalizeUnsignedDecimalInput(
      form.amount,
      xcop.summary?.decimals ?? 18,
    );
  },
};

const getUser = async () => {
  selectedRecipient.value = null;
  form.recipient_reference = "";
  const query = searchUser.value.trim();
  if (query.length < 3) {
    users.value = [];
    return;
  }
  const response = await helper.http("users/xcop-recipients", "get", {
    params: { query },
  });
  users.value = (response.data.data ?? []).slice(0, 3);
  openUsers.value = true;
};

const selectRecipient = (recipient: XcopRecipient) => {
  selectedRecipient.value = recipient;
  form.recipient_reference = recipient.recipient_reference;
  searchUser.value = recipient.username;
  openUsers.value = false;
};

const qrDecode = (values: Array<{ format: string; rawValue: string }>) => {
  const detected = values?.[0];
  if (!detected || detected.format !== "qr_code") return;
  try {
    const qr = JSON.parse(detected.rawValue) as Partial<XcopQr>;
    if (
      qr.schema !== "xeler-xcop" ||
      qr.version !== 1 ||
      qr.currency !== "XCOP" ||
      typeof qr.recipient_reference !== "string"
    ) {
      throw new Error("XCOP_QR_INVALID");
    }
    selectedRecipient.value = {
      recipient_reference: qr.recipient_reference,
      username: "Referencia XCOP",
      display_name: "Destinatario verificado por referencia",
    };
    form.recipient_reference = qr.recipient_reference;
    searchUser.value = "Referencia XCOP";
    form.amount = qr.amount
      ? normalizeUnsignedDecimalInput(qr.amount, xcop.summary?.decimals ?? 18)
      : "";
    showCamera.value = false;
  } catch {
    helper.showNotify("El QR XCOP no es válido.", { type: "error" });
  }
};

const requestTwoFactor = () => {
  twoFactor.modal = true;
  twoFactor.newFlow = true;
  twoFactor.callback = { fn: completeSend };
  twoFactor.requestedScope = "finance.xcop";
};

const completeSend = async () => {
  const data = {
    recipient_reference: form.recipient_reference,
    amount: normalizeDecimalStrict(form.amount),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
  };
  const scope = "send-xcop";
  const response = await helper.http("users/send/xcop", "post", { data }, "", false, {
    idempotent: true,
    idempotencyKey: createOperationKey(scope, data),
    financialScope: "finance.xcop",
  });
  clearOperationKey(scope);
  const details = response.data.details;
  helper.showNotify("XCOP enviados correctamente", { type: "success" });
  emit("send", {
    amount: String(details.attributes.quantity),
    date: dayjs(details.attributes.created_at).format("YYYY-MM-DD | HH:mm"),
    number_transaction: details.attributes.public_reference,
    user: selectedRecipient.value?.display_name ?? "Destinatario XCOP",
  });
  form.recipient_reference = "";
  form.amount = "";
  form.note = "";
  searchUser.value = "";
  selectedRecipient.value = null;
  emit("changed");
};
</script>

<style scoped lang="scss">
.stream {
  max-height: 500px;
  max-width: 500px;
  margin: auto;
}
.frame {
  border: 2px solid #5043e8;
  height: 200px;
  width: 200px;
  position: absolute;
  inset: 0;
  margin: auto;
}
</style>
