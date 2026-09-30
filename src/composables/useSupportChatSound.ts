import { ref, onUnmounted } from "vue";

const audioContext = ref<AudioContext | null>(null);
const soundEnabled = ref(localStorage.getItem("support-chat-sound") !== "off");
let unlockPromise: Promise<void> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext.value) {
    audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext.value;
}

export function useSupportChatSound() {
  const unlock = async () => {
    if (unlockPromise) return unlockPromise;
    unlockPromise = (async () => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") {
          await ctx.resume();
        }
      } catch (e) {
        console.warn("[SupportChatSound] Failed to unlock audio context:", e);
      }
    })();
    return unlockPromise;
  };

  const playNotification = async () => {
    if (!soundEnabled.value) return;
    await unlock();
    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = 660;
      gain.gain.value = 0.04;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("[SupportChatSound] Failed to play notification:", e);
    }
  };

  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value;
    localStorage.setItem("support-chat-sound", soundEnabled.value ? "on" : "off");
    unlock();
  };

  const isSoundEnabled = computed(() => soundEnabled.value);

  onUnmounted(() => {
    if (audioContext.value) {
      audioContext.value.close().catch(() => {});
      audioContext.value = null;
      unlockPromise = null;
    }
  });

  return {
    playNotification,
    toggleSound,
    isSoundEnabled,
    unlock,
  };
}

import { computed } from "vue";