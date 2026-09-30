<template>
    <div class="border-degree" style="max-width: 421px; font-size: 20px;">
        <div class="d-flex justify-space-between">
            <div class="text-left text-table">
                Fecha:
            </div>
            <div class="text-left" >
                {{
                    dayjs(order?.attributes.created_at).format(
                        "DD-MM-YYYY HH:mm"
                    )
                }}
            </div>
        </div>
        <div class="d-flex justify-space-between">
            <div class="text-left text-table">
                Estado:
            </div>
            <div class="text-left" >
                {{ order?.relationships?.status.attributes.name }}
            </div>
        </div>
        <div class="d-flex justify-space-between">
            <div class="text-left text-table">
                Tomada por:
            </div>
            <div class="text-left text-warning" >
                {{
                    order?.relationships?.adminProcess?.attributes.username ??
                    ""
                }}
            </div>
        </div>
        <div class="d-flex justify-space-between ">
            <div class="text-left text-table">
                Usuario:
            </div>
            <div class="text-left text-sky cursor-pointer" @click="openModal" >
                {{ order?.relationships?.user.attributes.username }}
                <VIcon 
                    v-if="order?.relationships?.user.relationships?.kyc?.attributes.status" 
                    :icon="HuellaIcon" 
                    color="ok-3" />
            </div>

        </div>
        <div v-if="order?.attributes.type == OrderTypes.COMPRA" class="d-flex justify-space-between">
            <div class="text-left text-table">
                Forma de Pago:
            </div>
            <div class="text-left" >
                {{ order?.relationships?.shipping?.attributes?.name }}
            </div>
        </div>
        <div class="d-flex justify-space-between">
            <div class="text-left text-table">
                Método de pago:
            </div>
            <div class="text-left">
                {{ order?.relationships?.payment.attributes.name }}
            </div>
        </div>
        <div class="d-flex justify-space-between">
            <div class="text-left text-table">
                Tipo:
            </div>
            <div
                :class="
                    order?.attributes.type == OrderTypes.COMPRA
                        ? 'text-ok-2'
                        : 'text-warning'
                "
                class="text-left"
            >
                {{ order?.attributes.type }}
            </div>
        </div>
    </div>

    <dialog-global :dialog="openDetailUser" @close-dialog="openDetailUser = false">
        <detail-user-view in-modal :user="user!"></detail-user-view>
    </dialog-global>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { TransactionStore } from "@/stores/TransactionStore";
import HuellaIcon from "@/assets/icons/HuellaIcon.vue";
import { OrderTypes } from "@/enums/OrderTypes.enum";
import dayjs from "dayjs";
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import { ref } from "vue";
import DetailUserView from "../../users/DetailUser/DetailUserView.vue";
import { helperStore } from "@/helper";
import type { User } from "@/interfaces/User/User.model";

const helper = helperStore()
const transactionStore = TransactionStore();
const { order } = storeToRefs(transactionStore);
const openDetailUser = ref(false)
const user = ref<User>()
const openModal = async () => {
    const url = '/users/'+ order.value?.relationships?.user.id!
    const res = await helper.http(url)
    user.value = res.data.response
    openDetailUser.value = true
}
</script>

<style scoped lang="scss">
@use "@/scss/variables.scss" as *;
.d-flex.justify-space-between{
    font-size: 20px;
    align-items: center;
    >div:nth-child(even){
        width: 180px!important;
    }
    >div:nth-child(odd){
        
        width: 180px!important;
    }
}

.border-degree{
    >div.d-flex.justify-space-between{
        padding: 8px 12px;
        &:nth-child(odd){
            background-color: $backgound-table-odd;
        }
    }
}
</style>
