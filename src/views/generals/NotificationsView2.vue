<template>
  <div class="notification-wrapper">
    <NotificationList />
  </div>
</template>
<script setup lang="ts">
import NotificationList from "@/components/global/NotificationList.vue";
</script>

<style scoped>
.notification-wrapper {
  display: flex;
  align-items: center;
  min-height: 10vh;
}
</style>
