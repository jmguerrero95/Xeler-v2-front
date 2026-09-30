<template>
    <VRow dense class="d-flex align-center justify-space-between" style="max-height: 400px;">
        <VCol cols="1" v-if="!isMobile">

            <VIcon size="50" @click="back">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M25 50C11.1895 50 0 38.8105 0 25C0 11.1895 11.1895 0 25 0C38.8105 0 50 11.1895 50 25C50 38.8105 38.8105 50 25 50ZM27.9133 35.5242L20.3024 28.2258H38.7097C40.0504 28.2258 41.129 27.1472 41.129 25.8065V24.1935C41.129 22.8528 40.0504 21.7742 38.7097 21.7742H20.3024L27.9133 14.4758C28.8911 13.5383 28.9113 11.9758 27.9536 11.0181L26.8448 9.91936C25.8972 8.97177 24.3649 8.97177 23.4274 9.91936L10.0504 23.2863C9.10282 24.2339 9.10282 25.7661 10.0504 26.7036L23.4274 40.0806C24.375 41.0282 25.9073 41.0282 26.8448 40.0806L27.9536 38.9819C28.9113 38.0242 28.8911 36.4617 27.9133 35.5242Z"
                        fill="#CFCFD0" />
                </svg>

            </VIcon>
        </VCol>

        <VCol>
            <VCarousel :height="isMobileSmall ? 450:300" hide-delimiter-background cycle interval="2000" :show-arrows="false" :hide-delimiters="!isMobile"  v-model="model">
                <v-carousel-item v-if="!isMobile" :value="i" cover v-for="item, i in items" :key="i">
                    <div class="d-flex align-center h-100" style="gap:12px">
                        <div>
                            <VCard class="mx-auto firstCard" >
                                <VCardText class="card-no-text-padding">
                                    <div class="d-flex align-center" style="flex-flow: row; gap: 12px;">
                                        <div>
                                            <VIcon :size="isMd ? 140 :172" :icon="item.element[0].icon"></VIcon>
                                        </div>
                                        <div>
                                            <div>
                                                <p class="text-md-h6 text-lg-h5 text-table text-headline-small" v-html="item.element[0].text">
                                                </p>

                                            </div>
                                            <div class="align-self-end">

                                                <p class="text-primary font-weight-bold ">
                                                    haz click para mas detalles >
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </VCardText>
                            </VCard>
                        </div>
                        <div>
                            <VCard class="mx-auto secondCard">
                                <VCardText class="card-no-text-padding">
                                    <div class="d-flex align-center" style="flex-flow: row; gap: 12px;">
                                        <div>
                                            <VIcon :size="isMd ? 140 :172" :icon="item.element[1].icon"></VIcon>
                                        </div>
                                        <div>
                                            <div>
                                                <p class="text-md-h6 text-lg-h5 text-table text-headline-small" v-html="item.element[1].text">
                                                </p>

                                            </div>
                                            <div class="align-self-end">

                                                <p class="text-primary font-weight-bold ">
                                                    haz click para mas detalles >
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </VCardText>
                            </VCard>
                        </div>

                    </div>

                </v-carousel-item>
                <v-carousel-item class="" v-if="isMobile" :value="i"  v-for="item, i in itemsMobile" :key="i">
                    <!-- <VRow class="d-flex align-center " style=""> -->
                        <!-- <VCol cols="6" class="mx-14"> -->
                            <VCard class="mx-auto firstCard"  :width="isMobileSmall ? 300 : 500">
                                <VCardText class="card-no-text-padding">
                                    <VRow class="align-center">
                                        <VCol :cols="isMobileSmall?12:''">
                                            <VIcon size="172" :icon="item.icon"></VIcon>
                                        </VCol>
                                        <VCol :cols="isMobileSmall?12:''" class="" style="flex-direction: column;word-wrap: normal;">
                                            <div>
                                                <p class="text-h5 text-table text-headline-small" v-html="item.text">
                                                </p>

                                            </div>
                                            <div class="align-self-end">

                                                <p class="text-primary font-weight-bold ">
                                                    haz click para mas detalles >
                                                </p>
                                            </div>
                                        </VCol>
                                    </VRow>
                                </VCardText>
                            </VCard>
                        <!-- </VCol> -->

                    <!-- </VRow> -->

                </v-carousel-item>
            </VCarousel>
        </VCol>

        <VCol cols="1" v-if="!isMobile">

            <VIcon size="50" @click="next">

                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M25 -3.57628e-07C38.8105 -3.57628e-07 50 11.1895 50 25C50 38.8105 38.8105 50 25 50C11.1895 50 -3.57628e-07 38.8105 -3.57628e-07 25C-3.57628e-07 11.1895 11.1895 -3.57628e-07 25 -3.57628e-07ZM22.0867 14.4758L29.6976 21.7742H11.2903C9.9496 21.7742 8.87097 22.8528 8.87097 24.1935V25.8065C8.87097 27.1472 9.9496 28.2258 11.2903 28.2258H29.6976L22.0867 35.5242C21.1089 36.4617 21.0887 38.0242 22.0464 38.9819L23.1552 40.0806C24.1028 41.0282 25.6351 41.0282 26.5726 40.0806L39.9496 26.7137C40.8972 25.7661 40.8972 24.2339 39.9496 23.2964L26.5726 9.91935C25.625 8.97177 24.0927 8.97177 23.1552 9.91935L22.0464 11.0181C21.0887 11.9758 21.1089 13.5383 22.0867 14.4758Z"
                        fill="#CFCFD0" />
                </svg>

            </VIcon>

        </VCol>
    </VRow>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import img1 from './Carousel/img_card1.vue'
