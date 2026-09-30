<template>
  <div class="d-flex justify-space-between text-primary">
    <h3>Actividades</h3>
  </div>
  <TableComponentVue
    :optionsHabilit="false"
    :headers="headers"
    :items="activities"
  >
  </TableComponentVue>
</template>

<script setup lang="ts">
import TableComponentVue from "@/components/global/TableComponent.vue";
import { helperStore } from "@/helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import type { ActivityUser } from "@/interfaces/User/Activities/Activity.model";
import type { User } from "@/interfaces/User/User.model";
import { ref } from "vue";

const props = defineProps<{
  user: User;
}>();

const helper = helperStore();
const url = "users/activity/user/" + props.user.id;
const activities = ref<ActivityUser[]>([]);
helper.http(url).then((res: any) => (activities.value = res.data.response));

const search = ref<string>("");

const headers: Head[] = [
  {
    name: "País",
    value: "attributes.country",
  },
  {
    name: "Navegador",
    value: "attributes.browser",
  },
  {
    name: "Dispositivo",
    value: "attributes.device",
  },
  {
    name: "IP",
    value: "attributes.ip",
  },
  {
    name: "Ciudad",
    value: "attributes.city",
  },
  {
    name: "Proveedor",
    value: "attributes.isp",
  },
];
</script>

<style scoped></style>
