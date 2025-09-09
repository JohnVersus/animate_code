"use client";

import { sendGAEvent } from "@next/third-parties/google";

type EventName =
  | "export_video_click"
  | "export_dialog_confirm"
  | "download_video_click";

export const trackEvent = (
  eventName: EventName,
  eventParams?: { [key: string]: string | number | undefined }
) => {
  // Check if window is defined (i.e., we're in the browser)
  if (typeof window !== "undefined") {
    sendGAEvent({ event: eventName, value: eventParams });
  }
};
