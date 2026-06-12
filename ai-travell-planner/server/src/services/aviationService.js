import axios from "axios";
import { config } from "../config/env.js";
import { withRetry } from "../utils/retry.js";
import { logger } from "../utils/logger.js";

const LABEL = "aviationService";

export async function searchFlights({ origin, destination, departureDate, returnDate }) {
  // ── 1. API key guard ────────────────────────────────────────────────────
  if (!config.aviationStackApiKey) {
    logger.warn(LABEL, "AVIATIONSTACK_API_KEY is missing — returning mock data. Set it in server/.env");
    return {
      source: "mock",
      options: [
        {
          airline: "Sample Airways",
          flightNumber: "SA-701",
          route: `${origin ?? "Origin"} to ${destination ?? "Destination"}`,
          departure: departureDate ?? "Flexible dates",
          return: returnDate ?? "Flexible return",
          estimatedPrice: "Set AVIATIONSTACK_API_KEY for real pricing",
          recommendation: "Best placeholder option until AviationStack is configured"
        }
      ]
    };
  }

  // ── 2. Log exactly what we're about to send ─────────────────────────────
  logger.info(LABEL, "Calling AviationStack API", {
    endpoint:      "http://api.aviationstack.com/v1/flights",
    dep_iata:      origin        ?? "(not provided)",
    arr_iata:      destination   ?? "(not provided)",
    flight_date:   departureDate ?? "(not provided)",
    keyPrefix:     config.aviationStackApiKey.slice(0, 6) + "…"   // safe partial log
  });

  return withRetry(
    async () => {
      const params = {
        access_key:  config.aviationStackApiKey,
        arr_iata:    destination,
        limit:       8
      };

      // Only add optional params when present — sending empty strings
      // causes AviationStack to return 0 results instead of ignoring the field
      if (origin)        params.dep_iata     = origin;
      if (departureDate) params.flight_date  = departureDate;

      logger.debug(LABEL, "Request params (key redacted)", {
        ...params,
        access_key: "[REDACTED]"
      });

      const { data } = await axios.get(
        "http://api.aviationstack.com/v1/flights",
        { params, timeout: 12000 }
      );

      // ── 3. Log raw response shape ────────────────────────────────────
      logger.info(LABEL, "AviationStack raw response received", {
        hasError:    Boolean(data?.error),
        errorType:   data?.error?.type    ?? null,
        errorInfo:   data?.error?.info    ?? null,
        pagination:  data?.pagination     ?? null,
        resultCount: data?.data?.length   ?? 0
      });

      // ── 4. Surface AviationStack-level errors ────────────────────────
      if (data?.error) {
        const msg = `AviationStack API error [${data.error.type}]: ${data.error.info}`;
        logger.error(LABEL, msg);
        throw new Error(msg);
      }

      const options = (data.data || []).map((flight) => ({
        airline:        flight.airline?.name,
        flightNumber:   flight.flight?.iata || flight.flight?.number,
        route:          `${flight.departure?.airport || origin} → ${flight.arrival?.airport || destination}`,
        departure:      flight.departure?.scheduled,
        arrival:        flight.arrival?.scheduled,
        status:         flight.flight_status,
        estimatedPrice: "Pricing unavailable from AviationStack flight endpoint — check airline website"
      }));

      logger.info(LABEL, `Mapped ${options.length} flight option(s)`);

      return { source: "aviationstack", options };
    },
    { label: "AviationStack flight search" }
  );
}