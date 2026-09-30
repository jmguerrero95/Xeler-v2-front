<template><ul class="requirements" aria-live="polite"><li v-for="item in items" :key="item.label" :class="{ok:item.ok}">{{ item.ok?'✓':'○' }} {{ item.label }}</li></ul></template>
<script setup lang="ts">
import { computed } from 'vue';
const props=defineProps<{password:string}>();
const items=computed(()=>[
 {label:'Entre 12 y 24 caracteres',ok:props.password.length>=12&&props.password.length<=24},
 {label:'Una mayúscula',ok:/[A-ZÁÉÍÓÚÜÑ]/.test(props.password)}, {label:'Una minúscula',ok:/[a-záéíóúüñ]/.test(props.password)},
 {label:'Un número',ok:/\d/.test(props.password)}, {label:'Un símbolo',ok:/[-_@$!%*?&€£.,¡¿]/.test(props.password)},
]);
</script>
<style scoped>.requirements{list-style:none;padding:0;color:#6b7280}.requirements li{margin:.25rem 0}.requirements .ok{color:#16844a;font-weight:600}</style>
