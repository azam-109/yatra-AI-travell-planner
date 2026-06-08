import Trip from "../models/Trip.js";

function fallbackAgentResult(name, errors = []) {
  return {
    status: "unavailable",
    message: `${name} agent did not return structured data.`,
    errors
  };
}

export async function persistTrip({ userId, chatId, result, finalResponse }) {
  const errors = result.errors || [];
  return Trip.create({
    userId,
    chatId,
    destination: result.tripSpec?.destination || "Planned destination",
    budget: result.tripSpec?.budget,
    dates: result.tripSpec?.travelDates,
    flights: result.flights || fallbackAgentResult("Flight", errors.filter((error) => error.agent === "flight")),
    hotels: result.hotels || fallbackAgentResult("Hotel", errors.filter((error) => error.agent === "hotel")),
    itinerary: result.itinerary || fallbackAgentResult("Itinerary", errors.filter((error) => error.agent === "itinerary")),
    finalResponse
  });
}
