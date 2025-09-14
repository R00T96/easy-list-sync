// services/notificationService.ts
export type NotifyPermission = "default" | "denied" | "granted";

export const isSupported = typeof window !== "undefined" && "Notification" in window;

export const getPermission = (): NotifyPermission =>
  isSupported ? Notification.permission : "denied";

export async function requestPermission(): Promise<NotifyPermission> {
  if (!isSupported) return "denied";
  try {
    const p = await Notification.requestPermission();
    return p;
  } catch {
    return getPermission();
  }
}

type ShowOpts = {
  title: string;
  body?: string;
  tag?: string;          // same tag replaces older notif (prevents stacking)
  icon?: string;
  onClick?: () => void;
};

export function show(opts: ShowOpts) {
  if (!isSupported || getPermission() !== "granted") return;
  const n = new Notification(opts.title, {
    body: opts.body,
    tag: opts.tag,
    icon: opts.icon ?? "/icons/icon-192.png",
    // renotify: true,
  });
  n.onclick = (e) => {
    e.preventDefault();
    window.focus();
    opts.onClick?.();
    n.close();
  };
  return n;
}
