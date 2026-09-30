<template>
    <VFooter>
        <div class="w-100 text-center">
            <div class="d-flex justify-center">
                <a target="_blank" href="https://t.me/coin2cop">
                    <VIcon title="Telegram" color="table-icon" :icon="TelegramIcon" />
                </a>
                <a target="_blank" href="https://www.instagram.com/xelercrypto/">
                    <VIcon title="Instagram" color="table-icon" icon="mdi-instagram" />
                </a>
                <a target="_blank" href="https://twitter.com/Xeler_ex">
                    <VIcon title="X" color="table-icon" icon="mdi-twitter" />
                </a>
                <a target="_blank" href="https://m.facebook.com/Xelerex">
                    <VIcon title="Facebook" color="table-icon" icon="mdi-facebook" />
                </a>
            </div>
            <span class="text-table-icon">
                {{dayjs().year()}} Xeler Go Todos los derechos reservados
            </span>
        </div>
    </VFooter>
</template>

<script setup lang="ts">
import TelegramIcon from '@/assets/icons/layout/footer/TelegramIcon.vue'
import dayjs from 'dayjs';

</script>

<style scoped></style>