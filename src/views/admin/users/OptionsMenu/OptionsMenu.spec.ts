import { shallowMount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

const permission=vi.hoisted(()=>({allowed:true}));
vi.mock("vue-i18n",()=>({useI18n:()=>({t:(key:string)=>key})}));
vi.mock("@/stores/UserStore",()=>({UserStore:()=>({hasPermission:(key:string)=>permission.allowed&&key==="support_chat.initiate"})}));
import OptionsMenu from "./OptionsMenu.vue";

describe("OptionsMenu iniciar chat",()=>{
  it("usa support_chat.initiate y sólo permite clientes",async()=>{
    const customer:any={id:8,relationships:{roles:[{id:1,attributes:{name:"User",guard_name:"web",created_at:new Date(),updated_at:new Date()}}]}};
    const wrapper=shallowMount(OptionsMenu,{props:{user:customer}});const vm=wrapper.vm as any;
    const action=vm.visibleItems.find((item:any)=>item.permission==="support_chat.initiate");expect(action).toBeTruthy();action.event();
    expect(wrapper.emitted("click:start-chat")?.[0]?.[0]).toEqual(customer);
    await wrapper.setProps({user:{id:9,relationships:{roles:[{id:2,attributes:{name:"Soporte personalizado",guard_name:"web",created_at:new Date(),updated_at:new Date()}}]}} as any});
    expect((wrapper.vm as any).visibleItems.some((item:any)=>item.permission==="support_chat.initiate")).toBe(false);
  });
});
