import { prisma } from "./prisma";
import { decrypt } from "./crypto";
import { OrderStatus } from "@prisma/client";

// ---------- Types ----------

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  daytrade_count: number;
  pattern_day_trader: boolean;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: string;
  filled_qty: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  filled_avg_price: string | null;
  status: string;
}

export interface Bar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Snapshot {
  latestTrade: { p: number; s: number; t: string };
  latestQuote: { ap: number; as: number; bp: number; bs: number };
  minuteBar: Bar;
  dailyBar: Bar;
  prevDailyBar: Bar;
}

export interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  fractionable: boolean;
}

export interface PortfolioHistory {
  timestamp: number[];
  equity: number[];
  profit_loss: number[];
  profit_loss_pct: number[];
  base_value: number;
  timeframe: string;
}

export interface PlaceOrderParams {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop";
  time_in_force: "day" | "gtc" | "ioc" | "fok";
  limit_price?: number;
  stop_price?: number;
}

export interface GetOrdersParams {
  status?: "open" | "closed" | "all";
  limit?: number;
  after?: string;
  until?: string;
  direction?: "asc" | "desc";
  symbols?: string;
}

// ---------- Error ----------

export class AlpacaError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "AlpacaError";
    this.status = status;
    this.body = body;
  }
}

// ---------- Core fetch ----------

async function getCredentialsForUser(userId: string) {
  const user = (await prisma.user.findUnique({
    where: { id: userId },
  })) as {
    id: string;
    email: string;
    name: string | null;
    role: any;
    alpacaMode: string;
    alpacaPaperKey: string | null;
    alpacaPaperSecret: string | null;
    alpacaLiveKey: string | null;
    alpacaLiveSecret: string | null;
  } | null;

  if (!user) {
    throw new Error("Kullanıcı bulunamadı");
  }
  const mode = user.alpacaMode || "paper";
  const keyEncrypted =
    mode === "live" ? user.alpacaLiveKey : user.alpacaPaperKey;
  const secretEncrypted =
    mode === "live" ? user.alpacaLiveSecret : user.alpacaPaperSecret;

  if (!keyEncrypted || !secretEncrypted) {
    throw new AlpacaError(
      `Alpaca ${mode} API kimlik bilgileri yapılandırılmamış`,
      401
    );
  }

  return {
    key: decrypt(keyEncrypted),
    secret: decrypt(secretEncrypted),
    mode,
  };
}

