<template>
  <VForm validate-on="input" @submit.prevent="() => {}">
    <template #default="{ isValid }">
      <div class="text-table d-flex flex-wrap mx-auto" style="max-width: 550px">
        <div class="w-100">
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center justify-space-between"
          >
            <div class="text-center text-sm-left">
              Tiempo inicial Venta/Compra (minutos)
            </div>
            <div style="width: 150px">
              <input-component
                v-model="form.initial_time"
                name="initial_time"
                without-label
                :rules="[validator.required]"
                type="number"
              ></input-component>
            </div>
          </div>
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center mt-4 justify-space-between"
          >
            <div class="text-center text-sm-left">
              Tiempo para subir comprobante Venta/Compra (minutos)
            </div>
            <div style="width: 150px">
              <input-component
                v-model="form.confirmation_time"
                name="confirmation_time"
                without-label
                :rules="[validator.required]"
              ></input-component>
            </div>
          </div>
        </div>
        <div class="w-100">
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center mt-4 justify-space-between"
          >
            <div class="text-center text-sm-left">
              Fees administrativo (COP)
            </div>
            <div style="width: 150px">
              <input-component
                v-model="form.administrative_fee"
                name="administrative_fee"
                :rules="[validator.required]"
                :events="eventsAdministrative"
                without-label
              ></input-component>
            </div>
          </div>
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center mt-4 justify-space-between"
          >
            <div class="text-center text-sm-left">
              Aplicar Fee Administrivo a montos inferiores de (COP):
            </div>
            <div style="width: 150px">
              <input-component
                v-model="form.order_fee_limit"
                name="order_fee_limit"
                :rules="[validator.required]"
                :events="eventsLimit"
                without-label
              ></input-component>
            </div>
          </div>
        </div>
        <div class="w-100">
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center mt-4 justify-space-between"
          >
            <div class="text-center text-sm-left">Min. XCOP para retiro</div>
            <div style="width: 150px">
              <input-component
                v-model="form.min_withdrawal_xcop"
                name="min_withdrawal_xcop"
                :rules="[validator.required]"
                :events="eventsXcop"
                without-label
              ></input-component>
            </div>
          </div>
        </div>
        <div class="w-100">
          <div
            class="d-flex flex-column flex-sm-row gap-2 align-center mt-4 justify-space-between"
          >
            <div class="text-center text-sm-left">Fee para retiro de XCOP</div>
            <div style="width: 150px">
              <input-component
                v-model="form.fee_withdrawal_xcop"
                name="fee_withdrawal_xcop"
                :rules="[validator.required]"
                :events="eventsXcopFee"
                without-label
              ></input-component>
            </div>
          </div>
        </div>
        <div class="w-100 text-center my-3">
          <VBtnPrimary
            v-if="canUpdateConfigurations"
            @click="updateGeneralConfiguration"
            :disabled="!isValid"
          >
            Guardar
          </VBtnPrimary>
        </div>
      </div>
    </template>
  </VForm>
</template>

<script setup lang="ts">
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const { authorizeWithTwoFactor } = useTwoFactorGuard();

import { ref, computed, reactive } from "vue";
import {
  formatNumber,
  helperStore,
  formatNumberStringToNumber,
} from "@/helper";
import { storeToRefs } from "pinia";
import type { ConfigurationGeneralsAttributes } from "@/interfaces/ConfigurationGenerals/ConfigurationGenerals.model";
import InputComponent from "@/components/InputComponent.vue";
import { GeneralConfiguration } from "@/stores/GeneralConfiguration";
import * as validator from "@/validator";
import type { EventComponent } from "@/interfaces/Components.helper";
import { UserStore } from "@/stores/UserStore";

