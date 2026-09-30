import { helperStore } from "@/helper";

type ApiResource = {
  id: number;
  attributes?: Record<string, unknown>;
  documents?: Array<Record<string, unknown>>;
  user?: Record<string, unknown>;
};

const normalizeKyc = (resource: ApiResource | null | undefined) => resource ? ({
  id: resource.id,
  ...(resource.attributes ?? {}),
  documents: resource.documents ?? [],
  user: resource.user ?? null,
}) : null;

const downloadBlob = async (helper: ReturnType<typeof helperStore>, endpoint: string, filename: string) => {
  const path = endpoint.replace(/^\/api\//, "");
  const response = await helper.http(path, "get", { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const useKycApi = () => {
  const helper = helperStore();

  return {
    me: async () => {
      const response = await helper.http("kyc/me", "get");
      return { kyc: normalizeKyc(response.data.data), level: Number(response.data.level ?? 0) };
    },
    saveDraft: async (data: Record<string, unknown>) => {
      const response = await helper.http("kyc/draft", "put", { data }, "Borrador KYC guardado");
      return normalizeKyc(response.data.data);
    },
    uploadDocument: (documentType: string, document: File) => {
      const data = new FormData();
      data.append("document_type", documentType);
      data.append("document", document);
      return helper.http("kyc/documents", "post", { data }, "Documento cargado");
    },
    submit: async () => {
      const response = await helper.http("kyc/submit", "post", { data: {} }, "Expediente enviado");
      return normalizeKyc(response.data.data);
    },
    list: async (status?: string, page = 1) => {
      const params: Record<string, string | number> = { page };
      if (status) params.status = status;
      const response = await helper.http("kyc", "get", { params });
      return { items: (response.data.data ?? []).map(normalizeKyc), meta: response.data.meta ?? {} };
    },
    show: async (id: number) => normalizeKyc((await helper.http(`kyc/${id}`, "get")).data.data),
    transition: async (id: number, action: string, reason?: string) => {
      const response = await helper.http(`kyc/${id}/transition`, "put", { data: { action, reason } }, "", false, { financialScope: "admin.security" });
      return normalizeKyc(response.data.data);
    },
    levelThree: async (id: number, approved: boolean, reason: string) => {
      const response = await helper.http(`kyc/${id}/level-three`, "put", { data: { approved, reason } }, "", false, { financialScope: "admin.security" });
      return normalizeKyc(response.data.data);
    },
    downloadDocument: (document: any) => downloadBlob(
      helper,
      String(document.download_endpoint),
      String(
        document.original_name ??
        (
          String(document.document_type).toLowerCase().includes("selfie")
            ? `${document.document_type}.png`
            : `${document.document_type}.pdf`
        )
      ),
    ),
  };
};
