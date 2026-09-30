<template>
  <span class="text-primary font-weight-bold text-h6">
    {{ countDown }}
  </span>
</template>

<script setup lang="ts">
import dayjs, { type Dayjs } from "dayjs";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  deadline?: string;
  serverTime?: string;
  dateFinish?: string;
}>();

const emits = defineEmits<{
  (e: "expired"): void;
  (e: "endTime"): void;
}>();

const intervalId = ref<number | null>(null);
const now = ref<Dayjs>(dayjs());

const targetTime = computed(() => dayjs(props.deadline ?? props.dateFinish ?? now.value.toISOString()));
const serverBase = computed(() => dayjs(props.serverTime ?? dayjs().toISOString()));
const startedAt = ref<Dayjs>(dayjs());

const syncClock = () => {
  const elapsedMs = dayjs().diff(startedAt.value);
  now.value = serverBase.value.add(elapsedMs, "millisecond");
};

const remainingMs = computed(() => Math.max(0, targetTime.value.diff(now.value)));

const countDown = computed(() => {
  const totalSeconds = Math.floor(remainingMs.value / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
});

const stop = () => {
  if (intervalId.value !== null) {
    window.clearInterval(intervalId.value);
    intervalId.value = null;
  }
};

const start = () => {
  stop();
  startedAt.value = dayjs();
  syncClock();

  intervalId.value = window.setInterval(() => {
    syncClock();
    if (remainingMs.value <= 0) {
      stop();
      emits("expired");
      emits("endTime");
    }
  }, 1000);
};

watch(
  () => [props.deadline, props.serverTime, props.dateFinish],
  () => {
    start();
  },
  { immediate: true },
);

onMounted(start);
onUnmounted(stop);
</script>
