<script setup lang="ts">
import { IdentityChallengeStore } from "@/stores/IdentityChallengeStore";
import { onUnmounted, ref } from "vue";

const props = defineProps<{
  onResend: () => Promise<void>;
}>();

const challenges = IdentityChallengeStore();
const sending = ref(false);
const stopClock = challenges.startClock();

onUnmounted(stopClock);

const resend = async () => {
  if (!challenges.canResend || sending.value) return;
  sending.value = true;
  try {
    await props.onResend();
  } finally {
    sending.value = false;
  }
};
</script>

<template>
  <div class="text-center mt-3">
    <p v-if="challenges.deliveryStatus === 'disabled'" class="mb-2">
      El canal no esta disponible temporalmente.
    </p>
    <p
      v-if="challenges.isExpired"
      class="mb-2"
      data-test="identity-challenge-expired"
    >
      El codigo expiro. Podras solicitar uno nuevo cuando termine el contador.
    </p>
    <VBtn
      data-test="identity-challenge-resend"
      variant="text"
      :loading="sending"
      :disabled="!challenges.canResend || sending"
      @click="resend"
    >
      <span v-if="challenges.resendRemaining > 0">
        Reenviar en {{ challenges.resendRemaining }} s
      </span>
      <span v-else>Reenviar codigo</span>
    </VBtn>
  </div>
</template>
