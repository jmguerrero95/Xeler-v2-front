<template>
    <div class="d-flex align-center">
        <div class="" style="max-width: 200px">
            <span class="font-22 font-weight-light">Mayor Movimiento</span>
        </div>
        <div class="contenedor ml-2 mr-1" id="asd">
            <!-- <VResponsive
    class="border-degree d-flex align-center justify-center"
    style="width:110px; height:30px"
    > -->
            <VSelect
                class="border-degree"
                style="width: 110px"
                variant="plain"
                single-line
                v-model="timeSelect"
                density="compact"
                id="as"
                hide-details
                item-title="title"
                :items="times"
                @update:model-value="getFilter"
            >
            </VSelect>
            <!-- </VResponsive> -->
        </div>
    </div>
    <div class="d-flex mt-3 align-center">
        <div class="" style="max-height: 170px">
            <div>
                <v-progress-circular
                    color="#E68022"
                    model-value="70"
                    :size="170"
                    :width="17"
                    id="circleBig"
                ></v-progress-circular>
            </div>
            <div
                class="position-relative"
                style="top: -135px; bottom: 0; left: 34px; right: 0"
            >
                <v-progress-circular
                    color="#08D110"
                    model-value="40"
                    :size="100"
                    id="circleSmall"
                    :width="17"
                ></v-progress-circular>
            </div>
        </div>
        <div class="ml-5">
            <div v-for="(currency, index) in currencies" :key="index">
                <div class="mb-4" v-for="(value, name) in currency" :key="name">
                    <div class="d-flex align-center">
                        <div
                            class="rounded-circle mr-2"
                            style="
                                width: 15px;
                                height: 15px;
                                
                            "
                            :style="index === 0 ?  'background-color: #e68022;' : 'background-color: #08D110;'"
                        ></div>
                        <div>
                            {{ name }}
                        </div>
                    </div>
                    <div class="font-weight-light text-18">
                        {{ value ?? 0 }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { helperStore } from "@/helper";
import dayjs from "dayjs";
import { onMounted } from "vue";
import { ref } from "vue";

const helper = helperStore();
const timeSelect = ref("1 months");

const times = ref<TimeSelector[]>([]);
const quantityMonths = 4;
const currencies = ref([]);
const setTimes = () => {
    return new Promise((ok, reject) => {
        for (let i = 0; i < quantityMonths; i++) {
            const quantity = i === 0 ? 1 : i * 4;
            const fec_ini = dayjs()
                .subtract(quantity, "months")
                .format("YYYY-MM-DD");
            const fec_end = dayjs().format("YYYY-MM-DD");
            const title = quantity + " months";
            times.value.push({
                title,
                fec_ini,
                fec_end,
            });
        }
        ok(true);
    });
};
const getFilter = async () => {
    const url = "order/moves/currencys/totals";
    try {
        const time = times.value.find((r) => r.title == timeSelect.value);
        const res = await helper.http(url, "get", {
            params: {
                fec_ini: time!.fec_ini,
                fec_end: time!.fec_end,
            },
        });
        currencies.value = res.data.response;
    } catch (e) {}
};

interface TimeSelector {
    title: string;
    fec_ini: string;
    fec_end: string;
}

onMounted(() => {
    setTimes().then(() => getFilter());
});
</script>

<style lang="scss">
div#circleSmall circle.v-progress-circular__overlay {
    stroke-linecap: round;
}
div#circleBig circle.v-progress-circular__overlay {
    stroke-linecap: round;
}
</style>
