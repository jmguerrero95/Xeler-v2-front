<template>
    <div
        class="text-white mb-4 mt-10 margin-full"
        :class="!isMobile ? 'fond_monedas' : ''"
    >
        <VRow dense :class="isMobile ? '' : 'px-16'">
            <VCol
                :cols="isMobile ? 12 : 6"
                class="text-center d-flex align-center justify-center px-5 aos-init aos-animate h-50"
                style="flex-direction: column"
                data-aos="fade-up"
                data-aos-easing="linear"
                data-aos-duration="1000"
            >
                <div>
                    <VIcon :size="isMobile ? 360 : 500" :icon="img1" />
                </div>
                <div
                    class="text-justify"
                    :class="{
                        'text-table': isMobile,
                    }"
                >
                    <p
                        class="font-weight-light text-center ma-0"
                        :class="{
                            'text-primary': isMobile,
                            'font-25': isMobile,
                            'font-44': !isMobile,
                        }"
                    >
                        <span v-if="!isMobile">Nuestro objetivo: La Rapidez</span>
                        <span v-else>Nuestro lema la Rapidez</span>
                    </p>
                    <div v-if="!isMobile">
                        <p class="my-4">
                            La palabra CELER proviene del latin y significa
                            rápido, y las transacciones en criptomonedas deben
                            ser rapidas y eficientes.
                        </p>
                        <p class="my-4">
                            xeler nace en Colombia en 2019 como plataforma
                            automatizada, en base a la experiencia adquirida
                            desde el 2014 en el mercado persona a persona.
                        </p>
                        <p class="my-4">
                            Entendemos que el dinero en efectivo cumple una
                            función primordial en la economía colombiana por lo
                            tanto esta 100% integrado a nuestras operaciones.
                        </p>
                    </div>
                    <div v-else class="font-16 my-5">
                        <p>
                            Xeler viene del latin CELER lo que traduce a español
                            rapidez, nacemos en COLOMBIA en el 2019 como
                            plataforma automatizada de compra y venta de
                            criptomonedas, y nuestra experiencia data de 2014 en
                            el mercado persona a persona, en base a nuestra
                            historia entendemos que el dinero en efectivo cumple
                            una funcion primordial en la economia colombiana por
                            lo tanto esta 100% integrado a nuestras operaciones.
                        </p>
                    </div>
                </div>
            </VCol>
            <VCol
                :cols="isMobile ? 12 : 6"
                class="text-center d-flex justify-center align-center px-5 aos-init aos-animate h-50"
                style="flex-direction: column"
                data-aos="fade-up"
                data-aos-easing="linear"
                data-aos-duration="1000"
                :class="isMobile ? 'fond_monedas ' : ''"
            >
                <div>
                    <VIcon :size="isMobile ? 360 : 500" :icon="img2" />
                </div>
                <div class="text-justify">
                    <p  
                        class="font-weight-light text-center px-3 ma-0"
                        :class="{
                            'font-25': isMobile,
                            'font-44': !isMobile,
                        }"
                    >
                        <span v-if="!isMobile">Las mejores Criptomonedas</span>
                        <span v-else>
                            Manejamos las monedas de mayor influencia
                        </span>
                    </p>
                    <p class="my-4">
                        Estamos en constante actualización incluyendo en nuestro
                        sistema las criptomonedas de mayor capitalización, las
                        cuales puedes intercambiar por pesos y viceversa,
                        listamos las monedas que consideramos tienen un volumen
                        importante de operaciones y por supuesto los proyectos
                        solidos.
                    </p>
                </div>
            </VCol>
        </VRow>
    </div>
</template>

<script setup lang="ts">
import img1 from "./FourElement/img1.vue";
import img2 from "./FourElement/img2.vue";
import { ref } from "vue";
import { useDisplay } from "vuetify";
import { onMounted } from "vue";
//@ts-ignore
import AOS from "aos";

onMounted(() => {
    AOS.init();
});
const isMobile = ref(useDisplay().smAndDown);
</script>

<style scoped>
.fond_monedas {
    background: linear-gradient(90deg, #5043e8 22.21%, #17b4e6 71.31%);
    background-size: 200% 100%; /*Asignamos un ancho para el background del 300% y altura 100%*/
    animation: gradient 6s ease infinite;
}


@keyframes gradient {
    0% {
        background-position: 0% 50%;
    }
    50% {
        background-position: 100% 50%;
    }
    100% {
        background-position: 0% 50%;
    }
}
</style>
