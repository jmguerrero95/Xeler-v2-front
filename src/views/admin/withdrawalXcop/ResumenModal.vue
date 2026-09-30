<template>
    <dialog-global
        :dialog="modal"
        @close-dialog="modal = false; helper.item = ''"
        width-dialog="450px"
        class-title="text-center text-primary"
    >
        <template #title> Retiro de XCOP </template>
        <div class="bg-light rounded-te-lg rounded-ts-lg px-2 d-flex justify-space-between">
            Tipo de Pago:
            <div>
                as{{ helper.item.relationships.account?.attributes.payment_method_id }}
            </div>
        </div>
        <div class="px-2 d-flex justify-space-between">
            Cantidad a Pagar:
            <div class="d-inline-block float-end">
                {{
                    formatNumber(
                            helper.item.attributes.amount
                    )
                }}
                COP
            </div>
        </div>

        <div class="bg-light px-2 d-flex justify-space-between">
            Comisión:
            <div class="d-inline-block float-end">
                {{ formatNumber(helper.item.attributes.fee) }} USD
            </div>
        </div>
        <!-- <div> -->
        <div class="px-2 d-flex justify-space-between">
            Titular:
            <div class="d-inline-block float-end">
                {{ helper.item.relationships.account?.attributes.beneficiary }}
            </div>
        </div>
        <div class="bg-light px-2 d-flex justify-space-between">
            Documento:
            <div class="d-inline-block float-end">
                {{ helper.item.relationships.account?.attributes.identification_document }} <br />
            </div>
        </div>
        <div class="px-2 d-flex justify-space-between">
            Número de Cuenta:
            <div class="d-inline-block float-end">
                {{ helper.item.relationships.account?.attributes.account_number }}
            </div>
        </div>
            <!-- <div>
                Banco:
                <div class="d-inline-block float-end">
                    <span v-if="bankAccount?.relationships?.bank">
                        Banco:
                        {{ bankAccount?.relationships?.bank?.attributes.name }}
                    </span>
                </div>
            </div> -->
            <!-- <div>
                Tipo Cuenta:
                <div class="d-inline-block float-end">
                    {{
                        bankAccount?.relationships?.typeAccountBank.attributes
                            .name
                    }}
                </div>
            </div> -->
        <!-- </div> -->
    </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { ref } from "vue";
import { watch } from "vue";
import { formatNumber, helperStore } from "@/helper";

const helper = helperStore()
const emits = defineEmits<{
    (e: "update:model-value", value: boolean): void;
}>();
const props = defineProps<{
    modelValue: boolean;
}>();

const modal = ref(props.modelValue);

watch(modal, () => {
    emits("update:model-value", modal.value);
});
</script>

<style scoped></style>
