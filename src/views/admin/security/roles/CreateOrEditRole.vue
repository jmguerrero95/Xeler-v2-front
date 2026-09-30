<template>
    <div class="text-table">
        <VForm 
        @submit.prevent="()=>{}"
        >
            <div class="font-22 font-weight-light text-primary">
                {{ helper.clickIn == "Edit" ? "Editar" : "Crear" }} Rol
            </div>
            <div class="my-5" :class="$vuetify.display.xs ? 'w-75' : 'w-25'">
                <div>
                    <InputComponent
                        v-model="form.name"
                        name="Nombre"
                        :rules="[validator.required]"
                    >
                    </InputComponent>
                </div>
            </div>
            <div>
                <div >
                    <TableComponent
                        :optionsHabilit="false"
                        :headers="headers"
                        :items="roleStore.permissionCategories"
                    >
                        <template #name="{ data }">
                            <th class="text-left text-primary text-capitalize"  style="width: 280px;">
                                {{ data }} 
                            </th>
                        </template>
                        <template #cel-name="{ data }">
                            <div class="text-left">
                                {{ permissionCategory(data).attributes.name }}
                            </div>
                        </template>

                        <template #cel-permissions="{ data }">
                            <div class="v-row" style="min-width: 800px;">
                                <VCheckbox 
                                    class="v-col-2 text-capitalize"
                                    v-for="(permission, index) in orderPermissions(permissionCategory(data))"
                                    :key="index"
                                    v-model="permissions"
                                    :value="permission.id"
                                    density="compact"
                                    hideDetails
                                    :label="getNamePermission(permission)">
                                </VCheckbox>
                            </div>
                        </template>
                    </TableComponent>
                </div>
            </div>
            <div class="d-flex justify-space-between align-center flex-column flex-sm-row gap-2">
                <div>
                    <VBtnSecondary @click="clearForm">
                        Atrás
                    </VBtnSecondary>
                </div>
                <div>
                    <VBtnPrimary v-if="canPersistRole" @click="runWithTwoFactor(storeRole, 'admin.security')">
                        Guardar
                    </VBtnPrimary>
                </div>
            </div>
        </VForm>
    </div>
</template>

<script setup lang="ts">
import { helperStore } from "@/helper";
import InputComponent from "@/components/InputComponent.vue";
import { reactive } from "vue";
import type { RoleCreate } from "@/interfaces/Role/Role.dto";
import * as validator from '@/validator'
import TableComponent from "@/components/global/TableComponent.vue";
import type { Head } from "@/interfaces/TableComponent.helper";
import { RoleStore } from '@/stores/RoleStore'
import type { Permission, PermissionCategory } from '@/interfaces/Permission/Permission.model'
import type { Role } from "@/interfaces/Role/Role.model";
import { ref } from "vue";
import type { Method } from "axios";
import { computed } from "vue";
import { UserStore } from "@/stores/UserStore";
import { useTwoFactorGuard } from "@/composables/useTwoFactorGuard";

const emits = defineEmits<{
    (e: 'create-or-update' ):void
}>()
const props = defineProps<{
    role?: Role
}>()

const helper = helperStore();
const { runWithTwoFactor } = useTwoFactorGuard();
const roleStore = RoleStore()
const userStore = UserStore()
const canPersistRole = computed(() =>
    userStore.hasPermission(props.role ? "roles.updated" : "roles.store")
)
const form = reactive<RoleCreate>({
    name: '',
    permissions: []
})

const permissions = ref<number[]>(props.role?.relationships?.permissions.map(permiss => permiss.id) ?? [])

if(props.role){
    form.name = props.role.attributes?.name
}

const orderPermissions = (item: PermissionCategory) => item.relationships?.permissions.sort((a, b) => {
    const nameA = a.attributes.name.toLowerCase();
    const nameB = b.attributes.name.toLowerCase();
    return nameA.localeCompare(nameB);
});


const permissionCategory = (item:unknown): PermissionCategory => item as PermissionCategory

const verifyPermissionName = (sufix: PermissionSufix, item:Permission): boolean => item.attributes.name.includes(sufix)

const getNamePermission = (item: Permission):string => {
    const supportLabels: Record<string, string> = {
        'support_chat.access': 'Acceder al chat',
        'support_chat.view_all': 'Ver todas las conversaciones',
        'support_chat.reply': 'Responder conversaciones',
        'support_chat.initiate': 'Iniciar conversaciones',
        'support_chat.assign': 'Asignar conversaciones',
        'support_chat.close': 'Cerrar o reabrir conversaciones',
        'support_chat.block': 'Bloquear o desbloquear chat de clientes',
    }
    if (supportLabels[item.attributes.name]) return supportLabels[item.attributes.name]
    const nameSplit = item.attributes.name.split('.')[1] as PermissionSufix
    return nameSplit.replace('_',' ')
    return NAME_PERMISSIONS[nameSplit]
}

const headers: Head[] = [
    {
        name: 'Categoría',
        value: "name",
        
    },
    {
        name: 'Permisos',
        value: "permissions",
    },
];
type PermissionSufix = 'index' | 'store' | 'delete' | 'updated' | 'show' | 'restore'

const NAME_PERMISSIONS = {
    index: 'Listar',
    store: 'Crear',
    delete: 'Eliminar',
    show: 'Ver',
    restore: 'Restaurar',
    updated: 'Editar'
}

const storeRole = async () => {
    let url = 'roles'
    let method: Method = 'post'
    let message = 'Creado correctamente'
    if(helper.clickIn == 'Edit') {
        url += `/${props.role?.id}`
        method = 'put' 
        message = 'Actualizado correctamente'
    }
    form.permissions = permissions.value
    const data = form
    await helper.http(url, method, { data }, message, false, { idempotent: true, financialScope: "admin.security" })
    clearForm()
    emits('create-or-update')
}

const clearForm = () => {
    form.permissions = []
    form.name = ''
    helper.clickIn = ''
}
</script>

<style scoped></style>
