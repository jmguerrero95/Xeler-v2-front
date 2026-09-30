<template>
  <div
    class="d-flex justify-center my-6"
    id="container-img-kyc"
    :class="{
      disabled,
    }"
  >
    <div
      id="img"
      @click="click"
      class="v-text-field__slot px-4 py-3 border-md cursor-pointer"
      :style="[
        `max-width: ${sizeImage ?? 284}px`,
        `min-width: ${sizeImage ?? 284}px`,
      ]"
    >
      <span v-html="label ?? ''"></span>
      <span v-if="!input" :class="classInput" :style="styleInput">
        <VIcon size="57" color="primary" :icon="UploadIcon"> </VIcon>
        <p
          class="text-table"
          :class="classText"
          :style="styleText"
          style="font-size: 17px"
          v-html="text"
        ></p>
      </span>
      <VImg
        v-else
        :src="img"
        width="100%"
        :max-height="250"
        class="mx-auto"
      ></VImg>
    </div>
    <div v-if="image" name="kyc" class="mx-4 my-auto">
      <VImg :src="image" height="150" width="145"></VImg>
    </div>
    <div style="display: none">
      <input type="file" ref="refInput" @change="changeInput" />
    </div>
  </div>
</template>

<script setup lang="ts">
import UploadIcon from "@/assets/icons/kyc/UploadIcon.vue";
import { helperStore } from "@/helper";
import { ref, toRefs } from "vue";
import { useI18n } from "vue-i18n";

const click = (): void => {
  if (!props.disabled) {
    uploadImage();
  }
};
const helper = helperStore();
const { t } = useI18n();
const emits = defineEmits<(e: "update:model-value", value: Blob) => void>();
const props = defineProps<{
  image?: string;
  text: string;
  modelValue: string | Blob;
  label?: string;
  sizeImage?: number;
  classText?: string[];
  styleText?: string[];
  classInput?: string[];
  styleInput?: string[];
  disabled?: boolean;
}>();
const { modelValue: input } = toRefs(props);

const img = ref();
if (typeof input.value == "string") {
  img.value = input.value;
}
const refInput = ref<HTMLInputElement>();

const uploadImage = () => {
  if (refInput.value) {
    refInput.value.click();
  }
};

const changeInput = () => {
  let acceptTypes = [".jpeg", ".jpg", ".png", ".gif", ".svg", ".ico"];
  let fileName = refInput.value?.files?.[0]?.name ?? "";
  let fileExtension = fileName.substring(fileName.lastIndexOf("."));

  if (!acceptTypes.includes(fileExtension.toLowerCase())) {
    helper.showNotify(t("commons.invalid-format"), { type: "error" });
    return;
  }
  // let acceptTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg', 'image/ico']

  // if (!acceptTypes.includes(refInput.value!.files![0].type)) {
  //     helper.showNotify(t('commons.invalid-format'), { type: 'error' })
  //     return
  // }
  if (refInput.value && refInput.value.files && refInput.value.files[0]) {
    img.value = URL.createObjectURL(refInput.value.files[0]);
  }
  if (refInput.value && refInput.value.files && refInput.value.files[0]) {
    emits("update:model-value", refInput.value.files[0]);
  }
};
</script>

<style scoped>
@media (max-width: 800px) {
  #container-img-kyc {
    flex-flow: column;
    align-items: center;
    gap: 20px;
  }

  #container-img-kyc > #img {
    order: 2;
  }

  #container-img-kyc > #kyc {
    order: 1;
  }
}
</style>
