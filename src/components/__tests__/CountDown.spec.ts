import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CountDown from "../CountDown.vue";

describe("CountDown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  it("uses server time and emits expired without going negative", async () => {
    const wrapper = mount(CountDown, {
      props: {
        serverTime: "2026-01-01T00:00:00.000Z",
        deadline: "2026-01-01T00:02:00.000Z",
      },
    });

    expect(wrapper.text()).toBe("02:00");

    await vi.advanceTimersByTimeAsync(121000);

    expect(wrapper.text()).toBe("00:00");
    expect(wrapper.emitted("expired")).toHaveLength(1);
    expect(wrapper.emitted("endTime")).toHaveLength(1);
  });
});
