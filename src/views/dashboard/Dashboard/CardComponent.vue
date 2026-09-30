<template>
    <div  class="border-degree pt-3 pb-5 text-table pl-3">
        <div class="d-flex justify-start pt-1">
            <div class="font-weight-light my-auto">
                {{ title }}
            </div>
            <div class="contenedor ml-auto mr-1" id="asd">
                <!-- <VResponsive
                class="border-degree d-flex align-center justify-center"
                style="width:110px; height:30px"
                > -->
                <VSelect
                    v-if="withFilter"
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
        <div class="d-flex align-center justify-start">
            <div>
                <VIcon :class="classIcon" :color="colorIcon" size="41">
                    <svg
                        v-if="icon == 'moneda'"
                        width="41"
                        height="41"
                        viewBox="0 0 41 41"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <circle
                            cx="20.5"
                            cy="20.5"
                            r="20.5"
                            fill="currentColor"
                            fill-opacity="0.2"
                        />
                        <path
                            d="M27.5 29.6102H23.5625C23.2531 29.6102 23 29.3485 23 29.0287V27.0901C23 26.7702 23.2531 26.5085 23.5625 26.5085H27.5C28.3297 26.5085 29 25.8155 29 24.9577V15.6526C29 14.7947 28.3297 14.1017 27.5 14.1017H23.5625C23.2531 14.1017 23 13.84 23 13.5201V11.5816C23 11.2617 23.2531 11 23.5625 11H27.5C29.9844 11 32 13.084 32 15.6526V24.9577C32 27.5263 29.9844 29.6102 27.5 29.6102ZM25.2969 19.8689L17.4219 11.727C16.7188 11 15.5 11.5089 15.5 12.5509V17.2034H9.125C8.50156 17.2034 8 17.722 8 18.3665V23.0191C8 23.6637 8.50156 24.1822 9.125 24.1822H15.5V28.8348C15.5 29.8768 16.7188 30.3857 17.4219 29.6587L25.2969 21.5167C25.7328 21.0612 25.7328 20.3245 25.2969 19.8689Z"
                            fill="currentColor"
                        />
                    </svg>
                    <svg
                        v-else-if="icon == 'xcop'"
                        xmlns="http://www.w3.org/2000/svg"
                        width="43"
                        height="42"
                        viewBox="0 0 43 42"
                        fill="none"
                    >
                        <path
                            d="M21.5 40C32.2696 40 41 31.4934 41 21C41 10.5066 32.2696 2 21.5 2C10.7304 2 2 10.5066 2 21C2 31.4934 10.7304 40 21.5 40Z"
                            fill="#5043E8"
                            stroke="white"
                            stroke-width="4"
                            stroke-miterlimit="22.9256"
                        />
                        <path
                            d="M9.88183 8.15216H15.6216L21.6727 17.2006L27.8073 8.15216L33.1941 8.27535L24.3116 20.6806L33.5892 33.8478H27.9248L21.3785 24.2019L15.025 33.8478H9.41138L18.6972 20.6806L9.88183 8.15216Z"
                            fill="white"
                        />
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M26.843 20.6854L34.1826 9.97632C39.5356 17.0872 39.0374 24.2915 34.1121 31.5668L26.843 20.6854Z"
                            fill="#18B5E6"
                        />
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M16.3904 20.6868L9.05082 9.97766C3.69783 17.0886 4.196 24.2928 9.12133 31.5681L16.3904 20.6868Z"
                            fill="#18B5E6"
                        />
                    </svg>

                    <svg v-else-if="icon == 'user'" width="41" height="41" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="20.5" cy="20.5" r="20.5" fill="#0090FF" fill-opacity="0.2"/>
                        <path d="M14 21.125C14.0013 21.2238 13.9827 21.3219 13.9455 21.4135C13.9083 21.505 13.8531 21.5882 13.7832 21.6581C13.7133 21.728 13.6301 21.7832 13.5385 21.8205C13.447 21.8577 13.3489 21.8762 13.25 21.875H9.12503C8.9857 21.8738 8.84929 21.8349 8.7304 21.7622C8.61151 21.6896 8.5146 21.586 8.45003 21.4625C8.38999 21.3367 8.36525 21.197 8.37846 21.0583C8.39167 20.9196 8.44233 20.7871 8.52503 20.675C9.18877 19.784 10.0744 19.0826 11.0938 18.6406C10.6558 18.2397 10.3192 17.7404 10.1119 17.184C9.90453 16.6276 9.83228 16.0299 9.90108 15.4401C9.96987 14.8502 10.1778 14.2852 10.5076 13.7914C10.8375 13.2977 11.2798 12.8893 11.7984 12.5999C12.3169 12.3105 12.8967 12.1485 13.4902 12.127C14.0836 12.1055 14.6736 12.2252 15.2117 12.4764C15.7498 12.7275 16.2206 13.1028 16.5853 13.5714C16.9499 14.04 17.1981 14.5886 17.3094 15.1719C17.3371 15.3238 17.3179 15.4805 17.2543 15.6212C17.1906 15.7619 17.0856 15.8799 16.9532 15.9594C15.7406 16.6784 14.8184 17.7996 14.3469 19.1281C14.1145 19.7681 13.997 20.4441 14 21.125ZM31.475 20.675C30.8113 19.784 29.9256 19.0826 28.9063 18.6406C29.3443 18.2397 29.6808 17.7404 29.8882 17.184C30.0955 16.6276 30.1678 16.0299 30.099 15.4401C30.0302 14.8502 29.8223 14.2852 29.4925 13.7914C29.1626 13.2977 28.7202 12.8893 28.2017 12.5999C27.6832 12.3105 27.1033 12.1485 26.5099 12.127C25.9165 12.1055 25.3264 12.2252 24.7884 12.4764C24.2503 12.7275 23.7795 13.1028 23.4148 13.5714C23.0501 14.04 22.8019 14.5886 22.6907 15.1719C22.6629 15.3238 22.6822 15.4805 22.7458 15.6212C22.8095 15.7619 22.9145 15.8799 23.0469 15.9594C24.261 16.6765 25.1838 17.7984 25.6532 19.1281C25.8856 19.7681 26.003 20.4441 26 21.125C25.9988 21.2238 26.0173 21.3219 26.0546 21.4135C26.0918 21.505 26.147 21.5882 26.2169 21.6581C26.2868 21.728 26.37 21.7832 26.4615 21.8205C26.5531 21.8577 26.6512 21.8762 26.75 21.875H30.875C31.0143 21.875 31.1508 21.8362 31.2693 21.763C31.3878 21.6897 31.4836 21.585 31.5458 21.4604C31.6081 21.3358 31.6345 21.1963 31.622 21.0576C31.6095 20.9189 31.5586 20.7864 31.475 20.675ZM22.7375 24.6969C23.4839 24.1247 24.0324 23.3332 24.3057 22.4333C24.5791 21.5335 24.5637 20.5706 24.2616 19.68C23.9595 18.7893 23.386 18.0157 22.6217 17.4678C21.8573 16.9199 20.9405 16.6253 20 16.6253C19.0596 16.6253 18.1428 16.9199 17.3784 17.4678C16.614 18.0157 16.0405 18.7893 15.7385 19.68C15.4364 20.5706 15.421 21.5335 15.6943 22.4333C15.9677 23.3332 16.5161 24.1247 17.2625 24.6969C15.8043 25.3443 14.622 26.4866 13.925 27.9219C13.8696 28.0359 13.8447 28.1624 13.853 28.289C13.8612 28.4156 13.9022 28.5378 13.9719 28.6437C14.0368 28.7524 14.1288 28.8423 14.2389 28.9048C14.349 28.9672 14.4735 29 14.6 29H25.4C25.5266 29 25.651 28.9672 25.7611 28.9048C25.8712 28.8423 25.9632 28.7524 26.0282 28.6437C26.0979 28.5378 26.1389 28.4156 26.1471 28.289C26.1553 28.1624 26.1305 28.0359 26.075 27.9219C25.378 26.4866 24.1958 25.3443 22.7375 24.6969Z" fill="#0090FF"/>
                        </svg>
                        
                </VIcon>
            </div>
            <div class="font-weight-bold font-30">
                <span v-if="type == 'currency'">
                    <span v-if="icon != 'xcop'" class="ml-2">$</span
                    >{{ formatNumber(amount, ".", ",", 0) }}
                </span>
                <span v-else class="ml-2">
                    {{ amount }}
                </span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import ArrowWithSquareIcon from "@/assets/icons/ArrowWithSquareIcon.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import { formatNumber, helperStore } from "@/helper";
