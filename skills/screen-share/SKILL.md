---
name: screen-share
description: Share your screen or application windows with Neer.
metadata:
  {
    "neer":
      {
        "emoji": "🖥️",
        "requires": { "app": "neer-desktop" },
      },
  }
---

# Screen Share 🖥️

This skill currently requires integration with the Neer Desktop application for `desktopCapturer` APIs.

The implementation status:
1.  [x] `apps/neer-desktop/src/main.ts` exposes `desktopCapturer.getSources` via IPC channel `DESKTOP_CAPTURER_GET_SOURCES`.
2.  [x] `preload.ts` exposes `window.electron.getSources(opts)`.
3.  [ ] Creating a frontend UI to select the source (Pending UI implementation).
4.  [ ] Sending the stream to the agent/LLM (Pending integration).

*Backend capability is ready.*
