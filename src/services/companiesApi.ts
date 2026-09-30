import { helperStore } from "@/helper";

type ApiResource = {
  id: number;
  attributes?: Record<string, unknown>;
  documents?: Array<Record<string, unknown>>;
  user?: Record<string, unknown>;
  beneficial_owners?: Array<Record<string, unknown>>;
};

const normalizeCompany = (resource: ApiResource | null | undefined) => resource ? ({
  id: resource.id,
  ...(resource.attributes ?? {}),
  documents: resource.documents ?? [],
  user: resource.user ?? null,
  beneficial_owners: resource.beneficial_owners ?? [],
}) : null;

const downloadBlob = async (helper: ReturnType<typeof helperStore>, endpoint: string, filename: string) => {
  const response = await helper.http(endpoint.replace(/^\/api\//, ""), "get", { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const useCompaniesApi = () => {
  const helper = helperStore();
  return {
    list: async () => (responseData(await helper.http("companys", "get")) ?? []).map(normalizeCompany),
    approved: async () => ((await helper.http("companys/approved", "get")).data.data ?? []).map(normalizeCompany),
    show: async (id: number) => normalizeCompany((await helper.http(`companys/${id}`, "get")).data.data),
    save: async (data: Record<string, unknown>, id?: number) => {
      const response = await helper.http(id ? `companys/${id}` : "companys", id ? "put" : "post", { data });
      return normalizeCompany(response.data.data);
    },
    addOwner: (id: number, data: Record<string, unknown>) => helper.http(`companys/${id}/beneficial-owners`, "post", { data }),
    updateOwner: (id: number, ownerId: number, data: Record<string, unknown>) => helper.http(`companys/${id}/beneficial-owners/${ownerId}`, "put", { data }),
    deleteOwner: (id: number, ownerId: number) => helper.http(`companys/${id}/beneficial-owners/${ownerId}`, "delete"),
    uploadDocument: (id: number, documentType: string, document: File) => {
      const data = new FormData();
      data.append("document_type", documentType);
      data.append("document", document);
      return helper.http(`companys/${id}/documents`, "post", { data });
    },
    submit: async (id: number) => normalizeCompany((await helper.http(`companys/${id}/submit`, "post", { data: {} })).data.data),
    adminList: async (status?: string, page = 1) => {
      const params: Record<string, string | number> = { page };
      if (status) params.status = status;
      const response = await helper.http("companys/kyc", "get", { params });
      return { items: (response.data.data ?? []).map(normalizeCompany), meta: response.data.meta ?? {} };
    },
    adminShow: async (id: number) => normalizeCompany((await helper.http(`companys/kyc/${id}`, "get")).data.data),
    transition: async (id: number, action: string, reason?: string) => normalizeCompany((await helper.http(`companys/kyc/${id}/transition`, "put", { data: { action, reason } }, "", false, { financialScope: "admin.security" })).data.data),
    downloadDocument: (document: any) => downloadBlob(helper, String(document.download_endpoint), String(
        document.original_name ??
        (
          String(document.document_type).toLowerCase().includes("selfie")
            ? `${document.document_type}.png`
            : `${document.document_type}.pdf`
        )
      )),
  };
};

const responseData = (response: any) => response.data.response ?? response.data.data ?? [];
