import { beforeEach, describe, expect, it, vi } from "vitest";

const unMounted = vi.fn();
const constructorMock = vi.fn();

vi.mock("@/pusher", () => ({
  default: class MockPusher {
    public unMounted = unMounted;

    constructor(...args: unknown[]) {
      constructorMock(...args);
    }
  },
}));

import {
  subscribeToAuthenticatedUserNotifications,
  unsubscribeFromUserNotifications,
} from "@/services/notificationSubscription";

describe("authenticated notification subscription", () => {
  beforeEach(() => {
    unsubscribeFromUserNotifications();
    constructorMock.mockReset();
    unMounted.mockReset();
  });

  it("degrades silently when realtime is not configured", () => {
    constructorMock.mockImplementation(() => {
      throw new Error("Pusher is not configured.");
    });

    expect(() =>
      subscribeToAuthenticatedUserNotifications(42, vi.fn()),
    ).not.toThrow();

    subscribeToAuthenticatedUserNotifications(42, vi.fn());
    expect(constructorMock).toHaveBeenCalledTimes(2);
  });

  it("keeps one subscription per user and cleans it up", () => {
    const callback = vi.fn();

    subscribeToAuthenticatedUserNotifications(42, callback);
    subscribeToAuthenticatedUserNotifications(42, callback);

    expect(constructorMock).toHaveBeenCalledTimes(1);
    unsubscribeFromUserNotifications();
    expect(unMounted).toHaveBeenCalledTimes(1);
  });
});
