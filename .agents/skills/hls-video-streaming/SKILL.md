---
name: hls-video-streaming
description: Use when implementing video players, HLS.js, stream playback (m3u8/mp4), subtitles (VTT), video quality switching, or watch history tracking
---

# HLS Video Streaming & Player Integration

## Overview
Patterns for integrating HLS/m3u8 streaming video players, handling playback errors, buffer management, and video tracking.

## Player Integration Guidelines (HLS.js / HTML5 Video)
1. **HLS Support Detection**:
   ```typescript
   if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
     videoElement.src = streamUrl; // Native Safari support
   } else if (Hls.isSupported()) {
     const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
     hls.loadSource(streamUrl);
     hls.attachMedia(videoElement);
   }
   ```
2. **Cleanup & Teardown**:
   - Always destroy the HLS instance (`hls.destroy()`) when unmounting component to avoid memory leaks.
3. **Playback Resume & Progress Tracking**:
   - Save playback progress (`currentTime`) to `localStorage` or backend API on interval (`timeupdate` throttled).
   - Prompt or auto-resume from last watched timestamp on load.
4. **Error Handling**:
   - Listen to `Hls.Events.ERROR` and attempt recovery for `networkError` (`hls.startLoad()`) or `mediaError` (`hls.recoverMediaError()`).
