<template>
  <div v-if="voucher" class="text-center mt-3">
    <VBtn
      color="primary"
      variant="outlined"
      prepend-icon="mdi-download"
      :loading="downloading"
      @click="download"
    >
      Descargar comprobante
    </VBtn>
    <div v-if="errorMessage" class="text-error text-caption mt-2">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Image } from "@/interfaces/Image.model";
import { downloadAuthenticatedBlob } from "@/services/apiClient";
import { computed, ref } from "vue";

const props = defineProps<{
  images?: Image[];
}>();

const downloading = ref(false);
const errorMessage = ref("");
const voucher = computed(() =>
  props.images?.find((image) => image.attributes.download_url),
);

const download = async (): Promise<void> => {
  const url = voucher.value?.attributes.download_url;
  if (!url || downloading.value) return;

  downloading.value = true;
  errorMessage.value = "";
  try {
    await downloadAuthenticatedBlob(
      url,
      voucher.value?.attributes.filename || "comprobante",
    );
  } catch {
    errorMessage.value = "No fue posible descargar el comprobante.";
  } finally {
    downloading.value = false;
  }
};
</script>
