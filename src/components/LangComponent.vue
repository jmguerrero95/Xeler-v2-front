<template>
    <VSelect
        v-model="currentLang"
        :items="lang"
        variant="plain"
        item-title="name"
        class="my-auto"
        >
        
        </VSelect>
</template>

<script setup lang="ts">
import esLang from './LangComponent/esLang.svg'
import { ref } from 'vue'
const currentLang = ref('es')
const lang: {name:string,image:string}[] = [
    {
        name: 'es',
        image: esLang
    }
]
</script>

<style scoped>

</style>