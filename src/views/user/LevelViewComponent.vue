<template>
  <div style="max-width: 300px" class="mx-auto">
    <div class="mb-2">
      <VBtnPrimary @click="back"> Atrás </VBtnPrimary>
    </div>
    <div
      class="border rounded-20-t rounded-20-b"
      style="height: 360px"
      :class="[`border-color-level-${levelUser}`]"
    >
      <div
        class="rounded-20-t d-flex justify-end pr-4 pt-1"
        :class="[`bg-auth-level-${levelUser}`]"
        style="height: 20px"
      >
        <div class="bg-white d-flex justify-center align-center bg-icon-level">
          <svg
            width="38"
            height="38"
            viewBox="0 0 38 38"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            :class="`text-auth-level-${levelUser}`"
          >
            <circle cx="19" cy="19" r="19" fill="currentColor" />
            <path
              d="M24.6639 27.8282L25.6767 28.4388L25.409 27.2868L23.9093 20.8326L28.9033 16.508L29.7988 15.7326L28.6185 15.6318L22.0308 15.0694L19.4604 9.00488L18.9995 7.91753L18.5395 9.00525L15.969 15.0835L9.38147 15.6458L8.20124 15.7466L9.09669 16.522L14.0906 20.8465L12.591 27.2866L12.3227 28.4392L13.3361 27.8282L19 24.4138L24.6639 27.8282ZM5.5 19C5.5 11.5475 11.5348 5.5 18.986 5.5C26.4522 5.5 32.5 11.5485 32.5 19C32.5 26.4515 26.4522 32.5 18.986 32.5C11.5348 32.5 5.5 26.4525 5.5 19Z"
              fill="white"
              stroke="#currentColor"
            />
          </svg>
        </div>
      </div>
      <div>
        <div class="text-24 text-table-2 text-center">
          <span> Nivel {{ levelUser }} </span>
          <VIcon
            v-if="user.level_user === levelUser"
            size="18"
            class="ml-3"
            color="ok-2"
          >
            <svg
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 7C14 10.866 10.866 14 7 14C3.134 14 0 10.866 0 7C0 3.134 3.134 0 7 0C10.866 0 14 3.134 14 7ZM6.19031 10.7064L11.3839 5.51289C11.5602 5.33654 11.5602 5.05058 11.3839 4.87423L10.7452 4.23556C10.5688 4.05918 10.2829 4.05918 10.1065 4.23556L5.87097 8.47107L3.8935 6.4936C3.71714 6.31725 3.43119 6.31725 3.2548 6.4936L2.61614 7.13227C2.43978 7.30862 2.43978 7.59458 2.61614 7.77093L5.55162 10.7064C5.728 10.8828 6.01393 10.8828 6.19031 10.7064Z"
                fill="currentColor"
              />
            </svg>
          </VIcon>
        </div>
        <div class="d-flex mx-auto w-100 justify-center ga-2">
          <VIcon size="14" :color="emailVerified ? 'ok-2' : 'inactive'">
            <svg
              viewBox="0 0 10 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0V8H10V0H0ZM4.6 4.78333C4.71562 4.86935 4.85589 4.9158 5 4.9158C5.14411 4.9158 5.28438 4.86935 5.4 4.78333L5.8889 4.41667L9.33333 7V7.33333H0.666667V7L4.1111 4.41667L4.6 4.78333ZM5 4.25L0.666667 1V0.666667H9.33333V1L5 4.25ZM0.666667 1.83333L3.55556 4L0.666667 6.16667V1.83333ZM9.33333 6.16667L6.44444 4L9.33333 1.83333V6.16667Z"
                fill="currentColor"
              />
            </svg>
          </VIcon>
          <VIcon size="14" :color="phoneVerified ? 'ok-2' : 'inactive'">
            <svg
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.71408 1.03913L9.69756 1.02881L7.60929 0L5.35535 3.00525L6.39233 4.38799C6.3613 4.90945 6.14016 5.40144 5.77078 5.77082C5.40139 6.1402 4.9094 6.36133 4.38794 6.39235L3.00523 5.35537L0 7.60927L1.02025 9.68008L1.02883 9.69756L1.03918 9.71406C1.09362 9.80178 1.16962 9.87411 1.25992 9.92417C1.35023 9.97422 1.45184 10.0003 1.55509 10H2.09394C3.13218 10 4.16025 9.7955 5.11946 9.39818C6.07867 9.00086 6.95023 8.4185 7.68437 7.68436C8.41852 6.95021 9.00087 6.07865 9.39819 5.11944C9.79551 4.16023 10 3.13215 10 2.09391V1.55504C10.0003 1.4518 9.97423 1.35018 9.92418 1.25988C9.87413 1.16957 9.8018 1.09358 9.71408 1.03913ZM9.22829 2.09391C9.22829 6.02782 6.02782 9.22829 2.09394 9.22829H1.65792L0.975295 7.84252L3.00537 6.31996L4.13561 7.16761H4.26422C5.03403 7.16675 5.77206 6.86056 6.31639 6.31623C6.86073 5.77189 7.16691 5.03386 7.16778 4.26405V4.13544L6.32013 3.00523L7.84252 0.975271L9.22829 1.65802V2.09391Z"
                fill="currentColor"
              />
            </svg>
          </VIcon>
          <VIcon size="14" :color="kycVerified ? 'ok-2' : 'inactive'">
            <svg
              viewBox="0 0 10 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.15218 4.22454L2.32617 7.15015L2.85894 7.66478L5.68496 4.73918L5.15218 4.22454Z"
                fill="currentColor"
              />
              <path
                d="M6.53725 5.98222C6.88372 5.63463 7.07806 5.16372 7.07755 4.67295C7.07705 4.18217 6.88175 3.71166 6.53455 3.36479C6.18736 3.01792 5.71668 2.82305 5.2259 2.823C4.73512 2.82294 4.2644 3.01771 3.91713 3.36451L2.18315 5.09849C1.92138 5.36168 1.61001 5.57034 1.26706 5.71239C0.924108 5.85445 0.556389 5.92707 0.185185 5.92606H0V6.6668H0.185185C0.65371 6.66808 1.11784 6.57642 1.5507 6.39712C1.98356 6.21782 2.37656 5.95445 2.70694 5.62224L4.4409 3.88828C4.64928 3.6799 4.9319 3.56284 5.22659 3.56284C5.52127 3.56284 5.80389 3.6799 6.01227 3.88828C6.22064 4.09666 6.33771 4.37927 6.33771 4.67396C6.33771 4.96865 6.22064 5.25127 6.01227 5.45965L4.43336 7.06601C3.84537 7.66139 3.51654 8.46503 3.51852 9.3018V10.1853H4.25926V9.3018C4.25774 8.65936 4.5102 8.04236 4.96162 7.58525L6.53725 5.98222Z"
                fill="currentColor"
              />
              <path
                d="M8.08192 7.05688C7.62199 7.55688 6.17204 9.02448 6.15743 9.03913L6.15512 9.04144C6.12947 9.06783 6.09889 9.08891 6.0651 9.10348C6.03131 9.11805 5.99498 9.12582 5.95819 9.12635C5.9214 9.12688 5.88487 9.12015 5.85067 9.10656C5.81648 9.09297 5.7853 9.07278 5.75891 9.04714C5.73252 9.0215 5.71144 8.99091 5.69688 8.95712C5.68231 8.92333 5.67454 8.88701 5.67401 8.85021C5.67348 8.81342 5.6802 8.77689 5.69379 8.7427C5.70738 8.7085 5.72758 8.67732 5.75322 8.65093L7.58549 6.76711C7.8776 6.47479 8.10927 6.12779 8.26726 5.74593C8.42526 5.36407 8.50649 4.95483 8.50632 4.54158C8.50614 4.12832 8.42457 3.71915 8.26625 3.33742C8.10793 2.95569 7.87597 2.60889 7.58361 2.31681C6.35613 1.08938 4.35891 1.08938 3.13146 2.31681L1.71016 3.78209C0.967384 4.44455 0.702546 4.44454 0 4.44454V5.18529C0.845949 5.18529 1.29343 5.14876 2.21361 4.32559L2.2234 4.31684L3.65715 2.83878C4.10888 2.38754 4.72136 2.13424 5.35985 2.13458C5.99834 2.13493 6.61055 2.38891 7.06178 2.84063C7.51302 3.29236 7.76633 3.90484 7.76598 4.54333C7.76563 5.18182 7.51166 5.79403 7.05993 6.24526L5.22222 8.13452C5.03335 8.32854 4.9293 8.58965 4.93294 8.86039C4.93658 9.13114 5.04763 9.38935 5.24166 9.57821C5.43568 9.76708 5.69678 9.87114 5.96753 9.8675C6.23827 9.86385 6.49648 9.7528 6.68535 9.55878C6.75907 9.48417 8.16067 8.06549 8.62713 7.55832C9.43546 6.67941 10 5.47512 10 4.62973H9.25926C9.25926 5.28364 8.7531 6.32709 8.08192 7.05688Z"
                fill="currentColor"
              />
              <path
                d="M8.72948 1.23843C7.91539 0.451389 6.89337 0 5.92578 0V0.740741C6.70314 0.740741 7.5374 1.11623 8.21467 1.77083C8.86867 2.40313 9.25911 3.19488 9.25911 3.88889H9.99986C9.99986 2.98484 9.53689 2.01875 8.72948 1.23843Z"
                fill="currentColor"
              />
              <path
                d="M1.96655 2.62477C2.47731 1.92012 3.3322 0.740741 5.18518 0.740741V0C2.95426 0 1.92157 1.42465 1.36678 2.19005C0.989792 2.71014 0.542731 2.96296 0 2.96296V3.7037C0.774907 3.7037 1.45493 3.33062 1.96655 2.62477Z"
                fill="currentColor"
              />
              <path
                d="M0.740741 7.22217H0V7.96291H0.740741C1.08442 7.9633 1.41391 8.1 1.65693 8.34302C1.89995 8.58604 2.03664 8.91553 2.03704 9.25921V10.1851H2.77778V9.25921C2.77716 8.71914 2.56235 8.20136 2.18047 7.81948C1.79858 7.43759 1.28081 7.22278 0.740741 7.22217Z"
                fill="currentColor"
              />
            </svg>
          </VIcon>
          <VIcon size="14" :color="addressVerified ? 'ok-2' : 'inactive'">
            <svg
              viewBox="0 0 10 11"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.39293 8.52162V4.98267H5.71436V8.52162H8.39293ZM6.42864 5.69695H7.67864V7.80733H6.42864V5.69695Z"
                fill="currentColor"
              />
              <path
                d="M5.33656 0.200415C5.19244 0.0678223 5.00265 -0.00392739 4.80686 0.000165991C4.61106 0.00425937 4.42443 0.0838789 4.28598 0.222379L0 4.50836V10.5185H2.5V6.94709H3.92857V10.5185H10V4.49079L5.33656 0.200415ZM9.28571 9.80423H4.64286V6.2328H1.78571V9.80423H0.714286V4.80423L4.85295 0.727357V0.726107L9.28571 4.80423V9.80423Z"
                fill="currentColor"
              />
            </svg>
          </VIcon>
        </div>
        <div class="mx-5">
          <span class="text-table-2" v-html="textLevel"></span>:
          <ul class="mx-5 text-table-2">
            <li
              v-for="(item, index) in itemsText"
              :key="index"
              v-html="item"
            ></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="text-center mt-5" v-if="levelUser < LevelAuth.THREE">
      <div class="text-table-2">Quieres avanzar al siguiente nivel?</div>
      <div
        class="text-primary"
        @click="levelUser < LevelAuth.THREE ? levelUser++ : ''"
      >
        Nivel {{ levelUser + 1 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LevelAuth } from "@/enums/LevelAuth.enum";
import { getUserAuth } from "@/helper";
import { ref, watch } from "vue";

const user = ref(getUserAuth());
const emits = defineEmits<(e: "back") => void>();
const levelUser = ref(0);
const emailVerified = ref(!!user.value.email_verified_at);
const phoneVerified = ref(!!user.value.phone_verified_at);
const kycVerified = ref(!!localStorage.getItem("kyc"));
const addressVerified = ref(false);
const textLevel = ref("");
const itemsText = ref<string[]>([]);

const changeValues = () => {
  switch (levelUser.value) {
    case LevelAuth.ONE:
      emailVerified.value = true;
      phoneVerified.value = true;
      kycVerified.value = false;
      addressVerified.value = false;
      textLevel.value =
        'Este es el primer nivel en <span class="text-primary">XELER GO</span> en este nivel ';
      itemsText.value = [
        "Compras y ventas limitadas",
        "Transacciones solamente en efectivo",
        "Soporte Básico",
      ];
      break;
    case LevelAuth.TWO:
      emailVerified.value = true;
      phoneVerified.value = true;
      kycVerified.value = true;
      addressVerified.value = false;
      textLevel.value =
        'En este nivel puedes hacer uso de todas las funciones de la plataforma y es suficiente para el usuario promedio de <span class="text-primary">XELER GO</span> en este nivel ';
      itemsText.value = [
        "Compras y ventas ilimitadas",
        "Transacciones en efectivo",
        "Transacciones virtuales",
        "Soporte Prioritario",
      ];
      break;
    case LevelAuth.THREE:
      emailVerified.value = true;
      phoneVerified.value = true;
      kycVerified.value = true;
      addressVerified.value = true;
      textLevel.value =
        'Este es el nivel mas avanzado <span class="text-primary">XELER GO</span> es recomendado para empresas o para transacciones OTC, en este nivel';
      itemsText.value = [
        "Acceso de línea de atencion personalizada 24/7 para transacciones OTC",
        "Posibilidad de hacer operaciones desde la cuenta bancaria de la empresa",
      ];
      break;
  }
};

watch(levelUser, () => changeValues());

levelUser.value = user.value.level_user;

const back = (): void => {
  emits("back");
  levelUser.value = user.value.level_user;
};
</script>

<style scoped lang="scss">
.rounded-20-t {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
}
.rounded-20-b {
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}
.bg-icon-level {
  $radius: 50px;
  height: $radius;
  width: $radius;
  border-radius: 50% 50%;
}

.border-color-level-1 {
  border-color: #d9d9d9 !important;
}
.border-color-level-2 {
  border-color: #31d02e !important;
}
.border-color-level-3 {
  border-color: #efaf0c !important;
}
</style>