const helper = helperStore();
const userStore = UserStore();
const canUpdateConfigurations = computed(() =>
  userStore.hasPermission("configurations.updated")
);
const generalConfiguration = GeneralConfiguration();
const form = reactive<ConfigurationGeneralsAttributes>({
  administrative_fee: "0",
  confirmation_time: "0",
  initial_time: "0",
  order_fee_limit: "0",
  min_withdrawal_xcop: "0",
  fee_withdrawal_xcop: "0",
});
const { generalData } = storeToRefs(generalConfiguration);

generalConfiguration.getGeneralData().then(() => {
  form.initial_time = generalData.value!.attributes.initial_time;
  form.confirmation_time = generalData.value!.attributes.confirmation_time;
  form.administrative_fee = formatNumber(
    generalData.value!.attributes.administrative_fee as number,
  );
  form.order_fee_limit = formatNumber(
    generalData.value!.attributes.order_fee_limit as number,
  );
  form.min_withdrawal_xcop = formatNumber(
    generalData.value!.attributes.min_withdrawal_xcop as number,
  );
  form.fee_withdrawal_xcop = formatNumber(
    generalData.value!.attributes.fee_withdrawal_xcop as number,
  );
});

const updateGeneralConfiguration = async () => {
  const url = "general/configuration/1";
  form.administrative_fee = formatNumberStringToNumber(
    form.administrative_fee as string,
  );
  form.order_fee_limit = formatNumberStringToNumber(
    form.order_fee_limit as string,
  );
  form.min_withdrawal_xcop = formatNumberStringToNumber(
    form.min_withdrawal_xcop as string,
  );
  form.fee_withdrawal_xcop = formatNumberStringToNumber(
    form.fee_withdrawal_xcop as string,
  );
  const data = form;
  const res = await authorizeWithTwoFactor(helper.http.bind(helper, url, "put", { data }, "", false, { financialScope: "finance.financial_configuration" }), "finance.financial_configuration");
  generalConfiguration.getGeneralData().then(() => {
    form.initial_time = generalData.value!.attributes.initial_time;
    form.confirmation_time = generalData.value!.attributes.confirmation_time;
    form.administrative_fee = formatNumber(
      generalData.value!.attributes.administrative_fee as number,
    );
    form.order_fee_limit = formatNumber(
      generalData.value!.attributes.order_fee_limit as number,
    );
    form.min_withdrawal_xcop = formatNumber(
      generalData.value!.attributes.min_withdrawal_xcop as number,
    );
    form.fee_withdrawal_xcop = formatNumber(
      generalData.value!.attributes.fee_withdrawal_xcop as number,
    );
  });
};

const eventsAdministrative: EventComponent = {
  keypress: (event: any) => {
    if (!validator.keyPressIsNumber(event) && event.key != "Backscape") {
      event.preventDefault();
      return;
    }
    // amountFiat.value = amountFormat(event)
  },
  keyup: (event: any) => {
    form.administrative_fee = validator.amountFormat(event, 1);
  },
};
const eventsXcop: EventComponent = {
  keypress: (event: any) => {
    if (!validator.keyPressIsNumber(event) && event.key != "Backscape") {
      event.preventDefault();
      return;
    }
    // amountFiat.value = amountFormat(event)
  },
  keyup: (event: any) => {
    form.min_withdrawal_xcop = validator.amountFormat(event, 1);
  },
};
const eventsXcopFee: EventComponent = {
  keypress: (event: any) => {
    if (!validator.keyPressIsNumber(event) && event.key != "Backscape") {
      event.preventDefault();
      return;
    }
    // amountFiat.value = amountFormat(event)
  },
  keyup: (event: any) => {
    form.fee_withdrawal_xcop = validator.amountFormat(event, 1);
  },
};
const eventsLimit: EventComponent = {
  keypress: (event: any) => {
    if (!validator.keyPressIsNumber(event) && event.key != "Backscape") {
      event.preventDefault();
      return;
    }
    // amountFiat.value = amountFormat(event)
  },
  keyup: (event: any) => {
    form.order_fee_limit = validator.amountFormat(event, 1);
  },
};
</script>

<style scoped></style>
