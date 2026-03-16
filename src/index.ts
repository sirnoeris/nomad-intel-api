import { Hono } from "hono";
import { cors } from "hono/cors";
import { x402 } from "./middleware/x402";
import visaRoutes from "./routes/visa";
import costOfLivingRoutes from "./routes/cost-of-living";
import coworkingRoutes from "./routes/coworking";
import safetyRoutes from "./routes/safety";
import connectivityRoutes from "./routes/connectivity";

import { API_VERSION, DATA_LAST_UPDATED, DISCLAIMER } from "./constants";
import { visaData } from "./data/visa-data";
import { costData } from "./data/cost-data";
import { coworkingData } from "./data/coworking-data";
import { safetyData } from "./data/safety-data";
import { connectivityData } from "./data/connectivity-data";

interface Env {
  WALLET_ADDRESS: string;
  X402_NETWORK: string;
  USDC_CONTRACT: string;
  FACILITATOR_URL: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS for all origins
app.use("*", cors());

// ─── Free endpoints ─────────────────────────────────────────────────────────

app.get("/", (c) => {
  return c.json({
    name: "Nomad Intel API",
    version: "1.0.0",
    description:
      "Real-time intelligence for digital nomads — visa requirements, cost of living, coworking spaces, safety advisories, and connectivity data for 20+ countries. Pay-per-query via x402 (USDC on Base).",
    status: "operational",
    documentation: "/api/v1/endpoints",
    x402_discovery: "/.well-known/x402.json",
    passport_data: "Australian passport holder",
    disclaimer: DISCLAIMER,
  });
});

app.get("/api/v1/endpoints", (c) => {
  return c.json({
    name: "Nomad Intel API",
    version: "1.0.0",
    payment: {
      protocol: "x402",
      network: c.env.X402_NETWORK || "base-sepolia",
      token: "USDC",
      discovery: "/.well-known/x402.json",
    },
    endpoints: [
      {
        path: "/api/v1/visa",
        method: "GET",
        description: "Visa requirements for Australian passport holders across 20+ countries",
        price_usd_single: "0.003",
        price_usd_all: "0.01",
        params: { country: "Country name or ISO code (e.g., 'thailand' or 'TH')" },
        example: "/api/v1/visa?country=thailand",
      },
      {
        path: "/api/v1/cost-of-living",
        method: "GET",
        description: "Monthly cost of living breakdown for 20 nomad-popular cities",
        price_usd_single: "0.003",
        price_usd_all: "0.01",
        params: {
          city: "City name (e.g., 'bangkok', 'chiang-mai')",
          country: "Country name or ISO code",
          budget: "Budget level: low, mid, or high",
        },
        example: "/api/v1/cost-of-living?city=bangkok&budget=mid",
      },
      {
        path: "/api/v1/coworking",
        method: "GET",
        description: "Coworking space listings with prices, WiFi speeds, and amenities",
        price_usd_single: "0.003",
        price_usd_all: "0.01",
        params: {
          city: "City name",
          country: "Country name or ISO code",
          max_price: "Maximum monthly price in USD",
        },
        example: "/api/v1/coworking?city=canggu",
      },
      {
        path: "/api/v1/safety",
        method: "GET",
        description: "Safety ratings, scam warnings, health risks, and emergency info",
        price_usd_single: "0.003",
        price_usd_all: "0.01",
        params: { country: "Country name or ISO code" },
        example: "/api/v1/safety?country=thailand",
      },
      {
        path: "/api/v1/connectivity",
        method: "GET",
        description: "Internet speeds, eSIM providers, WiFi cafe recommendations, and reliability",
        price_usd_single: "0.003",
        price_usd_all: "0.01",
        params: {
          city: "City name",
          country: "Country name or ISO code",
        },
        example: "/api/v1/connectivity?city=bangkok",
      },
      {
        path: "/api/v1/bundle",
        method: "GET",
        description: "Complete nomad intel bundle — visa, cost, coworking, safety, and connectivity for a city/country",
        price_usd: "0.02",
        params: {
          city: "City name (required)",
          country: "Country name or ISO code (optional, inferred from city)",
        },
        example: "/api/v1/bundle?city=bangkok",
      },
    ],
  });
});

// ─── MCP Server Card (Smithery discovery) ───────────────────────────────────

app.get("/.well-known/mcp/server-card.json", (c) => {
  return c.json({
    serverInfo: {
      name: "Nomad Intel API",
      version: "1.0.0",
    },
    authentication: {
      required: false,
    },
    tools: [
      {
        name: "get_visa_info",
        description: "Get visa requirements for Australian passport holders. Covers 20+ countries.",
        inputSchema: {
          type: "object",
          properties: {
            country: { type: "string", description: "Country name or ISO code (e.g., 'thailand' or 'TH')" },
          },
        },
      },
      {
        name: "get_cost_of_living",
        description: "Get monthly cost of living breakdown for digital nomad cities.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name (e.g., 'bangkok', 'chiang-mai')" },
            budget: { type: "string", description: "Budget level: low, mid, or high" },
          },
        },
      },
      {
        name: "get_coworking_spaces",
        description: "Get coworking space listings with prices, WiFi speeds, and amenities.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name" },
          },
        },
      },
      {
        name: "get_safety_info",
        description: "Get safety ratings, scam warnings, health risks, and emergency contacts.",
        inputSchema: {
          type: "object",
          properties: {
            country: { type: "string", description: "Country name or ISO code" },
          },
        },
      },
      {
        name: "get_connectivity",
        description: "Get internet speeds, eSIM providers, WiFi cafe recommendations, and reliability.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name" },
          },
        },
      },
      {
        name: "get_nomad_bundle",
        description: "Get complete nomad intel bundle — visa, cost, coworking, safety, and connectivity for a city.",
        inputSchema: {
          type: "object",
          properties: {
            city: { type: "string", description: "City name (required)" },
          },
          required: ["city"],
        },
      },
    ],
    resources: [],
    prompts: [],
  });
});

