<script setup lang="ts">
import { formatNumberStringToNumber, helperStore } from "@/helper";
import type { Row } from "@/interfaces/FormComponent.helper";
import DialogBase from "@/components/global/DialogGlobal.vue";
import { useI18n } from "vue-i18n";
import FormComponent from "@/components/global/FormComponent.vue";
import { storeToRefs } from "pinia";
import { toRefs, computed, watch } from "vue";
import { UserStore } from "@/stores/UserStore";
import {
    buildActionPermission,
    getPermissionReferenceFromUrl,
    type ActionPermissions,
} from "@/utils/permissionActions";
const { t } = useI18n();

const helper = helperStore();
const userStore = UserStore();
const { formRef, item, formCrud, openModalCrud, clickIn } = storeToRefs(helper);



const emits = defineEmits<{
    (e: "click:post", value: any): void;
}>();
const props = defineProps<Props>();
const { singular } = toRefs(props);

const CreateOrUpdate = async () => {
    const { valid } = await formRef.value.validate();
    if (!valid) return;
    let data:any = {};
    if (verificateIfExistUpload()) {
        // emits('click:post', formCrud.value)
        data = new FormData();

        for (let key in formCrud.value) {
            let value;
            if (typeof formCrud.value[key] == "boolean") {
                value = formCrud.value[key] === true ? "1" : "0";
            } else if (typeof formCrud.value[key] == "number") {
                value = formCrud.value[key].toString();
            } else {
                value = formCrud.value[key];
            }

            data.append(key, value);
        }
        const url =
            clickIn.value === "Create"
                ? helper.url
                : helper.url + `/${helper.item.id}`;
        helper.http(url, "post", { data }).then(() => {
            closeModal();
            helper.index();
        });
        return;
    }
    for (let key in formCrud.value) {
        let value;
        let bool = false
        props.rows.forEach(row => {
            if(bool) return
            
            const field = row.fields.find(field => field.valueForm == key)
            if(field?.decode) {
                bool = true
                value = field.decode(formCrud.value[key]);
            }
        })
        if(!bool){
            value = formCrud.value[key];
        }
        data[key] = value;
    }
    // data = formCrud.value;
    let res =
        clickIn.value == "Edit"
            ? await helper.put(item.value.id, data)
            : await helper.create(data);

    if (res === false) return;

    closeModal();
    helper.index();
};

const verificateIfExistUpload = (): boolean => {
    return props.rows.some((row) =>
        row.fields.some((field) => field.type == "image")
    );
};

const getFieldsName = (): string[] => {
    const fieldsRows: string[] = [];

    props.rows.forEach((row) => {
        fieldsRows.push(...row.fields.map((field) => field.valueForm));
    });

    return fieldsRows;
};
const closeModal = () => {
    formRef.value.reset();
    openModalCrud.value = false;
};

const permissionReference = computed(() =>
    props.permissionReference ?? getPermissionReferenceFromUrl(helper.url)
);

const canPersist = computed(() => {
    const action = clickIn.value === "Edit" ? "update" : "create";
    const permission =
        props.permissions?.[action] ??
        buildActionPermission(action, permissionReference.value);

    if (!permission) return true;
    return userStore.hasPermission(permission);
});

interface Props {
    singular: string;
    rows: Row[];
    widthDialog?: string;
    permissionReference?: string;
    permissions?: ActionPermissions;
}

const getTitle = computed((): string => {
    switch (clickIn.value) {
        case "Show":
            return t("commons.show-title-modal", { singular: singular.value });
        case "Edit":
            return t("commons.update-title-modal", {
                singular: singular.value,
            });
        case "Create":
            return t("commons.create-title-modal", {
                singular: singular.value,
            });
        default:
            return "";
    }
});

const getButton = computed((): string => {
    switch (clickIn.value) {
        case "Edit":
            return t("buttons.update");
        case "Create":
            return t("buttons.create");
        default:
            return "";
    }
});

watch(() => formCrud.value.total_exchange_local,()=>updateExchange())
watch(() => formCrud.value.received_amount,()=>updateExchange())

const updateExchange = () => {
    const total_exchange_local = formatNumberStringToNumber(formCrud.value.total_exchange_local ?? '0')
    const received_amount = formatNumberStringToNumber(formCrud.value.received_amount ?? '0')
    if(total_exchange_local && received_amount){
        const value = total_exchange_local / received_amount
        formCrud.value.exchange_local = value.toFixed(2)
    }
}
</script>

<template>
    <DialogBase
        :dialog="openModalCrud"
        :widthDialog="widthDialog ?? '1000px'"
        @closeDialog="openModalCrud = false"
        footer
    >
        <template #title>{{ getTitle }}</template>

        <template #content>
            <FormComponent :rows="rows"> </FormComponent>
        </template>

        <template #actions>
            <div
                class="paddingBtn d-flex w-100 justify-center justify-sm-space-between flex-wrap gap-2"
            >
                <div class="order-1 order-sm-0">
                    <VBtnPrimary variant="outlined" @click="closeModal()">
                        {{ $t("buttons.cancel") }}
                    </VBtnPrimary>
                </div>
                <div class="order-0 order-sm-1">
                    <VBtnPrimary
                        v-if="clickIn != 'Show' && canPersist"
                        variant="elevated"
                        @click="CreateOrUpdate"
                    >
                        {{ getButton }}
                    </VBtnPrimary>
                </div>
            </div>
        </template>
    </DialogBase>
</template>

<style>
.paddingBtn {
    padding-left: 15px;
    padding-right: 20px;
}
</style>