export function getAlpacaClient(userId: string) {
  async function userAlpacaFetch<T>(
    path: string,
    options?: RequestInit & { useDataApi?: boolean }
  ): Promise<T> {
    const creds = await getCredentialsForUser(userId);
    const baseUrl = options?.useDataApi
      ? "https://data.alpaca.markets"
      : (creds.mode === "live" ? "https://api.alpaca.markets" : "https://paper-api.alpaca.markets");

    const url = `${baseUrl}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        "APCA-API-KEY-ID": creds.key,
        "APCA-API-SECRET-KEY": creds.secret,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      throw new AlpacaError(
        `Alpaca API hatası: ${res.status} ${res.statusText}`,
        res.status,
        body
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    getAccount(): Promise<AlpacaAccount> {
      return userAlpacaFetch<AlpacaAccount>("/v2/account");
    },

    getPositions(): Promise<AlpacaPosition[]> {
      return userAlpacaFetch<AlpacaPosition[]>("/v2/positions");
    },

    getOrders(params?: GetOrdersParams): Promise<AlpacaOrder[]> {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.after) searchParams.set("after", params.after);
      if (params?.until) searchParams.set("until", params.until);
      if (params?.direction) searchParams.set("direction", params.direction);
      if (params?.symbols) searchParams.set("symbols", params.symbols);
      const qs = searchParams.toString();
      return userAlpacaFetch<AlpacaOrder[]>(`/v2/orders${qs ? `?${qs}` : ""}`);
    },

    getOrder(orderId: string): Promise<AlpacaOrder> {
      return userAlpacaFetch<AlpacaOrder>(`/v2/orders/${orderId}`);
    },

    placeOrder(params: PlaceOrderParams): Promise<AlpacaOrder> {
      return userAlpacaFetch<AlpacaOrder>("/v2/orders", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },

    cancelOrder(orderId: string): Promise<void> {
      return userAlpacaFetch<void>(`/v2/orders/${orderId}`, {
        method: "DELETE",
      });
    },

    getBars(
      symbol: string,
      timeframe: string,
      start: string,
      end: string
    ): Promise<{ bars: Bar[] }> {
      const params = new URLSearchParams({
        timeframe,
        start,
        end,
        limit: "1000",
        adjustment: "split",
        feed: "iex",
      });
      return userAlpacaFetch<{ bars: Bar[] }>(
        `/v2/stocks/${symbol}/bars?${params.toString()}`,
        { useDataApi: true }
      );
    },

    getSnapshots(
      symbols: string[]
    ): Promise<Record<string, Snapshot>> {
      const params = new URLSearchParams({
        symbols: symbols.join(","),
        feed: "iex",
      });
      return userAlpacaFetch<Record<string, Snapshot>>(
        `/v2/stocks/snapshots?${params.toString()}`,
        { useDataApi: true }
      );
    },

    getAsset(symbol: string): Promise<AlpacaAsset> {
      return userAlpacaFetch<AlpacaAsset>(`/v2/assets/${symbol}`);
    },

    getAssets(status?: string, assetClass?: string): Promise<AlpacaAsset[]> {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (assetClass) params.append("asset_class", assetClass);
      const qs = params.toString();
      return userAlpacaFetch<AlpacaAsset[]>(`/v2/assets${qs ? `?${qs}` : ""}`);
    },

    getPortfolioHistory(
      period: string,
      timeframe: string
    ): Promise<PortfolioHistory> {
      const params = new URLSearchParams({ period, timeframe });
      return userAlpacaFetch<PortfolioHistory>(
        `/v2/account/portfolio/history?${params.toString()}`
      );
    },
  };
}

interface SafeOrderQuery {
  findMany(args: {
    where: {
      userId?: string;
      status?: OrderStatus;
      alpacaId?: { not: null } | string | null;
    };
  }): Promise<Array<{
    id: string;
    alpacaId: string | null;
    status: OrderStatus;
    filledAt: Date | null;
    createdAt: Date;
  }>>;
  update(args: {
    where: { id: string };
    data: {
      status?: OrderStatus;
      filledAt?: Date | null;
    };
  }): Promise<any>;
}

export async function syncPendingOrders(userId: string) {
  try {
    const orderClient = prisma.order as unknown as SafeOrderQuery;
    const pendingOrders = await orderClient.findMany({
      where: {
        userId,
        status: "PENDING",
        alpacaId: { not: null },
      },
    });

    if (pendingOrders.length === 0) {
      return;
    }

    const alpaca = getAlpacaClient(userId);

    // Sync each pending order
    await Promise.allSettled(
      pendingOrders.map(async (order) => {
        const alpacaId = order.alpacaId;
        if (!alpacaId) return;
        try {
          const alpacaOrder = await alpaca.getOrder(alpacaId);
          let newStatus: OrderStatus = "PENDING";
          let filledAt: Date | null = null;

          if (alpacaOrder.status === "filled") {
            newStatus = "FILLED";
            const filledAtStr = alpacaOrder.filled_at;
            filledAt = filledAtStr ? new Date(filledAtStr) : new Date();
          } else if (
            alpacaOrder.status === "canceled" ||
            alpacaOrder.status === "expired" ||
            alpacaOrder.status === "done_for_day"
          ) {
            newStatus = "CANCELLED";
          } else if (alpacaOrder.status === "rejected") {
            newStatus = "REJECTED";
          }

          if (newStatus !== "PENDING") {
            await orderClient.update({
              where: { id: order.id },
              data: {
                status: newStatus,
                filledAt,
              },
            });
            console.log(`[Order Sync] Updated order ${order.id} (Alpaca: ${alpacaId}) status to ${newStatus}`);
          }
        } catch (err) {
          console.error(`Error syncing order ${order.id}:`, err);
        }
      })
    );
  } catch (error) {
    console.error("Error in syncPendingOrders:", error);
  }
}