// ─── x402 Discovery ─────────────────────────────────────────────────────────

app.get("/.well-known/x402.json", (c) => {
  const network = c.env.X402_NETWORK || "base-sepolia";
  const walletAddress = c.env.WALLET_ADDRESS || "";

  const USDC_CONTRACTS: Record<string, string> = {
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };
  const asset = USDC_CONTRACTS[network] ?? c.env.USDC_CONTRACT;

  interface EndpointConfig {
    path: string;
    method: string;
    description: string;
    maxAmountRequired: string;
    amountUSD: string;
  }

  const endpoints: EndpointConfig[] = [
    { path: "/api/v1/visa?country=*", method: "GET", description: "Visa info for a single country", maxAmountRequired: "3000", amountUSD: "0.003" },
    { path: "/api/v1/visa", method: "GET", description: "Visa info for all countries", maxAmountRequired: "10000", amountUSD: "0.01" },
    { path: "/api/v1/cost-of-living?city=*", method: "GET", description: "Cost of living for a single city", maxAmountRequired: "3000", amountUSD: "0.003" },
    { path: "/api/v1/cost-of-living", method: "GET", description: "Cost of living for all cities", maxAmountRequired: "10000", amountUSD: "0.01" },
    { path: "/api/v1/coworking?city=*", method: "GET", description: "Coworking spaces for a single city", maxAmountRequired: "3000", amountUSD: "0.003" },
    { path: "/api/v1/coworking", method: "GET", description: "Coworking spaces for all cities", maxAmountRequired: "10000", amountUSD: "0.01" },
    { path: "/api/v1/safety?country=*", method: "GET", description: "Safety data for a single country", maxAmountRequired: "3000", amountUSD: "0.003" },
    { path: "/api/v1/safety", method: "GET", description: "Safety data for all countries", maxAmountRequired: "10000", amountUSD: "0.01" },
    { path: "/api/v1/connectivity?city=*", method: "GET", description: "Connectivity data for a single city", maxAmountRequired: "3000", amountUSD: "0.003" },
    { path: "/api/v1/connectivity", method: "GET", description: "Connectivity data for all cities", maxAmountRequired: "10000", amountUSD: "0.01" },
    { path: "/api/v1/bundle?city=*", method: "GET", description: "Full nomad intel bundle for a city", maxAmountRequired: "20000", amountUSD: "0.02" },
  ];

  return c.json({
    x402Version: 2,
    name: "Nomad Intel API",
    description: "Digital nomad intelligence — visa, cost of living, coworking, safety, and connectivity data. Pay-per-query via USDC on Base.",
    endpoints: endpoints.map((ep) => ({
      path: ep.path,
      method: ep.method,
      description: ep.description,
      payment: {
        scheme: "exact",
        network,
        maxAmountRequired: ep.maxAmountRequired,
        amountUSD: ep.amountUSD,
        asset,
        payTo: walletAddress,
        maxTimeoutSeconds: 60,
        mimeType: "application/json",
      },
    })),
  });
});

