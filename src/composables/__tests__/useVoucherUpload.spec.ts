import { ref } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidVoucherFile, useVoucherUpload } from "../useVoucherUpload";

const {
  httpMock,
  showNotifyMock,
  createOperationKeyMock,
  clearOperationKeyMock,
} = vi.hoisted(() => ({
  httpMock: vi.fn(),
  showNotifyMock: vi.fn(),
  createOperationKeyMock: vi.fn(() => "idem-voucher-1"),
  clearOperationKeyMock: vi.fn(),
}));

vi.mock("@/helper", () => ({
  helperStore: () => ({
    http: httpMock,
    showNotify: showNotifyMock,
  }),
}));

vi.mock("@/services/idempotency", () => ({
  createOperationKey: createOperationKeyMock,
  clearOperationKey: clearOperationKeyMock,
}));

describe("useVoucherUpload", () => {
  beforeEach(() => {
    httpMock.mockReset();
    showNotifyMock.mockReset();
    createOperationKeyMock.mockClear();
    clearOperationKeyMock.mockClear();
  });

  it("rejects missing or invalid files before calling the API", async () => {
    const file = ref<string | Blob>("");
    const refreshMock = vi.fn();
    const upload = useVoucherUpload({
      orderId: 12,
      tranxNo: "TNX000012",
      file,
      fileField: "vouchers[]",
      uploadUrl: "order/charge/voucher",
      successMessage: "ok",
      errorMessage: "error",
      scope: "voucher-12",
      onSuccess: refreshMock,
    });

    expect(upload.canSubmit.value).toBe(false);
    expect(isValidVoucherFile(new Blob(["x"], { type: "image/png" }) as File)).toBe(false);

    const result = await upload.upload();

    expect(result).toBe(false);
    expect(httpMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(showNotifyMock).toHaveBeenCalledWith(
      expect.stringContaining("comprobante"),
      { type: "error" }
    );
  });

  it("submits once, refreshes on success and blocks double click", async () => {
    const file = ref<string | Blob>(
      new File(["voucher"], "voucher.png", { type: "image/png" })
    );
    let resolveRequest: (() => void) | undefined;
    const refreshMock = vi.fn();

    httpMock.mockImplementationOnce(
      () =>
        new Promise<{ data: { message: string } }>((resolve) => {
          resolveRequest = () => resolve({
            data: {
              message: "ok",
            },
          });
        })
    );

    const upload = useVoucherUpload({
      orderId: 33,
      tranxNo: "TNX000033",
      file,
      fileField: "vouchers[]",
      uploadUrl: "order/charge/voucher",
      successMessage: "Subido",
      errorMessage: "Error",
      scope: "voucher-33",
      onSuccess: refreshMock,
    });

    const firstCall = upload.upload();
    const secondCall = upload.upload();

    expect(upload.submitting.value).toBe(true);
    expect(await secondCall).toBe(false);
    expect(httpMock).toHaveBeenCalledTimes(1);

    if (resolveRequest) {
      resolveRequest();
    }
    await expect(firstCall).resolves.toBe(true);

    expect(upload.submitting.value).toBe(false);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(clearOperationKeyMock).toHaveBeenCalledWith("voucher-33");
    expect(showNotifyMock).toHaveBeenCalledWith("Subido");
  });
});
