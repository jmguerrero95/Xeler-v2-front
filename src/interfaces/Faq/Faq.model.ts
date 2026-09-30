import type { BaseModel } from "../Base.model";
import type { CategoryFaq } from "./CategoryFaq/CategoryFaq.model";

export declare interface Faq extends BaseModel<FaqAttributes,FaqRelationships>{}

export declare interface FaqAttributes {
    title: string;
    body: string;
    category_faq_id: number
}

export declare interface FaqRelationships {
    CategoryFaq: CategoryFaq
}