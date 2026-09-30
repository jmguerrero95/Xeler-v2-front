import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import vuetify from "./plugins/vuetify";
import "@/scss/style.scss";
import VueApexCharts from "vue3-apexcharts";
import { createPinia } from "pinia";
import { createI18n } from "vue-i18n";
import Vue3Toastify, { type ToastContainerOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import messages from "@/lang";
import "vue-tel-input/vue-tel-input.css";
import { Buffer } from "buffer";
import Particles from "vue3-particles";
import "aos/dist/aos.css";
import VueTyper from "vue3-typer";
import "vue3-typer/dist/vue-typer.css";
// Asigna la variable global de Buffer para que esté disponible en tu aplicación
//@ts-ignore
window.Buffer = Buffer;

const app = createApp(App);
const pinia = createPinia();
const i18n = createI18n({
  locale: localStorage.getItem("lang") ?? "es", // set locale
  fallbackLocale: "en", // set fallback locale
  messages, // set locale messages
  // If you need to specify other options, you can set other options
  // ...
  legacy: false,
});
app
  .use(VueApexCharts)
  .use(router)
  .use(pinia)
  .use(i18n)
  .use(Particles)
  //@ts-ignore
  .use(VueTyper)
  .use(Vue3Toastify, {
    autoClose: 3000,
    theme: "colored",
  } as ToastContainerOptions)
  .use(vuetify)
  .mount("#app");
