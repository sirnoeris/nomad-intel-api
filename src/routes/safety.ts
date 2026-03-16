import { Hono } from "hono";
import { safetyData, SafetyInfo } from "../data/safety-data";

const safety = new Hono();

safety.get("/", (c) => {
  const country = c.req.query("country")?.toLowerCase();

  let results: SafetyInfo[];

  if (country) {
    results = safetyData.filter(
      (d) =>
        d.country.toLowerCase() === country ||
        d.country_code.toLowerCase() === country
    );

    if (results.length === 0) {
      return c.json(
        {
          error: "Country not found",
          available_countries: safetyData.map((d) => ({
            country: d.country,
            country_code: d.country_code,
          })),
        },
        404
      );
    }
  } else {
    results = safetyData;
  }

  return c.json({
    meta: {
      endpoint: "/api/v1/safety",
      price_usd: country ? "0.003" : "0.01",
      data_freshness: results.reduce(
        (latest, d) => (d.last_updated > latest ? d.last_updated : latest),
        "1970-01-01"
      ),
      total_results: results.length,
    },
    data: results,
  });
});

export default safety;