import img2 from './Carousel/img_card2.vue'
import { useDisplay } from 'vuetify'
import { computed } from 'vue';

const isMobile = ref(useDisplay().smAndDown)
const isMobileSmall = ref(useDisplay().xs)
const isMd = ref(useDisplay().md)
const model = ref(0)

const back = () => {
    if (model.value === 0) {
        model.value = 1
        return
    }
    model.value--
}

const next = () => {
    if (model.value === 1) {
        model.value = 0
        return
    }
    model.value++
}

const items: itemDesktop[] = [
    {
        element:
            [
                {
                    text: '¿Sabias que los puntos referido de Xeler han pasado a ser <span class="text-primary font-weight-bold">XELERCOP</span>?',
                    icon: img1,
                    link: '#'
                },
                {
                    text: '¿Tenemos un nuevo punto de recepcion de <span class="text-primary font-weight-bold">efectivo</span> en Bogota.',
                    icon: img2,
                    link: '#'
                }
            ]
    },
    {
        element:
            [
                {
                    text: '¿Sabias que los puntos referido de Xeler han pasado a ser <span class="text-primary font-weight-bold">XELERCOP</span>?',
                    icon: img1,
                    link: '#'
                },
                {
                    text: '¿Tenemos un nuevo punto de recepcion de <span class="text-primary font-weight-bold">efectivo</span> en Bogota.',
                    icon: img2,
                    link: '#'
                }
            ]
    },
]

const itemsMobile = computed(()=>{
    let itemNew: Item[] = []
    items.forEach(item => itemNew.push(...item.element))
    return itemNew
})
interface itemDesktop {
    element: Item[]
}

interface Item {
    icon: any
    text: string
    link: string
}
</script>

<style scoped>
    .firstCard {
        background: linear-gradient(115deg, rgba(71, 68, 216, 0.19) 0%, rgba(231, 230, 244, 0.19) 100%);
    }

    .secondCard {
        background: linear-gradient(106deg, rgba(199, 18, 126, 0.19) 3.03%, rgba(231, 230, 244, 0.19) 100%);
    }
    .card-no-text-padding .v-card-text {
        padding: 0;
    }
</style>