import axios from "axios";
const base = import.meta.env.VITE_API_URL;
export const setupApi = {
  status: () => axios.get(`${base}/setup/status`, { withCredentials: true }),
  exchange: (token: string) => axios.post(`${base}/setup/token/exchange`, { token }, { withCredentials: true }),
  create: (data: unknown) => axios.post(`${base}/setup/superadmin`, data, { withCredentials: true }),
  invitation: (token: string) => axios.get(`${base}/admin-invitations/${encodeURIComponent(token)}`),
  accept: (token: string, data: unknown) => axios.post(`${base}/admin-invitations/${encodeURIComponent(token)}/accept`, data),
};
