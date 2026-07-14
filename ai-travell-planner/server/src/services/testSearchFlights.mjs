import { searchFlights } from "./aviationService.js";

(async () => {
  try {
    console.log("Calling searchFlights test...\n");
    const result = await searchFlights({ origin: "BOM", destination: "DEL", departureDate: null, returnDate: null });
    console.log("--- searchFlights result ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("searchFlights test error:", err.message);
    console.error(err.stack);
    process.exitCode = 1;
  }
})();
