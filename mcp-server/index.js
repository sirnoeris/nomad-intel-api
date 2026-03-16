#!/usr/bin/env node

/**
 * Nomad Intel MCP Server
 * 
 * Exposes digital nomad intelligence (visa, cost of living, coworking, safety,
 * connectivity) as MCP tools that AI agents (Claude, Cursor, Cline) can call.
 * 
 * This MCP server acts as a thin client to the Nomad Intel API running on
 * Cloudflare Workers. Configure API_BASE_URL to point to your deployment.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_BASE_URL = process.env.NOMAD_INTEL_API_URL || "https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev";

const server = new Server(
  {
    name: "nomad-intel",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ─── Tool Definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_visa_info",
        description:
          "Get visa requirements for Australian passport holders. Returns visa-free days, digital nomad visa availability, overstay penalties, and practical notes for a specific country or all 20+ covered countries.",
        inputSchema: {
          type: "object",
          properties: {
            country: {
              type: "string",
              description: "Country name or ISO code (e.g., 'thailand', 'TH'). Omit to get all countries.",
            },
          },
        },
      },
      {
        name: "get_cost_of_living",
        description:
          "Get monthly cost of living breakdown for digital nomad destinations. Includes apartment, food, coworking, transport, and total budget estimates (low/mid/high) in USD.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name (e.g., 'bangkok', 'chiang-mai', 'canggu'). Omit to get all cities.",
            },
            budget: {
              type: "string",
              enum: ["low", "mid", "high"],
              description: "Filter by budget level.",
            },
          },
        },
      },
      {
        name: "get_coworking_spaces",
        description:
          "Get coworking space listings with prices, WiFi speeds, amenities, and ratings for nomad-popular cities.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name (e.g., 'bangkok', 'canggu'). Omit to get all cities.",
            },
            max_price: {
              type: "number",
              description: "Maximum monthly price in USD.",
            },
          },
        },
      },
      {
        name: "get_safety_info",
        description:
          "Get safety intelligence including scam warnings, health risks, emergency numbers, crime risk levels, LGBTQ+ safety, and solo female travel ratings.",
        inputSchema: {
          type: "object",
          properties: {
            country: {
              type: "string",
              description: "Country name or ISO code. Omit to get all countries.",
            },
          },
        },
      },
      {
        name: "get_connectivity",
        description:
          "Get internet and connectivity data: WiFi speeds, 4G/5G availability, eSIM providers, best cafes for working, and reliability ratings.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name. Omit to get all cities.",
            },
          },
        },
      },
      {
        name: "get_nomad_bundle",
        description:
          "Get a complete intelligence bundle for a city: visa info, cost of living, coworking spaces, safety data, and connectivity — all in one call.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "City name (required).",
            },
          },
          required: ["city"],
        },
      },
    ],
  };
});

// ─── Tool Handlers ───────────────────────────────────────────────────────────

async function callAPI(path, params = {}) {
  const url = new URL(path, API_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  // For the MCP server, we bypass x402 payment by calling the API directly.
  // In a paid MCP scenario, this server itself would be hosted on Cloudflare
  // with paidTool() wrapping, or the API would whitelist the MCP server.
  //
  // For now, we pass a dummy payment header for testing, or the API
  // can be configured with a whitelist/API key for MCP access.
  const headers = {
    "Accept": "application/json",
  };

  // If an API key is configured, use it to bypass x402
  if (process.env.NOMAD_INTEL_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.NOMAD_INTEL_API_KEY}`;
  }

  try {
    const response = await fetch(url.toString(), { headers });

    // If we get a 402 (payment required), return the pricing info
    if (response.status === 402) {
      const paymentInfo = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                note: "This endpoint requires x402 payment. Visit the API directly to query with payment.",
                api_url: url.toString(),
                payment_info: paymentInfo,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error calling Nomad Intel API: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_visa_info":
      return callAPI("/api/v1/visa", { country: args?.country });

    case "get_cost_of_living":
      return callAPI("/api/v1/cost-of-living", {
        city: args?.city,
        budget: args?.budget,
      });

    case "get_coworking_spaces":
      return callAPI("/api/v1/coworking", {
        city: args?.city,
        max_price: args?.max_price,
      });

    case "get_safety_info":
      return callAPI("/api/v1/safety", { country: args?.country });

    case "get_connectivity":
      return callAPI("/api/v1/connectivity", { city: args?.city });

    case "get_nomad_bundle":
      return callAPI("/api/v1/bundle", { city: args?.city });

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});

// ─── Start Server ────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
