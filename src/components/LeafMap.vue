<script setup lang="ts">
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, ref } from "vue";
import { LMap, LMarker, LTileLayer } from "@vue-leaflet/vue-leaflet";

const zoom = ref(20);
defineProps<{ coordinates: [number, number] }>();
onMounted(() => {
  const map = L.map("map", {
    center: [51.505, -0.09],
    zoom: 13,
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(map);
});
</script>

<template>
  <div>
    <div id="map"></div>
    <l-map
      style="width: 100%; height: 500px"
      ref="map"
      v-model:zoom="zoom"
      :center="coordinates"
    >
      <l-tile-layer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>

      <l-marker :lat-lng="coordinates"></l-marker>
    </l-map>
  </div>
</template>

<style scoped lang="sass">
$size: 0px
#map
  width: $size
  height: $size
</style>
