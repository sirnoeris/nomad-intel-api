# Data Refresh Prompt for AI Agent (OpenClaw / Any AI)

Use this prompt with your OpenClaw agent, ChatGPT, Claude, or any AI assistant to auto-update the data files. Run monthly or when you want fresh data.

---

## Prompt:

```
You are maintaining a digital nomad intelligence API. I need you to research and update the data files for the Nomad Intel API.

The data files are TypeScript files located in src/data/ of the nomad-intel-api project.

For each file, research the CURRENT (2026) accurate data and update the values. Keep the same TypeScript interface/structure — only change the values and the last_updated dates to today.

Files to update:

1. **visa-data.ts** — Visa requirements for Australian passport holders visiting 20+ countries. Research:
   - Current visa-free entry periods
   - Digital nomad visa programs and costs
   - Overstay penalties
   - Any recent policy changes

2. **cost-data.ts** — Monthly cost of living in 20 nomad cities. Research:
   - Current rental prices (studio & 1-bed apartments)
   - Food costs (local meals, western meals, coffee, beer)
   - Coworking monthly passes
   - Transport (Grab/Bolt 5km ride)
   - All prices in USD

3. **coworking-data.ts** — Coworking spaces in top 10 cities. Research:
   - Current day pass and monthly prices
   - WiFi speeds (check Speedtest or reviews)
   - Any new popular spaces that opened
   - Remove any that have closed

4. **safety-data.ts** — Safety intel per country. Research:
   - Current scam warnings
   - Health advisories (any new outbreaks)
   - Updated emergency numbers
   - Recent safety incidents relevant to tourists

5. **connectivity-data.ts** — Internet/connectivity per city. Research:
   - Current average WiFi/4G/5G speeds
   - Best eSIM providers and prices
   - New cafes popular for remote work

After updating each file, set last_updated to today's date.
Then run: cd nomad-intel-api && npm run deploy
```

---

## Automation Options:

### Option A: OpenClaw Cron (if you have OpenClaw set up)
Set OpenClaw to run this prompt on the 1st of every month with access to your nomad-intel-api directory.

### Option B: GitHub Actions
Push the repo to GitHub and create a workflow that:
1. Triggers monthly via cron
2. Uses an AI to research and update the data files
3. Commits and deploys via `wrangler deploy`

### Option C: Perplexity Computer
Come back here monthly and say: "Update the Nomad Intel API data and redeploy"
