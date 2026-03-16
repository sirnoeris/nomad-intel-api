import { Hono } from "hono";
import { visaData, VisaInfo } from "../data/visa-data";
import { API_VERSION, DATA_LAST_UPDATED, DISCLAIMER } from "../constants";

const visa = new Hono();

visa.get("/", (c) => {
  const country = c.req.query("country")?.toLowerCase();

  let results: VisaInfo[];

  if (country) {
    results = visaData.filter(
      (v) =>
        v.country.toLowerCase() === country ||
        v.country_code.toLowerCase() === country
    );

    if (results.length === 0) {
      return c.json(
        {
          error: "Country not found",
          available_countries: visaData.map((v) => ({
            country: v.country,
            country_code: v.country_code,
          })),
        },
        404
      );
    }
  } else {
    results = visaData;
  }

  return c.json({
    meta: {
      endpoint: "/api/v1/visa",
      price_usd: country ? "0.003" : "0.01",
      data_freshness: results.reduce(
        (latest, v) => (v.last_updated > latest ? v.last_updated : latest),
        "1970-01-01"
      ),
      total_results: results.length,
      passport: "Australian",
      disclaimer: DISCLAIMER,
      data_version: API_VERSION,
      data_last_updated: DATA_LAST_UPDATED,
    },
    data: results,
  });
});

export default visa;
