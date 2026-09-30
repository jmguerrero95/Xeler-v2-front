import { apiClient } from "@/services/apiClient";

export interface ChatAttachment { reference:string; name:string; mime_type:string; size:number; download_url:string }
export interface ChatAuthor { id:number; name:string }
export interface ChatMessage { id:number; client_message_id:string; sender:"user"|"agent"; body:string|null; created_at:string; author?:ChatAuthor|null; attachments:ChatAttachment[] }
export interface ChatConversation { reference:string; status:string; status_label:string; unread:number; blocked:boolean; assigned_to?:{id:number;name:string}|null; customer?:{id:number;name:string;email:string}|null; last_message_at?:string }
export const uuid = () => crypto.randomUUID();
const form = (body:string, id:string, files:File[]) => { const data=new FormData(); data.append("client_message_id",id); if(body.trim())data.append("body",body); files.forEach(f=>data.append("attachments[]",f)); return data; };
export const chatSummary=()=>apiClient.get<{data:ChatConversation|null;blocked:boolean}>("support-chat");
export const chatHistory=()=>apiClient.get<{data:ChatConversation[];meta:{current_page:number;last_page:number;total:number}}>("support-chat/history");
export const chatMessages=(ref:string,admin=false,cursor?:string)=>apiClient.get<{data:ChatMessage[];meta:{next_cursor?:string}}>(`${admin?"admin/":""}support-chat/conversations/${ref}/messages`,{params:{cursor}});
export const sendChat=(conversation:string|undefined,body:string,id:string,files:File[],admin=false)=>apiClient.post<{data:ChatMessage}>(admin?`admin/support-chat/conversations/${conversation}/messages`:"support-chat/messages",form(body,id,files));
export const readChat=(ref:string,admin=false)=>apiClient.post(`${admin?"admin/":""}support-chat/conversations/${ref}/read`);
export interface ChatInboxMeta { current_page:number; last_page:number; total:number }
export const inboxChat=(filter="",page=1)=>apiClient.get<{data:ChatConversation[];meta:ChatInboxMeta;counts:{pending:number}}>("admin/support-chat/conversations",{params:{filter,page}});
export const staffChatSummary=()=>apiClient.get<{data:{pending_count:number;unassigned_count:number;mine_count:number;waiting_staff_count:number;waiting_customer_count:number;personal_unread_count:number;last_activity_id:number}}>("admin/support-chat/summary");
export const adminChatConversation=(ref:string)=>apiClient.get<{data:ChatConversation}>(`admin/support-chat/conversations/${ref}`);
export const claimChat=(ref:string)=>apiClient.post(`admin/support-chat/conversations/${ref}/claim`);
export const closeChat=(ref:string)=>apiClient.post(`admin/support-chat/conversations/${ref}/close`);
export const reopenChat=(ref:string)=>apiClient.post(`admin/support-chat/conversations/${ref}/reopen`);
export interface ChatSearchMeta { current_page:number; last_page:number; total:number }
export const findCustomers=(q="",page=1,customer?:number)=>apiClient.get<{data:Array<{id:number;name:string;email:string}>;meta:ChatSearchMeta}>("admin/support-chat/customers",{params:{q,page,customer}});
export const listAgents=(page=1)=>apiClient.get<{data:Array<{id:number;name:string;email:string}>;meta:ChatSearchMeta}>("admin/support-chat/agents",{params:{page}});
export const assignChat=(ref:string,user_id:number)=>apiClient.post(`admin/support-chat/conversations/${ref}/assign`,{user_id});
export const initiateChat=(customer_id:number,body:string,client_message_id:string,files?:File[])=>apiClient.post("admin/support-chat/initiate",{customer_id,body,client_message_id,attachments:files||[]});
export const blockChat=(id:number,reason:string)=>apiClient.post(`admin/support-chat/customers/${id}/block`,{reason});
export const unblockChat=(id:number)=>apiClient.post(`admin/support-chat/customers/${id}/unblock`);
