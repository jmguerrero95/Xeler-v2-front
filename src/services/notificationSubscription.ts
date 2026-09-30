import usePusher from "@/pusher";

let activeUserId: number | null = null;
let activeSubscription: usePusher | null = null;

export const subscribeToAuthenticatedUserNotifications = (
  userId: number,
  callback: (event: unknown) => void,
): void => {
  if (!Number.isInteger(userId) || userId <= 0) return;
  if (activeSubscription && activeUserId === userId) return;

  unsubscribeFromUserNotifications();
  try {
    activeSubscription = new usePusher(
      `private-notification.${userId}`,
      "App\\Events\\NotificateEvent",
      callback,
    );
    activeUserId = userId;
  } catch {
    activeSubscription = null;
    activeUserId = null;
  }
};

export const unsubscribeFromUserNotifications = (): void => {
  activeSubscription?.unMounted();
  activeSubscription = null;
  activeUserId = null;
};
