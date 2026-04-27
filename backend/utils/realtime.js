import { EventEmitter } from "events";

const realtimeEmitter = new EventEmitter();
realtimeEmitter.setMaxListeners(0);

let eventSequence = 0;

const nextEventId = () => {
  eventSequence += 1;
  return eventSequence;
};

export const publishBookingContentChanged = (payload = {}) => {
  const event = {
    id: nextEventId(),
    channel: "booking_content",
    changedAt: new Date().toISOString(),
    ...payload,
  };

  realtimeEmitter.emit("booking_content", event);
  return event;
};

export const subscribeBookingContentChanged = (listener) => {
  realtimeEmitter.on("booking_content", listener);
  return () => realtimeEmitter.off("booking_content", listener);
};

