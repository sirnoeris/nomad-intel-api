import { Hono } from "hono";
import { coworkingData, CoworkingSpace } from "../data/coworking-data";

const coworking = new Hono();

coworking.get("/", (c) => {
  const city = c.req.query("city")?.toLowerCase();
  const country = c.req.query("country")?.toLowerCase();
  const maxPrice = c.req.query("max_price");

  let results: CoworkingSpace[] = coworkingData;

  if (city) {
    results = results.filter(
      (d) =>
        d.city.toLowerCase().replace(/\s+/g, "-") === city.replace(/\s+/g, "-") ||
        d.city.toLowerCase() === city
    );
  }

  if (country) {
    results = results.filter(
      (d) =>
        d.country.toLowerCase() === country ||
        d.country_code.toLowerCase() === country
    );
  }

  if (maxPrice) {
    const max = parseFloat(maxPrice);
    if (!isNaN(max)) {
      results = results.filter((d) => d.monthly_usd <= max);
    }
  }

  if (results.length === 0) {
    const availableCities = [...new Set(coworkingData.map((d) => d.city))];
    return c.json(
      {
        error: "No matching coworking spaces found",
        available_cities: availableCities,
      },
      404
    );
  }

  return c.json({
    meta: {
      endpoint: "/api/v1/coworking",
      price_usd: city ? "0.003" : "0.01",
      total_results: results.length,
      currency_note: "All prices in USD",
    },
    data: results,
  });
});

export default coworking;
