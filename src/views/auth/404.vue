<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();

const comeBack = () => {
  return router.push({ name: "Home" });
};
</script>

<template>
  <v-row class="d-flex justify-center align-center h-100">
    <v-col cols="12" sm="12" lg="11">
      <v-card class="py-5">
        <VRow>
          <VCol cols="12" class="text-center">
            <v-divider />
            <v-toolbar color="transparent">
              <v-toolbar-title class="font-weight-medium">
                {{ $t("views.404.title") }}
              </v-toolbar-title>
            </v-toolbar>
            <v-divider />
            <VBtn @click="comeBack" class="my-3">
              {{ $t("general-views.goin-dashboard") }}
            </VBtn>
          </VCol>
        </VRow>
        <VSpacer></VSpacer>
      </v-card>
    </v-col>
  </v-row>
</template>
<style>
.custom-label {
  color: gray;
}

.v-field__field input {
  padding-top: 0px;
  text-align: center;
}
.v-field {
  --v-input-control-height: 48px !important;
  --v-field-input-padding-top: 0px !important;
  --v-field-input-padding-bottom: 0px !important;
  --v-field-input-min-height: 42px !important;
  --v-input-padding-top: 2px !important;
  --v-field-padding-top: 0px !important;
  --v-field-padding-bottom: 1px !important;
}
</style>
