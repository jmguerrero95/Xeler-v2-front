<template>
  <v-app>
    <NavBar />

    <v-main :class="isMobile ? '' : ''">
      <vue-particles
        id="tsparticles"
        :particlesInit="particlesInit"
        :particlesLoaded="particlesLoaded"
        :options="optionsParticles"
      />
      <div style="max-width: 1300px" class="mx-auto">
        <FirstElement />
        <!-- Contenido principal de tu aplicación -->
        <VSpacer class="my-6" />
        <SecondElement />
        <VSpacer class="my-16" />
        <ThreeElement />
      </div>

      <VSpacer class="my-3" />
      <FourElement />
      <FiveElement :class="isMobile ? '' : 'px-16'" />

      <div
        dense
        class="text-table aos-init aos-animate text-center"
        data-aos="flip-left"
        data-aos-easing="linear"
        data-aos-duration="500"
        data-aos-delay="1500"
      >
        <span class="text-h5">
          Dudas? Preguntas? visita nuestro
          <span class="text-primary">help desk</span>
        </span>
      </div>
    </v-main>
    <FooterComponent />
  </v-app>
</template>

<script setup lang="ts">
import NavBar from "./Home/NavBar.vue";
import FirstElement from "./Home/FirstElement.vue";
import SecondElement from "./Home/SecondElement.vue";
import ThreeElement from "./Home/ThreeElement.vue";
import FourElement from "./Home/FourElement.vue";
import FiveElement from "./Home/FiveElement.vue";
import FooterComponent from "@/layouts/full/FooterComponent.vue";
import { useDisplay } from "vuetify";
import { ref } from "vue";
import { loadSlim } from "tsparticles-slim";
import type { Engine, Container } from "tsparticles-engine";

const isMobile = ref(useDisplay().smAndDown);
const particlesInit = async (engine: Engine) => {
  await loadSlim(engine);
};

const particlesLoaded = async (container: Container | undefined) => {
};

const optionsParticles = {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        value_area: 800,
      },
    },
    color: {
      value: "#00c0fa",
    },
    shape: {
      type: "images",
      opacity: 0.2,
      stroke: {
        width: 0,
        color: "#2b56f5",
      },
      polygon: {
        nb_sides: 5,
      },
      image: {
        src: "/xeler.ico",
        width: 100,
        height: 100,
      },
    },
    opacity: {
      value: 0.3,
      random: false,
      anim: {
        enable: false,
        speed: 1,
        opacity_min: 0.12,
        sync: false,
      },
    },
    size: {
      value: 6,
      random: true,
      anim: {
        enable: false,
        speed: 40,
        size_min: 0.08,
        sync: false,
      },
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#2b56f5",
      opacity: 0.3,
      width: 1.3,
    },
    move: {
      enable: true,
      speed: 3,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
        rotateX: 600,
        rotateY: 1200,
      },
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "repulse",
      },
      onclick: {
        enable: true,
        mode: "push",
      },
      resize: true,
    },
    modes: {
      grab: {
        distance: 400,
        line_linked: {
          opacity: 1,
        },
      },
      bubble: {
        distance: 400,
        size: 40,
        duration: 2,
        opacity: 8,
        speed: 3,
      },
      repulse: {
        distance: 200,
        duration: 0.4,
      },
      push: {
        particles_nb: 4,
      },
      remove: {
        particles_nb: 2,
      },
    },
  },
  retina_detect: true,
};
</script>
