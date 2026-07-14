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
    endpoint:      "https://api.aviationstack.com/v1/flights",
    dep_iata:      origin        ?? "(not provided)",
    arr_iata:      destination   ?? "(not provided)",
    flight_date:   departureDate ?? "(not provided)",
    keyPrefix:     config.aviationStackApiKey.slice(0, 6) + "…"   // safe partial log
  });

  try {
    return await withRetry(
      async () => {
      const params = {
        access_key:  config.aviationStackApiKey,
        arr_iata:    destination,
        limit:       10
      };

      // Only add optional params when present — sending empty strings
      // causes AviationStack to return 0 results instead of ignoring the field
      if (origin) params.dep_iata = origin;

      // NOTE: flight_date is a PAID feature on AviationStack.
      // Free plan only returns live/real-time flights — omit the date filter
      // so we at least get current flights on the route. The LLM will note
      // that exact date pricing should be verified on airline websites.

      logger.debug(LABEL, "Request params (key redacted)", {
        ...params,
        access_key: "[REDACTED]"
      });

      const { data } = await axios.get(
        "https://api.aviationstack.com/v1/flights",
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

      const rawFlights = data.data || [];
      const options = rawFlights.map((flight) => ({
        airline:        flight.airline?.name,
        flightNumber:   flight.flight?.iata || flight.flight?.number,
        route:          `${flight.departure?.airport || origin} → ${flight.arrival?.airport || destination}`,
        departure:      flight.departure?.scheduled,
        arrival:        flight.arrival?.scheduled,
        status:         flight.flight_status,
        estimatedPrice: "Check airline website or MakeMyTrip for exact pricing"
      }));

      logger.info(LABEL, `Mapped ${options.length} flight option(s)`);

      // Free plan returns only live/real-time flights. When 0 results come back
      // (route currently has no airborne flights), return a route-exists stub so
      // the LLM can still produce useful guidance and pricing estimates.
      if (options.length === 0) {
        return {
          source: "aviationstack_no_live_flights",
          origin,
          destination,
          departureDate,
          returnDate,
          options: [],
          note: "AviationStack free plan shows only live airborne flights. No flights are airborne on this route right now. The LLM will estimate pricing based on route knowledge."
        };
      }

      return { source: "aviationstack", options };
      },
      { label: "AviationStack flight search" }
    );
  } catch (err) {
    // If the key is invalid/unauthorized, surface a clear mock response so
    // calling agents can continue (they already handle `mock` source).
    const isAuthError =
      String(err?.message ?? "").includes("status code 401") ||
      err?.response?.status === 401;

    if (isAuthError) {
      logger.warn(LABEL, "AviationStack API unauthorized (401) — returning mock data", {
        hint: "Check AVIATIONSTACK_API_KEY in server/.env or the environment",
        errorMessage: err.message
      });

      return {
        source: "mock",
        note: "AviationStack API key appears invalid or unauthorized. Set a valid AVIATIONSTACK_API_KEY to enable live flight data.",
        options: [
          {
            airline: "Sample Airways",
            flightNumber: "SA-701",
            route: `${origin ?? "Origin"} to ${destination ?? "Destination"}`,
            departure: departureDate ?? "Flexible dates",
            return: returnDate ?? "Flexible return",
            estimatedPrice: "Set a valid AVIATIONSTACK_API_KEY for real pricing",
            recommendation: "Provide a valid key in server/.env or use a paid AviationStack plan for date-filtered searches"
          }
        ]
      };
    }

    // Re-throw other errors for higher-level handlers to manage
    throw err;
  }
}