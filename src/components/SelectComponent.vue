<template>
  <slot name="label">
    <VLabel
      :for="controlId"
      class="pl-3 text-capitalize font-weight-light text-table"
      :class="classLabel"
      >{{ name }}</VLabel
    >
  </slot>
  <VResponsive
    class="v-text-field__slot"
    @click="menu = true"
    :style="{
      height,
    }"
  >
    <VAutocomplete
      :id="controlId"
      variant="filled"
      :items="itemsWithSelectable"
      class="ma-0 pa-0"
      hide-details
      single-line
      style="max-height: 40px"
      density="compact"
      :name="name"
      v-model="modelValue"
      :rules="rules"
      :disabled="disabled"
      :multiple="multiple ?? false"
      :item-title="itemTitle"
      :item-value="itemValue"
      :menu="menu"
      :menu-props="menuProps"
      no-data-text="No hay resultados"
    >
      <template #item="{ props }">
        <!-- Aquí propagamos TODO: -->
        <VListItem
          v-bind="props"
          class="text-primary"
          @click="!disabled && selectItem(props.value)"
        >
        </VListItem>
      </template>
    </VAutocomplete>
  </VResponsive>
  <div class="w-100 text-center ma-0 pa-0">
    <VLabel v-if="errors" class="text-error ml-5 font-weight-bold">
      {{ errors }}
    </VLabel>
  </div>
</template>

<script setup lang="ts">
import { helperStore } from "@/helper";
import { ref, computed, toRefs, useId } from "vue";

const menu = ref(false);
const emits = defineEmits(["update:model-value"]);
interface SelectComponentProps {
  modelValue: any;
  items: any[];
  name: string;
  rules?: any | any[];
  type?: string;
  itemValue: string;
  itemTitle: string;
  multiple?: boolean;
  disabled?: boolean;
  classLabel?: string | string[];
  height?: any;
  'menu-props'?: any;
  style?: string | object;
  id?: string;
}
const props = defineProps<SelectComponentProps>();
const menuProps = computed(() => props['menu-props']);
const { modelValue, items } = toRefs(props);
const generatedId = useId();
const controlId = computed(() => props.id ?? `select-${generatedId}`);
// const modelValue = ref<any>()
const helper = helperStore();

const selectedItem = () => {
  let item: any = {
    id: "",
    attributes: {},
  };

  const name = props.itemTitle.split(".");
  item.attributes[name[name.length - 1]] = "Seleccione...";

  return item;
};

const itemsWithSelectable = computed(() => {
  return items.value;
});

if (!items.value?.find((e) => e.id == "")) {
  items.value?.unshift(selectedItem());
}
const errors = computed(() => {
  const errors = helper.formRef?.errors as ErrorType[] | null;
  if (!errors) return false;

  const errorIn = errors.find((err) => err.id == props.name);
  if (!errorIn) return false;

  return errorIn.errorMessages[0];
});

const selectItem = (value: any) => {
  if (props.multiple) {
    emits("update:model-value", value);
    menu.value = false;
  }
  menu.value = false;
  // emits('update:model-value',{...modelValue.value})
  emits("update:model-value", value);
  // emits('update:model-value',{...modelValue.value,value})
};

const activeItem = (value: any): boolean => {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.some((item: string | number) => item === value);
  }
  return props.modelValue == value;
};
interface ErrorType {
  id: string;
  errorMessages: string[];
}
</script>
