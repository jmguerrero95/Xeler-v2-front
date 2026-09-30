import { flushPromises, shallowMount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthenticatedVoucherDownload from "@/components/orders/AuthenticatedVoucherDownload.vue";
import type { Image } from "@/interfaces/Image.model";

const { downloadMock } = vi.hoisted(() => ({ downloadMock: vi.fn() }));

vi.mock("@/services/apiClient", () => ({
  downloadAuthenticatedBlob: downloadMock,
}));

const images = [{
  id: 91,
  attributes: {
    download_url: "/api/orders/17/vouchers/91/download",
    filename: "comprobante-17.pdf",
  },
}] as unknown as Image[];

describe("AuthenticatedVoucherDownload", () => {
  beforeEach(() => downloadMock.mockReset());

  it("downloads through the authenticated endpoint with the server filename", async () => {
    downloadMock.mockResolvedValue(undefined);
    const wrapper = shallowMount(AuthenticatedVoucherDownload, { props: { images } });

    await wrapper.get("v-btn-stub").trigger("click");
    await flushPromises();

    expect(downloadMock).toHaveBeenCalledOnce();
    expect(downloadMock).toHaveBeenCalledWith(
      "/api/orders/17/vouchers/91/download",
      "comprobante-17.pdf",
    );
    expect(wrapper.html()).not.toContain("href=");
  });

  it("does not expose a public URL when the voucher is absent", () => {
    const wrapper = shallowMount(AuthenticatedVoucherDownload, { props: { images: [] } });
    expect(wrapper.find("v-btn-stub").exists()).toBe(false);
    expect(wrapper.html()).not.toContain("http");
  });

});
