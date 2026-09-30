import { helperStore } from "@/helper";
import { clearOperationKey, createOperationKey } from "@/services/idempotency";
import { computed, ref, type Ref } from "vue";

const ALLOWED_EXTENSIONS = [".jpeg", ".jpg", ".png", ".gif", ".svg", ".webp"];
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface VoucherUploadOptions {
  orderId: number;
  tranxNo: string;
  file: Ref<string | Blob>;
  fileField: string;
  uploadUrl: string;
  successMessage: string;
  errorMessage: string;
  scope: string;
  onSuccess?: () => Promise<void> | void;
  extraFields?: () => Record<string, string | null | undefined>;
}

const getFileExtension = (file: File): string => {
  const name = file.name ?? "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
};

export const isValidVoucherFile = (value: string | Blob): value is File => {
  if (!(value instanceof File)) {
    return false;
  }

  if (value.size <= 0 || value.size > MAX_FILE_BYTES) {
    return false;
  }

  if (!value.type.startsWith("image/")) {
    return false;
  }

  return ALLOWED_EXTENSIONS.includes(getFileExtension(value));
};

export const useVoucherUpload = (options: VoucherUploadOptions) => {
  const helper = helperStore();
  const submitting = ref(false);

  const canSubmit = computed(
    () => !submitting.value && isValidVoucherFile(options.file.value),
  );

  const upload = async (): Promise<boolean> => {
    if (submitting.value) {
      return false;
    }

    if (!options.file.value) {
      helper.showNotify("Debes seleccionar un comprobante valido.", { type: "error" });
      return false;
    }

    if (!isValidVoucherFile(options.file.value)) {
      helper.showNotify("El comprobante debe ser una imagen valida de maximo 5MB.", {
        type: "error",
      });
      return false;
    }

    const data = new FormData();
    data.append("order_id", String(options.orderId));
    data.append(options.fileField, options.file.value);
    Object.entries(options.extraFields?.() ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") data.append(key, value);
    });

    submitting.value = true;
    try {
      await helper.http(options.uploadUrl, "post", { data }, "", false, {
        idempotent: true,
        idempotencyKey: createOperationKey(options.scope, {
          order_id: options.orderId,
          tranx_no: options.tranxNo,
          file_name: options.file.value.name,
          file_size: options.file.value.size,
        }),
        financialAction: true,
      });

      clearOperationKey(options.scope);
      helper.showNotify(options.successMessage);
      await options.onSuccess?.();
      return true;
    } catch {
      helper.showNotify(options.errorMessage, { type: "error" });
      return false;
    } finally {
      submitting.value = false;
    }
  };

  return {
    canSubmit,
    submitting,
    upload,
  };
};
