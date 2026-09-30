<script lang="ts" setup >
import type { FinancialStepUpScope } from "@/services/securityStepUp";
import type { Head } from '@/interfaces/TableComponent.helper';
import { storeToRefs } from 'pinia'
import type { CheckedOrBlockedType, Status, StatusOperationVerifiedValue, StatusOperationVerified } from '@/db';
import db from '@/db';
import { formatNumber, helperStore } from '@/helper';
import DialogConfirm from '@/components/global/DialogConfirm.vue';
import dayjs from 'dayjs';
import { type Ref, ref, inject, toRefs, computed, reactive, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import OptionsIcon from '@/assets/icons/OptionsIcon.vue'
import { useTwoFactorGuard } from '@/composables/useTwoFactorGuard';
import { UserStore } from '@/stores/UserStore';
import {
  buildActionPermission,
  getPermissionReferenceFromUrl,
  type ActionPermissions,
  type CrudAction,
} from '@/utils/permissionActions';

const { t } = useI18n()
const helper = helperStore()
const userStore = UserStore()
const { runWithTwoFactor } = useTwoFactorGuard();
const { methodVerificatedStatus, item: itemHelper, clickIn, pagination: paginationH } = storeToRefs(helper)
onUnmounted(() => {
  paginationH.value.currentPage = 1 
})
const props = defineProps<Props>()

const { headers } = toRefs(props)
const emit = defineEmits(['show', 'update', 'delete','restore'])
if (!headers.value.find(item => item.value === 'actions') && props.optionsHabilit) {
  headers.value.push({
    name: t('general-views.actions'),
    value: 'actions'
  })
}
const statusText = ((text: string | boolean) => {
  let status: Status
  switch (text) {
    case true:
      status = "Active"
      break;
    case false:
      status = "Inactive"
      break;
    case "EN VERIFICACION":
      status = "Verification"
      break;
    case "EN ESPERA DE COMPROBANTE":
      status = "Awaiting"
      break;
    case "ACEPTADO":
      status = "Accept"
      break;
    case "RECHAZADO":
      status = "Reject"
      break;

    default:
      status = "Active"
      break;
  }
  return status
})


const getValue = (item: any, head: Head | string) => {
  const value = typeof head == 'string' ? head : head.value
  let valueArray = value.split('.')
  let res = item;

  valueArray.forEach((pos: string) => {
    res = res[pos] ?? ''
  })

  if (typeof head == 'string') {
    return res;
  }

  switch (head.type) {
    case 'date':
      return dayjs(res).format(head.format)
    case 'number':
      return formatNumber(res)
    case 'text':
      return res
    default:
      return res
  }
}

const setNameHead = (head: string) => head.toLocaleLowerCase().replace(' ', '-')


const title = ref("")
const content = ref("")
const message = ref("")
const idAccount = ref<string | number>("")
const dialogAction = ref(false)
const modalOpen = ref<'deleted' | 'acceptReject'>('deleted')

const openConfirmModal = (id: number) => {
  modalOpen.value = 'deleted'
  const deleted = isDeleted(id)
  title.value = deleted ? t('general-views.restore.title') : ( props.textDelete ? 'Desactivar' : t('general-views.delete.title'))
  content.value = deleted ? t('general-views.restore.content') : (props.textDelete ? "¿Estás seguro de desactivar?":t('general-views.delete.content'))
  title.value += ` ${props.singularName ?? ''}`
  content.value += ` ${props.singularName ?? ''}`
  idAccount.value = id
  dialogAction.value = true
}

const isDeleted = (id: any) => {
  let bool = false;
  let element = props.items.find((item: any) => item.id === id)

  if (element.attributes.deletedAt || element.attributes.deleted_at) {
    bool = true
  }
  return bool
}

const okDeletedRestore = async () => {
  const executeDeleteRestore = async () => {
    if(!isDeleted(idAccount.value)){
      emit('delete', idAccount.value)
    }else{
      emit('restore', idAccount.value)
    }

    await helper.deleted(idAccount.value, true, props.financialScope)
    helper.index()
    dialogAction.value = false
  }

  if (props.requireTwoFactor) {
        if (!props.financialScope) throw new Error("Falta el alcance de autorización de esta acción.");
    await runWithTwoFactor(executeDeleteRestore, props.financialScope)
    return
  }

  await executeDeleteRestore()
}

const getStatusColor = (item: any, head: Head) => {
  if (head.status === 'deleted') {
    return db.statusColor[statusText(!isDeleted(item.id))]
  }
  return db.statusColor[statusText(getValue(item, head))]
}

const getStatus = (item: any, head: Head) => {
  if (head.status === 'deleted') {
    return db.status[statusText(!isDeleted(item.id))]
  }
  return db.status[statusText(getValue(item, head))]
}

const elementIsVerificated = (item: any) => {
  if (!props.acceptReject) return
  const head: Head = {
    name: 'confirm',
    value: db.verificateStatusField[props.acceptReject]
  }
  const value = getValue(item, head)
  const statusValue = db.verificateStatusField[props.acceptReject] as StatusOperationVerifiedValue
  return value === db.verificateStatusValue[statusValue]
}

const confirmOrReject = ref<CheckedOrBlockedType>('accept')

const confirmAction = (item: any, bool: CheckedOrBlockedType) => {
  modalOpen.value = 'acceptReject'
  itemHelper.value = item
  confirmOrReject.value = bool
  title.value = t('general-views.update')
  content.value = bool == 'accept' ? t('general-views.accept.content') : t('general-views.reject.content')
  content.value += ` ${props.singularName ?? ''}?`
  message.value = `${props.singularName ?? ''} `
  message.value += bool == 'accept' ? t('general-views.accept.message') : t('general-views.reject.message')
  dialogAction.value = true

}

const pagination = reactive({
  perPage: 15,
  currentPage: 1,
  to: 1,
  total: 0,
})

const perPage = [
  5, 10, 15, 20, 50, 100
]

const itemsNew = computed(() => {
  if (!props.paginatedFront) return props.items
  pagination.total = Math.ceil(props.items.length / pagination.perPage)
  const start = pagination.perPage * (pagination.currentPage - 1)
  const end = start + pagination.perPage
  return props.items.slice(start, end)
})

if (props.acceptReject) {
  methodVerificatedStatus.value = props.acceptReject
}
const actionModal = {
  deleted: okDeletedRestore,
  acceptReject: async () => {
    await helper.checkedOrBlocked(props.acceptRejectURL!, confirmOrReject.value, message.value)
    dialogAction.value = false
  }
}

const permissionReference = computed(() =>
  props.permissionReference ?? getPermissionReferenceFromUrl(helper.url),
)

const resolvePermission = (action: CrudAction): string | null =>
  props.permissions?.[action] ?? buildActionPermission(action, permissionReference.value)

const canRunAction = (action: CrudAction): boolean => {
  const permission = resolvePermission(action)
  if (!permission) return true
  return userStore.hasPermission(permission)
}

const canShowItem = computed(() => canRunAction('show'))
const canUpdateItem = computed(() => canRunAction('update'))
const canDeleteItem = computed(() => canRunAction('delete'))
const canRestoreItem = computed(() => canRunAction('restore'))
const canAcceptItem = computed(() => canRunAction('accept'))
const canRejectItem = computed(() => canRunAction('reject'))

const canDeleteOrRestore = (item: any): boolean =>
  !props.immutableItemNames?.includes(String(item?.attributes?.name ?? ''))
  && (isDeleted(item.id) ? canRestoreItem.value : canDeleteItem.value)

const canUpdate = (item: any): boolean => canUpdateItem.value
  && !props.immutableItemNames?.includes(String(item?.attributes?.name ?? ''))

const hasDefaultActions = (item: any): boolean =>
  Boolean(
    (props.iconShow && !isDeleted(item.id) && canShowItem.value) ||
    (props.iconUpdate && !isDeleted(item.id) && canUpdate(item)) ||
    (props.iconDelete && canDeleteOrRestore(item)) ||
    (props.acceptReject && elementIsVerificated(item) && (canAcceptItem.value || canRejectItem.value)) ||
    props.newButtons,
  )
/**
 * Interfaces
 */

interface Props {
  optionsHabilit: boolean
  headers: Head[]
  items: any[]
  iconShow?: boolean
  iconUpdate?: boolean,
  iconDelete?: boolean,
  iconVoucher?: boolean,
  fixedHeader?: boolean,
  heightTable?: string,
  styleTable?: string,
  singularName?: string
  newButtons?: boolean,
  paginatedFront?: boolean,
  acceptReject?: StatusOperationVerified,
  acceptRejectURL?: string,
  simple?: boolean,
  optionsSimple?: {
    max_columns: number
    value: string
    withStatus?: boolean
  },
  textDelete?: string
  financialScope?: FinancialStepUpScope;
    requireTwoFactor?: boolean
  permissionReference?: string
  permissions?: ActionPermissions
  immutableItemNames?: string[]
}

const total_columns = 12;
const columns = props.optionsSimple?.max_columns ?? 1

const getMinWidth = computed(() => {
  return columns * 100 / total_columns
})

const maxColumns = computed(() => {
  return total_columns / columns
})
</script>

<template>
  <VRow dense v-if="simple" class="mx-1">
    <VCol v-for="(item, i) in itemsNew" :key="i" class="text-table " :cols="maxColumns">
      <div style="max-width: 300px">
        <div class="d-flex align-center w-100">
          <div v-for="head, k in headers" :key="k">
            <slot :name="`cel-${head.value}`" :data="item">
            <VChip v-if="head.status === true || head.status === 'deleted'" small :color="getStatusColor(item, head)"
              class=" font-weight-medium">
              <span class="">{{ getStatus(item, head) }}</span>
            </VChip>

            <slot v-if="optionsHabilit && head.value == 'actions'" name="actions">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-if="hasDefaultActions(item)" size="small" icon color="transparent" v-bind="props">
                    <VIcon color="primary" size="25" :icon="OptionsIcon" />
                  </v-btn>
                </template>

                <v-list class="border-primary rounded-xl">
                  <v-list-item>
                    <v-list-item-title v-if="iconShow && !isDeleted(item.id) && canShowItem" class="cursor-pointer" @click="() => { clickIn = 'Show'; emit('show', item) }">
                      <VBtn  :title="'Show'" color="transparent" size="x-small"
                        elevation="0" icon>
                        <VIcon color="primary"  size="24"
                          icon="mdi-eye-outline" />
                      </VBtn> {{$t('general-views.show')}}
                    </v-list-item-title>
                    <v-list-item-title class="cursor-pointer" v-if="iconUpdate && !isDeleted(item.id) && canUpdate(item)" @click="() => { clickIn = 'Edit'; emit('update', item) }">
                      <VBtn :title="'Update'" color="transparent" size="x-small"
                        elevation="0" icon>
                        <VIcon color="primary"  size="24"
                          icon="mdi-pencil-outline" />
                      </VBtn> {{$t('general-views.edit')}}
                    </v-list-item-title>
                    <v-list-item-title>
                      <slot v-if="newButtons" name="newButtons" :data="item"></slot>
                    </v-list-item-title>
                    <v-list-item-title class="cursor-pointer" v-if="iconDelete && canDeleteOrRestore(item)"  @click="openConfirmModal(item.id)">
                      <VBtn  :title="!isDeleted(item.id) ? 'Delete' : 'Restore'" color="transparent"
                        size="x-small" elevation="0" icon>
                        <VIcon color="primary" size="24"
                          :icon="!isDeleted(item.id) ? 'mdi-delete' : 'mdi-delete-restore'" />
                      </VBtn> {{ !isDeleted(item.id) ? ( textDelete ?? t('general-views.delete.title')) : t('general-views.restore.title') }}
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </slot>
            <!-- <VCol  class="me-auto "> -->
            <span v-else >
              {{ getValue(item, head) }}
            </span>
          </slot>

            <!-- </VCol> -->
          </div>

        </div>
      </div>
    </VCol>
  </VRow>

  <VTable v-if="!simple" 
    density="compact" 
    :fixed-header="fixedHeader" 
    :height="fixedHeader ? heightTable : ''"
    :style="styleTable"
    hide-default-footer 
    disable-sort
    hover
    >
    <thead style="background-color: #FBFBFB; font-size: 16px;">
      <tr>
        <slot v-for="head, i in headers" :name="setNameHead(head.value)" :data="head.name">
          <th class="text-center text-primary text-capitalize " :style="head.style" :class="head.class">
            {{ head.name }}
          </th>
        </slot>
      </tr>
    </thead>
    <tbody style="font-size: 16px;">
      <tr v-for="(item, i) in itemsNew" :key="i">
        <td v-for="(head, j) in headers" :key="j" class="text-center text-table ">
          <slot :name="`cel-${head.value}`" :data="item">
            <!-- 54 6f 64 6f 20 65 73 74 6f 20 6c 6f 20 68 61 67 6f 20 70 6f 72 20 65 6c 6c 61 20 3c 33 -->

            <VChip v-if="head.status === true || head.status === 'deleted'" small :color="getStatusColor(item, head)"
              class="font-weight-medium">
              {{ getStatus(item, head) }}
            </VChip>

            <span v-else>{{ getValue(item, head) }}</span>
            <slot v-if="optionsHabilit && head.value == 'actions'" name="actions">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-if="hasDefaultActions(item)" size="small" icon color="transparent" v-bind="props">
                    <VIcon color="primary" size="25" :icon="OptionsIcon" />
                  </v-btn>
                </template>

                <v-list class="border-primary rounded-xl" style="width: 230px;"> 
                  <v-list-item >
                    <v-list-item-title class="cursor-pointer" v-if="iconShow && !isDeleted(item.id) && canShowItem" @click="() => { clickIn = 'Show'; emit('show', item) }">
                      <VBtn  :title="'Show'" color="transparent" size="x-small"
                        elevation="0" icon>
                        <VIcon color="primary"  size="24"
                          icon="mdi-eye-outline" /> 
                      </VBtn> {{$t('general-views.show')}}
                    </v-list-item-title>
                    <v-list-item-title class="cursor-pointer" v-if="iconUpdate && !isDeleted(item.id) && canUpdate(item)"  @click="() => { clickIn = 'Edit'; emit('update', item) }">
                      <VBtn  :title="'Update'" color="transparent" size="x-small"
                        elevation="0" icon>
                        <VIcon color="primary" size="24"
                          icon="mdi-pencil-outline" />
                      </VBtn> {{$t('general-views.edit')}}
                    </v-list-item-title>
                    <!-- <v-list-item-title class="cursor-pointer" > -->
                      <slot v-if="newButtons" name="newButtons" :data="item"></slot>
                    <!-- </v-list-item-title> -->
                    <v-list-item-title class="cursor-pointer" v-if="iconDelete && canDeleteOrRestore(item)" @click="openConfirmModal(item.id)" >
                      <VBtn :title="!isDeleted(item.id) ? 'Delete' : 'Restore'" color="transparent"
                        size="x-small" elevation="0" icon>
                        <VIcon color="primary"  size="24"
                          :icon="!isDeleted(item.id) ? (textDelete ? 'mdi-block-helper':'mdi-delete') : (textDelete ? 'mdi-check-bold':'mdi-delete-restore')" />
                      </VBtn>  {{ !isDeleted(item.id) ? ( textDelete ?? t('general-views.delete.title')) : t('general-views.restore.title') }}
                    </v-list-item-title>
                    <div v-if="acceptReject && elementIsVerificated(item) && (canAcceptItem || canRejectItem)" class="d-flex">
                      <v-list-item-title v-if="canAcceptItem" class="cursor-pointer" @click="confirmAction(item, 'accept')">
                        <VBtn  size="x-small" color="transparent" elevation="0" icon
                          :title="$t('buttons.accept')">
                          <VIcon icon="mdi-check-bold" />
                        </VBtn> {{$t('general-views.accept-icon')}}
                      </v-list-item-title>
                      <v-list-item-title v-if="canRejectItem" class="cursor-pointer" @click="confirmAction(item, 'reject')">

                        <VBtn color="transparent"  size="x-small" elevation="0" icon
                          :title="$t('buttons.reject')">
                          <VIcon icon="mdi-block-helper" /> {{$t('general-views.reject-icon')}}
                        </VBtn>
                      </v-list-item-title>


                    </div>

                  </v-list-item>
                </v-list>
              </v-menu>
            </slot>
            <!-- <div v-if="optionsHabilit && head.value == 'actions'" class="d-flex justify-center" style="gap: 8px">
              <VBtn v-if="iconShow && !isDeleted(item.id)" :title="'Show'" color="transparent" size="x-small"
                elevation="0" icon>
                <VIcon @click="() => { clickIn = 'Show'; emit('show', item) }" size="24" icon="mdi-eye-outline" />
              </VBtn>
              <VBtn v-if="iconUpdate && !isDeleted(item.id)" :title="'Update'" color="transparent" size="x-small"
                elevation="0" icon>
                <VIcon @click="() => { clickIn = 'Edit'; emit('update', item) }" size="24" icon="mdi-pencil-outline" />
              </VBtn>
              <slot v-if="newButtons" name="newButtons" :data="item"></slot>
              <VBtn v-if="iconDelete" :title="!isDeleted(item.id) ? 'Delete' : 'Restore'" color="transparent"
                size="x-small" elevation="0" icon>
                <VIcon @click="openConfirmModal(item.id)" size="24"
                  :icon="!isDeleted(item.id) ? 'mdi-delete' : 'mdi-delete-restore'" />
              </VBtn>
              <div v-if="acceptReject && elementIsVerificated(item)" class="d-flex">
                <VBtn @click="confirmAction(item, 'accept')" size="x-small" color="transparent" elevation="0" icon
                  :title="$t('buttons.accept')">
                  <VIcon icon="mdi-check-bold" />
                </VBtn>

                <VBtn color="transparent" @click="confirmAction(item, 'reject')" size="x-small" elevation="0" icon
                  :title="$t('buttons.reject')">
                  <VIcon icon="mdi-block-helper" />
                </VBtn>
              </div>
            </div> -->
          </slot>
        </td>
      </tr>
    </tbody>
  </VTable>


  <VRow class="mt-2 px-5 py-2" v-if="!paginatedFront">
    <VCol>
      <VRow>
        <VCol cols="4">
          <!-- <VSelect v-model="helper.pagination.perPage" :items="helper.perPage" label="Pagination"
            @update:modelValue="helper.index()">
          </VSelect> -->
        </VCol>
      </VRow>
    </VCol>
    <VCol>
      <VPagination size="32" :total-visible="$vuetify.display.xs ? 4 :  6" v-model="helper.pagination.currentPage" :length="helper.pagination.total"
        active-color="#B46BFE" color="#75757578" variant="outlined" @update:model-value="helper.index">
        <template #prev="{ onClick, disabled, icon }">
          <VBtn :disabled="disabled" @click="onClick"
            size="32"
            variant="outlined"
            aria-label="Next page" 
            aria-disabled="false"
            color="#75757578"
            :style="disabled ? 'background-color:#809FB8' : ''"
            >
            
            <VIcon size="24" :icon="icon" :color="disabled ? '#ffffff' : '#809FB8'"></VIcon>
          </VBtn>
        </template>
        <template #next="{ onClick, disabled, icon }">
          <VBtn :disabled="disabled" @click="onClick"
            size="32"
            variant="outlined"
            aria-label="Next page" 
            aria-disabled="false"
            color="#75757578"
            :style="disabled ? 'background-color:#809FB8' : ''"
            >
            
            <VIcon size="24" :icon="icon" :color="disabled ? '#ffffff' : '#809FB8'"></VIcon>
          </VBtn>
        </template>
      </VPagination>
    </VCol>
    <VCol></VCol>
  </VRow>

  <VRow class="mt-2 px-5 py-2" v-else>
    <VCol>
      <VRow>
        <VCol cols="4">
          <VSelect v-model="pagination.perPage" :items="perPage" label="Pagination"
            @update:model-value="pagination.currentPage = 1">
          </VSelect>
        </VCol>
      </VRow>
    </VCol>
    <VCol>
      <VPagination :total-visible="6" v-model="pagination.currentPage" :length="pagination.total">
      </VPagination>
    </VCol>
    <VCol></VCol>
  </VRow>
  <DialogConfirm :title="title" :content="content" :dialog="dialogAction" @closeDialog="dialogAction = false"
    @ok="actionModal[modalOpen]" :btnCancelText="$t('buttons.cancel')" :btnAcceptText="$t('buttons.accept')" />
</template>

<style scoped lang="scss">
.v-menu > .v-overlay__content{
  border: 1px solid #5043E8 !important;
  border-radius: 20px !important;
  -webkit-border-radius: 20px !important;
  -moz-border-radius: 20px !important;
  -ms-border-radius: 20px !important;
  -o-border-radius: 20px !important;
}

.btn-paginated {
  width: 32px;
  height: 32px;
}
</style>
