import axios from "axios";
import { config } from "../config/env.js";
import { withRetry } from "../utils/retry.js";

export async function getWeatherContext(destination) {
  if (!config.openWeatherApiKey || !destination) return null;

  return withRetry(
    async () => {
      const { data } = await axios.get("https://api.openweathermap.org/data/2.5/forecast", {
        params: {
          q: destination,
          appid: config.openWeatherApiKey,
          units: "metric"
        },
        timeout: 10000
      });
      return {
        city: data.city?.name,
        summary: data.list?.slice(0, 8).map((item) => ({
          time: item.dt_txt,
          tempC: item.main?.temp,
          condition: item.weather?.[0]?.description
        }))
      };
    },
    { retries: 1, label: "OpenWeather forecast" }
  );
}
