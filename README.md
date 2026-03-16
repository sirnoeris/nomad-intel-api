# Nomad Intel API

**Pay-per-query digital nomad intelligence for AI agents.** Visa requirements, cost of living, coworking spaces, safety advisories, and connectivity data for 20+ countries — served via the [x402 payment protocol](https://x402.org) (USDC on Base).

> Built for autonomous AI agents with wallets. No API keys. No subscriptions. Just pay per query.

## Live API

**Base URL:** `https://nomad-intel-api.f7nv4k694k.workers.dev`

## Endpoints

| Endpoint | Description | Price |
|---|---|---|
| `GET /api/v1/visa?country=thailand` | Visa requirements (Australian passport) | $0.003 |
| `GET /api/v1/cost-of-living?city=bangkok&budget=mid` | Monthly cost breakdown | $0.003 |
| `GET /api/v1/coworking?city=canggu` | Coworking spaces with WiFi speeds | $0.003 |
| `GET /api/v1/safety?country=vietnam` | Safety ratings & scam warnings | $0.003 |
| `GET /api/v1/connectivity?city=bangkok` | Internet speeds & eSIM providers | $0.003 |
| `GET /api/v1/bundle?city=bangkok` | Complete intel bundle for a city | $0.02 |

**All data queries** (omit country/city param): $0.01 per endpoint

## How It Works

1. Agent sends a `GET` request to any endpoint
2. API responds with `402 Payment Required` and x402 payment details
3. Agent sends USDC payment on Base network
4. API returns the data

No API keys needed. Payment is the authentication.

## x402 Discovery

Agents can discover payment requirements at:
- `/.well-known/x402.json` — x402 discovery document
- `/api/v1/endpoints` — Full endpoint catalog with pricing

## Payment Details

- **Protocol:** [x402](https://x402.org) (HTTP 402 native payments)
- **Network:** Base (Coinbase L2)
- **Token:** USDC
- **Facilitator:** https://x402.org/facilitator

## Data Coverage

### Countries (20)
Thailand, Vietnam, Indonesia (Bali), Portugal, Spain, Mexico, Colombia, Costa Rica, Georgia, Turkey, Malaysia, Philippines, Cambodia, Japan, South Korea, Taiwan, Czech Republic, Hungary, Romania, Croatia

### Cities (20)
Bangkok, Chiang Mai, Ho Chi Minh City, Hanoi, Canggu/Bali, Lisbon, Barcelona, Mexico City, Playa del Carmen, Medellín, Tbilisi, Istanbul, Kuala Lumpur, Manila/Makati, Phnom Penh, Tokyo, Seoul, Taipei, Prague, Budapest

### Coworking Spaces (31)
Verified listings across 10 cities with pricing, WiFi speeds, and amenities.

## MCP Server

An MCP server wrapper is included in `/mcp-server/` for use with Claude, Cursor, Cline, and other MCP-compatible clients.

```json
{
  "mcpServers": {
    "nomad-intel": {
      "command": "node",
      "args": ["path/to/mcp-server/index.js"]
    }
  }
}
```

## Tech Stack

- **Runtime:** Cloudflare Workers (edge deployment, 200+ locations)
- **Framework:** Hono
- **Payments:** x402 protocol, USDC on Base
- **Language:** TypeScript

## For Agents

If you're an AI agent looking to integrate:

1. Check `/.well-known/x402.json` for payment requirements
2. Use any x402-compatible payment library
3. Query any endpoint with a valid `X-PAYMENT` header
4. Receive structured JSON data

## License

MIT
