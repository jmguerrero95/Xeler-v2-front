<template>
    <VRow dense>
        <VCol :cols="isMobile ? 12:6">
            <VList>
                <VListItem 
                    v-for="item,i in firstColumnComputed" :key="i" 
                    class="font-30 my-3 aos-init aos-animate"
                    data-aos="fade-right"
                    data-aos-easing="linear"
                    data-aos-duration="500">
                    <template #prepend>
                        <div class="bg-primary rounded-lg"
                            :class="isMobile? 'pa-2':'pa-1'">
                            <VIcon :size="isMobile ? 40 :60" :icon="item.icon">
                            </VIcon>

                        </div>
                    </template>
                    <p class="ml-4">
                        {{ item.text }}
                    </p>
                </VListItem>
            </VList>
        </VCol>
        <VCol v-if="!isMobile" :cols="6">
            <VList class="overflow-hidden">
                <VListItem 
                    v-for="item,i in secondColumn" 
                    :key="i" 
                    class="font-30 my-3 aos-init aos-animate overflow-hidden" 
                    data-aos="fade-left"
                    data-aos-easing="linear"
                    data-aos-duration="500">
                    <template #prepend>
                        <div class="bg-primary rounded-lg"
                            :class="isMobile? 'pa-2':'pa-1'">
                            <VIcon :size="isMobile ? 40 :60" :icon="item.icon">
                            </VIcon>

                        </div>
                    </template>
                    <p class="ml-4 font-weight-light text-table" :class="isMobile ? 'text-h6' : 'font-30'" v-html="item.text" >
                    </p>
                </VListItem>
            </VList>
        </VCol>
    </VRow>
</template>

<script setup lang="ts">
import RayoIcon from './FiveElement/RayoIcon.vue'
import SoporteIcon from './FiveElement/SoporteIcon.vue'
import MaletaIcon from './FiveElement/MaletaIcon.vue'
import MoneyIcon from './FiveElement/MoneyIcon.vue'
import CheckShieldIcon from './FiveElement/CheckShield.vue'
import OperationIcon from './FiveElement/OperationIcon.vue'
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { computed } from 'vue'

const isMobile = ref(useDisplay().smAndDown)

const firstColumn: Element[] = [
    {
        text: 'Transacciones super rapidas',
        icon : RayoIcon
    },
    {
        text: 'Soporte Personalizado',
        icon : SoporteIcon
    },
    {
        text: 'Servicio OTC',
        icon: MaletaIcon
    },
]

const secondColumn : Element[] = [
    {
        text: 'Acumula Xelercop en cada operacion',
        icon : MoneyIcon
    },
    {
        text: 'Respaldo y seguridad',
        icon : CheckShieldIcon
    },
    {
        text: 'Operaciones Bancarias y en Efectivo',
        icon: OperationIcon
    },
]

const firstColumnComputed = computed((): Element[]=>{
    if(isMobile.value){
        return [...firstColumn,...secondColumn] 
    }
    return firstColumn
})
interface Element {
    text: string
    icon: any
}
</script>

<style scoped></style>