# Nomad Intel API — Deployment Guide

## What This Is

A pay-per-query API that sells digital nomad intelligence (visa, cost of living, coworking, safety, connectivity data) to AI agents via the x402 protocol. Agents pay in USDC on Base network. You deploy once, it runs forever on Cloudflare's free tier.

## What You Need (10-minute setup)

### 1. Cloudflare Account (Free)
- Go to https://dash.cloudflare.com/sign-up
- Create a free account (no credit card needed)
- The free tier gives you **100,000 requests/day** — more than enough to start

### 2. Base Wallet for Receiving USDC ✅ DONE
Your wallet address is already configured in `wrangler.toml`:
```
0xf148eDEDcC3a3350542d271f67103F9C25602771
```
All USDC payments from agents will land here.

### 3. Node.js 20+
- Check: `node --version` (should be 20+)
- If not installed: `brew install node` (macOS)

## Deploy Commands

```bash
# 1. Navigate to the project
cd nomad-intel-api

# 2. Install dependencies
npm install

# 3. Login to Cloudflare (opens browser)
npx wrangler login

# 4. Deploy to Cloudflare Workers (free tier)
# (Wallet address is already in wrangler.toml — no secrets needed for testnet)
npm run deploy
```

That's it. You'll get a URL like:
```
https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev
```

## Test It

```bash
# Health check (free, no payment needed)
curl https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev/

# View all endpoints and pricing (free)
curl https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev/api/v1/endpoints

# x402 discovery document (free — this is how agents find you)
curl https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev/.well-known/x402.json

# Try a paid endpoint (will return 402 Payment Required)
curl -i https://nomad-intel-api.YOUR-SUBDOMAIN.workers.dev/api/v1/visa?country=thailand
# You'll see HTTP 402 with payment instructions — this is correct!
# Agents with x402-compatible wallets will pay automatically.
```

## Going to Production (Base Mainnet)

The project ships configured for **Base Sepolia testnet**. When you're ready for real payments:

1. Edit `wrangler.toml`:
```toml
[vars]
X402_NETWORK = "base"
USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

2. Redeploy:
```bash
npm run deploy
```

Now agents pay real USDC on Base mainnet.

## Custom Domain (Optional)

To use your own domain (e.g., `api.nomadintel.com`):

1. Add a custom domain in Cloudflare Workers dashboard
2. Point your domain's DNS to Cloudflare
3. Done — Cloudflare handles SSL automatically

## Revenue Tracking

- USDC payments arrive directly in your Base wallet
- Track on https://basescan.org/address/YOUR-WALLET-ADDRESS
- Or view in Coinbase Wallet / MetaMask

## Agent Discovery

For AI agents to find your API:

1. **x402 Discovery**: Your `/.well-known/x402.json` endpoint advertises your API to any x402-compatible agent
2. **MCP Marketplaces**: Register on mcpmarket.com, pulsemcp.com, smithery.ai (see MCP server version)
3. **Agent Directories**: List on aiagentsdirectory.com and similar registries
4. **SEO**: The health endpoint at `/` describes the API in agent-readable JSON

## Costs

- **Cloudflare Workers Free Tier**: 100,000 requests/day, zero cost
- **At full free-tier capacity**: 100K requests × $0.003 avg = $300/day potential
- **Paid Workers plan ($5/mo)**: 10 million requests/month, increases headroom massively
- **Your ongoing effort**: Zero. Data is static until you update it.

## Updating Data

To refresh data (prices change, visa rules update):

1. Edit the data files in `src/data/`
2. Run `npm run deploy`

Or set up a cron job / AI agent (OpenClaw, etc.) to:
1. Research current data
2. Update the TypeScript files
3. Run `wrangler deploy`

This can be fully automated — an agent maintaining another agent's business.