import dayjs from "dayjs";
import { computed } from "vue";
import { onMounted } from "vue";
import { ref } from "vue";

const props = defineProps<{
    url: string;
    icon: any;
    type: "currency" | "number";
    title: string;
    typeOrder?: OrderTypes;
    field: "total" | "pesos" | "dolares";
    withFilter: Boolean;
}>();

const helper = helperStore();
const timeSelect = ref("1 months");
const quantityMonths = 4;
const amount = ref(0);
const times = ref<TimeSelector[]>([]);

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
    // const url = '/order/total/types'
    try {
        const time = times.value.find((r) => r.title == timeSelect.value);
        const res = await helper.http(props.url, "get", {
            params: {
                fec_ini: time!.fec_ini,
                fec_end: time!.fec_end,
                type: props.typeOrder
                    ? props.typeOrder?.toLocaleLowerCase()
                    : "",
            },
        });
        amount.value = res.data[props.field];
    } catch (e) {}
};

const classIcon = computed(() => {
    if (!props.typeOrder || props.typeOrder == OrderTypes.COMPRA) return "";
    return "rotate-180";
});

const colorIcon = computed(() => {
    if (!props.typeOrder) return "";
    if (props.typeOrder == OrderTypes.COMPRA) return "warning";
    return "#36DB5A";
});

onMounted(() => {
    setTimes().then(() => getFilter());
});

const currency = "";

interface TimeSelector {
    title: string;
    fec_ini: string;
    fec_end: string;
}
</script>

<style lang="scss">
/*.v-field__input > input#as{
    --v-field-input-padding-top: 0px
}*/
/*.v-field__input{
    --v-field-input-padding-top: 0px
}*/
$top: 5px;
.contenedor .v-field__input {
    /* Tu estilo personalizado aquí */
    --v-field-input-padding-top: $top;
    --v-field-padding-start: 15px;
}
.contenedor .v-field__append-inner {
    padding-top: $top !important;
}
.contenedor .v-select__selection{
    max-width:110%;
}
</style>
