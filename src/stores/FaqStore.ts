import { helperStore } from "@/helper";
import type { CategoryFaq } from "@/interfaces/Faq/CategoryFaq/CategoryFaq.model";
import { defineStore } from "pinia";
import { ref } from "vue";

export const FaqStore = defineStore('faq',() => {
    const helper = helperStore()

    const categoriesFaq = ref<CategoryFaq[]>([])
    const getCategoriesFaq = async () => {
        const url = 'category/faq'
        const res = await helper.http(url,'get')

        categoriesFaq.value = res.data.response as CategoryFaq[]
    }
    return{
        categoriesFaq,
        getCategoriesFaq
    }
})