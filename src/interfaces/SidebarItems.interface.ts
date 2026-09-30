import type { PERMISSION_ENUM } from '@/enums/Permissions.enum'
import type { ROLES } from '@/interfaces/Role/Role.enum'
export declare interface SidebarItem {
    title: string
    icon: any
    to: string
    children?: SidebarChildren[]
    roles?: ROLES[],
    reference?: any
    permiss_reference?: PERMISSION_ENUM,
    params?: any
    permiss: PERMISSION_ENUM[]
    anyPermissions?: PERMISSION_ENUM[]
    contexts?: Array<"admin" | "user">
}


export declare interface SidebarChildren extends Omit<SidebarItem, 'children'| 'icon'>{}
