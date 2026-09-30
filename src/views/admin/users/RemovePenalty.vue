<template>
    <div class="d-flex gap-2 justify-center">
        <VChip
            v-if="canDeletePenalty && userIsPenaltyFor(PENALTY_TYPES.COMPRA)"
            class="cursor-pointer"
            @click="openModal(PENALTY_TYPES.COMPRA)"
            color="warning"
            >Compra</VChip
        >
        <VChip
            v-if="canDeletePenalty && userIsPenaltyFor(PENALTY_TYPES.VENTA)"
            class="cursor-pointer"
            @click="openModal(PENALTY_TYPES.VENTA)"
            color="warning"
            >Venta</VChip
        >
    </div>
    <DialogConfirm
        title="Quitar Penalizacion"
        :dialog="dialog"
        @close-dialog="dialog = false"
        @ok="confirmDelete"
    >
        <template #content>
            <div class="text-table text-center">
                ¿Realmente desea quitar la penalización de
                <b>{{ typePenalty ? PENALTY_NAMES[typePenalty] : "" }}</b>
                del usuario
                <b>{{ user.attributes.username }}</b>
                ?
            </div>
            <div  class="text-table mt-5 text-center">
                <b>Fecha:</b> <br> {{ dayjs(penalty!.attributes.initial_time).format('YYYY-MM-DD | HH:mm:ss')  }}<br>
                <b>Fecha de culminación:</b><br> {{ dayjs(penalty!.attributes.end_time).format('YYYY-MM-DD | HH:mm:ss')  }}
            </div>
        </template>
    </DialogConfirm>
</template>

<script setup lang="ts">
import DialogConfirm from "@/components/global/DialogConfirm.vue";
import { PENALTY_NAMES, PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";
import { helperStore } from "@/helper";
import type { Penalty } from "@/interfaces/Penalty/Penalty.model";
import type { User } from "@/interfaces/User/User.model";
import dayjs from "dayjs";
import { ref, computed } from "vue";
import { UserStore } from "@/stores/UserStore";

const emits = defineEmits<{
    (e:'deletePenalty'):void
}>()
const props = defineProps<{
    user: User;
}>();
const helper = helperStore()
const userStore = UserStore()
const canDeletePenalty = computed(() => userStore.hasPermission("penalty.delete"))

const dialog = ref(false);
const typePenalty = ref<PENALTY_TYPES>();
const penalty = ref<Penalty>()

const openModal = (type: PENALTY_TYPES) => {
    if (!canDeletePenalty.value) {
        helper.showNotify("No tienes permiso para quitar penalizaciones", { type: "error" })
        return
    }
    typePenalty.value = type;
    penalty.value = props.user.relationships?.penaltyNow.find(penalty => penalty.relationships?.typePenalty?.attributes?.code === type)!
    if (!penalty.value) return
    dialog.value = true;
};

const confirmDelete = async () => {
    if (!canDeletePenalty.value || !penalty.value) {
        helper.showNotify("No tienes permiso para quitar penalizaciones", { type: "error" })
        dialog.value = false
        return
    }
    const url = 'penalties/'+ penalty.value!.id
    const res = await helper.http(url,'delete')
    emits('deletePenalty')
    dialog.value = false
}

const userIsPenaltyFor = (type: PENALTY_TYPES):boolean => !!props.user.relationships?.penaltyNow.find(penalty => penalty.relationships?.typePenalty?.attributes?.code === type)
</script>

<style scoped></style>
