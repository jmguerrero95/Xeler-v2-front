<template>
    <VForm
        ref="formRef"
        :readonly="helper.clickIn == 'Show'"
        enctype="multipart/form-data"
        @submit.prevent="()=>{}"
    >
        <VRow v-for="(row, i) in rows" :key="i" :class="row.rowClass ?? 'mb-3'">
            <slot
                v-for="(field, j) in row.fields"
                :key="j"
                :name="field.valueForm"
            >
                <VCol
                    :class="
                        field.colClass && field.colClass.length > 0
                            ? field.colClass
                            : 'v-col'
                    "
                    :style="
                        field.colStyle && field.colStyle.length > 0
                            ? field.colStyle
                            : ''
                    "
                >
                    <VTextarea
                        v-if="field.type === 'textarea'"
                        v-model="form[field.valueForm]"
                        :class="field.fieldClass"
                        :rules="field.rules"
                        :label="field.label"
                        :disabled="helper.clickIn == 'Show'"
                        :style="
                            field.fieldStyle && field.fieldStyle.length > 0
                                ? field.fieldStyle
                                : ''
                        "
                    />
                    
                    <SelectComponent
                        v-else-if="field.type === 'select'"
                        :disabled="helper.clickIn == 'Show'"
                        :items="(field.select!.items.value as any)"
                        v-model="form[field.valueForm]"
                        :name="field.label"
                        :id="field.valueForm"
                        :item-title="field.select!.itemTitle"
                        :item-value="field.select!.itemValue"
                        :rules="field.rules"
                        :menu-props="field.select!.menuProps"
                        :multiple="field.select!.multiple"
                        :style="
                            field.fieldStyle && field.fieldStyle.length > 0
                                ? field.fieldStyle
                                : ''
                        "
                    />
                    <VSwitch
                        v-else-if="field.type === 'switch'"
                        color="primary"
                        inset
                        v-model="form[field.valueForm]"
                        :class="field.fieldClass"
                        :rules="field.rules"
                        :label="field.label"
                        :style="
                            field.fieldStyle && field.fieldStyle.length > 0
                                ? field.fieldStyle
                                : ''
                        "
                    />
                    <UploadImageComponent
                        v-else-if="field.type === 'image'"
                        v-model="form[field.valueForm]"
                        :text="field.label"
                        :disabled="helper.clickIn == 'Show'"
                        :label="field.text"
                        :style="
                            field.fieldStyle && field.fieldStyle.length > 0
                                ? field.fieldStyle
                                : ''
                        "
                        v-bind="field.props"
                    >
                    </UploadImageComponent>
                    <div v-else-if="field.type === 'color'" class="text-center">
                        <VLabel class="text-center font-weight-bold">{{
                            field.label
                        }}</VLabel>
                        <v-color-picker
                            class="mx-auto"
                            v-model="form[field.valueForm]"
                            v-bind="field.props"
                            hide-inputs
                            elevation="10"
                            mode="rgba"
                            :border="100"
                            color="#605f5f99"
                        >
                        </v-color-picker>
                    </div>
                    <TelInput
                        v-else-if="field.type === 'phone'"
                        v-model="form[field.valueForm]"
                        :name="field.label"
                        v-bind="field.props"
                        @phone="(phone) => form[field.phone?.fieldPhone || ''] = phone"
                        @phoneCode="(code) => form[field.phone?.fieldCode || ''] = code"
                        @is-valid="(isValid) => form[field.phone?.fieldValid || ''] = isValid"
                    ></TelInput>
                    <InputComponent
                        v-else
                        :disabled="helper.clickIn == 'Show'"
                        v-model="form[field.valueForm]"
                        :type="field.type"
                        :class="field.fieldClass"
                        :rules="field.rules"
                        :name="field.label"
                        :id-element="field.valueForm"
                        :events="field.events"
                        :style="field.fieldStyle && field.fieldStyle.length > 0
                            ? field.fieldStyle
                            : ''"
                        v-bind="field.props"
                        :hideSpinner=field.hideSpinner
                    />
                    <!-- <VTextField
              v-else
              v-model="form[field.valueForm]"
              :type="field.type"
              :class="field.fieldClass"
              :rules="field.rules"
              :label="field.label"
            /> -->
                </VCol>
            </slot>
        </VRow>
    </VForm>
</template>

<script setup lang="ts">
import { helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import InputComponent from "@/components/InputComponent.vue";
import SelectComponent from "../SelectComponent.vue";
import { storeToRefs } from "pinia";
import UploadImageComponent from "@/views/user/Kyc/components/UploadImageComponent.vue";
import TelInput from "../TelInput.vue";

const props = defineProps<Props>();

const helper = helperStore();
const { formCrud: form, formRef } = storeToRefs(helper);

interface Props {
    rows: Row[];
}

const verificateIfExistUpload = (): boolean => {
    return props.rows.some((row) =>
        row.fields.some((field) => field.type == "image")
    );
};
</script>

<style scoped></style>
