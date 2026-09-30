import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ summary: vi.fn(), messages: vi.fn(), send: vi.fn(), read: vi.fn() }));
const pusher = vi.hoisted(() => ({ callback: undefined as undefined | ((event: unknown) => void), unMounted: vi.fn() }));
vi.mock("@/services/supportChatApi", () => ({
  chatSummary: api.summary, chatMessages: api.messages, sendChat: api.send, readChat: api.read,
  uuid: () => "00000000-0000-4000-8000-000000000001",
}));
vi.mock("@/services/apiClient", () => ({ downloadAuthenticatedBlob: vi.fn() }));
vi.mock("@/stores/UserStore", () => ({ UserStore: () => ({ authUser: { id: 7 } }) }));
vi.mock("@/pusher", () => ({ default: class { constructor(_channel:string,_event:string,callback:(event:unknown)=>void){pusher.callback=callback} unMounted=pusher.unMounted } }));
import SupportChatWidget from "../SupportChatWidget.vue";

describe("SupportChatWidget", () => {
  beforeEach(() => {
    api.summary.mockResolvedValue({ data: { data: { reference:"chat-1",status:"waiting_customer",status_label:"Esperando cliente",unread:2,blocked:false }, blocked:false } });
    api.messages.mockResolvedValue({ data: { data: [], meta: {} } }); api.read.mockResolvedValue({});
  });
  it("permanece contraído y muestra el contador persistente", async () => {
    const wrapper=shallowMount(SupportChatWidget); await flushPromises();
    const vm=wrapper.vm as any; expect(vm.open).toBe(false); expect(vm.unread).toBe(2);
  });
  it("abre, marca lectura y envía con un client_message_id estable", async () => {
    api.send.mockResolvedValue({data:{data:{id:1}}}); const wrapper=shallowMount(SupportChatWidget);await flushPromises();const vm=wrapper.vm as any;
    await vm.activate();vm.body="Hola";await vm.submit();
    expect(api.read).toHaveBeenCalledWith("chat-1");expect(api.send).toHaveBeenCalledWith("chat-1","Hola","00000000-0000-4000-8000-000000000001",[]);
  });
  it("permite seleccionar, retirar y enviar un adjunto sin texto", async () => {
    api.send.mockResolvedValue({data:{data:{id:1}}});const wrapper=shallowMount(SupportChatWidget);await flushPromises();const vm=wrapper.vm as any;await vm.activate();
    const file=new File(["contenido"],"evidencia.pdf",{type:"application/pdf"});vm.selectFiles({target:{files:[file],value:"archivo"}} as unknown as Event);
    expect(vm.files).toEqual([file]);expect(vm.canSend).toBe(true);await vm.submit();expect(api.send).toHaveBeenCalledWith("chat-1","","00000000-0000-4000-8000-000000000001",[file]);expect(vm.files).toEqual([]);
    vm.selectFiles({target:{files:[file],value:"archivo"}} as unknown as Event);vm.removeFile(0);expect(vm.files).toEqual([]);
  });
  it("envía mensaje y archivo juntos y conserva el panel abierto", async () => {
    api.send.mockResolvedValue({data:{data:{id:1}}});const wrapper=shallowMount(SupportChatWidget);await flushPromises();const vm=wrapper.vm as any;await vm.activate();const file=new File(["x"],"nota.txt",{type:"text/plain"});vm.body="Revisa este archivo";vm.selectFiles({target:{files:[file],value:"archivo"}} as unknown as Event);await vm.submit();
    expect(api.send).toHaveBeenCalledWith("chat-1","Revisa este archivo","00000000-0000-4000-8000-000000000001",[file]);expect(vm.open).toBe(true);expect(vm.body).toBe("");
  });
  it("reconcilia un evento entrante sin insertar directamente su payload", async () => {
    shallowMount(SupportChatWidget);await flushPromises();await pusher.callback?.({action:"message",sender_type:"agent"});await flushPromises();expect(api.summary).toHaveBeenCalledTimes(2);expect(api.messages).toHaveBeenCalledTimes(2);
  });
  it("conserva el historial paginado al reconciliar un mensaje realtime", async () => {
    api.messages
      .mockResolvedValueOnce({data:{data:[{id:41,sender:"agent"}],meta:{next_cursor:"older"}}})
      .mockResolvedValueOnce({data:{data:[{id:41,sender:"agent"}],meta:{next_cursor:"older"}}})
      .mockResolvedValueOnce({data:{data:[{id:1,sender:"agent"}],meta:{}}})
      .mockResolvedValueOnce({data:{data:[{id:42,sender:"agent"}],meta:{}}});
    const wrapper=shallowMount(SupportChatWidget);await flushPromises();const vm=wrapper.vm as any;
    await vm.activate();await vm.older();expect(vm.messages.map((m:any)=>m.id)).toEqual([1,41]);
    await pusher.callback?.({action:"message",sender_type:"agent"});await flushPromises();
    expect(vm.messages.map((m:any)=>m.id)).toEqual([1,41,42]);
  });
  it("respeta bloqueo persistente aun sin conversación y no duplica unread realtime", async () => {
    api.summary
      .mockResolvedValueOnce({data:{data:null,blocked:true}})
      .mockResolvedValueOnce({data:{data:{reference:"chat-1",status:"waiting_staff",status_label:"Esperando soporte",unread:3,blocked:false},blocked:false}});
    const wrapper=shallowMount(SupportChatWidget);await flushPromises();const vm=wrapper.vm as any;
    expect(vm.blocked).toBe(true);
    await pusher.callback?.({action:"message",sender_type:"agent"});await flushPromises();
    expect(vm.unread).toBe(3);
  });
  it("desmonta y libera la suscripción privada", async () => {
    const wrapper=shallowMount(SupportChatWidget);await flushPromises();wrapper.unmount();expect(pusher.unMounted).toHaveBeenCalled();
  });
});
