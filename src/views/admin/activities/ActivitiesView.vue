<template>
    <div class="d-flex justify-space-between text-primary">
        <h3>Actividades</h3>
    </div>
    <TableComponentVue
        :optionsHabilit="false"
        :headers="headers"
        :items="helper.items"
    >

    </TableComponentVue>
</template>

<script setup lang="ts">
import TableComponentVue from "@/components/global/TableComponent.vue";
import {helperStore } from "@/helper";
import type { Head } from "@/interfaces/TableComponent.helper";
import { ref } from "vue";

const helper = helperStore();
helper.url = "users/activity/user/active/session";

helper.initView()
helper.index();


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

<style scoped>

</style>
