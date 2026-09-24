"use client";

import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { getApiUrl, getReverbConfig } from "@/lib/env";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: Echo<"reverb">;
  }
}

let echoInstance: Echo<"reverb"> | null = null;
let currentToken: string | null = null;

export function getEchoInstance(token?: string | null): Echo<"reverb"> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const { appKey, wsHost, wsPort, isTls } = getReverbConfig();
  if (!appKey) {
    return null;
  }

  const apiUrl = getApiUrl();

  // Re-create instance if token changed
  if (echoInstance && currentToken !== (token || null)) {
    try {
      echoInstance.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    echoInstance = null;
  }

  if (!echoInstance) {
    window.Pusher = Pusher;
    currentToken = token || null;

    echoInstance = new Echo({
      broadcaster: "reverb",
      key: appKey,
      wsHost,
      wsPort,
      wssPort: wsPort,
      forceTLS: isTls,
      enabledTransports: ["ws", "wss"],
      authEndpoint: `${apiUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    });

    window.Echo = echoInstance;
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try {
      echoInstance.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    echoInstance = null;
    currentToken = null;
    if (typeof window !== "undefined") {
      delete window.Echo;
    }
  }
}
