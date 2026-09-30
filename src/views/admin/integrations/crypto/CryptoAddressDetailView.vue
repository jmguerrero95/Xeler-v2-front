<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { helperStore } from "@/helper";
import CopyComponent from "@/components/CopyComponent.vue";
import type { CryptoAddress } from "@/interfaces/Crypto/Crypto.model";
import { getCryptoAddress } from "@/services/cryptoAddressesApi";
import { getPayload } from "@/utils/pagination";
import JsonViewer from "@/views/admin/operability/components/JsonViewer.vue";
import StatusChip from "@/views/admin/operability/components/StatusChip.vue";

const props = defineProps<{ id: string | number }>();
const router = useRouter();
const helper = helperStore();
const loading = ref(false);
const address = ref<CryptoAddress | null>(null);
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "-";

const load = async () => {
  try {
    loading.value = true;
    const res = await getCryptoAddress(props.id);
    address.value = getPayload<CryptoAddress>(res);
  } catch (error: any) {
    helper.showNotify(error?.message ?? "No fue posible cargar la direccion crypto", { type: "error" });
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="pa-4">
    <div class="d-flex align-center justify-space-between mb-4 ga-3">
      <h1 class="text-h5 font-weight-bold mb-0">Crypto Address</h1>
      <VBtn variant="text" prepend-icon="mdi-arrow-left" @click="router.back()">Volver</VBtn>
    </div>

    <VCard rounded="lg" class="pa-4">
      <div v-if="loading" class="text-center py-8"><VProgressCircular indeterminate /></div>
      <VRow v-else-if="address">
        <VCol cols="12" md="6">
          <VList density="compact">
            <VListItem title="Provider" :subtitle="address.provider || '-'" />
            <VListItem title="Currency" :subtitle="address.currency || '-'" />
            <VListItem title="Network" :subtitle="address.network || '-'" />
            <VListItem title="Status"><template #subtitle><StatusChip :value="address.status" /></template></VListItem>
            <VListItem title="Order" :subtitle="String(address.order_id ?? '-')" />
            <VListItem title="User" :subtitle="String(address.user_id ?? '-')" />
            <VListItem title="Assigned at" :subtitle="formatDate(address.assigned_at)" />
            <VListItem title="Used at" :subtitle="formatDate(address.used_at)" />
          </VList>
        </VCol>
        <VCol cols="12" md="6">
          <div class="text-subtitle-2 text-primary mb-2">Address</div>
          <div class="d-flex align-center ga-2 bg-grey-lighten-4 pa-3 rounded mb-4">
            <span class="text-break">{{ address.address || "-" }}</span>
            <CopyComponent v-if="address.address" :value="address.address" />
          </div>
          <div class="text-subtitle-2 text-primary mb-2">Metadata</div>
          <JsonViewer :value="address.metadata || {}" collapsed max-height="320px" />
        </VCol>
      </VRow>
      <div v-else class="text-center py-8 text-medium-emphasis">Direccion no encontrada.</div>
    </VCard>
  </div>
</template>
