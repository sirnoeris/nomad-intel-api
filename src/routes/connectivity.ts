import { Hono } from "hono";
import { connectivityData, ConnectivityInfo } from "../data/connectivity-data";
import { API_VERSION, DATA_LAST_UPDATED, DISCLAIMER } from "../constants";

const connectivity = new Hono();

connectivity.get("/", (c) => {
  const city = c.req.query("city")?.toLowerCase();
  const country = c.req.query("country")?.toLowerCase();

  let results: ConnectivityInfo[] = connectivityData;

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

  if (results.length === 0) {
    const availableCities = connectivityData.map((d) => ({
      city: d.city,
      country: d.country,
      country_code: d.country_code,
    }));
    return c.json(
      {
        error: "No matching cities found",
        available_cities: availableCities,
      },
      404
    );
  }

  return c.json({
    meta: {
      endpoint: "/api/v1/connectivity",
      price_usd: city ? "0.003" : "0.01",
      data_freshness: results.reduce(
        (latest, d) => (d.last_updated > latest ? d.last_updated : latest),
        "1970-01-01"
      ),
      total_results: results.length,
      disclaimer: DISCLAIMER,
      data_version: API_VERSION,
      data_last_updated: DATA_LAST_UPDATED,
    },
    data: results,
  });
});

export default connectivity;
