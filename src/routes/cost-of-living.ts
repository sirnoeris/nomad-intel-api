import { Hono } from "hono";
import { costData, CostOfLiving } from "../data/cost-data";

type BudgetLevel = "low" | "mid" | "high";
const BUDGET_LEVELS: BudgetLevel[] = ["low", "mid", "high"];

function isBudgetLevel(val: string): val is BudgetLevel {
  return BUDGET_LEVELS.includes(val as BudgetLevel);
}

const costOfLiving = new Hono();

costOfLiving.get("/", (c) => {
  const city = c.req.query("city")?.toLowerCase();
  const country = c.req.query("country")?.toLowerCase();
  const budget = c.req.query("budget")?.toLowerCase();

  let results: CostOfLiving[] = costData;

  if (city) {
    results = results.filter(
      (d) => d.city.toLowerCase().replace(/\s+/g, "-") === city.replace(/\s+/g, "-") ||
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
    return c.json(
      {
        error: "No matching cities found",
        available_cities: costData.map((d) => ({
          city: d.city,
          country: d.country,
          country_code: d.country_code,
        })),
      },
      404
    );
  }

  let data: Array<CostOfLiving | (CostOfLiving & { recommended_budget: { level: BudgetLevel; monthly_usd: number } })> = results;

  if (budget && isBudgetLevel(budget)) {
    data = results.map((d) => ({
      ...d,
      recommended_budget: {
        level: budget,
        monthly_usd:
          budget === "low"
            ? d.total_budget_low
            : budget === "mid"
              ? d.total_budget_mid
              : d.total_budget_high,
      },
    }));
  }

  return c.json({
    meta: {
      endpoint: "/api/v1/cost-of-living",
      price_usd: city ? "0.003" : "0.01",
      data_freshness: results.reduce(
        (latest, d) => (d.last_updated > latest ? d.last_updated : latest),
        "1970-01-01"
      ),
      total_results: results.length,
      currency_note: "All prices in USD unless otherwise noted",
    },
    data,
  });
});

export default costOfLiving;
