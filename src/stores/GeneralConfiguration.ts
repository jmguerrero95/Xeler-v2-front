import { helperStore } from "@/helper";
import { defineStore } from "pinia";
import type { ConfigurationGenerals, ConfigurationGeneralsAttributes } from '@/interfaces/ConfigurationGenerals/ConfigurationGenerals.model'
import { ref } from 'vue'

export const GeneralConfiguration = defineStore('general-configuration',() => {
    const helper = helperStore()
    const generalData = ref<ConfigurationGenerals>()

    const getGeneralData = async() => {
        try{
            const url = 'general/configuration'
            const res = await helper.http(url,'get')
            if(res.data.response.length == 0 && res.status == 200) {
                throw 'Debe cargar una configuración'
            }
            generalData.value = res.data.response[0] as ConfigurationGenerals
        }catch(err){
            if(err =='Debe cargar una configuración'){
                helper.showNotify(err as string,{type:'error'})
            }
        }
    }
    return {
        generalData,
        getGeneralData
    }
});