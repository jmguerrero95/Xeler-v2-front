<template>
  <div class="d-flex align-center justify-center text-center pa-8">
    <div>
      <h2 class="text-primary mb-2">Acceso no permitido</h2>
      <p class="text-table mb-4">
        No tienes permisos para acceder a esta seccion.
      </p>
      <VBtnPrimary @click="$router.back()">Volver</VBtnPrimary>
    </div>
  </div>
</template>
