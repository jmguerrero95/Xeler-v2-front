<template>
  <dialog-global :dialog="dialog" @close-dialog="closeDialog">
    <template #title
      >Usuario Penalizado para {{ PENALTY_NAMES[TypePenalty] }}</template
    >
    <template #default>
      <p class="text-h6">
        La penalización terminará: <b>{{ penalty?.attributes.end_time }}</b>
      </p>
    </template>
  </dialog-global>
</template>

<script setup lang="ts">
import DialogGlobal from "@/components/global/DialogGlobal.vue";
import type { PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";
import { PENALTY_NAMES } from "@/enums/PenaltyTypes.enum";
import { helperStore } from "@/helper";
import type { Penalty } from "@/interfaces/Penalty/Penalty.model";
import { getPenaltyOfUserSession, penalties } from "@/stores/PenaltyStore";
import { ref } from "vue";
import { useRouter } from "vue-router";
const helper = helperStore();

const dialog = ref(false);
const props = defineProps<Props>();
const emits = defineEmits<Emits>();
const penalty = ref<Penalty | undefined>();

getPenaltyOfUserSession().then((res) => {
  if (res.length == 0) return;

  penalty.value = penalties.value.find(
    (penaltyItem) =>
      penaltyItem.relationships?.typePenalty?.attributes?.code === props.TypePenalty
  );
  if (!penalty.value) return;

  dialog.value = true;
  emits("havePenalization", true);
});

const router = useRouter();
const closeDialog = () => {
  helper.loading = true;
  router.push({ name: "user-profile" });
};

interface Props {
  TypePenalty: PENALTY_TYPES;
}

type Emits = (e: "havePenalization", value: boolean) => void;
</script>
