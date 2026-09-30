<template>
    <div class="border-degree">
        <div class="d-flex align-center justify-center">
            <VIcon size="40" :icon="CronometerIcon" color="primary" />
            <div class="pb-2">
                <div class="text-primary" style="font-size: 30px">
                    Cronómetro de Pago
                </div>
                <div class="mx-5">
                    <div
                        @click="modalOpen"
                        class="mx-auto text-table"
                        id="inputCronometer"
                        style="font-size: 20px"
                    >
                        <span v-if="!cron || !getCron">00:00</span>
                        <span v-else>
                            <count-down :dateFinish="getCron"> </count-down>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <DialogGlobal
        :dialog="openModal"
        @close-dialog="closeDialog"
        width-dialog="300"
    >
        <template #content>
            <div class="d-flex justify-center">
                <VIcon size="73" :icon="ClockIcon" color="primary" />
            </div>
            <div
                class="text-center text-table font-weight-bold"
                style="font-size: 30px"
            >
                Agregar tiempo estimado
            </div>
            <div class="d-flex justify-center">
                <div
                    class="inputCronometer border-degree d-flex justify-center"
                >
                    <input
                        class="mx-auto"
                        type="time"
                        name="limitetiempo"
                        list="listalimitestiempo"
                        style="outline: none"
                        v-model="cron"
                        :min="now"
                    />

                    <datalist id="listalimitestiempo">
                        <option
                            v-for="(time, i) in getTimes"
                            :key="i"
                            :value="time"
                            :style="getOptionStyle()"
                        ></option>
                    </datalist>
                </div>
            </div>
            <div class="mt-3 text-center">
                <VBtnPrimary
                    class=""
                    :disabled="!cronIsCorrect"
                    @click="saveCron"
                >
                    Guardar
                </VBtnPrimary>
            </div>
        </template>
    </DialogGlobal>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";
const { authorizeWithTwoFactor } = useTwoFactorGuard();
import CronometerIcon from "@/assets/icons/CronometerIcon.vue";
import { ref } from "vue";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import ClockIcon from "@/assets/icons/ClockIcon.vue";
import InputComponent from "@/components/InputComponent.vue";
import { computed } from "vue";
import dayjs from "dayjs";
import CountDown from "@/components/CountDown.vue";
import { helperStore } from "@/helper";
import { toRefs } from "vue";
import { TransactionStore } from "@/stores/TransactionStore";
import { storeToRefs } from "pinia";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { UserStore } from "@/stores/UserStore";

const transactionStore = TransactionStore()
const { order } = storeToRefs(transactionStore)
const userStore = UserStore()
const canManageOrders = computed(() => userStore.hasPermission("orders.updated"))
const props = defineProps<{cronP?: string}>()
const { cronP }  = toRefs(props)
const cron = ref(cronP?.value ? dayjs(cronP?.value).format("HH:mm") : '')
const helper = helperStore();
const cronometer = ref("23h:05m:03s");
const openModal = ref(false);
const times = [15, 30, 60, 90, 120]; // in minutes

const getTimes = computed(() => {
    return times.map((time) => dayjs().add(time, "minutes").format("HH:mm"));
});
const now = ref(dayjs().format("HH:mm"));
const getOptionStyle = () => {
    return {
        background: "#f0f0f0", // Cambia este color según tu preferencia
        color: "#333", // Cambia este color según tu preferencia
        transition: "background-color 0.3s ease", // Transición suave de color
        cursor: "pointer", // Cambia el cursor al pasar por encima
    };
};

const cronIsCorrect = computed(() => {
    if (!cron.value) return false;
    const cronArray = cron.value.split(":").map((c) => parseInt(c));
    const now = dayjs();
    const nowMoreCron = dayjs()
        .set("hour", cronArray[0])
        .set("minute", cronArray[1]);
    return nowMoreCron >= now;
});

const getCron = ref(cronP?.value ? dayjs(cronP?.value).format("DD/MM/YYYY HH:mm") : '');

const closeDialog = () => {
    if (!cronIsCorrect.value) {
        cron.value = "";
    }
    openModal.value = false;
};

const modalOpen = () => {
    if (!canManageOrders.value) {
        helper.showNotify("No tienes permiso para gestionar ordenes", { type: "error" })
        return
    }
    openModal.value = true;
    // cron.value = ''
};
const saveCron = async () => {
    if (!canManageOrders.value || !order.value?.id) {
        helper.showNotify("No tienes permiso para gestionar ordenes", { type: "error" })
        openModal.value = false
        return
    }
    if (cronIsCorrect.value) {
        const cronArray = cron.value.split(":").map((c) => parseInt(c));
        getCron.value = dayjs()
            .set("hour", cronArray[0])
            .set("minute", cronArray[1])
            .format("DD-MM-YYYY HH:mm");
        const url = "order/add/estimate/time";
        const data = {
            order_id: order.value?.id,
            // estimated_time: dayjs(getCron.value).format("YYYY-MM-DD HH:mm"),
            estimated_time: getCron.value,
        };
        const scope = `order-estimate-time-${order.value?.id}`;
        await authorizeWithTwoFactor(helper.http.bind(helper, url,'post',{data}, "", false, {
            idempotent: true,
            idempotencyKey: createOperationKey(scope, data),
            financialAction: true,
        }), "finance.order_admin")
        clearOperationKey(scope)
    }
    openModal.value = false;
};
</script>

<style scoped lang="scss">
.border-degree {
    > div {
        gap: 15px;
    }
}
.inputCronometer {
    font-size: 15px;
    width: 170px;
    height: 30px;
    flex-shrink: 0;
}

option:hover {
    background-color: red;
}
</style>
