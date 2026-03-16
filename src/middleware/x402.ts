import { Context, MiddlewareHandler } from "hono";

interface X402PaymentRequirement {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: "application/json";
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
  extra?: {
    name: string;
    version: string;
  };
}

interface X402Response {
  x402Version: 2;
  error: string;
  accepts: X402PaymentRequirement[];
}

interface Env {
  WALLET_ADDRESS: string;
  X402_NETWORK: string;
  USDC_CONTRACT: string;
  FACILITATOR_URL: string;
}

const USDC_DECIMALS = 6;

const USDC_CONTRACTS: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

function usdToAtomicUnits(amountUSD: string): string {
  const parts = amountUSD.split(".");
  const whole = parts[0] ?? "0";
  const frac = (parts[1] ?? "").padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
  const raw = whole + frac;
  // Strip leading zeros but keep at least "0"
  return raw.replace(/^0+/, "") || "0";
}

function isValidBase64(str: string): boolean {
  if (str.length === 0) return false;
  try {
    const decoded = atob(str);
    return decoded.length > 0;
  } catch {
    return false;
  }
}

/**
 * x402 payment middleware for Hono on Cloudflare Workers.
 *
 * @param amountUSDC - Price in USDC as a decimal string, e.g. "0.003"
 * @param description - Human-readable description of what the payment is for
 */
export function x402(amountUSDC: string, description: string): MiddlewareHandler<{ Bindings: Env }> {
  return async (c: Context<{ Bindings: Env }>, next) => {
    const paymentHeader = c.req.header("X-PAYMENT");

    if (!paymentHeader) {
      const network = c.env.X402_NETWORK || "base-sepolia";
      const usdcContract = USDC_CONTRACTS[network] ?? c.env.USDC_CONTRACT;
      const walletAddress = c.env.WALLET_ADDRESS;

      if (!walletAddress) {
        return c.json({ error: "Server misconfigured: no wallet address" }, 500);
      }

      const atomicAmount = usdToAtomicUnits(amountUSDC);

      const body: X402Response = {
        x402Version: 2,
        error: "X-PAYMENT header is required. Payment must be made to access this resource.",
        accepts: [
          {
            scheme: "exact",
            network,
            maxAmountRequired: atomicAmount,
            resource: new URL(c.req.url).pathname + new URL(c.req.url).search,
            description,
            mimeType: "application/json",
            payTo: walletAddress,
            maxTimeoutSeconds: 60,
            asset: usdcContract,
            extra: {
              name: "nomad-intel-api",
              version: "1.0.0",
            },
          },
        ],
      };

      return c.json(body, 402, {
        "X-PAYMENT-NETWORK": network,
        "X-PAYMENT-TOKEN": usdcContract,
        "X-PAYMENT-ADDRESS": walletAddress,
        "X-PAYMENT-AMOUNT": atomicAmount,
        "X-PAYMENT-DECIMALS": String(USDC_DECIMALS),
      });
    }

    // Basic validation: header must be base64-decodable
    if (!isValidBase64(paymentHeader)) {
      return c.json(
        {
          error: "Invalid X-PAYMENT header: must be a valid base64-encoded payment payload",
        },
        400
      );
    }

    // Payment header present and valid — proceed
    // Full on-chain verification will be added via Coinbase facilitator
    await next();
  };
}