// ─── Paid endpoints ─────────────────────────────────────────────────────────

// Helper: determine price based on whether a filter param is provided
function singleOrAllPrice(c: { req: { query: (key: string) => string | undefined } }, paramName: string): string {
  return c.req.query(paramName) ? "0.003" : "0.01";
}

// Visa
app.use("/api/v1/visa", (c, next) => {
  const price = singleOrAllPrice(c, "country");
  const desc = c.req.query("country")
    ? `Visa requirements for ${c.req.query("country")}`
    : "Visa requirements for all countries";
  return x402(price, desc)(c, next);
});
app.route("/api/v1/visa", visaRoutes);

// Cost of Living
app.use("/api/v1/cost-of-living", (c, next) => {
  const price = singleOrAllPrice(c, "city");
  const desc = c.req.query("city")
    ? `Cost of living for ${c.req.query("city")}`
    : "Cost of living for all cities";
  return x402(price, desc)(c, next);
});
app.route("/api/v1/cost-of-living", costOfLivingRoutes);

// Coworking
app.use("/api/v1/coworking", (c, next) => {
  const price = singleOrAllPrice(c, "city");
  const desc = c.req.query("city")
    ? `Coworking spaces in ${c.req.query("city")}`
    : "Coworking spaces for all cities";
  return x402(price, desc)(c, next);
});
app.route("/api/v1/coworking", coworkingRoutes);

// Safety
app.use("/api/v1/safety", (c, next) => {
  const price = singleOrAllPrice(c, "country");
  const desc = c.req.query("country")
    ? `Safety data for ${c.req.query("country")}`
    : "Safety data for all countries";
  return x402(price, desc)(c, next);
});
app.route("/api/v1/safety", safetyRoutes);

// Connectivity
app.use("/api/v1/connectivity", (c, next) => {
  const price = singleOrAllPrice(c, "city");
  const desc = c.req.query("city")
    ? `Connectivity data for ${c.req.query("city")}`
    : "Connectivity data for all cities";
  return x402(price, desc)(c, next);
});
app.route("/api/v1/connectivity", connectivityRoutes);

// ─── Bundle endpoint ────────────────────────────────────────────────────────

app.use("/api/v1/bundle", (c, next) => {
  const city = c.req.query("city");
  const desc = city ? `Full nomad intel bundle for ${city}` : "Full nomad intel bundle";
  return x402("0.02", desc)(c, next);
});

app.get("/api/v1/bundle", (c) => {
  const cityParam = c.req.query("city")?.toLowerCase();

  if (!cityParam) {
    return c.json(
      {
        error: "city parameter is required for bundle endpoint",
        example: "/api/v1/bundle?city=bangkok",
      },
      400
    );
  }

  // Find city in cost data to resolve country
  const cityMatch = costData.find(
    (d) =>
      d.city.toLowerCase().replace(/\s+/g, "-") === cityParam.replace(/\s+/g, "-") ||
      d.city.toLowerCase() === cityParam
  );

  if (!cityMatch) {
    return c.json(
      {
        error: "City not found",
        available_cities: costData.map((d) => ({
          city: d.city,
          country: d.country,
        })),
      },
      404
    );
  }

  const countryLower = cityMatch.country.toLowerCase();
  const cityLower = cityMatch.city.toLowerCase();

  const visa = visaData.filter((d) => d.country.toLowerCase() === countryLower);
  const cost = costData.filter((d) => d.city.toLowerCase() === cityLower);
  const coworking = coworkingData.filter((d) => d.city.toLowerCase() === cityLower);
  const safety = safetyData.filter((d) => d.country.toLowerCase() === countryLower);
  const connectivity = connectivityData.filter((d) => d.city.toLowerCase() === cityLower);

  return c.json({
    meta: {
      endpoint: "/api/v1/bundle",
      price_usd: "0.02",
      city: cityMatch.city,
      country: cityMatch.country,
      country_code: cityMatch.country_code,
      disclaimer: DISCLAIMER,
      data_version: API_VERSION,
      data_last_updated: DATA_LAST_UPDATED,
    },
    data: {
      visa: visa[0] ?? null,
      cost_of_living: cost[0] ?? null,
      coworking,
      safety: safety[0] ?? null,
      connectivity: connectivity[0] ?? null,
    },
  });
});

export default app;
