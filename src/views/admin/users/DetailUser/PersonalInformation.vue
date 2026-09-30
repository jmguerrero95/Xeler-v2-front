<template>
    <div class="text-table d-flex gap-2 justify-center flex-wrap">
        <div class="border-degree pa-2 text-table" style="min-width: 300px">
            <div class="font-weight-light text-primary">
                Datos Personales
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Referido por:</div>
                <div>
                    {{ user.relationships?.referred?.attributes?.username }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Nombre Completo:</div>
                <div>
                    {{ getFullName(user) }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Documento Identidad:</div>
                <div>
                    {{ user.relationships?.userDetail.attributes.document }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Nacionalidad:</div>
                <div>
                    {{
                        user.relationships?.userDetail.relationships
                            ?.nationality?.attributes.name
                    }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Correo:</div>
                <div>
                    {{ user.attributes.email }}
                </div>
            </div>
            <div class="d-flex gap-2">
                <div class="font-weight-light">Teléfono:</div>
                <div>
                    {{ user.attributes.code_phone }} {{ user.attributes.phone }}
                </div>
            </div>
        </div>
        <div class="border-degree pa-2 text-table" style="min-width: 250px">
            <div class="font-weight-light text-primary">
                Datos de Habitación
            </div>
            <div class="d-flex flex-column h-100 pb-8 justify-center">
                <div class="d-flex gap-2">
                    <div class="font-weight-light">País:</div>
                    <div>
                        {{
                            user.relationships?.userDetail.relationships
                                ?.country?.attributes.name
                        }}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <div class="font-weight-light">Departamento:</div>
                    <div>
                        {{
                            user.relationships?.userDetail.relationships
                                ?.department?.attributes.name
                        }}
                    </div>
                </div>
            </div>
        </div>
        <div class="border-degree pa-2 text-table ali" style="min-width: 250px">
            <div class="font-weight-light text-primary">
                Nivel de Verificación
            </div>
            <div class="d-flex flex-column h-100 pb-8 justify-center">
                <div class="d-flex gap-2">
                    <div class="font-weight-light">Teléfono:</div>
                    <div
                        :class="
                            user.attributes.phone_verified_at
                                ? 'text-success'
                                : 'text-warning'
                        "
                    >
                        {{
                            user.attributes.phone_verified_at
                                ? "Verificado"
                                : "No Verificado"
                        }}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <div class="font-weight-light">Correo:</div>
                    <div
                        :class="
                            user.attributes.email_verified_at
                                ? 'text-success'
                                : 'text-warning'
                        "
                    >
                        {{
                            user.attributes.email_verified_at
                                ? "Verificado"
                                : "No Verificado"
                        }}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <div class="font-weight-light">KYC:</div>
                    <div
                        :class="
                            user.relationships?.kyc?.attributes?.status ===
                            KYC_STATUS.ACCEPT
                                ? 'text-success'
                                : 'text-warning'
                        "
                    >
                        {{
                            user.relationships?.kyc?.attributes?.status ===
                            KYC_STATUS.ACCEPT
                                ? "Verificado"
                                : "No Verificado"
                        }}
                    </div>
                </div>
            </div>
        </div>
        <div class="d-flex gap-2"></div>
    </div>
</template>

<script setup lang="ts">
import { KYC_STATUS } from "@/enums/Kyc.enum";
import { getFullName } from "@/helper";
import type { User } from "@/interfaces/User/User.model";

const props = defineProps<{
    user: User;
}>();
</script>

<style scoped lang="scss"></style>
