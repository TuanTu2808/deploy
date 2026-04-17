import express from "express";
import {
  subscribeBookingContentChanged,
} from "../utils/realtime.js";

const router = express.Router();

router.get("/booking-updates", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // Flush headers immediately for SSE clients.
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const sendEvent = (event) => {
    res.write(`id: ${event.id}\n`);
    res.write("event: booking-content\n");
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  // Initial handshake event so client confirms connection.
  sendEvent({
    id: Date.now(),
    channel: "booking_content",
    type: "connected",
    source: "realtime",
    changedAt: new Date().toISOString(),
  });

  const unsubscribe = subscribeBookingContentChanged(sendEvent);

  const heartbeat = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
});

export default router;
