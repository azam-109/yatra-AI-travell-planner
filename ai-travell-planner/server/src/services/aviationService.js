import axios from "axios";
import { config } from "../config/env.js";
import { withRetry } from "../utils/retry.js";

export async function searchFlights({ origin, destination, departureDate, returnDate }) {
  if (!config.aviationStackApiKey) {
    return {
      source: "mock",
      options: [
        {
          airline: "Sample Airways",
          flightNumber: "SA-701",
          route: `${origin || "Origin"} to ${destination || "Destination"}`,
          departure: departureDate || "Flexible dates",
          return: returnDate || "Flexible return",
          estimatedPrice: "Use live AviationStack key for real pricing",
          recommendation: "Best placeholder option until AviationStack is configured"
        }
      ]
    };
  }

  return withRetry(
    async () => {
      const { data } = await axios.get("http://api.aviationstack.com/v1/flights", {
        params: {
          access_key: config.aviationStackApiKey,
          dep_iata: origin,
          arr_iata: destination,
          flight_date: departureDate,
          limit: 8
        },
        timeout: 12000
      });

      const options = (data.data || []).map((flight) => ({
        airline: flight.airline?.name,
        flightNumber: flight.flight?.iata || flight.flight?.number,
        route: `${flight.departure?.airport || origin} to ${flight.arrival?.airport || destination}`,
        departure: flight.departure?.scheduled,
        arrival: flight.arrival?.scheduled,
        status: flight.flight_status,
        estimatedPrice: "Pricing unavailable from AviationStack flight endpoint"
      }));

      return { source: "aviationstack", options };
    },
    { label: "AviationStack flight search" }
  );
}
