import type { PENALTY_TYPES } from "@/enums/PenaltyTypes.enum";
import { getUserAuth, helperStore, isRole } from "@/helper"
import type { PenaltyCreate } from "@/interfaces/Penalty/Penalty.dto";
import type { Penalty } from "@/interfaces/Penalty/Penalty.model";
import { ROLES } from "@/interfaces/Role/Role.enum";
import { ref } from "vue";

const helper = helperStore();

export const createPenalty = (type_penalty: PENALTY_TYPES, user_id?: number): Promise<boolean> => {
    return new Promise( async (resolve, reject) => {
        const typesResponse = await helper.http('type/penalties', 'get')
        const types = typesResponse.data.response?.data ?? typesResponse.data.response ?? []
        const resolvedType = types.find((item: any) => item.attributes?.code === type_penalty)
        if (!resolvedType) {
            reject(new Error('No se encontró el tipo de penalización requerido.'))
            return
        }
        const data:PenaltyCreate = { type_penaltie_id: resolvedType.id }
        if(isRole(ROLES.ADMIN)){
            data['user_id'] = user_id
        }
        const url = 'penalties'
        try{
            const res = await helper.http(url,'post',{data})
            window.location.reload()
            resolve(true)
        }catch(e){
            reject(false)
        }
    })
}

export const penalties = ref<Penalty[]>([])
export const getPenaltyOfUserSession = (): Promise<Penalty[]> => {
    return new Promise<Penalty[]>(async (resolve, reject) => {
        const url = 'penalties/activite/now'
        try{
            const res = await helper.http(url,)
            
            penalties.value = res.data.response ?? []
            resolve(res.data.response ?? [])
        }catch(e){
            reject([])
        }
    })
}
