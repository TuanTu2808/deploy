import { EventEmitter } from "events";

const realtimeEmitter = new EventEmitter();
realtimeEmitter.setMaxListeners(0);

let eventSequence = 0;
let bookingContentWatcher = null;
let lastBookingFingerprint = null;
let isCheckingBookingFingerprint = false;

const BOOKING_WATCH_INTERVAL_MS = Number(
  process.env.BOOKING_WATCH_INTERVAL_MS || 2000
);

const nextEventId = () => {
  eventSequence += 1;
  return eventSequence;
};

const getBookingContentFingerprint = async (database) => {
  const [rows] = await database.query(
    `
    SELECT LOWER(
      MD5(
        CONCAT_WS(
          '|',
          COALESCE(
            (
              SELECT CONCAT(
                COUNT(*),
                ':',
                COALESCE(
                  SUM(
                    CRC32(
                      CONCAT_WS(
                        '|',
                        Id_services,
                        COALESCE(Name, ''),
                        COALESCE(Price, 0),
                        COALESCE(Sale_Price, 0),
                        COALESCE(Duration_time, 0),
                        COALESCE(Description, ''),
                        COALESCE(Status, 0),
                        COALESCE(Id_category_service, 0)
                      )
                    )
                  ),
                  0
                )
              )
              FROM Services
            ),
            '0:0'
          ),
          COALESCE(
            (
              SELECT CONCAT(
                COUNT(*),
                ':',
                COALESCE(
                  SUM(
                    CRC32(
                      CONCAT_WS(
                        '|',
                        Id_category_service,
                        COALESCE(Name, ''),
                        COALESCE(Is_active, 0)
                      )
                    )
                  ),
                  0
                )
              )
              FROM Categories_service
            ),
            '0:0'
          ),
          COALESCE(
            (
              SELECT CONCAT(
                COUNT(*),
                ':',
                COALESCE(
                  SUM(
                    CRC32(
                      CONCAT_WS(
                        '|',
                        Id_image_service,
                        Id_services,
                        COALESCE(Image_URL, '')
                      )
                    )
                  ),
                  0
                )
              )
              FROM Image_Services
            ),
            '0:0'
          ),
          COALESCE(
            (
              SELECT CONCAT(
                COUNT(*),
                ':',
                COALESCE(
                  SUM(
                    CRC32(
                      CONCAT_WS(
                        '|',
                        Id_combo,
                        COALESCE(Name, ''),
                        COALESCE(Price, 0),
                        COALESCE(Duration_time, 0),
                        COALESCE(Status, 0),
                        COALESCE(Description, ''),
                        COALESCE(Image_URL, '')
                      )
                    )
                  ),
                  0
                )
              )
              FROM Combos
            ),
            '0:0'
          ),
          COALESCE(
            (
              SELECT CONCAT(
                COUNT(*),
                ':',
                COALESCE(
                  SUM(CRC32(CONCAT_WS('|', Id_combo, Id_services))),
                  0
                )
              )
              FROM Combo_Detail
            ),
            '0:0'
          )
        )
      )
    ) AS fingerprint
    `
  );

  return String(rows?.[0]?.fingerprint || "");
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

export const startBookingContentWatcher = (database) => {
  if (bookingContentWatcher || !database) {
    return () => {};
  }

  const checkFingerprint = async () => {
    if (isCheckingBookingFingerprint) {
      return;
    }

    isCheckingBookingFingerprint = true;

    try {
      const nextFingerprint = await getBookingContentFingerprint(database);

      if (!lastBookingFingerprint) {
        lastBookingFingerprint = nextFingerprint;
        return;
      }

      if (nextFingerprint && nextFingerprint !== lastBookingFingerprint) {
        lastBookingFingerprint = nextFingerprint;
        publishBookingContentChanged({
          type: "database_content_changed",
          source: "database_watcher",
        });
      }
    } catch (error) {
      console.error("Booking content watcher failed:", error);
    } finally {
      isCheckingBookingFingerprint = false;
    }
  };

  void checkFingerprint();
  bookingContentWatcher = setInterval(checkFingerprint, BOOKING_WATCH_INTERVAL_MS);

  if (typeof bookingContentWatcher?.unref === "function") {
    bookingContentWatcher.unref();
  }

  return () => {
    if (bookingContentWatcher) {
      clearInterval(bookingContentWatcher);
      bookingContentWatcher = null;
    }
    lastBookingFingerprint = null;
    isCheckingBookingFingerprint = false;
  };
};
