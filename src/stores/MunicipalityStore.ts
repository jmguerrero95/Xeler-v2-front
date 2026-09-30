import { helperStore } from "@/helper";
import type { Departament } from "@/interfaces/Departament/Departament.model";
import { defineStore } from "pinia";
import { ref } from "vue";

export const MunicipalityStore = defineStore('municipality', () => {
    const helper = helperStore()

    const departaments = ref<Departament[]>([])
    const getDepartaments = (): Promise<Boolean> => {
        return new Promise( async (resolve, reject) =>{
            try{
                const res = await helper.http('departments','get')
                departaments.value = res.data.response
                resolve(true)
            }catch(err){
                reject(false)
            }
        })
    }
    return {
        departaments,
        getDepartaments
    }
})